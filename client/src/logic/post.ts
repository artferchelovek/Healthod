import { api } from "@/logic/api.ts";
import type { PostWithAuthor, CommentWithAuthor } from "@/types/post.ts";

// Поставить лайк посту
export const likePost = async (postId: string): Promise<void> => {
  await api.post(`/posts/${postId}/like`);
};

// Убрать лайк с поста
export const unlikePost = async (postId: string): Promise<void> => {
  await api.delete(`/posts/${postId}/like`);
};

// Получить один пост по ID
export const getPost = async (postId: string): Promise<PostWithAuthor> => {
  return await api.get(`/posts/${postId}`).then((res) => res.data);
};

// Получить комментарии к посту
export const getComments = async (postId: string): Promise<CommentWithAuthor[]> => {
  return await api.get(`/posts/${postId}/comments`).then((res) => res.data);
};

// Добавить комментарий
export const createComment = async (postId: string, content: string): Promise<CommentWithAuthor> => {
  return await api.post(`/posts/${postId}/comments`, { content }).then((res) => res.data);
};
