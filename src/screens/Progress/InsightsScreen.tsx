import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useFeedbackStore } from '@/state/feedback.store';
import { useNutritionStore } from '@/state/nutrition.store';
import { Card } from '@/components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { FeedbackService, FeedbackContext, NutritionData } from '@/services/feedback';
import { CoachFeedback } from '@/types/api/feedback';

export const InsightsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { feedbackHistory } = useFeedbackStore();
  const { getStats } = useNutritionStore();

  const [dailyFeedback, setDailyFeedback] = useState<CoachFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const stats = getStats(30);

  // Generate daily feedback
  useEffect(() => {
    generateDailyFeedback();
  }, []);

  const generateDailyFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const context: FeedbackContext = {
        date: new Date().toISOString().split('T')[0] || '',
        mealsLogged: stats.totalDaysLogged || 0,
        weightLogged: false, // TODO: Get from weight store
        exerciseLogged: false, // TODO: Get from exercise store
        sleepHours: 8, // TODO: Get from sleep tracking
        stressLevel: 3, // TODO: Get from mood tracking
        mood: 'good',
      };

      const nutritionData: NutritionData = {
        totalCalories: stats.avgCalories || 0,
        totalProtein: stats.avgProtein || 0,
        totalCarbs: stats.avgCarbs || 0,
        totalFat: stats.avgFat || 0,
        targetCalories: 2000, // TODO: Get from user goals
        targetProtein: 150, // TODO: Get from user goals
        targetCarbs: 250, // TODO: Get from user goals
        targetFat: 65, // TODO: Get from user goals
      };

      const feedback = await FeedbackService.generateFeedback(context, nutritionData);
      setDailyFeedback(feedback);
    } catch (error) {
      console.error('Failed to generate daily feedback:', error);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '700',
          color: theme.colors.text.primary,
          marginBottom: 8,
        }}
      >
        Insights
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.text.secondary,
          marginBottom: 24,
        }}
      >
        Your nutrition stats and AI feedback history.
      </Text>

      {/* Daily Feedback Card */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <MaterialIcons
            name="lightbulb"
            size={24}
            color={theme.colors.brand.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
            }}
          >
            Today's Feedback
          </Text>
        </View>

        {isLoadingFeedback ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="small" color={theme.colors.brand.primary} />
            <Text style={{ marginTop: 8, color: theme.colors.text.secondary }}>
              Generating your personalized feedback...
            </Text>
          </View>
        ) : dailyFeedback ? (
          <View>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text.primary,
                marginBottom: 12,
                lineHeight: 22,
              }}
            >
              {dailyFeedback.summary}
            </Text>

            {dailyFeedback.proteinNote && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.brand.primary,
                    marginBottom: 4,
                  }}
                >
                  Protein Target
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    lineHeight: 20,
                  }}
                >
                  {dailyFeedback.proteinNote}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.brand.primary,
                  marginBottom: 4,
                }}
              >
                Tomorrow's Tip
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.secondary,
                  lineHeight: 20,
                }}
              >
                {dailyFeedback.tomorrowTip}
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.brand.primary + '10',
                padding: 12,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: theme.colors.brand.primary,
              }}
              onPress={generateDailyFeedback}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.brand.primary,
                  fontWeight: '500',
                }}
              >
                Refresh Feedback
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <MaterialIcons
              name="error-outline"
              size={48}
              color={theme.colors.text.tertiary}
            />
            <Text
              style={{
                marginTop: 8,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              Unable to generate feedback. Please try again.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: theme.colors.brand.primary,
                borderRadius: 6,
              }}
              onPress={generateDailyFeedback}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontWeight: '500',
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Stats Card */}
      <Card style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 16,
          }}
        >
          30-Day Statistics
        </Text>

        <View style={{ gap: 12 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              Days Logged
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              {stats.totalDaysLogged}
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              Avg Calories
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              {stats.avgCalories} cal/day
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              Avg Protein
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              {stats.avgProtein}g/day
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              Current Streak
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.brand.primary,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="local-fire-department"
                  size={20}
                  color={theme.colors.brand.primary}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ color: theme.colors.brand.primary }}>
                  {stats.streak} days
                </Text>
              </View>
            </Text>
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              Compliance Rate
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              {stats.complianceRate}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Feedback History */}
      <Card>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 12,
          }}
        >
          AI Feedback History
        </Text>

        {feedbackHistory.length === 0 ? (
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              paddingVertical: 16,
            }}
          >
            No feedback yet. Get daily feedback from the Home screen!
          </Text>
        ) : (
          <View>
            {feedbackHistory.slice(0, 10).map(feedback => (
              <View
                key={feedback.id}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border.primary,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.text.tertiary,
                    marginBottom: 4,
                  }}
                >
                  {new Date(feedback.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: theme.colors.text.primary,
                    marginBottom: 4,
                  }}
                >
                  {feedback.summary}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    fontStyle: 'italic',
                  }}
                >
                  <MaterialIcons
                    name="lightbulb"
                    size={16}
                    color={theme.colors.brand.primary}
                  />{' '}
                  {feedback.tomorrowTip}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
};
