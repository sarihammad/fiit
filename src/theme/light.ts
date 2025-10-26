import { tokens } from './tokens';

export const lightTheme = {
  colors: {
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: tokens.colors.neutral[50],
      tertiary: tokens.colors.neutral[100],
    },
    // Surface colors
    surface: {
      primary: '#ffffff',
      secondary: tokens.colors.neutral[50],
      tertiary: tokens.colors.neutral[100],
      elevated: '#ffffff',
    },
    // Text colors
    text: {
      primary: tokens.colors.neutral[900],
      secondary: tokens.colors.neutral[700],
      tertiary: tokens.colors.neutral[500],
      inverse: '#ffffff',
      disabled: tokens.colors.neutral[400],
    },
    // Border colors
    border: {
      primary: tokens.colors.neutral[200],
      secondary: tokens.colors.neutral[300],
      focus: tokens.colors.primary[500],
    },
    // Brand colors
    brand: {
      primary: tokens.colors.primary[600],
      secondary: tokens.colors.primary[500],
      accent: tokens.colors.primary[400],
    },
    // Semantic colors
    success: tokens.colors.success,
    warning: tokens.colors.warning,
    error: tokens.colors.error,
    // Interactive colors
    interactive: {
      primary: tokens.colors.primary[600],
      secondary: tokens.colors.neutral[600],
      disabled: tokens.colors.neutral[300],
      pressed: tokens.colors.primary[700],
    },
  },
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  typography: tokens.typography,
  elevation: tokens.elevation,
  animation: tokens.animation,
} as const;

export type LightTheme = typeof lightTheme;
