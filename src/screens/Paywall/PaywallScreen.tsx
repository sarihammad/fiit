import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { usePaywallStore, useOfferings, useCurrentTier, usePaywallLoading, usePaywallError } from '@/state/paywall.store';
import { SubscriptionTier } from '@/services/paywall';
import { GuaranteeModal } from '@/components/GuaranteeModal';

export const PaywallScreen: React.FC = () => {
  const { theme } = useTheme();
  const { initialize, purchasePackage, restorePurchases, clearError } = usePaywallStore();
  const offerings = useOfferings();
  const currentTier = useCurrentTier();
  const isLoading = usePaywallLoading();
  const error = usePaywallError();
  
  const [showGuarantee, setShowGuarantee] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handlePurchase = async (packageIdentifier: string) => {
    try {
      setPurchasing(packageIdentifier);
      const success = await purchasePackage(packageIdentifier);
      
      if (success) {
        Alert.alert(
          'Success!',
          'Welcome to FIIT Pro! You now have access to all premium features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    try {
      const success = await restorePurchases();
      
      if (success) {
        Alert.alert(
          'Restored!',
          'Your purchases have been restored successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
    }
  };

  const benefits = [
    {
      icon: 'psychology',
      title: 'AI Meal Planning',
      description: 'Get personalized meal plans tailored to your goals and preferences',
    },
    {
      icon: 'camera-alt',
      title: '5-Second Photo Logging',
      description: 'Snap a photo and get instant calorie and macro breakdowns',
    },
    {
      icon: 'lightbulb',
      title: 'Daily AI Tips',
      description: 'Receive actionable feedback and tips to stay on track',
    },
    {
      icon: 'shopping-cart',
      title: 'Smart Grocery Lists',
      description: 'Automatically generated shopping lists for your meal plans',
    },
  ];

  if (isLoading && offerings.length === 0) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.content}>
          <Skeleton width="80%" height={32} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={200} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={100} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Unlock Your Full Potential
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            Join thousands of users who've achieved their goals with FIIT
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => clearError()}
            style={styles.errorBanner}
          />
        )}

        {/* Core Promise */}
        <View style={[styles.promiseCard, { backgroundColor: theme.colors.brand.primary + '10' }]}>
          <MaterialIcons
            name="verified"
            size={32}
            color={theme.colors.brand.primary}
            style={styles.promiseIcon}
          />
          <Text style={[styles.promiseTitle, { color: theme.colors.brand.primary }]}>
            Lose 7 lbs in 30 days — guaranteed
          </Text>
          <Text style={[styles.promiseText, { color: theme.colors.text.secondary }]}>
            Follow your personalized plan and we guarantee results or your money back
          </Text>
          <TouchableOpacity
            onPress={() => setShowGuarantee(true)}
            style={styles.guaranteeLink}
          >
            <Text style={[styles.guaranteeLinkText, { color: theme.colors.brand.primary }]}>
              How it works
            </Text>
          </TouchableOpacity>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={[styles.benefitsTitle, { color: theme.colors.text.primary }]}>
            What you get with FIIT Pro:
          </Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <MaterialIcons
                name={benefit.icon as any}
                size={24}
                color={theme.colors.brand.primary}
                style={styles.benefitIcon}
              />
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: theme.colors.text.primary }]}>
                  {benefit.title}
                </Text>
                <Text style={[styles.benefitDescription, { color: theme.colors.text.secondary }]}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Cards */}
        {offerings.length > 0 && (
          <View style={styles.pricing}>
            <Text style={[styles.pricingTitle, { color: theme.colors.text.primary }]}>
              Choose Your Plan
            </Text>
            
            {offerings[0]?.availablePackages.map((pkg) => (
              <View
                key={pkg.identifier}
                style={[
                  styles.pricingCard,
                  {
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: pkg.packageType === 'ANNUAL' 
                      ? theme.colors.brand.primary 
                      : theme.colors.border.primary,
                    borderWidth: pkg.packageType === 'ANNUAL' ? 2 : 1,
                  }
                ]}
              >
                {pkg.packageType === 'ANNUAL' && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.brand.primary }]}>
                    <Text style={styles.badgeText}>BEST VALUE</Text>
                  </View>
                )}
                
                <View style={styles.pricingHeader}>
                  <Text style={[styles.packageTitle, { color: theme.colors.text.primary }]}>
                    {pkg.product.title}
                  </Text>
                  <Text style={[styles.packagePrice, { color: theme.colors.brand.primary }]}>
                    {pkg.product.priceString}
                  </Text>
                  <Text style={[styles.packagePeriod, { color: theme.colors.text.secondary }]}>
                    {pkg.packageType === 'ANNUAL' ? 'per year' : 'per month'}
                  </Text>
                </View>

                <View style={styles.pricingFeatures}>
                  <Text style={[styles.feature, { color: theme.colors.text.secondary }]}>
                    ✓ Unlimited meal logging
                  </Text>
                  <Text style={[styles.feature, { color: theme.colors.text.secondary }]}>
                    ✓ AI meal planning
                  </Text>
                  <Text style={[styles.feature, { color: theme.colors.text.secondary }]}>
                    ✓ Daily feedback
                  </Text>
                  <Text style={[styles.feature, { color: theme.colors.text.secondary }]}>
                    ✓ Priority support
                  </Text>
                </View>

                <Button
                  title={purchasing === pkg.identifier ? 'Processing...' : 'Get Started'}
                  onPress={() => handlePurchase(pkg.identifier)}
                  variant="primary"
                  size="large"
                  isLoading={purchasing === pkg.identifier}
                  style={styles.purchaseButton}
                />
              </View>
            ))}
          </View>
        )}

        {/* Social Proof */}
        <View style={styles.socialProof}>
          <Text style={[styles.socialProofTitle, { color: theme.colors.text.primary }]}>
            Trusted by 10,000+ users
          </Text>
          <Text style={[styles.socialProofText, { color: theme.colors.text.secondary }]}>
            "FIIT helped me lose 15 lbs in 6 weeks. The AI feedback was incredibly helpful!"
          </Text>
          <Text style={[styles.socialProofAuthor, { color: theme.colors.text.tertiary }]}>
            — Sarah M.
          </Text>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} style={styles.footerLink}>
            <Text style={[styles.footerLinkText, { color: theme.colors.brand.primary }]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {/* Navigate to subscription management */}} 
            style={styles.footerLink}
          >
            <Text style={[styles.footerLinkText, { color: theme.colors.brand.primary }]}>
              Manage Subscription
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <GuaranteeModal
        visible={showGuarantee}
        onClose={() => setShowGuarantee(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorBanner: {
    marginBottom: 24,
  },
  promiseCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  promiseIcon: {
    marginBottom: 16,
  },
  promiseTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  promiseText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  guaranteeLink: {
    paddingVertical: 8,
  },
  guaranteeLinkText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  benefits: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
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
  pricing: {
    marginBottom: 32,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pricingCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  packagePeriod: {
    fontSize: 14,
  },
  pricingFeatures: {
    marginBottom: 24,
  },
  feature: {
    fontSize: 16,
    marginBottom: 8,
  },
  purchaseButton: {
    width: '100%',
  },
  socialProof: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  socialProofTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  socialProofText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  socialProofAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerLink: {
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});