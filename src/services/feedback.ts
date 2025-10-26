// Feedback service for generating personalized nutrition coaching
import { http } from './http';
import {
  GenerateFeedbackRequest,
  GenerateFeedbackResponse,
  CoachFeedback,
  GetFeedbackResponse,
} from '@/types/api/feedback';
import { MacroNutrients } from '@/types/api/meals';

export interface FeedbackContext {
  date: string;
  mealsLogged: number;
  weightLogged: boolean;
  exerciseLogged: boolean;
  sleepHours?: number;
  stressLevel?: number;
  mood?: 'great' | 'good' | 'okay' | 'poor' | 'terrible';
}

export interface NutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface WeightData {
  currentWeight: number;
  targetWeight: number;
  weeklyProgress: number;
  isOnTrack: boolean;
}

export class FeedbackService {
  /**
   * Generate personalized feedback for the day
   */
  static async generateFeedback(
    context: FeedbackContext,
    nutritionData: NutritionData,
    weightData?: WeightData
  ): Promise<CoachFeedback | null> {
    try {
      const request: GenerateFeedbackRequest = {
        date: context.date,
        context: {
          mealsLogged: context.mealsLogged,
          weightLogged: context.weightLogged,
          exerciseLogged: context.exerciseLogged,
          sleepHours: context.sleepHours,
          stressLevel: context.stressLevel,
          mood: context.mood,
        },
        nutritionData,
        weightData,
      };

      const response = await http.post<GenerateFeedbackResponse>(
        '/feedback/generate',
        request
      );
      return response.feedback;
    } catch (error) {
      console.error('[FeedbackService] Generate feedback error:', error);
      return null;
    }
  }

  /**
   * Get feedback history
   */
  static async getFeedbackHistory(
    limit: number = 30
  ): Promise<CoachFeedback[]> {
    try {
      const response = await http.get<GetFeedbackResponse>(
        `/feedback/history?limit=${limit}`
      );
      return response.feedback;
    } catch (error) {
      console.error('[FeedbackService] Get feedback history error:', error);
      return [];
    }
  }

  /**
   * Get latest feedback
   */
  static async getLatestFeedback(): Promise<CoachFeedback | null> {
    try {
      const response = await http.get<GetFeedbackResponse>('/feedback/latest');
      return response.latestFeedback || null;
    } catch (error) {
      console.error('[FeedbackService] Get latest feedback error:', error);
      return null;
    }
  }

  /**
   * Generate contextual next best action
   */
  static generateNextBestAction(
    context: FeedbackContext,
    nutritionData: NutritionData,
    lastMealTime?: Date
  ): {
    title: string;
    description: string;
    actionType: string;
    priority: 'low' | 'medium' | 'high';
  } {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Morning actions (6 AM - 11 AM)
    if (currentHour >= 6 && currentHour < 11) {
      if (context.mealsLogged === 0) {
        return {
          title: 'Log your breakfast',
          description:
            'Start your day by logging your first meal to track your nutrition goals.',
          actionType: 'log_meal',
          priority: 'high',
        };
      }

      if (context.mealsLogged === 1) {
        return {
          title: 'Plan your lunch',
          description:
            'Plan your lunch to stay on track with your daily nutrition goals.',
          actionType: 'plan_meal',
          priority: 'medium',
        };
      }
    }

    // Lunch time (11 AM - 2 PM)
    if (currentHour >= 11 && currentHour < 14) {
      if (context.mealsLogged === 1) {
        return {
          title: 'Log your lunch',
          description: 'Log your lunch to track your midday nutrition intake.',
          actionType: 'log_meal',
          priority: 'high',
        };
      }

      if (context.mealsLogged === 2) {
        return {
          title: 'Plan your dinner',
          description:
            'Plan your dinner to ensure you meet your daily nutrition targets.',
          actionType: 'plan_meal',
          priority: 'medium',
        };
      }
    }

    // Afternoon (2 PM - 6 PM)
    if (currentHour >= 14 && currentHour < 18) {
      if (context.mealsLogged === 2) {
        return {
          title: 'Log your dinner',
          description: 'Log your dinner to complete your daily meal tracking.',
          actionType: 'log_meal',
          priority: 'high',
        };
      }

      if (context.mealsLogged >= 3) {
        return {
          title: 'Add a snack',
          description:
            'Consider adding a healthy snack if you need more calories.',
          actionType: 'log_meal',
          priority: 'low',
        };
      }
    }

    // Evening (6 PM - 10 PM)
    if (currentHour >= 18 && currentHour < 22) {
      if (context.mealsLogged >= 3) {
        return {
          title: 'Get daily feedback',
          description:
            'Review your daily nutrition summary and get personalized tips.',
          actionType: 'view_feedback',
          priority: 'medium',
        };
      }

      if (!context.weightLogged && currentDay === 0) {
        // Sunday
        return {
          title: 'Log your weight',
          description: 'Track your weekly progress by logging your weight.',
          actionType: 'add_weight',
          priority: 'medium',
        };
      }
    }

    // Night (10 PM - 6 AM)
    if (currentHour >= 22 || currentHour < 6) {
      return {
        title: 'Plan tomorrow',
        description:
          'Plan your meals for tomorrow to stay on track with your goals.',
        actionType: 'plan_meal',
        priority: 'low',
      };
    }

    // Default action
    return {
      title: 'Log a meal',
      description: 'Keep tracking your nutrition by logging your next meal.',
      actionType: 'log_meal',
      priority: 'medium',
    };
  }

  /**
   * Get nutrition tips based on current data
   */
  static getNutritionTips(nutritionData: NutritionData): string[] {
    const tips: string[] = [];
    const {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
    } = nutritionData;

    // Calorie tips
    if (totalCalories < targetCalories * 0.8) {
      tips.push(
        "You're under your calorie target. Consider adding a healthy snack."
      );
    } else if (totalCalories > targetCalories * 1.2) {
      tips.push(
        "You're over your calorie target. Try to reduce portion sizes for your next meal."
      );
    }

    // Protein tips
    if (totalProtein < targetProtein * 0.8) {
      tips.push(
        'Add more protein to your next meal. Try lean meats, fish, or plant-based options.'
      );
    } else if (totalProtein > targetProtein * 1.2) {
      tips.push(
        "You've exceeded your protein target. Consider adding more vegetables to balance your macros."
      );
    }

    // Carb tips
    if (totalCarbs < targetCarbs * 0.8) {
      tips.push(
        'Add more complex carbohydrates like whole grains, fruits, or vegetables.'
      );
    } else if (totalCarbs > targetCarbs * 1.2) {
      tips.push(
        'Consider reducing refined carbohydrates and focusing on whole foods.'
      );
    }

    // Fat tips
    if (totalFat < targetFat * 0.8) {
      tips.push(
        'Add healthy fats like avocado, nuts, or olive oil to your meals.'
      );
    } else if (totalFat > targetFat * 1.2) {
      tips.push(
        'Consider reducing high-fat foods and focusing on lean protein sources.'
      );
    }

    return tips;
  }

  /**
   * Get motivational messages based on progress
   */
  static getMotivationalMessage(progress: number, streak: number): string {
    if (progress > 0.9) {
      return `Amazing! You're crushing your goals! 🎉`;
    } else if (progress > 0.7) {
      return `Great job! You're on track to reach your goals! 💪`;
    } else if (progress > 0.5) {
      return `You're making progress! Keep up the good work! 🌟`;
    } else if (streak > 7) {
      return `Your ${streak}-day streak is impressive! Keep it up! 🔥`;
    } else if (streak > 3) {
      return `You're building a great habit! Consistency is key! ⭐`;
    } else {
      return `Every step counts! You're building a healthier lifestyle! 🌱`;
    }
  }

  /**
   * Calculate nutrition score (0-100)
   */
  static calculateNutritionScore(nutritionData: NutritionData): number {
    const {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
    } = nutritionData;

    const calorieScore = Math.max(
      0,
      100 - (Math.abs(totalCalories - targetCalories) / targetCalories) * 100
    );
    const proteinScore = Math.max(
      0,
      100 - (Math.abs(totalProtein - targetProtein) / targetProtein) * 100
    );
    const carbScore = Math.max(
      0,
      100 - (Math.abs(totalCarbs - targetCarbs) / targetCarbs) * 100
    );
    const fatScore = Math.max(
      0,
      100 - (Math.abs(totalFat - targetFat) / targetFat) * 100
    );

    return Math.round((calorieScore + proteinScore + carbScore + fatScore) / 4);
  }

  /**
   * Get feedback mood based on score
   */
  static getFeedbackMood(
    score: number
  ): 'encouraging' | 'supportive' | 'analytical' | 'celebratory' {
    if (score >= 90) return 'celebratory';
    if (score >= 70) return 'encouraging';
    if (score >= 50) return 'supportive';
    return 'analytical';
  }
}

