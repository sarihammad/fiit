import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { MedicalDisclaimerModal } from '@/components/MedicalDisclaimerModal';
import {
  useOnboardingStore,
  DietPreference,
  BudgetLevel,
} from '@/state/onboarding.store';
import { OnboardingStackNavigationProp } from '@/utils/navigation';
import { useUserGoalsStore } from '@/state/userGoals.store';
import { useDisclaimerStore } from '@/state/disclaimer.store';

const dietOptions: {
  id: DietPreference;
  label: string;
  description: string;
}[] = [
  { id: 'balanced', label: 'Balanced', description: 'Mix of all macros' },
  { id: 'high_protein', label: 'High Protein', description: '35%+ protein' },
  { id: 'low_carb', label: 'Low Carb', description: '<100g carbs/day' },
  { id: 'keto', label: 'Keto', description: '<20g carbs/day' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'pescatarian', label: 'Pescatarian', description: 'Fish & plants' },
];

const budgetOptions: { id: BudgetLevel; label: string; description: string }[] =
  [
    { id: 'low', label: 'Budget-Friendly', description: '$50-75/week' },
    { id: 'medium', label: 'Moderate', description: '$75-120/week' },
    { id: 'high', label: 'Premium', description: '$120+/week' },
  ];

const cookingTimes = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60+ min' },
];

export const DietPreferencesScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const {
    dietInfo,
    setDietInfo,
    completeOnboarding,
    biometrics,
    gender,
    goal,
  } = useOnboardingStore();
  const { updateGoals, computeMacros } = useUserGoalsStore();
  const { acceptDisclaimer } = useDisclaimerStore();

  const [dietPreference, setDietPreference] = useState<DietPreference>(
    dietInfo?.dietPreference || 'balanced'
  );
  const [allergies, setAllergies] = useState<string>(
    dietInfo?.allergies?.join(', ') || ''
  );
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(
    dietInfo?.budgetLevel || 'medium'
  );
  const [timeToCook, setTimeToCook] = useState<number>(
    dietInfo?.timeToCookMins || 30
  );
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleContinue = () => {
    // Save diet info to onboarding store
    setDietInfo({
      dietPreference,
      allergies: allergies
        .split(',')
        .map(a => a.trim())
        .filter(Boolean),
      budgetLevel,
      timeToCookMins: timeToCook,
    });

    // Transfer all onboarding data to userGoals store
    if (biometrics) {
      updateGoals({
        currentWeightKg: biometrics.currentWeightKg,
        goalWeightKg: biometrics.goalWeightKg,
        heightCm: biometrics.heightCm,
        age: biometrics.age,
        sex: gender,
        activity: biometrics.activityLevel,
        dietPreference,
        allergies: allergies
          .split(',')
          .map(a => a.trim())
          .filter(Boolean),
        budgetLevel,
        timeToCookMins: timeToCook,
      });

      // Compute macro targets based on all inputs
      computeMacros();
    }

    // Show medical disclaimer before completing onboarding
    setShowDisclaimer(true);
  };

  const handleAcceptDisclaimer = () => {
    acceptDisclaimer();
    completeOnboarding();
    setShowDisclaimer(false);
    // Navigate to main app - this will be handled by the root navigator
    // navigation.navigate('MainTabs');
  };

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false);
    Alert.alert(
      'Cannot Continue',
      'You must accept the medical disclaimer to use FIIT. Please consult with a healthcare professional if you have concerns about using this app.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Diet & Lifestyle</Text>
          <Text style={styles.subtitle}>
            Tell us your preferences for personalized meal plans
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>Final Step</Text>
        </View>

        {/* Diet Preference */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Diet Type</Text>
          <View style={styles.optionsGrid}>
            {dietOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setDietPreference(option.id)}
                style={[
                  styles.gridOption,
                  dietPreference === option.id && styles.gridOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.gridOptionLabel,
                    dietPreference === option.id &&
                      styles.gridOptionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.gridOptionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Allergies or Foods to Avoid</Text>
          <TextInput
            style={styles.textArea}
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g., nuts, dairy, shellfish"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
          <Text style={styles.helperText}>Separate with commas</Text>
        </View>

        {/* Budget */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Weekly Grocery Budget</Text>
          <View style={styles.budgetOptions}>
            {budgetOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setBudgetLevel(option.id)}
                style={[
                  styles.budgetOption,
                  budgetLevel === option.id && styles.budgetOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.budgetLabel,
                    budgetLevel === option.id && styles.budgetLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.budgetDescription}>
                  {option.description}
                </Text>
                {budgetLevel === option.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cooking Time */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Time to Cook Per Meal</Text>
          <View style={styles.timeOptions}>
            {cookingTimes.map(time => (
              <TouchableOpacity
                key={time.value}
                onPress={() => setTimeToCook(time.value)}
                style={[
                  styles.timeOption,
                  timeToCook === time.value && styles.timeOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.timeLabel,
                    timeToCook === time.value && styles.timeLabelSelected,
                  ]}
                >
                  {time.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Start My Journey"
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            accessibilityLabel="Complete onboarding and start FIIT"
          />
        </View>
      </ScrollView>

      {/* Medical Disclaimer Modal */}
      <MedicalDisclaimerModal
        visible={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
        onDecline={handleDeclineDisclaimer}
      />
    </SafeAreaView>
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
    padding: 20,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  sectionGroup: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridOption: {
    width: '48%',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  gridOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
  },
  gridOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  gridOptionLabelSelected: {
    color: '#10B981',
  },
  gridOptionDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  textArea: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },
  budgetOptions: {
    gap: 12,
  },
  budgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  budgetOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  budgetLabelSelected: {
    color: '#10B981',
  },
  budgetDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
  },
  timeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  timeOption: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  timeOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  timeLabelSelected: {
    color: '#10B981',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
});
