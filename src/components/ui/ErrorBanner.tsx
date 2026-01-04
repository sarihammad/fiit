import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { DesignSystem } from "@/design-system";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onRetry,
  onDismiss,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <MaterialIcons
          name="error-outline"
          size={20}
          color={DesignSystem.colors.error[500]}
          style={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
      </View>

      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.actionButton}>
            <Text style={styles.actionText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.actionButton}>
            <MaterialIcons
              name="close"
              size={16}
              color={DesignSystem.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.error[50],
    borderLeftWidth: 4,
    borderLeftColor: DesignSystem.colors.error[500],
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.md,
    marginVertical: DesignSystem.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: DesignSystem.spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: DesignSystem.typography.fontSize.sm,
    color: DesignSystem.colors.error[700],
    fontWeight: DesignSystem.typography.fontWeight.medium,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
  },
  actionText: {
    fontSize: DesignSystem.typography.fontSize.sm,
    color: DesignSystem.colors.error[600],
    fontWeight: DesignSystem.typography.fontWeight.semibold,
  },
});

export default ErrorBanner;
