import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must be less than 50 characters');

export const ageSchema = z
  .number()
  .min(18, 'You must be at least 18 years old')
  .max(100, 'Please enter a valid age');

export const heightSchema = z
  .number()
  .min(100, 'Height must be at least 100 cm')
  .max(250, 'Height must be less than 250 cm');

export const weightSchema = z
  .number()
  .min(30, 'Weight must be at least 30 kg')
  .max(300, 'Weight must be less than 300 kg');

// Onboarding validation schemas
export const goalSchema = z.enum(
  ['get_matches', 'glow_up', 'confidence', 'text_better'],
  {
    required_error: 'Please select a goal',
  }
);

export const genderSchema = z.enum(['male', 'female', 'other'], {
  required_error: 'Please select your gender',
});

export const biometricsSchema = z.object({
  height: heightSchema,
  weight: weightSchema,
  age: ageSchema,
  unit: z.enum(['metric', 'imperial']),
});

export const habitsSchema = z.object({
  sleepHours: z.number().min(4).max(12),
  dailySteps: z.number().min(1000).max(50000),
  alcoholConsumption: z.enum(['none', 'occasional', 'moderate', 'heavy']),
});

// Profile validation schemas
export const bioSchema = z.object({
  text: z
    .string()
    .min(10, 'Bio must be at least 10 characters')
    .max(500, 'Bio must be less than 500 characters'),
  interests: z
    .array(z.string())
    .min(1, 'Please add at least one interest')
    .max(10, 'Maximum 10 interests allowed'),
  occupation: z.string().optional(),
  location: z.string().optional(),
});

export const profileImageSchema = z.object({
  id: z.string(),
  uri: z.string().url('Please provide a valid image URL'),
  type: z.enum(['profile', 'lifestyle', 'social']),
});

// Chat validation schemas
export const messageSchema = z.object({
  text: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long'),
});

// Form validation helpers
export class ValidationUtils {
  // Validate email
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    try {
      emailSchema.parse(email);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid email' };
    }
  }

  // Validate password
  static validatePassword(password: string): {
    isValid: boolean;
    error?: string;
  } {
    try {
      passwordSchema.parse(password);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid password' };
    }
  }

  // Validate age
  static validateAge(age: number): { isValid: boolean; error?: string } {
    try {
      ageSchema.parse(age);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid age' };
    }
  }

  // Validate height
  static validateHeight(
    height: number,
    unit: 'metric' | 'imperial' = 'metric'
  ): { isValid: boolean; error?: string } {
    try {
      if (unit === 'imperial') {
        // Convert inches to cm for validation
        const heightCm = height * 2.54;
        heightSchema.parse(heightCm);
      } else {
        heightSchema.parse(height);
      }
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid height' };
    }
  }

  // Validate weight
  static validateWeight(
    weight: number,
    unit: 'metric' | 'imperial' = 'metric'
  ): { isValid: boolean; error?: string } {
    try {
      if (unit === 'imperial') {
        // Convert lbs to kg for validation
        const weightKg = weight * 0.453592;
        weightSchema.parse(weightKg);
      } else {
        weightSchema.parse(weight);
      }
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid weight' };
    }
  }

  // Validate bio
  static validateBio(bio: string): { isValid: boolean; error?: string } {
    try {
      bioSchema.shape.text.parse(bio);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid bio' };
    }
  }

  // Validate interests
  static validateInterests(interests: string[]): {
    isValid: boolean;
    error?: string;
  } {
    try {
      bioSchema.shape.interests.parse(interests);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid interests' };
    }
  }

  // Validate message
  static validateMessage(message: string): {
    isValid: boolean;
    error?: string;
  } {
    try {
      messageSchema.shape.text.parse(message);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.errors[0]?.message || 'Validation failed',
        };
      }
      return { isValid: false, error: 'Invalid message' };
    }
  }

  // Get field error from form errors
  static getFieldError(errors: any, fieldName: string): string | undefined {
    return errors?.[fieldName]?.message;
  }

  // Check if form is valid
  static isFormValid(errors: any): boolean {
    return !errors || Object.keys(errors).length === 0;
  }

  // Sanitize input
  static sanitizeInput(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  // Validate URL
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      new URL(url);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' };
    }
  }

  // Validate phone number (basic)
  static validatePhone(phone: string): { isValid: boolean; error?: string } {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (phoneRegex.test(phone)) {
      return { isValid: true };
    }
    return { isValid: false, error: 'Please enter a valid phone number' };
  }
}
