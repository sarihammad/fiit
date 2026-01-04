import { z } from 'zod';
import {
  MacroNutrientsSchema,
  MealPredictionSchema,
  MealPredictionResponseSchema,
  ConfirmMealRequestSchema,
  ConfirmMealResponseSchema,
  MealItemSchema,
  LogMealRequestSchema,
  LogMealResponseSchema,
} from './meals';

export {
  MacroNutrientsSchema,
  MealPredictionSchema,
  MealPredictionResponseSchema,
  ConfirmMealRequestSchema,
  ConfirmMealResponseSchema,
  MealItemSchema,
  LogMealRequestSchema,
  LogMealResponseSchema,
};

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// User schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: AuthTokensSchema,
  isNewUser: z.boolean().optional(),
});

export const SessionSchema = z.object({
  user: UserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),
  isAuthenticated: z.boolean(),
});

// Meal and nutrition schemas are sourced from ./meals

// Meal planning schemas
export const MealPlanDaySchema = z.object({
  date: z.string().date(),
  meals: z.array(z.object({
    id: z.string().optional(),
    label: z.string(),
    calories: z.number().optional(),
    nutrition: MacroNutrientsSchema.optional(),
  })),
});

export const MealPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  days: z.array(MealPlanDaySchema),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const GenerateMealPlanRequestSchema = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    cuisinePreferences: z.array(z.string()).optional(),
  }).optional(),
  goals: z.object({
    targetCalories: z.number().min(0),
    targetProtein: z.number().min(0),
    targetCarbs: z.number().min(0),
    targetFat: z.number().min(0),
  }),
});

// Feedback schemas
export const FeedbackContextSchema = z.object({
  date: z.string().date(),
  mealsLogged: z.number().min(0),
  weightLogged: z.boolean(),
  exerciseLogged: z.boolean(),
  sleepHours: z.number().min(0).max(24),
  stressLevel: z.number().min(1).max(5),
  mood: z.enum(['excellent', 'good', 'okay', 'poor', 'terrible']),
});

export const NutritionDataSchema = z.object({
  totalCalories: z.number().min(0),
  totalProtein: z.number().min(0),
  totalCarbs: z.number().min(0),
  totalFat: z.number().min(0),
  targetCalories: z.number().min(0),
  targetProtein: z.number().min(0),
  targetCarbs: z.number().min(0),
  targetFat: z.number().min(0),
});

export const WeightDataSchema = z.object({
  currentWeight: z.number().min(0),
  targetWeight: z.number().min(0),
  weeklyProgress: z.number(),
  isOnTrack: z.boolean(),
});

export const CoachFeedbackSchema = z.object({
  id: z.string(),
  date: z.string().date(),
  summary: z.string(),
  tomorrowTip: z.string(),
  proteinNote: z.string().optional(),
  hydrationNote: z.string().optional(),
  mood: z.enum(['celebratory', 'encouraging', 'supportive', 'motivating']),
  streak: z.number().min(0),
});

export const GenerateFeedbackRequestSchema = z.object({
  context: FeedbackContextSchema,
  nutritionData: NutritionDataSchema,
  weightData: WeightDataSchema.optional(),
});

// RevenueCat schemas
export const ProductSchema = z.object({
  identifier: z.string(),
  description: z.string(),
  title: z.string(),
  price: z.number(),
  priceString: z.string(),
  currencyCode: z.string(),
});

export const PackageSchema = z.object({
  identifier: z.string(),
  packageType: z.string(),
  product: ProductSchema,
});

export const OfferingSchema = z.object({
  identifier: z.string(),
  serverDescription: z.string(),
  availablePackages: z.array(PackageSchema),
});

export const EntitlementSchema = z.object({
  identifier: z.string(),
  isActive: z.boolean(),
  willRenew: z.boolean(),
  periodType: z.string(),
  latestPurchaseDate: z.string(),
  originalPurchaseDate: z.string(),
  expirationDate: z.string().optional(),
  store: z.string(),
  productIdentifier: z.string(),
  isSandbox: z.boolean(),
  unsubscribeDetectedAt: z.string().optional(),
  billingIssueDetectedAt: z.string().optional(),
});

export const CustomerInfoSchema = z.object({
  originalAppUserId: z.string(),
  firstSeen: z.string().datetime(),
  requestDate: z.string().datetime(),
  allPurchaseDates: z.record(z.string()),
  allExpirationDates: z.record(z.string()),
  allPurchasedProductIdentifiers: z.array(z.string()),
  nonSubscriptionTransactions: z.array(z.any()),
  activeSubscriptions: z.array(z.string()),
  entitlements: z.record(EntitlementSchema),
});

// Analytics schemas
export const AnalyticsEventSchema = z.object({
  name: z.string(),
  properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  timestamp: z.string().datetime().optional(),
});

// Error schemas
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type Session = z.infer<typeof SessionSchema>;

export type {
  MacroNutrients,
  MealPrediction,
  MealPredictionResponse,
  ConfirmMealRequest,
  ConfirmMealResponse,
  MealItem,
  LogMealRequest,
  LogMealResponse,
} from './meals';

export type MealPlanDay = z.infer<typeof MealPlanDaySchema>;
export type MealPlan = z.infer<typeof MealPlanSchema>;
export type GenerateMealPlanRequest = z.infer<typeof GenerateMealPlanRequestSchema>;

export type FeedbackContext = z.infer<typeof FeedbackContextSchema>;
export type NutritionData = z.infer<typeof NutritionDataSchema>;
export type WeightData = z.infer<typeof WeightDataSchema>;
export type CoachFeedback = z.infer<typeof CoachFeedbackSchema>;
export type GenerateFeedbackRequest = z.infer<typeof GenerateFeedbackRequestSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type Package = z.infer<typeof PackageSchema>;
export type Offering = z.infer<typeof OfferingSchema>;
export type Entitlement = z.infer<typeof EntitlementSchema>;
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Validation helpers
export function validateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${message}`);
    }
    throw error;
  }
}

export function safeValidateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${message}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}
