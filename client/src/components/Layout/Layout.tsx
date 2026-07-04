import styles from "./Layout.module.css";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import Search from "@/assets/icons/search.svg?react";
import Notification from "@/assets/icons/notification.svg?react";
import Home from "@/assets/icons/home.svg?react";
import Workout from "@/assets/icons/workout.svg?react";
import Nutrition from "@/assets/icons/fork.svg?react";
import ChatIcon from "@/assets/icons/chat.svg?react";
import Account from "@/assets/icons/account.svg?react";
import InstallPrompt from "@/components/InstallPrompt/InstallPrompt";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatTab = location.pathname === "/chat";

  return (
    <header>
      <p className={styles.appName}>Healthod</p>
      {isChatTab ? (
        <button className={styles.editBtn} aria-label="Новый чат">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
          </svg>
        </button>
      ) : (
        <div className={styles.layoutButtons}>
          <button className={styles.iconBtn} onClick={() => navigate("/communities")} aria-label="Сообщества">
            <span className="msym" style={{ fontSize: 22 }}>groups</span>
          </button>
          <button className={styles.iconBtn} onClick={() => navigate("/search")} aria-label="Поиск">
            <Search fill="var(--ink)" />
          </button>
          <Notification fill="var(--ink)" />
        </div>
      )}
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
      <FooterButton to="/chat" icon={<ChatIcon width={22} height={22} fill="currentColor" />}>
        Чаты
      </FooterButton>
      <FooterButton to="/profile" icon={<Account width={22} height={22} fill="currentColor" />}>
        Профиль
      </FooterButton>
    </footer>
  );
}

export default function Layout() {
  const location = useLocation();
  const isChatRoom = /^\/chat\/[^\/]+$/.test(location.pathname);

  return (
    <div className={`${styles.layout} ${isChatRoom ? styles.chatRoomLayout : ""}`}>
      {!isChatRoom && <Header />}
      <Outlet />
      {!isChatRoom && <InstallPrompt />}
      {!isChatRoom && <Footer />}
    </div>
  );
}
