import express from "express";
import {
  createConversation,
  getConversations,
  createGroupConversation,
  addParticipants,
  removeParticipants,
  changeGroupAvatar,
  renameGroup,
  changeGroupAdmin,
} from "../controllers/conversationControllers.js";
import  authMiddleware  from "../middleware/authMiddleware.js";

const router = express.Router();

// 1️⃣ Create 1-to-1 conversation
router.post("/", authMiddleware, createConversation);

// 2️⃣ Get all user conversations
router.get("/", authMiddleware, getConversations);

// 3️⃣ Create group conversation
router.post("/group", authMiddleware, createGroupConversation);

// 4️⃣ Add participants to a group
router.post("/group/:id/add", authMiddleware, addParticipants);

// 5️⃣ Remove participants from a group
router.post("/group/:id/remove", authMiddleware, removeParticipants);

// 6️⃣ Change group avatar
router.put("/group/:id/avatar", authMiddleware, changeGroupAvatar);

// 7️⃣ Rename group
router.put("/group/:id/rename", authMiddleware, renameGroup);

// 8️⃣ Change group admin
router.put("/group/:id/change-admin", authMiddleware, changeGroupAdmin);

export default router;
