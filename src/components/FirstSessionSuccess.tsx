import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from '@/state/auth.store';
import { useMealStore } from '@/state/meal.store';

interface FirstSessionSuccessProps {
  onLogMeal: () => void;
  onContinue: () => void;
}

export const FirstSessionSuccess: React.FC<FirstSessionSuccessProps> = ({
  onLogMeal,
  onContinue,
}) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { meals, addMeal } = useMealStore();
  const [dayOnePlan, setDayOnePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sampleMeal, setSampleMeal] = useState(null);

  useEffect(() => {
    initializeFirstSession();
  }, []);

  const initializeFirstSession = async () => {
    try {
      // Generate Day-1 plan
      const plan = await generateDayOnePlan();
      setDayOnePlan(plan);
      
      // Create sample meal for demonstration
      const sample = {
        id: 'sample-1',
        label: 'Grilled Chicken Breast',
        calories: 165,
        protein_g: 31,
        carbs_g: 0,
        fat_g: 3.6,
        quantity: 1,
        timestamp: new Date().toISOString(),
      };
      setSampleMeal(sample);
      
      // Add sample meal to demonstrate the flow
      await addMeal(sample);
      
    } catch (error) {
      console.error('Failed to initialize first session:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDayOnePlan = async () => {
    // Mock implementation - replace with actual API call
    return {
      date: new Date().toISOString().split('T')[0],
      meals: [
        { id: 'breakfast', label: 'Greek Yogurt with Berries', calories: 200 },
        { id: 'lunch', label: 'Grilled Chicken Salad', calories: 350 },
        { id: 'dinner', label: 'Salmon with Vegetables', calories: 400 },
        { id: 'snack', label: 'Apple with Almonds', calories: 150 },
      ],
      totalCalories: 1100,
      targetCalories: 1200,
    };
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <Skeleton width="80%" height={32} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={200} style={{ marginBottom: 24 }} />
        <Skeleton width="100%" height={100} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={styles.content}>
        <MaterialIcons
          name="celebration"
          size={64}
          color={theme.colors.brand.primary}
          style={styles.icon}
        />
        
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Welcome to your FIIT journey!
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Here's your personalized Day-1 plan
        </Text>
        
        <View style={[styles.planCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.planTitle, { color: theme.colors.text.primary }]}>
            Today's Meal Plan
          </Text>
          
          {dayOnePlan?.meals.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <Text style={[styles.mealLabel, { color: theme.colors.text.primary }]}>
                {meal.label}
              </Text>
              <Text style={[styles.mealCalories, { color: theme.colors.text.secondary }]}>
                {meal.calories} cal
              </Text>
            </View>
          ))}
          
          <View style={styles.planSummary}>
            <Text style={[styles.summaryText, { color: theme.colors.text.primary }]}>
              Total: {dayOnePlan?.totalCalories} / {dayOnePlan?.targetCalories} calories
            </Text>
          </View>
        </View>
        
        <View style={[styles.sampleCard, { backgroundColor: theme.colors.background.secondary }]}>
          <Text style={[styles.sampleTitle, { color: theme.colors.text.primary }]}>
            Sample Meal Logged
          </Text>
          <Text style={[styles.sampleText, { color: theme.colors.text.secondary }]}>
            We've added a sample meal to show you how logging works. Try logging your own meal next!
          </Text>
        </View>
        
        <View style={styles.feedbackCard}>
          <MaterialIcons
            name="lightbulb"
            size={24}
            color={theme.colors.brand.primary}
            style={styles.feedbackIcon}
          />
          <View style={styles.feedbackContent}>
            <Text style={[styles.feedbackTitle, { color: theme.colors.text.primary }]}>
              Your First Feedback
            </Text>
            <Text style={[styles.feedbackText, { color: theme.colors.text.secondary }]}>
              Great start! Your sample meal shows 31g protein. Aim for 30-35g protein per meal to reach your daily target.
            </Text>
            <Text style={[styles.feedbackCTA, { color: theme.colors.brand.primary }]}>
              Next: Log your next meal to get personalized tips!
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Log My First Meal"
            onPress={onLogMeal}
            variant="primary"
            size="large"
            style={styles.primaryButton}
          />
          
          <Button
            title="Continue to App"
            onPress={onContinue}
            variant="outline"
            size="large"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  planCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mealLabel: {
    fontSize: 16,
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
  },
  planSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sampleCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  sampleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 16,
    lineHeight: 24,
  },
  feedbackCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  feedbackIcon: {
    marginRight: 16,
    marginTop: 4,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  feedbackCTA: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
});
