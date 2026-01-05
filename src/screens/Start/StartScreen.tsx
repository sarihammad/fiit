import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MedicalDisclaimerModal } from '@/components/MedicalDisclaimerModal';
import { useTheme } from '@/providers/ThemeProvider';
import { useCoachStore } from '@/state/coach.store';
import { AICoachEngine } from '@/services/aiCoach';
import { track, trackScreenView } from '@/services/analytics';
import { GoalClarificationAnswer } from '@/types/coach';
import { RootStackNavigationProp } from '@/utils/navigation';
import { Copy } from '@/copy/strings';
import { getNextFatLossQuestion, FatLossQuestion } from '@/utils/fatLossQuestions';

const MAX_QUESTIONS = 7;

export const StartScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();
  const {
    activeGoalId,
    goals,
    answers,
    createGoal,
    addAnswer,
  } = useCoachStore();

  const activeGoal = useMemo(
    () => goals.find(goal => goal.id === activeGoalId),
    [goals, activeGoalId]
  );
  const goalAnswers = useMemo(
    () => answers.filter(answer => answer.goalId === activeGoal?.id),
    [answers, activeGoal?.id]
  );

  const [goalText, setGoalText] = useState(activeGoal?.title || '');
  const [currentQuestion, setCurrentQuestion] = useState<FatLossQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  useEffect(() => {
    trackScreenView('Start');
    // Show disclaimer on first visit (before goal intake)
    if (!activeGoal && !hasAcceptedDisclaimer) {
      setShowDisclaimer(true);
    }
  }, [activeGoal, hasAcceptedDisclaimer]);

  useEffect(() => {
    if (!activeGoal) return;
    if (goalAnswers.length >= MAX_QUESTIONS) {
      navigation.navigate('Plan');
      return;
    }
    // Use fat loss questions directly
    const nextQuestion = getNextFatLossQuestion(goalAnswers);
    setCurrentQuestion(nextQuestion);
  }, [activeGoal, goalAnswers, navigation]);

  useEffect(() => {
    if (activeGoal && !goalText) {
      setGoalText(activeGoal.title);
    }
  }, [activeGoal, goalText]);

  const handleGoalSubmit = async () => {
    if (!goalText.trim()) {
      Alert.alert(Copy.start.answerNeeded, Copy.start.answerNeededMessage);
      return;
    }
    setIsLoading(true);
    try {
      track('goal_intake_submitted', { length: goalText.trim().length });
      const goal = createGoal(goalText.trim());
      const nextQuestion = getNextFatLossQuestion([]);
      setCurrentQuestion(nextQuestion);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = (selectedAnswer?: string) => {
    if (!activeGoal || !currentQuestion) return;
    const answer = selectedAnswer || answerText.trim();
    if (!answer) {
      Alert.alert(Copy.start.answerNeeded, Copy.start.answerNeededMessage);
      return;
    }
    setIsLoading(true);
    try {
      track('clarification_answered', {
        questionKey: currentQuestion.key,
        answerLength: answer.length,
        index: goalAnswers.length + 1,
        totalTarget: MAX_QUESTIONS,
      });
      addAnswer(activeGoal.id, currentQuestion.key, currentQuestion.text, answer);
      setAnswerText('');
      if (goalAnswers.length + 1 >= MAX_QUESTIONS) {
        track('clarification_completed', { totalAnswers: goalAnswers.length + 1 });
        navigation.navigate('Plan');
        return;
      }
      const nextQuestion = getNextFatLossQuestion([
        ...goalAnswers,
        {
          id: 'local_preview',
          goalId: activeGoal.id,
          questionKey: currentQuestion.key,
          questionText: currentQuestion.text,
          answerText: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
      setCurrentQuestion(nextQuestion);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <MedicalDisclaimerModal
        visible={showDisclaimer}
        onAccept={() => {
          setShowDisclaimer(false);
          setHasAcceptedDisclaimer(true);
        }}
        onDecline={() => {
          setShowDisclaimer(false);
          // User declined - could navigate away or show message
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 8,
          }}
        >
          {Copy.start.headline}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 24,
          }}
        >
          {Copy.start.subheadline}
        </Text>

        {!activeGoal ? (
          <Card style={{ marginBottom: 24 }}>
            <TextInput
              value={goalText}
              onChangeText={setGoalText}
              placeholder={Copy.start.placeholder}
              placeholderTextColor={theme.colors.text.tertiary}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border.primary,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface.primary,
                marginBottom: 12,
              }}
              multiline
            />
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.tertiary,
                  marginBottom: 8,
                }}
              >
                Tap to autofill:
              </Text>
              {Copy.start.examples.slice(0, 3).map((example, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setGoalText(example)}
                  style={{
                    padding: 10,
                    marginBottom: 6,
                    backgroundColor: theme.colors.background.secondary,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.border.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    {example}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title={Copy.start.continueButton}
              onPress={handleGoalSubmit}
              variant="primary"
              style={{ marginTop: 8 }}
              disabled={isLoading}
            />
          </Card>
        ) : (
          <Card style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 6,
              }}
            >
              {Copy.start.coachingHeader}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginBottom: 16,
              }}
            >
              {Copy.start.coachingSubheader}
            </Text>

            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 16,
              }}
            >
              {currentQuestion?.text || 'Loading question…'}
            </Text>
            {currentQuestion?.options ? (
              <View style={{ gap: 8, marginBottom: 16 }}>
                {currentQuestion.options.map((option, idx) => (
                  <Button
                    key={idx}
                    title={option}
                    onPress={() => handleAnswerSubmit(option)}
                    variant="secondary"
                    disabled={isLoading}
                  />
                ))}
              </View>
            ) : (
              <>
                <TextInput
                  value={answerText}
                  onChangeText={setAnswerText}
                  placeholder={Copy.start.answerPlaceholder}
                  placeholderTextColor={theme.colors.text.tertiary}
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.border.primary,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.surface.primary,
                    marginBottom: 16,
                  }}
                />
                <Button
                  title={Copy.start.continueButton}
                  onPress={() => handleAnswerSubmit()}
                  variant="primary"
                  disabled={isLoading}
                />
              </>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
