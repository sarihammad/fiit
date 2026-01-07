import { generateCoachFeedback, getYesterdayLog, DailyLog, NutritionTargets } from '../nutritionCoach';

describe('NutritionCoachService', () => {
  describe('generateCoachFeedback', () => {
    it('returns empty state message when no log provided', () => {
      const feedback = generateCoachFeedback(null, {});
      expect(feedback.summary).toContain('No data logged');
      expect(feedback.tomorrowTip).toBeTruthy();
    });

    it('generates feedback for on-track calories and protein', () => {
      const log: DailyLog = {
        date: '2025-01-15',
        calories: 2000,
        protein: 120,
        hydration: 8,
      };
      const targets: NutritionTargets = {
        calories: 2000,
        protein: 120,
        hydration: 8,
      };
      const feedback = generateCoachFeedback(log, targets);
      expect(feedback.summary).toContain('on track');
      expect(feedback.tomorrowTip).toBeTruthy();
    });

    it('generates protein note when protein is low', () => {
      const log: DailyLog = {
        date: '2025-01-15',
        calories: 2000,
        protein: 60,
        hydration: 8,
      };
      const targets: NutritionTargets = {
        calories: 2000,
        protein: 120,
        hydration: 8,
      };
      const feedback = generateCoachFeedback(log, targets);
      expect(feedback.proteinNote).toBeTruthy();
      expect(feedback.proteinNote).toContain('protein');
    });

    it('generates hydration note when hydration is low', () => {
      const log: DailyLog = {
        date: '2025-01-15',
        calories: 2000,
        protein: 120,
        hydration: 2,
      };
      const targets: NutritionTargets = {
        calories: 2000,
        protein: 120,
        hydration: 8,
      };
      const feedback = generateCoachFeedback(log, targets);
      expect(feedback.hydrationNote).toBeTruthy();
      expect(feedback.hydrationNote).toContain('water');
    });

    it('does not crash on empty logs', () => {
      const log: DailyLog = {
        date: '2025-01-15',
      };
      const targets: NutritionTargets = {};
      const feedback = generateCoachFeedback(log, targets);
      expect(feedback.summary).toBeTruthy();
      expect(feedback.tomorrowTip).toBeTruthy();
    });
  });

  describe('getYesterdayLog', () => {
    it('finds yesterday log from array', () => {
      const logs: DailyLog[] = [
        { date: '2025-01-14', calories: 1800 },
        { date: '2025-01-15', calories: 2000 },
      ];
      const yesterday = getYesterdayLog(logs, '2025-01-15');
      expect(yesterday).toBeTruthy();
      expect(yesterday?.date).toBe('2025-01-14');
    });

    it('returns null if yesterday log not found', () => {
      const logs: DailyLog[] = [
        { date: '2025-01-15', calories: 2000 },
      ];
      const yesterday = getYesterdayLog(logs, '2025-01-15');
      expect(yesterday).toBeNull();
    });
  });
});



