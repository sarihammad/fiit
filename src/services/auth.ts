import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { http, AppError } from './http';
import { 
  AuthResponse, 
  AuthTokens, 
  User, 
  validateApiResponse, 
  AuthResponseSchema 
} from '@/types/api';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Auth result interface
export interface AuthResult {
  user: User;
  tokens: AuthTokens;
  isNewUser?: boolean;
  success: boolean;
  error?: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_DATA_KEY = 'user_data';

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(email: string, password: string): Promise<AuthResult | null> {
    try {
      const response = await http.post<AuthResponse>('/auth/signin', {
        email,
        password,
      });

      const authResponse = validateApiResponse(AuthResponseSchema, response);
      await this.storeAuthData(authResponse.user, authResponse.tokens);

      return {
        user: authResponse.user,
        tokens: authResponse.tokens,
        isNewUser: authResponse.isNewUser,
        success: true,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        user: {} as User,
        tokens: {} as AuthTokens,
        success: false,
        error: this.handleAuthError(error).message,
      };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(email: string, password: string, name: string): Promise<AuthResult | null> {
    try {
      const response = await http.post<AuthResponse>('/auth/signup', {
        email,
        password,
        name,
      });

      const authResponse = validateApiResponse(AuthResponseSchema, response);
      await this.storeAuthData(authResponse.user, authResponse.tokens);

      return {
        user: authResponse.user,
        tokens: authResponse.tokens,
        isNewUser: authResponse.isNewUser,
        success: true,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        user: {} as User,
        tokens: {} as AuthTokens,
        success: false,
        error: this.handleAuthError(error).message,
      };
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<AuthResult | null> {
    try {
      // Configure Google Sign-In
      await GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      const idToken = (userInfo as any).idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const response = await http.post<AuthResponse>('/auth/google', {
        provider: 'google',
        token: idToken,
        idToken,
      });

      const authResponse = validateApiResponse(AuthResponseSchema, response);
      await this.storeAuthData(authResponse.user, authResponse.tokens);

      return {
        user: authResponse.user,
        tokens: authResponse.tokens,
        isNewUser: authResponse.isNewUser,
        success: true,
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      
      // Handle user cancellation
      if ((error as any).code === GoogleSignin.statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }

      return {
        user: {} as User,
        tokens: {} as AuthTokens,
        success: false,
        error: this.handleAuthError(error).message,
      };
    }
  }

  /**
   * Sign in with Apple
   */
  static async signInWithApple(): Promise<AuthResult | null> {
    try {
      if (!this.isAppleSignInSupported()) {
        throw new Error('Apple Sign-In is not supported on this device');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken, email, fullName } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const response = await http.post<AuthResponse>('/auth/apple', {
        provider: 'apple',
        token: identityToken,
        idToken: identityToken,
        email: email || undefined,
        name: fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : undefined,
      });

      const authResponse = validateApiResponse(AuthResponseSchema, response);
      await this.storeAuthData(authResponse.user, authResponse.tokens);

      return {
        user: authResponse.user,
        tokens: authResponse.tokens,
        isNewUser: authResponse.isNewUser,
        success: true,
      };
    } catch (error) {
      console.error('Apple sign in error:', error);
      return {
        user: {} as User,
        tokens: {} as AuthTokens,
        success: false,
        error: this.handleAuthError(error).message,
      };
    }
  }

  /**
   * Create anonymous guest account
   */
  static async createGuest(): Promise<AuthResult | null> {
    try {
      const response = await http.post<AuthResponse>('/auth/anonymous');
      const authResponse = validateApiResponse(AuthResponseSchema, response);
      await this.storeAuthData(authResponse.user, authResponse.tokens);

      return {
        user: authResponse.user,
        tokens: authResponse.tokens,
        isNewUser: true,
        success: true,
      };
    } catch (error) {
      console.error('Guest account creation error:', error);
      return {
        user: {} as User,
        tokens: {} as AuthTokens,
        success: false,
        error: this.handleAuthError(error).message,
      };
    }
  }

  /**
   * Sign out from server and clear local data
   */
  static async signOutServerSide(): Promise<void> {
    try {
      // Call server-side sign out endpoint
      await http.post('/auth/signout');
    } catch (error) {
      console.warn('Server-side sign out failed:', error);
      // Continue with local cleanup even if server call fails
    } finally {
      // Always clear local data
      await this.signOut();
    }
  }

  /**
   * Sign out and clear local data
   */
  static async signOut(): Promise<void> {
    try {
      // Sign out from Google if signed in
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }

      // Clear stored data
      await Promise.all([
        SecureStore.deleteItemAsync(this.TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.USER_DATA_KEY),
      ]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(this.TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current user from storage
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthTokens | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await http.post<AuthTokens>('/auth/refresh', {
        refreshToken,
      });

      const newTokens = validateApiResponse(AuthTokensSchema, response);
      
      // Store new tokens
      await SecureStore.setItemAsync(this.TOKEN_KEY, newTokens.accessToken);
      await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, newTokens.refreshToken);

      return newTokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, clear auth data
      await this.signOut();
      return null;
    }
  }

  /**
   * Check if Apple Sign-In is supported
   */
  static isAppleSignInSupported(): boolean {
    return Platform.OS === 'ios' && (AppleAuthentication as any).isAvailable;
  }

  /**
   * Check if Google Sign-In is supported
   */
  static isGoogleSignInSupported(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  /**
   * Store authentication data securely
   */
  private static async storeAuthData(user: User, tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(this.TOKEN_KEY, tokens.accessToken),
        SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, tokens.refreshToken),
        SecureStore.setItemAsync(this.USER_DATA_KEY, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Store auth data error:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error.response?.status === 401) {
      return new AppError('Invalid credentials. Please check your email and password.');
    }

    if (error.response?.status === 409) {
      return new AppError('An account with this email already exists.');
    }

    if (error.response?.status === 422) {
      return new AppError('Please check your input and try again.');
    }

    if (error.response?.status >= 500) {
      return new AppError('Server error. Please try again later.');
    }

    return new AppError(error.message || 'Authentication failed. Please try again.');
  }
}

// Export types
export type { AuthResult };