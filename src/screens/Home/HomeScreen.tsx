import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { useAnalytics } from '@/services/analytics';
import { useNutritionStore } from '@/state/nutrition.store';
import { useUserGoalsStore } from '@/state/userGoals.store';
import { useFeedbackStore } from '@/state/feedback.store';
import { usePaywallStore } from '@/state/paywall.store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ScoreDial } from '@/components/ScoreDial';
import { MacroChips } from '@/components/MacroChips';
import { NextBestAction } from '@/components/NextBestAction';
import { NutritionCoachService } from '@/services/nutritionCoach';
import { useNavigation } from '@react-navigation/native';
import { Toast } from '@/utils/toast';

export const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { track } = useAnalytics();
  const { isPro } = usePaywallStore();

  const { getCurrentDayLog, getDailyProgress, getStreak } = useNutritionStore();
  const { goals } = useUserGoalsStore();
  const { getLatestFeedback, addFeedback, isGenerating, setGenerating } =
    useFeedbackStore();

  const [dayLog, setDayLog] = useState(getCurrentDayLog());
  const [progress, setProgress] = useState(getDailyProgress());
  const [streak, setStreak] = useState(getStreak());
  const [latestFeedback, setLatestFeedback] = useState(getLatestFeedback());

  // Refresh data when screen gains focus
  useEffect(() => {
    const refreshData = () => {
      setDayLog(getCurrentDayLog());
      setProgress(getDailyProgress());
      setStreak(getStreak());
      setLatestFeedback(getLatestFeedback());
    };

    refreshData();

    // Track screen view
    track('screen_view', { screen_name: 'Home' });

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);

    return () => clearInterval(interval);
  }, [getCurrentDayLog, getDailyProgress, getStreak, getLatestFeedback, track]);

  const handleGetFeedback = async () => {
    if (!isPro) {
      track('paywall_shown', { trigger: 'feedback_button' });
      (navigation as any).navigate('Paywall');
      return;
    }

    track('feedback_requested', {
      meals_logged: dayLog.meals.length,
      calories: dayLog.totals.calories,
    });

    setGenerating(true);
    try {
      const feedback = await NutritionCoachService.getDailyFeedback(
        dayLog,
        goals,
        streak
      );
      addFeedback(feedback);
      setLatestFeedback(feedback);
      track('feedback_viewed', { feedback_mood: feedback.mood });
      Toast.success('Daily feedback generated!');
    } catch (error) {
      console.error('Failed to get feedback:', error);
      Toast.error('Failed to generate feedback. Please try again.');
      track('feedback_requested', { success: false });
    } finally {
      setGenerating(false);
    }
  };

  const navigateToLog = () => {
    track('landing_viewed', { screen: 'Log', trigger: 'home_button' });
    (navigation as any).navigate('Log');
  };

  const navigateToPlanner = () => {
    if (!isPro) {
      track('paywall_shown', { trigger: 'planner_button' });
      (navigation as any).navigate('Paywall');
      return;
    }
    track('landing_viewed', { screen: 'Planner', trigger: 'home_button' });
    (navigation as any).navigate('Planner');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: theme.colors.text.primary,
              marginBottom: 4,
            }}
          >
            Welcome to FIIT
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
            }}
          >
            {streak > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="local-fire-department"
                  size={20}
                  color={theme?.colors?.warning?.[600] || '#f59e0b'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ color: theme?.colors?.text?.primary || '#000000' }}
                >
                  {streak} day streak!
                </Text>
              </View>
            ) : (
              'Start your journey today'
            )}
          </Text>
        </View>

        {/* Today's Summary Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 16,
            }}
          >
            Today's Summary
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <ScoreDial
              score={progress.calories.percentage}
              size={120}
              color={theme.colors.brand.primary}
            />
            <Text
              style={{
                marginTop: 12,
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              {progress.calories.current} / {progress.calories.target} cal
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
              }}
            >
              {progress.calories.target - progress.calories.current > 0
                ? `${progress.calories.target - progress.calories.current} cal remaining`
                : 'Target reached!'}
            </Text>
          </View>

          <MacroChips
            protein={progress.protein.current}
            proteinTarget={progress.protein.target}
            carbs={progress.carbs.current}
            carbsTarget={progress.carbs.target}
            fat={progress.fat.current}
            fatTarget={progress.fat.target}
          />
        </Card>

        {/* Next Best Action */}
        <View style={{ marginBottom: 16 }}>
          <NextBestAction
            context={{
              date: new Date().toISOString().split('T')[0] || '',
              mealsLogged: dayLog.meals.length,
              weightLogged: false, // TODO: Check if weight was logged today
              exerciseLogged: false, // TODO: Check if exercise was logged today
            }}
            nutritionData={{
              totalCalories: dayLog.totals.calories,
              totalProtein: dayLog.totals.protein,
              totalCarbs: dayLog.totals.carbs,
              totalFat: dayLog.totals.fat,
              targetCalories: 2000, // TODO: Calculate from goals
              targetProtein: 150, // TODO: Calculate from goals
              targetCarbs: 200, // TODO: Calculate from goals
              targetFat: 65, // TODO: Calculate from goals
            }}
            onPress={actionType => {
              if (actionType === 'log_meal') {
                navigateToLog();
              } else if (actionType === 'view_feedback') {
                handleGetFeedback();
              } else if (actionType === 'plan_meal') {
                navigateToPlanner();
              }
            }}
            isLoading={isGenerating}
          />
        </View>

        {/* AI Feedback Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Daily Feedback
          </Text>

          {latestFeedback && latestFeedback.date === dayLog.date ? (
            <View>
              <Text
                style={{
                  fontSize: 15,
                  color: theme.colors.text.primary,
                  marginBottom: 12,
                  lineHeight: 22,
                }}
              >
                {latestFeedback.summary}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  fontWeight: '600',
                  marginBottom: 6,
                }}
              >
                Tomorrow's Tip:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  lineHeight: 20,
                }}
              >
                {latestFeedback.tomorrowTip}
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  marginBottom: 12,
                }}
              >
                {isPro
                  ? "Get personalized AI feedback on today's meals and macros."
                  : 'Upgrade to Pro for daily AI coaching and feedback.'}
              </Text>
              <Button
                title={
                  isGenerating
                    ? 'Generating...'
                    : isPro
                      ? "Get Today's Feedback"
                      : 'Upgrade to Pro'
                }
                onPress={handleGetFeedback}
                variant="primary"
                disabled={isGenerating}
              />
            </View>
          )}
        </Card>

        {/* Today's Meals */}
        <Card>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 12,
            }}
          >
            Today's Meals ({dayLog.meals.length})
          </Text>

          {dayLog.meals.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <MaterialIcons
                name="photo-camera"
                size={48}
                color={theme.colors.text.secondary}
                style={{ marginBottom: 12 }}
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: 8,
                }}
              >
                Snap your first meal
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Logging takes 5 seconds
              </Text>
              <Button
                title="Add Meal"
                onPress={navigateToLog}
                variant="primary"
                size="large"
              />
            </View>
          ) : (
            <View>
              {dayLog.meals.slice(0, 3).map(meal => (
                <View
                  key={meal.id}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      marginBottom: 4,
                    }}
                  >
                    {meal.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.text.tertiary,
                    }}
                  >
                    {meal.calories} cal • {meal.protein}g protein • {meal.when}
                  </Text>
                </View>
              ))}
              {dayLog.meals.length > 3 && (
                <TouchableOpacity
                  onPress={navigateToLog}
                  style={{ marginTop: 12 }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.brand.primary,
                      textAlign: 'center',
                    }}
                  >
                    View all {dayLog.meals.length} meals →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};
