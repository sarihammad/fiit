import { GoalClarificationAnswer } from '@/types/coach';

export type FatLossQuestionKey =
  | 'targetOutcome'
  | 'constraints'
  | 'schedule'
  | 'resources'
  | 'habits'
  | 'timeAvailable'
  | 'confidence';

export interface FatLossQuestion {
  key: FatLossQuestionKey;
  text: string;
  options?: string[];
  isFreeText?: boolean;
}

export const fatLossQuestions: FatLossQuestion[] = [
  {
    key: 'targetOutcome',
    text: "What does a good week look like? (scale, waist, or consistency)",
    isFreeText: true,
  },
  {
    key: 'constraints',
    text: "Any foods you avoid / dietary constraints?",
    isFreeText: true,
  },
  {
    key: 'schedule',
    text: "How many days can you cook or meal prep?",
    options: ['0', '1', '2', '3+'],
  },
  {
    key: 'resources',
    text: "What's your budget + kitchen access?",
    isFreeText: true,
  },
  {
    key: 'habits',
    text: "What breaks your diet most? (cravings, weekends, stress, social)",
    options: ['Cravings', 'Weekends', 'Stress', 'Social', 'Late night'],
  },
  {
    key: 'timeAvailable',
    text: "How much time per day can you give? (5/15/30 min)",
    options: ['5 min', '15 min', '30 min'],
  },
  {
    key: 'confidence',
    text: "Confidence 1–10. What would raise it by 1?",
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


