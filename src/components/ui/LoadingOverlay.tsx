import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
  style?: any;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  visible,
  style,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, style]}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.brand.primary}
          style={styles.spinner}
        />
        <Text
          style={[
            styles.message,
            { color: theme.colors.text.primary },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});
