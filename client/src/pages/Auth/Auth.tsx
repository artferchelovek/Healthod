import styles from "./Auth.module.css";
import Logo from "@/assets/icons/heart_favourite_filled.svg?react";
import Email from "@/assets/icons/mail.svg?react";
import Password from "@/assets/icons/password.svg?react";
import { useState } from "react";

function Top() {
  return (
    <div className={styles.top}>
      <Logo className={styles.logo} width={32} height={32} fill={"#FFFFFF"} />
      <p className={styles.appName}>Healthod</p>
      <p className={styles.appDescription}>Тренировки, питание и настроение</p>
    </div>
  );
}

function LoginPicker(props: { login: boolean; onClick: () => void }) {
  return (
    <div className={styles.loginPicker}>
      <div
        className={styles.slider}
        style={{
          transform: props.login ? "translateX(0)" : "translateX(100%)",
        }}
      />
      <p className={props.login ? styles.active : ""} onClick={props.onClick}>
        Войти
      </p>
      <p className={!props.login ? styles.active : ""} onClick={props.onClick}>
        Регистрация
      </p>
    </div>
  );
}

function FormInput(props: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  icon: React.JSX.Element;
}) {
  return (
    <div className={styles.formInput}>
      {props.icon}
      <input
        placeholder={props.placeholder}
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const auth = (email: string, password: string) => {
    console.log(email, password);
  };

  return (
    <div className={styles.login}>
      <FormInput
        value={email}
        onChange={setEmail}
        icon={<Email fill={"var(--inf-soft)"} />}
        placeholder={"Email"}
      />

      <FormInput
        value={password}
        onChange={setPassword}
        icon={<Password fill={"var(--inf-soft)"} />}
        placeholder={"Password"}
      />

      <p className={styles.forgotPassword}>Забыли пароль?</p>
      <button
        className={styles.buttonLogin}
        onClick={() => auth(email, password)}
      >
        Войти
      </button>
    </div>
  );
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState<boolean>(true);

  return (
    <div className={styles.authContainer}>
      <Top />
      <LoginPicker login={isLogin} onClick={() => setIsLogin(!isLogin)} />
      <Login />
    </div>
  );
}
