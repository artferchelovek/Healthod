import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const postId = req.params.id as string;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: "Content is required",
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: req.user.userId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;

    const comments = await prisma.comment.findMany({
      where: {
        postId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json(comments);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({
        error: "Comment not found",
      });
    }

    if (comment.authorId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return res.json({
      message: "Comment deleted",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
