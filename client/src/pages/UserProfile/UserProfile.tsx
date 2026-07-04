import styles from "./UserProfile.module.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/logic/api";
import PostCard from "@/components/PostCard/PostCard";
import { getUserIdFromToken } from "@/logic/utils";

interface UserProfileData {
  id: string;
  username: string;
  avatarUrl: string | null;
  age: number;
  weight: number;
  height: number;
  goal: string;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
  posts: any[];
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const currentUserId = getUserIdFromToken();
  const isOwn = currentUserId === id;

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/profile/${id}`);
        const user = res.data.user;
        setProfile({ ...user, _count: { followers: user.followersCount, following: user.followingCount, posts: user.postsCount }, posts: res.data.posts || [] });
        setIsFollowing(user.isFollowing ?? false);
      } catch {
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!id) return;
    const willFollow = !isFollowing;
    setIsFollowing(willFollow);
    try {
      if (willFollow) {
        await api.post(`/profile/${id}/follow`);
      } else {
        await api.delete(`/profile/${id}/follow`);
      }
    } catch {
      setIsFollowing(isFollowing);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Загрузка...</div>;
  }

  if (!profile) return null;

  const goalLabel =
    profile.goal === "LOSE_WEIGHT" ? "Похудение" :
    profile.goal === "GAIN_MUSCLE" ? "Мышцы" : "Тонус";

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Назад
      </button>

      <div className={styles.profileSection}>
        <div className={styles.avatar}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarLetter}>{profile.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h1 className={styles.name}>{profile.username}</h1>

        {!isOwn && (
          <button
            className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : ""}`}
            onClick={handleFollow}
          >
            {isFollowing ? "Отписаться" : "Подписаться"}
          </button>
        )}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{profile._count.posts}</span>
          <span className={styles.statLabel}>Посты</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{profile._count.followers}</span>
          <span className={styles.statLabel}>Подписчики</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{profile._count.following}</span>
          <span className={styles.statLabel}>Подписки</span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>О себе</h2>
        <div className={styles.paramsGrid}>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--green)" }}>fitness_center</span>
            <span className={styles.paramValue}>{profile.weight || "—"} кг</span>
            <span className={styles.paramLabel}>Вес</span>
          </div>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--mustard)" }}>straighten</span>
            <span className={styles.paramValue}>{profile.height || "—"} см</span>
            <span className={styles.paramLabel}>Рост</span>
          </div>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--terracotta)" }}>calendar_today</span>
            <span className={styles.paramValue}>{profile.age || "—"}</span>
            <span className={styles.paramLabel}>Возраст</span>
          </div>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--green)" }}>flag</span>
            <span className={styles.paramValue}>{goalLabel}</span>
            <span className={styles.paramLabel}>Цель</span>
          </div>
        </div>
      </div>

      {profile.posts.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Посты</h2>
          <div className={styles.posts}>
            {profile.posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
