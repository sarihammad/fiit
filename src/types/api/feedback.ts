// Feedback API types and DTOs
import { z } from 'zod';

// Base schemas
export const CoachFeedbackSchema = z.object({
  id: z.string(),
  date: z.string(),
  summary: z.string(),
  tomorrowTip: z.string(),
  mood: z.enum(['encouraging', 'supportive', 'analytical', 'celebratory']),
  proteinNote: z.string().optional(),
  carbsNote: z.string().optional(),
  fatNote: z.string().optional(),
  hydrationNote: z.string().optional(),
  calorieNote: z.string().optional(),
  weightNote: z.string().optional(),
  exerciseNote: z.string().optional(),
  sleepNote: z.string().optional(),
  stressNote: z.string().optional(),
  nextBestAction: z.object({
    title: z.string(),
    description: z.string(),
    actionType: z.enum([
      'log_meal',
      'plan_meal',
      'add_weight',
      'view_feedback',
      'exercise',
    ]),
    priority: z.enum(['low', 'medium', 'high']),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Request schemas
export const GenerateFeedbackRequestSchema = z.object({
  date: z.string(),
  context: z.object({
    mealsLogged: z.number().min(0),
    weightLogged: z.boolean(),
    exerciseLogged: z.boolean(),
    sleepHours: z.number().min(0).max(24).optional(),
    stressLevel: z.number().min(1).max(10).optional(),
    mood: z.enum(['great', 'good', 'okay', 'poor', 'terrible']).optional(),
  }),
  nutritionData: z.object({
    totalCalories: z.number().min(0),
    totalProtein: z.number().min(0),
    totalCarbs: z.number().min(0),
    totalFat: z.number().min(0),
    targetCalories: z.number().min(0),
    targetProtein: z.number().min(0),
    targetCarbs: z.number().min(0),
    targetFat: z.number().min(0),
  }),
  weightData: z
    .object({
      currentWeight: z.number().min(0),
      targetWeight: z.number().min(0),
      weeklyProgress: z.number(),
      isOnTrack: z.boolean(),
    })
    .optional(),
});

// Response schemas
export const GenerateFeedbackResponseSchema = z.object({
  feedback: CoachFeedbackSchema,
  insights: z.array(
    z.object({
      type: z.enum(['nutrition', 'weight', 'behavior', 'motivation']),
      title: z.string(),
      description: z.string(),
      actionable: z.boolean(),
    })
  ),
  recommendations: z.array(
    z.object({
      category: z.enum([
        'nutrition',
        'exercise',
        'sleep',
        'stress',
        'hydration',
      ]),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    })
  ),
});

export const GetFeedbackResponseSchema = z.object({
  feedback: z.array(CoachFeedbackSchema),
  latestFeedback: CoachFeedbackSchema.optional(),
  weeklyInsights: z.object({
    averageCalories: z.number(),
    averageProtein: z.number(),
    averageCarbs: z.number(),
    averageFat: z.number(),
    weightChange: z.number(),
    consistencyScore: z.number().min(0).max(100),
  }),
});

// Type exports
export type CoachFeedback = z.infer<typeof CoachFeedbackSchema>;
export type GenerateFeedbackRequest = z.infer<
  typeof GenerateFeedbackRequestSchema
>;
export type GenerateFeedbackResponse = z.infer<
  typeof GenerateFeedbackResponseSchema
>;
export type GetFeedbackResponse = z.infer<typeof GetFeedbackResponseSchema>;
