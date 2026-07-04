import { Router } from "express";
import {
  createCommunity,
  getCommunities,
  getMyCommunities,
  getCommunityById,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  getCommunityPosts,
} from "../controllers/community.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/communities:
 *   get:
 *     summary: Get all communities
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of communities with member and post counts
 */
router.get("/", authMiddleware, getCommunities);

/**
 * @swagger
 * /api/communities/my:
 *   get:
 *     summary: Get communities the current user is a member of
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's communities
 */
router.get("/my", authMiddleware, getMyCommunities);

/**
 * @swagger
 * /api/communities:
 *   post:
 *     summary: Create a community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Community created
 *       400:
 *         description: Name is required
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createCommunity);

/**
 * @swagger
 * /api/communities/{id}:
 *   get:
 *     summary: Get community by id
 *     tags: [Communities]
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
 *         description: Community with member status
 *       404:
 *         description: Community not found
 */
router.get("/:id", authMiddleware, getCommunityById);

/**
 * @swagger
 * /api/communities/{id}:
 *   patch:
 *     summary: Update community (owner only)
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Community updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Community not found
 */
router.patch("/:id", authMiddleware, updateCommunity);

/**
 * @swagger
 * /api/communities/{id}:
 *   delete:
 *     summary: Delete community (owner only)
 *     tags: [Communities]
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
 *         description: Community deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Community not found
 */
router.delete("/:id", authMiddleware, deleteCommunity);

/**
 * @swagger
 * /api/communities/{id}/join:
 *   post:
 *     summary: Join a community
 *     tags: [Communities]
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
 *         description: Joined community
 *       409:
 *         description: Already a member
 *       404:
 *         description: Community not found
 */
router.post("/:id/join", authMiddleware, joinCommunity);

/**
 * @swagger
 * /api/communities/{id}/leave:
 *   delete:
 *     summary: Leave a community
 *     tags: [Communities]
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
 *         description: Left community
 *       403:
 *         description: Owner cannot leave
 *       404:
 *         description: Not a member or community not found
 */
router.delete("/:id/leave", authMiddleware, leaveCommunity);

/**
 * @swagger
 * /api/communities/{id}/members:
 *   get:
 *     summary: Get community members
 *     tags: [Communities]
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
 *         description: List of members
 *       404:
 *         description: Community not found
 */
router.get("/:id/members", authMiddleware, getCommunityMembers);

/**
 * @swagger
 * /api/communities/{id}/posts:
 *   get:
 *     summary: Get posts in a community
 *     tags: [Communities]
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
 *         description: List of community posts
 *       404:
 *         description: Community not found
 */
router.get("/:id/posts", authMiddleware, getCommunityPosts);

export default router;
