import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { usePaywallStore } from '@/state/paywall.store';
import { useCoachStore } from '@/state/coach.store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Toast } from '@/utils/toast';
import { NotificationService } from '@/services/notifications';
import { Copy, formatCopy } from '@/copy/strings';

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { trackEvent } = useAnalytics();
  const navigation = useNavigation();
  const { isPro, restore } = usePaywallStore();
  const { resetCoach, canResetPlan } = useCoachStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const checkNotificationStatus = useCallback(async () => {
    try {
      const enabled = await NotificationService.areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('[Settings] Failed to check notification status:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkNotificationStatus();
    }, [checkNotificationStatus])
  );

  const handleRestorePurchases = async () => {
    const success = await restore();
    if (success) {
      Toast.success('Purchases restored successfully!');
    } else {
      Toast.info('No purchases found to restore.');
    }
  };

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      const result = await NotificationService.requestPermissions();
      if (!result) {
        Toast.error('Please enable notifications in settings');
        return;
      }
      setNotificationsEnabled(true);
    }

    await NotificationService.sendTestNotification();
    Toast.success('Test notification sent!');
    trackEvent('notification_opened', {
      source: 'settings',
      mode: 'test_notification',
    });
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      await NotificationService.cancelAllNotifications();
      Toast.info('Notifications disabled');
      setNotificationsEnabled(false);
      trackEvent('notification_dismissed', { source: 'settings' });
      await checkNotificationStatus();
    } else {
      const result = await NotificationService.requestPermissions();
      if (result) {
        await NotificationService.scheduleAllFIITReminders();
        Toast.success('Notifications enabled!');
        setNotificationsEnabled(true);
        trackEvent('notification_scheduled', { source: 'settings' });
        await checkNotificationStatus();
      } else {
        Toast.error('Permission denied. Enable in device settings.');
      }
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete your goals, plans, and execution history. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            resetCoach();
            Toast.success('All data cleared.');
          },
        },
      ]
    );
  };

  const handleNavigateToPrivacy = () => {
    (navigation as any).navigate('Privacy');
  };

  const handleNavigateToTerms = () => {
    (navigation as any).navigate('Terms');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: theme.colors.text.primary,
              marginBottom: 24,
            }}
          >
            {Copy.settings.title}
          </Text>

        {/* Account Section */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Account
          </Text>

          <View
            style={{
              padding: 12,
              backgroundColor: isPro
                ? theme.colors.success[50]
                : theme.colors.background.secondary,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isPro
                  ? theme.colors.success[700]
                  : theme.colors.text.secondary,
              }}
            >
              {isPro ? '✓ Pro Member' : 'Free Plan'}
            </Text>
          </View>

          {!isPro && (
            <Button
              title={Copy.settings.upgrade}
              onPress={() => (navigation as any).navigate('Upgrade')}
              variant="primary"
              style={{ marginBottom: 12 }}
            />
          )}
          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginBottom: 8,
              }}
            >
              {(() => {
                const { remaining } = canResetPlan();
                return formatCopy(Copy.settings.remainingResets, {
                  count: String(remaining),
                  plural: remaining === 1 ? '' : 's',
                });
              })()}
            </Text>
            <Button
              title={Copy.settings.resetWeek}
              onPress={() => {
                // Navigate to Plan screen where reset is handled
                (navigation as any).navigate('Plan');
              }}
              variant="secondary"
            />
          </View>

          <Button
            title="Restore Purchases"
            onPress={handleRestorePurchases}
            variant="secondary"
          />
        </Card>

        {/* Notifications Section */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Notifications
          </Text>

          <View
            style={{
              padding: 12,
              backgroundColor: notificationsEnabled
                ? theme.colors.success[50]
                : theme.colors.background.secondary,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: notificationsEnabled
                  ? theme.colors.success[700]
                  : theme.colors.text.secondary,
                marginBottom: 4,
              }}
            >
              {notificationsEnabled ? '✓ Enabled' : '✗ Disabled'}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.text.tertiary,
              }}
            >
              {notificationsEnabled
                ? 'Daily execution check-ins are active'
                : 'Enable to get a daily nudge for your plan'}
            </Text>
          </View>

          <Button
            title={
              notificationsEnabled ? 'Disable Reminders' : 'Enable Reminders'
            }
            onPress={handleToggleNotifications}
            variant="secondary"
            style={{ marginBottom: 12 }}
          />

          <Button
            title="Send Test Notification"
            onPress={handleTestNotification}
            variant="secondary"
          />
        </Card>

        {/* Preferences Section */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Preferences
          </Text>

          <TouchableOpacity
            onPress={() => Toast.info('Unit preferences coming soon!')}
            style={{
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.text.primary,
              }}
            >
              Units (Metric / Imperial)
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Legal Section */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Legal
          </Text>

          <TouchableOpacity
            onPress={() => {
              // Show disclaimer modal
              Alert.alert(
                Copy.disclaimer.title,
                Copy.disclaimer.notMedicalAdvice,
                [{ text: Copy.common.close }]
              );
            }}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.primary,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.text.primary,
              }}
            >
              {Copy.settings.disclaimer}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateToPrivacy}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border.primary,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.text.primary,
              }}
            >
              {Copy.settings.privacy}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateToTerms}
            style={{
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.text.primary,
              }}
            >
              {Copy.settings.terms}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Data Section */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Data
          </Text>

          <Button
            title={Copy.settings.dataDelete}
            onPress={handleClearData}
            variant="secondary"
          />
        </Card>

        {/* App Info */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.tertiary,
              marginBottom: 8,
            }}
          >
            FIIT v1.0.0
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text.tertiary,
              textAlign: 'center',
            }}
          >
            FIIT is a nutrition coaching tool, not medical advice.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
