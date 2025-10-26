import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachFeedback } from '@/types/nutrition';

interface FeedbackState {
  feedbackHistory: CoachFeedback[];
  isGenerating: boolean;
  lastError: string | null;

  // Actions
  addFeedback: (feedback: CoachFeedback) => void;
  getFeedbackForDate: (date: string) => CoachFeedback | null;
  getLatestFeedback: () => CoachFeedback | null;
  getRecentFeedback: (count: number) => CoachFeedback[];
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedbackHistory: [],
      isGenerating: false,
      lastError: null,

      addFeedback: feedback => {
        set(state => {
          // Remove existing feedback for the same date, then add new one
          const filtered = state.feedbackHistory.filter(
            f => f.date !== feedback.date
          );
          const updated = [...filtered, feedback].sort((a, b) =>
            b.date.localeCompare(a.date)
          ); // Most recent first
          return { feedbackHistory: updated, lastError: null };
        });
      },

      getFeedbackForDate: date => {
        const { feedbackHistory } = get();
        return feedbackHistory.find(f => f.date === date) || null;
      },

      getLatestFeedback: () => {
        const { feedbackHistory } = get();
        return feedbackHistory.length > 0 ? feedbackHistory[0] || null : null;
      },

      getRecentFeedback: count => {
        const { feedbackHistory } = get();
        return feedbackHistory.slice(0, count);
      },

      setGenerating: isGenerating => {
        set({ isGenerating });
      },

      setError: error => {
        set({ lastError: error, isGenerating: false });
      },

      reset: () => {
        set({ feedbackHistory: [], isGenerating: false, lastError: null });
      },
    }),
    {
      name: 'fiit_feedback',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
