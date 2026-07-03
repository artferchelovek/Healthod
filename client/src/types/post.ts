import type { Prisma } from "@prisma-types";

export type PostWithAuthor = Prisma.PostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        avatarUrl: true;
      };
    };
  };
}> & {
  isLiked: boolean;
};

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        username: true;
        avatarUrl: true;
      };
    };
  };
}>;
