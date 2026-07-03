// Тип упражнения
export interface ExerciseType {
  id: string;
  workoutId: string;
  name: string;
  sets: number;
  reps: number | null;
  durationSeconds: number | null;
  calories: number | null;
}

// Тип тренировки со списком входящих в неё упражнений
export interface WorkoutWithExercises {
  id: string;
  title: string;
  totalCalories: number | null;
  userId: string;
  createdAt: string | Date;
  exercises: ExerciseType[];
}
