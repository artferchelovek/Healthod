import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getIO } from "../socket";
import { createNotification } from "../lib/notification";

export const createChat = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { participantId } = req.body;
    const userId = req.user.userId;

    if (!participantId) {
      return res.status(400).json({ error: "participantId is required" });
    }

    if (participantId === userId) {
      return res.status(400).json({ error: "Cannot chat with yourself" });
    }

    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });
    if (!participant) {
      return res.status(404).json({ error: "User not found" });
    }

    const myChats = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true },
    });

    const myChatIds = myChats.map((c) => c.chatId);

    if (myChatIds.length > 0) {
      const mutualChat = await prisma.chatParticipant.findFirst({
        where: {
          chatId: { in: myChatIds },
          userId: participantId,
        },
      });
      if (mutualChat) {
        const chat = await prisma.chat.findUnique({
          where: { id: mutualChat.chatId },
          include: {
            participants: {
              include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
              },
            },
          },
        });
        return res.json(chat);
      }
    }

    const chat = await prisma.chat.create({
      data: { type: "PRIVATE" },
    });

    await prisma.chatParticipant.createMany({
      data: [
        { userId, chatId: chat.id },
        { userId: participantId, chatId: chat.id },
      ],
    });

    const fullChat = await prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return res.status(201).json(fullChat);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyChats = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const chatParticipants = await prisma.chatParticipant.findMany({
      where: { userId: req.user.userId },
      include: {
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
              },
            },
            participants: {
              include: {
                user: { select: { id: true, username: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const chats = chatParticipants
      .map((cp) => cp.chat)
      .map((chat) => ({
        ...chat,
        lastMessage: chat.messages[0] || null,
        messages: undefined,
      }));

    return res.json(chats);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatById = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const chatId = req.params.id as string;

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: { userId: req.user.userId, chatId },
      },
    });

    if (!participant) {
      return res.status(403).json({ error: "Not a participant" });
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    return res.json(chat);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const chatId = req.params.id as string;

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: { userId: req.user.userId, chatId },
      },
    });

    if (!participant) {
      return res.status(403).json({ error: "Not a participant" });
    }

    const { offset, limit } = req.query;
    const take = Math.min(parseInt(limit as string) || 50, 100);
    const skip = parseInt(offset as string) || 0;

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const total = await prisma.message.count({ where: { chatId } });

    return res.json({
      messages: messages.reverse(),
      total,
      hasMore: skip + take < total,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const chatId = req.params.id as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: { userId: req.user.userId, chatId },
      },
    });

    if (!participant) {
      return res.status(403).json({ error: "Not a participant" });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.user.userId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    try {
      const io = getIO();
      io.to(`chat:${chatId}`).emit("message:new", message);
      const participants = await prisma.chatParticipant.findMany({
        where: { chatId },
        select: { userId: true },
      });
      participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("message:new", message);
        if (p.userId !== req.user!.userId) {
          createNotification({
            userId: p.userId,
            type: "CHAT_MESSAGE",
            senderId: req.user!.userId,
            chatId,
          });
        }
      });
    } catch (e) {
      // socket not initialized yet
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const messageId = req.params.messageId as string;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.senderId !== req.user.userId) {
      return res.status(403).json({ error: "Can only delete your own messages" });
    }

    await prisma.message.delete({ where: { id: messageId } });

    return res.json({ message: "Message deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
