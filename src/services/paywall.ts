// FIIT Paywall Service with RevenueCat integration
// Handles subscription tiers, feature gating, and rescue offers

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { http } from './http';
import {
  Offering,
  CustomerInfo,
  PurchaseRequest,
  RestorePurchasesRequest,
} from '@/types/api/purchases';

// Try to import Purchases, handle gracefully if not available
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').Purchases;
} catch (error) {
  console.log('[Paywall] RevenueCat not available in this environment');
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface PaywallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RescueOfferState {
  canShowRescue: boolean;
  rescueOfferedAt?: string;
  rescueExpiry?: string; // 24h from offer
}

const RESCUE_OFFER_KEY = '@fiit-rescue-offer';
const RESCUE_DISCOUNT = 0.5; // 50% off
const RESCUE_WINDOW_HOURS = 24;

export class PaywallService {
  /**
   * Initialize RevenueCat with environment variables
   */
  static async initialize(): Promise<void> {
    if (!Purchases) {
      console.log('[Paywall] RevenueCat not available, using mock mode');
      return;
    }

    try {
      const Constants = require('expo-constants');
      const iosApiKey = Constants.expoConfig?.extra?.RC_IOS_API_KEY;
      const androidApiKey = Constants.expoConfig?.extra?.RC_ANDROID_API_KEY;

      if (!iosApiKey || !androidApiKey) {
        console.warn('[Paywall] RevenueCat API keys not found in environment');
        return;
      }

      await Purchases.configure({
        apiKey: Platform.OS === 'ios' ? iosApiKey : androidApiKey,
      });

      console.log('[Paywall] RevenueCat initialized successfully');
    } catch (error) {
      console.error('[Paywall] Failed to initialize RevenueCat:', error);
    }
  }

  /**
   * Feature gating logic
   * Free: logging only
   * Pro: planner, grocery, insights history
   * Premium: weekly AI check-ins
   */
  static canAccessFeature(feature: string, tier: SubscriptionTier): boolean {
    const featureMap: Record<string, SubscriptionTier[]> = {
      // Free features
      meal_logging: ['free', 'pro', 'premium'],
      photo_scan: ['free', 'pro', 'premium'],
      search_food: ['free', 'pro', 'premium'],
      manual_entry: ['free', 'pro', 'premium'],
      daily_totals: ['free', 'pro', 'premium'],
      today_insight: ['free', 'pro', 'premium'], // Today's insight is free

      // Pro features
      meal_planner: ['pro', 'premium'],
      grocery_lists: ['pro', 'premium'],
      insights_history: ['pro', 'premium'],
      weekly_analytics: ['pro', 'premium'],
      advanced_tracking: ['pro', 'premium'],
      export_data: ['pro', 'premium'],

      // Premium features
      weekly_ai_checkins: ['premium'],
      priority_support: ['premium'],
      custom_meal_plans: ['premium'],
      advanced_analytics: ['premium'],
      unlimited_meal_plans: ['premium'],
    };

    return featureMap[feature]?.includes(tier) || false;
  }

  /**
   * Get current subscription tier from customer info
   */
  static getCurrentTier(customerInfo?: CustomerInfo): SubscriptionTier {
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

  /**
   * Check if customer is in trial period
   */
  static isCustomerInTrial(customerInfo?: CustomerInfo): boolean {
    if (!customerInfo) {
      return false;
    }

    return Object.values(customerInfo.entitlements).some(
      entitlement => entitlement.periodType === 'TRIAL'
    );
  }

  /**
   * Get mock offerings for development/testing
   */
  static getMockOfferings(): Offering[] {
    return [
      {
        identifier: 'default',
        serverDescription: 'FIIT Premium Plans',
        metadata: {},
        availablePackages: [
          {
            identifier: 'fiit_pro_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'fiit_pro_monthly',
              description: 'FIIT Pro Monthly',
              title: 'FIIT Pro',
              price: 9.99,
              priceString: '$9.99',
              currencyCode: 'USD',
            },
          },
          {
            identifier: 'fiit_pro_yearly',
            packageType: 'ANNUAL',
            product: {
              identifier: 'fiit_pro_yearly',
              description: 'FIIT Pro Yearly',
              title: 'FIIT Pro',
              price: 79.99,
              priceString: '$79.99',
              currencyCode: 'USD',
            },
          },
          {
            identifier: 'fiit_premium_yearly',
            packageType: 'ANNUAL',
            product: {
              identifier: 'fiit_premium_yearly',
              description: 'FIIT Premium Yearly',
              title: 'FIIT Premium',
              price: 199.99,
              priceString: '$199.99',
              currencyCode: 'USD',
            },
          },
        ],
      },
    ];
  }

  /**
   * Purchase a package
   */
  static async purchasePackage(packageId: string): Promise<PaywallResult> {
    try {
      if (!Purchases) {
        console.log('[Paywall] RevenueCat not available, using mock purchase');
        return {
          success: true,
          data: {
            packageId,
            tier: 'pro',
            isInTrial: true,
          },
        };
      }

      const request: PurchaseRequest = { packageId };
      const response = await http.post('/purchases/purchase', request);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('[Paywall] Purchase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(): Promise<PaywallResult> {
    try {
      if (!Purchases) {
        console.log('[Paywall] RevenueCat not available, using mock restore');
        return {
          success: true,
          data: {
            restoredPurchases: [],
          },
        };
      }

      const request: RestorePurchasesRequest = {};
      const response = await http.post('/purchases/restore', request);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('[Paywall] Restore error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  /**
   * Get offerings
   */
  static async getOfferings(): Promise<Offering[]> {
    try {
      if (!Purchases) {
        console.log('[Paywall] RevenueCat not available, using mock offerings');
        return this.getMockOfferings();
      }

      const response = await http.get<{ offerings: Offering[] }>(
        '/purchases/offerings'
      );
      return response.offerings;
    } catch (error) {
      console.error('[Paywall] Get offerings error:', error);
      return this.getMockOfferings();
    }
  }

  /**
   * Get customer info
   */
  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      if (!Purchases) {
        console.log(
          '[Paywall] RevenueCat not available, using mock customer info'
        );
        return null;
      }

      const response = await http.get<CustomerInfo>('/purchases/customer-info');
      return response;
    } catch (error) {
      console.error('[Paywall] Get customer info error:', error);
      return null;
    }
  }

  /**
   * Check if rescue offer should be shown
   */
  static async checkRescueOffer(): Promise<RescueOfferState> {
    try {
      const stored = await AsyncStorage.getItem(RESCUE_OFFER_KEY);

      if (!stored) {
        return { canShowRescue: false };
      }

      const rescueData = JSON.parse(stored);
      const now = new Date();
      const rescueExpiry = new Date(rescueData.rescueExpiry);

      if (now > rescueExpiry) {
        // Rescue offer expired
        await AsyncStorage.removeItem(RESCUE_OFFER_KEY);
        return { canShowRescue: false };
      }

      return rescueData;
    } catch (error) {
      console.error('[Paywall] Rescue offer check error:', error);
      return { canShowRescue: false };
    }
  }

  /**
   * Show rescue offer
   */
  static async showRescueOffer(): Promise<void> {
    try {
      const now = new Date();
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + RESCUE_WINDOW_HOURS);

      const rescueData: RescueOfferState = {
        canShowRescue: true,
        rescueOfferedAt: now.toISOString(),
        rescueExpiry: expiry.toISOString(),
      };

      await AsyncStorage.setItem(RESCUE_OFFER_KEY, JSON.stringify(rescueData));
    } catch (error) {
      console.error('[Paywall] Show rescue offer error:', error);
    }
  }

  /**
   * Dismiss rescue offer
   */
  static async dismissRescueOffer(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RESCUE_OFFER_KEY);
    } catch (error) {
      console.error('[Paywall] Dismiss rescue offer error:', error);
    }
  }

  /**
   * Get rescue offer discount
   */
  static getRescueDiscount(): number {
    return RESCUE_DISCOUNT;
  }

  /**
   * Format price with currency
   */
  static formatPrice(price: number, currencyCode: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  }

  /**
   * Calculate savings for annual vs monthly
   */
  static calculateSavings(monthlyPrice: number, annualPrice: number): number {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    return Math.round((savings / monthlyTotal) * 100);
  }

  /**
   * Get feature list for tier
   */
  static getFeaturesForTier(tier: SubscriptionTier): string[] {
    const features: Record<SubscriptionTier, string[]> = {
      free: [
        'Photo food logging',
        'Manual meal entry',
        'Daily nutrition totals',
        'Basic insights',
        'Food search database',
      ],
      pro: [
        'Everything in Free',
        'AI meal planning',
        'Grocery lists',
        'Weekly analytics',
        'Insights history',
        'Advanced tracking',
        'Data export',
      ],
      premium: [
        'Everything in Pro',
        'Weekly AI check-ins',
        'Priority support',
        'Custom meal plans',
        'Advanced analytics',
        'Unlimited meal plans',
        'Personal nutritionist access',
      ],
    };

    return features[tier] || [];
  }

  /**
   * Get tier benefits for paywall display
   */
  static getTierBenefits(
    tier: SubscriptionTier
  ): { title: string; description: string; icon: string }[] {
    const benefits: Record<
      SubscriptionTier,
      { title: string; description: string; icon: string }[]
    > = {
      free: [
        {
          title: 'Photo Logging',
          description:
            'Snap photos of your meals for instant nutrition tracking',
          icon: 'photo-camera',
        },
        {
          title: 'Daily Totals',
          description: 'See your daily calorie and macro breakdown',
          icon: 'bar-chart',
        },
        {
          title: 'Basic Insights',
          description: 'Get simple tips to improve your nutrition',
          icon: 'lightbulb',
        },
      ],
      pro: [
        {
          title: 'AI Meal Planning',
          description: 'Get personalized meal plans based on your goals',
          icon: 'restaurant',
        },
        {
          title: 'Grocery Lists',
          description: 'Auto-generated shopping lists for your meal plans',
          icon: 'shopping-bag',
        },
        {
          title: 'Weekly Analytics',
          description: 'Track your progress with detailed weekly reports',
          icon: 'show-chart',
        },
      ],
      premium: [
        {
          title: 'Weekly AI Check-ins',
          description: 'Personalized coaching sessions with AI nutritionist',
          icon: 'psychology',
        },
        {
          title: 'Priority Support',
          description: 'Get help when you need it with priority support',
          icon: 'support-agent',
        },
        {
          title: 'Advanced Analytics',
          description: 'Deep insights into your nutrition patterns',
          icon: 'analytics',
        },
      ],
    };

    return benefits[tier] || [];
  }
}
