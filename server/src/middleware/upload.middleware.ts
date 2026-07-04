import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIMES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp",
  "video/mp4", "video/mpeg", "video/webm", "video/quicktime", "video/x-msvideo",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/flac", "audio/webm",
  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv", "application/json", "application/zip", "application/x-zip-compressed",
  "application/x-rar-compressed", "application/x-7z-compressed", "application/gzip",
];

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

export const uploadMultiple = upload.array("files", 10);
export const uploadSingle = upload.single("file");
