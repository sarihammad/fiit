import { AICoachEngine } from '../aiCoach';

describe('AICoachEngine', () => {
  it('returns a single nutrition-focused clarification question', async () => {
    const question = await AICoachEngine.getClarificationQuestion(
      'Lose 15 lbs without starving',
      []
    );
    expect(question.questionKey).toBeTruthy();
    expect(['targetOutcome', 'constraints', 'schedule', 'resources', 'habits', 'timeAvailable', 'confidence']).toContain(question.questionKey);
    expect(question.questionText.length).toBeGreaterThan(3);
  });

  it('generates a fat loss weekly plan with limited tasks', async () => {
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose 15 lbs without starving',
      [],
      new Date('2025-01-06')
    );
    expect(plan.planTitle).toContain('Fat Loss Plan');
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.tasks.length).toBeLessThanOrEqual(21);
    const firstTask = plan.tasks[0];
    expect(firstTask.title.length).toBeGreaterThan(3);
    expect(firstTask.estimateMinutes).toBeGreaterThanOrEqual(5);
    expect(firstTask.actionType).toBeTruthy();
    expect(['meal_prep', 'grocery', 'protein_anchor', 'steps', 'hydration', 'sleep', 'environment', 'craving_plan']).toContain(firstTask.actionType);
    expect(plan.rulesOfTheWeek).toBeDefined();
    expect(plan.rulesOfTheWeek.length).toBeGreaterThan(0);
    expect(plan.rulesOfTheWeek.length).toBeLessThanOrEqual(3);
  });

  it('generates a micro-step within 5-10 minutes', async () => {
    const step = await AICoachEngine.generateMicroStep('Meal prep for the week', 3);
    expect(step.estimateMinutes).toBeGreaterThanOrEqual(5);
    expect(step.estimateMinutes).toBeLessThanOrEqual(10);
    expect(step.rewrittenTitle).toBeTruthy();
    expect(step.fiveMinuteVersion).toBeTruthy();
  });

  it('generates micro-step with defer reason context', async () => {
    const step = await AICoachEngine.generateMicroStep('Plan weekly meals', 3, 'tooHard');
    expect(step.fiveMinuteVersion).toBeTruthy();
    expect(step.fiveMinuteVersion.length).toBeGreaterThan(3);
  });
});
