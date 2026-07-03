import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller";
import { upload } from "../middleware/upload.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

console.log("[upload.routes] loaded");

const router = Router();
/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload image
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
 *       400:
 *         description: File is required
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware, upload.single("file"), uploadImage);

export default router;
