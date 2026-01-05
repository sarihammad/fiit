import { AICoachEngine } from '../aiCoach';
import { GoalClarificationAnswer } from '@/types/coach';

describe('Plan Constraints (Fat Loss)', () => {
  it('enforces environment or grocery in first 48 hours', async () => {
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      [],
      new Date('2025-01-15')
    );
    
    // Get first 2 days (first 48 hours)
    const sortedDays = [...new Set(plan.tasks.map(t => t.day))].sort();
    const first2Days = sortedDays.slice(0, 2);
    const first48Hours = plan.tasks.filter(t => first2Days.includes(t.day));
    
    const hasEnvOrGrocery = first48Hours.some(
      t => t.actionType === 'environment' || t.actionType === 'grocery'
    );
    expect(hasEnvOrGrocery).toBe(true);
  });

  it('enforces protein anchor in first 48 hours', async () => {
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      [],
      new Date('2025-01-15')
    );
    
    const sortedDays = [...new Set(plan.tasks.map(t => t.day))].sort();
    const first2Days = sortedDays.slice(0, 2);
    const first48Hours = plan.tasks.filter(t => first2Days.includes(t.day));
    
    const hasProtein = first48Hours.some(t => t.actionType === 'protein_anchor');
    expect(hasProtein).toBe(true);
  });

  it('enforces craving plan tasks when habits mention cravings', async () => {
    const answers: GoalClarificationAnswer[] = [
      {
        id: '1',
        goalId: 'goal1',
        questionKey: 'habits',
        questionText: 'What breaks your diet most?',
        answerText: 'Cravings and late night snacking',
        createdAt: new Date().toISOString(),
      },
    ];
    
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      answers,
      new Date('2025-01-15')
    );
    
    const cravingPlans = plan.tasks.filter(t => t.actionType === 'craving_plan');
    // Should have at least 1, ideally 2
    expect(cravingPlans.length).toBeGreaterThanOrEqual(1);
  });

  it('ensures every day has a satiety action', async () => {
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      [],
      new Date('2025-01-15')
    );
    
    const days = [...new Set(plan.tasks.map(t => t.day))];
    days.forEach(day => {
      const dayTasks = plan.tasks.filter(t => t.day === day);
      const hasSatiety = dayTasks.some(
        t => t.actionType === 'protein_anchor' ||
             t.actionType === 'meal_prep' ||
             t.actionType === 'environment' ||
             t.actionType === 'craving_plan'
      );
      expect(hasSatiety).toBe(true);
    });
  });

  it('caps actions per day to max 3', async () => {
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      [],
      new Date('2025-01-15')
    );
    
    const days = [...new Set(plan.tasks.map(t => t.day))];
    days.forEach(day => {
      const dayTasks = plan.tasks.filter(t => t.day === day);
      expect(dayTasks.length).toBeLessThanOrEqual(3);
    });
  });
});

