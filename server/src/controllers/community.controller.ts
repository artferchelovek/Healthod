import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkAndUnlockAchievements } from "./achievement.controller";

export const createCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, description, avatarUrl } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description || null,
        avatarUrl: avatarUrl || null,
        ownerId: req.user.userId,
      },
    });

    await prisma.communityMember.create({
      data: {
        userId: req.user.userId,
        communityId: community.id,
      },
    });

    checkAndUnlockAchievements(req.user.userId);

    return res.status(201).json(community);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCommunities = async (_req: Request, res: Response) => {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        owner: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    return res.json(communities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyCommunities = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const memberships = await prisma.communityMember.findMany({
      where: { userId: req.user.userId },
      include: {
        community: {
          include: {
            _count: {
              select: { members: true, posts: true },
            },
            owner: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const communities = memberships.map((m: typeof memberships[0]) => m.community);
    return res.json(communities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCommunityById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id as string;

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        owner: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: req.user.userId,
          communityId: id,
        },
      },
    });

    return res.json({
      ...community,
      isMember: !!membership,
      isOwner: community.ownerId === req.user.userId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id as string;
    const { name, description, avatarUrl } = req.body;

    const community = await prisma.community.findUnique({ where: { id } });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Only the owner can update the community" });
    }

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return res.status(400).json({ error: "Name cannot be empty" });
    }

    const updated = await prisma.community.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id as string;

    const community = await prisma.community.findUnique({ where: { id } });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Only the owner can delete the community" });
    }

    await prisma.community.delete({ where: { id } });

    return res.json({ message: "Community deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const joinCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const communityId = req.params.id as string;

    const community = await prisma.community.findUnique({ where: { id: communityId } });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const existing = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: req.user.userId,
          communityId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Already a member" });
    }

    await prisma.communityMember.create({
      data: {
        userId: req.user.userId,
        communityId,
      },
    });

    return res.json({ message: "Joined community" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveCommunity = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const communityId = req.params.id as string;

    const community = await prisma.community.findUnique({ where: { id: communityId } });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (community.ownerId === req.user.userId) {
      return res.status(403).json({ error: "Owner cannot leave the community. Transfer ownership or delete it." });
    }

    const existing = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: req.user.userId,
          communityId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Not a member" });
    }

    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId: req.user.userId,
          communityId,
        },
      },
    });

    return res.json({ message: "Left community" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCommunityMembers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const communityId = req.params.id as string;

    const community = await prisma.community.findUnique({ where: { id: communityId } });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const members = await prisma.communityMember.findMany({
      where: { communityId },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    const formatted = members.map((m: typeof members[0]) => ({
      ...m.user,
      joinedAt: m.joinedAt,
      isOwner: m.userId === community.ownerId,
    }));

    return res.json(formatted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCommunityPosts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const communityId = req.params.id as string;
    const userId = req.user.userId;

    const community = await prisma.community.findUnique({ where: { id: communityId } });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const posts = await prisma.post.findMany({
      where: { communityId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        community: {
          select: { id: true, name: true, avatarUrl: true },
        },
        likes: {
          where: { userId },
          select: { userId: true },
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
    return res.status(500).json({ error: "Internal server error" });
  }
};
