// FIIT Nutrition Coach Service - Repurposed from dating coach
import { FIITAI } from './ai';
import {
  CoachFeedback,
  DayLog,
  UserGoals,
  FeedbackRequest,
} from '@/types/nutrition';

export class NutritionCoachService {
  // Get daily coaching feedback
  static async getDailyFeedback(
    dayLog: DayLog,
    goals: UserGoals,
    streak: number = 0
  ): Promise<CoachFeedback> {
    try {
      const request: FeedbackRequest = {
        dayLog,
        goals,
        streak,
      };

      const feedback = await FIITAI.dailyFeedback(request);
      return feedback;
    } catch (error) {
      console.error('[NutritionCoachService] Failed to get feedback:', error);
      // Return fallback feedback
      return this.getFallbackFeedback(dayLog, goals, streak);
    }
  }

  // Get protein adequacy analysis
  static analyzeProteinIntake(
    current: number,
    target: number
  ): {
    status: 'low' | 'adequate' | 'high';
    note: string;
  } {
    const percentage = (current / target) * 100;

    if (percentage < 80) {
      return {
        status: 'low',
        note: `You're ${Math.round(target - current)}g short of your protein goal. Try adding lean protein sources like chicken, fish, or Greek yogurt.`,
      };
    } else if (percentage > 130) {
      return {
        status: 'high',
        note: `You've exceeded your protein target by ${Math.round(current - target)}g. This is fine occasionally, but balance it with carbs and fats.`,
      };
    } else {
      return {
        status: 'adequate',
        note: `Great job hitting your protein target! Protein helps preserve muscle during weight loss.`,
      };
    }
  }

  // Get calorie balance tip
  static getCalorieTip(current: number, target: number): string {
    const diff = target - current;
    const percentage = (current / target) * 100;

    if (percentage < 80) {
      return `You have ${Math.round(diff)} calories remaining. Consider a balanced snack or meal to meet your target.`;
    } else if (percentage > 110) {
      return `You're ${Math.round(-diff)} calories over target. Tomorrow, try lighter meals or smaller portions to stay on track.`;
    } else {
      return `You're right on target with your calories! Excellent tracking today.`;
    }
  }

  // Get hydration reminder
  static getHydrationTip(dayProgress: number): string {
    const tips = [
      'Remember to drink water throughout the day to support your metabolism.',
      'Staying hydrated helps control hunger and supports fat loss.',
      'Aim for 8 glasses of water daily to optimize your weight loss results.',
      'Drink water before meals to help control portion sizes.',
      'Proper hydration supports energy levels and workout performance.',
    ];

    // Return a tip based on time of day or progress
    const index = Math.floor((dayProgress % 24) / 5);
    return (
      tips[Math.min(index, tips.length - 1)] ||
      'Stay hydrated and eat balanced meals!'
    );
  }

  // Get weekly check-in summary (for Premium)
  static async getWeeklyCheckin(
    logs: DayLog[],
    goals: UserGoals
  ): Promise<{
    summary: string;
    wins: string[];
    areasToImprove: string[];
    nextWeekFocus: string;
  }> {
    // [TODO] Implement AI-powered weekly check-in for Premium users
    // For now, return a simple analysis

    const avgCalories =
      logs.reduce((sum, log) => sum + log.totals.calories, 0) / logs.length;
    const avgProtein =
      logs.reduce((sum, log) => sum + log.totals.protein, 0) / logs.length;
    const daysCompliant = logs.filter(
      log =>
        log.totals.calories >= (goals.dailyCalorieTarget || 0) * 0.9 &&
        log.totals.calories <= (goals.dailyCalorieTarget || 0) * 1.1
    ).length;

    const complianceRate = (daysCompliant / logs.length) * 100;

    const wins: string[] = [];
    const areasToImprove: string[] = [];

    if (complianceRate >= 80) {
      wins.push('Excellent calorie consistency this week!');
    } else if (complianceRate < 60) {
      areasToImprove.push(
        'Focus on hitting your calorie target more consistently'
      );
    }

    if (avgProtein >= (goals.proteinTargetGrams || 0) * 0.9) {
      wins.push('Great protein intake throughout the week');
    } else {
      areasToImprove.push('Increase daily protein to preserve muscle mass');
    }

    if (logs.length === 7) {
      wins.push('Perfect tracking streak - 7 days logged!');
    }

    return {
      summary: `This week you averaged ${Math.round(avgCalories)} calories and ${Math.round(avgProtein)}g protein daily. Your compliance rate was ${Math.round(complianceRate)}%.`,
      wins,
      areasToImprove,
      nextWeekFocus:
        complianceRate >= 80
          ? 'Maintain your consistency while fine-tuning portion sizes'
          : 'Focus on logging every meal and hitting your calorie target',
    };
  }

  // Fallback feedback when AI fails
  private static getFallbackFeedback(
    dayLog: DayLog,
    goals: UserGoals,
    streak: number
  ): CoachFeedback {
    const { calories, protein, carbs, fat } = dayLog.totals;
    const target = goals.dailyCalorieTarget || 2000;
    const proteinTarget = goals.proteinTargetGrams || 100;

    let summary = '';
    let tomorrowTip = '';
    let mood: CoachFeedback['mood'] = 'encouraging';

    const caloriePercentage = (calories / target) * 100;
    const proteinPercentage = (protein / proteinTarget) * 100;

    if (caloriePercentage >= 90 && caloriePercentage <= 110) {
      summary = `Great job today! You hit your calorie target with ${calories} calories logged.`;
      mood = 'celebratory';
    } else if (caloriePercentage < 90) {
      summary = `You logged ${calories} calories today, which is ${Math.round(target - calories)} under your target.`;
      mood = 'supportive';
    } else {
      summary = `You logged ${calories} calories today, which is ${Math.round(calories - target)} over your target.`;
      mood = 'supportive';
    }

    if (proteinPercentage < 80) {
      tomorrowTip = `Try to get more protein tomorrow - aim for ${proteinTarget}g to preserve muscle mass during weight loss.`;
    } else if (caloriePercentage < 90) {
      tomorrowTip = `Don't under-eat tomorrow - stick closer to your ${target} calorie target for sustainable progress.`;
    } else {
      tomorrowTip = `Keep up the great work! Focus on consistent logging and hitting your macros.`;
    }

    return {
      id: `feedback_${Date.now()}`,
      date: dayLog.date,
      summary,
      tomorrowTip,
      proteinNote:
        proteinPercentage < 80
          ? `Protein was ${Math.round(proteinTarget - protein)}g short. Add lean protein sources.`
          : undefined,
      hydrationNote: this.getHydrationTip(new Date().getHours()),
      mood,
      streak,
    };
  }

  // Get daily tip (for notifications)
  static getDailyTip(): string {
    const tips = [
      'Protein at breakfast helps control hunger all day.',
      'Meal prep on Sunday to stay on track all week.',
      "Don't skip meals - it slows your metabolism.",
      'Veggies fill you up with minimal calories.',
      'Weigh yourself at the same time each day for accurate tracking.',
      'Sleep 7-8 hours to support weight loss hormones.',
      'Walk 10 minutes after meals to improve digestion.',
      'Track everything - even small bites add up!',
      'Swap soda for water and save 150+ calories.',
      'Use smaller plates to naturally control portions.',
    ];

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return tips[dayOfYear % tips.length] || 'Keep up the great work!';
  }
}
