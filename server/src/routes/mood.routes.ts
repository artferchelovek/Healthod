import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createMoodLog,
  getMyMoodLogs,
  getMoodLogById,
  deleteMoodLog,
} from "../controllers/mood.controller";

const router = Router();

/**
 * @swagger
 * /api/mood:
 *   post:
 *     summary: Log mood
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mood
 *             properties:
 *               mood:
 *                 type: string
 *                 enum: [HAPPY, SAD, STRESSED, TIRED, CALM, MOTIVATED]
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mood logged
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createMoodLog);

/**
 * @swagger
 * /api/mood:
 *   get:
 *     summary: Get my mood logs
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month]
 *         description: Filter by period
 *     responses:
 *       200:
 *         description: List of mood logs
 */
router.get("/", authMiddleware, getMyMoodLogs);

/**
 * @swagger
 * /api/mood/{id}:
 *   get:
 *     summary: Get mood log by id
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood log found
 *       404:
 *         description: Mood log not found
 */
router.get("/:id", authMiddleware, getMoodLogById);

/**
 * @swagger
 * /api/mood/{id}:
 *   delete:
 *     summary: Delete mood log
 *     tags: [Mood]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mood log deleted
 *       404:
 *         description: Mood log not found
 */
router.delete("/:id", authMiddleware, deleteMoodLog);

export default router;
