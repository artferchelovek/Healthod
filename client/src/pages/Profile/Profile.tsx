import styles from "./Profile.module.css";
import { useEffect, useState } from "react";
import { api } from "@/logic/api";
import Modal from "@/components/Modal/Modal";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  age: number;
  weight: number;
  height: number;
  goal: string;
  createdAt: string;
}

interface AchievementWithStatus {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  unlockedAt: string | null;
}

interface UserStats {
  workoutsCount: number;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", age: "", weight: "", height: "", goal: "MAINTAIN" });
  const [editLoading, setEditLoading] = useState(false);

  const [syncApple, setSyncApple] = useState(true);
  const [syncSamsung, setSyncSamsung] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const [authRes, profileRes] = await Promise.all([
        api.get("/auth/me"),
        api.get("/profile/me").catch(() => null),
      ]);
      setProfile(authRes.data);

      if (profileRes) {
        setStats({
          workoutsCount: 0,
          postsCount: profileRes.data.postsCount || 0,
          followersCount: profileRes.data.followersCount || 0,
          followingCount: profileRes.data.followingCount || 0,
        });
        setAchievements(profileRes.data.achievements || []);
      }

      const allWorkouts = await api.get("/workouts").catch(() => ({ data: [] }));
      setStats((prev) => prev ? { ...prev, workoutsCount: (allWorkouts.data || []).length } : prev);
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEdit = () => {
    if (!profile) return;
    setEditForm({
      username: profile.username,
      age: String(profile.age),
      weight: String(profile.weight),
      height: String(profile.height),
      goal: profile.goal,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      await api.patch("/profile", {
        username: editForm.username,
        age: Number(editForm.age),
        weight: Number(editForm.weight),
        height: Number(editForm.height),
        goal: editForm.goal,
      });
      setIsEditOpen(false);
      fetchProfile();
    } catch (err) {
      console.error("Ошибка обновления профиля:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const ACHIEVEMENT_ICONS: Record<string, string> = {
    "Первая тренировка": "military_tech",
    "7 дней подряд": "local_fire_department",
    "100 подписчиков": "group",
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.appName}>Healthod</span>
        <span className="msym" style={{ fontSize: 24 }}>settings</span>
      </div>

      <div className={styles.profileSection}>
        <div className={styles.avatar}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarLetter}>
              {profile?.username?.charAt(0).toUpperCase() || "?"}
            </span>
          )}
        </div>
        <h1 className={styles.name}>{profile?.username || "Пользователь"}</h1>
        <p className={styles.bio}>
          {profile?.goal === "LOSE_WEIGHT" ? "Работаю над собой" :
           profile?.goal === "GAIN_MUSCLE" ? "Мышцы — моя страсть" :
           "В хорошей форме"} &middot; с{" "}
          {profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
            : "недавно"}
        </p>

        <div className={styles.actionRow}>
          <button className={styles.editBtn} onClick={openEdit}>Редактировать</button>
          <button className={styles.shareBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Поделиться
          </button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats?.workoutsCount || 0}</span>
            <span className={styles.statLabel}>Тренировки</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats?.postsCount || 0}</span>
            <span className={styles.statLabel}>Посты</span>
          </div>
          <div className={styles.stat} onClick={() => navigate("/followers")} style={{ cursor: "pointer" }}>
            <span className={styles.statValue}>{stats?.followersCount || 0}</span>
            <span className={styles.statLabel}>Подписчики</span>
          </div>
          <div className={styles.stat} onClick={() => navigate("/following")} style={{ cursor: "pointer" }}>
            <span className={styles.statValue}>{stats?.followingCount || 0}</span>
            <span className={styles.statLabel}>Подписки</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Достижения</h2>
        <div className={styles.achievementsRow}>
          {achievements.length > 0 ? (
            achievements.map((ach) => {
              const isUnlocked = !!ach.unlockedAt;
              const iconName = ACHIEVEMENT_ICONS[ach.title] || "emoji_events";
              let gradientClass = styles.achDefault;
              if (ach.title.includes("Первая")) gradientClass = styles.achFirst;
              else if (ach.title.includes("7 дней")) gradientClass = styles.achStreak;

              return (
                <div key={ach.id} className={`${styles.achBadge} ${!isUnlocked ? styles.achLocked : ""}`}>
                  <div className={`${styles.achIcon} ${gradientClass}`}>
                    <span className="msymf" style={{ fontSize: 22, color: isUnlocked ? "#fff" : "var(--inf-soft)" }}>
                      {iconName}
                    </span>
                  </div>
                  <span className={styles.achLabel}>{ach.title}</span>
                </div>
              );
            })
          ) : (
            <>
              <div className={styles.achBadge}>
                <div className={`${styles.achIcon} ${styles.achFirst}`}>
                  <span className="msymf" style={{ fontSize: 22, color: "#fff" }}>military_tech</span>
                </div>
                <span className={styles.achLabel}>Первая тренировка</span>
              </div>
              <div className={styles.achBadge}>
                <div className={`${styles.achIcon} ${styles.achStreak}`}>
                  <span className="msymf" style={{ fontSize: 22, color: "#fff" }}>local_fire_department</span>
                </div>
                <span className={styles.achLabel}>7 дней подряд</span>
              </div>
              <div className={`${styles.achBadge} ${styles.achLocked}`}>
                <div className={styles.achIcon}>
                  <span className="msym" style={{ fontSize: 22, color: "var(--inf-soft)" }}>group</span>
                </div>
                <span className={styles.achLabel}>100 подписчиков</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Быстрые действия</h2>
        <button className={styles.moodNavBtn} onClick={() => navigate("/mood")}>
          <span className="msym" style={{ fontSize: 22, color: "var(--mustard)" }}>mood</span>
          <div className={styles.moodNavInfo}>
            <span className={styles.moodNavTitle}>Моё настроение</span>
            <span className={styles.moodNavDesc}>Записывайте и отслеживайте ваше эмоциональное состояние</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--inf-soft)", flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Параметры</h2>
        <div className={styles.paramsGrid}>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--green)" }}>fitness_center</span>
            <span className={styles.paramValue}>{profile?.weight || "—"} кг</span>
            <span className={styles.paramLabel}>Вес</span>
          </div>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--mustard)" }}>straighten</span>
            <span className={styles.paramValue}>{profile?.height || "—"} см</span>
            <span className={styles.paramLabel}>Рост</span>
          </div>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--terracotta)" }}>calendar_today</span>
            <span className={styles.paramValue}>{profile?.age || "—"}</span>
            <span className={styles.paramLabel}>Возраст</span>
          </div>
          <div className={styles.paramCard}>
            <span className="msym" style={{ fontSize: 20, color: "var(--green)" }}>flag</span>
            <span className={styles.paramValue}>
              {profile?.goal === "LOSE_WEIGHT" ? "Похудение" :
               profile?.goal === "GAIN_MUSCLE" ? "Мышцы" : "Тонус"}
            </span>
            <span className={styles.paramLabel}>Цель</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Синхронизация</h2>
        <div className={styles.syncList}>
          <label className={styles.syncRow}>
            <span className={styles.syncInfo}>
              <span className="msym" style={{ fontSize: 20, color: "var(--green)" }}>favorite</span>
              <span>Apple Health</span>
            </span>
            <div className={`${styles.toggle} ${syncApple ? styles.toggleOn : ""}`} onClick={() => setSyncApple(!syncApple)}>
              <div className={styles.toggleKnob} />
            </div>
          </label>
          <label className={styles.syncRow}>
            <span className={styles.syncInfo}>
              <span className="msym" style={{ fontSize: 20, color: "var(--mustard)" }}>monitor_heart</span>
              <span>Samsung Health</span>
            </span>
            <div className={`${styles.toggle} ${syncSamsung ? styles.toggleOn : ""}`} onClick={() => setSyncSamsung(!syncSamsung)}>
              <div className={styles.toggleKnob} />
            </div>
          </label>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Редактировать профиль">
        <form onSubmit={handleEditSubmit} className={styles.editForm}>
          <div className={styles.fieldGroup}>
            <label>Имя</label>
            <input type="text" value={editForm.username} onChange={(e) => setEditForm(p => ({ ...p, username: e.target.value }))} className={styles.fieldInput} required />
          </div>
          <div className={styles.row2}>
            <div className={styles.fieldGroup}>
              <label>Возраст</label>
              <input type="number" value={editForm.age} onChange={(e) => setEditForm(p => ({ ...p, age: e.target.value }))} className={styles.fieldInput} />
            </div>
            <div className={styles.fieldGroup}>
              <label>Вес (кг)</label>
              <input type="number" step="0.1" value={editForm.weight} onChange={(e) => setEditForm(p => ({ ...p, weight: e.target.value }))} className={styles.fieldInput} />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label>Рост (см)</label>
            <input type="number" value={editForm.height} onChange={(e) => setEditForm(p => ({ ...p, height: e.target.value }))} className={styles.fieldInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label>Цель</label>
            <div className={styles.goalGroup}>
              {(["LOSE_WEIGHT", "GAIN_MUSCLE", "MAINTAIN"] as const).map((g) => (
                <button key={g} type="button" className={`${styles.goalBtn} ${editForm.goal === g ? styles.goalActive : ""}`} onClick={() => setEditForm(p => ({ ...p, goal: g }))}>
                  {g === "LOSE_WEIGHT" ? "Похудеть" : g === "GAIN_MUSCLE" ? "Мышцы" : "Тонус"}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={editLoading}>
            {editLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
