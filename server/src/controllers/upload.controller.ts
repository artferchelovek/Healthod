import { Request, Response } from "express";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    console.log("[uploadImage] step 1 - entered");

    if (!req.file) {
      console.log("[uploadImage] no file");

      return res.status(400).json({
        error: "File is required",
      });
    }

    console.log("[uploadImage] file:", req.file);


    const imageUrl = `/uploads/${req.file.filename}`;

    console.log("[uploadImage] generated url:", imageUrl);

    return res.status(201).json({
      imageUrl,
    });
  } catch (error) {
    console.error("[uploadImage] error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
