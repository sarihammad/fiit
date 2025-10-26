import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightEntry, WeightProjection } from '@/types/nutrition';
import { useUserGoalsStore } from './userGoals.store';

interface WeightState {
  entries: WeightEntry[];

  // Actions
  addEntry: (entry: WeightEntry) => void;
  updateEntry: (date: string, updates: Partial<WeightEntry>) => void;
  removeEntry: (date: string) => void;
  getLatestEntry: () => WeightEntry | null;
  projectWeight: (days: number) => WeightProjection;
  getWeightChange: () => { totalKg: number; weeklyAvg: number };
  reset: () => void;
}

export const useWeightStore = create<WeightState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: entry => {
        set(state => {
          // Remove existing entry for the same date, then add new one
          const filtered = state.entries.filter(e => e.date !== entry.date);
          const updated = [...filtered, entry].sort((a, b) =>
            a.date.localeCompare(b.date)
          );
          return { entries: updated };
        });

        // Update current weight in goals
        useUserGoalsStore.getState().updateGoals({
          currentWeightKg: entry.weightKg,
        });
      },

      updateEntry: (date, updates) => {
        set(state => ({
          entries: state.entries.map(e =>
            e.date === date ? { ...e, ...updates } : e
          ),
        }));
      },

      removeEntry: date => {
        set(state => ({
          entries: state.entries.filter(e => e.date !== date),
        }));
      },

      getLatestEntry: () => {
        const { entries } = get();
        if (entries.length === 0) return null;
        return entries[entries.length - 1] || null;
      },

      projectWeight: days => {
        const { entries } = get();
        const goals = useUserGoalsStore.getState().goals;

        if (entries.length < 2) {
          return {
            projected: [],
            slope: 0,
            onTrack: false,
          };
        }

        // Simple linear regression
        const x = entries.map((_, i) => i);
        const y = entries.map(e => e.weightKg);
        const n = x.length;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, xi, i) => a + xi * (y[i] || 0), 0);
        const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);

        const slope =
          (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX + 1e-6);
        const intercept = (sumY - slope * sumX) / n;

        const lastIndex = x[x.length - 1];
        const lastDate = new Date(
          entries[entries.length - 1]?.date || new Date()
        );

        const projected: WeightEntry[] = Array.from(
          { length: days },
          (_, i) => {
            const futureDate = new Date(lastDate);
            futureDate.setDate(futureDate.getDate() + i + 1);
            return {
              date: futureDate.toISOString().slice(0, 10),
              weightKg: intercept + slope * ((lastIndex || 0) + i + 1),
            };
          }
        );

        // Check if on track
        let onTrack = false;
        let daysToGoal: number | undefined;

        if (goals.goalWeightKg && goals.timeframeDays) {
          const currentWeight = entries[entries.length - 1]?.weightKg || 0;
          const targetLossRate =
            (currentWeight - goals.goalWeightKg) / goals.timeframeDays;
          const actualLossRate = Math.abs(slope);

          // On track if within 20% of target rate
          onTrack = actualLossRate >= targetLossRate * 0.8;

          // Calculate days to goal at current rate
          if (slope < 0) {
            const weightToLose = currentWeight - goals.goalWeightKg;
            daysToGoal = Math.ceil(weightToLose / Math.abs(slope));
          }
        }

        return {
          projected,
          slope,
          onTrack,
          daysToGoal,
        };
      },

      getWeightChange: () => {
        const { entries } = get();
        if (entries.length < 2) {
          return { totalKg: 0, weeklyAvg: 0 };
        }

        const first = entries[0]?.weightKg || 0;
        const last = entries[entries.length - 1]?.weightKg || 0;
        const totalKg = last - first;

        // Calculate time span in weeks
        const firstDate = new Date(entries[0]?.date || new Date());
        const lastDate = new Date(
          entries[entries.length - 1]?.date || new Date()
        );
        const daysDiff =
          (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        const weeks = Math.max(1, daysDiff / 7);

        const weeklyAvg = totalKg / weeks;

        return {
          totalKg: Math.round(totalKg * 10) / 10,
          weeklyAvg: Math.round(weeklyAvg * 10) / 10,
        };
      },

      reset: () => {
        set({ entries: [] });
      },
    }),
    {
      name: 'fiit_weight',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
