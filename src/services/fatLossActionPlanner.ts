/**
 * fatLossActionPlanner - Generates 1-3 daily actions based on real nutrition data
 * and fat loss goals.
 */

import { ActionType } from '@/types/coach';
import { DailyLog, NutritionTargets, getYesterdayLog } from './nutritionCoach';

export interface CoachAction {
  title: string;
  whyThisMatters: string;
  nextAction: string;
  estimateMinutes: number;
  actionType: ActionType;
  priority: 1 | 2 | 3;
}

/**
 * Generate daily actions from logs and targets
 */
export function generateDailyActions(
  todayLog: DailyLog | null,
  yesterdayLog: DailyLog | null,
  allLogs: DailyLog[],
  targets: NutritionTargets
): CoachAction[] {
  const actions: CoachAction[] = [];

  // Rule 1: If calories over target yesterday → environment + protein anchor
  if (yesterdayLog && targets.calories) {
    const yesterdayCalories = yesterdayLog.calories || 0;
    if (yesterdayCalories > targets.calories * 1.1) {
      actions.push({
        title: 'Set up your environment for success',
        whyThisMatters: 'A prepared environment makes healthy choices automatic.',
        nextAction: 'Remove 2 trigger foods from sight. Stock 3 protein sources.',
        estimateMinutes: 10,
        actionType: 'environment',
        priority: 1,
      });
      
      if (actions.length < 3) {
        actions.push({
          title: 'Hit your protein target today',
          whyThisMatters: 'Protein keeps you full and supports fat loss.',
          nextAction: 'Eat 30g protein at breakfast and lunch.',
          estimateMinutes: 10,
          actionType: 'protein_anchor',
          priority: 1,
        });
      }
    }
  }

  // Rule 2: If protein low today or yesterday → protein action
  const todayProtein = todayLog?.protein || 0;
  const yesterdayProtein = yesterdayLog?.protein || 0;
  const targetProtein = targets.protein || 120;
  
  if (todayProtein < targetProtein * 0.6 || yesterdayProtein < targetProtein * 0.6) {
    const hasProteinAction = actions.some(a => a.actionType === 'protein_anchor');
    if (!hasProteinAction && actions.length < 3) {
      actions.push({
        title: 'Hit your protein target today',
        whyThisMatters: 'Protein keeps you full and supports fat loss.',
        nextAction: 'Eat 30g protein at breakfast and lunch.',
        estimateMinutes: 10,
        actionType: 'protein_anchor',
        priority: 1,
      });
    }
  }

  // Rule 3: If hydration low → hydration action
  const todayHydration = todayLog?.hydration || 0;
  const targetHydration = targets.hydration || 8;
  
  if (todayHydration < targetHydration * 0.5 && actions.length < 3) {
    actions.push({
      title: 'Track your water intake',
      whyThisMatters: 'Hydration supports energy and reduces false hunger.',
      nextAction: 'Drink 2 glasses of water right now. Set a reminder for every 2 hours.',
      estimateMinutes: 2,
      actionType: 'hydration',
      priority: 2,
    });
  }

  // Rule 4: If late-night cravings inferred (high evening calories) → craving plan
  if (todayLog?.meals) {
    const eveningMeals = todayLog.meals.filter(
      m => m.mealType === 'dinner' || m.mealType === 'snack'
    );
    const eveningCalories = eveningMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalCalories = todayLog.calories || 0;
    
    if (totalCalories > 0 && eveningCalories / totalCalories > 0.5 && actions.length < 3) {
      actions.push({
        title: 'Create a craving plan',
        whyThisMatters: 'Knowing what to do when cravings hit prevents slips.',
        nextAction: 'Write down 3 go-to snacks for when cravings hit (protein-rich).',
        estimateMinutes: 5,
        actionType: 'craving_plan',
        priority: 2,
      });
    }
  }

  // Rule 5: If no food ready (no meals logged today) → grocery or meal prep
  if (!todayLog || !todayLog.meals || todayLog.meals.length === 0) {
    if (actions.length < 3) {
      actions.push({
        title: 'Quick grocery run for protein',
        whyThisMatters: 'Having food ready makes consistency automatic.',
        nextAction: 'Buy 3 ready-to-eat protein sources (Greek yogurt, eggs, deli meat).',
        estimateMinutes: 20,
        actionType: 'grocery',
        priority: 1,
      });
    }
  }

  // Rule 6: Always include steps if no movement log exists (fallback)
  // Check if we have any movement data (would need to extend DailyLog)
  // For now, if we have < 2 actions, add steps
  if (actions.length < 2) {
    actions.push({
      title: '10-minute walk after your next meal',
      whyThisMatters: 'Movement supports fat loss and reduces post-meal cravings.',
      nextAction: 'Set a reminder: 10 min walk after lunch.',
      estimateMinutes: 10,
      actionType: 'steps',
      priority: 2,
    });
  }

  // Ensure max 3 actions
  return actions.slice(0, 3).sort((a, b) => a.priority - b.priority);
}

