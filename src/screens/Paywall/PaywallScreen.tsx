// Paywall screen with improved UX and RevenueCat integration
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { usePaywallStore, usePaywallSelectors } from '@/state/paywall.store';
import { RootStackNavigationProp } from '@/types/navigation';
import { PaywallService } from '@/services/paywall';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

export const PaywallScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();
  const { offerings, isLoading, error, purchasePackage, restore, refresh } =
    usePaywallStore();

  const { isPro, isPremium, isInTrial, tier } = usePaywallSelectors();

  const [selectedPackage, setSelectedPackage] =
    useState<string>('fiit_pro_yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      const success = await purchasePackage(selectedPackage);

      if (success) {
        Alert.alert(
          'Welcome to FIIT Pro!',
          'Your subscription is now active. Start exploring your new features!',
          [
            {
              text: 'Get Started',
              onPress: () => navigation.navigate('Main' as any),
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', 'Please try again or contact support.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'Please try again or contact support.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const success = await restore();

      if (success) {
        Alert.alert(
          'Purchases Restored',
          'Your previous purchases have been restored.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Main' as any),
            },
          ]
        );
      } else {
        Alert.alert('Restore Failed', 'No previous purchases found.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Please try again or contact support.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManageSubscription = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';

    Linking.openURL(url);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.theme.colors.text.primary }]}>
        Lose 7 lbs in 30 days — guaranteed
      </Text>
      <Text
        style={[styles.subtitle, { color: theme.theme.colors.text.secondary }]}
      >
        Join 2,000+ users who've transformed their health with AI-powered meal
        plans
      </Text>
    </View>
  );

  const renderBenefits = () => {
    const benefits = PaywallService.getTierBenefits('pro');

    return (
      <View style={styles.benefitsContainer}>
        <Text
          style={[
            styles.benefitsTitle,
            { color: theme.theme.colors.text.primary },
          ]}
        >
          What you get with FIIT Pro:
        </Text>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <MaterialIcons
              name={benefit.icon as any}
              size={24}
              color={theme.theme.colors.brand.primary}
            />
            <View style={styles.benefitText}>
              <Text
                style={[
                  styles.benefitTitle,
                  { color: theme.theme.colors.text.primary },
                ]}
              >
                {benefit.title}
              </Text>
              <Text
                style={[
                  styles.benefitDescription,
                  { color: theme.theme.colors.text.secondary },
                ]}
              >
                {benefit.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPricing = () => {
    if (isLoading) {
      return (
        <View style={styles.pricingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.theme.colors.brand.primary}
          />
        </View>
      );
    }

    const defaultOffering = offerings.find(
      (o: any) => o.identifier === 'default'
    );
    if (!defaultOffering) {
      return (
        <View style={styles.pricingContainer}>
          <Text
            style={[
              styles.errorText,
              { color: theme.theme.colors.error?.[500] || '#ef4444' },
            ]}
          >
            Failed to load pricing options
          </Text>
        </View>
      );
    }

    const monthlyPackage = defaultOffering.availablePackages.find(
      (p: any) => p.packageType === 'MONTHLY'
    );
    const yearlyPackage = defaultOffering.availablePackages.find(
      (p: any) => p.packageType === 'ANNUAL'
    );

    if (!monthlyPackage || !yearlyPackage) {
      return (
        <View style={styles.pricingContainer}>
          <Text
            style={[
              styles.errorText,
              { color: theme.theme.colors.error?.[500] || '#ef4444' },
            ]}
          >
            Pricing packages not found
          </Text>
        </View>
      );
    }

    const savings = PaywallService.calculateSavings(
      monthlyPackage.product.price,
      yearlyPackage.product.price
    );

    return (
      <View style={styles.pricingContainer}>
        <Text
          style={[
            styles.pricingTitle,
            { color: theme.theme.colors.text.primary },
          ]}
        >
          Choose your plan:
        </Text>

        {/* Yearly Plan */}
        <TouchableOpacity
          style={[
            styles.pricingCard,
            selectedPackage === yearlyPackage.identifier && styles.selectedCard,
            {
              borderColor:
                selectedPackage === yearlyPackage.identifier
                  ? theme.theme.colors.brand.primary
                  : theme.theme.colors.border.primary,
            },
          ]}
          onPress={() => setSelectedPackage(yearlyPackage.identifier)}
        >
          <View style={styles.pricingHeader}>
            <Text
              style={[
                styles.pricingName,
                { color: theme.theme.colors.text.primary },
              ]}
            >
              Annual Plan
            </Text>
            {savings > 0 && (
              <View
                style={[
                  styles.savingsBadge,
                  { backgroundColor: theme.theme.colors.brand.primary },
                ]}
              >
                <Text style={styles.savingsText}>Save {savings}%</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.pricingPrice,
              { color: theme.theme.colors.text.primary },
            ]}
          >
            {yearlyPackage.product.priceString}
          </Text>
          <Text
            style={[
              styles.pricingPeriod,
              { color: theme.theme.colors.text.secondary },
            ]}
          >
            per year
          </Text>
        </TouchableOpacity>

        {/* Monthly Plan */}
        <TouchableOpacity
          style={[
            styles.pricingCard,
            selectedPackage === monthlyPackage.identifier &&
              styles.selectedCard,
            {
              borderColor:
                selectedPackage === monthlyPackage.identifier
                  ? theme.theme.colors.brand.primary
                  : theme.theme.colors.border.primary,
            },
          ]}
          onPress={() => setSelectedPackage(monthlyPackage.identifier)}
        >
          <View style={styles.pricingHeader}>
            <Text
              style={[
                styles.pricingName,
                { color: theme.theme.colors.text.primary },
              ]}
            >
              Monthly Plan
            </Text>
          </View>
          <Text
            style={[
              styles.pricingPrice,
              { color: theme.theme.colors.text.primary },
            ]}
          >
            {monthlyPackage.product.priceString}
          </Text>
          <Text
            style={[
              styles.pricingPeriod,
              { color: theme.theme.colors.text.secondary },
            ]}
          >
            per month
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGuarantee = () => (
    <View style={styles.guaranteeContainer}>
      <MaterialIcons
        name="verified"
        size={24}
        color={theme.theme.colors.brand.primary}
      />
      <Text
        style={[
          styles.guaranteeText,
          { color: theme.theme.colors.text.secondary },
        ]}
      >
        If you follow the plan and don't lose 7 lbs in 30 days, we'll comp a
        month.
      </Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity onPress={handleRestore} disabled={isRestoring}>
        <Text
          style={[
            styles.footerLink,
            { color: theme.theme.colors.brand.primary },
          ]}
        >
          {isRestoring ? 'Restoring...' : 'Restore Purchases'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleManageSubscription}>
        <Text
          style={[
            styles.footerLink,
            { color: theme.theme.colors.brand.primary },
          ]}
        >
          Manage Subscription
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.footerText,
          { color: theme.theme.colors.text.secondary },
        ]}
      >
        By subscribing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.theme.colors.background.primary },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderBenefits()}
        {renderPricing()}
        {renderGuarantee()}

        {error && (
          <View style={styles.errorContainer}>
            <Text
              style={[
                styles.errorText,
                { color: theme.theme.colors.error?.[500] || '#ef4444' },
              ]}
            >
              {error}
            </Text>
          </View>
        )}

        <Button
          title={isPurchasing ? 'Processing...' : 'Start Free Trial'}
          onPress={handlePurchase}
          disabled={isPurchasing || isLoading}
          style={styles.purchaseButton}
        />

        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitText: {
    flex: 1,
    marginLeft: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pricingContainer: {
    marginBottom: 30,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  pricingCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  selectedCard: {
    borderWidth: 2,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingName: {
    fontSize: 18,
    fontWeight: '600',
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pricingPeriod: {
    fontSize: 14,
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
  },
  guaranteeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  purchaseButton: {
    marginBottom: 30,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerLink: {
    fontSize: 16,
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
});
