import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.6, 200);
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export interface ScoreDialProps {
  score: number; // 0-100
  label?: string;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  color?: string; // Accept color prop for backward compatibility
}

export const ScoreDial: React.FC<ScoreDialProps> = ({
  score,
  label = 'Score',
  size = CIRCLE_SIZE,
  strokeWidth = STROKE_WIDTH,
  showPercentage = true,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(score / 100, { duration: 1000 });
  }, [score, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - animatedValue.value * circumference;
    return {
      strokeDashoffset,
    };
  });

  // Simple color logic based on score, or use provided color
  const getStrokeColor = (score: number) => {
    if (color) return color; // Use provided color if available
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    if (score >= 40) return '#EF4444'; // red
    return '#6B7280'; // gray
  };

  const strokeColor = getStrokeColor(score);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.circleContainer}>
        {/* Background circle */}
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: '#E5E7EB',
            },
          ]}
        />

        {/* Progress circle */}
        <Animated.View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: strokeColor,
            },
            animatedProps as any,
          ]}
        />
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={[styles.scoreText, { fontSize: size * 0.15 }]}>
          {showPercentage ? `${Math.round(score)}%` : Math.round(score)}
        </Text>
        {label && (
          <Text style={[styles.labelText, { fontSize: size * 0.08 }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  labelText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
