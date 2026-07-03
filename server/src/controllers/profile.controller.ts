import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkAndUnlockAchievements } from "./achievement.controller";

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        age: true,
        weight: true,
        height: true,
        goal: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      age: user.age,
      weight: user.weight,
      height: user.height,
      goal: user.goal,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
      achievements: user.achievements.map((ua: { achievement: { id: string; title: string; description: string; icon: string | null }; unlockedAt: Date }) => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { username, avatarUrl, age, weight, height, goal } = req.body ?? {};

    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: req.user.userId } },
      });
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { username, avatarUrl, age, weight, height, goal },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        age: true,
        weight: true,
        height: true,
        goal: true,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfileById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileId = req.params.id;

    const profile = await prisma.user.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        age: true,
        weight: true,
        height: true,
        goal: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: "desc" },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.userId,
          followingId: profileId,
        },
      },
    });

    return res.json({
      user: {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        followersCount: profile._count.followers,
        followingCount: profile._count.following,
        postsCount: profile._count.posts,
        isFollowing: !!isFollowing,
        achievements: profile.achievements.map((ua: { achievement: { id: string; title: string; description: string; icon: string | null }; unlockedAt: Date }) => ({
          id: ua.achievement.id,
          title: ua.achievement.title,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          unlockedAt: ua.unlockedAt,
        })),
      },
      posts: profile.posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const followUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const followingId = req.params.id;
    const followerId = req.user.userId;

    if (followingId === followerId) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already following" });
    }

    await prisma.follow.create({
      data: { followerId, followingId },
    });

    checkAndUnlockAchievements(followerId);

    const profile = await prisma.user.findUnique({
      where: { id: followingId },
      select: {
        _count: { select: { followers: true } },
      },
    });

    return res.json({
      message: "Followed successfully",
      followersCount: profile?._count.followers,
      isFollowing: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.user.userId,
          followingId: req.params.id,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Follow relation not found" });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: req.user.userId,
          followingId: req.params.id,
        },
      },
    });

    const profile = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        _count: { select: { followers: true } },
      },
    });

    return res.json({
      message: "Unfollowed successfully",
      followersCount: profile?._count.followers,
      isFollowing: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
