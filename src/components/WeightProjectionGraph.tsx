import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Line, Circle, Text as SvgText, Polyline } from 'react-native-svg';
import { WeightEntry } from '@/types/nutrition';

interface WeightProjectionGraphProps {
  entries: WeightEntry[];
  projectedEntries: WeightEntry[];
  goalWeightKg?: number;
  unit: 'metric' | 'imperial';
}

const GRAPH_WIDTH = Dimensions.get('window').width - 40;
const GRAPH_HEIGHT = 200;
const PADDING = 20;

export const WeightProjectionGraph: React.FC<WeightProjectionGraphProps> = ({
  entries,
  projectedEntries,
  goalWeightKg,
  unit,
}) => {
  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="bar-chart" size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No weight data yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first weight entry to see your progress!
        </Text>
      </View>
    );
  }

  // Combine actual and projected
  const allEntries = [...entries, ...projectedEntries];

  // Find min/max weights for scaling
  const weights = allEntries.map(e => e.weightKg);
  if (goalWeightKg) weights.push(goalWeightKg);

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 10;
  const buffer = weightRange * 0.2;

  // Scale functions
  const scaleX = (index: number) => {
    return (
      PADDING +
      ((GRAPH_WIDTH - 2 * PADDING) / (allEntries.length - 1 || 1)) * index
    );
  };

  const scaleY = (weight: number) => {
    return (
      GRAPH_HEIGHT -
      PADDING -
      ((weight - (minWeight - buffer)) / (weightRange + 2 * buffer)) *
        (GRAPH_HEIGHT - 2 * PADDING)
    );
  };

  // Create polyline points
  const actualPoints = entries
    .map((entry, i) => `${scaleX(i)},${scaleY(entry.weightKg)}`)
    .join(' ');

  const projectedPoints = projectedEntries
    .map(
      (entry, i) => `${scaleX(entries.length + i)},${scaleY(entry.weightKg)}`
    )
    .join(' ');

  // Add last actual point to projected to connect lines
  const projectedPolylinePoints =
    entries.length > 0
      ? `${scaleX(entries.length - 1)},${scaleY(entries[entries.length - 1]?.weightKg || 0)} ${projectedPoints}`
      : projectedPoints;

  // Format weight for display
  const formatWeight = (kg: number) => {
    if (unit === 'imperial') {
      const lbs = kg * 2.20462;
      return `${Math.round(lbs)} lbs`;
    }
    return `${Math.round(kg)} kg`;
  };

  return (
    <View style={styles.container}>
      <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
        {/* Goal line */}
        {goalWeightKg && (
          <>
            <Line
              x1={PADDING}
              y1={scaleY(goalWeightKg)}
              x2={GRAPH_WIDTH - PADDING}
              y2={scaleY(goalWeightKg)}
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <SvgText
              x={GRAPH_WIDTH - PADDING - 10}
              y={scaleY(goalWeightKg) - 8}
              fill="#10B981"
              fontSize="12"
              fontWeight="600"
              textAnchor="end"
            >
              Goal: {formatWeight(goalWeightKg)}
            </SvgText>
          </>
        )}

        {/* Actual weight line */}
        {actualPoints && (
          <Polyline
            points={actualPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
          />
        )}

        {/* Projected weight line */}
        {projectedPolylinePoints && (
          <Polyline
            points={projectedPolylinePoints}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        )}

        {/* Actual weight points */}
        {entries.map((entry, i) => (
          <Circle
            key={`actual-${i}`}
            cx={scaleX(i)}
            cy={scaleY(entry.weightKg)}
            r="5"
            fill="#3b82f6"
          />
        ))}

        {/* Projected weight points */}
        {projectedEntries.map((entry, i) => (
          <Circle
            key={`proj-${i}`}
            cx={scaleX(entries.length + i)}
            cy={scaleY(entry.weightKg)}
            r="4"
            fill="#9ca3af"
            opacity="0.6"
          />
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Actual</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9ca3af' }]} />
          <Text style={styles.legendText}>Projected (30 days)</Text>
        </View>
        {goalWeightKg && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Goal</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  emptyContainer: {
    height: GRAPH_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLine: {
    width: 16,
    height: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
