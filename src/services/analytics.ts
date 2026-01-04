// Analytics service for tracking user behavior and funnel events
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  timestamp?: string;
}

export interface FunnelEvent {
  step: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
}

// Funnel events for tracking user journey
export const FunnelEvents = {
  // Execution coach funnel
  GOAL_STARTED: "goal_started",
  CLARIFICATION_ANSWERED: "clarification_answered",
  CLARIFICATION_COMPLETED: "clarification_completed",
  PLAN_PREVIEWED: "plan_previewed",
  PLAN_COMMITTED: "plan_committed",
  PLAN_RESET: "plan_reset",
  TODAY_OPENED: "today_opened",
  TASK_COMPLETED: "task_completed",
  TASK_DEFERRED: "task_deferred",
  MICROSTEP_REQUESTED: "microstep_requested",

  // Authentication funnel
  AUTH_METHOD_SELECTED: "auth_method_selected",
  AUTH_SUCCESS: "auth_success",
  AUTH_FAILED: "auth_failed",
  GUEST_ACCOUNT_CREATED: "guest_account_created",

  // Paywall funnel
  PAYWALL_VIEWED: "paywall_viewed",
  PAYWALL_PACKAGE_SELECTED: "paywall_package_selected",
  PURCHASE_INITIATED: "purchase_initiated",
  PURCHASE_COMPLETED: "purchase_completed",
  PURCHASE_FAILED: "purchase_failed",
  PURCHASE_RESTORED: "purchase_restored",

  // Notification funnel
  NOTIFICATION_RECEIVED: "notification_received",
  NOTIFICATION_OPENED: "notification_opened",
  NOTIFICATION_DISMISSED: "notification_dismissed",

  // Error tracking
  ERROR_OCCURRED: "error_occurred",
  API_ERROR: "api_error",
  NETWORK_ERROR: "network_error",
} as const;

// Analytics service class
export class AnalyticsService {
  private static instance: AnalyticsService;
  private isEnabled: boolean = true;
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Initialize analytics with user context
  public initialize(userId?: string): void {
    this.userId = userId;
    this.track("app_initialized", {
      userId: userId || "anonymous",
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  // Set user ID for tracking
  public setUserId(userId: string): void {
    this.userId = userId;
    this.track("user_identified", { userId });
  }

  // Enable/disable analytics
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Track a generic event
  public track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    this.eventQueue.push(event);
    this.logEvent(event);
  }

  // Track funnel events
  public trackFunnel(
    event: keyof typeof FunnelEvents,
    properties?: Record<string, any>,
  ): void {
    this.track(FunnelEvents[event], {
      ...properties,
      funnelStep: event,
    });
  }

  // Track onboarding events
  public trackOnboardingStep(
    step: string,
    stepNumber: number,
    totalSteps: number,
  ): void {
    this.trackFunnel("CLARIFICATION_ANSWERED", {
      step,
      stepNumber,
      totalSteps,
      progress: (stepNumber / totalSteps) * 100,
    });
  }

  // Track paywall events
  public trackPaywallView(source: string): void {
    this.trackFunnel("PAYWALL_VIEWED", {
      source,
      timestamp: new Date().toISOString(),
    });
  }

  public trackPurchase(
    packageId: string,
    price: number,
    currency: string,
  ): void {
    this.trackFunnel("PURCHASE_COMPLETED", {
      packageId,
      price,
      currency,
      revenue: price,
    });
  }

  // Track execution coach events
  public trackTaskCompleted(taskId: string): void {
    this.trackFunnel("TASK_COMPLETED", {
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  public trackTaskDeferred(taskId: string): void {
    this.trackFunnel("TASK_DEFERRED", {
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  public trackMicroStepRequested(taskId?: string): void {
    this.trackFunnel("MICROSTEP_REQUESTED", {
      taskId,
      timestamp: new Date().toISOString(),
    });
  }

  // Track notification events
  public trackNotificationReceived(notificationType: string): void {
    this.trackFunnel("NOTIFICATION_RECEIVED", {
      notificationType,
      timestamp: new Date().toISOString(),
    });
  }

  public trackNotificationOpened(
    notificationType: string,
    action?: string,
  ): void {
    this.trackFunnel("NOTIFICATION_OPENED", {
      notificationType,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // Track error events
  public trackError(error: Error, context?: string): void {
    this.trackFunnel("ERROR_OCCURRED", {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  public trackApiError(
    endpoint: string,
    statusCode: number,
    errorMessage: string,
  ): void {
    this.trackFunnel("API_ERROR", {
      endpoint,
      statusCode,
      errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  // Track screen views
  public trackScreenView(
    screenName: string,
    properties?: Record<string, any>,
  ): void {
    this.track("screen_viewed", {
      screenName,
      ...properties,
    });
  }

  // Track user actions
  public trackUserAction(
    action: string,
    target?: string,
    properties?: Record<string, any>,
  ): void {
    this.track("user_action", {
      action,
      target,
      ...properties,
    });
  }

  // Track performance metrics
  public trackPerformance(metric: string, value: number, unit: string): void {
    this.track("performance_metric", {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });
  }

  // Flush events to analytics provider
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Here you would send events to your analytics provider
      // For now, we'll just log them
      console.log("[Analytics] Flushing events:", eventsToFlush);

      // Example: Send to analytics provider
      // await this.sendToAnalyticsProvider(eventsToFlush);
    } catch (error) {
      console.error("[Analytics] Failed to flush events:", error);
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  // Start periodic flush interval
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds
  }

  // Stop flush interval
  public stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log event for debugging
  private logEvent(event: AnalyticsEvent): void {
    if (__DEV__) {
      console.log("[Analytics] Event:", event);
    }
  }

  // Get current session ID
  public getSessionId(): string {
    return this.sessionId;
  }

  // Get current user ID
  public getUserId(): string | undefined {
    return this.userId;
  }

  // Get queued events count
  public getQueuedEventsCount(): number {
    return this.eventQueue.length;
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Export convenience functions
export const track = (eventName: string, properties?: Record<string, any>) => {
  analytics.track(eventName, properties);
};

export const trackFunnel = (
  event: keyof typeof FunnelEvents,
  properties?: Record<string, any>,
) => {
  analytics.trackFunnel(event, properties);
};

export const trackScreenView = (
  screenName: string,
  properties?: Record<string, any>,
) => {
  analytics.trackScreenView(screenName, properties);
};

export const trackUserAction = (
  action: string,
  target?: string,
  properties?: Record<string, any>,
) => {
  analytics.trackUserAction(action, target, properties);
};

export const trackError = (error: Error, context?: string) => {
  analytics.trackError(error, context);
};

export const trackPerformance = (
  metric: string,
  value: number,
  unit: string,
) => {
  analytics.trackPerformance(metric, value, unit);
};

export default analytics;
