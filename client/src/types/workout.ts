import type { Prisma } from "@prisma-types";

// Тип тренировки со списком входящих в неё упражнений
export type WorkoutWithExercises = Prisma.WorkoutGetPayload<{
  include: {
    exercises: true;
  };
}>;

// Тип упражнения
export type ExerciseType = Prisma.ExerciseGetPayload<{}>;
