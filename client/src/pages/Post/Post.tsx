import styles from "./Post.module.css";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { PostWithAuthor, CommentWithAuthor } from "@/types/post.ts";
import { getPost, getComments, createComment } from "@/logic/post.ts";
import PostCard from "@/components/PostCard/PostCard.tsx";
import { formatRelativeTime } from "@/logic/utils.ts";

export default function Post() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostWithAuthor>();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояния для отправки комментария
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPostData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Запрашиваем пост и комментарии параллельно
      const [postData, commentsData] = await Promise.all([
        getPost(id),
        getComments(id),
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (err) {
      console.error("Ошибка загрузки данных поста:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPostData();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      
      const newComment = await createComment(id, commentText.trim());
      
      // Добавляем новый комментарий в начало списка и очищаем поле ввода
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      
      // Обновляем количество комментариев на самом посте локально
      if (post) {
        setPost({
          ...post,
          commentsCount: (post.commentsCount || 0) + 1,
        });
      }
    } catch (err: any) {
      console.error("Ошибка при отправке комментария:", err);
      setError(err.response?.data?.error || "Не удалось отправить комментарий");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка публикации...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>Публикация не найдена</p>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Кнопка назад */}
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.backIcon}
        >
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Назад
      </button>

      {/* Карточка поста */}
      <div className={styles.postWrapper}>
        <PostCard post={post} />
      </div>

      {/* Секция комментариев */}
      <div className={styles.commentsSection}>
        <h3 className={styles.commentsTitle}>
          Комментарии <span className={styles.commentsCount}>{comments.length}</span>
        </h3>

        {/* Форма ввода комментария */}
        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <div className={styles.formInputWrapper}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишите комментарий..."
              className={styles.commentInput}
              disabled={submitting}
              required
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !commentText.trim()}
              aria-label="Отправить"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          {error && <div className={styles.formError}>{error}</div>}
        </form>

        {/* Список комментариев */}
        <div className={styles.commentsList}>
          {comments.length > 0 ? (
            comments.map((comment) => {
              const userInitial = comment.author?.username
                ? comment.author.username.charAt(0).toUpperCase()
                : "?";

              return (
                <div key={comment.id} className={styles.commentCard}>
                  <div className={styles.avatar}>
                    {comment.author?.avatarUrl ? (
                      <img
                        src={comment.author.avatarUrl}
                        alt={comment.author.username}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentAuthor}>
                        {comment.author?.username || "Пользователь"}
                      </span>
                      <span className={styles.commentDate}>
                        {formatRelativeTime(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className={styles.commentText}>{comment.content}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <p>Пока нет комментариев. Будьте первым!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
