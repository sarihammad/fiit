/**
 * NutritionCoachService - Generates daily feedback and coaching insights
 * from meal logs and nutrition data.
 */

export interface DailyLog {
  date: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  hydration?: number; // glasses of water
  meals?: Array<{
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
  }>;
}

export interface NutritionTargets {
  calories?: number;
  protein?: number;
  hydration?: number; // glasses
}

export interface CoachFeedback {
  summary: string;
  tomorrowTip: string;
  proteinNote?: string;
  hydrationNote?: string;
  calorieNote?: string;
}

/**
 * Generate coach feedback from today's log and targets
 */
export function generateCoachFeedback(
  todayLog: DailyLog | null,
  targets: NutritionTargets
): CoachFeedback {
  if (!todayLog) {
    return {
      summary: 'No data logged yet today. Start by logging your first meal.',
      tomorrowTip: 'Log your meals as you eat them. It takes 30 seconds and builds awareness.',
    };
  }

  const calories = todayLog.calories || 0;
  const protein = todayLog.protein || 0;
  const hydration = todayLog.hydration || 0;
  const targetCalories = targets.calories || 2000;
  const targetProtein = targets.protein || 120;
  const targetHydration = targets.hydration || 8;

  // Calculate progress
  const calorieProgress = calories / targetCalories;
  const proteinProgress = protein / targetProtein;
  const hydrationProgress = hydration / targetHydration;

  // Build summary
  const summaryParts: string[] = [];
  
  if (calorieProgress >= 0.9 && calorieProgress <= 1.1) {
    summaryParts.push(`You're on track with calories (${Math.round(calories)}/${targetCalories}).`);
  } else if (calorieProgress > 1.1) {
    summaryParts.push(`You're over target by ${Math.round(calories - targetCalories)} calories.`);
  } else if (calorieProgress < 0.7) {
    summaryParts.push(`You're under target by ${Math.round(targetCalories - calories)} calories.`);
  }

  if (proteinProgress >= 0.8) {
    summaryParts.push(`Protein looks good (${Math.round(protein)}g).`);
  } else if (proteinProgress < 0.6) {
    summaryParts.push(`Protein is low (${Math.round(protein)}g / ${targetProtein}g).`);
  }

  if (hydrationProgress >= 0.75) {
    summaryParts.push(`Hydration on track (${hydration}/${targetHydration} glasses).`);
  } else if (hydrationProgress < 0.5) {
    summaryParts.push(`Hydration is low (${hydration}/${targetHydration} glasses).`);
  }

  const summary = summaryParts.length > 0
    ? summaryParts.join(' ')
    : 'Keep logging your meals to see progress.';

  // Generate tomorrow tip
  let tomorrowTip = 'Focus on protein at every meal tomorrow.';
  
  if (proteinProgress < 0.7) {
    tomorrowTip = 'Start tomorrow with a protein-rich breakfast (30g+). It sets the tone for the day.';
  } else if (calorieProgress > 1.15) {
    tomorrowTip = 'Tomorrow, try eating protein first at each meal. It helps with satiety.';
  } else if (hydrationProgress < 0.5) {
    tomorrowTip = 'Keep a water bottle nearby tomorrow. Set a reminder for every 2 hours.';
  } else if (calorieProgress < 0.7) {
    tomorrowTip = 'Tomorrow, add one extra protein source to your meals.';
  }

  // Generate notes
  const proteinNote = proteinProgress < 0.7
    ? `You're at ${Math.round(proteinProgress * 100)}% of your protein target. Add a protein source to your next meal.`
    : undefined;

  const hydrationNote = hydrationProgress < 0.5
    ? `You've had ${hydration}/${targetHydration} glasses. Drink 2 more before bed.`
    : undefined;

  const calorieNote = calorieProgress > 1.15
    ? `You're ${Math.round((calorieProgress - 1) * 100)}% over target. Tomorrow, focus on protein and vegetables first.`
    : calorieProgress < 0.7
    ? `You're ${Math.round((1 - calorieProgress) * 100)}% under target. Add a protein-rich snack.`
    : undefined;

  return {
    summary,
    tomorrowTip,
    proteinNote,
    hydrationNote,
    calorieNote,
  };
}

/**
 * Get yesterday's log (for comparison)
 */
export function getYesterdayLog(
  logs: DailyLog[],
  today: string
): DailyLog | null {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  return logs.find(log => log.date === yesterdayStr) || null;
}

