export interface FoodLogType {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  createdAt: string;
}

export interface FoodDiaryResponse {
  summary: {
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
  };
  foods: FoodLogType[];
}
