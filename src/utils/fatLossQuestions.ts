import { GoalClarificationAnswer } from '@/types/coach';

export type FatLossQuestionKey =
  | 'target'
  | 'calories'
  | 'protein'
  | 'cooking'
  | 'cravings'
  | 'steps'
  | 'constraints';

export interface FatLossQuestion {
  key: FatLossQuestionKey;
  text: string;
  options?: string[];
  isFreeText?: boolean;
}

export const fatLossQuestions: FatLossQuestion[] = [
  {
    key: 'target',
    text: "What's your fat loss target for the next 7 days?",
    options: ['-0.5 to 1 lb', 'Stay consistent (no scale focus)'],
  },
  {
    key: 'calories',
    text: 'Do you want a calorie target or just habits?',
    options: ['Calorie range', 'Habits only'],
  },
  {
    key: 'protein',
    text: 'What protein target feels realistic?',
    options: ['90g', '120g', '150g'],
  },
  {
    key: 'cooking',
    text: 'How many days can you cook or meal prep this week?',
    options: ['0', '1', '2', '3+'],
  },
  {
    key: 'cravings',
    text: 'When do cravings hit hardest?',
    options: ['Late night', 'Afternoon', 'Stress', 'Weekends', 'Social'],
  },
  {
    key: 'steps',
    text: 'Daily movement goal?',
    options: ['6k steps', '8k steps', '10k steps'],
  },
  {
    key: 'constraints',
    text: 'Any constraints?',
    isFreeText: true,
  },
];

export function getNextFatLossQuestion(
  answered: GoalClarificationAnswer[]
): FatLossQuestion | null {
  const answeredKeys = new Set(answered.map(a => a.questionKey));
  const next = fatLossQuestions.find(q => !answeredKeys.has(q.key));
  return next || null;
}


