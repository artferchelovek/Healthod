import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";
import { createNotification } from "./lib/notification";

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId;

    socket.join(`user:${userId}`);

    socket.on("chat:join", (chatId: string) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId: string) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("message:send", async (data: { chatId: string; content: string }, ack) => {
      try {
        const message = await prisma.message.create({
          data: {
            chatId: data.chatId,
            senderId: userId,
            content: data.content,
          },
          include: {
            sender: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        });

        io.to(`chat:${data.chatId}`).emit("message:new", message);
        const participants = await prisma.chatParticipant.findMany({
          where: { chatId: data.chatId },
          select: { userId: true },
        });
        participants.forEach((p) => {
          io.to(`user:${p.userId}`).emit("message:new", message);
          if (p.userId !== userId) {
            createNotification({
              userId: p.userId,
              type: "CHAT_MESSAGE",
              senderId: userId,
              chatId: data.chatId,
            });
          }
        });

        if (ack) ack({ success: true, message });
      } catch (error) {
        console.error("[socket] message:send error:", error);
        if (ack) ack({ success: false, error: "Failed to send message" });
      }
    });

    socket.on("typing:start", (chatId: string) => {
      socket.to(`chat:${chatId}`).emit("typing:start", { chatId, userId });
    });

    socket.on("typing:stop", (chatId: string) => {
      socket.to(`chat:${chatId}`).emit("typing:stop", { chatId, userId });
    });

    socket.on("disconnect", () => {
      // cleanup if needed
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
