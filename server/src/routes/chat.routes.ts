import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createChat,
  createGroupChat,
  getMyChats,
  getChatById,
  getChatMessages,
  sendMessage,
  deleteMessage,
  searchUsers,
} from "../controllers/chat.controller";

const router = Router();

router.get("/", authMiddleware, getMyChats);

router.post("/", authMiddleware, createChat);

router.post("/group", authMiddleware, createGroupChat);

router.get("/users/search", authMiddleware, searchUsers);

router.get("/:id", authMiddleware, getChatById);

router.get("/:id/messages", authMiddleware, getChatMessages);

router.post("/:id/messages", authMiddleware, sendMessage);

router.delete("/:id/messages/:messageId", authMiddleware, deleteMessage);

export default router;
