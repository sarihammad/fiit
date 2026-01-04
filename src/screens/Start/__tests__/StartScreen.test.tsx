import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { StartScreen } from '../StartScreen';
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
    getClarificationQuestion: jest.fn(async () => ({
      questionKey: 'targetOutcome',
      questionText: 'What does success look like in 7 days?',
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
    start: {
      headline: 'What do you want to change about your nutrition?',
      subheadline: 'Type it messy. We\'ll make it actionable.',
      placeholder: 'e.g., Lose 15 lbs without starving',
      continueButton: 'Continue',
      answerNeeded: 'Answer needed',
      answerNeededMessage: 'Give a quick answer to keep moving.',
      answerPlaceholder: 'Type your answer',
      coachingHeader: 'Let\'s make this realistic.',
      coachingSubheader: 'One question at a time.',
    },
  },
}));

jest.mock('@/components/MedicalDisclaimerModal', () => ({
  MedicalDisclaimerModal: ({ visible, onAccept, onDecline }: any) => {
    const React = require('react');
    if (!visible) return null;
    return React.createElement('View', { testID: 'disclaimer-modal' }, [
      React.createElement('Text', { key: 'title' }, 'Important Medical Information'),
      React.createElement('Button', { key: 'accept', title: 'I Understand & Accept', onPress: onAccept }),
      React.createElement('Button', { key: 'decline', title: 'I do not accept', onPress: onDecline }),
    ]);
  },
}));

describe('StartScreen', () => {
  beforeEach(() => {
    useCoachStore.getState().resetCoach();
  });

  it('advances to the first question after submitting a nutrition goal', async () => {
    const { getByPlaceholderText, getByText } = render(<StartScreen />);

    fireEvent.changeText(
      getByPlaceholderText('e.g., Lose 15 lbs without starving'),
      'Lose 15 lbs without starving'
    );
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('What does success look like in 7 days?')).toBeTruthy();
    });
  });

  it('shows disclaimer modal on first visit', async () => {
    const { getByText } = render(<StartScreen />);
    // Disclaimer should be shown (modal visible)
    await waitFor(() => {
      // Check for disclaimer content or accept button
      expect(getByText('I Understand & Accept')).toBeTruthy();
    });
  });
});
