import { http } from './http';

// Analytics event types
export const Events = {
  // Onboarding events
  OnboardingStep: 'onboarding_step',
  OnboardingComplete: 'onboarding_complete',
  
  // Paywall events
  PaywallViewed: 'paywall_viewed',
  PaywallDismissed: 'paywall_dismissed',
  
  // Purchase events
  PurchaseInitiated: 'purchase_initiated',
  PurchaseCompleted: 'purchase_completed',
  PurchaseFailed: 'purchase_failed',
  PurchaseRestored: 'purchase_restored',
  
  // Meal logging events
  MealLogStarted: 'meal_log_started',
  MealLogCompleted: 'meal_log_completed',
  MealLogFailed: 'meal_log_failed',
  PhotoAnalyzed: 'photo_analyzed',
  
  // Feedback events
  FeedbackViewed: 'feedback_viewed',
  FeedbackGenerated: 'feedback_generated',
  
  // Notification events
  NotificationReceived: 'notification_received',
  NotificationOpened: 'notification_opened',
  NotificationDismissed: 'notification_dismissed',
  
  // App lifecycle events
  AppOpened: 'app_opened',
  AppBackgrounded: 'app_backgrounded',
  AppForegrounded: 'app_foregrounded',
  
  // Feature usage events
  FeatureUsed: 'feature_used',
  ScreenViewed: 'screen_viewed',
  
  // Error events
  ErrorOccurred: 'error_occurred',
  CrashOccurred: 'crash_occurred',
} as const;

// Analytics payload type
export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

// Analytics service class
export class AnalyticsService {
  private static enabled = true;
  private static userId: string | null = null;
  private static sessionId: string | null = null;

  /**
   * Initialize analytics service
   */
  static initialize(userId?: string): void {
    this.userId = userId || null;
    this.sessionId = this.generateSessionId();
    
    // Track app opened
    this.track(Events.AppOpened, {
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user ID for analytics
   */
  static setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Enable or disable analytics
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Track an analytics event
   */
  static track(event: string, properties: AnalyticsPayload = {}): void {
    if (!this.enabled) {
      return;
    }

    try {
      const payload = {
        event,
        properties: {
          ...properties,
          user_id: this.userId,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
          platform: 'mobile',
          app_version: '1.0.0', // This should come from app config
        },
      };

      // Log to console in development
      if (__DEV__) {
        console.log('[Analytics]', event, properties);
      }

      // Send to analytics service (replace with actual implementation)
      this.sendToAnalytics(payload);
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
    }
  }

  /**
   * Track onboarding step completion
   */
  static trackOnboardingStep(
    step: string,
    completed: boolean,
    timeSpent?: number
  ): void {
    this.track(Events.OnboardingStep, {
      step,
      completed,
      time_spent: timeSpent,
    });
  }

  /**
   * Track onboarding completion
   */
  static trackOnboardingComplete(timeSpent: number): void {
    this.track(Events.OnboardingComplete, {
      time_spent: timeSpent,
    });
  }

  /**
   * Track paywall view
   */
  static trackPaywallView(source: string, tier?: string): void {
    this.track(Events.PaywallViewed, {
      source,
      tier,
    });
  }

  /**
   * Track paywall dismissal
   */
  static trackPaywallDismissed(source: string, reason?: string): void {
    this.track(Events.PaywallDismissed, {
      source,
      reason,
    });
  }

  /**
   * Track purchase initiation
   */
  static trackPurchaseInitiated(
    productId: string,
    price: number,
    currency: string
  ): void {
    this.track(Events.PurchaseInitiated, {
      product_id: productId,
      price,
      currency,
    });
  }

  /**
   * Track purchase completion
   */
  static trackPurchaseCompleted(
    productId: string,
    price: number,
    currency: string,
    revenue: number
  ): void {
    this.track(Events.PurchaseCompleted, {
      product_id: productId,
      price,
      currency,
      revenue,
    });
  }

  /**
   * Track purchase failure
   */
  static trackPurchaseFailed(
    productId: string,
    error: string,
    price?: number
  ): void {
    this.track(Events.PurchaseFailed, {
      product_id: productId,
      error,
      price,
    });
  }

  /**
   * Track purchase restoration
   */
  static trackPurchaseRestored(productId: string): void {
    this.track(Events.PurchaseRestored, {
      product_id: productId,
    });
  }

  /**
   * Track meal logging start
   */
  static trackMealLogStarted(method: 'camera' | 'search' | 'manual'): void {
    this.track(Events.MealLogStarted, {
      method,
    });
  }

  /**
   * Track meal logging completion
   */
  static trackMealLogCompleted(
    method: 'camera' | 'search' | 'manual',
    success: boolean,
    processingTime?: number
  ): void {
    this.track(Events.MealLogCompleted, {
      method,
      success,
      processing_time: processingTime,
    });
  }

  /**
   * Track meal logging failure
   */
  static trackMealLogFailed(
    method: 'camera' | 'search' | 'manual',
    error: string
  ): void {
    this.track(Events.MealLogFailed, {
      method,
      error,
    });
  }

  /**
   * Track photo analysis
   */
  static trackPhotoAnalyzed(
    success: boolean,
    processingTime: number,
    confidence?: number
  ): void {
    this.track(Events.PhotoAnalyzed, {
      success,
      processing_time: processingTime,
      confidence,
    });
  }

  /**
   * Track feedback view
   */
  static trackFeedbackViewed(
    feedbackType: 'daily' | 'weekly' | 'insights',
    source: string
  ): void {
    this.track(Events.FeedbackViewed, {
      feedback_type: feedbackType,
      source,
    });
  }

  /**
   * Track feedback generation
   */
  static trackFeedbackGenerated(
    feedbackType: 'daily' | 'weekly' | 'insights',
    success: boolean,
    processingTime?: number
  ): void {
    this.track(Events.FeedbackGenerated, {
      feedback_type: feedbackType,
      success,
      processing_time: processingTime,
    });
  }

  /**
   * Track notification received
   */
  static trackNotificationReceived(notificationType: string): void {
    this.track(Events.NotificationReceived, {
      notification_type: notificationType,
    });
  }

  /**
   * Track notification opened
   */
  static trackNotificationOpened(
    notificationType: string,
    action: string
  ): void {
    this.track(Events.NotificationOpened, {
      notification_type: notificationType,
      action,
    });
  }

  /**
   * Track notification dismissed
   */
  static trackNotificationDismissed(notificationType: string): void {
    this.track(Events.NotificationDismissed, {
      notification_type: notificationType,
    });
  }

  /**
   * Track screen view
   */
  static trackScreenView(screenName: string, properties?: AnalyticsPayload): void {
    this.track(Events.ScreenViewed, {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsed(
    featureName: string,
    properties?: AnalyticsPayload
  ): void {
    this.track(Events.FeatureUsed, {
      feature_name: featureName,
      ...properties,
    });
  }

  /**
   * Track error occurrence
   */
  static trackError(
    error: string,
    errorType: string,
    properties?: AnalyticsPayload
  ): void {
    this.track(Events.ErrorOccurred, {
      error,
      error_type: errorType,
      ...properties,
    });
  }

  /**
   * Track crash occurrence
   */
  static trackCrash(
    error: string,
    stackTrace?: string,
    properties?: AnalyticsPayload
  ): void {
    this.track(Events.CrashOccurred, {
      error,
      stack_trace: stackTrace,
      ...properties,
    });
  }

  /**
   * Track funnel events for conversion analysis
   */
  static trackFunnelEvent(
    step: 'install' | 'onboarding_start' | 'onboarding_complete' | 'first_log' | 'trial_start' | 'purchase' | 'feedback_viewed',
    properties?: AnalyticsPayload
  ): void {
    this.track('funnel_step', {
      step,
      ...properties,
    });
  }

  /**
   * Send analytics data to service
   */
  private static async sendToAnalytics(payload: any): Promise<void> {
    try {
      // This would integrate with your analytics service (Amplitude, Mixpanel, etc.)
      // For now, we'll just log it
      console.log('[Analytics] Sending:', payload);
      
      // Example integration with a backend analytics endpoint
      // await http.post('/analytics/track', payload);
    } catch (error) {
      console.error('[Analytics] Failed to send to service:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  static getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get current user ID
   */
  static getUserId(): string | null {
    return this.userId;
  }
}