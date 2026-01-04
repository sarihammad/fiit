import { NavigationProp, RouteProp } from '@react-navigation/native';

// Root stack navigation types
export type RootStackParamList = {
  Start: undefined;
  Plan: undefined;
  Today: undefined;
  Settings: undefined;
  Upgrade: undefined;
  Privacy: undefined;
  Terms: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = NavigationProp<RootStackParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;

// Navigation utilities
// Navigation utilities are deprecated; keep this file to centralize types.
