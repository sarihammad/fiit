import { NavigationProp, RouteProp } from '@react-navigation/native';

// Root stack navigation types
export type RootStackParamList = {
  Landing: undefined;
  Onboarding: undefined;
  Notifications: undefined;
  Auth: undefined;
  Paywall: undefined;
  Privacy: undefined;
  Terms: undefined;
  MainTabs: undefined;
};

// Onboarding stack navigation types
export type OnboardingStackParamList = {
  Goal: undefined;
  Gender: undefined;
  Biometrics: undefined;
  DietPreferences: undefined;
};

// Main tabs navigation types
export type MainTabsParamList = {
  Home: undefined;
  Planner: undefined;
  Log: undefined;
  Progress: undefined;
  Settings: undefined;
};

// Navigation prop types
export type RootStackNavigationProp = NavigationProp<RootStackParamList>;
export type OnboardingStackNavigationProp =
  NavigationProp<OnboardingStackParamList>;
export type MainTabsNavigationProp = NavigationProp<MainTabsParamList>;

// Route prop types
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
export type OnboardingStackRouteProp<T extends keyof OnboardingStackParamList> =
  RouteProp<OnboardingStackParamList, T>;
export type MainTabsRouteProp<T extends keyof MainTabsParamList> = RouteProp<
  MainTabsParamList,
  T
>;

// Navigation utilities
export class NavigationUtils {
  // Check if user can access premium features
  static canAccessPremium(isPro: boolean): boolean {
    return isPro;
  }

  // Get initial route based on user state
  static getInitialRoute(
    isOnboardingCompleted: boolean,
    isAuthenticated: boolean,
    isPro: boolean
  ): keyof RootStackParamList {
    if (!isOnboardingCompleted) {
      return 'Onboarding';
    }

    // Skip auth for now (optional feature)
    // if (!isAuthenticated) {
    //   return 'Auth';
    // }

    return 'MainTabs';
  }

  // Get onboarding step route
  static getOnboardingStepRoute(step: number): keyof OnboardingStackParamList {
    const routes: (keyof OnboardingStackParamList)[] = [
      'Goal',
      'Gender',
      'Biometrics',
      'DietPreferences',
    ];
    return routes[step] || 'Goal';
  }

  // Get onboarding step index
  static getOnboardingStepIndex(route: keyof OnboardingStackParamList): number {
    const routes: (keyof OnboardingStackParamList)[] = [
      'Goal',
      'Gender',
      'Biometrics',
      'DietPreferences',
    ];
    return routes.indexOf(route);
  }

  // Check if onboarding is complete
  static isOnboardingComplete(
    goal?: string,
    gender?: string,
    biometrics?: any,
    dietInfo?: any
  ): boolean {
    return !!(goal && gender && biometrics && dietInfo);
  }

  // Get next onboarding step
  static getNextOnboardingStep(currentStep: number): number {
    return Math.min(currentStep + 1, 4); // 0-4 steps (5 total)
  }

  // Get previous onboarding step
  static getPreviousOnboardingStep(currentStep: number): number {
    return Math.max(currentStep - 1, 0);
  }

  // Check if onboarding step is valid
  static isValidOnboardingStep(step: number): boolean {
    return step >= 0 && step <= 4;
  }

  // Get onboarding progress percentage
  static getOnboardingProgress(currentStep: number): number {
    return ((currentStep + 1) / 5) * 100; // 5 total steps
  }

  // Get tab index from route name
  static getTabIndex(routeName: keyof MainTabsParamList): number {
    const routes: (keyof MainTabsParamList)[] = [
      'Home',
      'Planner',
      'Log',
      'Progress',
      'Settings',
    ];
    return routes.indexOf(routeName);
  }

  // Get route name from tab index
  static getTabRoute(index: number): keyof MainTabsParamList {
    const routes: (keyof MainTabsParamList)[] = [
      'Home',
      'Planner',
      'Log',
      'Progress',
      'Settings',
    ];
    return routes[index] || 'Home';
  }

  // Check if route requires premium access
  static requiresPremium(routeName: string): boolean {
    const premiumRoutes = ['Planner'];
    return premiumRoutes.includes(routeName);
  }

  // Get route display name
  static getRouteDisplayName(routeName: string): string {
    const displayNames: Record<string, string> = {
      Landing: 'Welcome',
      Onboarding: 'Setup',
      Notifications: 'Notifications',
      Auth: 'Sign In',
      Paywall: 'Upgrade',
      Privacy: 'Privacy Policy',
      Terms: 'Terms of Service',
      MainTabs: 'Home',
      Home: 'Home',
      Planner: 'Meal Planner',
      Log: 'Log Meals',
      Progress: 'Weight & Progress',
      Settings: 'Settings',
      Goal: 'Your Goal',
      Gender: 'Gender',
      Biometrics: 'Body Stats',
      DietPreferences: 'Diet Preferences',
    };

    return displayNames[routeName] || routeName;
  }

  // Get route icon name
  static getRouteIcon(routeName: string): string {
    const icons: Record<string, string> = {
      Home: 'home',
      Planner: 'calendar',
      Log: 'add',
      Progress: 'chart',
      Settings: 'settings',
      Goal: 'target',
      Gender: 'person',
      Biometrics: 'fitness',
      DietPreferences: 'restaurant',
    };

    return icons[routeName] || 'help';
  }

  // Check if route is a modal
  static isModalRoute(routeName: string): boolean {
    const modalRoutes = ['Paywall', 'Auth', 'Privacy', 'Terms'];
    return modalRoutes.includes(routeName);
  }

  // Check if route is a tab
  static isTabRoute(routeName: string): boolean {
    const tabRoutes = ['Home', 'Planner', 'Log', 'Progress', 'Settings'];
    return tabRoutes.includes(routeName);
  }

  // Get route animation type
  static getRouteAnimation(routeName: string): 'slide' | 'fade' | 'none' {
    if (this.isModalRoute(routeName)) {
      return 'fade';
    }

    if (this.isTabRoute(routeName)) {
      return 'none';
    }

    return 'slide';
  }
}
