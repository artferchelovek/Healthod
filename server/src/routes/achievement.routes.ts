import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getAchievements,
  getMyAchievements,
  seedAchievements,
} from "../controllers/achievement.controller";

const router = Router();

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Get all achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: List of achievements
 */
router.get("/", getAchievements);

/**
 * @swagger
 * /api/achievements/me:
 *   get:
 *     summary: Get my unlocked achievements
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user achievements
 */
router.get("/me", authMiddleware, getMyAchievements);

/**
 * @swagger
 * /api/achievements/seed:
 *   post:
 *     summary: Seed predefined achievements
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: Achievements seeded
 */
router.post("/seed", seedAchievements);

export default router;
