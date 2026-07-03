import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createExercise = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const workoutId = req.params.id as string;
    const { name, sets, reps, durationSeconds, calories } = req.body;

    if (!name || !sets) {
      return res.status(400).json({
        error: "Name and sets are required",
      });
    }

    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
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

    const exercise = await prisma.exercise.create({
      data: {
        workoutId,
        name,
        sets,
        reps,
        durationSeconds,
        calories,
      },
    });

    await prisma.workout.update({
      where: { id: workoutId },
      data: {
        totalCalories: {
          increment: calories || 0,
        },
      },
    });

    return res.status(201).json(exercise);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateExercise = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;
    const { name, sets, reps, durationSeconds, calories } = req.body;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        workout: true,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        error: "Exercise not found",
      });
    }

    if (exercise.workout.userId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const oldCalories = exercise.calories || 0;
    const newCalories = calories ?? oldCalories;
    const diff = newCalories - oldCalories;

    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: {
        name,
        sets,
        reps,
        durationSeconds,
        calories,
      },
    });

    await prisma.workout.update({
      where: {
        id: exercise.workoutId,
      },
      data: {
        totalCalories: {
          increment: diff,
        },
      },
    });

    return res.json(updatedExercise);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteExercise = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        workout: true,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        error: "Exercise not found",
      });
    }

    if (exercise.workout.userId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await prisma.exercise.delete({
      where: { id },
    });

    await prisma.workout.update({
      where: {
        id: exercise.workoutId,
      },
      data: {
        totalCalories: {
          decrement: exercise.calories || 0,
        },
      },
    });

    return res.json({
      message: "Exercise deleted",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
