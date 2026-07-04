import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json(notifications);
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const notificationId = req.params.id as string;
    const userId = req.user.userId;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.json(updatedNotification);
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const subscribePush = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: "Subscription endpoint and keys (p256dh, auth) are required" });
    }

    const userId = req.user.userId;

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return res.status(201).json({ success: true, subscription });
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const unsubscribePush = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: req.user.userId },
    });

    return res.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
