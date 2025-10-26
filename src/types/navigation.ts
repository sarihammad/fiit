// Navigation types for React Navigation
import { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Paywall: undefined;
  Auth: undefined;
};

// Onboarding Stack Navigator
export type OnboardingStackParamList = {
  Landing: undefined;
  Biometrics: undefined;
  Gender: undefined;
  Goal: undefined;
  DietPreferences: undefined;
  Habits: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Log: undefined;
  Planner: undefined;
  Progress: undefined;
  Settings: undefined;
};

// Home Stack Navigator
export type HomeStackParamList = {
  HomeScreen: undefined;
  AnalyzerScreen: undefined;
  CoachScreen: undefined;
  TasksScreen: undefined;
};

// Log Stack Navigator
export type LogStackParamList = {
  MealLogScreen: undefined;
  ManualEntry: undefined;
  FoodSearch: undefined;
};

// Planner Stack Navigator
export type PlannerStackParamList = {
  MealPlannerScreen: undefined;
  MealPlanDetail: { planId: string };
  ShoppingList: { planId: string };
};

// Progress Stack Navigator
export type ProgressStackParamList = {
  ProgressScreen: undefined;
  WeightScreen: undefined;
  InsightsScreen: undefined;
};

// Settings Stack Navigator
export type SettingsStackParamList = {
  SettingsScreen: undefined;
  AISettingsScreen: undefined;
  NotificationsScreen: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  SignInScreen: undefined;
  SignUpScreen: undefined;
  ForgotPasswordScreen: undefined;
};

// Deep link types
export type DeepLinkParams = {
  screen?: string;
  params?: Record<string, any>;
};

// Navigation prop types
export type RootStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<RootStackParamList>;
export type OnboardingStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<OnboardingStackParamList>;
export type MainTabNavigationProp =
  import('@react-navigation/bottom-tabs').BottomTabNavigationProp<MainTabParamList>;
export type HomeStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<HomeStackParamList>;
export type LogStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<LogStackParamList>;
export type PlannerStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<PlannerStackParamList>;
export type ProgressStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<ProgressStackParamList>;
export type SettingsStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<SettingsStackParamList>;
export type AuthStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<AuthStackParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> =
  import('@react-navigation/native').RouteProp<RootStackParamList, T>;
export type OnboardingStackRouteProp<T extends keyof OnboardingStackParamList> =
  import('@react-navigation/native').RouteProp<OnboardingStackParamList, T>;
export type MainTabRouteProp<T extends keyof MainTabParamList> =
  import('@react-navigation/native').RouteProp<MainTabParamList, T>;
export type HomeStackRouteProp<T extends keyof HomeStackParamList> =
  import('@react-navigation/native').RouteProp<HomeStackParamList, T>;
export type LogStackRouteProp<T extends keyof LogStackParamList> =
  import('@react-navigation/native').RouteProp<LogStackParamList, T>;
export type PlannerStackRouteProp<T extends keyof PlannerStackParamList> =
  import('@react-navigation/native').RouteProp<PlannerStackParamList, T>;
export type ProgressStackRouteProp<T extends keyof ProgressStackParamList> =
  import('@react-navigation/native').RouteProp<ProgressStackParamList, T>;
export type SettingsStackRouteProp<T extends keyof SettingsStackParamList> =
  import('@react-navigation/native').RouteProp<SettingsStackParamList, T>;
export type AuthStackRouteProp<T extends keyof AuthStackParamList> =
  import('@react-navigation/native').RouteProp<AuthStackParamList, T>;

