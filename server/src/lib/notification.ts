import { prisma } from "./prisma";
import { getIO } from "../socket";
import webpush from "web-push";

export type NotificationType = "LIKE" | "COMMENT" | "CHAT_MESSAGE";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  senderId: string;
  postId?: string;
  commentId?: string;
  chatId?: string;
}

// Set up VAPID details for Web Push
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@healthod.ru";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
}

function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case "LIKE":
      return "Новый лайк";
    case "COMMENT":
      return "Новый комментарий";
    case "CHAT_MESSAGE":
      return "Новое сообщение";
    default:
      return "Healthod";
  }
}

function getNotificationBody(type: NotificationType, username: string): string {
  switch (type) {
    case "LIKE":
      return `@${username} оценил(а) ваш пост`;
    case "COMMENT":
      return `@${username} прокомментировал(а) ваш пост`;
    case "CHAT_MESSAGE":
      return `@${username} отправил(а) вам сообщение`;
    default:
      return `Новое уведомление от @${username}`;
  }
}

function getNotificationUrl(type: NotificationType, notification: any): string {
  switch (type) {
    case "LIKE":
    case "COMMENT":
      return `/post/${notification.postId}`;
    case "CHAT_MESSAGE":
      return `/chat/${notification.chatId}`;
    default:
      return "/";
  }
}

export async function createNotification(params: CreateNotificationParams) {
  if (params.userId === params.senderId) {
    return null;
  }

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        senderId: params.senderId,
        postId: params.postId,
        commentId: params.commentId,
        chatId: params.chatId,
      },
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

    // 1. Emit via socket.io (In-app real-time)
    try {
      const io = getIO();
      io.to(`user:${params.userId}`).emit("notification:new", notification);
    } catch (err) {
      // Socket.io not initialized
    }

    // 2. Send via Web Push (background service worker push)
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: params.userId },
      });

      if (subscriptions.length > 0) {
        const payload = JSON.stringify({
          title: getNotificationTitle(params.type),
          body: getNotificationBody(params.type, notification.sender.username),
          data: {
            url: getNotificationUrl(params.type, notification),
          },
        });

        subscriptions.forEach((sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          webpush.sendNotification(pushSubscription, payload).catch(async (err) => {
            // Clean up invalid/expired subscriptions (404 Not Found, 410 Gone)
            if (err.statusCode === 404 || err.statusCode === 410) {
              await prisma.pushSubscription.delete({
                where: { id: sub.id },
              }).catch(() => {});
            } else {
              console.error("Web Push sending error:", err);
            }
          });
        });
      }
    } catch (pushErr) {
      console.error("Failed to send Web Push:", pushErr);
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
