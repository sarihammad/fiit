import { FeedbackService, FeedbackContext, NutritionData } from '../feedback';

// Mock HTTP service
jest.mock('../http', () => ({
  http: {
    post: jest.fn(),
  },
}));

import { http } from '../http';
const mockHttp = http as jest.Mocked<typeof http>;

describe('FeedbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockContext: FeedbackContext = {
    date: '2024-01-15',
    mealsLogged: 3,
    weightLogged: true,
    exerciseLogged: false,
    sleepHours: 8,
    stressLevel: 3,
    mood: 'good',
  };

  const mockNutritionData: NutritionData = {
    totalCalories: 1800,
    totalProtein: 120,
    totalCarbs: 200,
    totalFat: 60,
    targetCalories: 2000,
    targetProtein: 150,
    targetCarbs: 250,
    targetFat: 65,
  };

  describe('generateFeedback', () => {
    it('should generate feedback successfully', async () => {
      const mockResponse = {
        id: 'feedback-123',
        date: '2024-01-15',
        summary: 'Great job on your nutrition today!',
        tomorrowTip: 'Try adding more vegetables to your lunch.',
        proteinNote: "You're close to your protein target.",
        hydrationNote: 'Remember to drink more water.',
        mood: 'supportive' as const,
        streak: 5,
      };

      mockHttp.post.mockResolvedValue(mockResponse);

      const result = await FeedbackService.generateFeedback(
        mockContext,
        mockNutritionData
      );

      expect(result).toEqual(mockResponse);
      expect(mockHttp.post).toHaveBeenCalledWith('/feedback/generate', {
        context: mockContext,
        nutritionData: mockNutritionData,
      });
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockHttp.post.mockRejectedValue(error);

      const result = await FeedbackService.generateFeedback(
        mockContext,
        mockNutritionData
      );

      expect(result).toBeNull();
    });
  });

  describe('generateNextBestAction', () => {
    it('should suggest meal logging in the morning', () => {
      const morningContext = { ...mockContext };
      const result = FeedbackService.generateNextBestAction(
        morningContext,
        mockNutritionData
      );

      expect(result.actionType).toBe('log_meal');
      expect(result.priority).toBe('high');
    });

    it('should suggest meal planning in the afternoon', () => {
      const afternoonContext = { ...mockContext };
      const result = FeedbackService.generateNextBestAction(
        afternoonContext,
        mockNutritionData
      );

      expect(result.actionType).toBe('plan_meal');
      expect(result.priority).toBe('medium');
    });

    it('should suggest feedback viewing in the evening', () => {
      const eveningContext = { ...mockContext };
      const result = FeedbackService.generateNextBestAction(
        eveningContext,
        mockNutritionData
      );

      expect(result.actionType).toBe('view_feedback');
      expect(result.priority).toBe('low');
    });
  });

  describe('getNutritionTips', () => {
    it('should provide tips for low protein intake', () => {
      const lowProteinData = { ...mockNutritionData, totalProtein: 50 };
      const tips = FeedbackService.getNutritionTips(lowProteinData);

      expect(tips).toContain(
        'Consider adding more protein-rich foods like chicken, fish, or beans.'
      );
    });

    it('should provide tips for high calorie intake', () => {
      const highCalorieData = { ...mockNutritionData, totalCalories: 2500 };
      const tips = FeedbackService.getNutritionTips(highCalorieData);

      expect(tips).toContain(
        "You've exceeded your calorie target. Consider reducing portion sizes."
      );
    });

    it('should provide tips for balanced nutrition', () => {
      const balancedData = { ...mockNutritionData };
      const tips = FeedbackService.getNutritionTips(balancedData);

      expect(tips).toContain('Great job maintaining balanced nutrition!');
    });
  });

  describe('getMotivationalMessage', () => {
    it('should provide encouraging message for good progress', () => {
      const message = FeedbackService.getMotivationalMessage(0.8, 7);
      expect(message).toContain('amazing progress');
    });

    it('should provide supportive message for moderate progress', () => {
      const message = FeedbackService.getMotivationalMessage(0.5, 3);
      expect(message).toContain('keep going');
    });

    it('should provide motivating message for low progress', () => {
      const message = FeedbackService.getMotivationalMessage(0.2, 1);
      expect(message).toContain('every step counts');
    });
  });
});
