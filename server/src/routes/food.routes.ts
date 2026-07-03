import { Router } from "express";
import {
  createFood,
  deleteFood,
  getTodayFood,
  updateFood,
} from "../controllers/food.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/food/today:
 *   get:
 *     summary: Get today's food diary
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's food records
 *       401:
 *         description: Unauthorized
 */
router.get("/today", authMiddleware, getTodayFood);

/**
 * @swagger
 * /api/food:
 *   post:
 *     summary: Add food record
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mealType
 *               - foodName
 *               - protein
 *               - fats
 *               - carbs
 *               - calories
 *             properties:
 *               mealType:
 *                 type: string
 *                 enum:
 *                   - BREAKFAST
 *                   - LUNCH
 *                   - DINNER
 *                   - SNACK
 *               foodName:
 *                 type: string
 *               protein:
 *                 type: number
 *               fats:
 *                 type: number
 *               carbs:
 *                 type: number
 *               calories:
 *                 type: number
 *     responses:
 *       201:
 *         description: Food record created
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createFood);

/**
 * @swagger
 * /api/food/{id}:
 *   patch:
 *     summary: Update food record
 *     tags: [Food]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               mealType:
 *                 type: string
 *                 enum:
 *                   - BREAKFAST
 *                   - LUNCH
 *                   - DINNER
 *                   - SNACK
 *               foodName:
 *                 type: string
 *               protein:
 *                 type: number
 *               fats:
 *                 type: number
 *               carbs:
 *                 type: number
 *               calories:
 *                 type: number
 *     responses:
 *       200:
 *         description: Food updated
 *       400:
 *         description: No data to update
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Food not found
 */
router.patch("/:id", authMiddleware, updateFood);

/**
 * @swagger
 * /api/food/{id}:
 *   delete:
 *     summary: Delete food record
 *     tags: [Food]
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
 *         description: Food deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Food not found
 */
router.delete("/:id", authMiddleware, deleteFood);

export default router;
