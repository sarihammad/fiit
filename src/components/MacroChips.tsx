import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { MaterialIcons } from '@expo/vector-icons';

interface MacroChipsProps {
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

export const MacroChips: React.FC<MacroChipsProps> = ({
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
}) => {
  const { theme } = useTheme();

  const getMacroStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'good';
    if (percentage >= 70) return 'ok';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#10B981';
      case 'ok':
        return '#F59E0B';
      case 'low':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const macros = [
    {
      label: 'Protein',
      value: Math.round(protein),
      target: Math.round(proteinTarget),
      status: getMacroStatus(protein, proteinTarget),
      icon: 'fitness-center' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      label: 'Carbs',
      value: Math.round(carbs),
      target: Math.round(carbsTarget),
      status: getMacroStatus(carbs, carbsTarget),
      icon: 'grain' as keyof typeof MaterialIcons.glyphMap,
    },
    {
      label: 'Fat',
      value: Math.round(fat),
      target: Math.round(fatTarget),
      status: getMacroStatus(fat, fatTarget),
      icon: 'opacity' as keyof typeof MaterialIcons.glyphMap,
    },
  ];

  return (
    <View style={styles.container}>
      {macros.map((macro, index) => (
        <View
          key={macro.label}
          style={[
            styles.chip,
            {
              backgroundColor: theme.colors.background.secondary,
              borderColor: getStatusColor(macro.status),
            },
          ]}
        >
          <MaterialIcons
            name={macro.icon}
            size={18}
            color={theme.colors.text.tertiary}
            style={{ marginRight: 6 }}
          />
          <View style={styles.content}>
            <Text style={[styles.label, { color: theme.colors.text.tertiary }]}>
              {macro.label}
            </Text>
            <Text style={[styles.value, { color: theme.colors.text.primary }]}>
              {macro.value}
              <Text
                style={[styles.target, { color: theme.colors.text.secondary }]}
              >
                /{macro.target}g
              </Text>
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  target: {
    fontSize: 13,
    fontWeight: '400',
  },
});
