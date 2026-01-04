// Navigation types for React Navigation

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
export type RootStackNavigationProp =
  import('@react-navigation/stack').StackNavigationProp<RootStackParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> =
  import('@react-navigation/native').RouteProp<RootStackParamList, T>;
