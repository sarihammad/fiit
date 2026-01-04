import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { DesignSystem } from "@/design-system";
import { Button } from "./Button";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

interface EmptyStateProps {
  icon?: MaterialIconName;
  title: string;
  description?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "inbox",
  title,
  description,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={icon}
          size={48}
          color={DesignSystem.colors.neutral[400]}
        />
      </View>

      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {actionText && onActionPress && (
        <View style={styles.actionContainer}>
          <Button
            title={actionText}
            onPress={onActionPress}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.xxl,
  },
  iconContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  title: {
    fontSize: DesignSystem.typography.fontSize.xl,
    fontWeight: DesignSystem.typography.fontWeight.semibold,
    color: DesignSystem.colors.text.primary,
    textAlign: "center",
    marginBottom: DesignSystem.spacing.sm,
  },
  description: {
    fontSize: DesignSystem.typography.fontSize.md,
    color: DesignSystem.colors.text.secondary,
    textAlign: "center",
    lineHeight: DesignSystem.typography.lineHeight.md,
    marginBottom: DesignSystem.spacing.xl,
  },
  actionContainer: {
    marginTop: DesignSystem.spacing.md,
  },
});

export default EmptyState;
