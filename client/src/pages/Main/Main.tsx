import styles from "./Main.module.css";
import PlusIcon from "@/assets/icons/plus.svg?react";

export default function Main() {
  const handleCreatePost = () => {
    console.log("Create post clicked");
    // В будущем здесь можно открывать модальное окно или делать редирект
  };

  return (
    <div className={styles.mainContainer}>
      <p>главная типа</p>

      <button
        className={styles.fab}
        onClick={handleCreatePost}
        aria-label="Создать пост"
      >
        <PlusIcon width={24} height={24} />
      </button>
    </div>
  );
}
