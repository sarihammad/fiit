import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaywallService, SubscriptionTier, RescueOfferState } from '@/services/paywall';
import { Offering, CustomerInfo } from '@/types/api';

// Paywall state interface
export interface PaywallState {
  // State
  offerings: Offering[];
  customerInfo: CustomerInfo | null;
  currentTier: SubscriptionTier;
  isPro: boolean;
  isLoading: boolean;
  error: string | null;
  rescueOfferState: RescueOfferState;

  // Actions
  initialize: () => Promise<void>;
  hydrateOnAppStart: () => Promise<void>;
  refresh: () => Promise<void>;
  purchasePackage: (packageIdentifier: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  restore: () => Promise<boolean>;
  checkRescueOffer: () => Promise<void>;
  setRescueOfferShown: () => Promise<void>;
  setCustomerInfo: (customerInfo: CustomerInfo | null) => void;
  canAccessFeature: (feature: string) => boolean;
  clearError: () => void;
  reset: () => void;
}

// Create paywall store
export const usePaywallStore = create<PaywallState>()(
  persist(
    (set, get) => ({
      // Initial state
      offerings: [],
      customerInfo: null,
      currentTier: SubscriptionTier.FREE,
      isPro: false,
      isLoading: false,
      error: null,
      rescueOfferState: { canShowRescue: true },

      canAccessFeature: (feature: string): boolean =>
        PaywallService.canAccessFeature(feature, get().currentTier),

      // Initialize RevenueCat
      initialize: async (): Promise<void> => {
        try {
          await PaywallService.initialize();
          await get().hydrateOnAppStart();
        } catch (error) {
          console.error('Failed to initialize paywall:', error);
          set({ error: 'Failed to initialize subscription service' });
        }
      },

      // Hydrate data on app start
      hydrateOnAppStart: async (): Promise<void> => {
        try {
          set({ isLoading: true });

          // Load offerings and customer info in parallel
          await Promise.all([
            get().refresh(),
            get().checkRescueOffer(),
          ]);
        } catch (error) {
          console.error('Failed to hydrate paywall on app start:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh offerings and customer info
      refresh: async (): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          const [offerings, customerInfo] = await Promise.all([
            PaywallService.getOfferings(),
            PaywallService.getCustomerInfo(),
          ]);

          // Determine current tier based on entitlements
          const currentTier = deriveTier(customerInfo);

          set({
            offerings,
            customerInfo,
            currentTier,
            isPro: isProTier(currentTier),
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to refresh paywall data:', error);
          set({
            error: 'Failed to load subscription data',
            isLoading: false,
          });
        }
      },

      // Purchase a package
      purchasePackage: async (packageIdentifier: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const result = await PaywallService.purchasePackage(packageIdentifier);
          
          if (result.success && result.data) {
            // Update customer info and tier
            const customerInfo = result.data.customerInfo;
            const currentTier = deriveTier(customerInfo);

            set({
              customerInfo,
              currentTier,
              isPro: isProTier(currentTier),
              isLoading: false,
            });

            return true;
          } else {
            set({
              error: result.error || 'Purchase failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error('Purchase error:', error);
          set({
            error: 'Purchase failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      // Restore purchases
      restorePurchases: async (): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const result = await PaywallService.restorePurchases();
          
          if (result.success && result.data) {
            // Update customer info and tier
            const customerInfo = result.data.customerInfo;
            const currentTier = deriveTier(customerInfo);

            set({
              customerInfo,
              currentTier,
              isPro: isProTier(currentTier),
              isLoading: false,
            });

            return true;
          } else {
            set({
              error: result.error || 'Restore failed',
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error('Restore error:', error);
          set({
            error: 'Restore failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      restore: async (): Promise<boolean> => get().restorePurchases(),

      // Check rescue offer state
      checkRescueOffer: async (): Promise<void> => {
        try {
          const rescueOfferState = await PaywallService.checkRescueOffer();
          set({ rescueOfferState });
        } catch (error) {
          console.error('Failed to check rescue offer:', error);
        }
      },

      // Set rescue offer as shown
      setRescueOfferShown: async (): Promise<boolean> => {
        try {
          const success = await PaywallService.setRescueOfferShown();
          await get().checkRescueOffer();
          return success;
        } catch (error) {
          console.error('Failed to set rescue offer shown:', error);
          return false;
        }
      },

      setCustomerInfo: (customerInfo: CustomerInfo | null): void => {
        const currentTier = deriveTier(customerInfo);
        set({
          customerInfo,
          currentTier,
          isPro: isProTier(currentTier),
        });
      },

      // Clear error
      clearError: (): void => {
        set({ error: null });
      },

      // Reset state
      reset: (): void => {
        set({
          offerings: [],
          customerInfo: null,
          currentTier: SubscriptionTier.FREE,
          isPro: false,
          isLoading: false,
          error: null,
          rescueOfferState: { canShowRescue: true },
        });
      },
    }),
    {
      name: 'paywall-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist non-sensitive state
      partialize: (state) => ({
        currentTier: state.currentTier,
        rescueOfferState: state.rescueOfferState,
      }),
    }
  )
);

// Selectors for better performance
export const useOfferings = () => usePaywallStore((state) => state.offerings);
export const useCustomerInfo = () => usePaywallStore((state) => state.customerInfo);
export const useCurrentTier = () => usePaywallStore((state) => state.currentTier);
export const usePaywallLoading = () => usePaywallStore((state) => state.isLoading);
export const usePaywallError = () => usePaywallStore((state) => state.error);
export const useRescueOfferState = () => usePaywallStore((state) => state.rescueOfferState);

// Action selectors
export const usePaywallActions = () => usePaywallStore((state) => ({
  initialize: state.initialize,
  hydrateOnAppStart: state.hydrateOnAppStart,
  refresh: state.refresh,
  purchasePackage: state.purchasePackage,
  restorePurchases: state.restorePurchases,
  checkRescueOffer: state.checkRescueOffer,
  setRescueOfferShown: state.setRescueOfferShown,
  clearError: state.clearError,
  reset: state.reset,
}));

// Utility selectors
export const useIsPro = () => usePaywallStore((state) => 
  state.isPro
);

export const useIsPremium = () => usePaywallStore((state) => 
  state.currentTier === SubscriptionTier.PREMIUM
);

export const useCanAccessFeature = (feature: string) => usePaywallStore((state) => 
  state.canAccessFeature(feature)
);

const isProTier = (tier: SubscriptionTier): boolean =>
  tier === SubscriptionTier.PRO || tier === SubscriptionTier.PREMIUM;

const deriveTier = (customerInfo: CustomerInfo | null): SubscriptionTier => {
  if (!customerInfo?.entitlements) {
    return SubscriptionTier.FREE;
  }

  if (customerInfo.entitlements.premium?.isActive) {
    return SubscriptionTier.PREMIUM;
  }

  if (customerInfo.entitlements.pro?.isActive) {
    return SubscriptionTier.PRO;
  }

  return SubscriptionTier.FREE;
};
