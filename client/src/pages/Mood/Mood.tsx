import styles from "./Mood.module.css";
import { useEffect, useState } from "react";
import { api } from "@/logic/api";

interface MoodLogEntry {
  id: string;
  mood: string;
  note: string | null;
  createdAt: string;
}

const MOODS = [
  { key: "HAPPY", emoji: "😊", label: "Отлично", icon: "sentiment_very_satisfied" },
  { key: "CALM", emoji: "😌", label: "Спокойно", icon: "sentiment_calm" },
  { key: "MOTIVATED", emoji: "💪", label: "Мотивирован", icon: "fitness_center" },
  { key: "TIRED", emoji: "😴", label: "Устал", icon: "bedtime" },
  { key: "STRESSED", emoji: "😰", label: "Стресс", icon: "mood_bad" },
  { key: "SAD", emoji: "😢", label: "Грустно", icon: "sentiment_dissatisfied" },
];

const MOOD_GRADIENTS: Record<string, string> = {
  HAPPY: "linear-gradient(135deg, #F5DDCE 0%, #C89B3C 100%)",
  CALM: "linear-gradient(135deg, #D9E3D4 0%, #587C5C 100%)",
  MOTIVATED: "linear-gradient(135deg, #F5DDCE 0%, #DE8768 100%)",
  TIRED: "linear-gradient(135deg, #ECE5D3 0%, #8C8571 100%)",
  STRESSED: "linear-gradient(135deg, #DE8768 0%, #C89B3C 100%)",
  SAD: "linear-gradient(135deg, #C7BE9E 0%, #8C8571 100%)",
};

const MOOD_EMOJI: Record<string, string> = {
  HAPPY: "😊", CALM: "😌", MOTIVATED: "💪", TIRED: "😴", STRESSED: "😰", SAD: "😢",
};

export default function Mood() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<MoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/mood?period=week");
      setLogs(res.data || []);
    } catch (err) {
      console.error("Ошибка загрузки настроения:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async () => {
    if (!selectedMood) return;
    try {
      setSubmitting(true);
      await api.post("/mood", { mood: selectedMood, note: note.trim() || undefined });
      setSelectedMood(null);
      setNote("");
      setMessage("Настроение сохранено!");
      setTimeout(() => setMessage(null), 2500);
      fetchLogs();
    } catch (err) {
      console.error(err);
      setMessage("Ошибка при сохранении");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/mood/${id}`);
      fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const todayLogs = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const earlierLogs = logs.filter((l) => {
    const d = new Date(l.createdAt);
    const now = new Date();
    return d.toDateString() !== now.toDateString();
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Настроение</span>
      </div>

      {message && <div className={styles.toast}>{message}</div>}

      <div className={styles.pickerCard}>
        <p className={styles.pickerLabel}>Как ты себя чувствуешь?</p>
        <div className={styles.moodGrid}>
          {MOODS.map((m) => (
            <button
              key={m.key}
              className={`${styles.moodBtn} ${selectedMood === m.key ? styles.moodSelected : ""}`}
              onClick={() => setSelectedMood(m.key === selectedMood ? null : m.key)}
              style={selectedMood === m.key ? { background: MOOD_GRADIENTS[m.key], color: "#fff", borderColor: "transparent" } : {}}
            >
              <span className={styles.moodEmoji}>{m.emoji}</span>
              <span className={styles.moodLabel}>{m.label}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className={styles.noteSection}>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Добавьте заметку (необязательно)..."
              className={styles.noteInput}
            />
            <button className={styles.saveMoodBtn} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        )}
      </div>

      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Сегодня</h2>
        </div>
        {loading ? (
          <p className={styles.emptyText}>Загрузка...</p>
        ) : todayLogs.length === 0 ? (
          <p className={styles.emptyText}>Сегодня ещё нет записей</p>
        ) : (
          <div className={styles.logsList}>
            {todayLogs.map((log) => (
              <div key={log.id} className={styles.logCard}>
                <div className={styles.logMoodIcon} style={{ background: MOOD_GRADIENTS[log.mood] || "var(--surface-muted)" }}>
                  <span>{MOOD_EMOJI[log.mood] || "😶"}</span>
                </div>
                <div className={styles.logInfo}>
                  <span className={styles.logMoodName}>
                    {MOODS.find((m) => m.key === log.mood)?.label || log.mood}
                  </span>
                  {log.note && <span className={styles.logNote}>{log.note}</span>}
                </div>
                <div className={styles.logRight}>
                  <span className={styles.logTime}>{formatDate(log.createdAt)}</span>
                  <button className={styles.deleteLogBtn} onClick={() => handleDelete(log.id)} aria-label="Удалить">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {earlierLogs.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Ранее</h2>
          </div>
          <div className={styles.logsList}>
            {earlierLogs.map((log) => (
              <div key={log.id} className={styles.logCard}>
                <div className={styles.logMoodIcon} style={{ background: MOOD_GRADIENTS[log.mood] || "var(--surface-muted)" }}>
                  <span>{MOOD_EMOJI[log.mood] || "😶"}</span>
                </div>
                <div className={styles.logInfo}>
                  <span className={styles.logMoodName}>
                    {MOODS.find((m) => m.key === log.mood)?.label || log.mood}
                  </span>
                  {log.note && <span className={styles.logNote}>{log.note}</span>}
                </div>
                <div className={styles.logRight}>
                  <span className={styles.logTime}>{formatDate(log.createdAt)}</span>
                  <button className={styles.deleteLogBtn} onClick={() => handleDelete(log.id)} aria-label="Удалить">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
