import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  goal?: string;
  gender?: string;
  biometrics?: {
    height: number;
    weight: number;
    age: number;
    unit: 'metric' | 'imperial';
  };
  habits?: {
    sleepHours: number;
    dailySteps: number;
    alcoholConsumption: string;
  };
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  stats?: {
    streakDays: number;
    totalTasksCompleted: number;
    auraScore: number;
    lastActive: Date;
  };
}

export interface UserState {
  // User data
  profile?: UserProfile;
  isLoading: boolean;
  error?: string;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  resetUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoading: false,
      
      // Actions
      setProfile: (profile: UserProfile) => set({
        profile,
        error: undefined,
      }),
      
      updateProfile: (updates: Partial<UserProfile>) => {
        const { profile } = get();
        if (profile) {
          set({
            profile: { ...profile, ...updates },
            error: undefined,
          });
        }
      },
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
      
      setError: (error?: string) => set({ error }),
      
      clearError: () => set({ error: undefined }),
      
      resetUser: () => set({
        profile: undefined,
        error: undefined,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);
