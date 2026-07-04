import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createHealthMetric,
  getMyHealthMetrics,
  getLatestHealthMetrics,
  getHealthMetricById,
  deleteHealthMetric,
} from "../controllers/health.controller";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   post:
 *     summary: Create health metric
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - source
 *             properties:
 *               steps:
 *                 type: integer
 *               heartRate:
 *                 type: integer
 *               caloriesBurned:
 *                 type: number
 *               sleepHours:
 *                 type: number
 *               source:
 *                 type: string
 *                 enum: [APPLE_HEALTH, SAMSUNG_HEALTH, MI_FITNESS, MANUAL]
 *               recordedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Health metric created
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createHealthMetric);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get my health metrics
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of health metrics
 */
router.get("/", authMiddleware, getMyHealthMetrics);

/**
 * @swagger
 * /api/health/latest:
 *   get:
 *     summary: Get latest values for all metric types
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest steps, heart rate, calories burned, sleep hours
 */
router.get("/latest", authMiddleware, getLatestHealthMetrics);

/**
 * @swagger
 * /api/health/{id}:
 *   get:
 *     summary: Get health metric by id
 *     tags: [Health]
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
 *         description: Health metric found
 *       404:
 *         description: Health metric not found
 */
router.get("/:id", authMiddleware, getHealthMetricById);

/**
 * @swagger
 * /api/health/{id}:
 *   delete:
 *     summary: Delete health metric
 *     tags: [Health]
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
 *         description: Health metric deleted
 *       404:
 *         description: Health metric not found
 */
router.delete("/:id", authMiddleware, deleteHealthMetric);

export default router;
