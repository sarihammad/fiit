// FIIT Meal Analyzer Service - Repurposed from profile analyzer
import * as FoodService from './food';
import {
  MealItem,
  FoodRecognitionResult,
  DayLog,
  MacroProgress,
} from '@/types/nutrition';

export class MealAnalyzerService {
  // Analyze photo and return meal items
  static async analyzePhoto(photoUri: string): Promise<FoodRecognitionResult> {
    try {
      const result = await FoodService.analyzePhoto(photoUri);
      if ('error' in result) {
        throw new Error('Photo analysis failed');
      }
      return result;
    } catch (error) {
      console.error('[MealAnalyzerService] Photo analysis failed:', error);
      throw error;
    }
  }

  // Analyze day's macro balance
  static analyzeMacroBalance(
    dayLog: DayLog,
    targets: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  ): {
    calories: MacroProgress;
    protein: MacroProgress;
    carbs: MacroProgress;
    fat: MacroProgress;
    overallScore: number;
    feedback: string;
  } {
    const calcProgress = (current: number, target: number): MacroProgress => {
      const percentage = target > 0 ? (current / target) * 100 : 0;
      let status: 'under' | 'on_track' | 'over' = 'on_track';

      if (percentage < 80) status = 'under';
      else if (percentage > 120) status = 'over';

      return {
        current,
        target,
        percentage: Math.round(percentage),
        remaining: Math.round(target - current),
        status,
      };
    };

    const calories = calcProgress(dayLog.totals.calories, targets.calories);
    const protein = calcProgress(dayLog.totals.protein, targets.protein);
    const carbs = calcProgress(dayLog.totals.carbs, targets.carbs);
    const fat = calcProgress(dayLog.totals.fat, targets.fat);

    // Calculate overall score (0-100)
    const scores = [calories, protein, carbs, fat].map(p => {
      if (p.status === 'on_track') return 100;
      const deviation = Math.abs(p.percentage - 100);
      return Math.max(0, 100 - deviation);
    });
    const overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    // Generate feedback
    let feedback = '';
    if (overallScore >= 90) {
      feedback = 'Excellent macro balance today! Keep it up.';
    } else if (overallScore >= 70) {
      feedback =
        'Good job overall. Focus on balancing your macros more consistently.';
    } else {
      const needsWork = [calories, protein, carbs, fat]
        .filter(p => p.status !== 'on_track')
        .map(p => {
          if (p === calories) return 'calories';
          if (p === protein) return 'protein';
          if (p === carbs) return 'carbs';
          return 'fat';
        });
      feedback = `Try to better balance your ${needsWork.join(', ')} tomorrow.`;
    }

    return {
      calories,
      protein,
      carbs,
      fat,
      overallScore,
      feedback,
    };
  }

  // Get meal quality score
  static analyzeMealQuality(meal: MealItem): {
    score: number;
    strengths: string[];
    improvements: string[];
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    let score = 50; // Base score

    // Protein analysis (high priority for weight loss)
    const proteinPercentage = (meal.protein * 4) / meal.calories;
    if (proteinPercentage >= 0.25) {
      strengths.push('High protein content');
      score += 20;
    } else if (proteinPercentage < 0.15) {
      improvements.push('Add more protein');
    }

    // Fiber analysis
    if (meal.fiber && meal.fiber >= 5) {
      strengths.push('Good fiber content');
      score += 15;
    } else if (!meal.fiber || meal.fiber < 3) {
      improvements.push('Include more fiber-rich foods');
    }

    // Fat analysis
    const fatPercentage = (meal.fat * 9) / meal.calories;
    if (fatPercentage <= 0.35 && fatPercentage >= 0.2) {
      strengths.push('Balanced fat content');
      score += 15;
    } else if (fatPercentage > 0.5) {
      improvements.push('Reduce high-fat components');
    }

    // Calorie density
    if (meal.calories < 600) {
      score += 10; // Moderate portions
    }

    return {
      score: Math.min(100, score),
      strengths,
      improvements,
    };
  }

  // Suggest meal swaps for better macros
  static suggestMealSwaps(
    meal: MealItem,
    deficit: {
      protein?: number;
      carbs?: number;
      fat?: number;
    }
  ): string[] {
    const suggestions: string[] = [];

    if (deficit.protein && deficit.protein > 10) {
      suggestions.push(
        `Add ${Math.round(deficit.protein)}g protein: try grilled chicken breast, Greek yogurt, or protein powder`
      );
    }

    if (deficit.carbs && deficit.carbs > 20) {
      suggestions.push(
        `Add ${Math.round(deficit.carbs)}g carbs: try brown rice, sweet potato, or oatmeal`
      );
    }

    if (deficit.fat && deficit.fat > 10) {
      suggestions.push(
        `Add ${Math.round(deficit.fat)}g healthy fats: try avocado, nuts, or olive oil`
      );
    }

    // If over on calories, suggest lighter swaps
    if (meal.calories > 600) {
      suggestions.push(
        'For a lighter version, try reducing portion size by 25% or swapping to leaner proteins'
      );
    }

    return suggestions;
  }

  // Analyze meal timing
  static analyzeMealTiming(meals: MealItem[]): {
    isBalanced: boolean;
    suggestions: string[];
  } {
    const mealsByTime = meals.reduce(
      (acc, meal) => {
        acc[meal.when] = (acc[meal.when] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const suggestions: string[] = [];
    let isBalanced = true;

    if (!mealsByTime.breakfast) {
      suggestions.push('Add breakfast to kickstart your metabolism');
      isBalanced = false;
    }

    if (!mealsByTime.lunch) {
      suggestions.push('Include lunch to avoid evening overeating');
      isBalanced = false;
    }

    if (!mealsByTime.dinner) {
      suggestions.push(
        'Have a balanced dinner to complete your daily nutrition'
      );
      isBalanced = false;
    }

    if ((mealsByTime.snack || 0) > 3) {
      suggestions.push('Try consolidating snacks into structured meals');
      isBalanced = false;
    }

    return {
      isBalanced,
      suggestions,
    };
  }

  // Get nutrition grade for the day
  static getDayGrade(
    dayLog: DayLog,
    targets: {
      calories: number;
      protein: number;
    }
  ): {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    explanation: string;
  } {
    const analysis = this.analyzeMacroBalance(dayLog, {
      ...targets,
      carbs: 0,
      fat: 0,
    });

    const score = analysis.overallScore;

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    let explanation: string;

    if (score >= 90) {
      grade = 'A';
      explanation = 'Excellent! Your nutrition was spot-on today.';
    } else if (score >= 80) {
      grade = 'B';
      explanation = 'Great job! Minor adjustments could make it perfect.';
    } else if (score >= 70) {
      grade = 'C';
      explanation = 'Good effort. Focus on hitting your targets more closely.';
    } else if (score >= 60) {
      grade = 'D';
      explanation = 'Needs improvement. Review your meal choices and portions.';
    } else {
      grade = 'F';
      explanation =
        'Off track today. Tomorrow is a fresh start - you got this!';
    }

    return { grade, explanation };
  }
}
