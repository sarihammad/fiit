import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';

interface ErrorBannerProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: any;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  title,
  message,
  onRetry,
  onDismiss,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.error?.[50] || '#fef2f2',
          borderColor: theme.colors.error?.[200] || '#fecaca',
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons
          name="error-outline"
          size={20}
          color={theme.colors.error?.[500] || '#ef4444'}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.error?.[700] || '#b91c1c' },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              { color: theme.colors.error?.[600] || '#dc2626' },
            ]}
          >
            {message}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.error?.[500] || '#ef4444' },
            ]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          >
            <MaterialIcons
              name="close"
              size={20}
              color={theme.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    margin: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Common error patterns
export const NetworkErrorBanner: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <ErrorBanner
    title="Connection Error"
    message="Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

export const AuthErrorBanner: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <ErrorBanner
    title="Authentication Error"
    message="Your session has expired. Please sign in again."
    onRetry={onRetry}
  />
);

export const PhotoErrorBanner: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <ErrorBanner
    title="Photo Analysis Failed"
    message="We couldn't analyze your photo. Please try again or add the meal manually."
    onRetry={onRetry}
  />
);
