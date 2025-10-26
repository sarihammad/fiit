import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';

interface GuaranteeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const GuaranteeModal: React.FC<GuaranteeModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Our 30-Day Guarantee
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
              We're so confident in our AI-powered nutrition system that we guarantee you'll lose 7 lbs in 30 days if you follow your personalized plan.
            </Text>
            
            <Text style={[styles.subtitle, { color: theme.colors.text.primary }]}>
              How it works:
            </Text>
            
            <View style={styles.stepsList}>
              <Text style={[styles.step, { color: theme.colors.text.secondary }]}>
                1. Log your meals daily with our AI camera
              </Text>
              <Text style={[styles.step, { color: theme.colors.text.secondary }]}>
                2. Follow your personalized meal plans
              </Text>
              <Text style={[styles.step, { color: theme.colors.text.secondary }]}>
                3. Track your progress weekly
              </Text>
              <Text style={[styles.step, { color: theme.colors.text.secondary }]}>
                4. If you don't lose 7 lbs, get a full refund
              </Text>
            </View>
            
            <Text style={[styles.note, { color: theme.colors.text.tertiary }]}>
              * Guarantee applies to users who log meals daily and follow their meal plans. Refund processed within 48 hours of request.
            </Text>
          </View>
          
          <View style={styles.footer}>
            <Button
              title="Got it"
              onPress={onClose}
              variant="primary"
              size="medium"
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepsList: {
    marginBottom: 20,
  },
  step: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  note: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    width: '100%',
  },
});
