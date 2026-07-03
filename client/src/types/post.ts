import type { Prisma } from "@prisma-types";

// Тип поста с включенным автором, выведенный напрямую из схемы бэкенда
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
}>;
