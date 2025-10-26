import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { MealItem } from '@/types/nutrition';
// import { FoodService } from '@/services/food';

interface PortionSelectorProps {
  foodItem: MealItem;
  onPortionChange: (multiplier: number, portionText: string) => void;
  selectedMultiplier?: number;
}

export const PortionSelector: React.FC<PortionSelectorProps> = ({
  foodItem,
  onPortionChange,
  selectedMultiplier = 1,
}) => {
  const { theme } = useTheme();
  const [activeMultiplier, setActiveMultiplier] = useState(selectedMultiplier);

  const presets = [
    { label: 'Small', multiplier: 0.5, unit: 'g' },
    { label: 'Medium', multiplier: 1, unit: 'g' },
    { label: 'Large', multiplier: 1.5, unit: 'g' },
    { label: 'Extra Large', multiplier: 2, unit: 'g' },
  ];

  const handlePortionSelect = (multiplier: number, unit: string) => {
    setActiveMultiplier(multiplier);
    onPortionChange(multiplier, unit);
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          { color: theme?.colors?.text?.primary || '#000000' },
        ]}
      >
        Select Portion Size
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme?.colors?.text?.secondary || '#666666' },
        ]}
      >
        {foodItem.name}
      </Text>

      <View style={styles.presetsGrid}>
        {presets.map((preset: any, index: number) => {
          const isActive = activeMultiplier === preset.multiplier;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetButton,
                {
                  backgroundColor: isActive
                    ? theme?.colors?.brand?.primary?.[50] || '#f0f9ff'
                    : theme?.colors?.background?.secondary || '#f9fafb',
                  borderColor: isActive
                    ? theme?.colors?.brand?.primary?.[600] || '#2563eb'
                    : theme?.colors?.border?.primary || '#d1d5db',
                  borderWidth: isActive ? 2 : 1,
                },
              ]}
              onPress={() =>
                handlePortionSelect(preset.multiplier, preset.unit)
              }
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Select ${preset.unit} portion`}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    color: isActive
                      ? theme?.colors?.brand?.primary?.[700] || '#1d4ed8'
                      : theme?.colors?.text?.primary || '#000000',
                    fontWeight: isActive ? '600' : '500',
                  },
                ]}
              >
                {preset.unit}
              </Text>
              <Text
                style={[
                  styles.presetSubtext,
                  {
                    color: isActive
                      ? theme?.colors?.brand?.primary?.[600] || '#2563eb'
                      : theme?.colors?.text?.tertiary || '#9ca3af',
                  },
                ]}
              >
                {Math.round(foodItem.calories * preset.multiplier)} cal
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: theme?.colors?.brand?.primary?.[50] || '#f0f9ff',
            borderColor: theme?.colors?.brand?.primary?.[200] || '#bfdbfe',
          },
        ]}
      >
        <View style={styles.infoContent}>
          <MaterialIcons
            name="lightbulb"
            size={16}
            color={theme?.colors?.brand?.primary?.[700] || '#1e40af'}
          />
          <Text
            style={[
              styles.infoText,
              { color: theme?.colors?.brand?.primary?.[700] || '#1e40af' },
            ]}
          >
            Portions are estimates. Adjust if your serving looks different.
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  presetButton: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 16,
    marginBottom: 4,
  },
  presetSubtext: {
    fontSize: 13,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
