import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MealPlan,
  MealPlanDay,
  MealPlanMeal,
  GroceryItem,
  MealTime,
} from '@/types/nutrition';

interface MealPlanState {
  currentPlan: MealPlan | null;
  isGenerating: boolean;
  lastError: string | null;

  // Actions
  setPlan: (plan: MealPlan) => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  getGroceryList: () => GroceryItem[];
  getDayPlan: (date: string) => MealPlanDay | null;
  swapMeal: (date: string, when: MealTime, newMealDay: MealPlanDay) => void;
  swapMealInPlan: (
    dayDate: string,
    mealIndex: number,
    newMeal: MealPlanMeal
  ) => void;
  clearPlan: () => void;
  reset: () => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      isGenerating: false,
      lastError: null,

      setPlan: plan => {
        set({ currentPlan: plan, lastError: null });
      },

      setGenerating: isGenerating => {
        set({ isGenerating });
      },

      setError: error => {
        set({ lastError: error, isGenerating: false });
      },

      getGroceryList: () => {
        const { currentPlan } = get();
        if (!currentPlan) return [];
        return currentPlan.groceryList;
      },

      getDayPlan: date => {
        const { currentPlan } = get();
        if (!currentPlan) return null;
        return currentPlan.days.find(d => d.date === date) || null;
      },

      swapMeal: (date, when, newMealDay) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        const updatedDays = currentPlan.days.map(day => {
          if (day.date === date) {
            const updatedMeals = day.meals.map(meal =>
              meal.when === when
                ? newMealDay.meals.find(m => m.when === when) || meal
                : meal
            );
            return { ...day, meals: updatedMeals };
          }
          return day;
        });

        set({
          currentPlan: {
            ...currentPlan,
            days: updatedDays,
          },
        });
      },

      swapMealInPlan: (dayDate, mealIndex, newMeal) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        const updatedDays = currentPlan.days.map(day => {
          if (day.date === dayDate) {
            const updatedMeals = [...day.meals];
            updatedMeals[mealIndex] = newMeal;

            // Recalculate day totals
            const dailyTotals = updatedMeals.reduce(
              (totals, meal) => {
                meal.items.forEach(item => {
                  totals.calories += item.calories;
                  totals.protein += item.protein;
                  totals.carbs += item.carbs;
                  totals.fat += item.fat;
                });
                return totals;
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            return { ...day, meals: updatedMeals, dailyTotals };
          }
          return day;
        });

        set({
          currentPlan: {
            ...currentPlan,
            days: updatedDays,
          },
        });
      },

      clearPlan: () => {
        set({ currentPlan: null, lastError: null });
      },

      reset: () => {
        set({ currentPlan: null, isGenerating: false, lastError: null });
      },
    }),
    {
      name: 'fiit_mealplan',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
