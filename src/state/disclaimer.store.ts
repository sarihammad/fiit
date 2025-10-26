import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DisclaimerState {
  hasAcceptedDisclaimer: boolean;
  disclaimerAcceptedAt?: string;
  acceptDisclaimer: () => void;
  resetDisclaimer: () => void; // For testing or if terms change
}

export const useDisclaimerStore = create<DisclaimerState>()(
  persist(
    set => ({
      hasAcceptedDisclaimer: false,
      disclaimerAcceptedAt: undefined,
      acceptDisclaimer: () =>
        set({
          hasAcceptedDisclaimer: true,
          disclaimerAcceptedAt: new Date().toISOString(),
        }),
      resetDisclaimer: () =>
        set({
          hasAcceptedDisclaimer: false,
          disclaimerAcceptedAt: undefined,
        }),
    }),
    {
      name: '@fiit-disclaimer',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        hasAcceptedDisclaimer: state.hasAcceptedDisclaimer,
        disclaimerAcceptedAt: state.disclaimerAcceptedAt,
      }),
    }
  )
);

