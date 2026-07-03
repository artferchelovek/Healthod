import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { content, title, type, imageUrl, communityId } = req.body;

    if (!content || !type) {
      return res.status(400).json({
        error: "Content and type are required",
      });
    }

    const post = await prisma.post.create({
      data: {
        content,
        title,
        type,
        imageUrl,
        communityId,
        authorId: req.user.userId,
      },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getPosts = async (_: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
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

    return res.json(posts);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    return res.json(post);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    if (post.authorId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await prisma.post.delete({
      where: { id },
    });

    return res.json({
      message: "Post deleted",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
