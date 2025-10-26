import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { NotificationService } from '@/services/notifications';
import { RootStackNavigationProp } from '@/utils/navigation';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  const handleAllowNotifications = async () => {
    try {
      setIsLoading(true);
      const result = await NotificationService.requestPermissions();

      if (result) {
        // Schedule daily reminder
        await NotificationService.scheduleDailyReminder(9, 0); // 9 AM
        navigation.navigate('Auth');
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in Settings to get daily reminders and stay motivated!',
          [{ text: 'Continue', onPress: () => navigation.navigate('Auth') }]
        );
      }
    } catch (error) {
      console.error('Failed to request notifications:', error);
      navigation.navigate('Auth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipNotifications = () => {
    navigation.navigate('Auth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Keep your glow streak alive</Text>
          <Text style={styles.subtitle}>
            Get daily reminders to complete your tasks and build momentum
          </Text>
        </View>

        {/* Notification Icon */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          <Text style={styles.iconDescription}>
            We'll send you gentle reminders to help you stay on track
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What you'll get:</Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>Daily task reminders</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>Streak maintenance alerts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>Motivational messages</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>Progress updates</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            title="Allow Notifications"
            onPress={handleAllowNotifications}
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            accessibilityLabel="Allow notifications"
            accessibilityHint="Enables push notifications for daily reminders"
          />

          <Button
            title="Not now"
            onPress={handleSkipNotifications}
            variant="ghost"
            size="large"
            fullWidth
            disabled={isLoading}
            accessibilityLabel="Skip notifications for now"
            accessibilityHint="Continues without enabling notifications"
          />
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            Notifications help you stay motivated and build consistent habits.
            You can change this setting anytime in your device settings.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#f3f4f6',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  iconDescription: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    color: '#10b981',
    marginRight: 12,
    fontSize: 16,
  },
  benefitText: {
    color: '#374151',
    fontSize: 16,
  },
  buttonSection: {
    gap: 16,
  },
  privacyNotice: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9ca3af',
    lineHeight: 16,
  },
});
