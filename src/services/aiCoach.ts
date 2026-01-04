import { z } from 'zod';
import { GoalClarificationAnswer } from '@/types/coach';

const QuestionSchema = z.object({
  questionKey: z.enum([
    'targetOutcome',
    'constraints',
    'schedule',
    'resources',
    'habits',
    'timeAvailable',
    'confidence',
  ]),
  questionText: z.string().min(3),
});

const PlanTaskSchema = z.object({
  day: z.string(),
  priority: z.number().int().min(1).max(3),
  title: z.string().min(3),
  whyThisMatters: z.string().min(3),
  nextAction: z.string().min(3),
  estimateMinutes: z.number().int().min(5).max(180),
  actionType: z.enum([
    'meal_prep',
    'grocery',
    'protein',
    'hydration',
    'workout',
    'sleep',
    'environment',
    'craving_plan',
  ]),
});

const WeeklyPlanSchema = z.object({
  planTitle: z.string().min(3),
  tasks: z.array(PlanTaskSchema).min(1).max(21),
  rulesOfTheWeek: z.array(z.string()).min(1).max(3),
  whyThisWorks: z.string().min(10).optional(),
});

const MicroStepSchema = z.object({
  rewrittenTitle: z.string().min(3),
  fiveMinuteVersion: z.string().min(3),
  estimateMinutes: z.number().int().min(5).max(10),
});

const questionOrder: z.infer<typeof QuestionSchema>['questionKey'][] = [
  'targetOutcome',
  'constraints',
  'schedule',
  'resources',
  'habits',
  'timeAvailable',
  'confidence',
];

const questionTemplates: Record<
  z.infer<typeof QuestionSchema>['questionKey'],
  string
> = {
  targetOutcome: 'What does success look like in 7 days?',
  constraints: 'Any dietary constraints or foods you avoid?',
  schedule: 'How many days can you cook / meal prep this week?',
  resources: "What's your budget + access to a kitchen?",
  habits: 'What usually causes you to slip? (cravings, time, stress, social, boredom)',
  timeAvailable: 'How much time can you spend daily? (5/15/30 min)',
  confidence: 'How confident are you right now (1–10)? What would raise it by 1?',
};

const coachCache = new Map<string, unknown>();

export const __testOnly = {
  QuestionSchema,
  WeeklyPlanSchema,
  MicroStepSchema,
};

const cacheKey = (prefix: string, payload: unknown) =>
  `${prefix}:${JSON.stringify(payload)}`;

const ensureSchema = <T>(
  schema: z.ZodType<T>,
  payload: unknown,
  fallback: T
): T => {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }
  return fallback;
};

const buildFallbackQuestion = (
  answers: GoalClarificationAnswer[]
): z.infer<typeof QuestionSchema> => {
  const asked = new Set(answers.map(answer => answer.questionKey));
  const nextKey = questionOrder.find(key => !asked.has(key)) || 'confidence';
  return {
    questionKey: nextKey,
    questionText: questionTemplates[nextKey],
  };
};

const buildFallbackPlan = (
  goalTitle: string,
  weekStart: Date
): z.infer<typeof WeeklyPlanSchema> => {
  const tasks: z.infer<typeof PlanTaskSchema>[] = [];
  const dayMillis = 24 * 60 * 60 * 1000;

  const dayTemplates = [
    {
      title: 'Set up your kitchen for success',
      whyThisMatters: 'A prepared environment makes healthy choices automatic.',
      nextAction: 'Clear one counter space and stock 3 protein sources.',
      estimateMinutes: 15,
      actionType: 'environment' as const,
    },
    {
      title: 'Plan your first meal prep session',
      whyThisMatters: 'Meal prep removes daily decision fatigue.',
      nextAction: 'Pick 2 recipes and write your grocery list.',
      estimateMinutes: 20,
      actionType: 'meal_prep' as const,
    },
    {
      title: 'Hit your protein target today',
      whyThisMatters: 'Protein keeps you full and supports your goals.',
      nextAction: 'Eat 30g protein at breakfast and lunch.',
      estimateMinutes: 10,
      actionType: 'protein' as const,
    },
    {
      title: 'Create a craving plan',
      whyThisMatters: 'Knowing what to do when cravings hit prevents slips.',
      nextAction: 'Write down 3 go-to snacks for when cravings hit.',
      estimateMinutes: 10,
      actionType: 'craving_plan' as const,
    },
    {
      title: 'Do your grocery run',
      whyThisMatters: 'Having the right food at home makes consistency easy.',
      nextAction: 'Buy ingredients for your meal prep recipes.',
      estimateMinutes: 30,
      actionType: 'grocery' as const,
    },
    {
      title: 'Track your water intake',
      whyThisMatters: 'Hydration supports energy and reduces false hunger.',
      nextAction: 'Drink 8 glasses of water today.',
      estimateMinutes: 5,
      actionType: 'hydration' as const,
    },
    {
      title: 'Review what worked this week',
      whyThisMatters: 'Noting wins builds momentum for next week.',
      nextAction: 'Write down 3 things that made this week easier.',
      estimateMinutes: 10,
      actionType: 'environment' as const,
    },
  ];

  for (let i = 0; i < dayTemplates.length; i += 1) {
    const day = new Date(weekStart.getTime() + dayMillis * i)
      .toISOString()
      .slice(0, 10);
    tasks.push({
      day,
      priority: i < 2 ? 1 : i < 4 ? 2 : 3,
      ...dayTemplates[i],
    });
  }

  return {
    planTitle: `7-Day Nutrition Plan: ${goalTitle}`,
    tasks,
    rulesOfTheWeek: [
      'Eat protein at every meal',
      'No food delivery apps this week',
      'Meal prep happens on Sunday',
    ],
    whyThisWorks: 'This plan starts with easy wins (kitchen setup, meal prep planning) and builds habits that make consistency automatic.',
  };
};

const buildFallbackMicroStep = (
  taskTitle: string,
  deferReason?: string
): z.infer<typeof MicroStepSchema> => {
  let fiveMinuteVersion = 'Spend 5 minutes on the easiest part.';
  if (deferReason === 'tooHard') {
    fiveMinuteVersion = 'Do just the first tiny step. Open the app, pick one item, done.';
  } else if (deferReason === 'tooLong') {
    fiveMinuteVersion = 'Set a 5-minute timer. Do what you can, then stop.';
  } else if (deferReason === 'dontKnowHow') {
    fiveMinuteVersion = 'Spend 5 minutes researching the first step. Just learn, don\'t do.';
  } else if (deferReason === 'notImportant') {
    fiveMinuteVersion = 'Skip it for now. Focus on what matters today.';
  }
  return {
    rewrittenTitle: taskTitle,
    fiveMinuteVersion,
    estimateMinutes: 5,
  };
};

export const AICoachEngine = {
  getClarificationQuestion: async (
    goalTitle: string,
    answers: GoalClarificationAnswer[]
  ): Promise<z.infer<typeof QuestionSchema>> => {
    const payloadKey = cacheKey('clarify', { goalTitle, answers });
    if (coachCache.has(payloadKey)) {
      return coachCache.get(payloadKey) as z.infer<typeof QuestionSchema>;
    }

    const fallback = buildFallbackQuestion(answers);
    const result = ensureSchema(QuestionSchema, fallback, fallback);
    coachCache.set(payloadKey, result);
    return result;
  },

  generateWeeklyPlan: async (
    goalTitle: string,
    answers: GoalClarificationAnswer[],
    weekStart: Date
  ): Promise<z.infer<typeof WeeklyPlanSchema>> => {
    const payloadKey = cacheKey('plan', { goalTitle, answers, weekStart });
    if (coachCache.has(payloadKey)) {
      return coachCache.get(payloadKey) as z.infer<typeof WeeklyPlanSchema>;
    }

    const fallback = buildFallbackPlan(goalTitle, weekStart);
    const result = ensureSchema(WeeklyPlanSchema, fallback, fallback);
    coachCache.set(payloadKey, result);
    return result;
  },

  generateMicroStep: async (
    taskTitle: string,
    deferCount: number,
    deferReason?: string
  ): Promise<z.infer<typeof MicroStepSchema>> => {
    const payloadKey = cacheKey('micro', { taskTitle, deferCount, deferReason });
    if (coachCache.has(payloadKey)) {
      return coachCache.get(payloadKey) as z.infer<typeof MicroStepSchema>;
    }

    const fallback = buildFallbackMicroStep(taskTitle, deferReason);
    const result = ensureSchema(MicroStepSchema, fallback, fallback);
    coachCache.set(payloadKey, result);
    return result;
  },
};

export type ClarificationQuestion = z.infer<typeof QuestionSchema>;
export type WeeklyPlanOutput = z.infer<typeof WeeklyPlanSchema>;
export type MicroStepOutput = z.infer<typeof MicroStepSchema>;
