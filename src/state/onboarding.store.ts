import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Goal = 'lose_7_lbs' | 'lose_15_lbs' | 'lose_30_lbs' | 'maintain';

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export type DietPreference =
  | 'balanced'
  | 'high_protein'
  | 'low_carb'
  | 'keto'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian';

export type BudgetLevel = 'low' | 'medium' | 'high';

export interface Biometrics {
  currentWeightKg?: number;
  goalWeightKg?: number;
  heightCm?: number;
  age?: number;
  sex?: Gender;
  activityLevel: ActivityLevel;
  unit: 'metric' | 'imperial';
}

export interface DietInfo {
  dietPreference: DietPreference;
  allergies: string[];
  budgetLevel: BudgetLevel;
  timeToCookMins: number;
}

export interface OnboardingState {
  // Step tracking
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;

  // Onboarding data
  goal?: Goal;
  gender?: Gender;
  biometrics?: Biometrics;
  dietInfo?: DietInfo;

  // Actions
  setGoal: (goal: Goal) => void;
  setGender: (gender: Gender) => void;
  setBiometrics: (biometrics: Partial<Biometrics>) => void;
  setDietInfo: (dietInfo: Partial<DietInfo>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const TOTAL_STEPS = 5;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 0,
      totalSteps: TOTAL_STEPS,
      isCompleted: false,

      // Actions
      setGoal: (goal: Goal) => set({ goal }),

      setGender: (gender: Gender) => set({ gender }),

      setBiometrics: (biometrics: Partial<Biometrics>) =>
        set(state => ({
          biometrics: { ...state.biometrics, ...biometrics } as Biometrics,
        })),

      setDietInfo: (dietInfo: Partial<DietInfo>) =>
        set(state => ({
          dietInfo: { ...state.dietInfo, ...dietInfo } as DietInfo,
        })),

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      setStep: (step: number) => {
        if (step >= 0 && step < TOTAL_STEPS) {
          set({ currentStep: step });
        }
      },

      completeOnboarding: () => set({ isCompleted: true }),

      resetOnboarding: () =>
        set({
          currentStep: 0,
          isCompleted: false,
          goal: undefined,
          gender: undefined,
          biometrics: undefined,
          dietInfo: undefined,
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        currentStep: state.currentStep,
        isCompleted: state.isCompleted,
        goal: state.goal,
        gender: state.gender,
        biometrics: state.biometrics,
        dietInfo: state.dietInfo,
      }),
    }
  )
);
