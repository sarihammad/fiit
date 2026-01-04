import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ActionTypeBadge } from '@/components/ActionTypeBadge';
import { useTheme } from '@/providers/ThemeProvider';
import { useCoachStore } from '@/state/coach.store';
import { AICoachEngine } from '@/services/aiCoach';
import { track, trackScreenView } from '@/services/analytics';
import { RootStackNavigationProp } from '@/utils/navigation';
import { Copy } from '@/copy/strings';

export const PlanScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<RootStackNavigationProp>();
  const {
    activeGoalId,
    activePlanId,
    goals,
    answers,
    weeklyPlans,
    planTasks,
    createWeeklyPlan,
    addPlanTask,
    setGoalStatus,
    setActivePlan,
    resetActivePlan,
    canResetPlan,
    recordPlanReset,
    planResetWindowStart,
    planResetCount,
    planResetLimit,
  } = useCoachStore();

  const activeGoal = useMemo(
    () => goals.find(goal => goal.id === activeGoalId),
    [goals, activeGoalId]
  );
  const activePlan = useMemo(
    () => weeklyPlans.find(plan => plan.id === activePlanId),
    [weeklyPlans, activePlanId]
  );
  const goalAnswers = useMemo(
    () => answers.filter(answer => answer.goalId === activeGoal?.id),
    [answers, activeGoal?.id]
  );
  const tasksForPlan = useMemo(
    () => planTasks.filter(task => task.weeklyPlanId === activePlanId),
    [planTasks, activePlanId]
  );

  type PreviewTask = {
    day: string;
    priority: number;
    title: string;
    whyThisMatters: string;
    nextAction: string;
    estimateMinutes: number;
    actionType: string;
  };
  const [previewPlan, setPreviewPlan] = useState<{
    planTitle: string;
    tasks: PreviewTask[];
    rulesOfTheWeek?: string[];
    whyThisWorks?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isLocked = activePlan?.status === 'locked';
  const resetRemaining = useMemo(() => {
    if (!planResetWindowStart) {
      return planResetLimit;
    }
    const diffDays = Math.floor(
      (Date.now() - new Date(planResetWindowStart).getTime()) / 86_400_000
    );
    if (diffDays >= 30) {
      return planResetLimit;
    }
    return Math.max(planResetLimit - (planResetCount || 0), 0);
  }, [planResetLimit, planResetWindowStart, planResetCount]);

  React.useEffect(() => {
    trackScreenView('Plan');
  }, []);

  const groupedPreview = useMemo(() => {
    if (!previewPlan || !previewPlan.tasks) return {};
    return previewPlan.tasks.reduce<Record<string, PreviewTask[]>>(
      (acc, task) => {
        acc[task.day] = acc[task.day] ? [...acc[task.day], task] : [task];
        return acc;
      },
      {}
    );
  }, [previewPlan]);

  const groupedPlanTasks = useMemo(() => {
    if (!tasksForPlan || tasksForPlan.length === 0) return {};
    return tasksForPlan.reduce<Record<string, typeof tasksForPlan>>(
      (acc, task) => {
        acc[task.scheduledDate] = acc[task.scheduledDate]
          ? [...acc[task.scheduledDate], task]
          : [task];
        return acc;
      },
      {}
    );
  }, [tasksForPlan]);

  const handleGeneratePreview = async () => {
    if (!activeGoal) {
      Alert.alert('Goal missing', 'Start by entering your goal.');
      navigation.navigate('Start');
      return;
    }
    if (isLocked) {
      Alert.alert('Plan locked', 'Reset your plan to generate a new one.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Reset plan', onPress: handleResetPlan },
      ]);
      return;
    }
    setIsGenerating(true);
    try {
      track('weekly_plan_preview_requested');
      const weekStart = new Date();
      const plan = await AICoachEngine.generateWeeklyPlan(
        activeGoal.title,
        goalAnswers,
        weekStart
      );
      setPreviewPlan(plan);
      track('weekly_plan_preview_generated', { taskCount: plan.tasks.length });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommitPlan = () => {
    if (!previewPlan || !activeGoal) return;
    Alert.alert(
      Copy.plan.commitConfirmTitle,
      Copy.plan.commitConfirmMessage,
      [
        { text: Copy.plan.commitCancelButton, style: 'cancel' },
        {
          text: Copy.plan.commitConfirmButton,
          style: 'default',
          onPress: () => {
            const weekStart =
              previewPlan.tasks[0]?.day || new Date().toISOString().slice(0, 10);
            track('weekly_plan_committed', { taskCount: previewPlan.tasks.length });
            const plan = createWeeklyPlan(activeGoal.id, weekStart, 'locked');
            previewPlan.tasks.forEach(task => {
              addPlanTask(plan.id, {
                title: task.title,
                whyThisMatters: task.whyThisMatters,
                nextAction: task.nextAction,
                estimateMinutes: task.estimateMinutes,
                scheduledDate: task.day,
                priority: task.priority as 1 | 2 | 3,
                actionType: task.actionType as any,
              });
            });
            setGoalStatus(activeGoal.id, 'active');
            setActivePlan(plan.id);
            setPreviewPlan(null);
            navigation.navigate('Today');
          },
        },
      ]
    );
  };

  const handleResetPlan = () => {
    const { allowed, remaining } = canResetPlan();
    if (!allowed) {
      track('weekly_plan_reset_blocked', { remaining });
      Alert.alert(
        Copy.plan.resetLimitReached,
        Copy.plan.resetLimitMessage,
        [
          { text: Copy.plan.notNowButton, style: 'cancel' },
          {
            text: Copy.plan.upgradeButton,
            onPress: () => navigation.navigate('Upgrade'),
          },
        ]
      );
      return;
    }
    Alert.alert(
      Copy.plan.resetConfirmTitle,
      Copy.plan.resetConfirmMessage,
      [
        { text: Copy.plan.resetCancelButton, style: 'cancel' },
        {
          text: Copy.plan.resetConfirmButton,
          style: 'destructive',
          onPress: () => {
            resetActivePlan();
            recordPlanReset();
            track('weekly_plan_reset_confirmed');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 6,
          }}
        >
          {Copy.plan.headline}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.colors.text.secondary,
            marginBottom: 20,
          }}
        >
          {Copy.plan.subheadline}
        </Text>

        {isLocked && tasksForPlan.length > 0 ? (
          <Card style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 12,
              }}
            >
              {Copy.plan.lockedTitle}
            </Text>
            {previewPlan?.rulesOfTheWeek && previewPlan.rulesOfTheWeek.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  {Copy.plan.rulesTitle}
                </Text>
                {previewPlan.rulesOfTheWeek.map((rule, idx) => (
                  <Text
                    key={idx}
                    style={{
                      fontSize: 13,
                      color: theme.colors.text.secondary,
                      marginBottom: 4,
                    }}
                  >
                    • {rule}
                  </Text>
                ))}
              </View>
            )}
            {Object.entries(groupedPlanTasks).map(([day, tasks]) => (
              <View key={day} style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text.secondary,
                    marginBottom: 6,
                  }}
                >
                  {day}
                </Text>
                {tasks.map(task => (
                  <View key={task.id} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          color: theme.colors.text.primary,
                          fontWeight: '600',
                          flex: 1,
                        }}
                      >
                        {task.title}
                      </Text>
                      {task.actionType && (
                        <ActionTypeBadge actionType={task.actionType} />
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>
                      {task.nextAction} · {task.estimateMinutes} min
                    </Text>
                  </View>
                ))}
              </View>
            ))}
            <Button
              title={Copy.plan.resetButton}
              onPress={handleResetPlan}
              variant="secondary"
              style={{ marginTop: 8 }}
            />
            {resetRemaining === 0 && (
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.text.secondary,
                    marginBottom: 10,
                  }}
                >
                  You’ve used this month’s reset. Upgrade to unlock unlimited
                  plan resets.
                </Text>
                <Button
                  title="Upgrade to Coach Mode"
                  onPress={() => navigation.navigate('Upgrade')}
                  variant="primary"
                />
              </View>
            )}
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.tertiary,
                marginTop: 8,
              }}
            >
              Free plan resets are limited. Upgrade for unlimited resets.
            </Text>
          </Card>
        ) : (
          <Card style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 12,
              }}
            >
              {Copy.plan.previewTitle}
            </Text>
            {previewPlan?.rulesOfTheWeek && previewPlan.rulesOfTheWeek.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  {Copy.plan.rulesTitle}
                </Text>
                {previewPlan.rulesOfTheWeek.map((rule, idx) => (
                  <Text
                    key={idx}
                    style={{
                      fontSize: 13,
                      color: theme.colors.text.secondary,
                      marginBottom: 4,
                    }}
                  >
                    • {rule}
                  </Text>
                ))}
              </View>
            )}
            {previewPlan?.whyThisWorks && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  {Copy.plan.whyWorksTitle}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {previewPlan.whyThisWorks}
                </Text>
              </View>
            )}
            {previewPlan ? (
              Object.entries(groupedPreview).map(([day, tasks]) => (
                <View key={day} style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: theme.colors.text.secondary,
                      marginBottom: 6,
                    }}
                  >
                    {day}
                  </Text>
                  {tasks.map(task => (
                    <View key={`${day}-${task.title}`} style={{ marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            color: theme.colors.text.primary,
                            fontWeight: '600',
                            flex: 1,
                          }}
                        >
                          {task.title}
                        </Text>
                        {task.actionType && (
                          <ActionTypeBadge actionType={task.actionType} />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: theme.colors.text.secondary,
                        }}
                      >
                        {task.nextAction} · {task.estimateMinutes} min
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
                {Copy.plan.noPreview}
              </Text>
            )}

            <Button
              title={isGenerating ? Copy.plan.generating : Copy.plan.generateButton}
              onPress={handleGeneratePreview}
              variant="secondary"
              style={{ marginTop: 12 }}
              disabled={isGenerating}
            />
            {previewPlan && (
              <Button
                title={Copy.plan.commitButton}
                onPress={handleCommitPlan}
                variant="primary"
                style={{ marginTop: 12 }}
              />
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
