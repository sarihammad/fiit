import { PlanTask, ActionType } from '@/types/coach';

/**
 * Normalizes a task to ensure all required fields are present.
 * Used for backward compatibility with older saved tasks.
 */
export function normalizeTask(task: Partial<PlanTask> & { id: string; weeklyPlanId: string }): PlanTask {
  const now = new Date().toISOString();
  
  // Infer actionType from content if missing
  const actionType: ActionType = task.actionType || inferActionType(task);
  
  // Ensure required fields have safe defaults
  return {
    id: task.id,
    weeklyPlanId: task.weeklyPlanId,
    title: task.title || 'Action',
    whyThisMatters: task.whyThisMatters || 'This moves you forward.',
    nextAction: task.nextAction || 'Take the first step.',
    estimateMinutes: task.estimateMinutes || 15,
    scheduledDate: task.scheduledDate || new Date().toISOString().slice(0, 10),
    priority: (task.priority || 2) as 1 | 2 | 3,
    status: task.status || 'todo',
    deferCount: task.deferCount || 0,
    lastDeferredAt: task.lastDeferredAt,
    lastDeferReason: task.lastDeferReason,
    actionType,
    createdAt: task.createdAt || now,
    updatedAt: task.updatedAt || now,
  };
}

/**
 * Infers actionType from task content using keyword matching.
 */
function inferActionType(task: Partial<PlanTask>): ActionType {
  const text = `${task.title || ''} ${task.nextAction || ''}`.toLowerCase();
  
  // Grocery / shop / buy
  if (text.includes('grocery') || text.includes('shop') || text.includes('buy') || text.includes('store')) {
    return 'grocery';
  }
  
  // Meal prep / cook / batch
  if (text.includes('prep') || text.includes('cook') || text.includes('batch') || text.includes('meal prep')) {
    return 'meal_prep';
  }
  
  // Protein anchor
  if (
    text.includes('protein') ||
    text.includes('chicken') ||
    text.includes('greek yogurt') ||
    text.includes('shake') ||
    text.includes('eggs') ||
    text.includes('beef') ||
    text.includes('fish') ||
    text.includes('turkey')
  ) {
    return 'protein_anchor';
  }
  
  // Steps / walk / cardio
  if (text.includes('walk') || text.includes('steps') || text.includes('cardio') || text.includes('movement')) {
    return 'steps';
  }
  
  // Water / hydration
  if (text.includes('water') || text.includes('hydrat') || text.includes('drink')) {
    return 'hydration';
  }
  
  // Craving / snack / binge / late night
  if (
    text.includes('craving') ||
    text.includes('snack') ||
    text.includes('binge') ||
    text.includes('late night') ||
    text.includes('cravings')
  ) {
    return 'craving_plan';
  }
  
  // Sleep / bedtime
  if (text.includes('sleep') || text.includes('bedtime') || text.includes('rest')) {
    return 'sleep';
  }
  
  // Environment / clean / remove / setup
  if (
    text.includes('clean') ||
    text.includes('kitchen') ||
    text.includes('remove') ||
    text.includes('environment') ||
    text.includes('setup') ||
    text.includes('organize') ||
    text.includes('clear')
  ) {
    return 'environment';
  }
  
  // Default to environment (safest fallback for fat loss)
  return 'environment';
}


