import React from 'react';
import { Modal, View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';
import { useTheme } from '@/providers/ThemeProvider';

interface AgeConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}

export const AgeConfirmationModal: React.FC<AgeConfirmationModalProps> = ({
  visible,
  onConfirm,
  onDecline,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onDecline}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.icon, { marginBottom: 24 }]}>🔞</Text>

          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Age Confirmation
          </Text>

          <Text
            style={[styles.introText, { color: theme.colors.text.secondary }]}
          >
            FIIT is a nutrition and weight loss coaching app designed for
            adults.
          </Text>

          <View
            style={[
              styles.section,
              {
                backgroundColor: theme.colors.warning[50],
                borderColor: theme.colors.warning[200],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="warning"
                size={20}
                color={theme.colors.warning[800]}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.warning[800] },
                ]}
              >
                Age Requirement
              </Text>
            </View>
            <Text style={[styles.text, { color: theme.colors.warning[700] }]}>
              You must be <Text style={styles.bold}>18 years or older</Text> to
              use FIIT. Our meal plans, calorie targets, and coaching are not
              designed for minors.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Why This Matters
            </Text>
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>
              Growing bodies have different nutritional needs than adults.
              Weight loss programs for minors should be supervised by healthcare
              professionals.
            </Text>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Health & Safety
            </Text>
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>
              FIIT is designed for generally healthy adults. If you have medical
              conditions, are pregnant, or taking medications, consult your
              doctor before starting any weight loss program.
            </Text>
          </View>

          <View
            style={[
              styles.disclaimerBox,
              {
                backgroundColor: theme.colors.brand.primary + '10',
                borderColor: theme.colors.brand.primary + '30',
              },
            ]}
          >
            <Text
              style={[
                styles.disclaimerText,
                { color: theme.colors.text.secondary },
              ]}
            >
              By confirming, you certify that you are 18 years or older and
              understand that FIIT provides general nutrition coaching, not
              medical advice.
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.buttonContainer,
            {
              backgroundColor: theme.colors.background.primary,
              borderTopColor: theme.colors.border.primary,
            },
          ]}
        >
          <Button
            title="I Am 18 or Older"
            onPress={onConfirm}
            variant="primary"
            size="large"
            fullWidth
            style={{ marginBottom: 12 }}
            accessibilityLabel="Confirm you are 18 or older"
          />
          <Button
            title="I Am Under 18"
            onPress={onDecline}
            variant="secondary"
            size="large"
            fullWidth
            accessibilityLabel="Decline - under 18"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 160, // Space for buttons
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
  },
  disclaimerBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
