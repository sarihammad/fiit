import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PURCHASES_ERROR_CODE 
} from 'react-native-purchases';
import { 
  Offering, 
  Package, 
  CustomerInfo as CustomerInfoDTO,
} from '@/types/api';

// Subscription tier enum
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}

// Purchase result interface
export interface PurchaseResult {
  success: boolean;
  data?: {
    customerInfo: CustomerInfoDTO;
    productIdentifier: string;
  };
  error?: string;
}

// Rescue offer state interface
export interface RescueOfferState {
  canShowRescue: boolean;
  rescueOfferedAt?: string;
  rescueExpiry?: string;
}

export class PaywallService {
  private static readonly OFFERINGS_CACHE_KEY = '@fiit-offerings-cache';
  private static readonly RESCUE_OFFER_KEY = '@fiit-rescue-offer';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
   * Get available offerings
   */
  static async getOfferings(): Promise<Offering[]> {
    try {
      // Check cache first
      const cachedOfferings = await this.getCachedOfferings();
      if (cachedOfferings) {
        return cachedOfferings;
      }

      if (!Purchases) {
        // Return mock offerings for development
        return this.getMockOfferings();
      }
      
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        throw new Error('No current offering available');
      }

      const offeringDTO = this.mapOfferingToDTO(currentOffering);
      const offeringsArray = [offeringDTO];

      // Cache the offerings
      await this.cacheOfferings(offeringsArray);

      return offeringsArray;
    } catch (error) {
      console.error('[Paywall] Failed to get offerings:', error);
      
      // Return cached offerings if available
      const cachedOfferings = await this.getCachedOfferings();
      if (cachedOfferings) {
        return cachedOfferings;
      }

      // Return mock offerings as fallback
      return this.getMockOfferings();
    }
  }

  /**
   * Purchase a package
   */
  static async purchasePackage(packageIdentifier: string): Promise<PurchaseResult> {
    try {
      if (!Purchases) {
        throw new Error('RevenueCat not available');
      }
      
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        throw new Error('No offering available');
      }

      const packageToPurchase = currentOffering.availablePackages.find(
        pkg => pkg.identifier === packageIdentifier
      );

      if (!packageToPurchase) {
        throw new Error('Package not found');
      }

      const purchaseResult = await Purchases.purchasePackage(packageToPurchase);
      const customerInfo = this.mapCustomerInfoToDTO(purchaseResult.customerInfo);

      return {
        success: true,
        data: {
          customerInfo,
          productIdentifier: purchaseResult.productIdentifier,
        },
      };
    } catch (error) {
      console.error('[Paywall] Purchase failed:', error);
      
      const errorCode = (error as { code?: string }).code;
      if (errorCode === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return {
          success: false,
          error: 'Purchase cancelled',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!Purchases) {
        throw new Error('RevenueCat not available');
      }
      
      const restoreResult = await Purchases.restorePurchases();
      const customerInfo = this.mapCustomerInfoToDTO(restoreResult);
      
      return {
        success: true,
        data: {
          customerInfo,
          productIdentifier: 'restored',
        },
      };
    } catch (error) {
      console.error('[Paywall] Restore failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }

  /**
   * Get customer info
   */
  static async getCustomerInfo(): Promise<CustomerInfoDTO | null> {
    try {
      if (!Purchases) {
        return null;
      }

      const customerInfo = await Purchases.getCustomerInfo();
      return this.mapCustomerInfoToDTO(customerInfo);
    } catch (error) {
      console.error('[Paywall] Failed to get customer info:', error);
      return null;
    }
  }

  /**
   * Check rescue offer state
   */
  static async checkRescueOffer(): Promise<RescueOfferState> {
    try {
      const rescueData = await AsyncStorage.getItem(this.RESCUE_OFFER_KEY);
      
      if (!rescueData) {
        return { canShowRescue: true };
      }

      const parsed = JSON.parse(rescueData);
      const now = new Date();
      const expiry = new Date(parsed.rescueExpiry);

      if (now > expiry) {
        // Offer expired, can show again
        return { canShowRescue: true };
      }
      
      return {
        canShowRescue: false,
        rescueOfferedAt: parsed.rescueOfferedAt,
        rescueExpiry: parsed.rescueExpiry,
      };
    } catch (error) {
      console.error('[Paywall] Failed to check rescue offer:', error);
      return { canShowRescue: true };
    }
  }

  static async getRescueOfferState(): Promise<RescueOfferState> {
    return this.checkRescueOffer();
  }

  /**
   * Set rescue offer as shown
   */
  static async setRescueOfferShown(): Promise<boolean> {
    try {
      const now = new Date();
      const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      const rescueData = {
        rescueOfferedAt: now.toISOString(),
        rescueExpiry: expiry.toISOString(),
      };

      await AsyncStorage.setItem(this.RESCUE_OFFER_KEY, JSON.stringify(rescueData));
      return true;
    } catch (error) {
      console.error('[Paywall] Failed to set rescue offer:', error);
      return false;
    }
  }

  /**
   * Get tier benefits
   */
  static getTierBenefits(tier: SubscriptionTier): Array<{ title: string; description: string }> {
    switch (tier) {
      case SubscriptionTier.FREE:
        return [
          { title: 'Daily execution', description: 'Today Mode and plan check-ins' },
          { title: 'Basic accountability', description: 'Limited micro-step rewrites' },
        ];
      case SubscriptionTier.PRO:
        return [
          { title: 'Unlimited resets', description: 'Reset and recommit anytime' },
          { title: 'Unlimited micro-steps', description: 'Get unstuck on demand' },
          { title: 'Execution audits', description: 'Weekly reviews that keep you moving' },
          { title: 'Priority support', description: 'Direct support when you stall' },
        ];
      case SubscriptionTier.PREMIUM:
        return [
          { title: 'Everything in Pro', description: 'All Pro features included' },
          { title: 'Deep coaching', description: 'More detailed execution guidance' },
          { title: 'Custom goal resets', description: 'Unlimited plan resets' },
          { title: 'Execution summaries', description: 'Progress insights you can export' },
        ];
      default:
        return [];
    }
  }

  /**
   * Check if user can access a feature
   */
  static canAccessFeature(feature: string, tier: SubscriptionTier): boolean {
    const featureAccess = {
      daily_execution: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      plan_resets: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      micro_steps: [SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      unlimited_micro_steps: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      execution_audits: [SubscriptionTier.PRO, SubscriptionTier.PREMIUM],
      deep_coaching: [SubscriptionTier.PREMIUM],
      export_data: [SubscriptionTier.PREMIUM],
    };

    return featureAccess[feature as keyof typeof featureAccess]?.includes(tier) || false;
  }

  /**
   * Map RevenueCat offering to DTO
   */
  private static mapOfferingToDTO(offering: PurchasesOffering): Offering {
    return {
      identifier: offering.identifier,
      serverDescription: offering.serverDescription,
      availablePackages: offering.availablePackages.map(this.mapPackageToDTO),
    };
  }

  /**
   * Map RevenueCat package to DTO
   */
  private static mapPackageToDTO(pkg: PurchasesPackage): Package {
      return {
      identifier: pkg.identifier,
      packageType: pkg.packageType,
      product: {
        identifier: pkg.product.identifier,
        description: pkg.product.description,
        title: pkg.product.title,
        price: pkg.product.price,
        priceString: pkg.product.priceString,
        currencyCode: pkg.product.currencyCode,
      },
    };
  }

  /**
   * Map RevenueCat customer info to DTO
   */
  private static mapCustomerInfoToDTO(customerInfo: CustomerInfo): CustomerInfoDTO {
    const normalizeRecord = (
      record?: Record<string, string | null | undefined>
    ): Record<string, string> =>
      Object.fromEntries(
        Object.entries(record ?? {}).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string'
        )
      );

    return {
      originalAppUserId: customerInfo.originalAppUserId,
      firstSeen: customerInfo.firstSeen,
      requestDate: customerInfo.requestDate,
      allPurchaseDates: normalizeRecord(customerInfo.allPurchaseDates),
      allExpirationDates: normalizeRecord(customerInfo.allExpirationDates),
      allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
      nonSubscriptionTransactions: customerInfo.nonSubscriptionTransactions,
      activeSubscriptions: customerInfo.activeSubscriptions,
      entitlements: Object.fromEntries(
        Object.entries(customerInfo.entitlements?.all ?? {}).map(([key, value]) => [
          key,
          {
            identifier: value.identifier,
            isActive: value.isActive,
            willRenew: value.willRenew,
            periodType: value.periodType,
            latestPurchaseDate: value.latestPurchaseDate,
            originalPurchaseDate: value.originalPurchaseDate,
            expirationDate: value.expirationDate ?? undefined,
            store: String(value.store),
            productIdentifier: value.productIdentifier,
            isSandbox: value.isSandbox,
            unsubscribeDetectedAt: value.unsubscribeDetectedAt ?? undefined,
            billingIssueDetectedAt: value.billingIssueDetectedAt ?? undefined,
          },
        ])
      ),
    };
  }

  static normalizeCustomerInfo(customerInfo: CustomerInfo): CustomerInfoDTO {
    return this.mapCustomerInfoToDTO(customerInfo);
  }

  /**
   * Get cached offerings
   */
  private static async getCachedOfferings(): Promise<Offering[] | null> {
    try {
      const cached = await AsyncStorage.getItem(this.OFFERINGS_CACHE_KEY);
      if (!cached) return null;

      const { offerings, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > this.CACHE_DURATION) {
        await AsyncStorage.removeItem(this.OFFERINGS_CACHE_KEY);
        return null;
      }

      return offerings;
    } catch (error) {
      console.error('[Paywall] Failed to get cached offerings:', error);
      return null;
    }
  }

  /**
   * Cache offerings
   */
  private static async cacheOfferings(offerings: Offering[]): Promise<void> {
    try {
      const cacheData = {
        offerings,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.OFFERINGS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[Paywall] Failed to cache offerings:', error);
    }
  }

  /**
   * Get mock offerings for development
   */
  private static getMockOfferings(): Offering[] {
    return [
      {
        identifier: 'default',
        serverDescription: 'Default Offering',
        availablePackages: [
          {
            identifier: 'fiit_pro_yearly',
            packageType: 'ANNUAL',
            product: {
              identifier: 'com.fiit.pro.yearly',
              description: 'FIIT Pro Yearly',
              title: 'FIIT Pro Yearly',
              price: 59.99,
              priceString: '$59.99',
              currencyCode: 'USD',
            },
          },
          {
            identifier: 'fiit_pro_monthly',
            packageType: 'MONTHLY',
            product: {
              identifier: 'com.fiit.pro.monthly',
              description: 'FIIT Pro Monthly',
              title: 'FIIT Pro Monthly',
              price: 9.99,
              priceString: '$9.99',
              currencyCode: 'USD',
            },
          },
        ],
      },
    ];
  }
}
