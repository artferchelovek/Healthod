import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createHealthMetric = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { steps, heartRate, caloriesBurned, sleepHours, source, recordedAt } = req.body;

    if (!source) {
      return res.status(400).json({ error: "Source is required" });
    }

    const validSources = ["APPLE_HEALTH", "SAMSUNG_HEALTH", "MI_FITNESS", "MANUAL"];
    if (!validSources.includes(source)) {
      return res.status(400).json({ error: "Invalid source value" });
    }

    if (!steps && !heartRate && !caloriesBurned && !sleepHours) {
      return res.status(400).json({ error: "At least one metric is required" });
    }

    const metric = await prisma.healthMetric.create({
      data: {
        userId: req.user.userId,
        steps: steps || null,
        heartRate: heartRate || null,
        caloriesBurned: caloriesBurned || null,
        sleepHours: sleepHours || null,
        source,
        ...(recordedAt && { recordedAt: new Date(recordedAt) }),
      },
    });

    return res.status(201).json(metric);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyHealthMetrics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { period, source, limit } = req.query;

    const where: any = { userId: req.user.userId };

    if (source && typeof source === "string") {
      where.source = source;
    }

    if (period === "week") {
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
      where.recordedAt = { gte: dateFilter };
    } else if (period === "month") {
      const dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
      where.recordedAt = { gte: dateFilter };
    } else if (period === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.recordedAt = { gte: start };
    }

    const take = limit && typeof limit === "string" ? parseInt(limit, 10) : undefined;

    const metrics = await prisma.healthMetric.findMany({
      where,
      orderBy: { recordedAt: "desc" },
      ...(take && { take }),
    });

    return res.json(metrics);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getLatestHealthMetrics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const latestSteps = await prisma.healthMetric.findFirst({
      where: { userId: req.user.userId, steps: { not: null } },
      orderBy: { recordedAt: "desc" },
      select: { steps: true, recordedAt: true, source: true },
    });

    const latestHeartRate = await prisma.healthMetric.findFirst({
      where: { userId: req.user.userId, heartRate: { not: null } },
      orderBy: { recordedAt: "desc" },
      select: { heartRate: true, recordedAt: true, source: true },
    });

    const latestCaloriesBurned = await prisma.healthMetric.findFirst({
      where: { userId: req.user.userId, caloriesBurned: { not: null } },
      orderBy: { recordedAt: "desc" },
      select: { caloriesBurned: true, recordedAt: true, source: true },
    });

    const latestSleep = await prisma.healthMetric.findFirst({
      where: { userId: req.user.userId, sleepHours: { not: null } },
      orderBy: { recordedAt: "desc" },
      select: { sleepHours: true, recordedAt: true, source: true },
    });

    return res.json({
      steps: latestSteps || null,
      heartRate: latestHeartRate || null,
      caloriesBurned: latestCaloriesBurned || null,
      sleepHours: latestSleep || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getHealthMetricById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id as string;
    const metric = await prisma.healthMetric.findUnique({ where: { id } });

    if (!metric) {
      return res.status(404).json({ error: "Health metric not found" });
    }

    if (metric.userId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json(metric);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteHealthMetric = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const id = req.params.id as string;
    const metric = await prisma.healthMetric.findUnique({ where: { id } });

    if (!metric) {
      return res.status(404).json({ error: "Health metric not found" });
    }

    if (metric.userId !== req.user.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.healthMetric.delete({ where: { id } });

    return res.json({ message: "Health metric deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
