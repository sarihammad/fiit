import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { DesignSystem } from "@/design-system";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "small" | "medium" | "large";

interface ButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "md",
  isLoading = false,
  isDisabled = false,
  icon,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePress = (event: GestureResponderEvent) => {
    if (isDisabled || isLoading) return;

    // Haptic feedback
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: DesignSystem.animation.fast,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: DesignSystem.animation.fast,
        useNativeDriver: true,
      }),
    ]).start();

    onPress(event);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: DesignSystem.colors.primary[500],
          textColor: DesignSystem.colors.text.inverse,
        };
      case "secondary":
        return {
          backgroundColor: DesignSystem.colors.secondary[100],
          textColor: DesignSystem.colors.secondary[700],
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: DesignSystem.colors.primary[500],
          borderWidth: 1,
          textColor: DesignSystem.colors.primary[500],
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          textColor: DesignSystem.colors.primary[500],
        };
      case "destructive":
        return {
          backgroundColor: DesignSystem.colors.error[500],
          textColor: DesignSystem.colors.text.inverse,
        };
      default:
        return {
          backgroundColor: DesignSystem.colors.primary[500],
          textColor: DesignSystem.colors.text.inverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: DesignSystem.spacing.sm,
          paddingHorizontal: DesignSystem.spacing.md,
          fontSize: DesignSystem.typography.fontSize.sm,
        };
      case "md":
      case "medium":
        return {
          paddingVertical: DesignSystem.spacing.md,
          paddingHorizontal: DesignSystem.spacing.lg,
          fontSize: DesignSystem.typography.fontSize.md,
        };
      case "lg":
      case "large":
        return {
          paddingVertical: DesignSystem.spacing.lg,
          paddingHorizontal: DesignSystem.spacing.xl,
          fontSize: DesignSystem.typography.fontSize.lg,
        };
      default:
        return {
          paddingVertical: DesignSystem.spacing.md,
          paddingHorizontal: DesignSystem.spacing.lg,
          fontSize: DesignSystem.typography.fontSize.md,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            borderWidth: variantStyles.borderWidth,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          isDisabled && styles.disabledButton,
          style,
        ]}
        disabled={isDisabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator
            color={variantStyles.textColor}
            size={size === "sm" || size === "small" ? "small" : "large"}
          />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text
              style={[
                styles.buttonText,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignSystem.borderRadius.md,
    minHeight: 44, // Ensure minimum hit target for accessibility
  },
  buttonText: {
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Button;
