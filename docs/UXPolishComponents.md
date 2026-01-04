# UX Polish & Accessibility Components

This file contains reusable components for loading states, empty states, error handling, and accessibility features.

## Skeleton Components

```typescript
// src/components/ui/Skeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.colors.background.secondary,
      theme.colors.background.tertiary,
    ],
  });

  if (children) {
    return (
      <Animated.View style={[{ backgroundColor }, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

// Common skeleton patterns
export const MealCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View
      style={{
        backgroundColor: theme.colors.background.primary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border.primary,
      }}
    >
      <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width="25%" height={14} />
        <Skeleton width="25%" height={14} />
        <Skeleton width="25%" height={14} />
      </View>
    </View>
  );
};

export const PaywallSkeleton: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <View
      style={{
        backgroundColor: theme.colors.background.primary,
        borderRadius: 16,
        padding: 24,
        margin: 16,
        borderWidth: 1,
        borderColor: theme.colors.border.primary,
      }}
    >
      <Skeleton width="80%" height={32} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={20} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={20} style={{ marginBottom: 24 }} />
      
      <Skeleton width="100%" height={60} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={50} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={50} />
    </View>
  );
};
```

## Empty State Components

```typescript
// src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name={icon}
        size={64}
        color={theme.colors.text.tertiary}
        style={styles.icon}
      />
      <Text
        style={[
          styles.title,
          { color: theme.colors.text.primary },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          { color: theme.colors.text.secondary },
        ]}
      >
        {description}
      </Text>
      {actionText && onAction && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.brand.primary },
          ]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44, // WCAG AA minimum touch target
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Common empty state patterns
export const NoMealsEmptyState: React.FC<{ onAddMeal: () => void }> = ({
  onAddMeal,
}) => (
  <EmptyState
    icon="restaurant"
    title="No meals logged yet"
    description="Start your nutrition journey by logging your first meal with a photo or manual entry."
    actionText="Log Your First Meal"
    onAction={onAddMeal}
  />
);

export const NoFeedbackEmptyState: React.FC<{ onLogMeal: () => void }> = ({
  onLogMeal,
}) => (
  <EmptyState
    icon="lightbulb"
    title="No feedback yet"
    description="Log a few meals to start receiving personalized AI feedback and tips."
    actionText="Log a Meal"
    onAction={onLogMeal}
  />
);

export const NoPlansEmptyState: React.FC<{ onGeneratePlan: () => void }> = ({
  onGeneratePlan,
}) => (
  <EmptyState
    icon="calendar-today"
    title="No meal plans yet"
    description="Get personalized meal plans tailored to your goals and preferences."
    actionText="Generate Plan"
    onAction={onGeneratePlan}
  />
);
```

## Error Handling Components

```typescript
// src/components/ui/ErrorBanner.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

interface ErrorBannerProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title,
  message,
  onRetry,
  onDismiss,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.error?.[50] || '#fef2f2',
          borderColor: theme.colors.error?.[200] || '#fecaca',
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons
          name="error-outline"
          size={20}
          color={theme.colors.error?.[500] || '#ef4444'}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.error?.[700] || '#b91c1c' },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              { color: theme.colors.error?.[600] || '#dc2626' },
            ]}
          >
            {message}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.error?.[500] || '#ef4444' },
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <MaterialIcons
              name="close"
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Common error patterns
export const NetworkErrorBanner: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <ErrorBanner
    title="Connection Error"
    message="Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

export const AuthErrorBanner: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <ErrorBanner
    title="Authentication Error"
    message="Your session has expired. Please sign in again."
    onRetry={onRetry}
  />
);

export const PhotoErrorBanner: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <ErrorBanner
    title="Photo Analysis Failed"
    message="We couldn't analyze your photo. Please try again or add the meal manually."
    onRetry={onRetry}
  />
);
```

## Loading States

```typescript
// src/components/ui/LoadingOverlay.tsx
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
  style?: any;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  visible,
  style,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, style]}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.brand.primary}
          style={styles.spinner}
        />
        <Text
          style={[
            styles.message,
            { color: theme.colors.text.primary },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});
```

## Accessibility Utilities

```typescript
// src/utils/accessibility.ts
import { Platform } from 'react-native';

export const accessibility = {
  // Ensure minimum touch target size (WCAG AA)
  minTouchTarget: 44,
  
  // Generate accessibility labels
  generateLabel: (action: string, context?: string) => {
    return context ? `${action} ${context}` : action;
  },
  
  // Check if running on accessible platform
  isAccessibilityEnabled: () => {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  },
  
  // Generate hint text for complex interactions
  generateHint: (action: string, result: string) => {
    return `Double tap to ${action}. ${result}`;
  },
};

// Haptic feedback utility
export const haptics = {
  light: () => {
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  medium: () => {
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  
  heavy: () => {
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  
  success: () => {
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  
  error: () => {
    if (Platform.OS === 'ios') {
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};
```

## Enhanced Button Component

```typescript
// src/components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { haptics } from '@/utils/accessibility';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (loading || disabled) return;
    
    haptics.light();
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: accessibility.minTouchTarget,
    };

    // Size styles
    const sizeStyles = {
      small: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
      medium: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 44 },
      large: { paddingHorizontal: 20, paddingVertical: 16, minHeight: 52 },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.brand.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: theme.colors.brand.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.brand.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    const sizeStyles = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    const variantStyles = {
      primary: { color: '#ffffff' },
      secondary: { color: '#ffffff' },
      outline: { color: theme.colors.brand.primary },
      ghost: { color: theme.colors.brand.primary },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? '#ffffff' : theme.colors.brand.primary}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
```

## Screen-Level Loading States

```typescript
// src/components/ui/ScreenLoadingState.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, MealCardSkeleton, PaywallSkeleton } from './Skeleton';
import { useTheme } from '@/providers/ThemeProvider';

interface ScreenLoadingStateProps {
  type: 'meals' | 'paywall' | 'feedback' | 'plans' | 'generic';
  count?: number;
}

export const ScreenLoadingState: React.FC<ScreenLoadingStateProps> = ({
  type,
  count = 3,
}) => {
  const { theme } = useTheme();

  const renderContent = () => {
    switch (type) {
      case 'meals':
        return Array.from({ length: count }, (_, i) => (
          <MealCardSkeleton key={i} />
        ));
      
      case 'paywall':
        return <PaywallSkeleton />;
      
      case 'feedback':
        return Array.from({ length: count }, (_, i) => (
          <View key={i} style={styles.feedbackSkeleton}>
            <Skeleton width="100%" height={20} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={16} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={16} />
          </View>
        ));
      
      case 'plans':
        return Array.from({ length: count }, (_, i) => (
          <View key={i} style={styles.planSkeleton}>
            <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="90%" height={16} style={{ marginBottom: 4 }} />
            <Skeleton width="85%" height={16} />
          </View>
        ));
      
      default:
        return Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} width="100%" height={20} style={{ marginBottom: 8 }} />
        ));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  feedbackSkeleton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  planSkeleton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
```

This comprehensive UX polish and accessibility system provides:

1. **Skeleton Components**: Loading states for all major UI patterns
2. **Empty States**: Focused CTAs with clear next actions
3. **Error Handling**: User-friendly error banners with retry options
4. **Loading Overlays**: Full-screen loading states
5. **Accessibility**: WCAG AA compliance with proper touch targets and labels
6. **Haptic Feedback**: Enhanced user experience on iOS
7. **Enhanced Button**: Accessible button component with multiple variants

All components follow the design system and provide consistent, accessible experiences across the app.
# NOTE: Legacy nutrition-era document. Current product is the FIIT execution coach. See `README.md`.
