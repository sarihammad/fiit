import { PaywallService } from '../paywall';

// Mock RevenueCat
const mockPurchases = {
  configure: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(),
};

jest.mock('react-native-purchases', () => ({
  Purchases: mockPurchases,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      RC_IOS_API_KEY: 'ios-key',
      RC_ANDROID_API_KEY: 'android-key',
    },
  },
}));

describe('PaywallService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize RevenueCat with correct API keys', async () => {
      await PaywallService.initialize();

      expect(mockPurchases.configure).toHaveBeenCalledWith({
        apiKey: 'ios-key', // Assuming iOS in test environment
      });
    });

    it('should handle missing API keys gracefully', async () => {
      jest.doMock('expo-constants', () => ({
        expoConfig: { extra: {} },
      }));

      await PaywallService.initialize();

      expect(mockPurchases.configure).not.toHaveBeenCalled();
    });
  });

  describe('canAccessFeature', () => {
    it('should allow free features for all tiers', () => {
      expect(PaywallService.canAccessFeature('meal_logging', 'free')).toBe(
        true
      );
      expect(PaywallService.canAccessFeature('meal_logging', 'pro')).toBe(true);
      expect(PaywallService.canAccessFeature('meal_logging', 'premium')).toBe(
        true
      );
    });

    it('should restrict pro features to pro and premium tiers', () => {
      expect(PaywallService.canAccessFeature('meal_planning', 'free')).toBe(
        false
      );
      expect(PaywallService.canAccessFeature('meal_planning', 'pro')).toBe(
        true
      );
      expect(PaywallService.canAccessFeature('meal_planning', 'premium')).toBe(
        true
      );
    });

    it('should restrict premium features to premium tier only', () => {
      expect(PaywallService.canAccessFeature('weekly_checkin', 'free')).toBe(
        false
      );
      expect(PaywallService.canAccessFeature('weekly_checkin', 'pro')).toBe(
        false
      );
      expect(PaywallService.canAccessFeature('weekly_checkin', 'premium')).toBe(
        true
      );
    });
  });

  describe('getTierBenefits', () => {
    it('should return correct benefits for each tier', () => {
      const freeBenefits = PaywallService.getTierBenefits('free');
      const proBenefits = PaywallService.getTierBenefits('pro');
      const premiumBenefits = PaywallService.getTierBenefits('premium');

      expect(freeBenefits).toHaveLength(3);
      expect(proBenefits).toHaveLength(3);
      expect(premiumBenefits).toHaveLength(3);

      expect(freeBenefits[0].title).toBe('Photo Food Logging');
      expect(proBenefits[0].title).toBe('AI Meal Planning');
      expect(premiumBenefits[0].title).toBe('Weekly AI Check-ins');
    });
  });

  describe('getRescueOfferState', () => {
    it('should return canShowRescue false when no offer exists', async () => {
      const state = await PaywallService.getRescueOfferState();
      expect(state.canShowRescue).toBe(false);
    });

    it('should return canShowRescue true when offer exists and not expired', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 12); // 12 hours from now

      // Mock AsyncStorage to return a valid offer
      jest.doMock('@react-native-async-storage/async-storage', () => ({
        getItem: jest.fn().mockResolvedValue(
          JSON.stringify({
            rescueOfferedAt: new Date().toISOString(),
            rescueExpiry: futureDate.toISOString(),
          })
        ),
      }));

      const state = await PaywallService.getRescueOfferState();
      expect(state.canShowRescue).toBe(true);
    });
  });
});

