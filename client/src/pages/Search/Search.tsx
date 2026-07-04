import styles from "./Search.module.css";
import { useEffect, useState, useRef } from "react";
import { api } from "@/logic/api";
import { useNavigate } from "react-router-dom";
import PostCard from "@/components/PostCard/PostCard";
import type { PostWithAuthor } from "@/types/post";

interface SearchUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  followersCount: number;
  isFollowing: boolean;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const fetchAllPosts = async () => {
      try {
        const res = await api.get("/posts");
        setAllPosts(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAllPosts();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      return;
    }

    const q = query.toLowerCase();

    const filtered = allPosts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q),
    );
    setPosts(filtered);

    const searchUsers = async () => {
      try {
        const res = await api.get(`/profile/search?q=${encodeURIComponent(query.trim())}`);
        setUsers(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    searchUsers();
  }, [query, allPosts]);

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    try {
      if (isFollowing) {
        await api.delete(`/profile/${userId}/follow`);
      } else {
        await api.post(`/profile/${userId}/follow`);
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: !isFollowing } : u)),
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className={styles.searchWrapper}>
          <span className="msym" style={{ fontSize: 18, color: "var(--inf-soft)" }}>search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск постов и пользователей..."
            className={styles.searchInput}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery("")}>
              <span className="msym" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>
      </div>

      {query.trim() && (
        <div className={styles.tabsRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === "posts" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Посты ({posts.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "users" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Пользователи ({users.length})
          </button>
        </div>
      )}

      <div className={styles.results}>
        {!query.trim() ? (
          <div className={styles.hint}>
            <span className="msym" style={{ fontSize: 40, color: "var(--line)" }}>search</span>
            <p>Введите имя пользователя или текст поста</p>
          </div>
        ) : activeTab === "posts" ? (
          posts.length > 0 ? (
            <div className={styles.postsList}>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>Постов по запросу «{query}» не найдено</p>
            </div>
          )
        ) : users.length > 0 ? (
          <div className={styles.usersList}>
            {users.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <div
                  className={styles.userAvatar}
                  onClick={() => navigate(`/${user.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                  ) : (
                    <span>{user.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles.userInfo} onClick={() => navigate(`/${user.id}`)} style={{ cursor: "pointer" }}>
                  <span className={styles.userName}>{user.username}</span>
                  <span className={styles.userFollowers}>{user.followersCount} подписчиков</span>
                </div>
                <button
                  className={`${styles.followBtn} ${user.isFollowing ? styles.followingBtn : ""}`}
                  onClick={() => handleFollow(user.id, user.isFollowing)}
                >
                  {user.isFollowing ? "Отписаться" : "Подписаться"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>Пользователей по запросу «{query}» не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
