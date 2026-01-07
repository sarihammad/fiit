import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Copy } from '@/copy/strings';
import { PAYWALL_EVENTS, type PurchaseFailProps } from '@/analytics/events';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { usePaywallStore } from '@/state/paywall.store';

export const UpgradeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { trackEvent } = useAnalytics();
  const { purchasePackage } = usePaywallStore();

  React.useEffect(() => {
    // Track upgrade view
    trackEvent(PAYWALL_EVENTS.VIEW, {});
  }, [trackEvent]);

  const handleUpgrade = async () => {
    // Track upgrade click
    trackEvent(PAYWALL_EVENTS.CLICK, {});
    try {
      // TODO: Get package identifier from offerings
      const success = await purchasePackage('fiit_pro_monthly');
      if (success) {
        trackEvent(PAYWALL_EVENTS.PURCHASE_SUCCESS, {});
      } else {
        const failProps: PurchaseFailProps = {
          errorCode: 'unknown',
        };
        trackEvent(PAYWALL_EVENTS.PURCHASE_FAIL, failProps);
      }
    } catch (error) {
      const failProps: PurchaseFailProps = {
        errorCode: error instanceof Error ? error.message : 'unknown',
      };
      trackEvent(PAYWALL_EVENTS.PURCHASE_FAIL, failProps);
    }
  };

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
            onPress={handleUpgrade}
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
