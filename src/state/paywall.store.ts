// Paywall store with RevenueCat integration and typed interfaces
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaywallService } from '@/services/paywall';
import { Offering, CustomerInfo } from '@/types/api/purchases';

// Try to import Purchases, but handle the case where it's not available
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').Purchases;
} catch (error) {
  console.log('RevenueCat not available in this environment');
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface PaywallState {
  // RevenueCat state
  customerInfo?: CustomerInfo;
  offerings: Offering[];
  tier: SubscriptionTier;
  isPro: boolean;
  isPremium: boolean;
  isInTrial: boolean;
  isLoading: boolean;
  error?: string;

  // Rescue offer state
  showRescueOffer: boolean;
  rescueOfferExpiry?: string;

  // Actions
  setCustomerInfo: (customerInfo: CustomerInfo) => void;
  setOfferings: (offerings: Offering[]) => void;
  setTier: (tier: SubscriptionTier) => void;
  setPro: (isPro: boolean) => void;
  setPremium: (isPremium: boolean) => void;
  setInTrial: (isInTrial: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  setRescueOffer: (show: boolean, expiry?: string) => void;
  refresh: () => Promise<void>;
  purchasePackage: (packageId: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
  checkRescueOffer: () => Promise<void>;
  canAccessFeature: (feature: string) => boolean;
  reset: () => void;
  initialize: () => Promise<void>;
  hydrateOnAppStart: () => Promise<void>;
}

export const usePaywallStore = create<PaywallState>()(
  persist(
    (set, get) => ({
      // Initial state
      offerings: [],
      tier: 'free',
      isPro: false,
      isPremium: false,
      isInTrial: false,
      isLoading: false,
      showRescueOffer: false,

      // Actions
      setCustomerInfo: (customerInfo: CustomerInfo) => {
        const tier = getCurrentTier(customerInfo);
        const isPro = tier === 'pro' || tier === 'premium';
        const isPremium = tier === 'premium';
        const isInTrial = isCustomerInTrial(customerInfo);

        set({
          customerInfo,
          tier,
          isPro,
          isPremium,
          isInTrial,
        });
      },

      setOfferings: (offerings: Offering[]) => {
        set({ offerings });
      },

      setTier: (tier: SubscriptionTier) => {
        const isPro = tier === 'pro' || tier === 'premium';
        const isPremium = tier === 'premium';
        set({ tier, isPro, isPremium });
      },

      setPro: (isPro: boolean) => {
        set({ isPro });
      },

      setPremium: (isPremium: boolean) => {
        set({ isPremium });
      },

      setInTrial: (isInTrial: boolean) => {
        set({ isInTrial });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error?: string) => {
        set({ error });
      },

      clearError: () => {
        set({ error: undefined });
      },

      setRescueOffer: (
        showRescueOffer: boolean,
        rescueOfferExpiry?: string
      ) => {
        set({ showRescueOffer, rescueOfferExpiry });
      },

      refresh: async () => {
        try {
          set({ isLoading: true, error: undefined });

          if (!Purchases) {
            console.log('RevenueCat not available, using mock mode');
            // Use mock data for development
            const mockOfferings = PaywallService.getMockOfferings();
            set({
              offerings: mockOfferings,
              tier: 'free',
              isPro: false,
              isPremium: false,
              isInTrial: false,
              isLoading: false,
            });
            return;
          }

          const [customerInfo, offerings] = await Promise.all([
            Purchases.getCustomerInfo(),
            Purchases.getOfferings(),
          ]);

          const tier = getCurrentTier(customerInfo);
          const isPro = tier === 'pro' || tier === 'premium';
          const isPremium = tier === 'premium';
          const isInTrial = isCustomerInTrial(customerInfo);

          set({
            customerInfo,
            offerings: offerings.all || [],
            tier,
            isPro,
            isPremium,
            isInTrial,
            isLoading: false,
          });

          // Check for rescue offers
          await get().checkRescueOffer();
        } catch (error) {
          console.error('Paywall refresh error:', error);
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to refresh subscription status',
            isLoading: false,
          });
        }
      },

      purchasePackage: async (packageId: string) => {
        try {
          set({ isLoading: true, error: undefined });

          if (!Purchases) {
            console.log('RevenueCat not available, using mock purchase');
            // Mock successful purchase
            set({
              tier: 'pro',
              isPro: true,
              isPremium: false,
              isInTrial: true,
              isLoading: false,
            });
            return true;
          }

          const offerings = get().offerings;
          const offering = offerings.find(o =>
            o.availablePackages.some(p => p.identifier === packageId)
          );

          if (!offering) {
            throw new Error('Package not found');
          }

          const packageToPurchase = offering.availablePackages.find(
            p => p.identifier === packageId
          );

          if (!packageToPurchase) {
            throw new Error('Package not found');
          }

          const { customerInfo } =
            await Purchases.purchasePackage(packageToPurchase);

          const tier = getCurrentTier(customerInfo);
          const isPro = tier === 'pro' || tier === 'premium';
          const isPremium = tier === 'premium';
          const isInTrial = isCustomerInTrial(customerInfo);

          set({
            customerInfo,
            tier,
            isPro,
            isPremium,
            isInTrial,
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('Purchase error:', error);
          set({
            error: error instanceof Error ? error.message : 'Purchase failed',
            isLoading: false,
          });
          return false;
        }
      },

      restore: async () => {
        try {
          set({ isLoading: true, error: undefined });

          if (!Purchases) {
            console.log('RevenueCat not available, using mock restore');
            set({ isLoading: false });
            return true;
          }

          const customerInfo = await Purchases.restorePurchases();

          const tier = getCurrentTier(customerInfo);
          const isPro = tier === 'pro' || tier === 'premium';
          const isPremium = tier === 'premium';
          const isInTrial = isCustomerInTrial(customerInfo);

          set({
            customerInfo,
            tier,
            isPro,
            isPremium,
            isInTrial,
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('Restore error:', error);
          set({
            error: error instanceof Error ? error.message : 'Restore failed',
            isLoading: false,
          });
          return false;
        }
      },

      checkRescueOffer: async () => {
        try {
          if (!Purchases) {
            return;
          }

          const customerInfo = get().customerInfo;
          if (!customerInfo) {
            return;
          }

          // Check if user has active subscription
          const hasActiveSubscription = Object.values(
            customerInfo.entitlements
          ).some(entitlement => entitlement.isActive);

          if (hasActiveSubscription) {
            set({ showRescueOffer: false });
            return;
          }

          // Check if user had a subscription before (for rescue offers)
          const hadSubscription =
            customerInfo.allPurchasedProductIdentifiers.length > 0;

          if (hadSubscription) {
            // Show rescue offer
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 7); // 7 days from now

            set({
              showRescueOffer: true,
              rescueOfferExpiry: expiry.toISOString(),
            });
          }
        } catch (error) {
          console.error('Rescue offer check error:', error);
        }
      },

      canAccessFeature: (feature: string) => {
        const { tier, isPro, isPremium } = get();

        switch (feature) {
          case 'photo_logging':
            return true; // Free feature
          case 'meal_planning':
            return isPro || isPremium;
          case 'advanced_analytics':
            return isPremium;
          case 'priority_support':
            return isPro || isPremium;
          case 'unlimited_logs':
            return isPro || isPremium;
          default:
            return false;
        }
      },

      reset: () => {
        set({
          customerInfo: undefined,
          offerings: [],
          tier: 'free',
          isPro: false,
          isPremium: false,
          isInTrial: false,
          isLoading: false,
          error: undefined,
          showRescueOffer: false,
          rescueOfferExpiry: undefined,
        });
      },

      // Initialization and hydration
      initialize: async () => {
        try {
          await PaywallService.initialize();
          await get().hydrateOnAppStart();
        } catch (error) {
          console.error('Failed to initialize paywall:', error);
        }
      },

      hydrateOnAppStart: async () => {
        try {
          set({ isLoading: true });

          // Load offerings and customer info
          await Promise.all([get().refresh(), get().checkRescueOffer()]);
        } catch (error) {
          console.error('Failed to hydrate paywall on app start:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'paywall-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        tier: state.tier,
        isPro: state.isPro,
        isPremium: state.isPremium,
        isInTrial: state.isInTrial,
        showRescueOffer: state.showRescueOffer,
        rescueOfferExpiry: state.rescueOfferExpiry,
      }),
    }
  )
);

// Helper functions
function getCurrentTier(customerInfo: CustomerInfo): SubscriptionTier {
  if (!customerInfo) {
    return 'free';
  }

  // Check for premium entitlement
  if (customerInfo.entitlements.premium?.isActive) {
    return 'premium';
  }

  // Check for pro entitlement
  if (customerInfo.entitlements.pro?.isActive) {
    return 'pro';
  }

  return 'free';
}

function isCustomerInTrial(customerInfo: CustomerInfo): boolean {
  if (!customerInfo) {
    return false;
  }

  return Object.values(customerInfo.entitlements).some(
    entitlement => entitlement.periodType === 'TRIAL'
  );
}

// Selectors
export const usePaywallSelectors = () => {
  const store = usePaywallStore();

  return {
    isPro: store.isPro,
    isPremium: store.isPremium,
    isInTrial: store.isInTrial,
    tier: store.tier,
    isLoading: store.isLoading,
    error: store.error,
    offerings: store.offerings,
    showRescueOffer: store.showRescueOffer,
    canAccessFeature: store.canAccessFeature,
  };
};
