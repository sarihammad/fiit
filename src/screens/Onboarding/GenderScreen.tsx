import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { useOnboardingStore, Gender } from '@/state/onboarding.store';
import { OnboardingStackNavigationProp } from '@/utils/navigation';

const genders = [
  {
    id: 'male' as Gender,
    title: 'Male',
    icon: 'person' as keyof typeof MaterialIcons.glyphMap,
  },
  {
    id: 'female' as Gender,
    title: 'Female',
    icon: 'person' as keyof typeof MaterialIcons.glyphMap,
  },
  {
    id: 'other' as Gender,
    title: 'Other',
    icon: 'person-outline' as keyof typeof MaterialIcons.glyphMap,
  },
];

export const GenderScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { gender, setGender, nextStep } = useOnboardingStore();

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
  };

  const handleContinue = () => {
    if (gender) {
      nextStep();
      navigation.navigate('Biometrics');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What's your gender?</Text>
          <Text style={styles.subtitle}>
            This helps us personalize your experience
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>Step 2 of 5</Text>
        </View>

        {/* Gender Options */}
        <View style={styles.genderOptions}>
          {genders.map(genderOption => (
            <TouchableOpacity
              key={genderOption.id}
              onPress={() => handleGenderSelect(genderOption.id)}
              style={styles.genderOption}
            >
              <View
                style={[
                  styles.genderCard,
                  gender === genderOption.id
                    ? styles.selectedCard
                    : styles.unselectedCard,
                ]}
              >
                <View style={styles.genderContent}>
                  <MaterialIcons
                    name={genderOption.icon}
                    size={32}
                    color={gender === genderOption.id ? '#8b5cf6' : '#6b7280'}
                    style={{ marginRight: 16 }}
                  />
                  <Text
                    style={[
                      styles.genderTitle,
                      gender === genderOption.id
                        ? styles.selectedTitle
                        : styles.unselectedTitle,
                    ]}
                  >
                    {genderOption.title}
                  </Text>
                  {gender === genderOption.id && (
                    <View style={styles.checkmark}>
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    </View>
                  )}
                </View>
              </View>
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
            disabled={!gender}
            accessibilityLabel="Continue to next step"
            accessibilityHint="Proceeds to biometrics selection"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
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
    width: '40%',
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  genderOptions: {
    flex: 1,
  },
  genderOption: {
    width: '100%',
    marginBottom: 16,
  },
  genderCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
  },
  selectedCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f3f4f6',
  },
  unselectedCard: {
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  genderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  selectedTitle: {
    color: '#8b5cf6',
  },
  unselectedTitle: {
    color: '#111827',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    paddingBottom: 32,
  },
});
