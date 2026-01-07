import { validateFatLossPlan } from '../planValidation';
import { GoalClarificationAnswer } from '@/types/coach';

describe('planValidation', () => {
  const baseAnswers: GoalClarificationAnswer[] = [];

  it('validates a plan with all requirements', () => {
    const plan = {
      tasks: [
        { day: '2025-01-15', priority: 1, title: 'Env setup', whyThisMatters: '...', nextAction: '...', estimateMinutes: 15, actionType: 'environment' },
        { day: '2025-01-15', priority: 1, title: 'Protein', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'protein_anchor' },
        { day: '2025-01-16', priority: 1, title: 'Meal prep', whyThisMatters: '...', nextAction: '...', estimateMinutes: 30, actionType: 'meal_prep' },
        { day: '2025-01-17', priority: 1, title: 'Steps', whyThisMatters: '...', nextAction: '...', estimateMinutes: 20, actionType: 'steps' },
        { day: '2025-01-18', priority: 1, title: 'Protein', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'protein_anchor' },
        { day: '2025-01-19', priority: 1, title: 'Hydration', whyThisMatters: '...', nextAction: '...', estimateMinutes: 5, actionType: 'hydration' },
        { day: '2025-01-20', priority: 1, title: 'Steps', whyThisMatters: '...', nextAction: '...', estimateMinutes: 20, actionType: 'steps' },
        { day: '2025-01-21', priority: 1, title: 'Protein', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'protein_anchor' },
      ],
    };

    const result = validateFatLossPlan(plan, baseAnswers);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails if first 48 hours missing environment/grocery', () => {
    const plan = {
      tasks: [
        { day: '2025-01-15', priority: 1, title: 'Protein', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'protein_anchor' },
        { day: '2025-01-16', priority: 1, title: 'Steps', whyThisMatters: '...', nextAction: '...', estimateMinutes: 20, actionType: 'steps' },
      ],
    };

    const result = validateFatLossPlan(plan, baseAnswers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('First 2 days must include an environment or grocery action');
  });

  it('fails if first 48 hours missing protein_anchor', () => {
    const plan = {
      tasks: [
        { day: '2025-01-15', priority: 1, title: 'Env', whyThisMatters: '...', nextAction: '...', estimateMinutes: 15, actionType: 'environment' },
        { day: '2025-01-16', priority: 1, title: 'Steps', whyThisMatters: '...', nextAction: '...', estimateMinutes: 20, actionType: 'steps' },
      ],
    };

    const result = validateFatLossPlan(plan, baseAnswers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('First 2 days must include a protein anchor action');
  });

  it('fails if day has more than 3 tasks', () => {
    const plan = {
      tasks: [
        { day: '2025-01-15', priority: 1, title: 'Env', whyThisMatters: '...', nextAction: '...', estimateMinutes: 15, actionType: 'environment' },
        { day: '2025-01-15', priority: 2, title: 'Protein', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'protein_anchor' },
        { day: '2025-01-15', priority: 3, title: 'Steps', whyThisMatters: '...', nextAction: '...', estimateMinutes: 20, actionType: 'steps' },
        { day: '2025-01-15', priority: 1, title: 'Extra', whyThisMatters: '...', nextAction: '...', estimateMinutes: 5, actionType: 'hydration' },
      ],
    };

    const result = validateFatLossPlan(plan, baseAnswers);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('has 4 tasks'))).toBe(true);
  });

  it('requires 2 craving_plan tasks if cravings mentioned', () => {
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

    const plan = {
      tasks: [
        { day: '2025-01-15', priority: 1, title: 'Env', whyThisMatters: '...', nextAction: '...', estimateMinutes: 15, actionType: 'environment' },
        { day: '2025-01-15', priority: 1, title: 'Protein', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'protein_anchor' },
        { day: '2025-01-16', priority: 1, title: 'Craving plan', whyThisMatters: '...', nextAction: '...', estimateMinutes: 10, actionType: 'craving_plan' },
      ],
    };

    const result = validateFatLossPlan(plan, answers);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plan needs at least 2 craving plan actions (you mentioned cravings)');
  });
});

