import { Router } from "express";
import {
  getMyProfile,
  updateProfile,
  getProfileById,
  followUser,
  unfollowUser,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/profile/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 */
router.get("/me", authMiddleware, getMyProfile);

/**
 * @swagger
 * /api/profile:
 *   patch:
 *     summary: Update profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               age:
 *                 type: integer
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               goal:
 *                 type: string
 *                 enum: [LOSE_WEIGHT, GAIN_MUSCLE, MAINTAIN]
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch("/", authMiddleware, updateProfile);

/**
 * @swagger
 * /api/profile/{id}:
 *   get:
 *     summary: Get user profile by id
 *     tags: [Profile]
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
 *         description: User profile with posts
 */
router.get("/:id", authMiddleware, getProfileById);

/**
 * @swagger
 * /api/profile/{id}/follow:
 *   post:
 *     summary: Follow user
 *     tags: [Profile]
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
 *         description: Followed
 */
router.post("/:id/follow", authMiddleware, followUser);

/**
 * @swagger
 * /api/profile/{id}/follow:
 *   delete:
 *     summary: Unfollow user
 *     tags: [Profile]
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
 *         description: Unfollowed
 */
router.delete("/:id/follow", authMiddleware, unfollowUser);

export default router;
