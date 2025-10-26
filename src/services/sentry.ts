import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Initialize Sentry
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: false, // Don't send errors in development
    debug: __DEV__,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
    release: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    beforeSend(event) {
      // Filter out development errors
      if (__DEV__) {
        return null;
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        platform: Platform.OS,
        app: 'fiit',
      };

      return event;
    },
  });
}

// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry, but something unexpected happened. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Utility functions for Sentry
export const SentryUtils = {
  /**
   * Capture an exception
   */
  captureException: (error: Error, context?: any) => {
    Sentry.captureException(error, context);
  },

  /**
   * Capture a message
   */
  captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level);
  },

  /**
   * Set user context
   */
  setUser: (user: { id: string; email?: string; username?: string }) => {
    Sentry.setUser(user);
  },

  /**
   * Set custom context
   */
  setContext: (key: string, context: any) => {
    Sentry.setContext(key, context);
  },

  /**
   * Add breadcrumb
   */
  addBreadcrumb: (breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: any;
  }) => {
    Sentry.addBreadcrumb(breadcrumb);
  },

  /**
   * Set tag
   */
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  /**
   * Clear user context
   */
  clearUser: () => {
    Sentry.setUser(null);
  },
};

// Error boundary styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    color: '#666666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
