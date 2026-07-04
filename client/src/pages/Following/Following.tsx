import styles from "./Following.module.css";
import { useEffect, useState } from "react";
import { api } from "@/logic/api";
import { useNavigate, useLocation } from "react-router-dom";

interface FollowUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export default function Following() {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isFollowers = location.pathname === "/followers";

  const fetchUsers = async () => {
    try {
      const endpoint = isFollowers ? "/profile/me/followers" : "/profile/me/following";
      const res = await api.get(endpoint);
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isFollowers]);

  const handleUnfollow = async (userId: string) => {
    try {
      await api.delete(`/profile/${userId}/follow`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
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
        <h1 className={styles.title}>{isFollowers ? "Подписчики" : "Подписки"}</h1>
      </div>

      {loading ? (
        <div className={styles.loader}>Загрузка...</div>
      ) : users.length === 0 ? (
        <div className={styles.empty}>
          <span className="msym" style={{ fontSize: 40, color: "var(--line)" }}>group</span>
          <p>{isFollowers ? "У вас пока нет подписчиков" : "Вы пока ни на кого не подписаны"}</p>
        </div>
      ) : (
        <div className={styles.usersList}>
          {users.map((user) => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userAvatar} onClick={() => navigate(`/${user.id}`)}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                ) : (
                  <span>{user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className={styles.userInfo} onClick={() => navigate(`/${user.id}`)}>
                <span className={styles.userName}>{user.username}</span>
              </div>
              {!isFollowers && (
                <button className={styles.unfollowBtn} onClick={() => handleUnfollow(user.id)}>
                  Отписаться
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
