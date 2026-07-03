import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkAndUnlockAchievements } from "./achievement.controller";

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

    checkAndUnlockAchievements(req.user.userId);

    return res.status(201).json(post);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const userId = req.user.userId;

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
        likes: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post: typeof posts[0]) => {
      const isLiked = post.likes.length > 0;
      const { likes, ...postData } = post;
      return { ...postData, isLiked, isMine: post.authorId === userId };
    });

    return res.json(formattedPosts);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;
    const userId = req.user.userId;

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
        likes: {
          where: {
            userId,
          },
          select: {
            userId: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    const { likes, ...postData } = post;

    return res.json({
      ...postData,
      isLiked: likes.length > 0,
      isMine: postData.authorId === userId,
    });
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
