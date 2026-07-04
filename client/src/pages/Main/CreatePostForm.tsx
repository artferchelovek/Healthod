import React, { useState, useRef } from "react";
import styles from "./Main.module.css";
import { api } from "@/logic/api";

interface CreatePostFormProps {
  onSubmitSuccess: () => void;
}

interface FileEntry {
  id: string;
  file: File;
  previewUrl: string;
  uploadUrl: string;
  uploading: boolean;
  error: boolean;
}

const FILE_ICONS: Record<string, string> = {
  "image": "image",
  "video": "videocam",
  "audio": "music_note",
  "pdf": "picture_as_pdf",
  "text": "description",
  "archive": "folder_zip",
  "default": "insert_drive_file",
};

function getFileCategory(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("text/")) return "text";
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar") || mime.includes("7z") || mime.includes("gzip")) return "archive";
  return "default";
}

function getFileIcon(mime: string): string {
  return FILE_ICONS[getFileCategory(mime)] || FILE_ICONS.default;
}

export default function CreatePostForm({ onSubmitSuccess }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasUploading = files.some((f) => f.uploading);
  const uploadedUrls = files.filter((f) => f.uploadUrl).map((f) => f.uploadUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    const newFiles: FileEntry[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = `${Date.now()}-${i}`;
      newFiles.push({
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        uploadUrl: "",
        uploading: true,
        error: false,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      const response = await api.post("/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const urls: string[] = response.data.images || [];
      setFiles((prev) => {
        let urlIdx = 0;
        return prev.map((f) =>
          f.uploading && urlIdx < urls.length
            ? { ...f, uploadUrl: urls[urlIdx++], uploading: false }
            : f,
        );
      });
    } catch (err: any) {
      console.error("Ошибка загрузки файлов:", err);
      setError(err.response?.data?.error || "Не удалось загрузить файлы");
      setFiles((prev) =>
        prev.map((f) => (f.uploading ? { ...f, uploading: false, error: true } : f)),
      );
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Содержимое публикации не может быть пустым");
      return;
    }

    if (hasUploading) {
      setError("Пожалуйста, подождите завершения загрузки файлов");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post("/posts", {
        title: title.trim() || null,
        content: content.trim(),
        type: "TEXT",
        images: uploadedUrls,
      });

      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setTitle("");
      setContent("");
      setFiles([]);
      onSubmitSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Произошла ошибка при создании публикации");
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = (entry: FileEntry) => {
    const cat = getFileCategory(entry.file.type);

    if (cat === "image") {
      return (
        <div className={styles.filePreviewCard} key={entry.id}>
          <img src={entry.previewUrl} className={styles.filePreviewImage} alt="" />
          {entry.uploading && <div className={styles.uploadOverlay}>Загрузка...</div>}
          {!entry.uploading && (
            <button type="button" className={styles.removeFileBtn} onClick={() => handleRemoveFile(entry.id)}>&times;</button>
          )}
        </div>
      );
    }

    if (cat === "video") {
      return (
        <div className={styles.filePreviewCard} key={entry.id}>
          <video src={entry.previewUrl} className={styles.filePreviewVideo} controls />
          {entry.uploading && <div className={styles.uploadOverlay}>Загрузка...</div>}
          {!entry.uploading && (
            <button type="button" className={styles.removeFileBtn} onClick={() => handleRemoveFile(entry.id)}>&times;</button>
          )}
        </div>
      );
    }

    if (cat === "audio") {
      return (
        <div className={`${styles.filePreviewCard} ${styles.filePreviewAudioCard}`} key={entry.id}>
          <span className={`msym ${styles.fileAudioIcon}`}>music_note</span>
          <span className={styles.filePreviewName}>{entry.file.name}</span>
          <audio src={entry.previewUrl} controls className={styles.filePreviewAudio} />
          {!entry.uploading && (
            <button type="button" className={styles.removeFileBtn} onClick={() => handleRemoveFile(entry.id)}>&times;</button>
          )}
        </div>
      );
    }

    return (
      <div className={`${styles.filePreviewCard} ${styles.filePreviewDocCard}`} key={entry.id}>
        <span className={`msym ${styles.fileDocIcon}`}>{getFileIcon(entry.file.type)}</span>
        <span className={styles.filePreviewName}>{entry.file.name}</span>
        {entry.uploading && <span className={styles.uploadingLabel}>Загрузка...</span>}
        {!entry.uploading && (
          <button type="button" className={styles.removeFileBtn} onClick={() => handleRemoveFile(entry.id)}>&times;</button>
        )}
      </div>
    );
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

      <div className={styles.fieldGroup}>
        <label>Файлы</label>

        {files.length > 0 && (
          <div className={styles.filePreviewGrid}>
            {files.map(renderPreview)}
          </div>
        )}

        <label className={styles.fileInputLabel}>
          <span className="msym" style={{ fontSize: 20 }}>add_photo_alternate</span>
          <span>Выбрать файлы</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        </label>
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={loading || hasUploading || files.some((f) => f.uploading)}
      >
        {loading ? "Публикация..." : "Опубликовать"}
      </button>
    </form>
  );
}
