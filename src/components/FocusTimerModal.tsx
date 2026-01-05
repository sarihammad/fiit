import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { Button } from './Button';
import { PlanTask } from '@/types/coach';
import { Copy } from '@/copy/strings';

interface FocusTimerModalProps {
  visible: boolean;
  task: PlanTask | null;
  onClose: () => void;
  onMarkDone: (taskId: string) => void;
  onMakeItFiveMinutes: (task: PlanTask) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  visible,
  task,
  onClose,
  onMarkDone,
  onMakeItFiveMinutes,
}) => {
  const { theme } = useTheme();
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDonePrompt, setShowDonePrompt] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedMinutes(null);
      setTimeRemaining(null);
      setIsRunning(false);
      setShowDonePrompt(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [visible]);

  useEffect(() => {
    if (isRunning && timeRemaining !== null && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            setIsRunning(false);
            setShowDonePrompt(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleStartTimer = (minutes: number) => {
    setSelectedMinutes(minutes);
    setTimeRemaining(minutes * 60);
    setIsRunning(true);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setTimeRemaining(null);
    setSelectedMinutes(null);
  };

  const handleDone = () => {
    if (task) {
      onMarkDone(task.id);
    }
    onClose();
  };

  const handleNotYet = () => {
    if (task) {
      onMakeItFiveMinutes(task);
    }
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        {showDonePrompt ? (
          <View style={styles.donePrompt}>
            <Text
              style={[styles.doneTitle, { color: theme.colors.text.primary }]}
            >
              {Copy.today.focusTimer.done}
            </Text>
            <View style={styles.doneButtons}>
              <Button
                title={Copy.today.focusTimer.doneButton}
                onPress={handleDone}
                variant="primary"
                style={styles.doneButton}
              />
              <Button
                title={Copy.today.focusTimer.notYetButton}
                onPress={handleNotYet}
                variant="secondary"
                style={styles.doneButton}
              />
            </View>
          </View>
        ) : isRunning && timeRemaining !== null ? (
          <View style={styles.timerView}>
            <Text
              style={[styles.timerText, { color: theme.colors.text.primary }]}
            >
              {formatTime(timeRemaining)}
            </Text>
            <Text
              style={[
                styles.timerLabel,
                { color: theme.colors.text.secondary },
              ]}
            >
              {Copy.today.focusTimer.title}
            </Text>
            <Button
              title={Copy.common.cancel}
              onPress={handleCancel}
              variant="secondary"
              style={styles.cancelButton}
            />
          </View>
        ) : (
          <View style={styles.selectionView}>
            <Text
              style={[
                styles.taskTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              {task.title}
            </Text>
            <Text
              style={[
                styles.taskAction,
                { color: theme.colors.text.secondary },
              ]}
            >
              {task.nextAction}
            </Text>
            <Text
              style={[
                styles.selectTime,
                { color: theme.colors.text.secondary },
              ]}
            >
              How long do you want to focus?
            </Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface.primary,
                    borderColor: theme.colors.border.primary,
                  },
                ]}
                onPress={() => handleStartTimer(5)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {Copy.today.focusTimer.start5}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface.primary,
                    borderColor: theme.colors.border.primary,
                  },
                ]}
                onPress={() => handleStartTimer(10)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {Copy.today.focusTimer.start10}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: theme.colors.surface.primary,
                    borderColor: theme.colors.border.primary,
                  },
                ]}
                onPress={() => handleStartTimer(15)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {Copy.today.focusTimer.start15}
                </Text>
              </TouchableOpacity>
            </View>
            <Button
              title={Copy.common.close}
              onPress={onClose}
              variant="ghost"
              style={styles.closeButton}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  selectionView: {
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  taskAction: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  selectTime: {
    fontSize: 16,
    marginBottom: 24,
  },
  timeButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  timeButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
  },
  timerView: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '700',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 18,
    marginBottom: 32,
  },
  cancelButton: {
    minWidth: 120,
  },
  donePrompt: {
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
  },
  doneButtons: {
    width: '100%',
    gap: 12,
  },
  doneButton: {
    width: '100%',
  },
});


