import { __testOnly } from '../aiCoach';
import { GoalClarificationAnswer } from '@/types/coach';

// Access the internal enforcePlanConstraints via a test helper
// Since it's not exported, we'll test via the public API that uses it
describe('Plan Constraints (Fat Loss)', () => {
  it('enforces environment or grocery in first 48 hours', async () => {
    const { AICoachEngine } = await import('../aiCoach');
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      [],
      new Date('2025-01-15')
    );
    
    const first48Hours = plan.tasks
      .filter(t => {
        const taskDate = new Date(t.day);
        const startDate = new Date('2025-01-15');
        const diffDays = Math.floor((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays < 2;
      });
    
    const hasEnvOrGrocery = first48Hours.some(
      t => t.actionType === 'environment' || t.actionType === 'grocery'
    );
    expect(hasEnvOrGrocery).toBe(true);
  });

  it('enforces protein anchor in first 48 hours', async () => {
    const { AICoachEngine } = await import('../aiCoach');
    const plan = await AICoachEngine.generateWeeklyPlan(
      'Lose fat without starving',
      [],
      new Date('2025-01-15')
    );
    
    const first48Hours = plan.tasks
      .filter(t => {
        const taskDate = new Date(t.day);
        const startDate = new Date('2025-01-15');
        const diffDays = Math.floor((taskDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays < 2;
      });
    
    const hasProtein = first48Hours.some(t => t.actionType === 'protein_anchor');
    expect(hasProtein).toBe(true);
  });

  it('enforces 2 craving plan tasks when habits mention cravings', async () => {
    const { AICoachEngine } = await import('../aiCoach');
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
    expect(cravingPlans.length).toBeGreaterThanOrEqual(2);
  });

  it('ensures every day has a satiety action', async () => {
    const { AICoachEngine } = await import('../aiCoach');
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
    const { AICoachEngine } = await import('../aiCoach');
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

