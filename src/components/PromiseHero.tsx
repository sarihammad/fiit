import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { GuaranteeModal } from '@/components/GuaranteeModal';

interface PromiseHeroProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const PromiseHero: React.FC<PromiseHeroProps> = ({
  onGetStarted,
  onLearnMore,
}) => {
  const { theme } = useTheme();
  const [showGuarantee, setShowGuarantee] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.content}>
        <MaterialIcons
          name="fitness-center"
          size={80}
          color={theme.colors.brand.primary}
          style={styles.icon}
        />
        
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Lose 7 lbs in 30 days — guaranteed
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Your AI-powered nutrition coach that delivers real results
        </Text>
        
        <View style={[styles.guaranteeCard, { backgroundColor: theme.colors.brand.primary + '10' }]}>
          <MaterialIcons
            name="verified"
            size={24}
            color={theme.colors.brand.primary}
            style={styles.guaranteeIcon}
          />
          <Text style={[styles.guaranteeText, { color: theme.colors.brand.primary }]}>
            30-day money-back guarantee
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
        
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <MaterialIcons name="camera-alt" size={20} color={theme.colors.brand.primary} />
            <Text style={[styles.benefitText, { color: theme.colors.text.secondary }]}>
              5-second photo logging
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="psychology" size={20} color={theme.colors.brand.primary} />
            <Text style={[styles.benefitText, { color: theme.colors.text.secondary }]}>
              AI meal planning
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="lightbulb" size={20} color={theme.colors.brand.primary} />
            <Text style={[styles.benefitText, { color: theme.colors.text.secondary }]}>
              Daily personalized tips
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="shopping-cart" size={20} color={theme.colors.brand.primary} />
            <Text style={[styles.benefitText, { color: theme.colors.text.secondary }]}>
              Smart grocery lists
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Start Your Journey"
            onPress={onGetStarted}
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />
          
          <Button
            title="Learn More"
            onPress={onLearnMore}
            variant="outline"
            size="large"
            style={styles.secondaryButton}
          />
        </View>
      </View>
      
      <GuaranteeModal
        visible={showGuarantee}
        onClose={() => setShowGuarantee(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  guaranteeIcon: {
    marginRight: 8,
  },
  guaranteeText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  guaranteeLink: {
    marginLeft: 8,
  },
  guaranteeLinkText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  benefits: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    marginLeft: 12,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
});
