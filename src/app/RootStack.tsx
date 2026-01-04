import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useCoachStore } from '@/state/coach.store';
import { PrivacyScreen } from '@/screens/Settings/PrivacyScreen';
import { TermsScreen } from '@/screens/Settings/TermsScreen';
import { SettingsScreen } from '@/screens/Settings/SettingsScreen';
import { UpgradeScreen } from '@/screens/Upgrade/UpgradeScreen';
import { StartScreen } from '@/screens/Start/StartScreen';
import { PlanScreen } from '@/screens/Plan/PlanScreen';
import { TodayScreen } from '@/screens/Today/TodayScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

const Stack = createStackNavigator();

export const RootStack: React.FC = () => {
  const { activeGoalId, activePlanId, weeklyPlans } = useCoachStore();
  const [initialRoute, setInitialRoute] = useState<string | undefined>(
    undefined
  );

  // Determine initial route based on user state
  useEffect(() => {
    const activePlan = weeklyPlans.find(plan => plan.id === activePlanId);
    const hasLockedPlan = activePlan?.status === 'locked';
    const route = hasLockedPlan
      ? 'Today'
      : activeGoalId
      ? 'Plan'
      : 'Start';
    setInitialRoute(route);
  }, [
    activeGoalId,
    activePlanId,
    weeklyPlans,
  ]);

  // Show loading state while determining initial route
  if (!initialRoute) {
    return <LoadingScreen message="Initializing..." />;
  }

  const navigatorKey = initialRoute;

  return (
    <Stack.Navigator
      key={navigatorKey}
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
      <Stack.Screen name="Start" component={StartScreen} />
      <Stack.Screen name="Plan" component={PlanScreen} />
      <Stack.Screen name="Today" component={TodayScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
    </Stack.Navigator>
  );
};
