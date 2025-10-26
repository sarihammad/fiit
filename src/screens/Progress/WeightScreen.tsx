import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { useWeightStore } from '@/state/weight.store';
import { useUserGoalsStore } from '@/state/userGoals.store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { WeightProjectionGraph } from '@/components/WeightProjectionGraph';

export const WeightScreen: React.FC = () => {
  const { theme } = useTheme();
  const { entries, addEntry, projectWeight, getWeightChange } =
    useWeightStore();
  const { goals } = useUserGoalsStore();

  const [newWeight, setNewWeight] = useState('');
  const projection = projectWeight(30);
  const change = getWeightChange();

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    addEntry({
      date: new Date().toISOString().slice(0, 10),
      weightKg: weight,
    });
    setNewWeight('');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          Weight Tracker
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 24,
          }}
        >
          Track your weight and see your progress towards your goal.
        </Text>

        {/* Add Weight Entry */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Log Today's Weight
          </Text>
          <TextInput
            style={{
              fontSize: 16,
              color: theme.colors.text.primary,
              padding: 12,
              backgroundColor: theme.colors.background.secondary,
              borderRadius: 8,
              marginBottom: 12,
            }}
            placeholder="Enter weight (kg)"
            placeholderTextColor={theme.colors.text.tertiary}
            keyboardType="decimal-pad"
            value={newWeight}
            onChangeText={setNewWeight}
          />
          <Button
            title="Add Weight"
            onPress={handleAddWeight}
            variant="primary"
            disabled={!newWeight.trim()}
          />
        </Card>

        {/* Progress Summary */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Progress Summary
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.tertiary,
                  marginBottom: 4,
                }}
              >
                Current
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                }}
              >
                {entries.length > 0
                  ? entries[entries.length - 1]?.weightKg?.toFixed(1) || '0.0'
                  : '--'}{' '}
                kg
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.tertiary,
                  marginBottom: 4,
                }}
              >
                Goal
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.colors.brand.primary,
                }}
              >
                {goals.goalWeightKg?.toFixed(1) || '--'} kg
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.tertiary,
                  marginBottom: 4,
                }}
              >
                To Go
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                }}
              >
                {entries.length > 0 && goals.goalWeightKg
                  ? (
                      (entries[entries.length - 1]?.weightKg || 0) -
                      (goals.goalWeightKg || 0)
                    ).toFixed(1)
                  : '--'}{' '}
                kg
              </Text>
            </View>
          </View>

          {change.totalKg !== 0 && (
            <View
              style={{
                padding: 12,
                backgroundColor: theme.colors.background.secondary,
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <Text
                style={{ fontSize: 14, color: theme.colors.text.secondary }}
              >
                Total change: {change.totalKg > 0 ? '+' : ''}
                {change.totalKg.toFixed(1)} kg
              </Text>
              <Text
                style={{ fontSize: 14, color: theme.colors.text.secondary }}
              >
                Weekly avg: {change.weeklyAvg > 0 ? '+' : ''}
                {change.weeklyAvg.toFixed(2)} kg/week
              </Text>
            </View>
          )}
        </Card>

        {/* Projection */}
        {projection.projected.length > 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 12,
              }}
            >
              30-Day Projection
            </Text>

            <View
              style={{
                padding: 12,
                backgroundColor: projection.onTrack
                  ? theme.colors.success[50]
                  : theme.colors.warning[50],
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                {projection.onTrack ? (
                  <>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color={theme.colors.success[700]}
                    />
                    {' On Track'}
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name="warning"
                      size={16}
                      color={theme.colors.warning[700]}
                    />
                    {' Behind Schedule'}
                  </>
                )}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: projection.onTrack
                    ? theme.colors.success[600]
                    : theme.colors.warning[600],
                }}
              >
                At current rate: {Math.abs(projection.slope * 30).toFixed(1)} kg
                in 30 days
              </Text>
              {projection.daysToGoal && (
                <Text
                  style={{
                    fontSize: 14,
                    color: projection.onTrack
                      ? theme.colors.success[600]
                      : theme.colors.warning[600],
                  }}
                >
                  Estimated goal date: {projection.daysToGoal} days
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Weight History */}
        <Card>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Weight History
          </Text>

          {entries.length === 0 ? (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                textAlign: 'center',
                paddingVertical: 16,
              }}
            >
              No weight entries yet. Add your first weight above!
            </Text>
          ) : (
            <View>
              {entries
                .slice()
                .reverse()
                .map(entry => (
                  <View
                    key={entry.date}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border.primary,
                    }}
                  >
                    <Text
                      style={{ fontSize: 15, color: theme.colors.text.primary }}
                    >
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                      }}
                    >
                      {entry.weightKg.toFixed(1)} kg
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};
