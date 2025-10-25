import Message from "../models/Message.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

//Creating 1 to 1 Conversation
export const createConversation = async (req, res) => {
  const userId = req.user._id.toString();
  const { recipientId } = req.body;
  try {
    if (!recipientId)
      return res.status(400).json({ msg: "Recipient ID is required" });

    if (recipientId === userId)
      return res
        .status(400)
        .json({ msg: "Cannot start conversation with yourself" });
    const existingConversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, recipientId] },
    });
    if (existingConversation) {
      const populated = await existingConversation.populate(
        "participants",
        "name avatarUrl email"
      );
      return res.status(200).json(populated);
    }

    const newConversation = await Conversation.create({
      participants: [userId, recipientId],
      isGroup: false,
      lastMessage: null,
    });

    const populated = await newConversation.populate(
      "participants",
      "name avatarUrl email"
    );

    return res.status(201).json(populated);
  } catch (error) {
    console.error("CreateConversation Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

//Fetch All converstions of the user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Current logged-in user

    // 1️⃣ Find all conversations where the user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "name avatarUrl email")
      .populate({
        path: "lastMessage",
        select: "text media createdAt sender",
        populate: {
          path: "sender",
          select: "name avatarUrl",
        },
      })
      .sort({ updatedAt: -1 });

    // 2️⃣ If no conversations found
    if (!conversations.length) {
      return res.status(200).json({ msg: "No conversations found", data: [] });
    }

    // 3️⃣ Send back all conversations
    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("getConversations Error:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error while fetching conversations",
    });
  }
};

// ✅ Create a new group conversation
export const createGroupConversation = async (req, res) => {
  try {
    const { name, participants, groupAvatar } = req.body;
    const userId = req.user._id; // current user creating the group

    // 1️⃣ Validate input
    if (!name || !participants || participants.length < 2) {
      return res
        .status(400)
        .json({ msg: "Group name and at least 2 participants are required" });
    }

    // 2️⃣ Ensure all participant IDs are valid
    const allUsersExist = await User.find({ _id: { $in: participants } });
    if (allUsersExist.length !== participants.length) {
      return res.status(400).json({ msg: "Some participants not found" });
    }

    // 3️⃣ Create group conversation
    const group = await Conversation.create({
      isGroup: true,
      groupName: name,
      groupAvatar: groupAvatar || "",
      participants: [...participants, userId], // include creator automatically
      groupAdmins: [userId],
      createdBy: userId,
    });

    // 4️⃣ Populate group data for response
    const populatedGroup = await group.populate([
      { path: "participants", select: "name email avatarUrl" },
      { path: "groupAdmins", select: "name avatarUrl" },
    ]);

    // 5️⃣ Send response
    return res.status(201).json({
      msg: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("CreateGroup Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const addParticipants = async (req, res) => {
  const groupConversationId = req.params.id; // ✅ Get ID from URL
  const userId = req.user._id.toString(); // Logged-in user
  const { participants } = req.body; // Array of new participant IDs

  try {
    // 1️⃣ Fetch the group conversation
    const conversation = await Conversation.findById(groupConversationId);
    if (!conversation) {
      return res.status(404).send("Group does not exist");
    }

    // 2️⃣ Ensure it’s a group chat
    if (!conversation.isGroup) {
      return res.status(400).send("Cannot add participants to a 1-to-1 chat");
    }

    // 3️⃣ Check if logged-in user is admin
    const isAdmin = conversation.groupAdmins.some(adminId => adminId.toString() === userId);
    if (!isAdmin) {
      return res.status(403).send("Only admin can add participants");
    }

    // 4️⃣ Validate participants exist in DB
    const allUsersExist = await User.find({ _id: { $in: participants } });
    if (allUsersExist.length !== participants.length) {
      return res.status(400).json({ msg: "Some participants not found" });
    }

    // 5️⃣ Filter out users already in the group
    const existingParticipantIds = conversation.participants.map(p => p.toString());
    const newParticipants = participants.filter(
      (id) => !existingParticipantIds.includes(id)
    );

    // 6️⃣ Add new participants
    conversation.participants.push(...newParticipants);
    await conversation.save();

    // 7️⃣ Populate participants and return response
    const populatedConversation = await conversation.populate(
      "participants",
      "name email avatarUrl"
    );

    return res.status(200).json(populatedConversation);
  } catch (error) {
    console.error("AddParticipants Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

//Remove participants from a group
export const removeParticipants = async (req, res) => {
  const groupConversationId = req.params.id; // ✅ Get conversation ID from URL
  const userId = req.user._id.toString(); // Logged-in user ID
  const { participants } = req.body; // Array of participant IDs to remove

  try {
    // 1️⃣ Fetch the group conversation
    const conversation = await Conversation.findById(groupConversationId);
    if (!conversation) {
      return res.status(404).send("Group does not exist");
    }

    // 2️⃣ Ensure it’s a group chat
    if (!conversation.isGroup) {
      return res.status(400).send("Cannot remove participants from a 1-to-1 chat");
    }

    // 3️⃣ Check if logged-in user is admin
    const isAdmin = conversation.groupAdmins.some(adminId => adminId.toString() === userId);
    if (!isAdmin) {
      return res.status(403).send("Only admin can remove participants");
    }

    // 4️⃣ Validate participants exist in the database
    const allUsersExist = await User.find({ _id: { $in: participants } });
    if (allUsersExist.length !== participants.length) {
      return res.status(400).json({ msg: "Some participants not found" });
    }

    // 5️⃣ Remove participants from the group
    conversation.participants = conversation.participants.filter(
      (p) => !participants.includes(p.toString())
    );

    // 6️⃣ Save updated conversation
    await conversation.save();

    // 7️⃣ Populate participants info for response
    const populatedConversation = await conversation.populate(
      "participants",
      "name email avatarUrl"
    );

    // 8️⃣ Send response
    return res.status(200).json({
      msg: "Participants removed successfully",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("RemoveParticipants Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};
export const changeGroupAdmin = async (req, res) => {
  const groupConversationId = req.params.id; // Group ID from URL
  const { newAdminId } = req.body; // New admin ID from request body
  const userId = req.user._id.toString(); // Logged-in user

  try {
    // 1️⃣ Fetch the group conversation
    const conversation = await Conversation.findById(groupConversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // 2️⃣ Ensure it's a group chat
    if (!conversation.isGroup) {
      return res
        .status(400)
        .json({ msg: "Cannot change admin for a 1-to-1 chat" });
    }

    // 3️⃣ Verify current user is admin
    const isAdmin = conversation.groupAdmins.some(adminId => adminId.toString() === userId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ msg: "Only an admin can change the admin" });
    }

    // 4️⃣ Verify new admin is a participant
    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === newAdminId
    );
    if (!isParticipant) {
      return res
        .status(400)
        .json({ msg: "New admin must be a participant of the group" });
    }

    // 5️⃣ Update group admin (add to admins array if not already there)
    if (!conversation.groupAdmins.some(adminId => adminId.toString() === newAdminId)) {
      conversation.groupAdmins.push(newAdminId);
      await conversation.save();
    }

    // 6️⃣ Populate participants for response
    const populatedConversation = await conversation.populate(
      "participants",
      "name email avatarUrl"
    );

    // 7️⃣ Send response
    return res.status(200).json({
      success: true,
      msg: "Admin changed successfully",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("ChangeGroupAdmin Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const renameGroup = async (req, res) => {
  const groupConversationId = req.params.id; // Group ID from URL
  const { newName } = req.body; // New group name from request body
  const userId = req.user._id.toString(); // Logged-in user

  try {
    // 1️⃣ Fetch the group conversation
    const conversation = await Conversation.findById(groupConversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Group not found" });
    }

    // 2️⃣ Ensure it’s a group chat
    if (!conversation.isGroup) {
      return res
        .status(400)
        .json({ msg: "Cannot rename a 1-to-1 conversation" });
    }

    // 3️⃣ Verify current user is admin
    const isAdmin = conversation.groupAdmins.some(adminId => adminId.toString() === userId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ msg: "Only admin can rename the group" });
    }

    // 4️⃣ Update group name
    conversation.groupName = newName;
    await conversation.save();

    // 5️⃣ Populate participants for response
    const populatedConversation = await conversation.populate(
      "participants",
      "name email avatarUrl"
    );

    // 6️⃣ Send success response
    return res.status(200).json({
      success: true,
      msg: "Group renamed successfully",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("RenameGroup Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const changeGroupAvatar = async (req, res) => {
  const groupConversationId = req.params.id; // Group ID from URL
  const userId = req.user._id.toString(); // Logged-in user ID
  const { groupAvatar } = req.body; // New avatar URL

  try {
    // 1️⃣ Fetch the conversation
    const conversation = await Conversation.findById(groupConversationId);
    if (!conversation) {
      return res.status(404).json({ msg: "Group does not exist" });
    }

    // 2️⃣ Ensure it's a group
    if (!conversation.isGroup) {
      return res
        .status(400)
        .json({ msg: "Cannot change avatar for 1-to-1 conversation" });
    }

    // 3️⃣ Verify admin
    const isAdmin = conversation.groupAdmins.some(adminId => adminId.toString() === userId);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ msg: "Only admin can change the group avatar" });
    }

    // 4️⃣ Update avatar
    conversation.groupAvatar = groupAvatar;
    await conversation.save();

    // 5️⃣ Populate participants for response
    const populatedConversation = await conversation.populate(
      "participants",
      "name email avatarUrl"
    );

    // 6️⃣ Send response
    return res.status(200).json({
      success: true,
      msg: "Group avatar updated successfully",
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("ChangeGroupAvatar Error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};