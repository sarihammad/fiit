/**
 * Central copy file for FIIT - Nutrition Execution Coach
 * 
 * RULES:
 * - No "AI-powered", "engine", "workflow", "generate"
 * - Short, confident, action-first
 * - Outcome language only
 * - Emotionally resonant
 */

export const Copy = {
  // ===== START SCREEN =====
  start: {
    headline: "What's your fat loss focus right now?",
    subheadline: "No perfect plan. Just 1–3 actions per day.",
    placeholder: "e.g., Lose fat without starving",
    examples: [
      "Lose fat without starving",
      "Stop late-night snacking",
      "Stay in a deficit without tracking perfectly",
      "Meal prep to stop ordering food",
      "Hit protein so I stay full",
    ],
    continueButton: "Continue",
    coachingHeader: "Let's make this realistic.",
    coachingSubheader: "One question at a time.",
    answerPlaceholder: "Type your answer",
    answerNeeded: "Answer needed",
    answerNeededMessage: "Give a quick answer to keep moving.",
  },

  // ===== COACHING QUESTIONS =====
  questions: {
    targetOutcome: "What does a good week look like? (scale, waist, or consistency)",
    constraints: "Any foods you avoid / dietary constraints?",
    schedule: "How many days can you cook or meal prep?",
    resources: "What's your budget + kitchen access?",
    habits: "What breaks your diet most? (cravings, weekends, stress, social)",
    timeAvailable: "How much time per day can you give? (5/15/30 min)",
    confidence: "Confidence 1–10. What would raise it by 1?",
  },

  // ===== PLAN SCREEN =====
  plan: {
    headline: "Your 7-Day Fat Loss Plan",
    subheadline: "Lock it so you stop restarting.",
    previewTitle: "Preview your plan",
    generateButton: "Build my 7-day plan",
    generating: "Building...",
    commitButton: "Commit & Lock",
    commitConfirmTitle: "Commit & lock this week?",
    commitConfirmMessage: "You'll stop re-planning and focus on consistency.",
    commitConfirmButton: "Commit",
    commitCancelButton: "Cancel",
    afterCommitTitle: "After you commit:",
    afterCommitBullet1: "This week locks so you stop restarting.",
    afterCommitBullet2: "Today will show only 1–3 actions.",
    afterCommitBullet3: "You can reset only via 'Reset Week'.",
    lockedTitle: "Your locked plan",
    resetButton: "Reset Week",
    resetConfirmTitle: "Reset week?",
    resetConfirmMessage: "Resetting clears your plan so you can build a new one.",
    resetConfirmButton: "Reset",
    resetCancelButton: "Cancel",
    resetLimitReached: "Reset limit reached",
    resetLimitMessage: "You've used your monthly reset. Upgrade for unlimited resets.",
    upgradeButton: "Upgrade",
    notNowButton: "Not now",
    noPreview: "Build your plan to see the next 7 days.",
    rulesTitle: "Rules of the week",
    whyWorksTitle: "Why this plan works",
  },

  // ===== TODAY SCREEN =====
  today: {
    headline: "Today's fat-loss actions",
    subheadline: "Do the next obvious thing.",
    noTasks: "No actions scheduled for today. You're free to reset or plan ahead.",
    startButton: "Start",
    notTodayButton: "Not today",
    laterToday: "Later today",
    deferReasons: {
      title: "Why not?",
      tooHard: "Too hard",
      tooLong: "Too long",
      dontKnowHow: "Not sure what to do",
      cravings: "Cravings / hunger",
      noFoodReady: "No food ready",
      noTime: "No time",
    },
    makeItEasier: "Make it 5 minutes",
    makeItEasierTitle: "Want a 5-minute version?",
    makeItEasierSubtitle: "We'll make this feel doable right now.",
    makeItEasierWorking: "Working...",
    makeItEasierClose: "Close",
    deferredStreakTitle: "You've pushed this {count} times. Want a 5-minute version?",
    microStepLimitReached: "Daily limit reached",
    microStepLimitMessage: "Upgrade for unlimited 'Make it 5 minutes'.",
    focusTimer: {
      title: "Focus",
      start5: "5 min",
      start10: "10 min",
      start15: "15 min",
      done: "Done?",
      doneButton: "Done",
      notYetButton: "Not yet",
    },
  },

  // ===== SETTINGS =====
  settings: {
    title: "Settings",
    resetWeek: "Reset Week",
    remainingResets: "{count} reset{plural} remaining this month",
    upgrade: "Upgrade",
    disclaimer: "Medical Disclaimer",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    dataExport: "Export Data",
    dataDelete: "Delete All Data",
  },

  // ===== UPGRADE =====
  upgrade: {
    headline: "Get consistent faster",
    subheadline: "Unlimited reset week + unlimited 'Make it 5 minutes'.",
    features: {
      unlimitedResets: "Unlimited week resets",
      unlimitedMicroSteps: "Unlimited 'Make it 5 minutes'",
      weeklyReview: "Weekly execution review",
    },
  },

  // ===== MEDICAL DISCLAIMER =====
  disclaimer: {
    title: "Important Medical Information",
    subtitle: "Please read carefully before continuing",
    notMedicalAdvice: "This is not medical advice. It's a coaching tool.",
    consultProfessional: "Before starting any nutrition program, consult with a qualified healthcare provider.",
    acknowledge: "I Understand & Accept",
    decline: "I do not accept",
  },

  // ===== COMMON =====
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try again",
    cancel: "Cancel",
    close: "Close",
    back: "Back",
    next: "Next",
    save: "Save",
    delete: "Delete",
    confirm: "Confirm",
  },
} as const;

// Helper to replace placeholders
export function formatCopy(
  template: string,
  values: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

