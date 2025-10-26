import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { usePaywallStore } from '@/state/paywall.store';
import { HomeScreen } from '@/screens/Home/HomeScreen';
import { MealPlannerScreen } from '@/screens/Planner/MealPlannerScreen';
import { MealLogScreen } from '@/screens/Log/MealLogScreen';
import { WeightScreen } from '@/screens/Progress/WeightScreen';
import { SettingsScreen } from '@/screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const MainTabs: React.FC = () => {
  const { theme } = useTheme();
  const { isPro } = usePaywallStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.primary,
          borderTopColor: theme.colors.border.primary,
          borderTopWidth: 1,
          paddingBottom: 20,
          paddingTop: 8,
          height: 100,
        },
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} theme={theme} />
          ),
          tabBarAccessibilityLabel: 'Home Dashboard',
        }}
      />

      <Tab.Screen
        name="Planner"
        component={MealPlannerScreen}
        options={{
          tabBarLabel: 'Planner',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar" color={color} size={size} theme={theme} />
          ),
          tabBarAccessibilityLabel: 'Meal Planner',
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (!isPro) {
              e.preventDefault();
              navigation.navigate('Paywall' as any);
            }
          },
        })}
      />

      <Tab.Screen
        name="Log"
        component={MealLogScreen}
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="add" color={color} size={size} theme={theme} />
          ),
          tabBarAccessibilityLabel: 'Log Meals',
        }}
      />

      <Tab.Screen
        name="Progress"
        component={WeightScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chart" color={color} size={size} theme={theme} />
          ),
          tabBarAccessibilityLabel: 'Weight & Progress',
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" color={color} size={size} theme={theme} />
          ),
          tabBarAccessibilityLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Simple tab icon component (you can replace with actual icon library)
const TabIcon: React.FC<{
  name: string;
  color: string;
  size: number;
  theme: any;
}> = ({ name, color, size, theme }) => {
  const getIconSymbol = () => {
    switch (name) {
      case 'home':
        return 'home';
      case 'calendar':
        return 'event';
      case 'add':
        return 'add';
      case 'chart':
        return 'bar-chart';
      case 'settings':
        return 'settings';
      default:
        return 'circle';
    }
  };

  return (
    <View
      style={{
        width: size + 8,
        height: size + 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          color === theme.colors.brand.primary
            ? 'rgba(34, 197, 94, 0.15)'
            : 'transparent',
        borderRadius: (size + 8) / 2,
        marginBottom: 2,
      }}
    >
      <Text
        style={{
          fontSize: size * 0.8,
          color:
            color === theme.colors.brand.primary
              ? theme.colors.brand.primary
              : color,
          fontWeight: 'normal',
        }}
      >
        <MaterialIcons
          name={getIconSymbol() as keyof typeof MaterialIcons.glyphMap}
          size={size}
          color={color}
        />
      </Text>
    </View>
  );
};
