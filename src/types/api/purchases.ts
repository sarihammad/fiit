// Purchases and RevenueCat API types and DTOs
import { z } from 'zod';

// Base schemas
export const OfferingSchema = z.object({
  identifier: z.string(),
  serverDescription: z.string(),
  metadata: z.record(z.string()).optional(),
  availablePackages: z.array(
    z.object({
      identifier: z.string(),
      packageType: z.string(),
      product: z.object({
        identifier: z.string(),
        description: z.string(),
        title: z.string(),
        price: z.number(),
        priceString: z.string(),
        currencyCode: z.string(),
        introPrice: z
          .object({
            price: z.number(),
            priceString: z.string(),
            period: z.string(),
            cycles: z.number(),
            periodUnit: z.string(),
            periodNumberOfUnits: z.number(),
          })
          .optional(),
      }),
    })
  ),
});

export const CustomerInfoSchema = z.object({
  originalAppUserId: z.string(),
  firstSeen: z.string(),
  originalApplicationVersion: z.string().optional(),
  requestDate: z.string(),
  allPurchaseDates: z.record(z.string()),
  allExpirationDates: z.record(z.string()),
  allPurchasedProductIdentifiers: z.array(z.string()),
  nonSubscriptionTransactions: z.array(
    z.object({
      productIdentifier: z.string(),
      purchaseDate: z.string(),
      transactionIdentifier: z.string(),
    })
  ),
  activeSubscriptions: z.array(z.string()),
  entitlements: z.record(
    z.object({
      identifier: z.string(),
      isActive: z.boolean(),
      willRenew: z.boolean(),
      periodType: z.string(),
      latestPurchaseDate: z.string(),
      originalPurchaseDate: z.string(),
      expirationDate: z.string().optional(),
      store: z.string(),
      productIdentifier: z.string(),
      isSandbox: z.boolean(),
      unsubscribeDetectedAt: z.string().optional(),
      billingIssueDetectedAt: z.string().optional(),
    })
  ),
});

// Request schemas
export const PurchaseRequestSchema = z.object({
  packageId: z.string(),
  offeringId: z.string().optional(),
});

export const RestorePurchasesRequestSchema = z.object({
  userId: z.string().optional(),
});

// Response schemas
export const PurchaseResponseSchema = z.object({
  customerInfo: CustomerInfoSchema,
  productIdentifier: z.string(),
  transactionIdentifier: z.string(),
  purchaseDate: z.string(),
});

export const RestorePurchasesResponseSchema = z.object({
  customerInfo: CustomerInfoSchema,
  restoredPurchases: z.array(
    z.object({
      productIdentifier: z.string(),
      transactionIdentifier: z.string(),
      purchaseDate: z.string(),
    })
  ),
});

export const GetOfferingsResponseSchema = z.object({
  offerings: z.array(OfferingSchema),
  currentOffering: OfferingSchema.optional(),
});

export const EntitlementSchema = z.object({
  identifier: z.string(),
  isActive: z.boolean(),
  willRenew: z.boolean(),
  periodType: z.string(),
  latestPurchaseDate: z.string(),
  originalPurchaseDate: z.string(),
  expirationDate: z.string().optional(),
  store: z.string(),
  productIdentifier: z.string(),
  isSandbox: z.boolean(),
  unsubscribeDetectedAt: z.string().optional(),
  billingIssueDetectedAt: z.string().optional(),
});

// Type exports
export type Offering = z.infer<typeof OfferingSchema>;
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;
export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>;
export type RestorePurchasesRequest = z.infer<
  typeof RestorePurchasesRequestSchema
>;
export type PurchaseResponse = z.infer<typeof PurchaseResponseSchema>;
export type RestorePurchasesResponse = z.infer<
  typeof RestorePurchasesResponseSchema
>;
export type GetOfferingsResponse = z.infer<typeof GetOfferingsResponseSchema>;
export type Entitlement = z.infer<typeof EntitlementSchema>;
