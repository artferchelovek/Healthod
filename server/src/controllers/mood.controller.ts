import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkAndUnlockAchievements } from "./achievement.controller";

export const createMoodLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { mood, note } = req.body;

    if (!mood) {
      return res.status(400).json({ error: "Mood is required" });
    }

    const validMoods = ["HAPPY", "SAD", "STRESSED", "TIRED", "CALM", "MOTIVATED"];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: "Invalid mood value" });
    }

    const moodLog = await prisma.moodLog.create({
      data: {
        userId: req.user.userId,
        mood,
        note,
      },
    });

    checkAndUnlockAchievements(req.user.userId);

    return res.status(201).json(moodLog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyMoodLogs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { period } = req.query;

    let dateFilter: Date | undefined;
    if (period === "week") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === "month") {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const where: any = { userId: req.user.userId };
    if (dateFilter) {
      where.createdAt = { gte: dateFilter };
    }

    const moodLogs = await prisma.moodLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.json(moodLogs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMoodLogById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id;
    const moodLog = await prisma.moodLog.findUnique({ where: { id } });

    if (!moodLog) {
      return res.status(404).json({ error: "Mood log not found" });
    }

    if (moodLog.userId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json(moodLog);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMoodLog = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id;
    const moodLog = await prisma.moodLog.findUnique({ where: { id } });

    if (!moodLog) {
      return res.status(404).json({ error: "Mood log not found" });
    }

    if (moodLog.userId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.moodLog.delete({ where: { id } });

    return res.json({ message: "Mood log deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
