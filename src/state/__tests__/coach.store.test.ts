jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useCoachStore } from '../coach.store';

describe('Coach store', () => {
  beforeEach(() => {
    useCoachStore.getState().resetCoach();
  });

  it('creates a goal and adds clarification answers', () => {
    const store = useCoachStore.getState();
    const goal = store.createGoal('Lose 15 lbs without starving');
    expect(goal.title).toBe('Lose 15 lbs without starving');
    // Check activeGoalId from fresh state
    const freshState = useCoachStore.getState();
    expect(freshState.activeGoalId).toBe(goal.id);

    const answer = store.addAnswer(
      goal.id,
      'targetOutcome',
      'What does success look like in 7 days?',
      'Feel more energy and lose 2 lbs'
    );
    expect(answer.goalId).toBe(goal.id);
    expect(useCoachStore.getState().answers).toHaveLength(1);
  });

  it('creates a plan and tasks and tracks deferrals', () => {
    const store = useCoachStore.getState();
    const goal = store.createGoal('Hit 140g protein daily');
    const plan = store.createWeeklyPlan(goal.id, '2025-01-06');
    // Check activePlanId from fresh state
    const freshState = useCoachStore.getState();
    expect(freshState.activePlanId).toBe(plan.id);

    const task = store.addPlanTask(plan.id, {
      title: 'Meal prep for the week',
      whyThisMatters: 'Prepared meals make hitting protein targets easier.',
      nextAction: 'Cook 3 protein sources and portion them.',
      estimateMinutes: 30,
      scheduledDate: '2025-01-06',
      priority: 1,
      actionType: 'meal_prep',
    });

    store.deferTask(task.id, 'tooHard');
    const updated = useCoachStore
      .getState()
      .planTasks.find(t => t.id === task.id);
    expect(updated?.deferCount).toBe(1);
    expect(updated?.status).toBe('deferred');
    expect(updated?.lastDeferReason).toBe('tooHard');
  });

  it('enforces plan reset limits and micro-step limits', () => {
    const store = useCoachStore.getState();
    expect(store.canResetPlan().allowed).toBe(true);
    store.recordPlanReset();
    expect(store.canResetPlan().allowed).toBe(false);

    expect(store.canUseMicroStep().allowed).toBe(true);
    store.recordMicroStepUse();
    store.recordMicroStepUse();
    store.recordMicroStepUse();
    store.recordMicroStepUse();
    store.recordMicroStepUse();
    expect(store.canUseMicroStep().allowed).toBe(false);
  });
});
