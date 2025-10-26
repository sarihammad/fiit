import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DayLog,
  MealItem,
  MacroTotals,
  DailyProgress,
  NutritionStats,
} from '@/types/nutrition';
import { useUserGoalsStore } from './userGoals.store';

interface NutritionState {
  logs: Record<string, DayLog>; // keyed by date YYYY-MM-DD
  currentDate: string;

  // Actions
  setCurrentDate: (date: string) => void;
  getCurrentDayLog: () => DayLog;
  addMeal: (meal: MealItem) => void;
  updateMeal: (mealId: string, updates: Partial<MealItem>) => void;
  removeMeal: (mealId: string) => void;
  recalcTotals: (date: string) => void;
  getDailyProgress: () => DailyProgress;
  getStats: (days: number) => NutritionStats;
  getStreak: () => number;
  reset: () => void;
}

const getTodayString = () => new Date().toISOString().slice(0, 10);

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      logs: {},
      currentDate: getTodayString(),

      setCurrentDate: date => {
        set({ currentDate: date });
      },

      getCurrentDayLog: () => {
        const { logs, currentDate } = get();
        return (
          logs[currentDate] || {
            date: currentDate,
            meals: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          }
        );
      },

      addMeal: meal => {
        const { currentDate, logs } = get();
        const dayLog = logs[currentDate] || {
          date: currentDate,
          meals: [],
          totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        };

        const updatedLog = {
          ...dayLog,
          meals: [...dayLog.meals, meal],
        };

        set({
          logs: {
            ...logs,
            [currentDate]: updatedLog,
          },
        });

        get().recalcTotals(currentDate);
      },

      updateMeal: (mealId, updates) => {
        const { currentDate, logs } = get();
        const dayLog = logs[currentDate];
        if (!dayLog) return;

        const updatedMeals = dayLog.meals.map(m =>
          m.id === mealId ? { ...m, ...updates } : m
        );

        set({
          logs: {
            ...logs,
            [currentDate]: {
              ...dayLog,
              meals: updatedMeals,
            },
          },
        });

        get().recalcTotals(currentDate);
      },

      removeMeal: mealId => {
        const { currentDate, logs } = get();
        const dayLog = logs[currentDate];
        if (!dayLog) return;

        const updatedMeals = dayLog.meals.filter(m => m.id !== mealId);

        set({
          logs: {
            ...logs,
            [currentDate]: {
              ...dayLog,
              meals: updatedMeals,
            },
          },
        });

        get().recalcTotals(currentDate);
      },

      recalcTotals: date => {
        const { logs } = get();
        const dayLog = logs[date];
        if (!dayLog) return;

        const totals: MacroTotals = dayLog.meals.reduce(
          (acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat,
            fiber: (acc.fiber || 0) + (meal.fiber || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
        );

        set({
          logs: {
            ...logs,
            [date]: {
              ...dayLog,
              totals,
            },
          },
        });
      },

      getDailyProgress: () => {
        const dayLog = get().getCurrentDayLog();
        const goals = useUserGoalsStore.getState().goals;

        const calcProgress = (current: number, target: number | undefined) => {
          if (!target || target === 0) {
            return {
              current,
              target: 0,
              percentage: 0,
              remaining: 0,
              status: 'on_track' as const,
            };
          }

          const percentage = (current / target) * 100;
          const remaining = target - current;
          let status: 'under' | 'on_track' | 'over' = 'on_track';

          if (percentage < 80) status = 'under';
          else if (percentage > 110) status = 'over';

          return {
            current,
            target,
            percentage: Math.round(percentage),
            remaining: Math.round(remaining),
            status,
          };
        };

        return {
          calories: calcProgress(
            dayLog.totals.calories,
            goals.dailyCalorieTarget
          ),
          protein: calcProgress(
            dayLog.totals.protein,
            goals.proteinTargetGrams
          ),
          carbs: calcProgress(dayLog.totals.carbs, goals.carbTargetGrams),
          fat: calcProgress(dayLog.totals.fat, goals.fatTargetGrams),
        };
      },

      getStats: days => {
        const { logs } = get();
        const dates = Object.keys(logs).sort().slice(-days);

        if (dates.length === 0) {
          return {
            avgCalories: 0,
            avgProtein: 0,
            avgCarbs: 0,
            avgFat: 0,
            totalDaysLogged: 0,
            streak: 0,
            complianceRate: 0,
          };
        }

        const goals = useUserGoalsStore.getState().goals;
        const target = goals.dailyCalorieTarget || 2000;

        let totalCals = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let compliantDays = 0;

        dates.forEach(date => {
          const log = logs[date];
          totalCals += log?.totals?.calories || 0;
          totalProtein += log?.totals?.protein || 0;
          totalCarbs += log?.totals?.carbs || 0;
          totalFat += log?.totals?.fat || 0;

          // Within 10% of target = compliant
          if (
            (log?.totals?.calories || 0) >= target * 0.9 &&
            (log?.totals?.calories || 0) <= target * 1.1
          ) {
            compliantDays++;
          }
        });

        return {
          avgCalories: Math.round(totalCals / dates.length),
          avgProtein: Math.round(totalProtein / dates.length),
          avgCarbs: Math.round(totalCarbs / dates.length),
          avgFat: Math.round(totalFat / dates.length),
          totalDaysLogged: dates.length,
          streak: get().getStreak(),
          complianceRate: Math.round((compliantDays / dates.length) * 100),
        };
      },

      getStreak: () => {
        const { logs } = get();
        const sortedDates = Object.keys(logs).sort().reverse();

        if (sortedDates.length === 0) return 0;

        let streak = 0;
        const today = getTodayString();
        let currentDate = new Date(today);

        for (let i = 0; i < sortedDates.length; i++) {
          const dateStr = currentDate.toISOString().slice(0, 10);

          if (logs[dateStr] && logs[dateStr].meals.length > 0) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        return streak;
      },

      reset: () => {
        set({ logs: {}, currentDate: getTodayString() });
      },
    }),
    {
      name: 'fiit_nutrition',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
