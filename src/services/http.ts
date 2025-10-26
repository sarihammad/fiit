import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configuration
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Custom error class for normalized error handling
export class AppError extends Error {
  code?: string;
  status?: number;
  cause?: unknown;
  
  constructor(message: string, opts: { code?: string; status?: number; cause?: unknown } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = opts.code;
    this.status = opts.status;
    this.cause = opts.cause;
  }
}

// Create axios instance
export const http = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth header
http.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and 401s
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const code = (error as any).code as string | undefined;
    
    // Extract error message
    let message = 'Network error';
    if (error.response?.data) {
      const data = error.response.data as any;
      message = data.message || data.error || data.detail || error.message;
    } else if (error.message) {
      message = error.message;
    }
    
    // Handle 401 - Sign out user
    if (status === 401) {
      try {
        // Clear stored tokens
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user_data');
        
        // Import and call sign out (avoid circular dependency)
        const { useAuthStore } = await import('@/state/auth.store');
        useAuthStore.getState().signOut();
      } catch (signOutError) {
        console.warn('Failed to sign out user:', signOutError);
      }
    }
    
    // Create normalized error
    const appError = new AppError(message, {
      status,
      code,
      cause: error,
    });
    
    return Promise.reject(appError);
  }
);

// GET with retry for idempotent requests
export async function getWithRetry<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await http.get<T>(url, config);
      return response.data;
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) or if it's the last attempt
      if (
        attempt === maxRetries ||
        ((error as AxiosError).response?.status &&
          (error as AxiosError).response!.status < 500)
      ) {
        throw error;
      }

      // Exponential backoff delay with jitter
      const delay = RETRY_DELAY * Math.pow(2, attempt) + Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// POST with retry for non-idempotent requests (limited retries)
export async function postWithRetry<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
  maxRetries: number = 1
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await http.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) or if it's the last attempt
      if (
        attempt === maxRetries ||
        ((error as AxiosError).response?.status &&
          (error as AxiosError).response!.status < 500)
      ) {
        throw error;
      }

      // Short delay for POST retries
      const delay = RETRY_DELAY + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Utility function to create AbortController for request cancellation
export function createAbortController(timeoutMs: number = TIMEOUT_MS): AbortController {
  const controller = new AbortController();
  
  // Auto-abort after timeout
  setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  return controller;
}

// Utility function to check if error is network related
export function isNetworkError(error: any): boolean {
  return (
    error.code === 'NETWORK_ERROR' ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('Network Error') ||
    error.message?.includes('timeout')
  );
}

// Utility function to check if error is retryable
export function isRetryableError(error: any): boolean {
  if (error instanceof AppError) {
    // Retry on 5xx errors or network errors
    return (
      (error.status && error.status >= 500) ||
      isNetworkError(error)
    );
  }
  
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return (
      !status || // Network error
      status >= 500 || // Server error
      error.code === 'ECONNABORTED' // Timeout
    );
  }
  
  return false;
}

// Export default http instance for direct use
export default http;