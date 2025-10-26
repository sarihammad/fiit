import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { useOnboardingStore, ActivityLevel } from '@/state/onboarding.store';
import { OnboardingStackNavigationProp } from '@/utils/navigation';

const activityLevels: {
  id: ActivityLevel;
  label: string;
  description: string;
}[] = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
  {
    id: 'light',
    label: 'Lightly Active',
    description: 'Exercise 1-3 days/week',
  },
  {
    id: 'moderate',
    label: 'Moderately Active',
    description: 'Exercise 3-5 days/week',
  },
  { id: 'active', label: 'Very Active', description: 'Exercise 6-7 days/week' },
];

export const BiometricsScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { biometrics, setBiometrics, nextStep } = useOnboardingStore();

  const [isMetric, setIsMetric] = useState<boolean>(
    biometrics?.unit === 'metric' || true
  );
  const [currentWeight, setCurrentWeight] = useState(
    biometrics?.currentWeightKg?.toString() || ''
  );
  const [goalWeight, setGoalWeight] = useState(
    biometrics?.goalWeightKg?.toString() || ''
  );
  const [height, setHeight] = useState(biometrics?.heightCm?.toString() || '');
  const [age, setAge] = useState(biometrics?.age?.toString() || '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    biometrics?.activityLevel || 'sedentary'
  );

  const handleContinue = () => {
    const currentWeightNum = parseFloat(currentWeight);
    const goalWeightNum = parseFloat(goalWeight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age, 10);

    if (currentWeightNum && goalWeightNum && heightNum && ageNum) {
      // Convert to kg and cm (already in correct units for now)
      setBiometrics({
        currentWeightKg: currentWeightNum,
        goalWeightKg: goalWeightNum,
        heightCm: heightNum,
        age: ageNum,
        activityLevel,
        unit: isMetric ? 'metric' : 'imperial',
      });
      nextStep();
      navigation.navigate('DietPreferences');
    }
  };

  const isValid = currentWeight && goalWeight && height && age;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>
            We'll calculate your personalized calorie and macro targets
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 5</Text>
        </View>

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          <Text style={[styles.unitLabel, !isMetric && styles.unitLabelActive]}>
            Imperial
          </Text>
          <Switch
            value={isMetric}
            onValueChange={(value: boolean) => setIsMetric(value)}
            trackColor={{ false: '#10B981', true: '#10B981' }}
            thumbColor="#fff"
          />
          <Text style={[styles.unitLabel, isMetric && styles.unitLabelActive]}>
            Metric
          </Text>
        </View>

        {/* Current Weight */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Current Weight ({isMetric ? 'kg' : 'lbs'})
          </Text>
          <TextInput
            style={styles.input}
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="decimal-pad"
            placeholder={isMetric ? '70' : '154'}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Goal Weight */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Goal Weight ({isMetric ? 'kg' : 'lbs'})
          </Text>
          <TextInput
            style={styles.input}
            value={goalWeight}
            onChangeText={setGoalWeight}
            keyboardType="decimal-pad"
            placeholder={isMetric ? '65' : '143'}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Height */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Height ({isMetric ? 'cm' : 'inches'})
          </Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder={isMetric ? '170' : '67'}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Age */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            placeholder="25"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Activity Level */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <Text style={styles.helperText}>How often do you exercise?</Text>
          {activityLevels.map(level => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setActivityLevel(level.id)}
              style={[
                styles.activityOption,
                activityLevel === level.id && styles.activityOptionSelected,
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.activityLabel,
                    activityLevel === level.id && styles.activityLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={styles.activityDescription}>
                  {level.description}
                </Text>
              </View>
              {activityLevel === level.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            fullWidth
            disabled={!isValid}
            accessibilityLabel="Continue to diet preferences"
          />
        </View>
      </ScrollView>
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
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  unitLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  unitLabelActive: {
    color: '#111827',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  input: {
    height: 54,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  activityOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityLabelSelected: {
    color: '#10B981',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6b7280',
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
