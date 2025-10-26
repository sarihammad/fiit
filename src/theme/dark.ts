import { tokens } from './tokens';

export const darkTheme = {
  colors: {
    // Background colors
    background: {
      primary: tokens.colors.neutral[900],
      secondary: tokens.colors.neutral[800],
      tertiary: tokens.colors.neutral[700],
    },
    // Surface colors
    surface: {
      primary: tokens.colors.neutral[800],
      secondary: tokens.colors.neutral[700],
      tertiary: tokens.colors.neutral[600],
      elevated: tokens.colors.neutral[700],
    },
    // Text colors
    text: {
      primary: tokens.colors.neutral[50],
      secondary: tokens.colors.neutral[300],
      tertiary: tokens.colors.neutral[400],
      inverse: tokens.colors.neutral[900],
      disabled: tokens.colors.neutral[500],
    },
    // Border colors
    border: {
      primary: tokens.colors.neutral[700],
      secondary: tokens.colors.neutral[600],
      focus: tokens.colors.primary[400],
    },
    // Brand colors
    brand: {
      primary: tokens.colors.primary[400],
      secondary: tokens.colors.primary[500],
      accent: tokens.colors.primary[600],
    },
    // Semantic colors
    success: tokens.colors.success,
    warning: tokens.colors.warning,
    error: tokens.colors.error,
    // Interactive colors
    interactive: {
      primary: tokens.colors.primary[400],
      secondary: tokens.colors.neutral[400],
      disabled: tokens.colors.neutral[600],
      pressed: tokens.colors.primary[300],
    },
  },
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  typography: tokens.typography,
  elevation: tokens.elevation,
  animation: tokens.animation,
} as const;

export type DarkTheme = typeof darkTheme;
