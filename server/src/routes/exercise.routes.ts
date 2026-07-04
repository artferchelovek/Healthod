import { Router } from "express";
import {
  updateExercise,
  deleteExercise,
} from "../controllers/exercise.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/exercises/{id}:
 *   patch:
 *     summary: Update exercise
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
 *       200:
 *         description: Exercise updated
 *       404:
 *         description: Exercise not found
 */
router.patch("/:id", authMiddleware, updateExercise);

/**
 * @swagger
 * /api/exercises/{id}:
 *   delete:
 *     summary: Delete exercise
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
 *       200:
 *         description: Exercise deleted
 *       404:
 *         description: Exercise not found
 */
router.delete("/:id", authMiddleware, deleteExercise);

export default router;
