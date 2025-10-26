import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ComplianceState {
  hasConfirmedAge: boolean;
  ageConfirmedAt?: string;
  hasAcceptedDisclaimer: boolean;
  disclaimerAcceptedAt?: string;

  // Actions
  confirmAge: () => void;
  acceptDisclaimer: () => void;
  resetCompliance: () => void;
}

export const useComplianceStore = create<ComplianceState>()(
  persist(
    set => ({
      hasConfirmedAge: false,
      hasAcceptedDisclaimer: false,

      confirmAge: () =>
        set({
          hasConfirmedAge: true,
          ageConfirmedAt: new Date().toISOString(),
        }),

      acceptDisclaimer: () =>
        set({
          hasAcceptedDisclaimer: true,
          disclaimerAcceptedAt: new Date().toISOString(),
        }),

      resetCompliance: () =>
        set({
          hasConfirmedAge: false,
          ageConfirmedAt: undefined,
          hasAcceptedDisclaimer: false,
          disclaimerAcceptedAt: undefined,
        }),
    }),
    {
      name: '@fiit-compliance',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

