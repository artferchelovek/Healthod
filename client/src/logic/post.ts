import { api } from "@/logic/api.ts";

// Поставить лайк посту
export const likePost = async (postId: string): Promise<void> => {
  await api.post(`/posts/${postId}/like`);
};

// Убрать лайк с поста
export const unlikePost = async (postId: string): Promise<void> => {
  await api.delete(`/posts/${postId}/like`);
};
