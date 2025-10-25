// Offline queue service for failed meal logs
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealItem } from '@/types/nutrition';
import { LogMealRequest } from '@/types/api/meals';
import { http } from './http';

const OFFLINE_QUEUE_KEY = '@fiit-offline-queue';
const MAX_QUEUE_SIZE = 50; // Maximum number of items to keep in queue

export interface QueuedMealLog {
  id: string;
  request: LogMealRequest;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export class OfflineQueueService {
  /**
   * Add a failed meal log to the offline queue
   */
  static async addToQueue(
    request: LogMealRequest,
    error?: string
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      
      const queuedItem: QueuedMealLog = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        request,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        lastError: error,
      };

      queue.push(queuedItem);

      // Keep only the most recent items
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.splice(0, queue.length - MAX_QUEUE_SIZE);
      }

      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log('[OfflineQueue] Added item to queue:', queuedItem.id);
    } catch (error) {
      console.error('[OfflineQueue] Failed to add to queue:', error);
    }
  }

  /**
   * Get all items in the offline queue
   */
  static async getQueue(): Promise<QueuedMealLog[]> {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      console.error('[OfflineQueue] Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Process the offline queue when connectivity is restored
   */
  static async processQueue(): Promise<{ success: number; failed: number }> {
    const queue = await this.getQueue();
    let successCount = 0;
    let failedCount = 0;

    console.log(`[OfflineQueue] Processing ${queue.length} items`);

    for (const item of queue) {
      try {
        // Attempt to log the meal
        await http.post<LogMealRequest>('/meals/log', item.request);
        
        // Remove from queue on success
        await this.removeFromQueue(item.id);
        successCount++;
        
        console.log(`[OfflineQueue] Successfully processed item: ${item.id}`);
      } catch (error) {
        // Increment retry count
        item.retryCount++;
        item.lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Remove from queue if max retries exceeded
        if (item.retryCount >= 3) {
          await this.removeFromQueue(item.id);
          console.log(`[OfflineQueue] Max retries exceeded for item: ${item.id}`);
        } else {
          // Update the item in queue
          await this.updateQueueItem(item);
        }
        
        failedCount++;
        console.log(`[OfflineQueue] Failed to process item: ${item.id}`, error);
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Remove an item from the queue
   */
  static async removeFromQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updatedQueue = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to remove from queue:', error);
    }
  }

  /**
   * Update an item in the queue
   */
  static async updateQueueItem(updatedItem: QueuedMealLog): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex(item => item.id === updatedItem.id);
      
      if (index !== -1) {
        queue[index] = updatedItem;
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to update queue item:', error);
    }
  }

  /**
   * Clear the entire queue
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
      console.log('[OfflineQueue] Queue cleared');
    } catch (error) {
      console.error('[OfflineQueue] Failed to clear queue:', error);
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    totalItems: number;
    oldestItem?: string;
    newestItem?: string;
  }> {
    const queue = await this.getQueue();
    
    if (queue.length === 0) {
      return { totalItems: 0 };
    }

    const timestamps = queue.map(item => new Date(item.timestamp).getTime());
    const oldestTimestamp = Math.min(...timestamps);
    const newestTimestamp = Math.max(...timestamps);

    return {
      totalItems: queue.length,
      oldestItem: new Date(oldestTimestamp).toISOString(),
      newestItem: new Date(newestTimestamp).toISOString(),
    };
  }
}
