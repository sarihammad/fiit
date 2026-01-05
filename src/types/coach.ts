export type GoalStatus = 'draft' | 'active' | 'archived';
export type WeeklyPlanStatus = 'locked' | 'reset_pending' | 'archived';
export type PlanTaskStatus = 'todo' | 'done' | 'deferred';
export type ExecutionEventType = 'done' | 'defer' | 'help' | 'open';
export type GoalTrack = 'fat_loss'; // Hard-locked to fat_loss for now

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  track?: GoalTrack; // Defaults to 'fat_loss' if missing
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
  | 'grocery'
  | 'meal_prep'
  | 'protein_anchor'
  | 'steps'
  | 'hydration'
  | 'craving_plan'
  | 'sleep'
  | 'environment';

export type DeferReason =
  | 'tooHard'
  | 'tooLong'
  | 'dontKnowHow'
  | 'cravings'
  | 'noFoodReady'
  | 'noTime';

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
  actionType: ActionType; // Required - use normalizeTask if missing
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
