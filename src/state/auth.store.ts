import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, AuthResult } from '@/services/auth';
import { User } from '@/types/api/auth';

export interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  didSkip: boolean;

  // Actions
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  skipAuth: () => void;

  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  createAnonymousAccount: () => Promise<boolean>;

  // Initialization
  initializeAuth: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;

  // Additional required methods
  ensureGuest: () => Promise<void>;
  signInGoogle: () => Promise<boolean>;
  signInApple: () => Promise<boolean>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      didSkip: false,

      // Basic actions
      signIn: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          error: null,
          didSkip: false,
        });
      },

      signOut: async () => {
        try {
          await AuthService.signOut();
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            didSkip: false,
          });
        } catch (error) {
          console.error('Error signing out:', error);
          // Still clear local state even if server logout fails
          set({
            user: null,
            isAuthenticated: false,
            error: null,
            didSkip: false,
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      skipAuth: () => {
        set({ didSkip: true });
      },

      // Authentication methods
      signInWithEmail: async (
        email: string,
        password: string
      ): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result: AuthResult = await AuthService.signInWithEmail(
            email,
            password
          );

          if (result && result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              didSkip: false,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Sign in failed',
            });
            return false;
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Sign in failed',
          });
          return false;
        }
      },

      signUpWithEmail: async (
        email: string,
        password: string,
        name: string
      ): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result: AuthResult = await AuthService.signUpWithEmail(
            email,
            password,
            name
          );

          if (result && result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              didSkip: false,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Sign up failed',
            });
            return false;
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Sign up failed',
          });
          return false;
        }
      },

      signInWithGoogle: async (): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result = await AuthService.signInWithGoogle();

          if (result && result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              didSkip: false,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result?.error || 'Google sign in failed',
            });
            return false;
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Google sign in failed',
          });
          return false;
        }
      },

      signInWithApple: async (): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result = await AuthService.signInWithApple();

          if (result && result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              didSkip: false,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result?.error || 'Apple sign in failed',
            });
            return false;
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Apple sign in failed',
          });
          return false;
        }
      },

      createAnonymousAccount: async (): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          const result = await AuthService.createAnonymous();

          if (result && result.success && result.user) {
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              didSkip: true,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Failed to create anonymous account',
            });
            return false;
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to create anonymous account',
          });
          return false;
        }
      },

      // Initialization
      initializeAuth: async () => {
        set({ isLoading: true });

        try {
          const isAuthenticated = await AuthService.isAuthenticated();

          if (isAuthenticated) {
            const user = await AuthService.getCurrentUser();
            if (user) {
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuthStatus: async (): Promise<boolean> => {
        try {
          const isAuthenticated = await AuthService.isAuthenticated();
          const user = isAuthenticated
            ? await AuthService.getCurrentUser()
            : null;

          set({
            user,
            isAuthenticated: !!isAuthenticated,
          });

          return !!isAuthenticated;
        } catch (error) {
          console.error('Error checking auth status:', error);
          set({
            user: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      // Additional required methods
      ensureGuest: async (): Promise<void> => {
        const state = get();
        if (!state.isAuthenticated && !state.didSkip) {
          await get().createAnonymousAccount();
        }
      },

      signInGoogle: async (): Promise<boolean> => {
        return await get().signInWithGoogle();
      },

      signInApple: async (): Promise<boolean> => {
        return await get().signInWithApple();
      },

      reset: (): void => {
        set({
          user: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
          didSkip: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        didSkip: state.didSkip,
      }),
    }
  )
);
