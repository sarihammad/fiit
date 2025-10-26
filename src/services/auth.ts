// Authentication service with Google/Apple sign-in and secure token storage
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { http, AppError } from './http';
import {
  SignInRequest,
  SignUpRequest,
  AuthResponse,
  SocialAuthRequest,
  SocialAuthResponse,
  User,
  AuthTokens,
} from '@/types/api/auth';

// Configure WebBrowser for auth sessions
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = {
  ios: 'your-ios-client-id.apps.googleusercontent.com',
  android: 'your-android-client-id.apps.googleusercontent.com',
  web: 'your-web-client-id.apps.googleusercontent.com',
};

const GOOGLE_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'fiit',
  path: 'auth',
});

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID.web,
  iosClientId: GOOGLE_CLIENT_ID.ios,
});

export interface AuthUser extends User {
  provider?: 'apple' | 'google' | 'email';
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
  isNewUser?: boolean;
  success?: boolean;
  error?: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  /**
   * Sign in with Apple
   */
  static async signInWithApple(): Promise<AuthResult | null> {
    try {
      if (!this.isAppleSignInSupported()) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const authRequest: SocialAuthRequest = {
        provider: 'apple',
        token: credential.identityToken,
        idToken: credential.identityToken,
      };

      const response = await http.post<SocialAuthResponse>(
        '/auth/social',
        authRequest
      );

      await this.storeAuthData(response.user, response.tokens);

      return {
        user: { ...response.user, provider: 'apple' },
        tokens: response.tokens,
        isNewUser: response.isNewUser,
        success: true,
      };
    } catch (error) {
      console.error('Apple Sign-In error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with Google
   */
  static async signInWithGoogle(): Promise<AuthResult | null> {
    try {
      if (!this.isGoogleSignInSupported()) {
        throw new Error('Google Sign-In is not available on this device');
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!(userInfo as any).idToken) {
        throw new Error('No ID token received from Google');
      }

      const authRequest: SocialAuthRequest = {
        provider: 'google',
        token: (userInfo as any).idToken,
      };

      const response = await http.post<SocialAuthResponse>(
        '/auth/social',
        authRequest
      );

      await this.storeAuthData(response.user, response.tokens);

      return {
        user: { ...response.user, provider: 'google' },
        tokens: response.tokens,
        isNewUser: response.isNewUser,
        success: true,
      };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  static async signInWithEmail(
    email: string,
    password: string
  ): Promise<AuthResult> {
    try {
      const request: SignInRequest = { email, password };
      const response = await http.post<AuthResponse>('/auth/signin', request);

      await this.storeAuthData(response.user, response.tokens);

      return {
        user: { ...response.user, provider: 'email' },
        tokens: response.tokens,
        success: true,
      };
    } catch (error) {
      console.error('Email Sign-In error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUpWithEmail(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResult> {
    try {
      const request: SignUpRequest = { email, password, name };
      const response = await http.post<AuthResponse>('/auth/signup', request);

      await this.storeAuthData(response.user, response.tokens);

      return {
        user: { ...response.user, provider: 'email' },
        tokens: response.tokens,
        isNewUser: true,
      };
    } catch (error) {
      console.error('Email Sign-Up error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Create anonymous guest account
   */
  static async createAnonymous(): Promise<AuthResult> {
    try {
      const response = await http.post<AuthResponse>('/auth/anonymous');

      await this.storeAuthData(response.user, response.tokens);

      return {
        user: { ...response.user, provider: 'email' },
        tokens: response.tokens,
        isNewUser: true,
      };
    } catch (error) {
      console.error('Anonymous account creation error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    try {
      // Sign out from Google if signed in
      if (await (GoogleSignin as any).isSignedIn()) {
        await GoogleSignin.signOut();
      }

      // Clear stored auth data
      await Promise.all([
        SecureStore.deleteItemAsync(this.TOKEN_KEY),
        SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(this.USER_KEY),
      ]);

      // Call backend to invalidate token
      try {
        await http.post('/auth/signout');
      } catch (error) {
        // Ignore backend errors during signout
        console.warn('Backend signout failed:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user session
   */
  static async getSession(): Promise<AuthResult | null> {
    try {
      const [token, userData] = await Promise.all([
        SecureStore.getItemAsync(this.TOKEN_KEY),
        SecureStore.getItemAsync(this.USER_KEY),
      ]);

      if (!token || !userData) {
        return null;
      }

      const user = JSON.parse(userData) as AuthUser;
      const tokens: AuthTokens = {
        accessToken: token,
        refreshToken:
          (await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY)) || '',
        expiresIn: 3600, // Default 1 hour
      };

      return { user, tokens };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<AuthTokens | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(
        this.REFRESH_TOKEN_KEY
      );
      if (!refreshToken) {
        return null;
      }

      const response = await http.post<AuthTokens>('/auth/refresh', {
        refreshToken,
      });
      await this.storeTokens(response);

      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.signOut(); // Clear invalid tokens
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
  private static async storeAuthData(
    user: User,
    tokens: AuthTokens
  ): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(this.TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, tokens.refreshToken),
      SecureStore.setItemAsync(this.USER_KEY, JSON.stringify(user)),
    ]);
  }

  /**
   * Store tokens securely
   */
  private static async storeTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(this.TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  }

  /**
   * Create anonymous guest account
   */
  static async createGuest(): Promise<AuthResult | null> {
    try {
      const response = await http.post<AuthResponse>('/auth/anonymous');
      await this.storeAuthData(response.user, response.tokens);

      return {
        user: response.user,
        tokens: response.tokens,
        isNewUser: true,
        success: true,
      };
    } catch (error) {
      console.error('Guest account creation error:', error);
      return {
        user: {} as AuthUser,
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
   * Handle authentication errors
   */
  private static handleAuthError(error: any): AppError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'AUTH_ERROR',
        retryable: false,
      };
    }

    return {
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
      retryable: false,
    };
  }
}

// Export types for backward compatibility
// export type { User as AuthUser };
