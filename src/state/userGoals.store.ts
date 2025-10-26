import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserGoals,
  DietPreference,
  ActivityLevel,
  Sex,
} from '@/types/nutrition';

interface UserGoalsState {
  goals: UserGoals;
  updateGoals: (updates: Partial<UserGoals>) => void;
  computeMacros: () => void;
  getBMR: () => number;
  getTDEE: () => number;
  getCalorieDeficit: () => number;
  reset: () => void;
}

const DEFAULT_GOALS: UserGoals = {
  activity: 'moderate',
  dietPreference: 'balanced',
  allergies: [],
  budgetLevel: 'medium',
  timeToCookMins: 30,
  timeframeDays: 30,
};

export const useUserGoalsStore = create<UserGoalsState>()(
  persist(
    (set, get) => ({
      goals: DEFAULT_GOALS,

      updateGoals: updates => {
        set(state => ({
          goals: { ...state.goals, ...updates },
        }));
        // Auto-compute macros when relevant fields change
        if (
          updates.currentWeightKg ||
          updates.goalWeightKg ||
          updates.heightCm ||
          updates.age ||
          updates.sex ||
          updates.activity ||
          updates.dietPreference
        ) {
          get().computeMacros();
        }
      },

      // Compute BMR using Mifflin-St Jeor equation
      getBMR: () => {
        const { currentWeightKg, heightCm, age, sex } = get().goals;
        if (!currentWeightKg || !heightCm || !age || !sex) return 0;

        const baseCalc = 10 * currentWeightKg + 6.25 * heightCm - 5 * age;
        if (sex === 'male') {
          return baseCalc + 5;
        } else if (sex === 'female') {
          return baseCalc - 161;
        } else {
          // Average for 'other'
          return baseCalc - 78;
        }
      },

      // Compute TDEE (Total Daily Energy Expenditure)
      getTDEE: () => {
        const bmr = get().getBMR();
        const { activity } = get().goals;

        const activityMultipliers: Record<ActivityLevel, number> = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
        };

        return bmr * activityMultipliers[activity];
      },

      // Compute recommended calorie deficit for weight loss goal
      getCalorieDeficit: () => {
        const { currentWeightKg, goalWeightKg, timeframeDays } = get().goals;
        if (!currentWeightKg || !goalWeightKg || !timeframeDays) return 500; // default

        const weightLossKg = currentWeightKg - goalWeightKg;
        if (weightLossKg <= 0) return 0; // no deficit needed

        // 1 kg fat ≈ 7700 calories
        const totalDeficit = weightLossKg * 7700;
        const dailyDeficit = totalDeficit / timeframeDays;

        // Cap at safe maximum of 1000 cal/day deficit (~ 1kg/week)
        return Math.min(1000, Math.max(250, dailyDeficit));
      },

      // Compute and set macro targets
      computeMacros: () => {
        const tdee = get().getTDEE();
        const deficit = get().getCalorieDeficit();
        const dailyCalorieTarget = Math.round(tdee - deficit);

        const { dietPreference, currentWeightKg } = get().goals;
        if (!currentWeightKg) return;

        let proteinGrams: number;
        let fatGrams: number;
        let carbGrams: number;

        // Macro splits based on diet preference
        switch (dietPreference) {
          case 'high_protein':
            proteinGrams = currentWeightKg * 2.2; // 2.2g per kg
            fatGrams = (dailyCalorieTarget * 0.25) / 9;
            carbGrams =
              (dailyCalorieTarget - proteinGrams * 4 - fatGrams * 9) / 4;
            break;

          case 'low_carb':
            proteinGrams = currentWeightKg * 1.8;
            carbGrams = (dailyCalorieTarget * 0.2) / 4;
            fatGrams =
              (dailyCalorieTarget - proteinGrams * 4 - carbGrams * 4) / 9;
            break;

          case 'keto':
            proteinGrams = currentWeightKg * 1.6;
            carbGrams = (dailyCalorieTarget * 0.05) / 4; // 5% carbs
            fatGrams =
              (dailyCalorieTarget - proteinGrams * 4 - carbGrams * 4) / 9;
            break;

          case 'vegetarian':
          case 'vegan':
          case 'pescatarian':
            proteinGrams = currentWeightKg * 1.6;
            fatGrams = (dailyCalorieTarget * 0.25) / 9;
            carbGrams =
              (dailyCalorieTarget - proteinGrams * 4 - fatGrams * 9) / 4;
            break;

          case 'balanced':
          default:
            proteinGrams = currentWeightKg * 1.8;
            carbGrams = (dailyCalorieTarget * 0.4) / 4; // 40% carbs
            fatGrams = (dailyCalorieTarget * 0.3) / 9; // 30% fat
            break;
        }

        set(state => ({
          goals: {
            ...state.goals,
            dailyCalorieTarget: Math.round(dailyCalorieTarget),
            proteinTargetGrams: Math.round(proteinGrams),
            carbTargetGrams: Math.round(Math.max(0, carbGrams)),
            fatTargetGrams: Math.round(Math.max(0, fatGrams)),
          },
        }));
      },

      reset: () => {
        set({ goals: DEFAULT_GOALS });
      },
    }),
    {
      name: 'fiit_user_goals',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
