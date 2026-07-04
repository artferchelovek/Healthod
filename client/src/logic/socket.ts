import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const baseUrl = API_URL.replace("/api", "");

  const token = localStorage.getItem("token");

  socket = io(baseUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
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

export function sendMessageViaSocket(chatId: string, content: string, ack?: (res: any) => void) {
  socket?.emit("message:send", { chatId, content }, ack);
}

export function onNewMessage(cb: (msg: any) => void) {
  socket?.on("message:new", cb);
  return () => { socket?.off("message:new", cb); };
}
