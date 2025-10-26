import React, { createContext, useContext, useEffect } from 'react';
import * as Sentry from 'sentry-expo';

// Try to import PostHog
let posthog: any = null;
try {
  const PostHogModule = require('posthog-react-native');
  posthog = PostHogModule.default || PostHogModule;
} catch (error) {
  console.log('[Analytics] PostHog not available');
}

// Initialize Sentry
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: false, // Don't send errors in development
    debug: __DEV__,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
    release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    beforeSend(event) {
      // Filter out development errors
      if (__DEV__) {
        return null;
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        platform: 'mobile',
        app: 'fiit',
      };

      return event;
    },
  });
}

// Analytics event types for FIIT
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'meal_scanned'
  | 'meal_manual'
  | 'meal_search'
  | 'plan_generated'
  | 'plan_swapped'
  | 'grocery_copied'
  | 'grocery_shared'
  | 'insight_viewed'
  | 'paywall_shown'
  | 'trial_started'
  | 'purchase_completed'
  | 'cancel_attempted'
  | 'rescue_offer_shown'
  | 'rescue_offer_accepted'
  | 'rescue_offer_declined'
  | 'notification_opened'
  | 'notification_scheduled'
  | 'weight_added'
  | 'goal_updated'
  | 'food_recognition_request'
  | 'food_recognition_result'
  | 'food_recognition_confirmed'
  | 'food_recognition_fallback';

interface AnalyticsContextType {
  trackEvent: (event: AnalyticsEvent, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
  captureError: (error: Error, context?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
}) => {
  useEffect(() => {
    // Initialize PostHog
    const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

    if (posthogKey && posthog) {
      try {
        posthog.init(posthogKey, {
          host: 'https://app.posthog.com',
          captureNativeAppLifecycleEvents: true,
        });
        console.log('[Analytics] PostHog initialized');
      } catch (error) {
        console.error('[Analytics] PostHog init failed:', error);
      }
    } else {
      console.log('[Analytics] PostHog not configured');
    }
  }, []);

  const trackEvent = (
    event: AnalyticsEvent,
    properties?: Record<string, any>
  ) => {
    const timestamp = new Date().toISOString();
    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp,
        platform: 'mobile',
      },
      timestamp,
    };

    // Log to console in development
    if (__DEV__) {
      console.log('[Analytics Event]', eventData);
    }

    // Send to PostHog
    if (posthog) {
      try {
        posthog.capture(event, eventData.properties);
      } catch (error) {
        console.error('[Analytics] PostHog capture failed:', error);
      }
    }

    // Send to Sentry as breadcrumb
    if (SENTRY_DSN) {
      Sentry.Native.addBreadcrumb({
        category: 'analytics',
        message: event,
        level: 'info',
        data: properties,
      });
    }
  };

  const identifyUser = (userId: string, traits?: Record<string, any>) => {
    if (__DEV__) {
      console.log('[Analytics Identify]', { userId, traits });
    }

    // Identify in PostHog
    if (posthog) {
      try {
        posthog.identify(userId, traits);
      } catch (error) {
        console.error('[Analytics] PostHog identify failed:', error);
      }
    }

    // Set user in Sentry
    if (SENTRY_DSN) {
      Sentry.Native.setUser({
        id: userId,
        ...traits,
      });
    }
  };

  const captureError = (error: Error, context?: Record<string, any>) => {
    console.error('[Analytics] Error captured:', error, context);

    // Send to Sentry
    if (SENTRY_DSN) {
      Sentry.Native.captureException(error, {
        extra: context,
      });
    }

    // Track error event in PostHog
    if (posthog) {
      try {
        posthog.capture('error_occurred', {
          error_message: error.message,
          error_stack: error.stack,
          ...context,
        });
      } catch (err) {
        console.error('[Analytics] PostHog error tracking failed:', err);
      }
    }
  };

  const value: AnalyticsContextType = {
    trackEvent,
    identifyUser,
    captureError,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Helper hook for common event tracking
export const useTrackScreen = (screenName: string) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent('insight_viewed', { screen: screenName });
  }, [screenName, trackEvent]);
};

// Exported tracking function for use outside React components
export const track = (
  event: AnalyticsEvent,
  properties?: Record<string, any>
) => {
  const timestamp = new Date().toISOString();

  if (__DEV__) {
    console.log('[Analytics Event]', { event, properties, timestamp });
  }

  if (posthog) {
    try {
      posthog.capture(event, { ...properties, timestamp });
    } catch (error) {
      console.error('[Analytics] Track failed:', error);
    }
  }
};

// Error capture function for use outside React components
export const captureError = (error: Error, context?: Record<string, any>) => {
  console.error('[Error]', error, context);

  if (SENTRY_DSN) {
    Sentry.Native.captureException(error, {
      extra: context,
    });
  }
};

// Pre-built tracking functions for common actions
export const analyticsHelpers = {
  trackMealLogged: (source: 'scan' | 'search' | 'manual', calories: number) => {
    const eventMap = {
      scan: 'meal_scanned' as AnalyticsEvent,
      search: 'meal_search' as AnalyticsEvent,
      manual: 'meal_manual' as AnalyticsEvent,
    };
    track(eventMap[source], { calories });
  },

  trackPlanGeneration: (success: boolean, dietType?: string) => {
    track('plan_generated', { success, diet_type: dietType });
  },

  trackPlanSwap: (mealType: string) => {
    track('plan_swapped', { meal_type: mealType });
  },

  trackGroceryAction: (action: 'copy' | 'share') => {
    track(action === 'copy' ? 'grocery_copied' : 'grocery_shared', {});
  },

  trackPurchase: (productId: string, price: number, success: boolean) => {
    track(success ? 'purchase_completed' : 'cancel_attempted', {
      product_id: productId,
      price,
      currency: 'USD',
    });
  },

  trackRescueOffer: (action: 'shown' | 'accepted' | 'declined') => {
    const eventMap = {
      shown: 'rescue_offer_shown' as AnalyticsEvent,
      accepted: 'rescue_offer_accepted' as AnalyticsEvent,
      declined: 'rescue_offer_declined' as AnalyticsEvent,
    };
    track(eventMap[action], {});
  },
};
