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

const API_BASE = import.meta.env.VITE_API_URL || "";

function getFileType(url: string): "image" | "video" | "audio" | "document" {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi", "mpeg", "mpg"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "aac", "flac"].includes(ext)) return "audio";
  return "document";
}

function getFileIcon(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "picture_as_pdf";
  if (["doc", "docx"].includes(ext)) return "description";
  if (["xls", "xlsx", "csv"].includes(ext)) return "table_chart";
  if (["zip", "rar", "7z", "gz", "tar"].includes(ext)) return "folder_zip";
  if (["txt", "json"].includes(ext)) return "article";
  return "insert_drive_file";
}

function MediaItem({ url, alt }: { url: string; alt: string }) {
  const fullUrl = `${API_BASE}${url}`;
  const type = getFileType(url);

  if (type === "image") {
    return <img className={styles.mediaImage} src={fullUrl} alt={alt} loading="lazy" />;
  }
  if (type === "video") {
    return (
      <video className={styles.mediaVideo} src={fullUrl} controls preload="metadata">
        Ваш браузер не поддерживает видео.
      </video>
    );
  }
  if (type === "audio") {
    return (
      <div className={styles.mediaAudioWrapper}>
        <span className={`msym ${styles.mediaAudioIcon}`}>music_note</span>
        <audio className={styles.mediaAudio} src={fullUrl} controls preload="none">
          Ваш браузер не поддерживает аудио.
        </audio>
      </div>
    );
  }
  const name = url.split("/").pop() || url;
  return (
    <a className={styles.mediaDocLink} href={fullUrl} target="_blank" rel="noopener noreferrer" download>
      <span className={`msym ${styles.mediaDocIcon}`}>{getFileIcon(url)}</span>
      <span className={styles.mediaDocName}>{name}</span>
      <span className={`msym ${styles.mediaDocDownload}`}>download</span>
    </a>
  );
}

function Top(props: { author: any; dateString: string | Date; rightContent?: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className={styles.top}>
      <div className={styles.authorClickable} onClick={() => navigate(`/user/${props.author.id}`)}>
        {props.author.avatarUrl ? (
          <img src={props.author.avatarUrl} alt={"avatar"} />
        ) : (
          <div className={styles.logoMockup}></div>
        )}
        <div className={styles.userInfo}>
          <p className={styles.name}> {props.author.username} </p>
          <p className={styles.date}> {formatRelativeTime(new Date(props.dateString))} </p>
        </div>
      </div>
      {props.rightContent}
    </div>
  );
}

function Content(props: {
  title: string | null;
  content: string;
  images: string[];
}) {
  return (
    <div className={styles.content}>
      {props.title && <p className={styles.title}> {props.title} </p>}
      <p className={styles.description}> {props.content} </p>
      {props.images.length > 0 && (
        <div className={styles.mediaGrid}>
          {props.images.map((url, i) => (
            <MediaItem key={i} url={url} alt={`Медиа ${i + 1}`} />
          ))}
        </div>
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

  const handleShare = async () => {
    const url = `${window.location.origin}/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title || "Публикация", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована в буфер обмена");
    }
  };

  const handleLike = async () => {
    const willLike = !isLiked;

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
        images={post.images}
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

        <div className={styles.share} onClick={handleShare} title="Поделиться">
          <span className="msym" style={{ fontSize: 20, color: "var(--inf-soft)" }}>share</span>
        </div>
      </div>
    </div>
  );
}
