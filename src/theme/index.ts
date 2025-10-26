export * from './tokens';
export * from './light';
export * from './dark';

import { lightTheme } from './light';
import { darkTheme } from './dark';

export type Theme = typeof lightTheme;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeMode = keyof typeof themes | 'system';
