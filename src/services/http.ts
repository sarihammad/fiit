// Centralized HTTP client with timeouts, retries, and typed DTOs
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Types
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  retryable?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: AppError;
}

// Configuration
const API_BASE_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || 'https://api.fiit.app';
const DEFAULT_TIMEOUT = 8000; // 8 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Create axios instance
const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
httpClient.interceptors.request.use(
  async config => {
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
  error => Promise.reject(error)
);

// Response interceptor - handle errors and retries
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Handle 401 - redirect to auth
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Could emit auth event here
      return Promise.reject(createAppError(error));
    }

    // Handle 429 - rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY;
      await new Promise(resolve => setTimeout(resolve, delay));
      return httpClient(originalRequest);
    }

    // Handle network errors with retry
    if (!error.response && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Exponential backoff with jitter
      const retryCount = originalRequest._retryCount || 0;
      if (retryCount < MAX_RETRIES) {
        const delay =
          RETRY_DELAY * Math.pow(2, retryCount) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        originalRequest._retryCount = retryCount + 1;
        return httpClient(originalRequest);
      }
    }

    return Promise.reject(createAppError(error));
  }
);

// Helper function to create AppError from AxiosError
function createAppError(error: AxiosError): AppError {
  if (error.response) {
    // Server responded with error status
    return {
      message: (error.response.data as any)?.message || error.message,
      code: (error.response.data as any)?.code || 'HTTP_ERROR',
      status: error.response.status,
      retryable: error.response.status >= 500,
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error - please check your connection',
      code: 'NETWORK_ERROR',
      retryable: true,
    };
  } else {
    // Other error
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      retryable: false,
    };
  }
}

// HTTP methods with proper typing
export const http = {
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.get<T>(url, config);
    return response.data;
  },

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await httpClient.post<T>(url, data, config);
    return response.data;
  },

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await httpClient.put<T>(url, data, config);
    return response.data;
  },

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await httpClient.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.delete<T>(url, config);
    return response.data;
  },

  // File upload with progress
  async upload<T = any>(
    url: string,
    file: FormData,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await httpClient.post<T>(url, file, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  // GET with retry for idempotent requests
  async getWithRetry<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await httpClient.get<T>(url, config);
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

        // Exponential backoff delay
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  },
};

// Request cancellation
export class RequestCanceller {
  private controller: AbortController | null = null;

  start(): AbortController {
    this.controller = new AbortController();
    return this.controller;
  }

  cancel(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  getSignal(): AbortSignal | undefined {
    return this.controller?.signal;
  }
}

export default http;
