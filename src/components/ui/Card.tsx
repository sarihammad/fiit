import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { DesignSystem } from "@/design-system";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof DesignSystem.spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  style,
  padding = "lg",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "default":
        return {
          backgroundColor: DesignSystem.colors.background.primary,
          borderRadius: DesignSystem.borderRadius.lg,
          padding: DesignSystem.spacing[padding],
          ...DesignSystem.shadows.sm,
        };
      case "elevated":
        return {
          backgroundColor: DesignSystem.colors.background.primary,
          borderRadius: DesignSystem.borderRadius.lg,
          padding: DesignSystem.spacing[padding],
          ...DesignSystem.shadows.md,
        };
      case "outlined":
        return {
          backgroundColor: DesignSystem.colors.background.primary,
          borderRadius: DesignSystem.borderRadius.lg,
          padding: DesignSystem.spacing[padding],
          borderWidth: 1,
          borderColor: DesignSystem.colors.border.primary,
        };
      default:
        return {
          backgroundColor: DesignSystem.colors.background.primary,
          borderRadius: DesignSystem.borderRadius.lg,
          padding: DesignSystem.spacing[padding],
          ...DesignSystem.shadows.sm,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return <View style={[styles.card, variantStyles, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    // Base card styles are applied via variantStyles
  },
});

export default Card;
