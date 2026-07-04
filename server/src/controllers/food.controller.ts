import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createFood = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { mealType, foodName, protein, fats, carbs, calories } = req.body;

    if (
      !mealType ||
      !foodName ||
      protein === undefined ||
      fats === undefined ||
      carbs === undefined ||
      calories === undefined
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const food = await prisma.foodLog.create({
      data: {
        userId: req.user.userId,
        mealType,
        foodName,
        protein,
        fats,
        carbs,
        calories,
      },
    });

    return res.status(201).json(food);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getTodayFood = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const foods = await prisma.foodLog.findMany({
      where: {
        userId: req.user.userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const summary = foods.reduce(
      (acc, food) => {
        acc.calories += food.calories;
        acc.protein += food.protein;
        acc.fats += food.fats;
        acc.carbs += food.carbs;
        return acc;
      },
      {
        calories: 0,
        protein: 0,
        fats: 0,
        carbs: 0,
      },
    );

    return res.json({
      summary,
      foods,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const updateFood = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const food = await prisma.foodLog.findUnique({
      where: {
        id,
      },
    });

    if (!food) {
      return res.status(404).json({
        error: "Food record not found",
      });
    }

    if (food.userId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    const updatedFood = await prisma.foodLog.update({
      where: {
        id,
      },
      data: req.body,
    });

    return res.json(updatedFood);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const deleteFood = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const id = req.params.id as string;

    const food = await prisma.foodLog.findUnique({
      where: {
        id,
      },
    });

    if (!food) {
      return res.status(404).json({
        error: "Food record not found",
      });
    }

    if (food.userId !== req.user.userId) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    await prisma.foodLog.delete({
      where: {
        id,
      },
    });

    return res.json({
      message: "Food deleted",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
