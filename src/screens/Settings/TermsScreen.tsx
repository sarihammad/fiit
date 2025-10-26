import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers/ThemeProvider';

export const TermsScreen: React.FC = () => {
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
          Terms of Service
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
          Please read these Terms of Service ("Terms") carefully before using
          the FIIT mobile application.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Acceptance of Terms
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          By accessing and using FIIT, you accept and agree to be bound by these
          Terms. If you do not agree to these Terms, do not use the app.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Medical Disclaimer
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          FIIT provides general nutrition coaching and is not a substitute for
          professional medical advice, diagnosis, or treatment. Always seek the
          advice of your physician or other qualified health provider with any
          questions you may have regarding a medical condition.
          {'\n\n'}
          FIIT is not intended to diagnose, treat, cure, or prevent any disease.
          Individual results may vary. The "Lose 7 lbs in 30 days" promise is
          based on typical results when following the program consistently.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Age Requirement
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          You must be at least 18 years old to use FIIT. By using the app, you
          represent and warrant that you are 18 years of age or older.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Subscription Terms
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          FIIT offers subscriptions with a 7-day free trial:
          {'\n\n'}• Weekly: $9/week
          {'\n'}• Yearly: $79/year (best value)
          {'\n'}• Premium: $199/year
          {'\n\n'}
          Your subscription will automatically renew unless cancelled at least
          24 hours before the end of the current period. You can manage your
          subscription in your device's app store settings.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Refund Policy
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          All purchases are final. You may cancel your subscription at any time
          to prevent future charges, but refunds are not provided for the
          current subscription period. Refund requests are handled through the
          App Store or Google Play Store.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          User Conduct
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          You agree not to:
          {'\n\n'}• Use the app for any illegal purpose
          {'\n'}• Attempt to reverse engineer the app
          {'\n'}• Share your account with others
          {'\n'}• Upload harmful or inappropriate content
          {'\n'}• Abuse or overload our services
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Intellectual Property
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          All content, features, and functionality of FIIT are owned by us and
          are protected by international copyright, trademark, and other
          intellectual property laws.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Limitation of Liability
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          FIIT is provided "as is" without warranties of any kind. We are not
          liable for any damages arising from your use of the app, including but
          not limited to weight loss results, health outcomes, or technical
          issues.
        </Text>

        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          Changes to Terms
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.primary,
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          We reserve the right to modify these Terms at any time. Continued use
          of the app after changes constitutes acceptance of the new Terms.
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
          If you have questions about these Terms, please contact us at:
          {'\n\n'}support@fiit.app
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
