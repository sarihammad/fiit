import React from 'react';
import { View, ViewStyle, TouchableOpacity, StyleSheet } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  borderRadius = 'medium',
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'default':
        return styles.default;
      case 'elevated':
        return styles.elevated;
      case 'outlined':
        return styles.outlined;
      case 'flat':
        return styles.flat;
      default:
        return styles.default;
    }
  };

  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return styles.paddingNone;
      case 'small':
        return styles.paddingSmall;
      case 'large':
        return styles.paddingLarge;
      default:
        return styles.paddingMedium;
    }
  };

  const getMarginStyle = () => {
    switch (margin) {
      case 'none':
        return styles.marginNone;
      case 'small':
        return styles.marginSmall;
      case 'large':
        return styles.marginLarge;
      default:
        return styles.marginMedium;
    }
  };

  const getBorderRadiusStyle = () => {
    switch (borderRadius) {
      case 'none':
        return styles.radiusNone;
      case 'small':
        return styles.radiusSmall;
      case 'large':
        return styles.radiusLarge;
      default:
        return styles.radiusMedium;
    }
  };

  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      style={[
        styles.card,
        getVariantStyle(),
        getPaddingStyle(),
        getMarginStyle(),
        getBorderRadiusStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {children}
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  // Variant styles
  default: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
  },
  elevated: {
    backgroundColor: '#ffffff',
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  flat: {
    backgroundColor: '#f9fafb',
    borderColor: 'transparent',
  },
  // Padding styles
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: 12,
  },
  paddingMedium: {
    padding: 16,
  },
  paddingLarge: {
    padding: 24,
  },
  // Margin styles
  marginNone: {
    margin: 0,
  },
  marginSmall: {
    margin: 8,
  },
  marginMedium: {
    margin: 16,
  },
  marginLarge: {
    margin: 24,
  },
  // Border radius styles
  radiusNone: {
    borderRadius: 0,
  },
  radiusSmall: {
    borderRadius: 8,
  },
  radiusMedium: {
    borderRadius: 12,
  },
  radiusLarge: {
    borderRadius: 16,
  },
});
