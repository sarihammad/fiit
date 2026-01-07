import { useCoachStore } from '../coach.store';
import { PlanTask, WeeklyPlan } from '@/types/coach';

describe('adaptPlanForAvoidance', () => {
  beforeEach(() => {
    // Reset store
    useCoachStore.setState({
      weeklyPlans: [],
      planTasks: [],
      activePlanId: undefined,
    });
  });

  it('never exceeds 3 tasks per day', () => {
    // Create a plan with tasks
    const plan: WeeklyPlan = {
      id: 'plan1',
      goalId: 'goal1',
      startDate: '2025-01-15',
      status: 'locked',
      createdAt: new Date().toISOString(),
    };

    const tasks: PlanTask[] = [
      {
        id: 'task1',
        weeklyPlanId: 'plan1',
        title: 'Task 1',
        whyThisMatters: '...',
        nextAction: '...',
        estimateMinutes: 10,
        scheduledDate: '2025-01-16',
        priority: 1,
        status: 'todo',
        deferCount: 0,
        actionType: 'protein_anchor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task2',
        weeklyPlanId: 'plan1',
        title: 'Task 2',
        whyThisMatters: '...',
        nextAction: '...',
        estimateMinutes: 10,
        scheduledDate: '2025-01-16',
        priority: 2,
        status: 'todo',
        deferCount: 0,
        actionType: 'steps',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task3',
        weeklyPlanId: 'plan1',
        title: 'Task 3',
        whyThisMatters: '...',
        nextAction: '...',
        estimateMinutes: 10,
        scheduledDate: '2025-01-16',
        priority: 3,
        status: 'todo',
        deferCount: 0,
        actionType: 'hydration',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    useCoachStore.setState({
      weeklyPlans: [plan],
      planTasks: tasks,
      activePlanId: 'plan1',
    });

    // Defer task1 multiple times to trigger adaptation
    useCoachStore.getState().deferTask('task1', 'tooLong');
    useCoachStore.getState().deferTask('task1', 'tooLong');

    // Adapt plan
    useCoachStore.getState().adaptPlanForAvoidance('plan1', '2025-01-16');

    // Check tomorrow's tasks
    const tomorrowTasks = useCoachStore
      .getState()
      .planTasks.filter(t => t.scheduledDate === '2025-01-16');

    // Should not exceed 3 tasks per day
    expect(tomorrowTasks.length).toBeLessThanOrEqual(3);
  });
});

