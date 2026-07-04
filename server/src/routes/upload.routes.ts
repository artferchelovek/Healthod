import { Router } from "express";
import { uploadImages, uploadImage } from "../controllers/upload.controller";
import { upload, uploadMultiple } from "../middleware/upload.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload single image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded
 */
router.post("/", authMiddleware, upload.single("file"), uploadImage);

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple files (up to 10)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded
 */
router.post("/multiple", authMiddleware, uploadMultiple, uploadImages);

export default router;
