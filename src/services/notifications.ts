// Notifications service for scheduling and managing local notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { http } from './http';
import { AnalyticsService } from './analytics';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  morningReminder: boolean;
  lunchReminder: boolean;
  eveningFeedback: boolean;
  weeklyCheckIn: boolean;
  morningTime: string; // HH:MM format
  lunchTime: string; // HH:MM format
  eveningTime: string; // HH:MM format
  weeklyDay: number; // 0 = Sunday, 1 = Monday, etc.
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  trigger: Notifications.NotificationTriggerInput;
}

export class NotificationService {
  private static isInitialized: boolean = false;
  private static notificationSettings: NotificationSettings = {
    morningReminder: true,
    lunchReminder: true,
    eveningFeedback: true,
    weeklyCheckIn: true,
    morningTime: '08:00',
    lunchTime: '12:00',
    eveningTime: '19:00',
    weeklyDay: 0, // Sunday
  };

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      if (!Device.isDevice) {
        console.log(
          '[Notifications] Must use physical device for push notifications'
        );
        return;
      }

      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('[Notifications] Push token:', token.data);

      // Configure notification categories
      await this.configureNotificationCategories();

      this.isInitialized = true;
      console.log('[Notifications] Service initialized');
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
    }
  }

  /**
   * Configure notification categories for actions
   */
  private static async configureNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('meal_reminder', [
      {
        identifier: 'log_meal',
        buttonTitle: 'Log Meal',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Remind Later',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('feedback_reminder', [
      {
        identifier: 'view_feedback',
        buttonTitle: 'View Feedback',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);
  }

  /**
   * Schedule all recurring notifications
   */
  static async scheduleRecurringNotifications(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('[Notifications] Service not initialized');
      return;
    }

    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      // Schedule morning reminder
      if (this.notificationSettings.morningReminder) {
        await this.scheduleMorningReminder();
      }

      // Schedule lunch reminder
      if (this.notificationSettings.lunchReminder) {
        await this.scheduleLunchReminder();
      }

      // Schedule evening feedback
      if (this.notificationSettings.eveningFeedback) {
        await this.scheduleEveningFeedback();
      }

      // Schedule weekly check-in
      if (this.notificationSettings.weeklyCheckIn) {
        await this.scheduleWeeklyCheckIn();
      }

      console.log('[Notifications] All recurring notifications scheduled');
    } catch (error) {
      console.error('[Notifications] Failed to schedule notifications:', error);
    }
  }

  /**
   * Schedule morning meal planning reminder
   */
  private static async scheduleMorningReminder(): Promise<void> {
    const [hours, minutes] = this.notificationSettings.morningTime
      .split(':')
      .map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good morning! 🌅',
        body: 'Plan your meals for today to stay on track with your goals.',
        categoryIdentifier: 'meal_reminder',
        data: {
          type: 'morning_reminder',
          action: 'plan_meal',
        },
      },
      trigger: {
        type: 'calendar' as any,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Schedule lunch reminder
   */
  private static async scheduleLunchReminder(): Promise<void> {
    const [hours, minutes] = this.notificationSettings.lunchTime
      .split(':')
      .map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lunch time! 🍽️',
        body: "Don't forget to log your lunch to track your daily nutrition.",
        categoryIdentifier: 'meal_reminder',
        data: {
          type: 'lunch_reminder',
          action: 'log_meal',
        },
      },
      trigger: {
        type: 'calendar' as any,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Schedule evening feedback reminder
   */
  private static async scheduleEveningFeedback(): Promise<void> {
    const [hours, minutes] = this.notificationSettings.eveningTime
      .split(':')
      .map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Evening check-in 🌙',
        body: 'Review your daily progress and get personalized tips for tomorrow.',
        categoryIdentifier: 'feedback_reminder',
        data: {
          type: 'evening_feedback',
          action: 'view_feedback',
        },
      },
      trigger: {
        type: 'calendar' as any,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  /**
   * Schedule weekly check-in
   */
  private static async scheduleWeeklyCheckIn(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly progress check 📊',
        body: "See how you're doing this week and get tips for next week.",
        categoryIdentifier: 'feedback_reminder',
        data: {
          type: 'weekly_checkin',
          action: 'view_feedback',
        },
      },
      trigger: {
        type: 'calendar' as any,
        weekday: this.notificationSettings.weeklyDay + 1, // Expo uses 1-7
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }

  /**
   * Schedule immediate notification
   */
  static async scheduleImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    if (!this.isInitialized) {
      console.warn('[Notifications] Service not initialized');
      return '';
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Immediate
      });

      return notificationId;
    } catch (error) {
      console.error(
        '[Notifications] Failed to schedule immediate notification:',
        error
      );
      return '';
    }
  }

  /**
   * Schedule delayed notification
   */
  static async scheduleDelayedNotification(
    title: string,
    body: string,
    delaySeconds: number,
    data?: Record<string, any>
  ): Promise<string> {
    if (!this.isInitialized) {
      console.warn('[Notifications] Service not initialized');
      return '';
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: {
          type: 'timeInterval' as any,
          seconds: delaySeconds,
        },
      });

      return notificationId;
    } catch (error) {
      console.error(
        '[Notifications] Failed to schedule delayed notification:',
        error
      );
      return '';
    }
  }

  /**
   * Cancel specific notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('[Notifications] Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error(
        '[Notifications] Failed to cancel all notifications:',
        error
      );
    }
  }

  /**
   * Get notification settings
   */
  static getNotificationSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    this.notificationSettings = { ...this.notificationSettings, ...settings };

    // Reschedule notifications with new settings
    await this.scheduleRecurringNotifications();

    // Track settings change
    AnalyticsService.track('notification_settings_updated', settings);
  }

  /**
   * Handle notification response
   */
  static handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;

    console.log('[Notifications] Notification response:', {
      actionIdentifier,
      data,
    });

    // Track notification interaction
    AnalyticsService.track('notification_interaction', {
      action: actionIdentifier,
      notification_type: data?.type,
      notification_action: data?.action,
    });

    // Handle specific actions
    if (actionIdentifier === 'log_meal') {
      // Navigate to meal logging screen
      // This would be handled by the navigation system
    } else if (actionIdentifier === 'view_feedback') {
      // Navigate to feedback screen
      // This would be handled by the navigation system
    } else if (actionIdentifier === 'snooze') {
      // Schedule reminder for later
      this.scheduleDelayedNotification(
        notification.request.content.title || 'Reminder',
        notification.request.content.body || "Don't forget to log your meal!",
        30 * 60, // 30 minutes
        data
      );
    }
  }

  /**
   * Get scheduled notifications
   */
  static async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error(
        '[Notifications] Failed to get scheduled notifications:',
        error
      );
      return [];
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[Notifications] Failed to check permissions:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[Notifications] Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Schedule daily reminder
   */
  static async scheduleDailyReminder(
    hour: number,
    minute: number
  ): Promise<string> {
    const trigger = {
      hour,
      minute,
      repeats: true,
      type: 'calendar' as any,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good morning! 🌅',
        body: 'Ready to start your day with FIIT? Check your meal plan and log your breakfast.',
        data: { screen: 'Home' },
      },
      trigger,
    });
  }

  /**
   * Send test notification
   */
  static async sendTestNotification(): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from FIIT',
        data: { test: true },
      },
      trigger: null,
    });
  }

  /**
   * Schedule all FIIT reminders
   */
  static async scheduleAllFIITReminders(): Promise<boolean> {
    try {
      // Schedule morning reminder
      await this.scheduleDailyReminder(9, 0);

      // Schedule lunch reminder
      await this.scheduleDailyReminder(12, 0);

      // Schedule evening feedback
      await this.scheduleDailyReminder(19, 0);

      return true;
    } catch (error) {
      console.error('[Notifications] Failed to schedule reminders:', error);
      return false;
    }
  }
}

// Hook for easy notification integration
export const useNotifications = () => {
  const scheduleImmediate = (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    return NotificationService.scheduleImmediateNotification(title, body, data);
  };

  const scheduleDelayed = (
    title: string,
    body: string,
    delaySeconds: number,
    data?: Record<string, any>
  ) => {
    return NotificationService.scheduleDelayedNotification(
      title,
      body,
      delaySeconds,
      data
    );
  };

  const scheduleDailyReminder = async (hour: number, minute: number) => {
    const trigger = {
      hour,
      minute,
      repeats: true,
      type: 'calendar' as any,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good morning! 🌅',
        body: 'Ready to start your day with FIIT? Check your meal plan and log your breakfast.',
        data: { screen: 'Home' },
      },
      trigger,
    });
  };

  const sendTestNotification = async () => {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from FIIT',
        data: { test: true },
      },
      trigger: null,
    });
  };

  const scheduleAllFIITReminders = async () => {
    // Schedule morning reminder
    await scheduleDailyReminder(9, 0);

    // Schedule lunch reminder
    await scheduleDailyReminder(12, 0);

    // Schedule evening feedback
    await scheduleDailyReminder(19, 0);

    return true;
  };

  const cancelNotification = (notificationId: string) => {
    return NotificationService.cancelNotification(notificationId);
  };

  const updateSettings = (settings: Partial<NotificationSettings>) => {
    return NotificationService.updateNotificationSettings(settings);
  };

  const getSettings = () => {
    return NotificationService.getNotificationSettings();
  };

  return {
    scheduleImmediate,
    scheduleDelayed,
    cancelNotification,
    updateSettings,
    getSettings,
    scheduleDailyReminder,
    sendTestNotification,
    scheduleAllFIITReminders,
  };
};
