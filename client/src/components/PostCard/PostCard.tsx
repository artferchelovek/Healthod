import styles from "./PostCard.module.css";
import type { PostWithAuthor } from "@/types/post.ts";
import { formatRelativeTime } from "@/logic/utils.ts";
import { useState } from "react";
import { likePost, unlikePost } from "@/logic/post.ts";
import HeartOutline from "@/assets/icons/heart_favourite.svg?react";
import HeartFilled from "@/assets/icons/heart_favourite_filled.svg?react";
import CommentIcon from "@/assets/icons/comment.svg?react";
import { useNavigate } from "react-router-dom";

function Top(props: { author: any; dateString: string }) {
  return (
    <div className={styles.top}>
      {props.author.avatarUrl ? (
        <img src={props.author.avatarUrl} alt={"avatar"} />
      ) : (
        <div className={styles.logoMockup}></div>
      )}
      <div className={styles.userInfo}>
        <p className={styles.name}> {props.author.username} </p>
        <p className={styles.date}> {formatRelativeTime(props.dateString)} </p>
      </div>
    </div>
  );
}

function Content(props: {
  title: string | null;
  content: string;
  imageUrl: string | null;
}) {
  return (
    <div className={styles.content}>
      {props.title && <p className={styles.title}> {props.title} </p>}
      <p className={styles.description}> {props.content} </p>
      {props.imageUrl && (
        <img className={styles.image} src={props.imageUrl} alt="" />
      )}
    </div>
  );
}

export default function PostCard({ post }: { post: PostWithAuthor }) {
  const [isLiked, setIsLiked] = useState<boolean>(post.isLiked);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount);
  const navigate = useNavigate();

  const handleLike = async () => {
    const willLike = !isLiked;
    console.log(`${import.meta.env.VITE_API_URL}${post.imageUrl}`);

    setIsLiked(willLike);
    setLikesCount(willLike ? likesCount + 1 : likesCount - 1);

    try {
      if (willLike) {
        await likePost(post.id);
      } else {
        await unlikePost(post.id);
      }
    } catch (error) {
      console.error("Ошибка при переключении лайка:", error);
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  return (
    <div className={styles.postCard}>
      <Top author={post.author} dateString={post.createdAt} />

      <Content
        title={post.title}
        content={post.content}
        imageUrl={post.imageUrl ? `${import.meta.env.VITE_API_URL}${post.imageUrl}` : null}
      />

      <div className={styles.footer}>
        <div
          className={`${styles.like} ${isLiked ? styles.activeLike : ""}`}
          onClick={handleLike}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          {isLiked ? (
            <HeartFilled fill="var(--terracotta)" width={20} height={20} />
          ) : (
            <HeartOutline fill="var(--inf-soft)" width={20} height={20} />
          )}
          <p>{likesCount}</p>
        </div>

        <div
          className={styles.comment}
          onClick={() => {
            navigate(`/${post.id}`);
          }}
          style={{ cursor: "pointer" }}
        >
          <CommentIcon fill="var(--inf-soft)" width={20} height={20} />
          <p>{post.commentsCount}</p>
        </div>
      </div>
    </div>
  );
}
