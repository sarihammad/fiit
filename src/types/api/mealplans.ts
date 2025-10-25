// Meal planning API types and DTOs
import { z } from 'zod';

// Base schemas
export const MealPlanItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.number().min(0), // minutes
  cookTime: z.number().min(0), // minutes
  servings: z.number().min(1),
  macros: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
  }),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()),
});

export const MealPlanDaySchema = z.object({
  date: z.string(),
  breakfast: MealPlanItemSchema.optional(),
  lunch: MealPlanItemSchema.optional(),
  dinner: MealPlanItemSchema.optional(),
  snacks: z.array(MealPlanItemSchema),
  dailyTotals: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
  }),
});

export const MealPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  duration: z.number().min(1), // days
  days: z.array(MealPlanDaySchema),
  totalCalories: z.number().min(0),
  averageProtein: z.number().min(0),
  averageCarbs: z.number().min(0),
  averageFat: z.number().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Request schemas
export const GenerateMealPlanRequestSchema = z.object({
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()),
    allergies: z.array(z.string()),
    cuisinePreferences: z.array(z.string()),
    cookingTime: z.enum(['quick', 'moderate', 'extensive']),
    budget: z.enum(['low', 'medium', 'high']),
  }),
  goals: z.object({
    targetCalories: z.number().min(1000).max(4000),
    targetProtein: z.number().min(50).max(300),
    targetCarbs: z.number().min(100).max(500),
    targetFat: z.number().min(30).max(150),
  }),
  duration: z.number().min(1).max(30), // days
  startDate: z.string(),
});

export const UpdateMealPlanRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  days: z.array(MealPlanDaySchema).optional(),
});

// Response schemas
export const GenerateMealPlanResponseSchema = z.object({
  mealPlan: MealPlanSchema,
  shoppingList: z.array(
    z.object({
      ingredient: z.string(),
      quantity: z.string(),
      category: z.string(),
      estimatedCost: z.number().optional(),
    })
  ),
  nutritionSummary: z.object({
    totalCalories: z.number(),
    averageProtein: z.number(),
    averageCarbs: z.number(),
    averageFat: z.number(),
    fiber: z.number(),
    sugar: z.number(),
    sodium: z.number(),
  }),
});

export const GetMealPlansResponseSchema = z.object({
  mealPlans: z.array(MealPlanSchema),
  currentPlan: MealPlanSchema.optional(),
});

// Type exports
export type MealPlanItem = z.infer<typeof MealPlanItemSchema>;
export type MealPlanDay = z.infer<typeof MealPlanDaySchema>;
export type MealPlan = z.infer<typeof MealPlanSchema>;
export type GenerateMealPlanRequest = z.infer<
  typeof GenerateMealPlanRequestSchema
>;
export type UpdateMealPlanRequest = z.infer<typeof UpdateMealPlanRequestSchema>;
export type GenerateMealPlanResponse = z.infer<
  typeof GenerateMealPlanResponseSchema
>;
export type GetMealPlansResponse = z.infer<typeof GetMealPlansResponseSchema>;
