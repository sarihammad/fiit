import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <MaterialIcons
        name={icon}
        size={64}
        color={theme.colors.text.tertiary}
        style={styles.icon}
      />
      <Text
        style={[
          styles.title,
          { color: theme.colors.text.primary },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          { color: theme.colors.text.secondary },
        ]}
      >
        {description}
      </Text>
      {actionText && onAction && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.brand.primary },
          ]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionText}
        >
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44, // WCAG AA minimum touch target
  },
  actionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Common empty state patterns
export const NoMealsEmptyState: React.FC<{ onAddMeal: () => void }> = ({
  onAddMeal,
}) => (
  <EmptyState
    icon="restaurant"
    title="No meals logged yet"
    description="Start your nutrition journey by logging your first meal with a photo or manual entry."
    actionText="Log Your First Meal"
    onAction={onAddMeal}
  />
);

export const NoFeedbackEmptyState: React.FC<{ onLogMeal: () => void }> = ({
  onLogMeal,
}) => (
  <EmptyState
    icon="lightbulb"
    title="No feedback yet"
    description="Log a few meals to start receiving personalized AI feedback and tips."
    actionText="Log a Meal"
    onAction={onLogMeal}
  />
);

export const NoPlansEmptyState: React.FC<{ onGeneratePlan: () => void }> = ({
  onGeneratePlan,
}) => (
  <EmptyState
    icon="calendar-today"
    title="No meal plans yet"
    description="Get personalized meal plans tailored to your goals and preferences."
    actionText="Generate Plan"
    onAction={onGeneratePlan}
  />
);
