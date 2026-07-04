import styles from "./Main.module.css";
import PlusIcon from "@/assets/icons/plus.svg?react";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import CreatePostForm from "./CreatePostForm";
import { api } from "@/logic/api.ts";
import PostCard from "@/components/PostCard/PostCard.tsx";
import type { PostWithAuthor } from "@/types/post.ts";

export default function Main() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"feed" | "all">("feed");

  const fetchPosts = async (tab: "feed" | "all") => {
    try {
      setLoading(true);
      const endpoint = tab === "feed" ? "/posts/feed" : "/posts";
      const response = await api.get(endpoint);
      setPosts(response.data);
    } catch (error) {
      console.error("Ошибка при получении постов:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab]);

  const handlePostCreated = () => {
    setIsModalOpen(false);
    fetchPosts(activeTab);
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabBtn} ${activeTab === "feed" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("feed")}
        >
          <span className="msymf" style={{ fontSize: 18 }}>explore</span>
          Моя лента
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "all" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <span className="msym" style={{ fontSize: 18 }}>globe</span>
          Всё подряд
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Загрузка ленты...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className={styles.posts}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : activeTab === "feed" ? (
        <div className={styles.emptyState}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={styles.illustration}>
            <circle cx="60" cy="50" r="28" fill="var(--terracotta-soft)" className={styles.illSun} />
            <path d="M60 22C60 22 78 40 78 58C78 76 60 76 60 76C60 76 42 76 42 58C42 40 60 22 60 22Z" fill="var(--green-soft)" className={styles.illLeafLeft} style={{ mixBlendMode: "multiply" }} />
            <path d="M35 75C50 65 70 65 85 75C70 85 50 85 35 75Z" fill="var(--mustard)" className={styles.illGround} />
            <path d="M60 40C60 40 66 48 66 58C66 68 60 68 60 68C60 68 54 68 54 58C54 48 60 40 60 40Z" fill="var(--green)" className={styles.illSprout} />
          </svg>
          <p className={styles.emptyStateTitle}>В ленте пока тихо</p>
          <p className={styles.emptyStateText}>
            Подпишитесь на других пользователей, чтобы их посты появлялись здесь. Или создайте свой первый пост!
          </p>
          <button className={styles.emptyStateBtn} onClick={() => setActiveTab("all")}>
            Смотреть всё подряд
          </button>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={styles.illustration}>
            <circle cx="60" cy="50" r="28" fill="var(--terracotta-soft)" className={styles.illSun} />
            <path d="M60 22C60 22 78 40 78 58C78 76 60 76 60 76C60 76 42 76 42 58C42 40 60 22 60 22Z" fill="var(--green-soft)" className={styles.illLeafLeft} style={{ mixBlendMode: "multiply" }} />
            <path d="M35 75C50 65 70 65 85 75C70 85 50 85 35 75Z" fill="var(--mustard)" className={styles.illGround} />
            <path d="M60 40C60 40 66 48 66 58C66 68 60 68 60 68C60 68 54 68 54 58C54 48 60 40 60 40Z" fill="var(--green)" className={styles.illSprout} />
          </svg>
          <p className={styles.emptyStateTitle}>Время начать что-то новое</p>
          <p className={styles.emptyStateText}>
            В ленте пока пусто. Расскажи о своей сегодняшней тренировке или поделись полезным рецептом!
          </p>
        </div>
      )}

      <button
        className={styles.fab}
        onClick={() => setIsModalOpen(true)}
        aria-label="Создать пост"
      >
        <PlusIcon width={24} height={24} />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новая публикация"
      >
        <CreatePostForm onSubmitSuccess={handlePostCreated} />
      </Modal>
    </div>
  );
}
