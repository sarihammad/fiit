import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { usePaywallStore } from '@/state/paywall.store';
import { useAuthStore } from '@/state/auth.store';

// Try to import Purchases, but handle the case where it's not available
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').Purchases;
} catch (error) {
  console.log('RevenueCat not available in this environment');
}

interface PurchasesContextType {
  isConfigured: boolean;
  isLoading: boolean;
  error?: string;
}

const PurchasesContext = createContext<PurchasesContextType | undefined>(
  undefined
);

export const PurchasesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const { setCustomerInfo, refresh } = usePaywallStore();
  const { user, isAuthenticated } = useAuthStore();

  // Configure RevenueCat
  useEffect(() => {
    const configurePurchases = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Check if Purchases is available
        if (!Purchases) {
          console.log('RevenueCat not available, using mock mode');
          // Refresh paywall store to ensure correct tier (free)
          await refresh();
          setIsConfigured(true);
          return;
        }

        // Get API keys from app config
        const iosApiKey =
          Constants.expoConfig?.extra?.RC_IOS_API_KEY ||
          'appl_EZZhGHPzidlBvHAUvXqlhLTqgCP';
        const androidApiKey =
          Constants.expoConfig?.extra?.RC_ANDROID_API_KEY ||
          'goog_eGehbjajtUQWCTeStonOlzCOuVD';

        if (!iosApiKey || !androidApiKey) {
          console.log('RevenueCat API keys not configured, using mock mode');
          setIsConfigured(true);
          return;
        }

        // Configure Purchases with platform-specific API key
        const apiKey = Platform.OS === 'ios' ? iosApiKey : androidApiKey;

        await Purchases.configure({
          apiKey,
          appUserID: undefined, // Let RevenueCat generate anonymous ID
        });

        // Set up customer info update listener
        Purchases.addCustomerInfoUpdateListener((customerInfo: any) => {
          setCustomerInfo(customerInfo);
        });

        // Get initial customer info
        const customerInfo = await Purchases.getCustomerInfo();
        setCustomerInfo(customerInfo);

        // Refresh paywall store to ensure correct tier
        await refresh();

        setIsConfigured(true);
      } catch (err) {
        console.log('RevenueCat configuration failed, using mock mode:', err);
        setIsConfigured(true); // Still mark as configured so app can continue
      } finally {
        setIsLoading(false);
      }
    };

    configurePurchases();
  }, [setCustomerInfo]);

  // Handle user authentication changes
  useEffect(() => {
    const handleUserChange = async () => {
      if (!isConfigured || !Purchases) return;

      try {
        if (isAuthenticated && user?.id) {
          // Log in user to RevenueCat
          await Purchases.logIn(user.id);
        } else {
          // Log out user from RevenueCat (returns to anonymous)
          await Purchases.logOut();
        }

        // Refresh customer info after login/logout
        await refresh();
      } catch (err) {
        console.error('Failed to sync user with RevenueCat:', err);
      }
    };

    handleUserChange();
  }, [isConfigured, isAuthenticated, user?.id, refresh]);

  return (
    <PurchasesContext.Provider value={{ isConfigured, isLoading, error }}>
      {children}
    </PurchasesContext.Provider>
  );
};

export const usePurchases = (): PurchasesContextType => {
  const context = useContext(PurchasesContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchasesProvider');
  }
  return context;
};
