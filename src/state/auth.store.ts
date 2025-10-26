import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, AuthResult } from '@/services/auth';
import { User, AuthTokens } from '@/types/api';

// Auth state interface
export interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  didSkip: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  ensureGuest: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  signInGoogle: () => Promise<boolean>;
  signInApple: () => Promise<boolean>;
  createAnonymousAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

// Create auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      didSkip: false,

      // Initialize authentication on app start
      initializeAuth: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          const isAuthenticated = await AuthService.isAuthenticated();
          if (isAuthenticated) {
            const user = await AuthService.getCurrentUser();
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ 
            error: 'Failed to initialize authentication', 
            isLoading: false 
          });
        }
      },

      // Ensure guest account exists
      ensureGuest: async (): Promise<void> => {
        const state = get();
        if (!state.isAuthenticated && !state.didSkip) {
          await get().createAnonymousAccount();
        }
      },

      // Sign in with email and password
      signInWithEmail: async (email: string, password: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const result = await AuthService.signInWithEmail(email, password);
          if (result?.success) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              didSkip: false,
            });
            return true;
          } else {
            set({
              error: result?.error || 'Sign in failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error('Sign in error:', error);
          set({
            error: 'Sign in failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      // Sign up with email and password
      signUpWithEmail: async (email: string, password: string, name: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const result = await AuthService.signUpWithEmail(email, password, name);
          if (result?.success) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              didSkip: false,
            });
            return true;
          } else {
            set({
              error: result?.error || 'Sign up failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error('Sign up error:', error);
          set({
            error: 'Sign up failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      // Sign in with Google
      signInGoogle: async (): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const result = await AuthService.signInWithGoogle();
          if (result?.success) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              didSkip: false,
            });
            return true;
          } else if (result === null) {
            // User cancelled
            set({ isLoading: false });
            return false;
          } else {
            set({
              error: result?.error || 'Google sign in failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error('Google sign in error:', error);
          set({
            error: 'Google sign in failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      // Sign in with Apple
      signInApple: async (): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const result = await AuthService.signInWithApple();
          if (result?.success) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              didSkip: false,
            });
            return true;
          } else {
            set({
              error: result?.error || 'Apple sign in failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error('Apple sign in error:', error);
          set({
            error: 'Apple sign in failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      // Create anonymous account
      createAnonymousAccount: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          const result = await AuthService.createGuest();
          if (result?.success) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              didSkip: false,
            });
          } else {
            set({
              error: result?.error || 'Failed to create guest account',
              isLoading: false,
              didSkip: true,
            });
          }
        } catch (error) {
          console.error('Guest account creation error:', error);
          set({
            error: 'Failed to create guest account',
            isLoading: false,
            didSkip: true,
          });
        }
      },

      // Sign out
      signOut: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          await AuthService.signOutServerSide();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            didSkip: false,
          });
        } catch (error) {
          console.error('Sign out error:', error);
          set({
            error: 'Sign out failed',
            isLoading: false,
          });
        }
      },

      // Reset state
      reset: (): void => {
        set({
          user: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
          didSkip: false,
        });
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist minimal state to avoid storing sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        didSkip: state.didSkip,
      }),
    }
  )
);

// Selectors for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useDidSkip = () => useAuthStore((state) => state.didSkip);

// Action selectors
export const useAuthActions = () => useAuthStore((state) => ({
  initializeAuth: state.initializeAuth,
  ensureGuest: state.ensureGuest,
  signInWithEmail: state.signInWithEmail,
  signUpWithEmail: state.signUpWithEmail,
  signInGoogle: state.signInGoogle,
  signInApple: state.signInApple,
  createAnonymousAccount: state.createAnonymousAccount,
  signOut: state.signOut,
  reset: state.reset,
  clearError: state.clearError,
}));