import { api } from "./api";
import { Socket } from "socket.io-client";

export type NotificationType = "LIKE" | "COMMENT" | "CHAT_MESSAGE";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  senderId: string;
  postId?: string | null;
  commentId?: string | null;
  chatId?: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export async function getMyNotifications(): Promise<Notification[]> {
  const res = await api.get("/notifications");
  return res.data;
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
  const res = await api.patch("/notifications/read");
  return res.data;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

export function onNewNotification(socket: Socket | null, cb: (notification: Notification) => void) {
  socket?.on("notification:new", cb);
  return () => {
    socket?.off("notification:new", cb);
  };
}

export async function subscribeToPush(subscription: PushSubscription) {
  const res = await api.post("/notifications/subscribe", subscription);
  return res.data;
}

export async function unsubscribeFromPush(endpoint: string) {
  const res = await api.post("/notifications/unsubscribe", { endpoint });
  return res.data;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function setupWebPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications are not supported in this browser.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission denied.");
    return;
  }

  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BIlYWaNSn1Xyx3s6EruZMv9qwdCyqfAHZWbfyKX621MnI_ckQ2veAKwxhRriEJaiFhq2XXdI3cva0Rq7bo0vytE";

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
    }

    await subscribeToPush(subscription);
    console.log("Registered for Web Push notifications successfully.");
  } catch (error) {
    console.error("Failed to set up Web Push:", error);
  }
}
