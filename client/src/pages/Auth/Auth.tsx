import styles from "./Auth.module.css";
import Logo from "@/assets/icons/heart_favourite_filled.svg?react";
import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { api } from "@/logic/api";
import { useNavigate } from "react-router-dom";

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

export default function Auth() {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLoginSubmit = async (data: any) => {
    try {
      setError(null);
      const response = await api.post("/auth/login", data);
      localStorage.setItem("token", response.data.token);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Произошла ошибка при входе");
    }
  };

  const handleRegisterSubmit = async (data: any) => {
    try {
      setError(null);
      // Сначала регистрируем
      await api.post("/auth/register", data);

      // Сразу выполняем вход после регистрации, чтобы пользователю не пришлось логиниться вручную
      const loginResponse = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      localStorage.setItem("token", loginResponse.data.token);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Произошла ошибка при регистрации");
    }
  };

  const handleTabChange = () => {
    setError(null); // Очищаем ошибку при переключении вкладок
    setIsLogin(!isLogin);
  };

  return (
    <div className={styles.authContainer}>
      <Top />
      <LoginPicker login={isLogin} onClick={handleTabChange} />

      {error && <div className={styles.error}>{error}</div>}

      {isLogin ? (
        <LoginForm onSubmit={handleLoginSubmit} />
      ) : (
        <RegisterForm onSubmit={handleRegisterSubmit} />
      )}
    </div>
  );
}
