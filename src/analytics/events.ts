/**
 * Centralized analytics event names for FIIT fat loss funnel
 * 
 * All events use the `fiit_` prefix for easy filtering in analytics dashboards.
 * Properties are typed to ensure consistency.
 */

// ===== ONBOARDING FUNNEL =====
export const ONBOARDING_EVENTS = {
  OPEN: 'fiit_onboarding_open',
  DISCLAIMER_ACCEPT: 'fiit_onboarding_disclaimer_accept',
  ANSWER_SUBMIT: 'fiit_onboarding_answer_submit',
  COMPLETE: 'fiit_onboarding_complete',
} as const;

// ===== PLAN FUNNEL =====
export const PLAN_EVENTS = {
  GENERATED: 'fiit_plan_generated',
  COMMIT_CLICKED: 'fiit_plan_commit_clicked',
  COMMIT_CONFIRMED: 'fiit_plan_commit_confirmed',
  COMMITTED: 'fiit_plan_committed',
} as const;

// ===== TODAY FUNNEL =====
export const TODAY_EVENTS = {
  OPEN: 'fiit_today_open',
  TASK_START: 'fiit_task_start',
  TIMER_COMPLETE: 'fiit_timer_complete',
  TASK_DONE: 'fiit_task_done',
  TASK_DEFER: 'fiit_task_defer',
  MAKE_IT_5_CLICKED: 'fiit_make_it_5_clicked',
  MAKE_IT_5_APPLIED: 'fiit_make_it_5_applied',
} as const;

// ===== PAYWALL FUNNEL =====
export const PAYWALL_EVENTS = {
  VIEW: 'fiit_upgrade_view',
  CLICK: 'fiit_upgrade_click',
  PURCHASE_SUCCESS: 'fiit_purchase_success',
  PURCHASE_FAIL: 'fiit_purchase_fail',
} as const;

// ===== EVENT PROPERTY TYPES =====
export interface OnboardingAnswerSubmitProps {
  questionKey: string;
  weeklyPlanId?: string;
}

export interface OnboardingCompleteProps {
  answersCount: number;
  weeklyPlanId?: string;
}

export interface PlanGeneratedProps {
  tasksCount: number;
  daysCount: number;
  weeklyPlanId?: string;
}

export interface PlanCommittedProps {
  tasksCount: number;
  weeklyPlanId: string;
}

export interface TodayOpenProps {
  date: string;
  tasksCount: number;
  weeklyPlanId?: string;
}

export interface TaskStartProps {
  taskId: string;
  actionType: string;
  estimateMinutes: number;
  weeklyPlanId?: string;
}

export interface TimerCompleteProps {
  taskId: string;
  minutes: number;
  weeklyPlanId?: string;
}

export interface TaskDoneProps {
  taskId: string;
  actionType: string;
  weeklyPlanId?: string;
}

export interface TaskDeferProps {
  taskId: string;
  reason: string;
  deferCount: number;
  weeklyPlanId?: string;
}

export interface MakeIt5ClickedProps {
  taskId: string;
  reason?: string;
  weeklyPlanId?: string;
}

export interface MakeIt5AppliedProps {
  taskId: string;
  weeklyPlanId?: string;
}

export interface PurchaseFailProps {
  errorCode?: string;
  weeklyPlanId?: string;
}

// ===== TYPE GUARDS =====
export type AnalyticsEvent =
  | typeof ONBOARDING_EVENTS.OPEN
  | typeof ONBOARDING_EVENTS.DISCLAIMER_ACCEPT
  | typeof ONBOARDING_EVENTS.ANSWER_SUBMIT
  | typeof ONBOARDING_EVENTS.COMPLETE
  | typeof PLAN_EVENTS.GENERATED
  | typeof PLAN_EVENTS.COMMIT_CLICKED
  | typeof PLAN_EVENTS.COMMIT_CONFIRMED
  | typeof PLAN_EVENTS.COMMITTED
  | typeof TODAY_EVENTS.OPEN
  | typeof TODAY_EVENTS.TASK_START
  | typeof TODAY_EVENTS.TIMER_COMPLETE
  | typeof TODAY_EVENTS.TASK_DONE
  | typeof TODAY_EVENTS.TASK_DEFER
  | typeof TODAY_EVENTS.MAKE_IT_5_CLICKED
  | typeof TODAY_EVENTS.MAKE_IT_5_APPLIED
  | typeof PAYWALL_EVENTS.VIEW
  | typeof PAYWALL_EVENTS.CLICK
  | typeof PAYWALL_EVENTS.PURCHASE_SUCCESS
  | typeof PAYWALL_EVENTS.PURCHASE_FAIL;

