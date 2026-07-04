import styles from "./Workouts.module.css";
import React, { useEffect, useState } from "react";
import { api } from "@/logic/api";
import type { WorkoutWithExercises } from "@/types/workout.ts";
import WorkoutIcon from "@/assets/icons/workout.svg?react";
import PlusIcon from "@/assets/icons/plus.svg?react";
import Modal from "@/components/Modal/Modal";

const isToday = (dateString: string | Date) => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (dateString: string | Date) => {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const getWeekDays = () => {
  const current = new Date();
  const week = [];
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    week.push(next);
  }
  return week;
};

const WEEKDAY_LETTERS = ["П", "В", "С", "Ч", "П", "С", "В"];

export default function Workouts() {
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(12);
  const [calories, setCalories] = useState<number>(100);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await api.delete(`/exercises/${exerciseId}`);
      fetchWorkouts();
    } catch (err) {
      console.error("Ошибка удаления упражнения:", err);
    }
  };

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/workouts");
      setWorkouts(res.data);
    } catch (err) {
      console.error("Ошибка при получении тренировок:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const weekDays = getWeekDays();
  const startOfWeek = new Date(weekDays[0]);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(weekDays[6]);
  endOfWeek.setHours(23, 59, 59, 999);

  const weeklyWorkouts = workouts.filter((w) => {
    const d = new Date(w.createdAt);
    return d >= startOfWeek && d <= endOfWeek;
  });

  const totalWeeklyCalories = weeklyWorkouts.reduce(
    (sum, w) => sum + (w.totalCalories || 0),
    0,
  );
  const totalWeeklyCount = weeklyWorkouts.length;

  const dailyCalories = weekDays.map((day) => {
    const dayString = day.toDateString();
    const dayWorkouts = workouts.filter(
      (w) => new Date(w.createdAt).toDateString() === dayString,
    );
    return dayWorkouts.reduce((sum, w) => sum + (w.totalCalories || 0), 0);
  });
  const maxCalories = Math.max(...dailyCalories, 100); // Предотвращаем деление на ноль

  const todayWorkouts = workouts.filter((w) => isToday(w.createdAt));
  const todayCalories = todayWorkouts.reduce(
    (sum, w) => sum + (w.totalCalories || 0),
    0,
  );
  const todayExercises = todayWorkouts.flatMap((w) => w.exercises);

  const yesterdayWorkouts = workouts.filter((w) => isYesterday(w.createdAt));
  const yesterdayCalories = yesterdayWorkouts.reduce(
    (sum, w) => sum + (w.totalCalories || 0),
    0,
  );
  const yesterdayExercises = yesterdayWorkouts.flatMap((w) => w.exercises);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName.trim()) {
      setError("Укажите название упражнения");
      return;
    }

    try {
      setFormLoading(true);
      setError(null);

      let workoutId = "";
      if (todayWorkouts.length > 0) {
        workoutId = todayWorkouts[0].id;
      } else {
        const titleDate = new Date().toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        });
        const workoutRes = await api.post("/workouts", {
          title: `Тренировка ${titleDate}`,
        });
        workoutId = workoutRes.data.id;
      }

      await api.post(`/workouts/${workoutId}/exercises`, {
        name: exerciseName.trim(),
        sets: Number(sets),
        reps: Number(reps) || null,
        calories: Number(calories) || null,
      });

      setExerciseName("");
      setSets(3);
      setReps(12);
      setCalories(100);
      setIsModalOpen(false);

      fetchWorkouts();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Не удалось сохранить упражнение");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loader}>Загрузка данных...</div>
      ) : (
        <>
          {/* Недельный отчет (Карточка) */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <span className={styles.summaryLabel}>Эта неделя</span>
              <span className={styles.summaryValue}>
                {totalWeeklyCalories} ккал &middot; {totalWeeklyCount} трен.
              </span>
            </div>

            {/* Столбиковая диаграмма */}
            <div className={styles.chartContainer}>
              {weekDays.map((day, index) => {
                const isTodayDay =
                  day.toDateString() === new Date().toDateString();
                const dayCal = dailyCalories[index];
                // Вычисляем высоту столбика (мин 6px для видимости, макс 54px)
                const barHeight = Math.max(6, (dayCal / maxCalories) * 54);

                return (
                  <div key={index} className={styles.chartCol}>
                    <div className={styles.chartBarWrapper}>
                      <div
                        className={`${styles.chartBar} ${isTodayDay ? styles.chartBarActive : ""}`}
                        style={{ height: `${barHeight}px` }}
                      ></div>
                    </div>
                    <span
                      className={`${styles.chartLabel} ${isTodayDay ? styles.chartLabelActive : ""}`}
                    >
                      {WEEKDAY_LETTERS[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Список упражнений на Сегодня */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Сегодня</span>
            <span className={styles.sectionCalories}>{todayCalories} ккал</span>
          </div>

          <div className={styles.exercisesList}>
            {todayExercises.map((ex) => (
              <div key={ex.id} className={styles.exerciseCard}>
                <div className={styles.iconWrapper}>
                  <WorkoutIcon width={18} height={18} fill="var(--green)" />
                </div>
                <div className={styles.exInfo}>
                  <div className={styles.exName}>{ex.name}</div>
                  <div className={styles.exSets}>
                    {ex.sets} подх. {ex.reps ? `\u00d7 ${ex.reps}` : ""}
                  </div>
                </div>
                <span className={styles.exCalories}>
                  {ex.calories || 0} ккал
                </span>
                <div className={styles.exActions}>
                  <button className={styles.exDeleteBtn} onClick={() => handleDeleteExercise(ex.id)} aria-label="Удалить">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}

            <button
              className={styles.addExerciseDottedBtn}
              onClick={() => setIsModalOpen(true)}
            >
              + Добавить упражнение
            </button>
          </div>

          {/* Список упражнений на Вчера */}
          {yesterdayExercises.length > 0 && (
            <>
              <div
                className={styles.sectionHeader}
                style={{ marginTop: "24px" }}
              >
                <span className={styles.sectionTitle}>Вчера</span>
                <span className={styles.sectionCalories}>
                  {yesterdayCalories} ккал
                </span>
              </div>
              <div className={styles.exercisesList}>
                {yesterdayExercises.map((ex) => (
                  <div key={ex.id} className={styles.exerciseCard}>
                    <div className={styles.iconWrapper}>
                      <WorkoutIcon width={18} height={18} fill="var(--green)" />
                    </div>
                    <div className={styles.exInfo}>
                      <div className={styles.exName}>{ex.name}</div>
                      <div className={styles.exSets}>
                        {ex.sets} подх. {ex.reps ? `\u00d7 ${ex.reps}` : ""}
                      </div>
                    </div>
                    <span className={styles.exCalories}>
                      {ex.calories || 0} ккал
                    </span>
                    <div className={styles.exActions}>
                      <button className={styles.exDeleteBtn} onClick={() => handleDeleteExercise(ex.id)} aria-label="Удалить">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        className={styles.fab}
        onClick={() => setIsModalOpen(true)}
        aria-label="Добавить упражнение"
      >
        <PlusIcon width={24} height={24} />
      </button>

      {/* Модалка добавления упражнения */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новое упражнение"
      >
        <form onSubmit={handleAddExercise} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.fieldGroup}>
            <label htmlFor="ex-name">Название упражнения</label>
            <input
              id="ex-name"
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="Например, Приседания"
              className={styles.textInput}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="ex-sets">Подходы</label>
              <input
                id="ex-sets"
                type="number"
                min="1"
                max="50"
                value={sets}
                onChange={(e) => setSets(Number(e.target.value))}
                className={styles.textInput}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="ex-reps">Повторения</label>
              <input
                id="ex-reps"
                type="number"
                min="1"
                max="1000"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value))}
                className={styles.textInput}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="ex-calories">Калории (ккал)</label>
            <input
              id="ex-calories"
              type="number"
              min="0"
              max="5000"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className={styles.textInput}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={formLoading}
          >
            {formLoading ? "Сохранение..." : "Добавить"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
