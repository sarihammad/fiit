// AI Response Cache Utility
// Implements stale-while-revalidate pattern for AI responses

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = '@fiit-ai-cache-';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for fast access
const memoryCache = new Map<string, CacheEntry<any>>();

export class AICache {
  /**
   * Get cached data
   * Returns null if not found or expired beyond grace period
   */
  static async get<T>(key: string): Promise<T | null> {
    const fullKey = CACHE_PREFIX + key;

    // Check memory cache first
    if (memoryCache.has(fullKey)) {
      const entry = memoryCache.get(fullKey);
      if (entry) {
        return entry.data as T;
      }
    }

    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(fullKey);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);

      // Store in memory cache
      memoryCache.set(fullKey, entry);

      return entry.data;
    } catch (error) {
      console.error('[AICache] Get error:', error);
      return null;
    }
  }

  /**
   * Set cache data with TTL
   */
  static async set<T>(
    key: string,
    data: T,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<void> {
    const fullKey = CACHE_PREFIX + key;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };

    // Store in memory
    memoryCache.set(fullKey, entry);

    // Store in AsyncStorage
    try {
      await AsyncStorage.setItem(fullKey, JSON.stringify(entry));
    } catch (error) {
      console.error('[AICache] Set error:', error);
    }
  }

  /**
   * Check if cache is fresh (not expired)
   */
  static async isFresh(key: string): Promise<boolean> {
    const fullKey = CACHE_PREFIX + key;

    // Check memory cache first
    if (memoryCache.has(fullKey)) {
      const entry = memoryCache.get(fullKey);
      if (entry && Date.now() < entry.expiresAt) {
        return true;
      }
    }

    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(fullKey);
      if (!stored) return false;

      const entry: CacheEntry<any> = JSON.parse(stored);
      return Date.now() < entry.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear specific cache entry
   */
  static async clear(key: string): Promise<void> {
    const fullKey = CACHE_PREFIX + key;
    memoryCache.delete(fullKey);
    try {
      await AsyncStorage.removeItem(fullKey);
    } catch (error) {
      console.error('[AICache] Clear error:', error);
    }
  }

  /**
   * Clear all AI cache entries
   */
  static async clearAll(): Promise<void> {
    memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('[AICache] ClearAll error:', error);
    }
  }

  /**
   * Generate cache key from object
   */
  static generateKey(prefix: string, obj: Record<string, any>): string {
    const sorted = Object.keys(obj)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = obj[key];
          return acc;
        },
        {} as Record<string, any>
      );

    return `${prefix}-${JSON.stringify(sorted)}`;
  }

  /**
   * Stale-while-revalidate: Return cached data immediately,
   * trigger refresh in background if stale
   */
  static async getStaleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS
  ): Promise<T> {
    const cached = await this.get<T>(key);
    const fresh = await this.isFresh(key);

    if (cached && fresh) {
      // Fresh cache, return immediately
      return cached;
    }

    if (cached && !fresh) {
      // Stale cache, return it but trigger refresh in background
      this.refreshInBackground(key, fetcher, ttlMs);
      return cached;
    }

    // No cache, fetch now
    const data = await fetcher();
    await this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Refresh cache in background
   */
  private static async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, data, ttlMs);
    } catch (error) {
      console.error('[AICache] Background refresh failed:', error);
      // Keep stale cache on error
    }
  }
}

