import { GoalClarificationAnswer } from '@/types/coach';

export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
}

interface PlanTask {
  day: string;
  priority: number;
  title: string;
  whyThisMatters: string;
  nextAction: string;
  estimateMinutes: number;
  actionType: string;
}

interface Plan {
  tasks: PlanTask[];
}

/**
 * Validates a fat loss plan before commit
 * Ensures:
 * - Plan has 7 days represented (or at least covers current week)
 * - Each day has 1-3 tasks
 * - Day 1-2 contains: environment/grocery + protein_anchor
 * - If cravings present in answers: at least 2 craving_plan tasks across the week
 */
export function validateFatLossPlan(
  plan: Plan,
  answers: GoalClarificationAnswer[]
): PlanValidationResult {
  const errors: string[] = [];

  // Group tasks by day
  const tasksByDay = plan.tasks.reduce<Record<string, PlanTask[]>>(
    (acc, task) => {
      acc[task.day] = acc[task.day] || [];
      acc[task.day].push(task);
      return acc;
    },
    {}
  );

  const days = Object.keys(tasksByDay).sort();
  
  // Check: Plan should have at least 5 days (covers current week)
  if (days.length < 5) {
    errors.push(`Plan needs at least 5 days (currently has ${days.length})`);
  }

  // Check: Each day has 1-3 tasks
  days.forEach(day => {
    const dayTasks = tasksByDay[day] || [];
    if (dayTasks.length === 0) {
      errors.push(`Day ${day} has no tasks`);
    } else if (dayTasks.length > 3) {
      errors.push(`Day ${day} has ${dayTasks.length} tasks (max 3)`);
    }
  });

  // Check: First 48 hours must have environment/grocery + protein_anchor
  const first2Days = days.slice(0, 2);
  const first48Hours = first2Days.flatMap(day => tasksByDay[day] || []);
  
  const hasEnvOrGrocery = first48Hours.some(
    t => t.actionType === 'environment' || t.actionType === 'grocery'
  );
  if (!hasEnvOrGrocery) {
    errors.push('First 2 days must include an environment or grocery action');
  }

  const hasProtein = first48Hours.some(t => t.actionType === 'protein_anchor');
  if (!hasProtein) {
    errors.push('First 2 days must include a protein anchor action');
  }

  // Check: If cravings mentioned, need at least 2 craving_plan tasks
  const habitsAnswer = answers.find(a => a.questionKey === 'habits');
  const hasCravings = habitsAnswer && (
    habitsAnswer.answerText.toLowerCase().includes('cravings') ||
    habitsAnswer.answerText.toLowerCase().includes('late night') ||
    habitsAnswer.answerText.toLowerCase().includes('stress') ||
    habitsAnswer.answerText.toLowerCase().includes('weekend') ||
    habitsAnswer.answerText.toLowerCase().includes('social') ||
    habitsAnswer.answerText.toLowerCase().includes('snacking')
  );

  if (hasCravings) {
    const cravingPlans = plan.tasks.filter(t => t.actionType === 'craving_plan');
    if (cravingPlans.length < 2) {
      errors.push('Plan needs at least 2 craving plan actions (you mentioned cravings)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

