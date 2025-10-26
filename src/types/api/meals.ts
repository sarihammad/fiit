// Meal logging API types and DTOs
import { z } from 'zod';

// Base schemas
export const MacroNutrientsSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
});

export const MealItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string(),
  macros: MacroNutrientsSchema,
  timestamp: z.string(),
  source: z.enum(['manual', 'vision', 'search']),
  imageUrl: z.string().optional(),
});

export const MealLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  items: z.array(MealItemSchema),
  totals: MacroNutrientsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Request schemas
export const LogMealRequestSchema = z.object({
  date: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  items: z.array(MealItemSchema.omit({ id: true, timestamp: true })),
});

export const UpdateMealRequestSchema = z.object({
  items: z.array(MealItemSchema.omit({ id: true, timestamp: true })),
});

export const DeleteMealRequestSchema = z.object({
  mealId: z.string(),
});

// Response schemas
export const LogMealResponseSchema = z.object({
  meal: MealLogSchema,
  dailyTotals: MacroNutrientsSchema,
  weeklyProgress: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
});

export const GetMealsResponseSchema = z.object({
  meals: z.array(MealLogSchema),
  dailyTotals: MacroNutrientsSchema,
  weeklyProgress: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
});

// Vision API schemas
export const MealPredictionSchema = z.object({
  label: z.string(),
  confidence: z.number().min(0).max(1),
  nutrition: MacroNutrientsSchema.optional(),
  fdcId: z.number().optional(),
});

export const MealPredictionResponseSchema = z.object({
  predictions: z.array(MealPredictionSchema),
  decision: z.enum(['auto_accept', 'confirm', 'fallback']),
  processingTime: z.number(),
  modelVersion: z.string().optional(),
});

export const ConfirmMealRequestSchema = z.object({
  predictionId: z.string(),
  selectedLabel: z.string(),
  portionSize: z.number().min(0),
  adjustments: z
    .object({
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    })
    .optional(),
});

export const ConfirmMealResponseSchema = z.object({
  mealItem: MealItemSchema,
  dailyTotals: MacroNutrientsSchema,
});

// Type exports
export type MacroNutrients = z.infer<typeof MacroNutrientsSchema>;
export type MealItem = z.infer<typeof MealItemSchema>;
export type MealLog = z.infer<typeof MealLogSchema>;
export type LogMealRequest = z.infer<typeof LogMealRequestSchema>;
export type UpdateMealRequest = z.infer<typeof UpdateMealRequestSchema>;
export type DeleteMealRequest = z.infer<typeof DeleteMealRequestSchema>;
export type LogMealResponse = z.infer<typeof LogMealResponseSchema>;
export type GetMealsResponse = z.infer<typeof GetMealsResponseSchema>;
export type MealPrediction = z.infer<typeof MealPredictionSchema>;
export type MealPredictionResponse = z.infer<
  typeof MealPredictionResponseSchema
>;
export type ConfirmMealRequest = z.infer<typeof ConfirmMealRequestSchema>;
export type ConfirmMealResponse = z.infer<typeof ConfirmMealResponseSchema>;
