import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanScreen } from '../PlanScreen';
import { useCoachStore } from '@/state/coach.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@/services/aiCoach', () => ({
  AICoachEngine: {
    generateWeeklyPlan: jest.fn(async () => ({
      planTitle: '7-Day Nutrition Plan: Test Goal',
      tasks: [
        {
          day: '2025-01-06',
          priority: 1,
          title: 'Set up your kitchen for success',
          whyThisMatters: 'A prepared environment makes healthy choices automatic.',
          nextAction: 'Clear one counter space and stock 3 protein sources.',
          estimateMinutes: 15,
          actionType: 'environment',
        },
      ],
      rulesOfTheWeek: ['Eat protein at every meal', 'No food delivery apps this week'],
      whyThisWorks: 'This plan starts with easy wins and builds habits that make consistency automatic.',
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
      },
    },
  }),
}));

jest.mock('@/copy/strings', () => ({
  Copy: {
    plan: {
      headline: 'Your 7-Day Plan',
      subheadline: 'Once you commit, it locks — so you stop restarting and start getting consistent.',
      previewTitle: 'Preview your plan',
      generateButton: 'Build my 7-day plan',
      generating: 'Building...',
      commitButton: 'Commit & Lock',
      commitConfirmTitle: 'Commit and lock this week?',
      commitConfirmMessage: 'After you commit, this plan locks. You\'ll need to reset to change it.',
      commitConfirmButton: 'Yes, lock it',
      commitCancelButton: 'Not yet',
      lockedTitle: 'Your locked plan',
      resetButton: 'Reset Week',
      resetConfirmTitle: 'Reset week?',
      resetConfirmMessage: 'Resetting clears your plan so you can build a new one.',
      resetConfirmButton: 'Reset',
      resetCancelButton: 'Cancel',
      resetLimitReached: 'Reset limit reached',
      resetLimitMessage: 'You\'ve used your monthly reset. Upgrade for unlimited resets.',
      upgradeButton: 'Upgrade',
      notNowButton: 'Not now',
      noPreview: 'Build your plan to see the next 7 days.',
      rulesTitle: 'Rules of the week',
      whyWorksTitle: 'Why this plan works',
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

describe('PlanScreen', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    useCoachStore.getState().resetCoach();
    useCoachStore.getState().createGoal('Ship a landing page');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('locks a plan after commit', async () => {
    const { getByText } = render(<PlanScreen />);

    fireEvent.press(getByText('Build my 7-day plan'));
    await waitFor(() => getByText('Commit & Lock'));
    fireEvent.press(getByText('Commit & Lock'));
    
    // Confirm dialog should appear
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Commit and lock this week?',
        expect.any(String),
        expect.any(Array)
      );
    });
    
    // Simulate confirm
    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    const lastCall = alertCalls[alertCalls.length - 1];
    const confirmButton = lastCall[2]?.find((btn: any) => btn.text === 'Yes, lock it');
    if (confirmButton?.onPress) {
      confirmButton.onPress();
    }

    const plan = useCoachStore.getState().weeklyPlans[0];
    expect(plan?.status).toBe('locked');
  });

  it('prevents regeneration when plan is locked', () => {
    const goal = useCoachStore.getState().goals[0];
    if (!goal) return;
    const plan = useCoachStore.getState().createWeeklyPlan(goal.id, '2025-01-06', 'locked');
    useCoachStore.getState().setActivePlan(plan.id);
    const { getByText } = render(<PlanScreen />);
    fireEvent.press(getByText('Build my 7-day plan'));
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('blocks plan reset when limit is reached', () => {
    const goal = useCoachStore.getState().goals[0];
    if (!goal) return;
    const plan = useCoachStore.getState().createWeeklyPlan(goal.id, '2025-01-06', 'locked');
    useCoachStore.getState().setActivePlan(plan.id);
    useCoachStore.setState({
      planResetLimit: 0,
      planResetWindowStart: new Date().toISOString(),
      planResetCount: 0,
    });
    const { getByText } = render(<PlanScreen />);
    fireEvent.press(getByText('Reset Week'));
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('displays rules of the week in plan preview', async () => {
    const { getByText } = render(<PlanScreen />);
    fireEvent.press(getByText('Build my 7-day plan'));
    await waitFor(() => {
      expect(getByText('Rules of the week')).toBeTruthy();
      expect(getByText('Eat protein at every meal')).toBeTruthy();
    });
  });
});
