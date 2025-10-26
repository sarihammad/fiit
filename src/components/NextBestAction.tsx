import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/state/auth.store';
import { useMealStore } from '@/state/meal.store';
import { useWeightStore } from '@/state/weight.store';

interface NextBestActionProps {
  onAction: (actionType: string) => void;
}

interface NextAction {
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => void;
}

export const NextBestAction: React.FC<NextBestActionProps> = ({ onAction }) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { meals } = useMealStore();
  const { weights } = useWeightStore();
  const [action, setAction] = useState<NextAction | null>(null);

  useEffect(() => {
    generateNextBestAction();
  }, [user, meals, weights]);

  const generateNextBestAction = () => {
    const now = new Date();
    const hour = now.getHours();
    const lastMeal = meals[meals.length - 1];
    const lastMealTime = lastMeal ? new Date(lastMeal.timestamp) : null;
    const hoursSinceLastMeal = lastMealTime 
      ? (now.getTime() - lastMealTime.getTime()) / (1000 * 60 * 60) 
      : 24;

    const lastWeight = weights[weights.length - 1];
    const lastWeightTime = lastWeight ? new Date(lastWeight.timestamp) : null;
    const daysSinceLastWeight = lastWeightTime 
      ? (now.getTime() - lastWeightTime.getTime()) / (1000 * 60 * 60 * 24) 
      : 30;

    let nextAction: NextAction;

    // Morning (6-11 AM) - Focus on breakfast and planning
    if (hour >= 6 && hour < 11) {
      if (!lastMealTime || lastMealTime.getHours() < 6) {
        nextAction = {
          type: 'log_breakfast',
          title: 'Log Your Breakfast',
          subtitle: 'Start your day with a healthy meal',
          icon: 'breakfast-dining',
          color: theme.colors.brand.primary,
          action: () => onAction('log_breakfast'),
        };
      } else {
        nextAction = {
          type: 'view_plan',
          title: 'Check Your Meal Plan',
          subtitle: 'See what to eat for lunch',
          icon: 'restaurant-menu',
          color: theme.colors.brand.secondary,
          action: () => onAction('view_plan'),
        };
      }
    }
    // Afternoon (11 AM - 5 PM) - Focus on lunch and progress
    else if (hour >= 11 && hour < 17) {
      if (!lastMealTime || lastMealTime.getHours() < 11) {
        nextAction = {
          type: 'log_lunch',
          title: 'Log Your Lunch',
          subtitle: 'Keep your energy up with a balanced meal',
          icon: 'lunch-dining',
          color: theme.colors.brand.primary,
          action: () => onAction('log_lunch'),
        };
      } else {
        nextAction = {
          type: 'view_feedback',
          title: 'Check Your Progress',
          subtitle: 'See how you\'re doing today',
          icon: 'trending-up',
          color: theme.colors.brand.secondary,
          action: () => onAction('view_feedback'),
        };
      }
    }
    // Evening (5 PM - 10 PM) - Focus on dinner and summary
    else if (hour >= 17 && hour < 22) {
      if (!lastMealTime || lastMealTime.getHours() < 17) {
        nextAction = {
          type: 'log_dinner',
          title: 'Log Your Dinner',
          subtitle: 'End your day with a nutritious meal',
          icon: 'dinner-dining',
          color: theme.colors.brand.primary,
          action: () => onAction('log_dinner'),
        };
      } else {
        nextAction = {
          type: 'view_summary',
          title: 'View Daily Summary',
          subtitle: 'See your progress and get tomorrow\'s tip',
          icon: 'summarize',
          color: theme.colors.brand.secondary,
          action: () => onAction('view_summary'),
        };
      }
    }
    // Night (10 PM - 6 AM) - Focus on summary and planning
    else {
      nextAction = {
        type: 'view_summary',
        title: 'View Daily Summary',
        subtitle: 'See your progress and get tomorrow\'s tip',
        icon: 'summarize',
        color: theme.colors.brand.secondary,
        action: () => onAction('view_summary'),
      };
    }

    // Override based on user state
    if (hoursSinceLastMeal > 6) {
      nextAction = {
        type: 'log_meal',
        title: 'Log a Meal',
        subtitle: 'It\'s been a while since your last meal',
        icon: 'restaurant',
        color: theme.colors.brand.primary,
        action: () => onAction('log_meal'),
      };
    }

    // Check if weight logging is overdue
    if (daysSinceLastWeight > 7) {
      nextAction = {
        type: 'log_weight',
        title: 'Log Your Weight',
        subtitle: 'Track your progress with a weight update',
        icon: 'monitor-weight',
        color: theme.colors.brand.primary,
        action: () => onAction('log_weight'),
      };
    }

    setAction(nextAction);
  };

  if (!action) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
        <View style={styles.skeleton}>
          <View style={[styles.skeletonIcon, { backgroundColor: theme.colors.background.tertiary }]} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.background.tertiary }]} />
            <View style={[styles.skeletonSubtitle, { backgroundColor: theme.colors.background.tertiary }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}
      onPress={action.action}
      accessibilityRole="button"
      accessibilityLabel={action.title}
      accessibilityHint={action.subtitle}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
          <MaterialIcons
            name={action.icon as any}
            size={24}
            color={action.color}
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {action.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
            {action.subtitle}
          </Text>
        </View>
        
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme.colors.text.tertiary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 14,
    width: '80%',
    borderRadius: 4,
  },
});