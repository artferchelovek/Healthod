import React from "react";
import styles from "./Auth.module.css";

interface FormInputProps {
  value: string | number;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
}

export default function FormInput({ value, onChange, icon, placeholder, type = "text" }: FormInputProps) {
  return (
    <div className={styles.inputWrapper}>
      <div className={styles.inputIcon}>{icon}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.inputField}
      />
    </div>
  );
}
