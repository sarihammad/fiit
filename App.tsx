import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { PurchasesProvider } from '@/providers/PurchasesProvider';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';
import { RootStack } from '@/app/RootStack';
import { setupApp } from '@/utils/setup';
import { NotificationService } from '@/services/notifications';
import { AgeConfirmationModal } from '@/components/AgeConfirmationModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MedicalDisclaimerModal } from '@/components/MedicalDisclaimerModal';
import { useComplianceStore } from '@/state/compliance.store';

// Initialize app setup
setupApp();

function App() {
  const { hasConfirmedAge, hasAcceptedDisclaimer } = useComplianceStore();

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
              <PurchasesProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  {hasConfirmedAge && hasAcceptedDisclaimer ? (
                    <RootStack />
                  ) : (
                    <LoadingScreen message="Confirm age & medical disclaimer" />
                  )}
                  <ComplianceGate />
                </NavigationContainer>
              </PurchasesProvider>
            </AuthProvider>
          </ThemeProvider>
        </AnalyticsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const ComplianceGate: React.FC = () => {
  const {
    hasConfirmedAge,
    hasAcceptedDisclaimer,
    confirmAge,
    acceptDisclaimer,
  } = useComplianceStore();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (hasConfirmedAge && !hasAcceptedDisclaimer) {
      setShowDisclaimer(true);
    }
  }, [hasAcceptedDisclaimer, hasConfirmedAge]);

  const handleAgeDecline = () => {
    Alert.alert(
      'Age requirement',
      'You must be 18 years or older to use FIIT, so we unfortunately cannot continue.'
    );
  };

  const handleDisclaimerDecline = () => {
    Alert.alert(
      'Disclaimer required',
      'Please accept the medical disclaimer to continue using FIIT.'
    );
  };

  return (
    <>
      <AgeConfirmationModal
        visible={!hasConfirmedAge}
        onConfirm={() => {
          confirmAge();
          if (!hasAcceptedDisclaimer) {
            setShowDisclaimer(true);
          }
        }}
        onDecline={handleAgeDecline}
      />
      <MedicalDisclaimerModal
        visible={
          showDisclaimer && hasConfirmedAge && !hasAcceptedDisclaimer
        }
        onAccept={() => {
          acceptDisclaimer();
          setShowDisclaimer(false);
        }}
        onDecline={handleDisclaimerDecline}
      />
    </>
  );
};

// Register the main component
AppRegistry.registerComponent('main', () => App);

export default App;
