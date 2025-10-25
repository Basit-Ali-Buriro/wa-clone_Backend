import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import Message from "../models/Message.js";

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

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, replyTo, forwarded, forwardedFrom } = req.body;
    const senderId = req.user._id;

    if (!conversationId || (!text && !req.file)) {
      return res.status(400).json({ msg: "Message must include conversation ID and either text or media" });
    }

    await checkParticipation(conversationId, senderId);

    let media = [];
    if (req.file && req.file.path) {
      const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
      media.push({
        url: req.file.path,
        type: fileType
      });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text: text || "",
      media,
      replyTo: replyTo || null,
      forwarded: forwarded || false,
      forwardedFrom: forwardedFrom || null,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    const populated = await message.populate([
      { path: "sender", select: "name email avatarUrl" },
      {
        path: "replyTo",
        select: "text media sender",
        populate: { path: "sender", select: "name avatarUrl" },
      },
      { path: "forwardedFrom", select: "name avatarUrl" },
    ]);

    return res.status(201).json(populated);
  } catch (error) {
    console.error("SendMessage Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await checkParticipation(conversationId, userId);

    const messages = await Message.find({ 
      conversation: conversationId,
      deletedBy: { $ne: userId }
    })
      .populate("sender", "name email avatarUrl")
      .populate({
        path: "replyTo",
        select: "text media isEdited",
        populate: { path: "sender", select: "name avatarUrl" },
      })
      .populate("forwardedFrom", "name avatarUrl")
      .populate("reactions.user", "name avatarUrl")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error("GetMessages Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { messageId, emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });

    await checkParticipation(message.conversation, userId);

    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === userId
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        message.reactions = message.reactions.filter(
          (r) => r.user.toString() !== userId
        );
      } else {
        existingReaction.emoji = emoji;
      }
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    const populatedMessage = await message.populate(
      "reactions.user",
      "name avatarUrl"
    );

    res.json(populatedMessage);
  } catch (error) {
    console.error("ReactToMessage Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    res.status(500).json({ msg: "Server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;
    const { newText } = req.body;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    await checkParticipation(message.conversation, userId);

    if (message.sender.toString() !== userId)
      return res
        .status(403)
        .json({ error: "Not authorized to edit this message" });

    message.text = newText;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    return res.json({ success: true, message });
  } catch (error) {
    console.error("Edit Message Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteMessageForMe = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id.toString();

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });

    await checkParticipation(message.conversation, userId);

    const alreadyDeleted = message.deletedBy
      .map((id) => id.toString())
      .includes(userId);

    if (!alreadyDeleted) {
      message.deletedBy.push(userId);
      await message.save();
    }

    return res.json({ success: true, messageId });
  } catch (error) {
    console.error("DeleteForMe Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteMessageForEveryone = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id.toString();

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ msg: "Message not found" });

    await checkParticipation(message.conversation, userId);

    if (userId !== message.sender.toString())
      return res.status(403).send("Unauthorized User");

    message.text = "";
    message.media = [];
    message.isDeletedForEveryone = true;
    message.deletedAt = new Date();

    await message.save();

    return res.json({ success: true, messageId });
  } catch (error) {
    console.error("DeleteForEveryone Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

export const replyToMessage = async (req, res) => {
  try {
    const { conversationId, text, replyTo } = req.body;
    const senderId = req.user._id;

    if (!conversationId || !text) {
      return res
        .status(400)
        .json({ msg: "Conversation ID and text are required" });
    }

    const conversation = await checkParticipation(conversationId, senderId);

    if (replyTo) {
      const originalMessage = await Message.findById(replyTo);
      if (!originalMessage) {
        return res.status(404).json({ msg: "Original message not found" });
      }
    }

    const newMessage = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
      replyTo: replyTo || null,
      forwarded: false,
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populatedMessage = await newMessage.populate([
      { path: "sender", select: "name avatarUrl" },
      {
        path: "replyTo",
        select: "text sender media",
        populate: { path: "sender", select: "name avatarUrl" },
      },
    ]);

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("ReplyToMessage Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

export const forwardMessage = async (req, res) => {
  const originalMessageId = req.params.id;
  const { targetConversationId } = req.body;
  const userId = req.user._id;

  try {
    if (!originalMessageId || !targetConversationId)
      return res.status(400).send("Required data missing");

    const conversation = await checkParticipation(targetConversationId, userId);

    const message = await Message.findById(originalMessageId);
    if (!message) return res.status(404).send("Message not found");

    await checkParticipation(message.conversation, userId);

    const newMessage = await Message.create({
      conversation: targetConversationId,
      sender: userId,
      text: message.text,
      media: message.media,
      forwarded: true,
      forwardedFrom: message.sender,
    });

    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populated = await newMessage.populate([
      { path: "sender", select: "name avatarUrl" },
      { path: "forwardedFrom", select: "name avatarUrl" },
    ]);

    return res.status(201).json(populated);
  } catch (error) {
    console.error("ForwardMessage Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { query } = req.query;
    const { conversationId } = req.params;

    if (!query || query.trim() === "") {
      return res.status(400).json({ msg: "Search query is required" });
    }

    const textFilter = { text: { $regex: query, $options: "i" } };

    let messages;

    if (conversationId) {
      await checkParticipation(conversationId, userId);
      
      messages = await Message.find({
        conversation: conversationId,
        ...textFilter,
        deletedBy: { $ne: userId },
      })
        .populate("sender", "name avatarUrl")
        .populate("replyTo", "text sender")
        .populate("forwardedFrom", "name avatarUrl")
        .sort({ createdAt: -1 });
    } else {
      const conversations = await Conversation.find({ participants: userId }).select("_id");
      const conversationIds = conversations.map((c) => c._id);

      messages = await Message.find({
        conversation: { $in: conversationIds },
        ...textFilter,
        deletedBy: { $ne: userId },
      })
        .populate("sender", "name avatarUrl")
        .populate("conversation", "participants")
        .sort({ createdAt: -1 });
    }

    if (!messages.length) {
      return res.status(404).json({ msg: "No messages found" });
    }

    return res.json(messages);
  } catch (error) {
    console.error("SearchMessages Error:", error);
    if (error.message === "You are not a participant of this conversation") {
      return res.status(403).json({ msg: error.message });
    }
    return res.status(500).json({ msg: "Server error" });
  }
};
