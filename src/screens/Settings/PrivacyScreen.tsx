import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers/ThemeProvider';

export const PrivacyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.brand.primary,
              fontWeight: '600',
            }}
          >
            ← Back
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 24,
          }}
        >
          Privacy Policy
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            lineHeight: 22,
            marginBottom: 16,
          }}
        >
          Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 24,
          }}
        >
          FIIT ("we," "our," or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use our mobile application.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Information We Collect
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          We collect information you provide directly to us, including:
          {'\n\n'}• Personal information (age, sex, height, weight goals)
          {'\n'}• Meal logs and photos you upload
          {'\n'}• Weight tracking data
          {'\n'}• Diet preferences and allergies
          {'\n'}• Usage data and analytics
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          How We Use Your Information
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          We use your information to:
          {'\n\n'}• Provide personalized meal plans and nutrition coaching
          {'\n'}• Analyze food photos for calorie tracking
          {'\n'}• Generate AI-powered feedback and recommendations
          {'\n'}• Track your progress toward weight goals
          {'\n'}• Send you notifications and reminders
          {'\n'}• Improve our services and app features
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Data Security
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          We implement appropriate security measures to protect your personal
          information. Your data is stored locally on your device and
          transmitted securely when using AI features.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Third-Party Services
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          We use third-party services for:
          {'\n\n'}• OpenAI for AI meal planning and feedback
          {'\n'}• Nutritionix for food database and recognition
          {'\n'}• RevenueCat for subscription management
          {'\n'}• Analytics providers for app improvement
          {'\n\n'}
          These providers have their own privacy policies governing their use of
          your information.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Your Rights
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          You have the right to:
          {'\n\n'}• Access your personal data
          {'\n'}• Delete your data at any time
          {'\n'}• Opt out of notifications
          {'\n'}• Export your meal and weight data
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Contact Us
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 32,
          }}
        >
          If you have questions about this Privacy Policy, please contact us at:
          {'\n\n'}support@fiit.app
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
