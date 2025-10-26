import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Linking } from 'react-native';

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
    LUNCH_REMINDER: 'lunch_reminder',
    EVENING_FEEDBACK: 'evening_feedback',
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
        body: 'Plan your meals for today and start your day right',
        hour: 7,
        minute: 30,
        deepLink: 'fiit://planner',
      });

      // Schedule lunch reminder (12:30 PM)
      await this.scheduleNotification({
        identifier: this.NOTIFICATION_IDS.LUNCH_REMINDER,
        title: 'Lunch time! 🍽️',
        body: 'Don\'t forget to log your lunch and stay on track',
        hour: 12,
        minute: 30,
        deepLink: 'fiit://camera',
      });

      // Schedule evening feedback (8:00 PM)
      await this.scheduleNotification({
        identifier: this.NOTIFICATION_IDS.EVENING_FEEDBACK,
        title: 'Evening check-in 🌙',
        body: 'Review your progress and get tomorrow\'s tips',
        hour: 20,
        minute: 0,
        deepLink: 'fiit://feedback',
      });

      console.log('[Notifications] Daily reminders scheduled');
    } catch (error) {
      console.error('[Notifications] Failed to schedule reminders:', error);
    }
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
          hour,
          minute,
          repeats: true,
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
    data?: any;
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
          case 'planner':
            // Navigate to meal planner
            console.log('[Notifications] Navigate to planner');
            break;
          case 'camera':
            // Navigate to camera
            console.log('[Notifications] Navigate to camera');
            break;
          case 'feedback':
            // Navigate to feedback
            console.log('[Notifications] Navigate to feedback');
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
   * Send meal logging reminder
   */
  static async sendMealReminder(mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<void> {
    const messages = {
      breakfast: {
        title: 'Breakfast time! 🥞',
        body: 'Start your day with a nutritious breakfast',
      },
      lunch: {
        title: 'Lunch time! 🍽️',
        body: 'Don\'t forget to log your lunch',
      },
      dinner: {
        title: 'Dinner time! 🍽️',
        body: 'End your day with a healthy dinner',
      },
    };

    const message = messages[mealType];
    await this.sendImmediateNotification({
      title: message.title,
      body: message.body,
      data: { deepLink: 'fiit://camera' },
    });
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(achievement: string): Promise<void> {
    await this.sendImmediateNotification({
      title: 'Achievement Unlocked! 🏆',
      body: achievement,
      data: { deepLink: 'fiit://achievements' },
    });
  }

  /**
   * Send streak reminder
   */
  static async sendStreakReminder(streak: number): Promise<void> {
    await this.sendImmediateNotification({
      title: `${streak} Day Streak! 🔥`,
      body: 'Keep it up! You\'re building a healthy habit.',
      data: { deepLink: 'fiit://progress' },
    });
  }

  /**
   * Send weight logging reminder
   */
  static async sendWeightReminder(): Promise<void> {
    await this.sendImmediateNotification({
      title: 'Weight Check-in 📊',
      body: 'Time to log your weight and track your progress',
      data: { deepLink: 'fiit://weight' },
    });
  }
}