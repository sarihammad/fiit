import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useOnboardingStore, Goal } from '@/state/onboarding.store';
import { OnboardingStackNavigationProp } from '@/utils/navigation';
import { MaterialIcons } from '@expo/vector-icons';

const goals = [
  {
    id: 'lose_7_lbs' as Goal,
    title: 'Lose 7 lbs in 30 days',
    description: 'Quick weight loss with sustainable habits',
    icon: 'speed' as keyof typeof MaterialIcons.glyphMap,
  },
  {
    id: 'lose_15_lbs' as Goal,
    title: 'Lose 15 lbs in 60 days',
    description: 'Steady weight loss over 2 months',
    icon: 'trending-down' as keyof typeof MaterialIcons.glyphMap,
  },
  {
    id: 'lose_30_lbs' as Goal,
    title: 'Lose 30+ lbs',
    description: 'Major transformation over 3-6 months',
    icon: 'transform' as keyof typeof MaterialIcons.glyphMap,
  },
  {
    id: 'maintain' as Goal,
    title: 'Maintain Weight',
    description: 'Build healthy eating habits and stay fit',
    icon: 'balance' as keyof typeof MaterialIcons.glyphMap,
  },
];

export const GoalScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { goal, setGoal, nextStep } = useOnboardingStore();

  const handleGoalSelect = (selectedGoal: Goal) => {
    setGoal(selectedGoal);
  };

  const handleContinue = () => {
    if (goal) {
      nextStep();
      navigation.navigate('Gender');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What's your goal?</Text>
          <Text style={styles.subtitle}>
            We'll create a personalized plan to help you succeed
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '20%' }]} />
          </View>
          <Text style={styles.progressText}>Step 1 of 5</Text>
        </View>

        {/* Goal Options */}
        <View style={styles.goalOptions}>
          {goals.map(goalOption => (
            <TouchableOpacity
              key={goalOption.id}
              onPress={() => handleGoalSelect(goalOption.id)}
              style={styles.goalOption}
            >
              <View
                style={[
                  styles.goalCard,
                  goal === goalOption.id
                    ? styles.selectedCard
                    : styles.unselectedCard,
                ]}
              >
                <View style={styles.goalContent}>
                  <MaterialIcons
                    name={goalOption.icon}
                    size={32}
                    color={goal === goalOption.id ? '#2563eb' : '#6b7280'}
                  />
                  <View style={styles.goalText}>
                    <Text
                      style={[
                        styles.goalTitle,
                        goal === goalOption.id
                          ? styles.selectedTitle
                          : styles.unselectedTitle,
                      ]}
                    >
                      {goalOption.title}
                    </Text>
                    <Text style={styles.goalDescription}>
                      {goalOption.description}
                    </Text>
                  </View>
                  {goal === goalOption.id && (
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
            disabled={!goal}
            accessibilityLabel="Continue to next step"
            accessibilityHint="Proceeds to gender selection"
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
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  goalOptions: {
    flex: 1,
  },
  goalOption: {
    width: '100%',
    marginBottom: 16,
  },
  goalCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
  },
  selectedCard: {
    borderColor: '#10B981',
    backgroundColor: '#f0fdf4',
  },
  unselectedCard: {
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedTitle: {
    color: '#10B981',
  },
  unselectedTitle: {
    color: '#111827',
  },
  goalDescription: {
    fontSize: 16,
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
    paddingBottom: 32,
  },
});
