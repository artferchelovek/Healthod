import styles from "./PostCard.module.css";
import type { PostWithAuthor } from "@/types/post.ts";
import { formatRelativeTime } from "@/logic/utils.ts";
import { useState } from "react";
import { likePost, unlikePost, deletePost } from "@/logic/post.ts";
import { getUserIdFromToken } from "@/logic/utils.ts";
import HeartOutline from "@/assets/icons/heart_favourite.svg?react";
import HeartFilled from "@/assets/icons/heart_favourite_filled.svg?react";
import CommentIcon from "@/assets/icons/comment.svg?react";
import { useNavigate } from "react-router-dom";

function Top(props: { author: any; dateString: string | Date; rightContent?: React.ReactNode }) {
  return (
    <div className={styles.top}>
      {props.author.avatarUrl ? (
        <img src={props.author.avatarUrl} alt={"avatar"} />
      ) : (
        <div className={styles.logoMockup}></div>
      )}
      <div className={styles.userInfo}>
        <p className={styles.name}> {props.author.username} </p>
        <p className={styles.date}> {formatRelativeTime(new Date(props.dateString))} </p>
      </div>
      {props.rightContent}
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
  const [showMenu, setShowMenu] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount);
  const navigate = useNavigate();

  const isOwner = getUserIdFromToken() === post.authorId;

  const handleDelete = async () => {
    if (!confirm("Удалить публикацию?")) return;
    try {
      await deletePost(post.id);
      window.location.reload();
    } catch (err) {
      console.error("Ошибка удаления поста:", err);
    }
  };

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
      <Top
        author={post.author}
        dateString={post.createdAt}
        rightContent={
          isOwner && (
            <div className={styles.menuContainer}>
              <button className={styles.menuBtn} onClick={() => setShowMenu(!showMenu)} aria-label="Меню">
                <span className="msym" style={{ fontSize: 20, color: "var(--inf-soft)" }}>more_horiz</span>
              </button>
              {showMenu && (
                <div className={styles.menuDropdown}>
                  <button className={styles.menuItem} onClick={handleDelete}>
                    <span className="msym" style={{ fontSize: 16 }}>delete</span>
                    Удалить
                  </button>
                </div>
              )}
            </div>
          )
        }
      />

      <Content
        title={post.title}
        content={post.content}
        imageUrl={`${import.meta.env.VITE_API_URL}${post.imageUrl}`}
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
        >
          <CommentIcon fill="var(--inf-soft)" width={20} height={20} />
          <p>{post.commentsCount}</p>
        </div>
      </div>
    </div>
  );
}
