import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

/**
 * Base Skeleton component with shimmer animation
 */
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme?.colors?.border?.primary || '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Skeleton for Planner Day Card
 */
export const PlannerDayCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme?.colors?.background?.secondary || '#F9FAFB',
          borderColor: theme?.colors?.border?.primary || '#E5E7EB',
        },
      ]}
    >
      {/* Date */}
      <Skeleton width={150} height={24} style={{ marginBottom: 12 }} />

      {/* Meals */}
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.mealRow}>
          <View style={{ flex: 1 }}>
            <Skeleton width={80} height={16} style={{ marginBottom: 6 }} />
            <Skeleton width="100%" height={20} style={{ marginBottom: 4 }} />
            <Skeleton width={100} height={14} />
          </View>
          <Skeleton width={60} height={32} borderRadius={16} />
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton for Insights Content
 */
export const InsightsContentSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme?.colors?.background?.secondary || '#F9FAFB',
          borderColor: theme?.colors?.border?.primary || '#E5E7EB',
        },
      ]}
    >
      {/* Title */}
      <Skeleton width={200} height={24} style={{ marginBottom: 16 }} />

      {/* Summary */}
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="95%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={16} style={{ marginBottom: 24 }} />

      {/* Tips Section */}
      <Skeleton width={150} height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={16} style={{ marginBottom: 24 }} />

      {/* Hydration */}
      <Skeleton width={180} height={18} />
    </View>
  );
};

/**
 * Skeleton for Meal Card
 */
export const MealCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.mealCard,
        {
          backgroundColor: theme?.colors?.background?.secondary || '#F9FAFB',
          borderColor: theme?.colors?.border?.primary || '#E5E7EB',
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Skeleton width={120} height={18} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={14} />
      </View>
      <Skeleton width={40} height={40} borderRadius={20} />
    </View>
  );
};

/**
 * Skeleton for Weight Graph
 */
export const WeightGraphSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme?.colors?.background?.secondary || '#F9FAFB',
          borderColor: theme?.colors?.border?.primary || '#E5E7EB',
        },
      ]}
    >
      <Skeleton width={180} height={24} style={{ marginBottom: 24 }} />
      <Skeleton width="100%" height={200} borderRadius={8} />
    </View>
  );
};

/**
 * Skeleton for Macro Ring
 */
export const MacroRingSkeleton: React.FC = () => {
  return (
    <View style={styles.macroRingContainer}>
      <Skeleton width={120} height={120} borderRadius={60} />
    </View>
  );
};

/**
 * Skeleton for Settings Row
 */
export const SettingsRowSkeleton: React.FC = () => {
  return (
    <View style={styles.settingsRow}>
      <Skeleton width={150} height={18} />
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
  );
};

/**
 * Full page skeleton for complex screens
 */
export const FullPageSkeleton: React.FC<{
  type: 'planner' | 'insights' | 'home';
}> = ({ type }) => {
  if (type === 'planner') {
    return (
      <View style={styles.container}>
        <Skeleton width={200} height={32} style={{ marginBottom: 24 }} />
        <PlannerDayCardSkeleton />
        <View style={{ height: 16 }} />
        <PlannerDayCardSkeleton />
      </View>
    );
  }

  if (type === 'insights') {
    return (
      <View style={styles.container}>
        <Skeleton width={150} height={32} style={{ marginBottom: 24 }} />
        <InsightsContentSkeleton />
      </View>
    );
  }

  // Home
  return (
    <View style={styles.container}>
      <Skeleton width={100} height={32} style={{ marginBottom: 24 }} />
      <MacroRingSkeleton />
      <View style={{ height: 16 }} />
      <MealCardSkeleton />
      <View style={{ height: 12 }} />
      <MealCardSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  macroRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
