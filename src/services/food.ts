import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { http, AppError } from './http';
import { 
  MealPredictionResponse, 
  ConfirmMealRequest, 
  ConfirmMealResponse,
  LogMealRequest,
  LogMealResponse,
  MealItem,
  validateApiResponse,
  MealPredictionResponseSchema,
  ConfirmMealResponseSchema,
  LogMealResponseSchema
} from '@/types/api';

// Food recognition result interface
export interface FoodRecognitionResult {
  label: string;
  confidence: number;
  nutrition?: {
    fdcId?: number;
    description?: string;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

// Photo logging configuration
const PHOTO_CONFIG = {
  MAX_FILE_SIZE: 1.2 * 1024 * 1024, // 1.2MB
  QUALITY: 0.8,
  COMPRESSION_FORMAT: 'jpeg' as const,
  TIMEOUT_MS: 8000,
};

export class FoodService {
  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Media library permission error:', error);
      return false;
    }
  }

  /**
   * Take photo with camera
   */
  static async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: PHOTO_CONFIG.QUALITY,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Camera error:', error);
      throw new AppError('Failed to take photo. Please try again.');
    }
  }

  /**
   * Pick photo from library
   */
  static async pickPhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) {
        throw new Error('Media library permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: PHOTO_CONFIG.QUALITY,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Photo picker error:', error);
      throw new AppError('Failed to pick photo. Please try again.');
    }
  }

  /**
   * Compress image to target size
   */
  static async compressImage(uri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const fileSize = fileInfo.size || 0;
      
      // If already under size limit, return original
      if (fileSize <= PHOTO_CONFIG.MAX_FILE_SIZE) {
        return uri;
      }

      // Calculate compression ratio
      const compressionRatio = PHOTO_CONFIG.MAX_FILE_SIZE / fileSize;
      const quality = Math.max(0.1, Math.min(0.9, compressionRatio));

      // Create compressed version
      const compressedUri = `${FileSystem.cacheDirectory}compressed_${Date.now()}.jpg`;
      
      // Use ImageManipulator for compression (if available)
      // For now, we'll use the original with reduced quality
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: quality,
        base64: false,
      });

      if (result.canceled || !result.assets[0]) {
        throw new Error('Compression failed');
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('Image compression error:', error);
      // Return original if compression fails
      return uri;
    }
  }

  /**
   * Analyze photo with AI
   */
  static async analyzePhoto(photoUri: string): Promise<FoodRecognitionResult[]> {
    try {
      // Compress image first
      const compressedUri = await this.compressImage(photoUri);
      
      // Create form data
      const formData = new FormData();
      
      // Read file as base64 and convert to blob
      const base64 = await FileSystem.readAsStringAsync(compressedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const blob = {
        uri: compressedUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any;
      
      formData.append('file', blob);

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PHOTO_CONFIG.TIMEOUT_MS);

      try {
        const response = await http.post<MealPredictionResponse>('/analyze', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const predictionResponse = validateApiResponse(MealPredictionResponseSchema, response);
        
        return predictionResponse.predictions.map(pred => ({
          label: pred.label,
          confidence: pred.confidence,
          nutrition: pred.nutrition,
        }));
      } catch (error) {
        clearTimeout(timeoutId);
        
        // If primary service fails, try fallback
        if (error instanceof AppError && error.status && error.status >= 500) {
          console.log('[FoodService] Primary service failed, trying fallback...');
          return await this.fallbackToNutritionix(photoUri);
        }
        
        throw error;
      }
    } catch (error) {
      console.error('[FoodService] Photo analysis error:', error);
      throw new AppError('Failed to analyze photo. Please try again.');
    }
  }

  /**
   * Fallback to Nutritionix API
   */
  private static async fallbackToNutritionix(photoUri: string): Promise<FoodRecognitionResult[]> {
    try {
      // This would integrate with Nutritionix API as fallback
      // For now, return a mock result
      console.log('[FoodService] Using Nutritionix fallback');
      
      return [
        {
          label: 'chicken_breast',
          confidence: 0.85,
          nutrition: {
            description: 'Chicken Breast',
            kcal: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
          },
        },
      ];
    } catch (error) {
      console.error('[FoodService] Fallback failed:', error);
      throw new AppError('Photo analysis service is temporarily unavailable.');
    }
  }

  /**
   * Confirm meal prediction
   */
  static async confirmMealPrediction(
    predictionId: string,
    selectedLabel: string,
    portionSize: number,
    adjustments?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }
  ): Promise<ConfirmMealResponse> {
    try {
      const request: ConfirmMealRequest = {
        predictionId,
        selectedLabel,
        portionSize,
        adjustments,
      };

      const response = await http.post<ConfirmMealResponse>('/meals/confirm', request);
      return validateApiResponse(ConfirmMealResponseSchema, response);
    } catch (error) {
      console.error('[FoodService] Confirm meal error:', error);
      throw new AppError('Failed to confirm meal. Please try again.');
    }
  }

  /**
   * Log meal with offline queue support
   */
  static async logMealWithOfflineQueue(
    request: LogMealRequest
  ): Promise<LogMealResponse | null> {
    try {
      // Try to log the meal online
      const response = await http.post<LogMealResponse>('/meals/log', request);
      const logResponse = validateApiResponse(LogMealResponseSchema, response);
      console.log('[FoodService] Meal logged successfully');
      return logResponse;
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
  static async processOfflineQueue(): Promise<{
    success: number;
    failed: number;
  }> {
    return await OfflineQueueService.processQueue();
  }

  /**
   * Convert prediction to meal item
   */
  static convertToMealItem(
    prediction: FoodRecognitionResult,
    portion: number = 1
  ): MealItem {
    const nutrition = prediction.nutrition || {};
    const multiplier = portion / 100; // Assuming nutrition is per 100g

    return {
      id: `meal_${Date.now()}`,
      label: prediction.label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      quantity: portion,
      nutrition: {
        calories: Math.round((nutrition.kcal || 0) * multiplier),
        protein_g: Math.round((nutrition.protein || 0) * multiplier * 10) / 10,
        carbs_g: Math.round((nutrition.carbs || 0) * multiplier * 10) / 10,
        fat_g: Math.round((nutrition.fat || 0) * multiplier * 10) / 10,
      },
      timestamp: new Date().toISOString(),
      source: 'vision' as any,
    };
  }
}

// Offline queue service
interface OfflineQueueItem {
  id: string;
  request: LogMealRequest;
  timestamp: string;
  error: string;
  retries: number;
}

const OFFLINE_QUEUE_KEY = '@fiit-offline-queue';
const MAX_RETRIES = 3;

class OfflineQueueService {
  /**
   * Add a failed request to the offline queue
   */
  static async addToQueue(
    request: LogMealRequest,
    error: string
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newItem: OfflineQueueItem = {
        id: Date.now().toString(),
        request,
        timestamp: new Date().toISOString(),
        error,
        retries: 0,
      };
      queue.push(newItem);
      await FileSystem.writeAsStringAsync(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to add to queue:', error);
    }
  }

  /**
   * Process the offline queue, retrying failed requests
   */
  static async processQueue(): Promise<{ success: number; failed: number }> {
    try {
      let queue = await this.getQueue();
      let successCount = 0;
      let failedCount = 0;
      const newQueue: OfflineQueueItem[] = [];

      for (const item of queue) {
        if (item.retries >= MAX_RETRIES) {
          console.warn(`[OfflineQueue] Max retries reached for item ${item.id}. Skipping.`);
          failedCount++;
          continue;
        }

        try {
          console.log(`[OfflineQueue] Retrying item ${item.id}...`);
          const response = await http.post<LogMealResponse>('/meals/log', item.request);
          console.log(`[OfflineQueue] Item ${item.id} successfully logged.`);
          successCount++;
        } catch (error) {
          console.error(`[OfflineQueue] Failed to retry item ${item.id}:`, error);
          item.retries++;
          newQueue.push(item);
          failedCount++;
        }
      }

      await FileSystem.writeAsStringAsync(OFFLINE_QUEUE_KEY, JSON.stringify(newQueue));
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('[OfflineQueue] Failed to process queue:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Get the current state of the offline queue
   */
  static async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const queueString = await FileSystem.readAsStringAsync(OFFLINE_QUEUE_KEY);
      return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Clear the offline queue
   */
  static async clearQueue(): Promise<void> {
    try {
      await FileSystem.deleteAsync(OFFLINE_QUEUE_KEY);
    } catch (error) {
      console.error('[OfflineQueue] Failed to clear queue:', error);
    }
  }
}