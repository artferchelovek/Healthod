import React, { useState } from "react";
import styles from "./Auth.module.css";
import FormInput from "./FormInput";
import Email from "@/assets/icons/mail.svg?react";
import Lock from "@/assets/icons/lock.svg?react";

interface LoginFormProps {
  onSubmit: (data: any) => void;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
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
          value={password}
          onChange={setPassword}
          icon={<Lock width={20} height={20} />}
          placeholder="Пароль"
          type="password"
        />
        
        <button type="submit" className={styles.submitBtn}>
          Войти
        </button>
        <p className={styles.forgotPassword}>Забыли пароль?</p>
      </div>
    </form>
  );
}
