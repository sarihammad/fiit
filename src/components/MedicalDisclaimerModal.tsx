import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';

interface MedicalDisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const MedicalDisclaimerModal: React.FC<MedicalDisclaimerModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDecline}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="medical-services" size={32} color="#dc2626" />
            <Text style={styles.title}>Important Medical Information</Text>
            <Text style={styles.subtitle}>
              Please read carefully before continuing
            </Text>
          </View>

          {/* Main Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              This App is NOT Medical Advice
            </Text>
            <Text style={styles.text}>
              FIIT is a nutrition and wellness tool designed to help you track
              meals, plan your diet, and work towards your weight goals. It is{' '}
              <Text style={styles.bold}>
                not a substitute for professional medical advice, diagnosis, or
                treatment
              </Text>
              .
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Consult a Healthcare Professional
            </Text>
            <Text style={styles.text}>
              Before starting any weight loss program, changing your diet, or
              making significant lifestyle changes, you should{' '}
              <Text style={styles.bold}>
                consult with a qualified healthcare provider
              </Text>
              , especially if you:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bullet}>
                • Have any pre-existing medical conditions
              </Text>
              <Text style={styles.bullet}>• Are taking any medications</Text>
              <Text style={styles.bullet}>• Are pregnant or breastfeeding</Text>
              <Text style={styles.bullet}>
                • Have a history of eating disorders
              </Text>
              <Text style={styles.bullet}>
                • Are under 18 or over 65 years old
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI-Generated Content</Text>
            <Text style={styles.text}>
              Our meal plans and daily feedback are generated using artificial
              intelligence. While we strive for accuracy, AI can make mistakes.{' '}
              <Text style={styles.bold}>
                Always verify nutritional information
              </Text>{' '}
              and consult reliable sources or a dietitian if you have specific
              dietary needs.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Individual Results May Vary</Text>
            <Text style={styles.text}>
              Weight loss results depend on many factors including your
              metabolism, starting weight, adherence to the plan, activity
              level, and overall health. Our projections are estimates only and{' '}
              <Text style={styles.bold}>
                not a guarantee of specific results
              </Text>
              .
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Situations</Text>
            <Text style={styles.text}>
              If you experience chest pain, difficulty breathing, severe
              dizziness, or any other medical emergency,{' '}
              <Text style={styles.bold}>
                call emergency services immediately
              </Text>
              . Do not rely on this app for emergency medical assistance.
            </Text>
          </View>

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              By continuing, you acknowledge that you have read and understood
              this disclaimer, and you agree to use FIIT at your own risk.
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="I Understand & Accept"
            onPress={onAccept}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Accept medical disclaimer"
            accessibilityHint="Acknowledges disclaimer and continues to app"
          />
          <TouchableOpacity
            onPress={onDecline}
            style={styles.declineButton}
            accessibilityRole="button"
            accessibilityLabel="Decline and exit"
          >
            <Text style={styles.declineText}>I do not accept</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: '#111827',
  },
  bulletList: {
    marginTop: 12,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  disclaimerBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  declineButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
