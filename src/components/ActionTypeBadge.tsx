import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { ActionType } from '@/types/coach';

interface ActionTypeBadgeProps {
  actionType: ActionType;
  size?: 'small' | 'medium';
}

const actionTypeLabels: Record<ActionType, string> = {
  grocery: 'Grocery',
  meal_prep: 'Meal Prep',
  protein_anchor: 'Protein',
  steps: 'Steps',
  hydration: 'Hydration',
  craving_plan: 'Cravings',
  sleep: 'Sleep',
  environment: 'Environment',
};

const actionTypeColors: Record<ActionType, { bg: string; text: string }> = {
  grocery: { bg: '#dbeafe', text: '#1e40af' },
  meal_prep: { bg: '#fef3c7', text: '#92400e' },
  protein_anchor: { bg: '#fce7f3', text: '#9f1239' },
  steps: { bg: '#f3e8ff', text: '#6b21a8' },
  hydration: { bg: '#e0f2fe', text: '#0c4a6e' },
  craving_plan: { bg: '#fff7ed', text: '#9a3412' },
  sleep: { bg: '#f1f5f9', text: '#475569' },
  environment: { bg: '#ecfdf5', text: '#065f46' },
};

export const ActionTypeBadge: React.FC<ActionTypeBadgeProps> = ({
  actionType,
  size = 'small',
}) => {
  const { theme } = useTheme();
  const colors = actionTypeColors[actionType];
  const label = actionTypeLabels[actionType];

  return (
    <View
      style={[
        styles.badge,
        size === 'medium' && styles.badgeMedium,
        { backgroundColor: colors.bg },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          size === 'medium' && styles.badgeTextMedium,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextMedium: {
    fontSize: 12,
  },
});


