import React, { useState } from "react";
import styles from "./Auth.module.css";
import FormInput from "./FormInput";
import Email from "@/assets/icons/mail.svg?react";
import Lock from "@/assets/icons/lock.svg?react";
import UserIcon from "@/assets/icons/user.svg?react";
import Calendar from "@/assets/icons/calendar.svg?react";
import Ruler from "@/assets/icons/ruler.svg?react";
import WeightIcon from "@/assets/icons/weight.svg?react";

interface RegisterFormProps {
  onSubmit: (data: any) => void;
}

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [goal, setGoal] = useState<string>("LOSE_WEIGHT");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      username,
      password,
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      goal,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formFields}>
        <FormInput
          value={email}
          onChange={setEmail}
          icon={<Email width={20} height={20} />}
          placeholder="Email"
          type="email"
        />
        <FormInput
          value={username}
          onChange={setUsername}
          icon={<UserIcon width={20} height={20} />}
          placeholder="Имя пользователя"
        />
        <FormInput
          value={password}
          onChange={setPassword}
          icon={<Lock width={20} height={20} />}
          placeholder="Пароль"
          type="password"
        />
        
        <div className={styles.inputRow}>
          <FormInput
            value={age}
            onChange={setAge}
            icon={<Calendar width={20} height={20} />}
            placeholder="Возраст"
            type="number"
          />
          <FormInput
            value={weight}
            onChange={setWeight}
            icon={<WeightIcon width={20} height={20} />}
            placeholder="Вес (кг)"
            type="number"
          />
        </div>
        
        <FormInput
          value={height}
          onChange={setHeight}
          icon={<Ruler width={20} height={20} />}
          placeholder="Рост (см)"
          type="number"
        />

        <div className={styles.goalSection}>
          <p className={styles.goalTitle}>Выберите вашу цель:</p>
          <div className={styles.goalGroup}>
            <button
              type="button"
              className={`${styles.goalBtn} ${goal === "LOSE_WEIGHT" ? styles.activeGoal : ""}`}
              onClick={() => setGoal("LOSE_WEIGHT")}
            >
              Похудеть
            </button>
            <button
              type="button"
              className={`${styles.goalBtn} ${goal === "GAIN_MUSCLE" ? styles.activeGoal : ""}`}
              onClick={() => setGoal("GAIN_MUSCLE")}
            >
              Мышцы
            </button>
            <button
              type="button"
              className={`${styles.goalBtn} ${goal === "MAINTAIN" ? styles.activeGoal : ""}`}
              onClick={() => setGoal("MAINTAIN")}
            >
              Тонус
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Создать аккаунт
        </button>
      </div>
    </form>
  );
}
