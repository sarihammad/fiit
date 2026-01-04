import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { TodayScreen } from '../TodayScreen';
import { useCoachStore } from '@/state/coach.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/aiCoach', () => ({
  AICoachEngine: {
    generateMicroStep: jest.fn(async () => ({
      rewrittenTitle: 'Simplified task',
      fiveMinuteVersion: 'Spend 5 minutes on the easiest part.',
      estimateMinutes: 5,
    })),
  },
}));

jest.mock('@/services/analytics', () => ({
  track: jest.fn(),
  trackScreenView: jest.fn(),
}));

jest.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: { primary: '#ffffff', secondary: '#f5f5f5' },
        text: { primary: '#000000', secondary: '#666666', tertiary: '#999999' },
        border: { primary: '#e0e0e0' },
        surface: { primary: '#ffffff' },
        success: { 50: '#f0fdf4', 700: '#15803d' },
      },
    },
  }),
}));

jest.mock('@/copy/strings', () => ({
  Copy: {
    today: {
      headline: 'Today.',
      subheadline: 'Just do the next obvious thing.',
      noTasks: 'No actions scheduled for today.',
      startButton: 'Start',
      notTodayButton: 'Not today',
      laterToday: 'Later today',
      makeItEasier: 'Make it 5 minutes',
      deferReasons: {
        title: 'Why not?',
        tooHard: 'Too hard',
        tooLong: 'Too long',
        notImportant: 'Not important',
        dontKnowHow: 'Don\'t know how',
      },
    },
  },
  formatCopy: (template: string, values: Record<string, string>) => {
    let result = template;
    for (const [key, value] of Object.entries(values)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  },
}));

describe('TodayScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useCoachStore.getState().resetCoach();
    const goal = useCoachStore.getState().createGoal('Build a habit');
    const plan = useCoachStore.getState().createWeeklyPlan(goal.id, '2025-01-06');
    const today = new Date().toISOString().slice(0, 10);
    useCoachStore.getState().addPlanTask(plan.id, {
      title: 'Task one',
      whyThisMatters: 'Momentum.',
      nextAction: 'Open a blank doc.',
      estimateMinutes: 10,
      scheduledDate: today,
      priority: 1,
    });
    const deferredTask = useCoachStore.getState().addPlanTask(plan.id, {
      title: 'Deferred task',
      whyThisMatters: 'Consistency.',
      nextAction: 'Draft a sentence.',
      estimateMinutes: 10,
      scheduledDate: today,
      priority: 2,
    });
    useCoachStore.getState().deferTask(deferredTask.id);
    useCoachStore.getState().deferTask(deferredTask.id);
    useCoachStore.getState().deferTask(deferredTask.id);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows at most three tasks', () => {
    const { getAllByText } = render(<TodayScreen />);
    const buttons = getAllByText('Start');
    expect(buttons.length).toBeLessThanOrEqual(3);
  });

  it('shows micro-step CTA after repeated defers', () => {
    const { getAllByText } = render(<TodayScreen />);
    expect(getAllByText('Make it 5 minutes').length).toBeGreaterThan(0);
  });

  it('marks a task done when Start is pressed', () => {
    const { getAllByText } = render(<TodayScreen />);
    fireEvent.press(getAllByText('Start')[0]);
    const tasks = useCoachStore.getState().planTasks;
    expect(tasks.some(task => task.status === 'done')).toBe(true);
  });

  it('blocks micro-step when daily limit is reached', async () => {
    useCoachStore.setState({
      microStepLimit: 0,
      microStepWindowStart: new Date().toISOString(),
      microStepCount: 0,
    });
    const { getAllByText } = render(<TodayScreen />);
    fireEvent.press(getAllByText('Make it 5 minutes')[0]);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });
  });

  it('captures defer reason when task is deferred', () => {
    const { getAllByText } = render(<TodayScreen />);
    const deferButtons = getAllByText('Not today');
    fireEvent.press(deferButtons[0]);
    
    // Should show defer reason modal
    expect(getAllByText('Why not?').length).toBeGreaterThan(0);
    expect(getAllByText('Too hard').length).toBeGreaterThan(0);
    expect(getAllByText('Too long').length).toBeGreaterThan(0);
    expect(getAllByText('Not important').length).toBeGreaterThan(0);
    expect(getAllByText('Don\'t know how').length).toBeGreaterThan(0);
  });

  it('shows #1 task expanded by default', () => {
    const { getByText } = render(<TodayScreen />);
    const tasks = useCoachStore.getState().planTasks.filter(
      t => t.scheduledDate === new Date().toISOString().slice(0, 10)
    );
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      expect(getByText(firstTask.nextAction)).toBeTruthy();
    }
  });

  it('shows "Later today" collapsible for additional tasks', () => {
    const { getByText } = render(<TodayScreen />);
    const tasks = useCoachStore.getState().planTasks.filter(
      t => t.scheduledDate === new Date().toISOString().slice(0, 10) && t.status !== 'done'
    );
    if (tasks.length > 1) {
      expect(getByText('Later today')).toBeTruthy();
    }
  });
});
