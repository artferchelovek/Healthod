export interface PostWithAuthor {
  id: string;
  title: string | null;
  content: string;
  images: string[];
  authorId: string;
  communityId: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string | Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  isLiked: boolean;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string | Date;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}
