// Toast notification utility for FIIT
import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export class Toast {
  // Show a toast notification
  static show(options: ToastOptions) {
    const { title, message, type = 'info' } = options;

    // For production, you'd use a proper toast library like react-native-toast-message
    // For now, we'll use Alert for consistency across platforms
    if (Platform.OS === 'web') {
      // Web fallback
      console.log(`[${type.toUpperCase()}]`, title || message);
    } else {
      Alert.alert(
        title || this.getDefaultTitle(type),
        message,
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    }
  }

  static success(message: string, title?: string) {
    this.show({ message, title, type: 'success' });
  }

  static error(message: string, title?: string) {
    this.show({ message, title: title || 'Error', type: 'error' });
  }

  static info(message: string, title?: string) {
    this.show({ message, title, type: 'info' });
  }

  static warning(message: string, title?: string) {
    this.show({ message, title, type: 'warning' });
  }

  private static getDefaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'info':
      default:
        return 'Info';
    }
  }

  // Friendly error messages for common scenarios
  static networkError() {
    this.error(
      "Couldn't reach the server. Please check your internet connection and try again."
    );
  }

  static aiError() {
    this.error(
      'AI service is temporarily unavailable. Please try again in a moment.'
    );
  }

  static foodServiceError() {
    this.error(
      "Couldn't analyze the meal. Try searching manually or try again later."
    );
  }

  static paywallError() {
    this.error(
      'There was a problem processing your subscription. Please try again or contact support.'
    );
  }

  static saved() {
    this.success('Saved successfully!');
  }

  static deleted() {
    this.success('Deleted successfully.');
  }
}
