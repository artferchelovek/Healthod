import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createWorkout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { title } = req.body;

    const workout = await prisma.workout.create({
      data: {
        title: title || `Workout ${new Date().toISOString()}`,
        userId: req.user.userId,
        totalCalories: 0,
      },
      include: {
        exercises: true,
      },
    });

    return res.status(201).json(workout);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getWorkouts = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const workouts = await prisma.workout.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        exercises: true,
      },
    });

    return res.json(workouts);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getWorkoutById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const workout = await prisma.workout.findUnique({
      where: {
        id,
      },
      include: {
        exercises: true,
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: "Workout not found",
      });
    }

    if (workout.userId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    return res.json(workout);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteWorkout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const workout = await prisma.workout.findUnique({
      where: {
        id,
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: "Workout not found",
      });
    }

    if (workout.userId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await prisma.workout.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Workout deleted",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
