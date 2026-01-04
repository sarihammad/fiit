import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExecutionEvent,
  Goal,
  GoalClarificationAnswer,
  GoalStatus,
  PlanTask,
  PlanTaskStatus,
  WeeklyPlan,
  WeeklyPlanStatus,
} from '@/types/coach';

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

interface CoachState {
  goals: Goal[];
  answers: GoalClarificationAnswer[];
  weeklyPlans: WeeklyPlan[];
  planTasks: PlanTask[];
  executionEvents: ExecutionEvent[];
  activeGoalId?: string;
  activePlanId?: string;
  planResetWindowStart?: string;
  planResetCount?: number;
  planResetLimit: number;
  microStepLimit: number;
  microStepWindowStart?: string;
  microStepCount: number;

  createGoal: (title: string, userId?: string) => Goal;
  setGoalStatus: (goalId: string, status: GoalStatus) => void;
  addAnswer: (
    goalId: string,
    questionKey: string,
    questionText: string,
    answerText: string
  ) => GoalClarificationAnswer;
  createWeeklyPlan: (
    goalId: string,
    startDate: string,
    status?: WeeklyPlanStatus,
    userId?: string
  ) => WeeklyPlan;
  setPlanStatus: (planId: string, status: WeeklyPlanStatus) => void;
  addPlanTask: (
    planId: string,
    task: Omit<
      PlanTask,
      | 'id'
      | 'weeklyPlanId'
      | 'status'
      | 'deferCount'
      | 'createdAt'
      | 'updatedAt'
      | 'lastDeferredAt'
      | 'lastDeferReason'
    > & { status?: PlanTaskStatus }
  ) => PlanTask;
  markTaskDone: (taskId: string) => void;
  deferTask: (taskId: string, reason?: import('@/types/coach').DeferReason) => void;
  addExecutionEvent: (
    taskId: string,
    type: ExecutionEvent['type'],
    userId?: string
  ) => void;
  setActiveGoal: (goalId?: string) => void;
  setActivePlan: (planId?: string) => void;
  resetActivePlan: () => void;
  canResetPlan: () => { allowed: boolean; remaining: number };
  recordPlanReset: () => void;
  canUseMicroStep: () => { allowed: boolean; remaining: number };
  recordMicroStepUse: () => void;
  adaptPlanForAvoidance: (weeklyPlanId: string, date: string) => void;
  resetCoach: () => void;
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      goals: [],
      answers: [],
      weeklyPlans: [],
      planTasks: [],
      executionEvents: [],
      activeGoalId: undefined,
      activePlanId: undefined,
      planResetWindowStart: undefined,
      planResetCount: 0,
      planResetLimit: 1,
      microStepLimit: 5,
      microStepWindowStart: undefined,
      microStepCount: 0,

      createGoal: (title, userId) => {
        const timestamp = new Date().toISOString();
        const goal: Goal = {
          id: createId('goal'),
          userId,
          title,
          status: 'draft',
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set(state => ({
          goals: [...state.goals, goal],
          activeGoalId: goal.id,
        }));
        return goal;
      },

      setGoalStatus: (goalId, status) => {
        set(state => ({
          goals: state.goals.map(goal =>
            goal.id === goalId
              ? { ...goal, status, updatedAt: new Date().toISOString() }
              : goal
          ),
        }));
      },

      addAnswer: (goalId, questionKey, questionText, answerText) => {
        const answer: GoalClarificationAnswer = {
          id: createId('answer'),
          goalId,
          questionKey,
          questionText,
          answerText,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ answers: [...state.answers, answer] }));
        return answer;
      },

      createWeeklyPlan: (goalId, startDate, status = 'locked', userId) => {
        const plan: WeeklyPlan = {
          id: createId('plan'),
          goalId,
          userId,
          startDate,
          status,
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          weeklyPlans: [...state.weeklyPlans, plan],
          activePlanId: plan.id,
        }));
        return plan;
      },

      setPlanStatus: (planId, status) => {
        set(state => ({
          weeklyPlans: state.weeklyPlans.map(plan =>
            plan.id === planId ? { ...plan, status } : plan
          ),
        }));
      },

      addPlanTask: (planId, task) => {
        const timestamp = new Date().toISOString();
        const newTask: PlanTask = {
          id: createId('task'),
          weeklyPlanId: planId,
          title: task.title,
          whyThisMatters: task.whyThisMatters,
          nextAction: task.nextAction,
          estimateMinutes: task.estimateMinutes,
          scheduledDate: task.scheduledDate,
          priority: task.priority,
          status: task.status || 'todo',
          deferCount: 0,
          actionType: task.actionType,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set(state => ({ planTasks: [...state.planTasks, newTask] }));
        return newTask;
      },

      markTaskDone: taskId => {
        set(state => ({
          planTasks: state.planTasks.map(task =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'done',
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      deferTask: (taskId, reason) => {
        set(state => ({
          planTasks: state.planTasks.map(task =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'deferred',
                  deferCount: task.deferCount + 1,
                  lastDeferredAt: new Date().toISOString(),
                  lastDeferReason: reason,
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        }));
      },

      addExecutionEvent: (taskId, type, userId) => {
        const event: ExecutionEvent = {
          id: createId('event'),
          userId,
          taskId,
          type,
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          executionEvents: [...state.executionEvents, event],
        }));
      },

      setActiveGoal: goalId => {
        set({ activeGoalId: goalId });
      },

      setActivePlan: planId => {
        set({ activePlanId: planId });
      },

      canResetPlan: () => {
        const { planResetWindowStart, planResetCount, planResetLimit } = get();
        const now = Date.now();
        const windowStart = planResetWindowStart
          ? new Date(planResetWindowStart).getTime()
          : now;
        const diffDays = Math.floor((now - windowStart) / 86_400_000);
        const resetWindowStart =
          diffDays >= 30 ? new Date().toISOString() : planResetWindowStart;
        if (diffDays >= 30) {
          set({ planResetWindowStart: resetWindowStart, planResetCount: 0 });
          return { allowed: true, remaining: planResetLimit };
        }
        const remaining = Math.max(planResetLimit - (planResetCount || 0), 0);
        return { allowed: remaining > 0, remaining };
      },

      recordPlanReset: () => {
        const { planResetWindowStart, planResetCount } = get();
        if (!planResetWindowStart) {
          set({
            planResetWindowStart: new Date().toISOString(),
            planResetCount: 1,
          });
          return;
        }
        set({ planResetCount: (planResetCount || 0) + 1 });
      },

      canUseMicroStep: () => {
        const { microStepWindowStart, microStepCount, microStepLimit } = get();
        const now = Date.now();
        const windowStart = microStepWindowStart
          ? new Date(microStepWindowStart).getTime()
          : now;
        const diffDays = Math.floor((now - windowStart) / 86_400_000);
        const resetWindowStart =
          diffDays >= 1 ? new Date().toISOString() : microStepWindowStart;
        if (diffDays >= 1) {
          set({ microStepWindowStart: resetWindowStart, microStepCount: 0 });
          return { allowed: true, remaining: microStepLimit };
        }
        const remaining = Math.max(microStepLimit - (microStepCount || 0), 0);
        return { allowed: remaining > 0, remaining };
      },

      recordMicroStepUse: () => {
        const { microStepWindowStart, microStepCount } = get();
        if (!microStepWindowStart) {
          set({
            microStepWindowStart: new Date().toISOString(),
            microStepCount: 1,
          });
          return;
        }
        set({ microStepCount: (microStepCount || 0) + 1 });
      },

      resetActivePlan: () => {
        const { activePlanId } = get();
        if (!activePlanId) {
          return;
        }
        set(state => ({
          weeklyPlans: state.weeklyPlans.map(plan =>
            plan.id === activePlanId ? { ...plan, status: 'archived' } : plan
          ),
          planTasks: state.planTasks.filter(
            task => task.weeklyPlanId !== activePlanId
          ),
          activePlanId: undefined,
        }));
      },

      adaptPlanForAvoidance: (weeklyPlanId, date) => {
        const state = get();
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        
        // Get tasks deferred >= 2 times with same reason
        const deferredTasks = state.planTasks.filter(
          task =>
            task.weeklyPlanId === weeklyPlanId &&
            task.deferCount >= 2 &&
            task.lastDeferReason &&
            task.scheduledDate === date
        );

        // Get tomorrow's tasks
        const tomorrowTasks = state.planTasks.filter(
          task =>
            task.weeklyPlanId === weeklyPlanId &&
            task.scheduledDate === tomorrowStr &&
            task.status !== 'done'
        );

        // Group by defer reason
        const byReason = deferredTasks.reduce<
          Record<string, typeof deferredTasks>
        >((acc, task) => {
          const reason = task.lastDeferReason || 'unknown';
          acc[reason] = acc[reason] || [];
          acc[reason].push(task);
          return acc;
        }, {});

        // Apply adaptations
        const updates: Array<{ id: string; updates: Partial<PlanTask> }> = [];
        const newTasks: Array<Omit<PlanTask, 'id' | 'weeklyPlanId' | 'status' | 'deferCount' | 'createdAt' | 'updatedAt' | 'lastDeferredAt' | 'lastDeferReason'> & { status?: PlanTaskStatus }> = [];

        // tooLong: reduce estimate and make nextAction smaller
        if (byReason.tooLong && byReason.tooLong.length > 0) {
          byReason.tooLong.forEach(task => {
            const tomorrowTask = tomorrowTasks.find(
              t => t.title === task.title || t.priority === task.priority
            );
            if (tomorrowTask) {
              const newEstimate = Math.max(
                5,
                Math.floor(tomorrowTask.estimateMinutes * 0.5)
              );
              updates.push({
                id: tomorrowTask.id,
                updates: {
                  estimateMinutes: newEstimate,
                  nextAction: tomorrowTask.nextAction.split('.')[0] + '.',
                },
              });
            }
          });
        }

        // tooHard: split into setup + main
        if (byReason.tooHard && byReason.tooHard.length > 0) {
          byReason.tooHard.forEach(task => {
            const tomorrowTask = tomorrowTasks.find(
              t => t.title === task.title || t.priority === task.priority
            );
            if (tomorrowTask && tomorrowTasks.length < 3) {
              // Create setup task
              newTasks.push({
                title: `Get ready: ${tomorrowTask.title}`,
                whyThisMatters: 'Breaking this into smaller steps makes it doable.',
                nextAction: 'Spend 5 minutes gathering what you need.',
                estimateMinutes: 5,
                scheduledDate: tomorrowStr,
                priority: (tomorrowTask.priority as 1 | 2 | 3) || 1,
                actionType: tomorrowTask.actionType || 'environment',
                status: 'todo',
              });
              // Update main task
              updates.push({
                id: tomorrowTask.id,
                updates: {
                  priority: Math.min(3, (tomorrowTask.priority || 1) + 1) as 1 | 2 | 3,
                },
              });
            }
          });
        }

        // dontKnowHow: insert research action
        if (byReason.dontKnowHow && byReason.dontKnowHow.length > 0) {
          byReason.dontKnowHow.forEach(task => {
            if (tomorrowTasks.length < 3) {
              const tomorrowTask = tomorrowTasks.find(
                t => t.title === task.title || t.priority === task.priority
              );
              newTasks.push({
                title: 'Get clear on the next step',
                whyThisMatters: 'Clarity removes resistance.',
                nextAction: 'Spend 5 minutes researching or asking one person.',
                estimateMinutes: 5,
                scheduledDate: tomorrowStr,
                priority: 1,
                actionType: 'environment',
                status: 'todo',
              });
            }
          });
        }

        // notImportant: replace with keystone action if missing
        if (byReason.notImportant && byReason.notImportant.length > 0) {
          byReason.notImportant.forEach(task => {
            const tomorrowTask = tomorrowTasks.find(
              t => t.id === task.id || (t.title === task.title && t.priority === task.priority)
            );
            if (tomorrowTask) {
              // Check if keystone actions exist
              const hasProtein = tomorrowTasks.some(t => t.actionType === 'protein');
              const hasHydration = tomorrowTasks.some(t => t.actionType === 'hydration');
              const hasEnvironment = tomorrowTasks.some(t => t.actionType === 'environment');

              // Replace with missing keystone
              if (!hasProtein) {
                updates.push({
                  id: tomorrowTask.id,
                  updates: {
                    title: 'Hit your protein target today',
                    whyThisMatters: 'Protein keeps you full and supports your goals.',
                    nextAction: 'Eat 30g protein at breakfast and lunch.',
                    estimateMinutes: 10,
                    actionType: 'protein',
                    priority: 1,
                  },
                });
              } else if (!hasHydration) {
                updates.push({
                  id: tomorrowTask.id,
                  updates: {
                    title: 'Track your water intake',
                    whyThisMatters: 'Hydration supports energy and reduces false hunger.',
                    nextAction: 'Drink 8 glasses of water today.',
                    estimateMinutes: 5,
                    actionType: 'hydration',
                    priority: 1,
                  },
                });
              } else if (!hasEnvironment) {
                updates.push({
                  id: tomorrowTask.id,
                  updates: {
                    title: 'Set up your environment',
                    whyThisMatters: 'A prepared environment makes healthy choices automatic.',
                    nextAction: 'Clear one counter space and stock 3 protein sources.',
                    estimateMinutes: 15,
                    actionType: 'environment',
                    priority: 1,
                  },
                });
              } else {
                // Just demote priority
                updates.push({
                  id: tomorrowTask.id,
                  updates: {
                    priority: 3,
                  },
                });
              }
            }
          });
        }

        // Apply updates
        set(state => ({
          planTasks: state.planTasks.map(task => {
            const update = updates.find(u => u.id === task.id);
            if (update) {
              return {
                ...task,
                ...update.updates,
                updatedAt: new Date().toISOString(),
              };
            }
            return task;
          }),
        }));

        // Add new tasks
        newTasks.forEach(task => {
          get().addPlanTask(weeklyPlanId, task);
        });
      },

      resetCoach: () =>
        set({
          goals: [],
          answers: [],
          weeklyPlans: [],
          planTasks: [],
          executionEvents: [],
          activeGoalId: undefined,
          activePlanId: undefined,
          planResetWindowStart: undefined,
          planResetCount: 0,
          planResetLimit: 1,
          microStepLimit: 5,
          microStepWindowStart: undefined,
          microStepCount: 0,
        }),
    }),
    {
      name: 'fiit_coach_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
