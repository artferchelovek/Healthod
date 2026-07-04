import { api } from "./api";

export interface Community {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  ownerId: string;
  createdAt: string;
  _count: { members: number; posts: number };
  owner: { id: string; username: string; avatarUrl: string | null };
}

export interface CommunityDetail extends Community {
  isMember: boolean;
  isOwner: boolean;
}

export interface CommunityMember {
  id: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  isOwner: boolean;
}

export async function getCommunities(): Promise<Community[]> {
  const res = await api.get("/communities");
  return res.data;
}

export async function getMyCommunities(): Promise<Community[]> {
  const res = await api.get("/communities/my");
  return res.data;
}

export async function getCommunityById(id: string): Promise<CommunityDetail> {
  const res = await api.get(`/communities/${id}`);
  return res.data;
}

export async function createCommunity(data: { name: string; description?: string; avatarUrl?: string }): Promise<Community> {
  const res = await api.post("/communities", data);
  return res.data;
}

export async function joinCommunity(id: string): Promise<void> {
  await api.post(`/communities/${id}/join`);
}

export async function leaveCommunity(id: string): Promise<void> {
  await api.delete(`/communities/${id}/leave`);
}

export async function getCommunityMembers(id: string): Promise<CommunityMember[]> {
  const res = await api.get(`/communities/${id}/members`);
  return res.data;
}
