import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GoalScreen } from '@/screens/Onboarding/GoalScreen';
import { GenderScreen } from '@/screens/Onboarding/GenderScreen';
import { BiometricsScreen } from '@/screens/Onboarding/BiometricsScreen';
import { DietPreferencesScreen } from '@/screens/Onboarding/DietPreferencesScreen';

const Stack = createStackNavigator();

export const OnboardingStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Goal"
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
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="Biometrics" component={BiometricsScreen} />
      <Stack.Screen name="DietPreferences" component={DietPreferencesScreen} />
    </Stack.Navigator>
  );
};
