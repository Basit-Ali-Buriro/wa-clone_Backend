import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { generateAutoReply } from "../controllers/aiControllers.js";

export default function registerMessageHandlers(io, socket, onlineUsers) {
  const getUserSockets = (userId) => {
    return onlineUsers.get(userId) || new Set();
  };

  const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
  };

  const checkParticipation = async (conversationId, userId) => {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      throw new Error("You are not a participant of this conversation");
    }
    
    return conversation;
  };
socket.on('send-message', async (data) => {
  try {
    console.log('📨 Received message:', data);
    
    const conversationId = data.conversationId;
    const text = data.text;
    const senderId = data.senderId || socket.userId;
    const fullMessage = data.message;
    
    if (!conversationId || !text) {
      console.error('❌ Invalid message data');
      return socket.emit('message-error', { error: 'Invalid message data' });
    }
    
    console.log('✅ Broadcasting message to conversation:', conversationId);
    
    // ✅ FIX: Broadcast to conversation room EXCEPT the sender
    // Use socket.to() instead of io.to() to exclude sender
    socket.to(conversationId).emit('new-message', {
      conversationId: conversationId,
      message: fullMessage
    });
    
    // DO NOT emit back to sender - they already added it optimistically
    
    console.log('📢 Message sent to other participants (excluding sender)');
    
  } catch (error) {
    console.error('❌ Socket send-message error:', error);
    socket.emit('message-error', { error: error.message });
  }
});

  socket.on("message-edited", async (data) => {
    try {
      const { messageId, newText } = data;
      
      if (!isValidObjectId(messageId)) {
        throw new Error("Invalid message ID");
      }

      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      await checkParticipation(message.conversation, socket.userId);

      if (message.sender.toString() !== socket.userId) {
        throw new Error("Not authorized to edit this message");
      }

      message.text = newText;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      const populatedMessage = await message.populate("sender", "name email avatarUrl");

      const conversation = await Conversation.findById(message.conversation);
      
      conversation.participants.forEach((participantId) => {
        const participantSockets = getUserSockets(participantId.toString());
        participantSockets.forEach((socketId) => {
          io.to(socketId).emit("message-updated", {
            message: populatedMessage,
            conversationId: message.conversation
          });
        });
      });
    } catch (error) {
      console.error("❌ Socket message-edited error:", error);
      socket.emit("message-error", { error: error.message });
    }
  });

  socket.on("message-deleted", async (data) => {
    try {
      const { messageId, deleteType } = data;
      
      if (!isValidObjectId(messageId)) {
        throw new Error("Invalid message ID");
      }

      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error("Message not found");
      }

      await checkParticipation(message.conversation, socket.userId);

      const conversation = await Conversation.findById(message.conversation);

      if (deleteType === "everyone") {
        if (message.sender.toString() !== socket.userId) {
          throw new Error("Only sender can delete for everyone");
        }

        await Message.findByIdAndDelete(messageId);
        
        conversation.participants.forEach((participantId) => {
          const participantSockets = getUserSockets(participantId.toString());
          participantSockets.forEach((socketId) => {
            io.to(socketId).emit("message-removed", {
              messageId,
              conversationId: message.conversation
            });
          });
        });
      }
    } catch (error) {
      console.error("❌ Socket message-deleted error:", error);
      socket.emit("message-error", { error: error.message });
    }
  });

  socket.on("message-reaction", async (data) => {
    try {
      const { messageId, emoji } = data;
      const userId = socket.userId;

      if (!isValidObjectId(messageId)) {
        console.error("Invalid messageId received:", messageId);
        throw new Error("Invalid message ID format");
      }

      const message = await Message.findById(messageId);
      
      if (!message) {
        throw new Error("Message not found");
      }

      await checkParticipation(message.conversation, userId);
      
      const existingReaction = message.reactions.find(
        r => r.user.toString() === userId && r.emoji === emoji
      );

      if (existingReaction) {
        message.reactions = message.reactions.filter(
          r => !(r.user.toString() === userId && r.emoji === emoji)
        );
      } else {
        message.reactions.push({ user: userId, emoji });
      }

      await message.save();
      
      const populatedMessage = await message.populate([
        { path: "sender", select: "name email avatarUrl" },
        { path: "reactions.user", select: "name email avatarUrl" }
      ]);

      const conversation = await Conversation.findById(message.conversation);
      
      conversation.participants.forEach((participantId) => {
        const participantSockets = getUserSockets(participantId.toString());
        participantSockets.forEach((socketId) => {
          io.to(socketId).emit("message-updated", {
            message: populatedMessage,
            conversationId: message.conversation
          });
        });
      });
    } catch (error) {
      console.error("❌ Socket message-reaction error:", error);
      socket.emit("message-error", { error: error.message });
    }
  });

  socket.on("typing-started", async (conversationId) => {
    try {
      if (!isValidObjectId(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      const conversation = await checkParticipation(conversationId, socket.userId);

      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== socket.userId) {
          const participantSockets = getUserSockets(participantId.toString());
          participantSockets.forEach((socketId) => {
            io.to(socketId).emit("user-typing", {
              userId: socket.userId,
              conversationId,
              userInfo: socket.userInfo
            });
          });
        }
      });
    } catch (error) {
      console.error("❌ Socket typing-started error:", error);
    }
  });

  socket.on("typing-stopped", async (conversationId) => {
    try {
      if (!isValidObjectId(conversationId)) {
        throw new Error("Invalid conversation ID");
      }

      const conversation = await checkParticipation(conversationId, socket.userId);

      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== socket.userId) {
          const participantSockets = getUserSockets(participantId.toString());
          participantSockets.forEach((socketId) => {
            io.to(socketId).emit("user-stopped-typing", {
              userId: socket.userId,
              conversationId
            });
          });
        }
      });
    } catch (error) {
      console.error("❌ Socket typing-stopped error:", error);
    }
  });

  socket.on("join-conversation", async (conversationId) => {
    try {
      await checkParticipation(conversationId, socket.userId);
      socket.join(conversationId);
      console.log(`✅ User ${socket.userId} joined conversation ${conversationId}`);
    } catch (error) {
      console.error("❌ Socket join-conversation error:", error);
      socket.emit("message-error", { error: error.message });
    }
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`👋 User ${socket.userId} left conversation ${conversationId}`);
  });
}
