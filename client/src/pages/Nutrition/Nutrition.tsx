import styles from "./Nutrition.module.css";
import React, { useEffect, useState } from "react";
import { api } from "@/logic/api";
import type { FoodLogType, FoodDiaryResponse } from "@/types/food.ts";
import Modal from "@/components/Modal/Modal";

// Константы суточных норм по умолчанию (если расчет еще не сделан)
const DEFAULT_CALORIES = 2200;
const DEFAULT_PROTEIN = 110;
const DEFAULT_FATS = 70;
const DEFAULT_CARBS = 220;

// Имена приемов пищи на русском
const MEAL_NAMES: Record<string, string> = {
  BREAKFAST: "Завтрак",
  LUNCH: "Обед",
  DINNER: "Ужин",
  SNACK: "Перекус",
};

// Творительный/винительный падеж для пустого плейсхолдера
const MEAL_ACCUSATIVE: Record<string, string> = {
  BREAKFAST: "завтрак",
  LUNCH: "обед",
  DINNER: "ужин",
  SNACK: "перекус",
};

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
type MealTypeUnion = typeof MEAL_TYPES[number];

export default function Nutrition() {
  const [logs, setLogs] = useState<FoodLogType[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, fats: 0, carbs: 0 });
  const [targets, setTargets] = useState<CustomTargets | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [username, setUsername] = useState("Артём");
  
  // Состояния раскрытия подробных списков для каждого приема пищи
  const [expandedMeal, setExpandedMeal] = useState<Record<string, boolean>>({
    BREAKFAST: false,
    LUNCH: false,
    DINNER: false,
    SNACK: false,
  });

  // Модалка добавления
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealTypeUnion>("BREAKFAST");
  const [newFood, setNewFood] = useState({
    name: "",
    calories: "",
    protein: "",
    fats: "",
    carbs: "",
  });

  interface CustomTargets {
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
    reasoning: string;
  }

  // Загрузка логов еды с эндпоинта /food/today
  const fetchDiary = async () => {
    try {
      const res = await api.get<FoodDiaryResponse>("/food/today");
      if (res.data) {
        setLogs(res.data.foods || []);
        setTotals(res.data.summary || { calories: 0, protein: 0, fats: 0, carbs: 0 });
      }
    } catch (err) {
      console.error("Не удалось загрузить лог еды:", err);
    }
  };

  // Загрузка имени пользователя для приветствия
  const fetchUserProfile = async () => {
    try {
      const res = await api.get<{ username: string }>("/auth/me");
      if (res && res.data && res.data.username) {
        setUsername(res.data.username);
      }
    } catch (e) {
      console.warn("Не удалось загрузить профиль пользователя:", e);
    }
  };

  useEffect(() => {
    fetchDiary();
    fetchUserProfile();

    // Загрузка кастомных целей из localStorage
    const saved = localStorage.getItem("healthod_custom_targets");
    if (saved) {
      try {
        setTargets(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Офлайн-расчет Mifflin-St Jeor
  const calculateOfflineTargets = (user: { age: number; weight: number; height: number; goal: string }): CustomTargets => {
    let bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5; // Для мужчин
    let factor = 1.375; // Средняя активность

    let calories = Math.round(bmr * factor);
    if (user.goal === "LOSE_WEIGHT") calories -= 400;
    else if (user.goal === "GAIN_MUSCLE") calories += 350;

    const protein = Math.round(user.weight * 2);
    const fats = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - (protein * 4 + fats * 9)) / 4);

    return {
      calories,
      protein,
      fats,
      carbs,
      reasoning: "Расчет выполнен по офлайн-формуле Mifflin-St Jeor. БЖУ распределено в соотношении: 2г белка на кг веса, 25% энергии из жиров, остальное — углеводы.",
    };
  };

  // Расчет целей через ИИ
  const handleCalculateTargets = async () => {
    setAiLoading(true);
    try {
      const userRes = await api.get<{ age: number; weight: number; height: number; goal: string }>("/auth/me");
      const userData = userRes.data;
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API-ключ отсутствует");
      }

      const prompt = `
You are an expert nutritionist and fitness coach.
Calculate the daily calorie intake and macronutrients (protein, fats, carbs in grams) for a user with the following parameters:
Age: ${userData.age} years old
Weight: ${userData.weight} kg
Height: ${userData.height} cm
Goal: ${userData.goal} (where LOSE_WEIGHT is weight loss, GAIN_MUSCLE is muscle gain, MAINTAIN is weight maintenance).

Respond strictly with a JSON object containing these keys: "calories", "protein", "fats", "carbs", and "reasoning" (a brief explanation of the calculation in Russian in 2-3 sentences). Do not include any markdown styling, comments, or extra text.
JSON template:
{
  "calories": 2000,
  "protein": 120,
  "fats": 60,
  "carbs": 240,
  "reasoning": "Пояснение..."
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Сбой HTTP запроса");
      }

      const raw = await response.json();
      let text = raw.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

      const parsed: CustomTargets = JSON.parse(text);
      setTargets(parsed);
      localStorage.setItem("healthod_custom_targets", JSON.stringify(parsed));
      showToast("Суточные нормы рассчитаны ИИ!");
    } catch (err) {
      console.warn("Gemini API недоступен, включаем оффлайн-формулу Миффлина:", err);
      try {
        const userRes = await api.get<{ age: number; weight: number; height: number; goal: string }>("/auth/me");
        const fallback = calculateOfflineTargets(userRes.data);
        setTargets(fallback);
        localStorage.setItem("healthod_custom_targets", JSON.stringify(fallback));
        showToast("Рассчитано по формуле Mifflin-St Jeor (офлайн)");
      } catch (innerErr) {
        showToast("Заполните профиль для расчета!");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetTargets = () => {
    setTargets(null);
    localStorage.removeItem("healthod_custom_targets");
    showToast("Цели сброшены к значениям по умолчанию");
  };

  // Добавление еды
  const handleOpenAddModal = (mealType: MealTypeUnion) => {
    setActiveMealType(mealType);
    setNewFood({ name: "", calories: "", protein: "", fats: "", carbs: "" });
    setIsAddModalOpen(true);
  };

  const handleAddFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      foodName: newFood.name,
      calories: Number(newFood.calories) || 0,
      protein: Number(newFood.protein) || 0,
      fats: Number(newFood.fats) || 0,
      carbs: Number(newFood.carbs) || 0,
      mealType: activeMealType,
    };

    try {
      const res = await api.post("/food", payload);
      if (res.status === 201 || res.status === 200) {
        setIsAddModalOpen(false);
        fetchDiary();
        showToast("Продукт добавлен!");
      }
    } catch (err) {
      console.error(err);
      showToast("Ошибка при добавлении");
    }
  };

  // Удаление еды
  const handleDeleteFood = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // предотвращаем закрытие аккордеона
    try {
      const res = await api.delete(`/food/${id}`);
      if (res.status === 200) {
        fetchDiary();
        showToast("Продукт удален");
      }
    } catch (err) {
      console.error(err);
      showToast("Ошибка удаления");
    }
  };

  const toggleExpand = (meal: string) => {
    setExpandedMeal((prev) => ({ ...prev, [meal]: !prev[meal] }));
  };

  // Расчет лимитов
  const limitCalories = targets ? targets.calories : DEFAULT_CALORIES;
  const limitProtein = targets ? targets.protein : DEFAULT_PROTEIN;
  const limitFats = targets ? targets.fats : DEFAULT_FATS;
  const limitCarbs = targets ? targets.carbs : DEFAULT_CARBS;

  const calPercent = Math.min(Math.round((totals.calories / limitCalories) * 100), 100);
  const protPercent = Math.min(Math.round((totals.protein / limitProtein) * 100), 100);
  const fatsPercent = Math.min(Math.round((totals.fats / limitFats) * 100), 100);
  const carbsPercent = Math.min(Math.round((totals.carbs / limitCarbs) * 100), 100);

  // Градиент для круга калорий
  const conicGradient = `conic-gradient(var(--green-dark) 0% ${calPercent}%, #ECE5D3 ${calPercent}% 100%)`;

  // Форматирование текущей даты (пример: 3 июля)
  const getFormattedDate = () => {
    const d = new Date();
    const months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <div className={styles.container}>
      {/* Приветствие из макета */}
      <div className={styles.greetingBanner}>
        <span>Доброе утро, {username} · {getFormattedDate()}</span>
      </div>

      {/* Объединенный виджет калорий и БЖУ */}
      <div className={styles.dashboardCard}>
        <div className={styles.circleWrapper}>
          <div className={styles.circleProgress} style={{ background: conicGradient }}>
            <div className={styles.circleCenter}>
              <span className={styles.caloriesCount}>{totals.calories}</span>
              <span className={styles.caloriesTotal}>из {limitCalories} ккал</span>
            </div>
          </div>
        </div>

        <div className={styles.macrosList}>
          {/* Белки */}
          <div className={styles.macroRow}>
            <div className={styles.macroHeader}>
              <span>Белки</span>
              <span className={styles.macroNumbers}>{totals.protein}/{limitProtein} г</span>
            </div>
            <div className={styles.macroBar}>
              <div className={styles.macroFill} style={{ width: `${protPercent}%`, backgroundColor: "#587C5C" }} />
            </div>
          </div>

          {/* Жиры */}
          <div className={styles.macroRow}>
            <div className={styles.macroHeader}>
              <span>Жиры</span>
              <span className={styles.macroNumbers}>{totals.fats}/{limitFats} г</span>
            </div>
            <div className={styles.macroBar}>
              <div className={styles.macroFill} style={{ width: `${fatsPercent}%`, backgroundColor: "#DE8768" }} />
            </div>
          </div>

          {/* Углеводы */}
          <div className={styles.macroRow}>
            <div className={styles.macroHeader}>
              <span>Углеводы</span>
              <span className={styles.macroNumbers}>{totals.carbs}/{limitCarbs} г</span>
            </div>
            <div className={styles.macroBar}>
              <div className={styles.macroFill} style={{ width: `${carbsPercent}%`, backgroundColor: "#C89B3C" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Карточка ИИ-Ассистента */}
      <div className={styles.assistantCard}>
        <div className={styles.assistantHeader}>
          <svg className={styles.sparkleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          <span className={styles.assistantTitle}>ИИ-Ассистент</span>
        </div>

        <div className={styles.assistantBody}>
          {aiLoading ? (
            <div className={styles.loaderWrapper}>
              <div className={styles.miniLoader} />
              <span style={{ fontSize: "12px", color: "var(--inf-soft)", fontWeight: 600 }}>Анализирую параметры...</span>
            </div>
          ) : targets ? (
            <>
              <p className={styles.assistantReasoning}>{targets.reasoning}</p>
              <button className={styles.resetBtn} onClick={handleResetTargets}>Сбросить кастомные цели</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "12.5px", color: "var(--inf-soft)", lineHeight: 1.45, margin: 0 }}>
                Рассчитайте нормы калорий и макронутриентов на основе параметров вашего профиля (рост, вес, возраст, активность) с помощью искусственного интеллекта.
              </p>
              <button className={styles.calculateBtn} onClick={handleCalculateTargets}>Рассчитать цели через ИИ</button>
            </>
          )}
        </div>
      </div>

      {/* Заголовок раздела приемов пищи */}
      <div className={styles.mealsSectionHeader}>
        <span className={styles.mealsTitle}>Приёмы пищи</span>
        <button className={styles.addGlobalBtn} onClick={() => handleOpenAddModal("BREAKFAST")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Список приемов пищи */}
      <div className={styles.mealsList}>
        {MEAL_TYPES.map((mealType) => {
          const mealLogs = logs.filter((log) => log.mealType === mealType);
          const mealCalories = mealLogs.reduce((acc, curr) => acc + curr.calories, 0);
          const isExpanded = expandedMeal[mealType];

          // Свежий список продуктов через запятую
          const foodSummary = mealLogs.map((log) => log.foodName).join(", ");

          // Класс цвета иконки
          let iconBgClass = styles.breakfastBg;
          let materialIcon = "breakfast_dining";
          if (mealType === "LUNCH") {
            iconBgClass = styles.lunchBg;
            materialIcon = "lunch_dining";
          } else if (mealType === "DINNER") {
            iconBgClass = styles.dinnerBg;
            materialIcon = "dinner_dining";
          } else if (mealType === "SNACK") {
            iconBgClass = styles.snackBg;
            materialIcon = "cookie";
          }

          // Если в приеме пищи пусто, выводим дашед-кнопку из макета
          if (mealLogs.length === 0) {
            return (
              <div
                key={mealType}
                className={styles.emptyMealPlaceholder}
                onClick={() => handleOpenAddModal(mealType)}
              >
                + Добавить {MEAL_ACCUSATIVE[mealType]}
              </div>
            );
          }

          return (
            <React.Fragment key={mealType}>
              <div 
                className={styles.mealCard} 
                onClick={() => toggleExpand(mealType)}
              >
                <div className={`${styles.mealIcon} ${iconBgClass}`}>
                  <span className="msym" style={{ fontSize: "20px" }}>{materialIcon}</span>
                </div>
                
                <div className={styles.mealContent}>
                  <div className={styles.mealName}>{MEAL_NAMES[mealType]}</div>
                  <div className={styles.mealDescription}>
                    {foodSummary || "Нажмите, чтобы добавить продукты"}
                  </div>
                </div>

                <span className={styles.mealCalories}>{mealCalories} ккал</span>
              </div>

              {/* Раскрытый список с возможностью CRUD-операций */}
              {isExpanded && (
                <div className={styles.expandedFoodContainer}>
                  {mealLogs.map((log) => (
                    <div key={log.id} className={styles.foodItem}>
                      <div className={styles.foodDetails}>
                        <span className={styles.foodName}>{log.foodName}</span>
                        <span className={styles.foodMacros}>
                          {log.calories} ккал · Б {log.protein}г · Ж {log.fats}г · У {log.carbs}г
                        </span>
                      </div>
                      <button
                        className={styles.deleteFoodBtn}
                        onClick={(e) => handleDeleteFood(log.id, e)}
                        aria-label="Удалить продукт"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    className={styles.inlineAddBtn}
                    onClick={() => handleOpenAddModal(mealType)}
                  >
                    + Добавить продукт
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Модалка добавления продукта */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Добавить в: ${MEAL_NAMES[activeMealType]}`}>
        <form onSubmit={handleAddFoodSubmit}>
          <div className={styles.formGroup}>
            <label>Название продукта / блюда</label>
            <input
              type="text"
              required
              placeholder="Гречка, Яблоко..."
              value={newFood.name}
              onChange={(e) => setNewFood((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Калории (ккал)</label>
            <input
              type="number"
              required
              min="0"
              placeholder="120"
              value={newFood.calories}
              onChange={(e) => setNewFood((prev) => ({ ...prev, calories: e.target.value }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Белки (г)</label>
            <input
              type="number"
              min="0"
              placeholder="5"
              value={newFood.protein}
              onChange={(e) => setNewFood((prev) => ({ ...prev, protein: e.target.value }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Жиры (г)</label>
            <input
              type="number"
              min="0"
              placeholder="2"
              value={newFood.fats}
              onChange={(e) => setNewFood((prev) => ({ ...prev, fats: e.target.value }))}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Углеводы (г)</label>
            <input
              type="number"
              min="0"
              placeholder="25"
              value={newFood.carbs}
              onChange={(e) => setNewFood((prev) => ({ ...prev, carbs: e.target.value }))}
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setIsAddModalOpen(false)}>Отмена</button>
            <button type="submit" className={styles.submitBtn}>Добавить</button>
          </div>
        </form>
      </Modal>

      {/* Тосты */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "var(--ink)",
          color: "var(--surface)",
          padding: "10px 20px",
          borderRadius: "10px",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 3000,
          animation: "fadeIn 0.2s"
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}