import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export interface StreakBarProps {
  currentStreak: number;
  bestStreak: number;
  targetStreak?: number;
  showTarget?: boolean;
}

export const StreakBar: React.FC<StreakBarProps> = ({
  currentStreak,
  bestStreak,
  targetStreak = 7,
  showTarget = true,
}) => {
  const theme = useTheme();

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#10B981'; // green
    if (streak >= 14) return '#3B82F6'; // blue
    if (streak >= 7) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const currentColor = getStreakColor(currentStreak);
  const bestColor = getStreakColor(bestStreak);

  return (
    <View style={styles.container}>
      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <Text style={[styles.streakNumber, { color: currentColor }]}>
            {currentStreak}
          </Text>
          <Text
            style={[
              styles.streakLabel,
              { color: theme?.theme?.colors?.text?.primary || '#111827' },
            ]}
          >
            Current
          </Text>
        </View>

        <View style={styles.streakItem}>
          <Text style={[styles.streakNumber, { color: bestColor }]}>
            {bestStreak}
          </Text>
          <Text
            style={[
              styles.streakLabel,
              { color: theme?.theme?.colors?.text?.primary || '#111827' },
            ]}
          >
            Best
          </Text>
        </View>

        {showTarget && (
          <View style={styles.streakItem}>
            <Text style={[styles.streakNumber, { color: '#6B7280' }]}>
              {targetStreak}
            </Text>
            <Text
              style={[
                styles.streakLabel,
                { color: theme?.theme?.colors?.text?.primary || '#111827' },
              ]}
            >
              Target
            </Text>
          </View>
        )}
      </View>

      {/* Simple progress indicator */}
      <View
        style={[
          styles.progressContainer,
          {
            backgroundColor:
              theme?.theme?.colors?.background?.secondary || '#F3F4F6',
          },
        ]}
      >
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min((currentStreak / targetStreak) * 100, 100)}%`,
              backgroundColor: currentColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});
