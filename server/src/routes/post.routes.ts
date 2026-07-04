import { Router } from "express";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  getFeed,
} from "../controllers/post.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createComment,
  getCommentsByPost,
} from "../controllers/comment.controller";
import { likePost, unlikePost } from "../controllers/like.controller";

const router = Router();

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts (optional ?communityId= filter)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: communityId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get("/", authMiddleware, getPosts);

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get personalized feed (posts from followed users + communities)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feed posts
 */
router.get("/feed", authMiddleware, getFeed);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by id
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PostCard found
 *       404:
 *         description: PostCard not found
 */
router.get("/:id", authMiddleware, getPostById);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum:
 *                   - TEXT
 *                   - WORKOUT
 *                   - RECIPE
 *                   - POLL
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               communityId:
 *                 type: string
 *               communityId:
 *                 type: string
 *     responses:
 *       201:
 *         description: PostCard created
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post
 *     tags: [Posts]
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
 *         description: PostCard deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: PostCard not found
 */
router.delete("/:id", authMiddleware, deletePost);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   get:
 *     summary: Get comments of a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get("/:id/comments", authMiddleware, getCommentsByPost);

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   post:
 *     summary: Create comment for post
 *     tags: [Comments]
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
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: PostCard not found
 */
router.post("/:id/comments", authMiddleware, createComment);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   post:
 *     summary: Like post
 *     tags: [Likes]
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
 *         description: PostCard liked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: PostCard not found
 */
router.post("/:id/like", authMiddleware, likePost);

/**
 * @swagger
 * /api/posts/{id}/like:
 *   delete:
 *     summary: Unlike post
 *     tags: [Likes]
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
 *         description: PostCard unliked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Like not found
 */
router.delete("/:id/like", authMiddleware, unlikePost);

export default router;
