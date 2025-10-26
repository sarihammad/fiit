import React, { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';
import { AIProvider } from '@/providers/AIProvider';
import { RootStack } from '@/app/RootStack';
import { setupApp } from '@/utils/setup';
import { NotificationService } from '@/services/notifications';

// Initialize app setup
setupApp();

function App() {
  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        await NotificationService.initialize();
        console.log('[App] Notification service initialized');
      } catch (error) {
        console.error(
          '[App] Failed to initialize notification service:',
          error
        );
      }
    };

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('[App] Notification received:', notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('[App] Notification response received:', response);

        // Handle deep linking based on notification data
        const data = response.notification.request.content.data;
        if (data?.action) {
          // This would be handled by the navigation system
          // For now, just log the action
          console.log('[App] Deep link action:', data.action);
        }
      });

    initializeNotifications();

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AnalyticsProvider>
          <ThemeProvider>
            <AuthProvider>
              <AIProvider>
                <PurchasesProvider>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <RootStack />
                  </NavigationContainer>
                </PurchasesProvider>
              </AIProvider>
            </AuthProvider>
          </ThemeProvider>
        </AnalyticsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Register the main component
AppRegistry.registerComponent('main', () => App);

export default App;
