import { io, Socket } from "socket.io-client";

import type { ChatMessage } from "./chat";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket) return socket;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = API_URL.startsWith("/")
    ? window.location.origin
    : new URL(API_URL).origin;

  const token = localStorage.getItem("token");

  socket = io(baseUrl, {
    auth: { token },
    transports: ["polling", "websocket"],
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinChat(chatId: string) {
  socket?.emit("chat:join", chatId);
}

export function leaveChat(chatId: string) {
  socket?.emit("chat:leave", chatId);
}

export function sendMessageViaSocket(chatId: string, content: string, ack?: (res: unknown) => void) {
  socket?.emit("message:send", { chatId, content }, ack);
}

export function onNewMessage(cb: (msg: ChatMessage) => void) {
  socket?.on("message:new", cb);
  return () => { socket?.off("message:new", cb); };
}
