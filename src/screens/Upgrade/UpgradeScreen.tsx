import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Copy } from '@/copy/strings';

export const UpgradeScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          {Copy.upgrade.headline}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 20,
          }}
        >
          {Copy.upgrade.subheadline}
        </Text>

        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Coach Mode (Pro)
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              marginBottom: 12,
            }}
          >
            • {Copy.upgrade.features.unlimitedResets}
            {'\n'}• {Copy.upgrade.features.unlimitedMicroSteps}
            {'\n'}• {Copy.upgrade.features.weeklyReview}
          </Text>
          <Button
            title="Upgrade now"
            onPress={() => {
              // TODO: Hook into billing provider (RevenueCat or Stripe).
            }}
            variant="primary"
          />
        </Card>

        <Card>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
            }}
          >
            Not ready to upgrade? You can still execute your daily plan for
            free.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};
