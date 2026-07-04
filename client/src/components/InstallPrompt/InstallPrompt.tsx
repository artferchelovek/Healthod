import { useEffect, useState } from "react";
import styles from "./InstallPrompt.module.css";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const checkStandalone = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setShow(false);
      }
    };
    checkStandalone();

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="28" height="28" viewBox="0 0 512 512">
            <rect width="512" height="512" rx="96" fill="#587C5C"/>
            <path d="M256 128c-32-36-80-40-112-8s-32 88 0 128l112 120 112-120c32-40 32-88 0-128s-80-28-112 8z" fill="#fff" opacity="0.95"/>
          </svg>
        </div>
        <div className={styles.text}>
          <strong>Установите Healthod</strong>
          <span>Быстрый доступ с экрана телефона</span>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.dismissBtn} onClick={handleDismiss}>Не сейчас</button>
        <button className={styles.installBtn} onClick={handleInstall}>Установить</button>
      </div>
    </div>
  );
}
