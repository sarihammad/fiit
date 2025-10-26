import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { MealItem } from '@/types/nutrition';
import { MaterialIcons } from '@expo/vector-icons';

interface MacroPreviewProps {
  foodItem: MealItem;
  multiplier: number;
}

export const MacroPreview: React.FC<MacroPreviewProps> = ({
  foodItem,
  multiplier,
}) => {
  const { theme } = useTheme();

  const adjustedMacros = {
    calories: Math.round(foodItem.calories * multiplier),
    protein: Math.round(foodItem.protein * multiplier),
    carbs: Math.round(foodItem.carbs * multiplier),
    fat: Math.round(foodItem.fat * multiplier),
    fiber: foodItem.fiber ? Math.round(foodItem.fiber * multiplier) : 0,
  };

  const macros = [
    {
      label: 'Calories',
      value: adjustedMacros.calories,
      unit: 'cal',
      color: theme?.colors?.brand?.primary || '#2563eb',
      icon: 'whatshot' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      label: 'Protein',
      value: adjustedMacros.protein,
      unit: 'g',
      color: theme?.colors?.success?.[600] || '#059669',
      icon: 'fitness-center' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      label: 'Carbs',
      value: adjustedMacros.carbs,
      unit: 'g',
      color: theme?.colors?.warning?.[600] || '#d97706',
      icon: 'grain' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      label: 'Fat',
      value: adjustedMacros.fat,
      unit: 'g',
      color: theme?.colors?.brand?.secondary || '#0284c7',
      icon: 'opacity' as keyof typeof MaterialIcons.glyphMap,
    },
  ];

  if (adjustedMacros.fiber > 0) {
    macros.push({
      label: 'Fiber',
      value: adjustedMacros.fiber,
      unit: 'g',
      color: '#22c55e',
      icon: 'eco' as keyof typeof MaterialIcons.glyphMap,
    });
  }

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          { color: theme?.colors?.text?.primary || '#000000' },
        ]}
      >
        Nutrition Preview
      </Text>

      <View style={styles.macrosGrid}>
        {macros.map((macro, index) => (
          <View
            key={index}
            style={[
              styles.macroCard,
              {
                backgroundColor:
                  theme?.colors?.background?.secondary || '#f9fafb',
                borderColor: theme?.colors?.border?.primary || '#d1d5db',
              },
            ]}
          >
            <MaterialIcons name={macro.icon} size={24} color={macro.color} />
            <View style={styles.macroContent}>
              <Text
                style={[
                  styles.macroValue,
                  { color: macro.color, fontWeight: '700' },
                ]}
              >
                {macro.value}
                <Text style={[styles.macroUnit, { color: macro.color }]}>
                  {macro.unit}
                </Text>
              </Text>
              <Text
                style={[
                  styles.macroLabel,
                  { color: theme?.colors?.text?.secondary || '#666666' },
                ]}
              >
                {macro.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Calorie Breakdown */}
      <View
        style={[
          styles.breakdownCard,
          {
            backgroundColor: theme?.colors?.background?.secondary || '#f9fafb',
            borderColor: theme?.colors?.border?.primary || '#d1d5db',
          },
        ]}
      >
        <Text
          style={[
            styles.breakdownTitle,
            { color: theme?.colors?.text?.primary || '#000000' },
          ]}
        >
          Calorie Breakdown
        </Text>
        <View style={styles.breakdownBar}>
          <View
            style={[
              styles.breakdownSegment,
              {
                width: `${(adjustedMacros.protein * 4 * 100) / adjustedMacros.calories}%`,
                backgroundColor: theme?.colors?.success?.[500] || '#10b981',
              },
            ]}
          />
          <View
            style={[
              styles.breakdownSegment,
              {
                width: `${(adjustedMacros.carbs * 4 * 100) / adjustedMacros.calories}%`,
                backgroundColor: theme?.colors?.warning?.[500] || '#f59e0b',
              },
            ]}
          />
          <View
            style={[
              styles.breakdownSegment,
              {
                width: `${(adjustedMacros.fat * 9 * 100) / adjustedMacros.calories}%`,
                backgroundColor: theme?.colors?.brand?.secondary || '#06b6d4',
              },
            ]}
          />
        </View>
        <View style={styles.breakdownLegend}>
          <Text
            style={[
              styles.legendItem,
              { color: theme?.colors?.success?.[700] || '#047857' },
            ]}
          >
            P:{' '}
            {Math.round(
              (adjustedMacros.protein * 4 * 100) / adjustedMacros.calories
            )}
            %
          </Text>
          <Text
            style={[
              styles.legendItem,
              { color: theme?.colors?.warning?.[700] || '#b45309' },
            ]}
          >
            C:{' '}
            {Math.round(
              (adjustedMacros.carbs * 4 * 100) / adjustedMacros.calories
            )}
            %
          </Text>
          <Text
            style={[
              styles.legendItem,
              { color: theme?.colors?.brand?.secondary || '#0e7490' },
            ]}
          >
            F:{' '}
            {Math.round(
              (adjustedMacros.fat * 9 * 100) / adjustedMacros.calories
            )}
            %
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  macroCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  macroIcon: {
    marginRight: 8,
  },
  macroContent: {
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    marginBottom: 2,
  },
  macroUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  macroLabel: {
    fontSize: 12,
  },
  breakdownCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  breakdownBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    fontSize: 12,
    fontWeight: '600',
  },
});
