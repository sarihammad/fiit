import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static readonly NOTIFICATION_IDS = {
    MORNING_PLANNER: 'morning_planner',
    MIDDAY_CHECKIN: 'midday_checkin',
    EVENING_REVIEW: 'evening_review',
    DAILY_REMINDER: 'daily_reminder',
  };

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[Notifications] Permission not granted');
        return;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('[Notifications] Service initialized successfully');
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
    }
  }

  /**
   * Schedule daily reminders
   */
  static async scheduleDailyReminders(): Promise<void> {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      // Schedule morning planner (7:30 AM)
      await this.scheduleNotification({
        identifier: this.NOTIFICATION_IDS.MORNING_PLANNER,
        title: 'Good morning! 🌅',
        body: 'Open Today Mode and pick your first win',
        hour: 7,
        minute: 30,
        deepLink: 'fiit://today',
      });

      // Schedule midday check-in (12:30 PM)
      await this.scheduleNotification({
        identifier: this.NOTIFICATION_IDS.MIDDAY_CHECKIN,
        title: 'Midday check-in ☀️',
        body: 'One task done is momentum. What’s next?',
        hour: 12,
        minute: 30,
        deepLink: 'fiit://today',
      });

      // Schedule evening review (8:00 PM)
      await this.scheduleNotification({
        identifier: this.NOTIFICATION_IDS.EVENING_REVIEW,
        title: 'Evening review 🌙',
        body: 'Close your loop and set tomorrow’s focus',
        hour: 20,
        minute: 0,
        deepLink: 'fiit://today',
      });

      console.log('[Notifications] Daily reminders scheduled');
    } catch (error) {
      console.error('[Notifications] Failed to schedule reminders:', error);
    }
  }

  static async scheduleDailyReminder(hour = 9, minute = 0): Promise<void> {
    await this.cancelAllNotifications();
    await this.scheduleNotification({
      identifier: this.NOTIFICATION_IDS.DAILY_REMINDER,
      title: 'Daily check-in ✅',
      body: 'Open Today Mode and do the next obvious thing.',
      hour,
      minute,
      deepLink: 'fiit://today',
    });
  }

  static async scheduleAllFIITReminders(): Promise<void> {
    await this.scheduleDailyReminders();
  }

  /**
   * Schedule a single notification
   */
  private static async scheduleNotification({
    identifier,
    title,
    body,
    hour,
    minute,
    deepLink,
  }: {
    identifier: string;
    title: string;
    body: string;
    hour: number;
    minute: number;
    deepLink: string;
  }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          data: { deepLink },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } catch (error) {
      console.error(`[Notifications] Failed to schedule ${identifier}:`, error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[Notifications] All notifications cancelled');
    } catch (error) {
      console.error('[Notifications] Failed to cancel notifications:', error);
    }
  }

  /**
   * Cancel specific notification
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`[Notifications] Cancelled notification: ${identifier}`);
    } catch (error) {
      console.error(`[Notifications] Failed to cancel ${identifier}:`, error);
    }
  }

  /**
   * Send immediate notification
   */
  static async sendImmediateNotification({
    title,
    body,
    data,
  }: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('[Notifications] Failed to send immediate notification:', error);
    }
  }

  static async sendTestNotification(): Promise<void> {
    await this.sendImmediateNotification({
      title: 'FIIT Test Notification',
      body: 'Your notifications are enabled.',
      data: { deepLink: 'fiit://settings' },
    });
  }

  /**
   * Handle notification response (when user taps notification)
   */
  static handleNotificationResponse(response: Notifications.NotificationResponse): void {
    try {
      const data = response.notification.request.content.data;
      const deepLink = data?.deepLink;

      if (deepLink) {
        // Handle deep linking
        this.handleDeepLink(deepLink);
      }
    } catch (error) {
      console.error('[Notifications] Failed to handle response:', error);
    }
  }

  /**
   * Handle deep link navigation
   */
  private static handleDeepLink(deepLink: string): void {
    try {
      // Parse deep link and navigate accordingly
      if (deepLink.startsWith('fiit://')) {
        const path = deepLink.replace('fiit://', '');
        
        switch (path) {
          case 'today':
            // Navigate to Today Mode
            console.log('[Notifications] Navigate to today');
            break;
          default:
            console.log(`[Notifications] Unknown deep link: ${path}`);
        }
      }
    } catch (error) {
      console.error('[Notifications] Failed to handle deep link:', error);
    }
  }

  /**
   * Get notification permissions status
   */
  static async getPermissionsStatus(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
  }> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain: canAskAgain,
      };
    } catch (error) {
      console.error('[Notifications] Failed to get permissions status:', error);
      return { granted: false, canAskAgain: false };
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

  static async areNotificationsEnabled(): Promise<boolean> {
    const status = await this.getPermissionsStatus();
    return status.granted;
  }

  /**
   * Get scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(achievement: string): Promise<void> {
    await this.sendImmediateNotification({
      title: 'Achievement Unlocked! 🏆',
      body: achievement,
      data: { deepLink: 'fiit://today' },
    });
  }

  /**
   * Send streak reminder
   */
  static async sendStreakReminder(streak: number): Promise<void> {
    await this.sendImmediateNotification({
      title: `${streak} Day Streak! 🔥`,
      body: 'Keep it up! You’re building execution momentum.',
      data: { deepLink: 'fiit://today' },
    });
  }

}
