// Analytics service for tracking user behavior and app performance
import { http } from './http';
import { useAuthStore } from '@/state/auth.store';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  subscriptionTier?: 'free' | 'pro' | 'premium';
  onboardingCompleted?: boolean;
  firstLoginDate?: string;
  lastActiveDate?: string;
}

export interface ScreenViewEvent {
  screenName: string;
  screenClass?: string;
  properties?: Record<string, any>;
}

export interface FoodLoggingEvent {
  method: 'photo' | 'search' | 'manual';
  success: boolean;
  processingTime?: number;
  confidence?: number;
  fallbackUsed?: boolean;
  errorType?: string;
}

export interface SubscriptionEvent {
  action:
    | 'view_paywall'
    | 'start_purchase'
    | 'complete_purchase'
    | 'cancel_subscription'
    | 'restore_purchase';
  productId?: string;
  price?: number;
  currency?: string;
  success?: boolean;
  errorType?: string;
}

export interface FeedbackEvent {
  action:
    | 'view_feedback'
    | 'generate_feedback'
    | 'rate_feedback'
    | 'share_feedback';
  feedbackId?: string;
  rating?: number;
  mood?: string;
}

export class AnalyticsService {
  private static sessionId: string = '';
  private static isInitialized: boolean = false;
  private static eventQueue: AnalyticsEvent[] = [];
  private static flushInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize analytics service
   */
  static async initialize(): Promise<void> {
    try {
      this.sessionId = this.generateSessionId();
      this.isInitialized = true;

      // Set up periodic event flushing
      this.flushInterval = setInterval(() => {
        this.flushEvents();
      }, 30000); // Flush every 30 seconds

      // Track app launch
      this.track('app_launch', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });

      console.log('[Analytics] Service initialized');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  /**
   * Track a custom event
   */
  static track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('[Analytics] Service not initialized');
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
      },
    };

    this.eventQueue.push(event);

    // Flush immediately for important events
    if (this.isImportantEvent(eventName)) {
      this.flushEvents();
    }
  }

  /**
   * Track screen view
   */
  static trackScreenView(
    screenName: string,
    properties?: Record<string, any>
  ): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track food logging events
   */
  static trackFoodLogging(event: FoodLoggingEvent): void {
    this.track('food_logging', {
      method: event.method,
      success: event.success,
      processing_time: event.processingTime,
      confidence: event.confidence,
      fallback_used: event.fallbackUsed,
      error_type: event.errorType,
    });
  }

  /**
   * Track subscription events
   */
  static trackSubscription(event: SubscriptionEvent): void {
    this.track('subscription', {
      action: event.action,
      product_id: event.productId,
      price: event.price,
      currency: event.currency,
      success: event.success,
      error_type: event.errorType,
    });
  }

  /**
   * Track feedback events
   */
  static trackFeedback(event: FeedbackEvent): void {
    this.track('feedback', {
      action: event.action,
      feedback_id: event.feedbackId,
      rating: event.rating,
      mood: event.mood,
    });
  }

  /**
   * Set user properties
   */
  static async setUserProperties(properties: UserProperties): Promise<void> {
    try {
      await http.post('/analytics/user-properties', properties);
      this.track('user_properties_set', properties);
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
    }
  }

  /**
   * Track user engagement
   */
  static trackEngagement(action: string, duration?: number): void {
    this.track('user_engagement', {
      action,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track app performance
   */
  static trackPerformance(
    metric: string,
    value: number,
    unit: string = 'ms'
  ): void {
    this.track('performance', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track errors
   */
  static trackError(error: Error, context?: string): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsage(
    feature: string,
    action: string,
    properties?: Record<string, any>
  ): void {
    this.track('feature_usage', {
      feature,
      action,
      ...properties,
    });
  }

  /**
   * Track conversion events
   */
  static trackConversion(
    event: string,
    value?: number,
    currency?: string
  ): void {
    this.track('conversion', {
      event,
      value,
      currency,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Flush queued events to server
   */
  private static async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      await http.post('/analytics/events', {
        events,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });

      console.log(`[Analytics] Flushed ${events.length} events`);
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  /**
   * Check if event should be flushed immediately
   */
  private static isImportantEvent(eventName: string): boolean {
    const importantEvents = [
      'app_launch',
      'subscription',
      'conversion',
      'error',
      'food_logging',
      'feedback',
    ];

    return importantEvents.includes(eventName);
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup analytics service
   */
  static cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush remaining events
    this.flushEvents();

    this.isInitialized = false;
    console.log('[Analytics] Service cleaned up');
  }

  /**
   * Track funnel events for conversion analysis
   */
  static trackFunnelEvent(
    step:
      | 'install'
      | 'onboarding_start'
      | 'onboarding_complete'
      | 'first_log'
      | 'trial_start'
      | 'purchase'
      | 'feedback_viewed',
    properties?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      name: 'funnel_step',
      properties: {
        step,
        ...properties,
      },
    };

    this.track(event.name, event.properties);
  }

  /**
   * Track onboarding step completion
   */
  static trackOnboardingStep(
    step: string,
    completed: boolean,
    timeSpent?: number
  ): void {
    const event: AnalyticsEvent = {
      name: 'onboarding_step',
      properties: {
        step,
        completed,
        timeSpent,
      },
    };

    this.track(event.name, event.properties);
  }

  /**
   * Track paywall view
   */
  static trackPaywallView(source: string, tier?: string): void {
    const event: AnalyticsEvent = {
      name: 'paywall_viewed',
      properties: {
        source,
        tier,
      },
    };

    this.track(event.name, event.properties);
  }

  /**
   * Track meal log creation
   */
  static trackMealLogCreated(
    method: 'photo' | 'search' | 'manual',
    success: boolean,
    processingTime?: number
  ): void {
    const event: AnalyticsEvent = {
      name: 'meal_log_created',
      properties: {
        method,
        success,
        processingTime,
      },
    };

    this.track(event.name, event.properties);
  }

  /**
   * Track feedback view
   */
  static trackFeedbackViewed(
    feedbackType: 'daily' | 'weekly' | 'insights',
    source: string
  ): void {
    const event: AnalyticsEvent = {
      name: 'feedback_viewed',
      properties: {
        feedbackType,
        source,
      },
    };

    this.track(event.name, event.properties);
  }

  /**
   * Track notification interaction
   */
  static trackNotificationOpened(
    notificationType: string,
    action: string
  ): void {
    const event: AnalyticsEvent = {
      name: 'notification_opened',
      properties: {
        notificationType,
        action,
      },
    };

    this.track(event.name, event.properties);
  }
}

// Hook for easy analytics integration
export const useAnalytics = () => {
  const { user } = useAuthStore();

  const track = (eventName: string, properties?: Record<string, any>) => {
    AnalyticsService.track(eventName, {
      ...properties,
      userId: user?.id,
    });
  };

  const trackScreenView = (
    screenName: string,
    properties?: Record<string, any>
  ) => {
    AnalyticsService.trackScreenView(screenName, {
      ...properties,
      userId: user?.id,
    });
  };

  const trackFoodLogging = (event: FoodLoggingEvent) => {
    AnalyticsService.trackFoodLogging(event);
  };

  const trackSubscription = (event: SubscriptionEvent) => {
    AnalyticsService.trackSubscription(event);
  };

  const trackFeedback = (event: FeedbackEvent) => {
    AnalyticsService.trackFeedback(event);
  };

  const trackError = (error: Error, context?: string) => {
    AnalyticsService.trackError(error, context);
  };

  const trackFeatureUsage = (
    feature: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    AnalyticsService.trackFeatureUsage(feature, action, {
      ...properties,
      userId: user?.id,
    });
  };

  return {
    track,
    trackScreenView,
    trackFoodLogging,
    trackSubscription,
    trackFeedback,
    trackError,
    trackFeatureUsage,
  };
};
