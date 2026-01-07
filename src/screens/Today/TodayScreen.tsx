import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers/ThemeProvider';
import { useCoachStore } from '@/state/coach.store';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FocusTimerModal } from '@/components/FocusTimerModal';
import { ActionTypeBadge } from '@/components/ActionTypeBadge';
import { AICoachEngine } from '@/services/aiCoach';
import { track, trackScreenView } from '@/services/analytics';
import { TODAY_EVENTS, type TodayOpenProps, type TaskStartProps, type TimerCompleteProps, type TaskDoneProps, type TaskDeferProps, type MakeIt5ClickedProps, type MakeIt5AppliedProps } from '@/analytics/events';
import { useAnalytics } from '@/providers/AnalyticsProvider';
import { Copy, formatCopy } from '@/copy/strings';
import { generateCoachFeedback, DailyLog, NutritionTargets } from '@/services/nutritionCoach';
import { generateDailyActions, CoachAction } from '@/services/fatLossActionPlanner';

export const TodayScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { trackEvent } = useAnalytics();
  const {
    activePlanId,
    planTasks,
    markTaskDone,
    deferTask,
    addExecutionEvent,
    canUseMicroStep,
    recordMicroStepUse,
    microStepLimit,
    microStepWindowStart,
    microStepCount,
  } = useCoachStore();
  const [isMicroStepOpen, setIsMicroStepOpen] = useState(false);
  const [microStepTarget, setMicroStepTarget] = useState<{
    title: string;
    deferCount: number;
    deferReason?: string;
  } | null>(null);
  const [microStepResult, setMicroStepResult] = useState<{
    rewrittenTitle: string;
    fiveMinuteVersion: string;
    estimateMinutes: number;
  } | null>(null);
  const [isLoadingMicro, setIsLoadingMicro] = useState(false);
  const [showDeferReason, setShowDeferReason] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showLaterToday, setShowLaterToday] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [focusTimerTask, setFocusTimerTask] = useState<typeof todayTasks[0] | null>(null);
  const [coachActions, setCoachActions] = useState<CoachAction[]>([]);
  const [coachFeedback, setCoachFeedback] = useState<ReturnType<typeof generateCoachFeedback> | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    trackScreenView('Today');
    // Track today open
    const openProps: TodayOpenProps = {
      date: today,
      tasksCount: todayTasks.length,
      weeklyPlanId: activePlanId,
    };
    trackEvent(TODAY_EVENTS.OPEN, openProps);
    // Adapt plan for avoidance patterns when Today screen opens
    if (activePlanId) {
      useCoachStore.getState().adaptPlanForAvoidance(activePlanId, today);
    }
    
    // Generate coach actions from logs (if available)
    // For now, use mock data - in production, this would come from meal log store
    const mockTodayLog: DailyLog | null = null; // TODO: Get from meal log store
    const mockYesterdayLog: DailyLog | null = null; // TODO: Get from meal log store
    const mockTargets: NutritionTargets = {
      calories: 2000,
      protein: 120,
      hydration: 8,
    };
    
    // Generate actions from logs (fallback to plan tasks if no logs)
    if (mockTodayLog || mockYesterdayLog) {
      const actions = generateDailyActions(
        mockTodayLog,
        mockYesterdayLog,
        [],
        mockTargets
      );
      setCoachActions(actions);
    }
    
    // Generate coach feedback
    const feedback = generateCoachFeedback(mockTodayLog, mockTargets);
    setCoachFeedback(feedback);
  }, [activePlanId, today]);
  const microStepRemaining = useMemo(() => {
    if (!microStepWindowStart) {
      return microStepLimit;
    }
    const diffDays = Math.floor(
      (Date.now() - new Date(microStepWindowStart).getTime()) / 86_400_000
    );
    if (diffDays >= 1) {
      return microStepLimit;
    }
    return Math.max(microStepLimit - microStepCount, 0);
  }, [microStepWindowStart, microStepLimit, microStepCount]);
  const todayTasks = useMemo(() => {
    const tasks = planTasks
      .filter(task => task.weeklyPlanId === activePlanId)
      .filter(task => task.scheduledDate === today)
      .filter(task => task.status !== 'done')
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
    // Auto-expand first task
    if (tasks.length > 0 && !expandedTaskId && tasks[0]) {
      setExpandedTaskId(tasks[0].id);
    }
    return tasks;
  }, [planTasks, activePlanId, today, expandedTaskId]);

  const deferredStreakTask = todayTasks.find(task => task.deferCount >= 3);

  const handleMicroStep = async () => {
    if (!microStepTarget) return;
    const { allowed } = canUseMicroStep();
    if (!allowed) {
      track('microstep_limit_reached');
      Alert.alert(
        'Daily limit reached',
        'Upgrade for unlimited micro-step rewrites.',
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => {
              (navigation as any).navigate('Upgrade');
            },
          },
        ]
      );
      return;
    }
    setIsLoadingMicro(true);
    try {
      track('microstep_requested', {
        deferCount: microStepTarget.deferCount,
      });
      const response = await AICoachEngine.generateMicroStep(
        microStepTarget.title,
        microStepTarget.deferCount,
        microStepTarget.deferReason
      );
      setMicroStepResult(response);
      recordMicroStepUse();
      track('microstep_generated', { estimateMinutes: response.estimateMinutes });
      // Track make it 5 applied
      const task = todayTasks.find(t => t.title === microStepTarget.title);
      if (task) {
        const appliedProps: MakeIt5AppliedProps = {
          taskId: task.id,
          weeklyPlanId: activePlanId,
        };
        trackEvent(TODAY_EVENTS.MAKE_IT_5_APPLIED, appliedProps);
      }
    } finally {
      setIsLoadingMicro(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: theme.colors.text.primary,
            marginBottom: 6,
          }}
        >
          {Copy.today.headline}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 20,
          }}
        >
          {Copy.today.subheadline}
        </Text>

        {/* Coach Feedback Card */}
        {coachFeedback && (
          <Card style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 12,
              }}
            >
              Daily Check-in
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginBottom: 12,
              }}
            >
              {coachFeedback.summary}
            </Text>
            {coachFeedback.proteinNote && (
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.secondary,
                  marginBottom: 8,
                  fontStyle: 'italic',
                }}
              >
                💪 {coachFeedback.proteinNote}
              </Text>
            )}
            {coachFeedback.hydrationNote && (
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.secondary,
                  marginBottom: 8,
                  fontStyle: 'italic',
                }}
              >
                💧 {coachFeedback.hydrationNote}
              </Text>
            )}
            {coachFeedback.calorieNote && (
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.secondary,
                  marginBottom: 8,
                  fontStyle: 'italic',
                }}
              >
                📊 {coachFeedback.calorieNote}
              </Text>
            )}
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border.primary,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: 4,
                }}
              >
                Tomorrow's Tip
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.colors.text.secondary,
                }}
              >
                {coachFeedback.tomorrowTip}
              </Text>
            </View>
          </Card>
        )}

        {microStepRemaining === 0 && (
          <Card style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginBottom: 10,
              }}
            >
              You’ve used today’s micro-step rewrites. Upgrade for unlimited
              resets and coaching nudges.
            </Text>
            <Button
              title="Upgrade to Coach Mode"
              onPress={() => (navigation as any).navigate('Upgrade')}
              variant="primary"
            />
          </Card>
        )}

        {todayTasks.length === 0 ? (
          <Card>
            <Text
              style={{
                fontSize: 15,
                color: theme.colors.text.secondary,
                marginBottom: 12,
              }}
            >
              {Copy.today.noTasks}
            </Text>
          </Card>
        ) : (
          <>
            {/* Priority #1 Task - Always Expanded */}
            {todayTasks[0] && (() => {
              const firstTask = todayTasks[0];
              return (
                <Card style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        flex: 1,
                      }}
                    >
                      {firstTask.title}
                    </Text>
                    {firstTask.actionType && (
                      <ActionTypeBadge actionType={firstTask.actionType} />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: theme.colors.text.primary,
                      marginBottom: 8,
                    }}
                  >
                    {firstTask.nextAction}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.text.secondary,
                      marginBottom: 10,
                    }}
                  >
                    {firstTask.estimateMinutes} min
                  </Text>
                  <Button
                    title={Copy.today.startButton}
                    onPress={() => {
                      setFocusTimerTask(firstTask);
                      setShowFocusTimer(true);
                      track('focus_timer_started', {
                        taskId: firstTask.id,
                        priority: firstTask.priority,
                      });
                      // Track task start
                      const startProps: TaskStartProps = {
                        taskId: firstTask.id,
                        actionType: firstTask.actionType,
                        estimateMinutes: firstTask.estimateMinutes,
                        weeklyPlanId: activePlanId,
                      };
                      trackEvent(TODAY_EVENTS.TASK_START, startProps);
                    }}
                    variant="primary"
                  />
                  <Button
                    title={Copy.today.notTodayButton}
                    onPress={() => {
                      setShowDeferReason(firstTask.id);
                    }}
                    variant="secondary"
                    style={{ marginTop: 8 }}
                  />
                  {firstTask.deferCount >= 3 && (
                    <Button
                      title={Copy.today.makeItEasier}
                      onPress={() => {
                        setMicroStepTarget({
                          title: firstTask.title,
                          deferCount: firstTask.deferCount,
                          deferReason: firstTask.lastDeferReason,
                        });
                        setMicroStepResult(null);
                        setIsMicroStepOpen(true);
                        track('microstep_cta_clicked', {
                          deferCount: firstTask.deferCount,
                        });
                      }}
                      variant="ghost"
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>
              );
            })()}

            {/* Tasks #2 and #3 - Collapsible "Later today" */}
            {todayTasks.length > 1 && (
              <Card style={{ marginBottom: 16 }}>
                <Button
                  title={Copy.today.laterToday}
                  onPress={() => setShowLaterToday(!showLaterToday)}
                  variant="ghost"
                />
                {showLaterToday &&
                  todayTasks.slice(1).map(task => (
                    <View key={task.id} style={{ marginTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: theme.colors.text.primary,
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
                          marginBottom: 10,
                        }}
                      >
                        {task.nextAction} · {task.estimateMinutes} min
                      </Text>
                      <Button
                        title={Copy.today.startButton}
                        onPress={() => {
                          markTaskDone(task.id);
                          addExecutionEvent(task.id, 'done');
                          track('task_completed', {
                            taskId: task.id,
                            priority: task.priority,
                            estimateMinutes: task.estimateMinutes,
                          });
                        }}
                        variant="primary"
                        size="small"
                      />
                      <Button
                        title={Copy.today.notTodayButton}
                        onPress={() => {
                          setShowDeferReason(task.id);
                        }}
                        variant="secondary"
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    </View>
                  ))}
              </Card>
            )}
          </>
        )}

        {/* Defer Reason Modal */}
        <Modal
          visible={showDeferReason !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDeferReason(null)}
        >
          <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                  marginBottom: 16,
                }}
              >
                {Copy.today.deferReasons.title}
              </Text>
              {Object.entries(Copy.today.deferReasons)
                .filter(([key]) => key !== 'title')
                .map(([key, label]) => (
                  <Button
                    key={key}
                    title={label}
                    onPress={() => {
                      if (showDeferReason) {
                        const reason = key as any;
                        const task = todayTasks.find(t => t.id === showDeferReason);
                        deferTask(showDeferReason, reason);
                        addExecutionEvent(showDeferReason, 'defer');
                        track('task_deferred', {
                          taskId: showDeferReason,
                          deferReason: reason,
                        });
                        // Track task defer
                        if (task) {
                          const deferProps: TaskDeferProps = {
                            taskId: task.id,
                            reason,
                            deferCount: task.deferCount + 1,
                            weeklyPlanId: activePlanId,
                          };
                          trackEvent(TODAY_EVENTS.TASK_DEFER, deferProps);
                        }
                        // Adapt plan after defer
                        if (activePlanId) {
                          useCoachStore.getState().adaptPlanForAvoidance(activePlanId, today);
                        }
                        setShowDeferReason(null);
                      }
                    }}
                    variant="secondary"
                    style={{ marginBottom: 12 }}
                  />
                ))}
              <Button
                title={Copy.common.cancel}
                onPress={() => setShowDeferReason(null)}
                variant="ghost"
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <FocusTimerModal
          visible={showFocusTimer}
          task={focusTimerTask}
          onClose={() => {
            setShowFocusTimer(false);
            setFocusTimerTask(null);
          }}
          onMarkDone={(taskId) => {
            markTaskDone(taskId);
            addExecutionEvent(taskId, 'done');
            track('task_completed', {
              taskId,
            });
            // Track task done
            const task = focusTimerTask;
            if (task) {
              const doneProps: TaskDoneProps = {
                taskId: task.id,
                actionType: task.actionType,
                weeklyPlanId: activePlanId,
              };
              trackEvent(TODAY_EVENTS.TASK_DONE, doneProps);
            }
            setShowFocusTimer(false);
            setFocusTimerTask(null);
          }}
          onTimerComplete={(taskId, minutes) => {
            // Track timer complete
            const timerProps: TimerCompleteProps = {
              taskId,
              minutes,
              weeklyPlanId: activePlanId,
            };
            trackEvent(TODAY_EVENTS.TIMER_COMPLETE, timerProps);
          }}
          onMakeItFiveMinutes={(task) => {
            setShowFocusTimer(false);
            setFocusTimerTask(null);
            setMicroStepTarget({
              title: task.title,
              deferCount: task.deferCount,
              deferReason: task.lastDeferReason,
            });
            setMicroStepResult(null);
            setIsMicroStepOpen(true);
            track('microstep_from_timer', {
              taskId: task.id,
            });
            // Track make it 5 clicked
            const makeIt5Props: MakeIt5ClickedProps = {
              taskId: task.id,
              reason: task.lastDeferReason,
              weeklyPlanId: activePlanId,
            };
            trackEvent(TODAY_EVENTS.MAKE_IT_5_CLICKED, makeIt5Props);
          }}
        />

        {deferredStreakTask && (
          <Card style={{ marginTop: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 6,
              }}
            >
              {formatCopy(Copy.today.deferredStreakTitle, {
                count: String(deferredStreakTask.deferCount),
              })}
            </Text>
            <Button
              title={Copy.today.makeItEasier}
              onPress={() => {
                    setMicroStepTarget({
                      title: deferredStreakTask.title,
                      deferCount: deferredStreakTask.deferCount,
                      deferReason: deferredStreakTask.lastDeferReason,
                    });
                setMicroStepResult(null);
                setIsMicroStepOpen(true);
                track('microstep_cta_clicked', {
                  deferCount: deferredStreakTask.deferCount,
                });
              }}
              variant="secondary"
            />
          </Card>
        )}
      </ScrollView>

      <Modal
        visible={isMicroStepOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsMicroStepOpen(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
        >
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              {Copy.today.makeItEasierTitle}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.text.secondary,
                marginBottom: 16,
              }}
            >
              {Copy.today.makeItEasierSubtitle}
            </Text>

            {!microStepTarget ? (
              <Text style={{ color: theme.colors.text.secondary }}>
                Pick a task to simplify.
              </Text>
            ) : (
              <Card>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: 8,
                  }}
                >
                  {microStepTarget.title}
                </Text>
                {microStepResult ? (
                  <>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.text.secondary,
                        marginBottom: 12,
                      }}
                    >
                      {microStepResult.fiveMinuteVersion} ·{' '}
                      {microStepResult.estimateMinutes} min
                    </Text>
                    <Button
                      title={Copy.today.makeItEasierClose}
                      onPress={() => {
                        setIsMicroStepOpen(false);
                      }}
                      variant="secondary"
                    />
                  </>
                ) : (
                  <Button
                    title={
                      isLoadingMicro
                        ? Copy.today.makeItEasierWorking
                        : Copy.today.makeItEasier
                    }
                    onPress={handleMicroStep}
                    variant="primary"
                    disabled={isLoadingMicro}
                  />
                )}
              </Card>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
