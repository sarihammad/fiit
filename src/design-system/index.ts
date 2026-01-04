// Design System - FIIT
// Production-ready design tokens and components

export const DesignSystem = {
  // Spacing scale (8px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // Typography scale
  typography: {
    fontFamily: {
      regular: "System",
      medium: "System",
      semibold: "System",
      bold: "System",
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      display: 40,
    },
    lineHeight: {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 28,
      xl: 32,
      xxl: 36,
      xxxl: 44,
      display: 48,
    },
    fontWeight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  // Color palette
  colors: {
    // Primary brand colors
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Main brand color
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },

    // Secondary colors
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },

    // Success colors
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },

    // Error colors
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },

    // Warning colors
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
    },

    // Neutral colors
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
    },

    // Semantic colors
    background: {
      primary: "#ffffff",
      secondary: "#f8fafc",
      tertiary: "#f1f5f9",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      tertiary: "#94a3b8",
      inverse: "#ffffff",
    },
    border: {
      primary: "#e2e8f0",
      secondary: "#cbd5e1",
      focus: "#0ea5e9",
    },
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Breakpoints (for responsive design)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const;

// Component variants
export const ComponentVariants = {
  button: {
    primary: {
      backgroundColor: DesignSystem.colors.primary[500],
      color: DesignSystem.colors.text.inverse,
      borderRadius: DesignSystem.borderRadius.md,
      paddingVertical: DesignSystem.spacing.md,
      paddingHorizontal: DesignSystem.spacing.lg,
    },
    secondary: {
      backgroundColor: DesignSystem.colors.secondary[100],
      color: DesignSystem.colors.secondary[700],
      borderRadius: DesignSystem.borderRadius.md,
      paddingVertical: DesignSystem.spacing.md,
      paddingHorizontal: DesignSystem.spacing.lg,
    },
    outline: {
      backgroundColor: "transparent",
      color: DesignSystem.colors.primary[500],
      borderWidth: 1,
      borderColor: DesignSystem.colors.primary[500],
      borderRadius: DesignSystem.borderRadius.md,
      paddingVertical: DesignSystem.spacing.md,
      paddingHorizontal: DesignSystem.spacing.lg,
    },
  },

  card: {
    default: {
      backgroundColor: DesignSystem.colors.background.primary,
      borderRadius: DesignSystem.borderRadius.lg,
      padding: DesignSystem.spacing.lg,
      ...DesignSystem.shadows.sm,
    },
    elevated: {
      backgroundColor: DesignSystem.colors.background.primary,
      borderRadius: DesignSystem.borderRadius.lg,
      padding: DesignSystem.spacing.lg,
      ...DesignSystem.shadows.md,
    },
  },

  input: {
    default: {
      backgroundColor: DesignSystem.colors.background.primary,
      borderWidth: 1,
      borderColor: DesignSystem.colors.border.primary,
      borderRadius: DesignSystem.borderRadius.md,
      paddingVertical: DesignSystem.spacing.md,
      paddingHorizontal: DesignSystem.spacing.md,
      fontSize: DesignSystem.typography.fontSize.md,
      color: DesignSystem.colors.text.primary,
    },
    focus: {
      borderColor: DesignSystem.colors.border.focus,
      borderWidth: 2,
    },
    error: {
      borderColor: DesignSystem.colors.error[500],
      borderWidth: 2,
    },
  },
} as const;

// Utility functions
export const DesignUtils = {
  // Get spacing value
  spacing: (size: keyof typeof DesignSystem.spacing) =>
    DesignSystem.spacing[size],

  // Get color value
  color: (color: string) => {
    const keys = color.split(".");
    let value: any = DesignSystem.colors;
    for (const key of keys) {
      value = value[key];
    }
    return value;
  },

  // Get typography style
  typography: (
    variant: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl" | "display",
  ) => ({
    fontSize: DesignSystem.typography.fontSize[variant],
    lineHeight: DesignSystem.typography.lineHeight[variant],
    fontWeight: DesignSystem.typography.fontWeight.regular,
  }),

  // Get shadow style
  shadow: (size: "sm" | "md" | "lg") => DesignSystem.shadows[size],

  // Get border radius
  radius: (size: keyof typeof DesignSystem.borderRadius) =>
    DesignSystem.borderRadius[size],
};

export default DesignSystem;

