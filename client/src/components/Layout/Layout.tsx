import styles from "./Layout.module.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import Search from "@/assets/icons/search.svg?react";
import Notification from "@/assets/icons/notification.svg?react";
import Home from "@/assets/icons/home.svg?react";
import Workout from "@/assets/icons/workout.svg?react";
import Nutrition from "@/assets/icons/fork.svg?react";
import Chat from "@/assets/icons/chat.svg?react";
import Account from "@/assets/icons/account.svg?react";

function Header() {
  return (
    <header>
      <p className={styles.appName}>Healthod</p>
      <div className={styles.layoutButtons}>
        <Search fill="var(--ink)" />
        <Notification fill="var(--ink)" />
      </div>
    </header>
  );
}

interface FooterButtonProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FooterButton({ to, icon, children }: FooterButtonProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive =
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <button
      className={`${styles.navButton} ${isActive ? styles.active : ""}`}
      onClick={() => navigate(to)}
    >
      <div className={`${styles.btnIcon}`}>{icon}</div>
      <span className={styles.btnLabel}>{children}</span>
    </button>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <FooterButton to="/" icon={<Home width={22} height={22} fill="currentColor" />}>
        Лента
      </FooterButton>
      <FooterButton to="/workouts" icon={<Workout width={22} height={22} fill="currentColor" />}>
        Тренировки
      </FooterButton>
      <FooterButton to="/nutrition" icon={<Nutrition width={22} height={22} fill="currentColor" />}>
        Питание
      </FooterButton>
      <FooterButton to="/chat" icon={<Chat width={22} height={22} fill="currentColor" />}>
        Чаты
      </FooterButton>
      <FooterButton to="/profile" icon={<Account width={22} height={22} fill="currentColor" />}>
        Профиль
      </FooterButton>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
