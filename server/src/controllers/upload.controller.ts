import { Request, Response } from "express";

export const uploadImages = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: "At least one file is required" });
    }

    const urls = req.files.map((file) => `/uploads/${file.filename}`);

    return res.status(201).json({ images: urls });
  } catch (error) {
    console.error("[uploadImages] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    return res.status(201).json({ imageUrl });
  } catch (error) {
    console.error("[uploadImage] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
