// Zod schemas for AI response validation
import { z } from 'zod';

// Meal Plan Schemas
export const MealItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
  fiber: z.number().min(0).max(100).optional(),
  quantity: z.string(),
  when: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  timestamp: z.string(),
  source: z.literal('ai'),
});

export const MealPlanMealSchema = z.object({
  when: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  items: z.array(MealItemSchema),
  recipeName: z.string().optional(),
  prepTimeMins: z.number().min(0).max(180).optional(),
  cookTimeMins: z.number().min(0).max(240).optional(),
  instructions: z.array(z.string()).optional(),
});

export const MealPlanDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meals: z.array(MealPlanMealSchema),
  dailyTotals: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
  }),
});

export const GroceryItemSchema = z.object({
  name: z.string(),
  qty: z.string(),
  category: z.string().optional(),
  note: z.string().optional(),
});

export const MealPlanResponseSchema = z.object({
  id: z.string(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(MealPlanDaySchema).length(7),
  groceryList: z.array(GroceryItemSchema),
  createdAt: z.string(),
});

// Feedback Schemas
export const CoachFeedbackSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summary: z.string().min(10).max(500),
  tomorrowTip: z.string().min(10).max(300),
  proteinNote: z.string().max(200).optional().nullable(),
  carbsNote: z.string().max(200).optional().nullable(),
  hydrationNote: z.string().max(200).optional().nullable(),
  calorieNote: z.string().max(200).optional().nullable(),
  mood: z.enum(['encouraging', 'supportive', 'analytical', 'celebratory']),
  streak: z.number().min(0).optional(),
});

// Validation helpers
export function validateMealPlan(
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<typeof MealPlanResponseSchema>> {
  return MealPlanResponseSchema.safeParse(data);
}

export function validateFeedback(
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<typeof CoachFeedbackSchema>> {
  return CoachFeedbackSchema.safeParse(data);
}

// Type exports
export type ValidatedMealPlan = z.infer<typeof MealPlanResponseSchema>;
export type ValidatedFeedback = z.infer<typeof CoachFeedbackSchema>;
