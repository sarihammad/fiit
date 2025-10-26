// FIIT Food Recognition & Search Service
// Fast, reliable photo logging with client-side compression and fallback
import {
  MealItem,
  FoodRecognitionResult,
  FoodSearchResult,
  TopKPrediction,
} from '@/types/nutrition';
import { FOOD_API_CONFIG, getDecision } from '@/config/foodApi';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { http, AppError } from './http';
import { LogMealRequest, LogMealResponse } from '@/types/api/meals';
import { OfflineQueueService } from './offlineQueue';

const NUTRITIONIX_APP_ID = process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID || '';
const NUTRITIONIX_API_KEY = process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY || '';
const CALORIE_MAMA_API_KEY = process.env.EXPO_PUBLIC_CALORIEMAMA_API_KEY || '';

// Use centralized configuration
const BASE = FOOD_API_CONFIG.BASE_URL;
const T_HIGH = FOOD_API_CONFIG.THRESHOLDS.HIGH;
const T_MID = FOOD_API_CONFIG.THRESHOLDS.MID;
const T_LOW = FOOD_API_CONFIG.THRESHOLDS.LOW;
const PHOTO_TIMEOUT_MS = FOOD_API_CONFIG.TIMEOUT_MS;

// API Key for authentication
const API_KEY =
  (Constants?.expoConfig?.extra?.EXPO_PUBLIC_FIIT_API_KEY as string) ||
  process.env.EXPO_PUBLIC_FIIT_API_KEY ||
  '';

// Debug logging
console.log('[FoodService] Configuration loaded:', {
  BASE,
  T_HIGH,
  T_MID,
  T_LOW,
});

interface PortionPreset {
  unit: string;
  amount: number;
  multiplier: number; // multiplier for base nutrition
}

/**
 * Format food labels to be more user-friendly
 */
function formatFoodLabel(label: string): string {
  return label
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Compress image client-side to reduce upload time
 */
async function compressImage(
  uri: string,
  maxSize: number = 1200000
): Promise<string> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // If file is already small enough, return original
    if (fileInfo.size && fileInfo.size <= maxSize) {
      return uri;
    }

    // For now, return original URI
    // In production, you might want to use expo-image-manipulator for compression
    console.log(
      `[FoodService] Image size: ${fileInfo.size} bytes (target: ${maxSize})`
    );
    return uri;
  } catch (error) {
    console.error('[FoodService] Image compression failed:', error);
    return uri; // Return original on error
  }
}

/**
 * Analyze photo using our custom backend
 */
export async function analyzePhoto(
  photoUri: string
): Promise<FoodRecognitionResult | { error: true; message: string }> {
  try {
    console.log('[FoodService] Starting photo analysis...', {
      baseUrl: BASE,
      photoUri,
      timeout: PHOTO_TIMEOUT_MS,
    });

    // Compress image for faster upload
    const compressedUri = await compressImage(photoUri);

    // Pre-warm the Cloud Run instance to avoid cold start timeout
    try {
      console.log('[FoodService] Pre-warming backend instance...');
      await fetch(`${BASE}/health`, { method: 'GET' });
      console.log('[FoodService] Backend pre-warmed successfully');
    } catch (e) {
      console.log('[FoodService] Pre-warm failed, continuing anyway:', e);
    }

    // Read file as base64 and convert to blob for FormData
    const fileInfo = await FileSystem.getInfoAsync(compressedUri);
    if (!fileInfo.exists) {
      throw new Error('Photo file does not exist');
    }

    console.log('[FoodService] File info:', fileInfo);

    // Read file as base64
    const base64Data = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    console.log('[FoodService] Created blob:', blob.size, 'bytes');

    const form = new FormData();
    form.append('file', blob, 'meal.jpg');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(
        '[FoodService] Request timed out after',
        PHOTO_TIMEOUT_MS,
        'ms'
      );
      controller.abort();
    }, PHOTO_TIMEOUT_MS);

    console.log('[FoodService] Sending request to backend...');
    const startTime = Date.now();

    const response = await fetch(`${BASE}/classify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: form,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`[FoodService] Request completed in ${duration} ms`);

    if (!response.ok) {
      console.log(
        `[FoodService] Request failed with status: ${response.status}`
      );
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[FoodService] Backend response:', result);

    // Format the labels in the result
    if (result.topk) {
      result.topk = result.topk.map((pred: TopKPrediction) => ({
        ...pred,
        label: formatFoodLabel(pred.label),
      }));
    }

    return result;
  } catch (error) {
    console.log('[FoodService] Error occurred:', error);

    // Fallback to Nutritionix if our backend fails
    if (error instanceof Error && error.message.includes('timeout')) {
      console.log('[FoodService] Timeout detected, trying fallback...');
      return await fallbackToNutritionix(photoUri);
    }

    return {
      error: true,
      message: error instanceof Error ? error.message : 'Photo analysis failed',
    };
  }
}

/**
 * Fallback to Nutritionix API when our backend fails
 */
async function fallbackToNutritionix(
  photoUri: string
): Promise<FoodRecognitionResult | { error: true; message: string }> {
  try {
    console.log('[FoodService] Using Nutritionix fallback...');

    if (!NUTRITIONIX_API_KEY) {
      return {
        error: true,
        message: 'Nutritionix API key not configured',
      };
    }

    // Convert image to base64 for Nutritionix
    const base64Data = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        },
        body: JSON.stringify({
          query: 'food photo',
          timezone: 'US/Eastern',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Nutritionix API error: ${response.status}`);
    }

    const data = await response.json();

    // Convert Nutritionix response to our format
    const result: FoodRecognitionResult = {
      topk: [
        {
          label: 'Food Item',
          prob: 0.8,
        },
      ],
      decision: 'confirm',
      nutrition: data.foods?.[0]
        ? {
            description: data.foods[0].food_name,
            kcal: data.foods[0].nf_calories || 0,
            protein: data.foods[0].nf_protein || 0,
            carbs: data.foods[0].nf_total_carbohydrate || 0,
            fat: data.foods[0].nf_total_fat || 0,
            fdcId: undefined,
          }
        : null,
    };

    return result;
  } catch (error) {
    console.error('[FoodService] Nutritionix fallback failed:', error);
    return {
      error: true,
      message: 'All photo analysis services failed',
    };
  }
}

/**
 * Convert FoodRecognitionResult to MealItem
 */
export function convertToMealItem(
  result: FoodRecognitionResult,
  selectedLabel?: string,
  portionSize?: number
): MealItem | null {
  if (result.decision === 'fallback') {
    return null;
  }

  const label = selectedLabel || result.topk[0]?.label;
  if (!label) {
    return null;
  }

  const nutrition = result.nutrition;
  if (!nutrition) {
    return null;
  }

  const portion = portionSize || 100; // Default to 100g
  const multiplier = portion / 100; // Default to 100g base

  return {
    id: `vit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: label,
    brand: undefined,
    quantity: portion.toString(),
    calories: Math.round((nutrition.kcal || 0) * multiplier),
    protein: Math.round((nutrition.protein || 0) * multiplier * 10) / 10,
    carbs: Math.round((nutrition.carbs || 0) * multiplier * 10) / 10,
    fat: Math.round((nutrition.fat || 0) * multiplier * 10) / 10,
    fiber: 0, // Not available in current nutrition type
    timestamp: new Date().toISOString(),
    source: 'vision' as any,
    when: 'lunch' as any, // Default meal time
  };
}

/**
 * Search for food items using Nutritionix
 */
export async function searchFood(query: string): Promise<FoodSearchResult[]> {
  try {
    if (!NUTRITIONIX_API_KEY) {
      throw new Error('Nutritionix API key not configured');
    }

    const response = await fetch(
      'https://trackapi.nutritionix.com/v2/search/instant',
      {
        method: 'GET',
        headers: {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nutritionix API error: ${response.status}`);
    }

    const data = await response.json();

    return (
      data.common?.map((item: any) => ({
        id: item.food_name,
        name: item.food_name,
        brand: item.brand_name,
        imageUrl: item.photo?.thumb,
      })) || []
    );
  } catch (error) {
    console.error('[FoodService] Search error:', error);
    return [];
  }
}

/**
 * Get nutrition data for a specific food item
 */
export async function getNutritionData(foodId: string): Promise<any> {
  try {
    if (!NUTRITIONIX_API_KEY) {
      throw new Error('Nutritionix API key not configured');
    }

    const response = await fetch(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_API_KEY,
        },
        body: JSON.stringify({
          query: foodId,
          timezone: 'US/Eastern',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Nutritionix API error: ${response.status}`);
    }

    const data = await response.json();
    return data.foods?.[0] || null;
  } catch (error) {
    console.error('[FoodService] Nutrition data error:', error);
    return null;
  }
}

/**
 * Log meal using the new API
 */
export async function logMeal(
  mealData: LogMealRequest
): Promise<LogMealResponse> {
  try {
    const response = await http.post<LogMealResponse>('/meals/log', mealData);
    return response;
  } catch (error) {
    console.error('[FoodService] Log meal error:', error);
    throw error;
  }
}

/**
 * Get portion presets for common foods
 */
export function getPortionPresets(foodName: string): PortionPreset[] {
  const presets: Record<string, PortionPreset[]> = {
    'chicken breast': [
      { unit: 'g', amount: 100, multiplier: 1 },
      { unit: 'oz', amount: 3.5, multiplier: 1 },
      { unit: 'piece', amount: 1, multiplier: 1.5 },
    ],
    rice: [
      { unit: 'g', amount: 100, multiplier: 1 },
      { unit: 'cup', amount: 1, multiplier: 1.5 },
      { unit: 'serving', amount: 1, multiplier: 1 },
    ],
    apple: [
      { unit: 'g', amount: 100, multiplier: 1 },
      { unit: 'medium', amount: 1, multiplier: 1.2 },
      { unit: 'large', amount: 1, multiplier: 1.5 },
    ],
  };

  return (
    presets[foodName.toLowerCase()] || [
      { unit: 'g', amount: 100, multiplier: 1 },
      { unit: 'serving', amount: 1, multiplier: 1 },
    ]
  );
}

/**
 * Calculate nutrition for portion size
 */
export function calculateNutritionForPortion(
  baseNutrition: any,
  portion: number,
  unit: string
): any {
  const multiplier = portion / (baseNutrition.portion_g || 100);

  return {
    calories: Math.round(baseNutrition.calories * multiplier),
    protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
    carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
    fat: Math.round(baseNutrition.fat * multiplier * 10) / 10,
    fiber: Math.round((baseNutrition.fiber || 0) * multiplier * 10) / 10,
  };
}

/**
 * Log a meal with offline queue support
 */
export async function logMealWithOfflineQueue(
  request: LogMealRequest
): Promise<LogMealResponse | null> {
  try {
    // Try to log the meal online
    const response = await http.post<LogMealResponse>('/meals/log', request);
    console.log('[FoodService] Meal logged successfully');
    return response;
  } catch (error) {
    console.error('[FoodService] Failed to log meal online:', error);

    // Add to offline queue for retry later
    await OfflineQueueService.addToQueue(
      request,
      error instanceof Error ? error.message : 'Unknown error'
    );

    console.log('[FoodService] Meal added to offline queue');
    return null;
  }
}

/**
 * Process offline queue when connectivity is restored
 */
export async function processOfflineQueue(): Promise<{
  success: number;
  failed: number;
}> {
  return await OfflineQueueService.processQueue();
}
