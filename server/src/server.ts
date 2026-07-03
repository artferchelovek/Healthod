import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import authRoutes from "./routes/auth.routes";
import postRoutes from "./routes/post.routes";
import commentRoutes from "./routes/comment.routes";
import exerciseRoutes from "./routes/exercise.routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import workoutRoutes from "./routes/workout.routes";
import { loggerMiddleware } from "./middleware/logger.middleware";
import path from "path";
import uploadRoutes from "./routes/upload.routes";
import foodRoutes from "./routes/food.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(loggerMiddleware);
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }),
);
app.get("/docs-json", (_, res) => {
  res.json(swaggerSpec);
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/food", foodRoutes);

const uploadsPath = path.join(__dirname, "../uploads");

console.log("Uploads path:", uploadsPath);

app.use("/uploads", express.static(uploadsPath));

app.get("/api", (_, res) => {
  res.json({
    health: "ok",
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Prisma connected");

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
