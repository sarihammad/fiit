// Weight tracking API types and DTOs
import { z } from 'zod';

// Base schemas
export const WeightEntrySchema = z.object({
  id: z.string(),
  weightKg: z.number().min(20).max(500), // reasonable weight range
  date: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const WeightGoalSchema = z.object({
  id: z.string(),
  targetWeightKg: z.number().min(20).max(500),
  startWeightKg: z.number().min(20).max(500),
  startDate: z.string(),
  targetDate: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Request schemas
export const LogWeightRequestSchema = z.object({
  weightKg: z.number().min(20).max(500),
  date: z.string(),
  notes: z.string().optional(),
});

export const UpdateWeightRequestSchema = z.object({
  weightKg: z.number().min(20).max(500),
  notes: z.string().optional(),
});

export const SetWeightGoalRequestSchema = z.object({
  targetWeightKg: z.number().min(20).max(500),
  startWeightKg: z.number().min(20).max(500),
  startDate: z.string(),
  targetDate: z.string(),
});

// Response schemas
export const LogWeightResponseSchema = z.object({
  entry: WeightEntrySchema,
  progress: z.object({
    totalLoss: z.number(),
    weeklyLoss: z.number(),
    projectedGoalDate: z.string().optional(),
    isOnTrack: z.boolean(),
  }),
});

export const GetWeightEntriesResponseSchema = z.object({
  entries: z.array(WeightEntrySchema),
  currentWeight: z.number().optional(),
  goal: WeightGoalSchema.optional(),
  progress: z.object({
    totalLoss: z.number(),
    weeklyLoss: z.number(),
    projectedGoalDate: z.string().optional(),
    isOnTrack: z.boolean(),
  }),
  projections: z.array(
    z.object({
      date: z.string(),
      projectedWeight: z.number(),
    })
  ),
});

// Type exports
export type WeightEntry = z.infer<typeof WeightEntrySchema>;
export type WeightGoal = z.infer<typeof WeightGoalSchema>;
export type LogWeightRequest = z.infer<typeof LogWeightRequestSchema>;
export type UpdateWeightRequest = z.infer<typeof UpdateWeightRequestSchema>;
export type SetWeightGoalRequest = z.infer<typeof SetWeightGoalRequestSchema>;
export type LogWeightResponse = z.infer<typeof LogWeightResponseSchema>;
export type GetWeightEntriesResponse = z.infer<
  typeof GetWeightEntriesResponseSchema
>;
