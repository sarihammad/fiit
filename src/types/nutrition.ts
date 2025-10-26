// FIIT Nutrition Types

export type DietPreference =
  | 'balanced'
  | 'high_protein'
  | 'low_carb'
  | 'keto'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type Sex = 'male' | 'female' | 'other';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'scan' | 'search' | 'ai';

export interface UserGoals {
  startWeightKg?: number;
  currentWeightKg?: number;
  goalWeightKg?: number;
  heightCm?: number;
  sex?: Sex;
  age?: number;
  activity: ActivityLevel;
  dietPreference: DietPreference;
  allergies: string[];
  budgetLevel: BudgetLevel;
  timeToCookMins: number; // avg per meal
  timeframeDays?: number; // e.g., 30, 60, 90 days
  dailyCalorieTarget?: number; // computed if missing
  proteinTargetGrams?: number;
  carbTargetGrams?: number;
  fatTargetGrams?: number;
}

export interface MealItem {
  id: string;
  name: string;
  photoUri?: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  brand?: string;
  quantity?: string; // "1 cup", "150g"
  portion?: {
    // For portion adjustments
    unit: string;
    amount: number;
  };
  when: MealTime;
  timestamp: string; // ISO format
  source: FoodSource;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  meals: MealItem[];
  totals: MacroTotals;
}

export interface GroceryItem {
  name: string;
  qty: string;
  note?: string;
  category?: string; // "produce", "protein", "dairy", etc.
}

export interface MealPlanMeal {
  when: MealTime;
  items: MealItem[];
  recipeName?: string;
  prepTimeMins?: number;
  cookTimeMins?: number;
  instructions?: string[];
}

export interface MealPlanDay {
  date: string; // YYYY-MM-DD
  meals: MealPlanMeal[];
  dailyTotals: MacroTotals;
}

export interface MealPlan {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  days: MealPlanDay[];
  groceryList: GroceryItem[];
  createdAt: string; // ISO
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
  note?: string;
}

export interface WeightProjection {
  projected: WeightEntry[];
  slope: number; // kg per day
  onTrack: boolean;
  daysToGoal?: number;
}

export interface CoachFeedback {
  id: string;
  date: string; // YYYY-MM-DD
  summary: string;
  tomorrowTip: string;
  proteinNote?: string;
  carbsNote?: string;
  hydrationNote?: string;
  calorieNote?: string;
  mood: 'encouraging' | 'supportive' | 'analytical' | 'celebratory';
  streak?: number; // consecutive days logged
}

// AI Service Request/Response Types

export interface MealPlanRequest {
  goals: UserGoals;
  weekStartISO: string;
  excludeFoods?: string[]; // additional exclusions beyond allergies
  preferredCuisines?: string[];
}

export interface MealPlanResponse {
  plan: MealPlan;
  confidence: number;
}

export interface FeedbackRequest {
  dayLog: DayLog;
  goals: UserGoals;
  previousFeedback?: CoachFeedback[];
  streak?: number;
}

export interface FeedbackResponse extends CoachFeedback {}

// New Food Recognition Types for ViT Classifier
export interface TopKPrediction {
  label: string;
  prob: number; // 0..1
}

export interface FoodRecognitionResult {
  topk: TopKPrediction[];
  decision: 'auto_accept' | 'confirm' | 'fallback';
  nutrition?: {
    fdcId?: number;
    description?: string;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null;
  // for our UI
  error?: string;
}

// Legacy interface for backward compatibility
export interface LegacyFoodRecognitionResult {
  items: MealItem[];
  confidence: number;
  needsManualReview: boolean;
}

export interface FoodSearchResult {
  items: MealItem[];
  source: 'nutritionix' | 'local_db';
}

// Utility Types

export interface MacroProgress {
  current: number;
  target: number;
  percentage: number;
  remaining: number;
  status: 'under' | 'on_track' | 'over';
}

export interface DailyProgress {
  calories: MacroProgress;
  protein: MacroProgress;
  carbs: MacroProgress;
  fat: MacroProgress;
}

export interface NutritionStats {
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalDaysLogged: number;
  streak: number;
  complianceRate: number; // % of days within calorie target
}

// Helper function types for calculations
export type BMRCalculator = (
  weight: number,
  height: number,
  age: number,
  sex: Sex
) => number;
export type TDEECalculator = (bmr: number, activity: ActivityLevel) => number;
export type MacroCalculator = (
  tdee: number,
  dietPreference: DietPreference
) => {
  protein: number;
  carbs: number;
  fat: number;
};
