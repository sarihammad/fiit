import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers/ThemeProvider';
import { usePaywallStore } from '@/state/paywall.store';
import { useNutritionStore } from '@/state/nutrition.store';
import { useWeightStore } from '@/state/weight.store';
import { useMealPlanStore } from '@/state/mealplan.store';
import { useFeedbackStore } from '@/state/feedback.store';
import { useUserGoalsStore } from '@/state/userGoals.store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Toast } from '@/utils/toast';
import { NotificationService } from '@/services/notifications';

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isPro, restore } = usePaywallStore();
  const nutritionStore = useNutritionStore();
  const weightStore = useWeightStore();
  const mealPlanStore = useMealPlanStore();
  const feedbackStore = useFeedbackStore();
  const goalsStore = useUserGoalsStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const enabled = await NotificationService.areNotificationsEnabled();
    setNotificationsEnabled(enabled);
  };

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
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      await NotificationService.cancelAllNotifications();
      Toast.info('Notifications disabled');
      setNotificationsEnabled(false);
    } else {
      const result = await NotificationService.requestPermissions();
      if (result) {
        await NotificationService.scheduleAllFIITReminders();
        Toast.success('Notifications enabled!');
        setNotificationsEnabled(true);
      } else {
        Toast.error('Permission denied. Enable in device settings.');
      }
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your meals, weight entries, and plans. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            nutritionStore.reset();
            weightStore.reset();
            mealPlanStore.reset();
            feedbackStore.reset();
            goalsStore.reset();
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
          Settings
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
              {isPro ? '✓ Pro Member' : 'Free Trial'}
            </Text>
          </View>

          {!isPro && (
            <Button
              title="Upgrade to Pro"
              onPress={() => (navigation as any).navigate('Paywall')}
              variant="primary"
              style={{ marginBottom: 12 }}
            />
          )}

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
                ? '7:30am, 12:15pm, 8pm daily + weekly weigh-in'
                : 'Enable to get meal reminders and daily check-ins'}
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
              Privacy Policy
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
              Terms of Service
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
            title="Clear All Data"
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
            FIIT provides general nutrition coaching, not medical advice.
            {'\n'}
            Consult a healthcare professional for medical conditions.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
