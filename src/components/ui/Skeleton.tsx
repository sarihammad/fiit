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
