import React, { useState } from "react";
import styles from "./Main.module.css";
import { api } from "@/logic/api";

interface CreatePostFormProps {
  onSubmitSuccess: () => void;
}

export default function CreatePostForm({ onSubmitSuccess }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Состояния для загрузки изображения
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Показываем локальное превью
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploading(true);
    setError(null);

    // Формируем FormData для отправки файла на бэкенд
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Сохраняем полученный от бэкенда путь к файлу
      setImageUrl(response.data.imageUrl);
    } catch (err: any) {
      console.error("Ошибка загрузки изображения:", err);
      setError(err.response?.data?.error || "Не удалось загрузить изображение");
      // В случае ошибки сбрасываем превью
      setImagePreview(null);
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl("");
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Содержимое публикации не может быть пустым");
      return;
    }

    if (uploading) {
      setError("Пожалуйста, подождите завершения загрузки изображения");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: title.trim() || null,
        content: content.trim(),
        type: "TEXT",
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
      };

      await api.post("/posts", payload);

      setTitle("");
      setContent("");
      setImageUrl("");
      setImagePreview(null);
      onSubmitSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Произошла ошибка при создании публикации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreatePost} className={styles.postForm}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.fieldGroup}>
        <label htmlFor="post-title">Заголовок</label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название (необязательно)..."
          className={styles.textInput}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="post-content">Текст публикации</label>
        <textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Расскажите о вашей тренировке, питании или настроении..."
          className={styles.textareaInput}
          rows={4}
          required
        />
      </div>

      {/* Поле выбора и превью изображения */}
      <div className={styles.fieldGroup}>
        <label>Изображение публикации</label>
        
        {imagePreview ? (
          <div className={styles.previewContainer}>
            <img src={imagePreview} className={styles.imagePreview} alt="Превью" />
            {uploading ? (
              <div className={styles.uploadOverlay}>Загрузка...</div>
            ) : (
              <button 
                type="button" 
                className={styles.removeImageBtn} 
                onClick={handleRemoveImage}
                aria-label="Удалить картинку"
              >
                &times;
              </button>
            )}
          </div>
        ) : (
          <label className={styles.fileInputLabel}>
            <span>Выбрать фото с устройства</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </label>
        )}
      </div>

      <button 
        type="submit" 
        className={styles.submitBtn} 
        disabled={loading || uploading}
      >
        {loading ? "Публикация..." : "Опубликовать"}
      </button>
    </form>
  );
}
