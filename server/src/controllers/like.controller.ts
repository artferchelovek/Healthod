import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const likePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const postId = req.params.id as string;
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        error: "PostCard not found",
      });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      return res.status(400).json({
        error: "Already liked",
      });
    }

    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          increment: 1,
        },
      },
      select: {
        likesCount: true,
      },
    });

    return res.json({
      message: "PostCard liked",
      likesCount: updatedPost.likesCount,
      isLiked: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const unlikePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const postId = req.params.id as string;
    const userId = req.user.userId;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingLike) {
      return res.status(404).json({
        error: "Like not found",
      });
    }

    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
      select: {
        likesCount: true,
      },
    });

    return res.json({
      message: "PostCard unliked",
      likesCount: updatedPost.likesCount,
      isLiked: false,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
