import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createChat,
  getMyChats,
  getChatById,
  getChatMessages,
  sendMessage,
  deleteMessage,
} from "../controllers/chat.controller";

const router = Router();

/**
 * @swagger
 * /api/chats:
 *   get:
 *     tags: [Chats]
 *     summary: Get user's chats with last message
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of chats
 */
router.get("/", authMiddleware, getMyChats);

/**
 * @swagger
 * /api/chats:
 *   post:
 *     tags: [Chats]
 *     summary: Create or get existing private chat
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Chat created
 *       200:
 *         description: Existing chat returned
 */
router.post("/", authMiddleware, createChat);

/**
 * @swagger
 * /api/chats/{id}:
 *   get:
 *     tags: [Chats]
 *     summary: Get chat details
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat details
 */
router.get("/:id", authMiddleware, getChatById);

/**
 * @swagger
 * /api/chats/{id}/messages:
 *   get:
 *     tags: [Chats]
 *     summary: Get chat messages with pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages
 */
router.get("/:id/messages", authMiddleware, getChatMessages);

/**
 * @swagger
 * /api/chats/{id}/messages:
 *   post:
 *     tags: [Chats]
 *     summary: Send a message (REST fallback)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post("/:id/messages", authMiddleware, sendMessage);

/**
 * @swagger
 * /api/chats/{id}/messages/{messageId}:
 *   delete:
 *     tags: [Chats]
 *     summary: Delete own message
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete("/:id/messages/:messageId", authMiddleware, deleteMessage);

export default router;
