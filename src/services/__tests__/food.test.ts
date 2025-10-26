// Food service tests
import {
  analyzePhoto,
  convertToMealItem,
  searchFood,
  getNutritionData,
} from '../food';
import * as FileSystem from 'expo-file-system';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('../http');

const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

// Mock fetch
global.fetch = jest.fn();

describe('FoodService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzePhoto', () => {
    it('should analyze photo successfully', async () => {
      const mockFileInfo = {
        exists: true as const,
        uri: 'file://test-image.jpg',
        size: 500000,
        isDirectory: false,
        modificationTime: Date.now(),
      };

      const mockBase64Data = 'base64-encoded-image-data';
      const mockResponse = {
        topk: [
          { label: 'chicken breast', prob: 0.95 },
          { label: 'grilled chicken', prob: 0.85 },
          { label: 'chicken thigh', prob: 0.75 },
        ],
        decision: 'auto_accept' as const,
        nutrition: {
          food_name: 'Chicken Breast',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          portion_g: 100,
          fdcId: 12345,
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      mockFileSystem.getInfoAsync.mockResolvedValue(mockFileInfo);
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64Data);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Health check
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await analyzePhoto('file://test-image.jpg');

      expect(result).toEqual({
        ...mockResponse,
        topk: [
          { label: 'Chicken Breast', prob: 0.95 },
          { label: 'Grilled Chicken', prob: 0.85 },
          { label: 'Chicken Thigh', prob: 0.75 },
        ],
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle photo analysis failure', async () => {
      const mockFileInfo = {
        exists: true as const,
        uri: 'file://test-image.jpg',
        size: 500000,
        isDirectory: false,
        modificationTime: Date.now(),
      };

      const mockBase64Data = 'base64-encoded-image-data';

      mockFileSystem.getInfoAsync.mockResolvedValue(mockFileInfo);
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64Data);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Health check
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

      const result = await analyzePhoto('file://test-image.jpg');

      expect(result).toEqual({
        error: true,
        message: 'HTTP 400',
      });
    });

    it('should handle file not found', async () => {
      const mockFileInfo = {
        exists: false as const,
        uri: 'file://non-existent.jpg',
        isDirectory: false as const,
      };

      mockFileSystem.getInfoAsync.mockResolvedValue(mockFileInfo);

      const result = await analyzePhoto('file://nonexistent-image.jpg');

      expect(result).toEqual({
        error: true,
        message: 'Photo file does not exist',
      });
    });

    it('should fallback to Nutritionix on timeout', async () => {
      const mockFileInfo = {
        exists: true as const,
        uri: 'file://test-image.jpg',
        size: 500000,
        isDirectory: false,
        modificationTime: Date.now(),
      };

      const mockBase64Data = 'base64-encoded-image-data';

      mockFileSystem.getInfoAsync.mockResolvedValue(mockFileInfo);
      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64Data);
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Health check
        .mockRejectedValueOnce(new Error('Request timed out'));

      const result = await analyzePhoto('file://test-image.jpg');

      expect(result).toEqual({
        error: true,
        message: 'Request timed out.',
      });
    });
  });

  describe('convertToMealItem', () => {
    it('should convert FoodRecognitionResult to MealItem', () => {
      const mockResult = {
        topk: [{ label: 'Chicken Breast', prob: 0.95 }],
        decision: 'auto_accept' as const,
        nutrition: {
          food_name: 'Chicken Breast',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          portion_g: 100,
          fdcId: 12345,
        },
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = convertToMealItem(mockResult, 'Chicken Breast', 150);

      expect(result).toEqual({
        id: expect.stringMatching(/^vit_\d+_[a-z0-9]+$/),
        name: 'Chicken Breast',
        brand: undefined,
        quantity: 150,
        unit: 'g',
        macros: {
          calories: 248, // 165 * 1.5
          protein: 46.5, // 31 * 1.5
          carbs: 0,
          fat: 5.4, // 3.6 * 1.5
          fiber: 0,
        },
        timestamp: expect.any(String),
        source: 'vision',
        imageUrl: undefined,
      });
    });

    it('should return null for fallback decision', () => {
      const mockResult = {
        topk: [{ label: 'Unknown Food', prob: 0.3 }],
        decision: 'fallback' as const,
        nutrition: null,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = convertToMealItem(mockResult);

      expect(result).toBeNull();
    });

    it('should return null when no nutrition data', () => {
      const mockResult = {
        topk: [{ label: 'Chicken Breast', prob: 0.95 }],
        decision: 'auto_accept' as const,
        nutrition: null,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = convertToMealItem(mockResult);

      expect(result).toBeNull();
    });
  });

  describe('searchFood', () => {
    it('should search for food successfully', async () => {
      const mockResponse = {
        common: [
          {
            food_name: 'Chicken Breast',
            brand_name: 'Generic',
            photo: { thumb: 'https://example.com/chicken.jpg' },
          },
          {
            food_name: 'Grilled Chicken',
            brand_name: 'Generic',
            photo: { thumb: 'https://example.com/grilled-chicken.jpg' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await searchFood('chicken');

      expect(result).toEqual([
        {
          id: 'Chicken Breast',
          name: 'Chicken Breast',
          brand: 'Generic',
          imageUrl: 'https://example.com/chicken.jpg',
        },
        {
          id: 'Grilled Chicken',
          name: 'Grilled Chicken',
          brand: 'Generic',
          imageUrl: 'https://example.com/grilled-chicken.jpg',
        },
      ]);
    });

    it('should handle search failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await searchFood('chicken');

      expect(result).toEqual([]);
    });

    it('should handle missing API key', async () => {
      // Mock environment variable
      const originalEnv = process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY;
      process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY = '';

      const result = await searchFood('chicken');

      expect(result).toEqual([]);

      // Restore environment variable
      process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY = originalEnv;
    });
  });

  describe('getNutritionData', () => {
    it('should get nutrition data successfully', async () => {
      const mockResponse = {
        foods: [
          {
            food_name: 'Chicken Breast',
            nf_calories: 165,
            nf_protein: 31,
            nf_total_carbohydrate: 0,
            nf_total_fat: 3.6,
            nf_dietary_fiber: 0,
            serving_weight_grams: 100,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getNutritionData('chicken breast');

      expect(result).toEqual(mockResponse.foods[0]);
    });

    it('should handle nutrition data failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await getNutritionData('nonexistent food');

      expect(result).toBeNull();
    });
  });
});
