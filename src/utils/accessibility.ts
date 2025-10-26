import { Platform } from 'react-native';

export const accessibility = {
  // Ensure minimum touch target size (WCAG AA)
  minTouchTarget: 44,
  
  // Generate accessibility labels
  generateLabel: (action: string, context?: string) => {
    return context ? `${action} ${context}` : action;
  },
  
  // Check if running on accessible platform
  isAccessibilityEnabled: () => {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  },
  
  // Generate hint text for complex interactions
  generateHint: (action: string, result: string) => {
    return `Double tap to ${action}. ${result}`;
  },
};

// Haptic feedback utility
export const haptics = {
  light: () => {
    if (Platform.OS === 'ios') {
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available
      }
    }
  },
  
  medium: () => {
    if (Platform.OS === 'ios') {
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics not available
      }
    }
  },
  
  heavy: () => {
    if (Platform.OS === 'ios') {
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        // Haptics not available
      }
    }
  },
  
  success: () => {
    if (Platform.OS === 'ios') {
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }
    }
  },
  
  error: () => {
    if (Platform.OS === 'ios') {
      try {
        const { Haptics } = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        // Haptics not available
      }
    }
  },
};
