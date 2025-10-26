import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useOnboardingStore } from '@/state/onboarding.store';
import { useAuthStore } from '@/state/auth.store';
import { usePaywallStore } from '@/state/paywall.store';
import { usePurchases } from '@/providers/PurchasesProvider';
import { NavigationUtils } from '@/utils/navigation';
import { LandingScreen } from '@/screens/LandingScreen';
import { OnboardingStack } from './OnboardingStack';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { SignInScreen } from '@/screens/Auth/SignInScreen';
import { PaywallScreen } from '@/screens/Paywall/PaywallScreen';
import { PrivacyScreen } from '@/screens/Settings/PrivacyScreen';
import { TermsScreen } from '@/screens/Settings/TermsScreen';
import { MainTabs } from './MainTabs';
import { LoadingScreen } from '@/components/LoadingScreen';

const Stack = createStackNavigator();

export const RootStack: React.FC = () => {
  const { isCompleted: isOnboardingCompleted } = useOnboardingStore();
  const { isAuthenticated, didSkip, isLoading: authLoading } = useAuthStore();
  const { isPro } = usePaywallStore();
  const { isConfigured, isLoading: purchasesLoading } = usePurchases();
  const [initialRoute, setInitialRoute] = useState<string | undefined>(
    undefined
  );

  // Determine initial route based on user state
  useEffect(() => {
    if (!isConfigured || purchasesLoading || authLoading) return;

    const route = NavigationUtils.getInitialRoute(
      isOnboardingCompleted,
      isAuthenticated || didSkip,
      isPro
    );
    setInitialRoute(route);
  }, [
    isOnboardingCompleted,
    isAuthenticated,
    didSkip,
    isPro,
    isConfigured,
    purchasesLoading,
    authLoading,
  ]);

  // Show loading state while determining initial route
  if (!initialRoute || !isConfigured || purchasesLoading || authLoading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingStack} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Auth" component={SignInScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
};
