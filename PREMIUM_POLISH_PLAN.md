# FIIT Premium Polish - Production v1.0 Plan

**Status:** In Progress  
**Goal:** Premium UX + High Conversion  
**Timeline:** 14 days to launch

---

## ✅ Completed (This Session)

### P0 - Global Cleanup

- ✅ Removed dating copy from `ThemeProvider.tsx` (@charm-ai → @fiit)
- ✅ Fixed dating references in `ai.ts` (coach prompts now FIIT-focused)
- ✅ Created `MacroChips.tsx` component with status colors
- ✅ Created `NextBestAction.tsx` component with premium styling

---

## 🚧 Critical Path (Must Complete)

### Day 1-2: P0 Remaining - Core UX Polish

#### 1. Home Screen Enhancement

**File:** `src/screens/Home/HomeScreen.tsx`

**Changes Needed:**

```typescript
// Add imports
import { MacroChips } from '@/components/MacroChips';
import { NextBestAction } from '@/components/NextBestAction';

// Replace "Today's Summary" card with:
// 1. Calorie ring (ScoreDial)
// 2. MacroChips below ring
// 3. NextBestAction button (derive from state)
// 4. Today's meals FlatList with swipe actions
// 5. Empty state: "Snap your first meal—logging takes 5 seconds"

const getNextAction = () => {
  const hour = new Date().getHours();
  const hasMeals = dayLog.meals.length > 0;

  if (!hasMeals && hour >= 11 && hour < 14) return 'log_meal';
  if (hasMeals && !latestFeedback) return 'get_feedback';
  if (!hasWeekPlan) return 'plan_week';
  return 'add_weight';
};
```

#### 2. Kill Remaining Dating Copy

**Files to Update:**

- `src/screens/Settings/AISettingsScreen.tsx` - Change all "dating" to "nutrition coaching"
- `src/screens/Home/AnalyzerScreen.tsx` - Remove or repurpose for meal analysis
- `src/screens/Home/CoachScreen.tsx` - Remove or repurpose for nutrition Q&A
- `src/screens/Home/TasksScreen.tsx` - Replace tasks with nutrition habits
- `src/screens/Home/ProgressScreen.tsx` - Ensure all copy is nutrition-focused

**Quick Fix Script:**

```bash
# Find and list all remaining references
grep -r "dating\|charm\|charisma" src --include="*.ts" --include="*.tsx" > dating_refs.txt

# Manual review and update each file
```

---

### Day 3-4: Photo Logging Flow

#### File: `src/screens/Log/MealLogScreen.tsx`

**Add Portion Selector Component:**

```typescript
const PortionSelector: React.FC<{
  onSelect: (portion: string, grams: number) => void;
}> = ({ onSelect }) => {
  const presets = [
    { label: '100g', grams: 100 },
    { label: '1 cup', grams: 240 },
    { label: '1 serving', grams: 150 },
    { label: 'Custom', grams: 0 },
  ];

  return (
    <View>
      {presets.map(preset => (
        <TouchableOpacity onPress={() => onSelect(preset.label, preset.grams)}>
          <Text>{preset.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

**Update Photo Flow:**

1. Camera capture → `CameraModal`
2. Show detected food with confidence
3. Portion selector screen
4. Macro preview card
5. "Looks good" → Save or "Not quite" → Manual

---

### Day 5-6: Planner & Grocery UX

#### File: `src/screens/Planner/MealPlannerScreen.tsx`

**Inline Controls (Top of Screen):**

```typescript
<View style={styles.controls}>
  <SegmentedControl
    options={['Budget', 'Medium', 'Premium']}
    value={budget}
    onChange={setBudget}
  />
  <Slider
    label="Cooking Time"
    value={cookTime}
    min={15}
    max={60}
    step={15}
    onChange={setCookTime}
  />
</View>
```

**Swap Meal Modal:**

```typescript
const SwapMealModal: React.FC<{
  meal: MealItem;
  onSwap: (newMeal: MealItem) => void;
}> = ({ meal, onSwap }) => {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate 3 alternatives
    FIITAI.swapMeal(meal, goals).then(setAlternatives);
  }, []);

  return (
    <Modal>
      {alternatives.map(alt => (
        <SwapOption meal={alt} onSelect={() => onSwap(alt)} />
      ))}
    </Modal>
  );
};
```

**Grocery List Grouping:**

```typescript
const groupGroceries = (items: GroceryItem[]) => {
  return {
    produce: items.filter(i => i.category === 'produce'),
    protein: items.filter(i => i.category === 'protein'),
    carbs: items.filter(i => i.category === 'carbs'),
    pantry: items.filter(i => i.category === 'pantry'),
  };
};

// Render with sections
<SectionList
  sections={[
    { title: '🥬 Produce', data: grouped.produce },
    { title: '🥩 Protein', data: grouped.protein },
    { title: '🌾 Carbs', data: grouped.carbs },
    { title: '🧂 Pantry', data: grouped.pantry },
  ]}
/>
```

---

### Day 7: Insights Polish

#### File: `src/screens/Progress/InsightsScreen.tsx`

**3 Bullets + Tomorrow Plan:**

```typescript
interface FeedbackDisplay {
  bullets: string[];  // Max 3, concise
  tomorrowPlan: {
    meal: string;  // "Swap your usual snack for Greek yogurt"
    hydration: string;  // "Target 2L water by 6pm"
  };
  mood: 'encouraging' | 'supportive' | 'analytical' | 'celebratory';
}

// Skeleton State
{isLoading && <SkeletonInsights />}

// Cache Last Result
const [lastFeedback, setLastFeedback] = useAsyncStorage(
  '@fiit/lastFeedback',
  null
);

// Fallback on Error
{error && lastFeedback && (
  <View>
    <Text>Using yesterday's feedback:</Text>
    <FeedbackCard feedback={lastFeedback} />
  </View>
)}
```

---

### Day 8-9: Paywall Premium Copy

#### File: `src/screens/Paywall/PaywallScreen.tsx`

**Updated Copy:**

```typescript
const PAYWALL_COPY = {
  headline: 'Lose 7 lbs in 30 days — guaranteed',
  subheadline:
    'Meal plans that fit your lifestyle. Photo calorie logging. Daily feedback that keeps you on track.',
  benefits: [
    {
      icon: '📸',
      title: 'Snap a photo → we log it',
      description: 'Automatic calorie and macro tracking',
    },
    {
      icon: '🍽️',
      title: 'Plans tailored to you',
      description: 'Your budget, taste, and time',
    },
    {
      icon: '🛒',
      title: 'Grocery lists done for you',
      description: 'One-tap copy or share',
    },
    {
      icon: '💬',
      title: 'Daily feedback & reminders',
      description: '3 quick wins for tomorrow',
    },
  ],
  plans: [
    {
      id: 'fiit_yearly',
      price: '$79/year',
      perMonth: '$6.58/mo',
      trial: '7-day free trial',
      badge: 'Best Value',
      savings: 'Save 26% vs weekly',
    },
    {
      id: 'fiit_weekly',
      price: '$9/week',
      trial: '7-day free trial',
    },
    {
      id: 'fiit_premium',
      price: '$199/year',
      perMonth: '$16.58/mo',
      badge: 'Premium',
      extras: ['Everything in Yearly', 'Weekly AI check-in summaries'],
    },
  ],
};
```

**Gating Logic:**

```typescript
const FEATURE_GATES = {
  photo_logging: 'free',
  manual_logging: 'free',
  search_logging: 'free',
  meal_planner: 'pro',
  grocery_list: 'pro',
  insights_history: 'pro',
  weekly_checkins: 'premium',
};

const canAccess = (feature: string) => {
  const gate = FEATURE_GATES[feature];
  if (gate === 'free') return true;
  if (gate === 'pro') return isPro || isPremium;
  if (gate === 'premium') return isPremium;
  return false;
};
```

---

### Day 10: Notifications

#### File: `src/services/notifications.ts`

**Premium Copy:**

```typescript
const NOTIFICATION_COPY = {
  morning: {
    title: 'Your plan for today is ready 🌅',
    body: '2 breakfast ideas in 10 seconds',
    time: { hour: 7, minute: 30 },
  },
  lunch: {
    title: 'Lunch logging saves 200+ kcal on average 🥗',
    body: 'Add yours in 5 seconds?',
    time: { hour: 12, minute: 15 },
  },
  evening: {
    title: '3-minute check-in → tips for tomorrow 📊',
    body: 'Your daily feedback is ready',
    time: { hour: 20, minute: 0 },
  },
  missedDay: {
    title: "You're 1 tap from keeping your streak 🔥",
    body: 'Quick lunch log?',
  },
  day3Trial: {
    title: "You're on track for -2.1 lbs! 💪",
    body: 'Want a protein-first plan for tomorrow?',
  },
  day6Trial: {
    title: 'Projected -7.4 lbs in 30 days 🎯',
    body: 'Keep it going with personalized plans',
  },
};
```

---

### Day 11: Safety & Compliance

#### New File: `src/components/MedicalDisclaimerModal.tsx`

```typescript
const MedicalDisclaimerModal: React.FC<{
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ visible, onAccept, onDecline }) => {
  return (
    <Modal visible={visible}>
      <View style={styles.container}>
        <Text style={styles.title}>Before we start</Text>
        <Text style={styles.body}>
          • FIIT provides general nutrition coaching, not medical advice
          • You must be 18+ to use this app
          • Consult your doctor before starting any weight loss program
          • If you have an eating disorder, please seek professional help
        </Text>
        <Checkbox
          label="I'm 18+ and understand FIIT is for general guidance"
          value={ageConfirmed}
          onChange={setAgeConfirmed}
        />
        <Button title="Accept & Continue" onPress={onAccept} disabled={!ageConfirmed} />
        <Button title="Decline" onPress={onDecline} variant="ghost" />
      </View>
    </Modal>
  );
};
```

**AI Prompt Guardrails:**

```typescript
// In src/services/ai.ts
const SAFETY_SYSTEM_PROMPT = `
CRITICAL SAFETY RULES:
1. NEVER recommend calorie targets below 1200 for women or 1500 for men
2. NEVER suggest extreme or rapid weight loss (>2 lbs/week)
3. ALWAYS encourage consulting a doctor for medical conditions
4. REFUSE to provide advice that could harm eating disorder recovery
5. Flag if user's BMI target appears unhealthy (<18.5 or attempts at <18.5)

If a request violates these rules, respond:
"I can't provide that advice as it may not be safe. Please consult a healthcare professional."
`;
```

---

### Day 12: Visual Polish

#### Typography Scale

```typescript
// src/theme/tokens.ts
export const typography = {
  display: { size: 32, weight: '700', lineHeight: 40 },
  h1: { size: 28, weight: '600', lineHeight: 36 },
  h2: { size: 24, weight: '600', lineHeight: 32 },
  h3: { size: 20, weight: '600', lineHeight: 28 },
  body: { size: 16, weight: '400', lineHeight: 24 },
  bodyLarge: { size: 17, weight: '400', lineHeight: 26 },
  label: { size: 14, weight: '500', lineHeight: 20 },
  labelSmall: { size: 13, weight: '500', lineHeight: 18 },
  caption: { size: 12, weight: '400', lineHeight: 16 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

#### Card Component Enhancement

```typescript
// src/components/Card.tsx - Add shadow
const styles = StyleSheet.create({
  card: {
    borderRadius: 16, // Increased from 12
    padding: 20, // Increased from 16
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
```

---

## 📦 Quick Wins (Can Do Now)

### 1. Update LandingScreen (5 min)

```typescript
// src/screens/LandingScreen.tsx
<Text style={styles.headline}>Eat smarter. Feel lighter.</Text>
<Text style={styles.subheadline}>
  Your AI coach for meal plans, photo calorie logging, and daily feedback.
</Text>
<Button title="Start free 7-day trial" ... />
```

### 2. Add Empty States (10 min)

```typescript
// src/screens/Home/HomeScreen.tsx
{dayLog.meals.length === 0 && (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📸</Text>
    <Text style={styles.emptyTitle}>Snap your first meal</Text>
    <Text style={styles.emptySubtitle}>Logging takes 5 seconds</Text>
    <Button title="Add Meal" onPress={navigateToLog} />
  </View>
)}
```

### 3. Skeleton Loaders (15 min)

```typescript
// src/components/SkeletonCard.tsx
const SkeletonCard = () => (
  <View style={styles.skeleton}>
    <View style={styles.skeletonLine} />
    <View style={styles.skeletonLine} />
    <View style={styles.skeletonLineShort} />
  </View>
);
```

---

## 🧪 Testing Checklist

### Smoke Tests

- [ ] Onboarding → Home → Add meal → Generate plan → Copy grocery
- [ ] Photo logging flow (device only)
- [ ] Paywall triggers on Pro features
- [ ] Notifications schedule correctly
- [ ] Trial starts and gates work
- [ ] Data persists across sessions

### Edge Cases

- [ ] Offline mode (queue meals)
- [ ] API failures show fallbacks
- [ ] Invalid photo → Manual entry
- [ ] Empty states show correctly
- [ ] Dark mode renders properly

---

## 📊 Success Metrics

### Technical

- [ ] TypeScript compiles with no critical errors
- [ ] All screens render without crashes
- [ ] API calls have timeouts and retries
- [ ] Analytics events fire correctly

### UX

- [ ] Onboarding completes in <2 min
- [ ] Photo logging takes <10 sec
- [ ] Plan generation feels fast (<5 sec perceived)
- [ ] Navigation is smooth (60fps)

### Conversion

- [ ] Paywall shows compelling benefits
- [ ] Trial starts with one tap
- [ ] Gating is clear and fair
- [ ] Pricing is prominently displayed

---

## 🚀 Launch Readiness

### Pre-Launch (Complete by Day 13)

- [ ] All dating copy removed
- [ ] Home/Log/Planner/Insights polished
- [ ] Paywall copy finalized
- [ ] Notifications tested on device
- [ ] Medical disclaimer implemented
- [ ] Analytics tracking verified

### Day 14 - Ship It!

- [ ] TestFlight build
- [ ] Beta test with 10 users
- [ ] Fix critical bugs
- [ ] App Store submission

---

**Next Steps:** Start with P0 tasks (Days 1-2), test each change thoroughly, then move to P1 for conversion optimization.

