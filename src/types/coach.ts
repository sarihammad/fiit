export type GoalStatus = 'draft' | 'active' | 'archived';
export type WeeklyPlanStatus = 'locked' | 'reset_pending' | 'archived';
export type PlanTaskStatus = 'todo' | 'done' | 'deferred';
export type ExecutionEventType = 'done' | 'defer' | 'help' | 'open';

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalClarificationAnswer {
  id: string;
  goalId: string;
  questionKey: string;
  questionText: string;
  answerText: string;
  createdAt: string;
}

export interface WeeklyPlan {
  id: string;
  goalId: string;
  userId?: string;
  startDate: string;
  status: WeeklyPlanStatus;
  createdAt: string;
}

export type ActionType =
  | 'meal_prep'
  | 'grocery'
  | 'protein'
  | 'hydration'
  | 'workout'
  | 'sleep'
  | 'environment'
  | 'craving_plan';

export type DeferReason = 'tooHard' | 'tooLong' | 'notImportant' | 'dontKnowHow';

export interface PlanTask {
  id: string;
  weeklyPlanId: string;
  title: string;
  whyThisMatters: string;
  nextAction: string;
  estimateMinutes: number;
  scheduledDate: string;
  priority: 1 | 2 | 3;
  status: PlanTaskStatus;
  deferCount: number;
  lastDeferredAt?: string;
  lastDeferReason?: DeferReason;
  actionType?: ActionType;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionEvent {
  id: string;
  userId?: string;
  taskId: string;
  type: ExecutionEventType;
  createdAt: string;
}
