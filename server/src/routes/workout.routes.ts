import { Router } from "express";
import {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  deleteWorkout,
} from "../controllers/workout.controller";
import { createExercise } from "../controllers/exercise.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/workouts:
 *   get:
 *     summary: Get all workouts
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workouts
 */
router.get("/", authMiddleware, getWorkouts);

/**
 * @swagger
 * /api/workouts/{id}:
 *   get:
 *     summary: Get workout by id
 *     tags: [Workouts]
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
 *         description: Workout found
 *       404:
 *         description: Workout not found
 */
router.get("/:id", authMiddleware, getWorkoutById);

/**
 * @swagger
 * /api/workouts:
 *   post:
 *     summary: Create workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Workout created
 */
router.post("/", authMiddleware, createWorkout);

/**
 * @swagger
 * /api/workouts/{id}:
 *   delete:
 *     summary: Delete workout
 *     tags: [Workouts]
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
 *         description: Workout deleted
 *       404:
 *         description: Workout not found
 */
router.delete("/:id", authMiddleware, deleteWorkout);

/**
 * @swagger
 * /api/workouts/{id}/exercises:
 *   post:
 *     summary: Add exercise to workout
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Exercise created
 *       404:
 *         description: Workout not found
 */
router.post("/:id/exercises", authMiddleware, createExercise);

export default router;
