import styles from "./Main.module.css";
import PlusIcon from "@/assets/icons/plus.svg?react";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal/Modal";
import CreatePostForm from "./CreatePostForm";
import { api } from "@/logic/api.ts";
import PostCard from "@/components/PostCard/PostCard.tsx";
import type { PostWithAuthor } from "@/types/post.ts";

export default function Main() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);

  useEffect(() => {
    const getAllPosts = async () => {
      const response = await api.get("/posts");
      setPosts(response.data);
    };

    getAllPosts();
  }, []);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.posts}>
        {posts.length > 0 && posts.map((post) => <PostCard post={post} />)}
      </div>

      <button
        className={styles.fab}
        onClick={() => setIsModalOpen(true)}
        aria-label="Создать пост"
      >
        <PlusIcon width={24} height={24} />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Новая публикация"
      >
        <CreatePostForm onSubmitSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
