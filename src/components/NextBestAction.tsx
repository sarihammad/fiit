// Next Best Action component with dynamic feedback service integration
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import {
  FeedbackService,
  FeedbackContext,
  NutritionData,
} from '@/services/feedback';

type ActionType =
  | 'log_meal'
  | 'plan_meal'
  | 'add_weight'
  | 'view_feedback'
  | 'exercise';

interface NextBestActionProps {
  context: FeedbackContext;
  nutritionData: NutritionData;
  onPress: (actionType: ActionType) => void;
  isLoading?: boolean;
  lastMealTime?: Date;
}

const actionConfig = {
  log_meal: {
    icon: 'photo-camera' as keyof typeof MaterialIcons.glyphMap,
    gradient: ['#10B981', '#059669'],
  },
  plan_meal: {
    icon: 'restaurant' as keyof typeof MaterialIcons.glyphMap,
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  add_weight: {
    icon: 'monitor-weight' as keyof typeof MaterialIcons.glyphMap,
    gradient: ['#F59E0B', '#D97706'],
  },
  view_feedback: {
    icon: 'tips-and-updates' as keyof typeof MaterialIcons.glyphMap,
    gradient: ['#3B82F6', '#2563EB'],
  },
  exercise: {
    icon: 'fitness-center' as keyof typeof MaterialIcons.glyphMap,
    gradient: ['#EF4444', '#DC2626'],
  },
};

export const NextBestAction: React.FC<NextBestActionProps> = ({
  context,
  nutritionData,
  onPress,
  isLoading = false,
  lastMealTime,
}) => {
  const { theme } = useTheme();

  // Generate the next best action based on context
  const nextAction = FeedbackService.generateNextBestAction(
    context,
    nutritionData,
    lastMealTime
  );

  const config = actionConfig[nextAction.actionType as ActionType];
  const priorityColors = {
    high: theme?.colors?.error?.[500] || '#ef4444',
    medium: theme?.colors?.warning?.[500] || '#f59e0b',
    low: theme?.colors?.success?.[500] || '#22c55e',
  };

  const handlePress = () => {
    onPress(nextAction.actionType as ActionType);
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme?.colors?.surface?.primary || '#ffffff' },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={theme?.colors?.brand?.primary || '#22c55e'}
        />
        <Text
          style={[
            styles.loadingText,
            { color: theme?.colors?.text?.secondary || '#666666' },
          ]}
        >
          Loading next action...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme?.colors?.surface?.primary || '#ffffff',
          borderColor: priorityColors[nextAction.priority],
          borderWidth: nextAction.priority === 'high' ? 2 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={config.icon}
            size={24}
            color={theme?.colors?.brand?.primary || '#22c55e'}
          />
          {nextAction.priority === 'high' && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors.high },
              ]}
            >
              <Text style={styles.priorityText}>!</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme?.colors?.text?.primary || '#000000' },
            ]}
          >
            {nextAction.title}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme?.colors?.text?.secondary || '#666666' },
            ]}
          >
            {nextAction.description}
          </Text>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme?.colors?.text?.secondary || '#666666'}
        />
      </View>

      {/* Progress indicator for high priority actions */}
      {nextAction.priority === 'high' && (
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme?.colors?.surface?.secondary || '#f8fafc' },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: priorityColors.high, width: '100%' },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Static component for specific actions (backward compatibility)
interface StaticNextBestActionProps {
  actionType: ActionType;
  title: string;
  subtitle: string;
  onPress: () => void;
  isLoading?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export const StaticNextBestAction: React.FC<StaticNextBestActionProps> = ({
  actionType,
  title,
  subtitle,
  onPress,
  isLoading = false,
  priority = 'medium',
}) => {
  const { theme } = useTheme();
  const config = actionConfig[actionType];
  const priorityColors = {
    high: theme?.colors?.error?.[500] || '#ef4444',
    medium: theme?.colors?.warning?.[500] || '#f59e0b',
    low: theme?.colors?.success?.[500] || '#22c55e',
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme?.colors?.surface?.primary || '#ffffff' },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={theme?.colors?.brand?.primary || '#22c55e'}
        />
        <Text
          style={[
            styles.loadingText,
            { color: theme?.colors?.text?.secondary || '#666666' },
          ]}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme?.colors?.surface?.primary || '#ffffff',
          borderColor: priorityColors[priority],
          borderWidth: priority === 'high' ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name={config.icon}
            size={24}
            color={theme?.colors?.brand?.primary || '#22c55e'}
          />
          {priority === 'high' && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: priorityColors.high },
              ]}
            >
              <Text style={styles.priorityText}>!</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme?.colors?.text?.primary || '#000000' },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme?.colors?.text?.secondary || '#666666' },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={24}
          color={theme?.colors?.text?.secondary || '#666666'}
        />
      </View>

      {priority === 'high' && (
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme?.colors?.surface?.secondary || '#f8fafc' },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: priorityColors.high, width: '100%' },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  priorityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  loadingText: {
    fontSize: 14,
    marginLeft: 12,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
