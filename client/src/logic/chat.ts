import { api } from "./api";

export interface ChatUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
}

export interface ChatParticipant {
  userId: string;
  chatId: string;
  joinedAt: string;
  user: ChatUser;
}

export interface Chat {
  id: string;
  type: string;
  name: string | null;
  createdAt: string;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  total: number;
  hasMore: boolean;
}

export async function getMyChats(): Promise<Chat[]> {
  const res = await api.get("/chats");
  return res.data;
}

export async function createChat(participantId: string): Promise<Chat> {
  const res = await api.post("/chats", { participantId });
  return res.data;
}

export async function getChatById(id: string): Promise<Chat> {
  const res = await api.get(`/chats/${id}`);
  return res.data;
}

export async function getChatMessages(id: string, offset = 0, limit = 50): Promise<MessagesResponse> {
  const res = await api.get(`/chats/${id}/messages`, { params: { offset, limit } });
  return res.data;
}

export async function sendMessage(id: string, content: string): Promise<ChatMessage> {
  const res = await api.post(`/chats/${id}/messages`, { content });
  return res.data;
}

export async function deleteMessage(chatId: string, messageId: string): Promise<void> {
  await api.delete(`/chats/${chatId}/messages/${messageId}`);
}
