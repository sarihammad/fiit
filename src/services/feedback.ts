import { http, AppError } from './http';
import { 
  FeedbackContext, 
  NutritionData, 
  WeightData,
  CoachFeedback,
  GenerateFeedbackRequest,
  validateApiResponse,
  CoachFeedbackSchema
} from '@/types/api';

export class FeedbackService {
  /**
   * Generate AI feedback based on user context and nutrition data
   */
  static async generateFeedback(
    context: FeedbackContext,
    nutritionData: NutritionData,
    weightData?: WeightData
  ): Promise<CoachFeedback | null> {
    try {
      const request: GenerateFeedbackRequest = {
        context,
        nutritionData,
        weightData,
      };

      const response = await http.post<CoachFeedback>('/feedback/generate', request);
      return validateApiResponse(CoachFeedbackSchema, response);
    } catch (error) {
      console.error('[FeedbackService] Generate feedback error:', error);
      
      // Return fallback feedback if API fails
      return this.generateFallbackFeedback(context, nutritionData, weightData);
    }
  }

  /**
   * Generate fallback feedback when API is unavailable
   */
  private static generateFallbackFeedback(
    context: FeedbackContext,
    nutritionData: NutritionData,
    weightData?: WeightData
  ): CoachFeedback {
    const { mealsLogged, mood } = context;
    const { totalCalories, totalProtein, targetCalories, targetProtein } = nutritionData;

    // Calculate protein percentage
    const proteinPercentage = (totalProtein / targetProtein) * 100;
    const caloriePercentage = (totalCalories / targetCalories) * 100;

    let summary = '';
    let tomorrowTip = '';
    let proteinNote = '';
    let moodType: 'celebratory' | 'encouraging' | 'supportive' | 'motivating' = 'supportive';

    // Generate summary based on performance
    if (mealsLogged >= 3 && proteinPercentage >= 90 && caloriePercentage >= 85) {
      summary = 'Excellent work today! You\'re hitting your targets and staying consistent.';
      moodType = 'celebratory';
    } else if (mealsLogged >= 2 && proteinPercentage >= 75) {
      summary = 'Great progress! You\'re on track with your nutrition goals.';
      moodType = 'encouraging';
    } else if (mealsLogged >= 1) {
      summary = 'Good start! Let\'s work on hitting your daily targets.';
      moodType = 'supportive';
    } else {
      summary = 'Ready to get back on track? Every meal counts toward your goals.';
      moodType = 'motivating';
    }

    // Generate protein note
    if (proteinPercentage >= 100) {
      proteinNote = 'Perfect protein intake! You\'re exceeding your target.';
    } else if (proteinPercentage >= 80) {
      proteinNote = 'Great protein intake! You\'re close to your target.';
    } else if (proteinPercentage >= 60) {
      proteinNote = 'Good protein intake. Try to add more protein-rich foods.';
    } else {
      proteinNote = 'Focus on increasing protein intake. Consider adding lean meats, eggs, or legumes.';
    }

    // Generate tomorrow's tip
    const tips = [
      'Start your day with a protein-rich breakfast to fuel your metabolism.',
      'Include vegetables in every meal for essential vitamins and minerals.',
      'Stay hydrated by drinking water throughout the day.',
      'Plan your meals ahead to avoid unhealthy choices.',
      'Include healthy fats like nuts, avocado, or olive oil.',
      'Eat slowly and mindfully to improve digestion.',
      'Get enough sleep to support your metabolism and recovery.',
    ];

    tomorrowTip = tips[Math.floor(Math.random() * tips.length)];

    return {
      id: `feedback_${Date.now()}`,
      date: context.date,
      summary,
      tomorrowTip,
      proteinNote,
      hydrationNote: 'Remember to drink 8-10 glasses of water daily.',
      mood: moodType,
      streak: this.calculateStreak(context.date),
    };
  }

  /**
   * Get nutrition tips based on current data
   */
  static getNutritionTips(nutritionData: NutritionData): string[] {
    const tips: string[] = [];
    const { totalCalories, totalProtein, totalCarbs, totalFat, targetCalories, targetProtein } = nutritionData;

    const caloriePercentage = (totalCalories / targetCalories) * 100;
    const proteinPercentage = (totalProtein / targetProtein) * 100;

    if (caloriePercentage < 80) {
      tips.push('Consider adding healthy snacks to reach your calorie target.');
    } else if (caloriePercentage > 120) {
      tips.push('Try reducing portion sizes to stay within your calorie goal.');
    }

    if (proteinPercentage < 80) {
      tips.push('Add more protein-rich foods like chicken, fish, or legumes.');
    }

    if (totalCarbs < 100) {
      tips.push('Include complex carbohydrates like whole grains and fruits.');
    }

    if (totalFat < 30) {
      tips.push('Add healthy fats like nuts, avocado, or olive oil.');
    }

    return tips;
  }

  /**
   * Get motivational message based on streak
   */
  static getMotivationalMessage(streak: number, daysLogged: number): string {
    if (streak >= 30) {
      return `Incredible! ${streak} days strong! You're building an unbreakable habit.`;
    } else if (streak >= 14) {
      return `Amazing! ${streak} days in a row! You're forming a powerful routine.`;
    } else if (streak >= 7) {
      return `Great job! ${streak} days straight! Keep the momentum going.`;
    } else if (streak >= 3) {
      return `Nice work! ${streak} days in a row. You're building consistency.`;
    } else if (daysLogged > 0) {
      return `Every day counts! You've logged ${daysLogged} days. Keep going!`;
    } else {
      return `Ready to start your journey? Every meal is a step toward your goals.`;
    }
  }

  /**
   * Generate next best action based on context
   */
  static generateNextBestAction(
    context: FeedbackContext,
    nutritionData: NutritionData,
    lastMealTime?: Date
  ): {
    actionType: string;
    title: string;
    subtitle: string;
    priority: 'high' | 'medium' | 'low';
  } {
    const now = new Date();
    const hour = now.getHours();
    const hoursSinceLastMeal = lastMealTime 
      ? (now.getTime() - lastMealTime.getTime()) / (1000 * 60 * 60) 
      : 24;

    // High priority actions
    if (context.mealsLogged === 0) {
      return {
        actionType: 'log_meal',
        title: 'Log Your First Meal',
        subtitle: 'Start tracking your nutrition today',
        priority: 'high',
      };
    }

    if (hoursSinceLastMeal > 6) {
      return {
        actionType: 'log_meal',
        title: 'Log a Meal',
        subtitle: 'It\'s been a while since your last meal',
        priority: 'high',
      };
    }

    // Medium priority actions
    if (context.mealsLogged < 2) {
      return {
        actionType: 'log_meal',
        title: 'Log Another Meal',
        subtitle: 'Complete your daily meal tracking',
        priority: 'medium',
      };
    }

    if (hour >= 17 && context.mealsLogged < 3) {
      return {
        actionType: 'plan_meal',
        title: 'Plan Your Dinner',
        subtitle: 'End your day with a nutritious meal',
        priority: 'medium',
      };
    }

    // Low priority actions
    if (context.mealsLogged >= 3) {
      return {
        actionType: 'view_feedback',
        title: 'Review Your Progress',
        subtitle: 'See how you\'re doing today',
        priority: 'low',
      };
    }

    return {
      actionType: 'view_plan',
      title: 'Check Your Meal Plan',
      subtitle: 'See what to eat next',
      priority: 'low',
    };
  }

  /**
   * Calculate streak based on date
   */
  private static calculateStreak(date: string): number {
    // This would typically calculate based on actual meal logging history
    // For now, return a mock value
    return Math.floor(Math.random() * 30) + 1;
  }

  /**
   * Get hydration reminder
   */
  static getHydrationReminder(): string {
    const reminders = [
      'Stay hydrated! Aim for 8-10 glasses of water daily.',
      'Drinking water helps with metabolism and appetite control.',
      'Dehydration can affect your energy levels and focus.',
      'Try adding lemon or cucumber to your water for flavor.',
    ];
    return reminders[Math.floor(Math.random() * reminders.length)];
  }

  /**
   * Get sleep tip
   */
  static getSleepTip(sleepHours: number): string {
    if (sleepHours < 6) {
      return 'Getting enough sleep is crucial for weight management. Aim for 7-9 hours.';
    } else if (sleepHours > 9) {
      return 'Too much sleep can affect your metabolism. 7-9 hours is optimal.';
    } else {
      return 'Great sleep habits! Quality rest supports your health goals.';
    }
  }

  /**
   * Get stress management tip
   */
  static getStressTip(stressLevel: number): string {
    if (stressLevel >= 4) {
      return 'High stress can affect your eating habits. Try deep breathing or meditation.';
    } else if (stressLevel >= 3) {
      return 'Managing stress well! Consider light exercise to reduce tension.';
    } else {
      return 'Excellent stress management! Keep up the great work.';
    }
  }
}