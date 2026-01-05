# PHASE 0 — REPO AUDIT

## Framework & Stack
- **Framework**: Expo ~52.0.0 / React Native 0.76.9
- **Navigation**: React Navigation Stack (RootStack.tsx)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: NativeWind (TailwindCSS)
- **Testing**: Jest + React Native Testing Library

## Navigation Entry Point
**File**: `src/app/RootStack.tsx`

**Active Routes** (7 total):
1. `Start` → StartScreen
2. `Plan` → PlanScreen
3. `Today` → TodayScreen
4. `Settings` → SettingsScreen
5. `Upgrade` → UpgradeScreen
6. `Privacy` → PrivacyScreen
7. `Terms` → TermsScreen

## Active Screens (Reachable from RootStack)
✅ **USED**:
- `src/screens/Start/StartScreen.tsx` - Goal intake + Q&A flow
- `src/screens/Plan/PlanScreen.tsx` - Weekly plan preview + commit
- `src/screens/Today/TodayScreen.tsx` - Today's tasks (max 3)
- `src/screens/Settings/SettingsScreen.tsx`
- `src/screens/Settings/PrivacyScreen.tsx`
- `src/screens/Settings/TermsScreen.tsx`
- `src/screens/Upgrade/UpgradeScreen.tsx`

## Dead Screens (NOT Reachable from RootStack)
❌ **UNUSED** - Must be quarantined/deleted:
- `src/screens/Auth/SignInScreen.tsx` - Not imported anywhere
- `src/screens/Home/` - Empty directory
- `src/screens/Log/` - Empty directory
- `src/screens/Onboarding/` - Only has `__tests__/`, no screen file
- `src/screens/Paywall/` - Only has `__tests__/`, no screen file
- `src/screens/Planner/` - Only has `__tests__/`, no screen file
- `src/screens/Progress/` - Empty directory
- `src/screens/LandingScreen.tsx` - Not imported in RootStack

## Data Layer

### State Store
**File**: `src/state/coach.store.ts`
- Uses Zustand with AsyncStorage persistence
- Store key: `fiit_coach_store`

### Core Entities (from `src/types/coach.ts`):
1. **Goal** - Generic goal entity
   - Fields: id, userId, title, status (draft/active/archived), timestamps
2. **GoalClarificationAnswer** - Q&A answers
   - Fields: id, goalId, questionKey, questionText, answerText, createdAt
3. **WeeklyPlan** - 7-day plan
   - Fields: id, goalId, userId, startDate, status (locked/reset_pending/archived), createdAt
4. **PlanTask** - Individual tasks
   - Fields: id, weeklyPlanId, title, whyThisMatters, nextAction, estimateMinutes, scheduledDate, priority (1-3), status (todo/done/deferred), deferCount, lastDeferredAt, timestamps
5. **ExecutionEvent** - Task interaction events
   - Fields: id, userId, taskId, type (done/defer/help/open), createdAt

### Storage Mechanism
- AsyncStorage via Zustand persist middleware
- No backend sync currently (local-only)

## AI Modules

### AICoachEngine
**File**: `src/services/aiCoach.ts`

**Current Implementation**:
- Uses **fallback/deterministic** logic only (no actual AI calls)
- Caches responses in-memory Map
- Three main functions:
  1. `getClarificationQuestion()` - Returns next question based on answered keys
  2. `generateWeeklyPlan()` - Creates 7-day plan from goal + answers
  3. `generateMicroStep()` - Simplifies a task to 5-minute version

**Question Keys** (generic, not nutrition-focused):
- timeframe, constraints, skills, interests, resources, hours, targetDefinition, firstStep, risk

**Schemas** (Zod validation):
- `QuestionSchema` - questionKey + questionText
- `WeeklyPlanSchema` - planTitle + tasks array (max 21)
- `PlanTaskSchema` - day, priority, title, whyThisMatters, nextAction, estimateMinutes
- `MicroStepSchema` - rewrittenTaskTitle, microStep, estimateMinutes

**Fallback Logic**:
- Questions: Returns next unasked question from fixed order
- Plan: Generates generic 7-day template with execution-focused tasks
- Micro-step: Returns generic "Spend five minutes drafting the first tiny part"

## Medical Disclaimer
**File**: `src/components/MedicalDisclaimerModal.tsx`
- Currently states: "FIIT is a nutrition and wellness tool designed to help you track meals, plan your diet, and work towards your weight goals."
- **MISMATCH**: App core loop is generic execution coaching, not nutrition-specific
- Not currently shown in onboarding flow

## Generic Language Found (Needs Nutrition Replacement)
- "Goal" → Should be "Nutrition Goal"
- "Tasks" → Should be "Actions"
- "Defer" → Should be "Not today"
- "Micro-step" → Should be "Make it 5 minutes"
- "Execution" → Should be "Consistency"
- "Weekly Plan" → Should be "7-Day Nutrition Plan"
- Question keys: timeframe, constraints, skills, interests, resources, hours, targetDefinition, firstStep, risk → Need nutrition-specific versions
- StartScreen placeholder: "I want to make money with a side project" → Nutrition example needed
- Plan fallback tasks: Generic execution tasks → Need nutrition tasks (meal prep, groceries, protein, etc.)

## Copy Issues
- StartScreen: "What do you want to make real?" → Should be nutrition-focused
- PlanScreen: "Here's your plan for the next 7 days" → Should emphasize nutrition
- TodayScreen: "Just do the next obvious thing" → Good, but needs nutrition context
- No "AI-powered" language found (good)
- Some "engine" references in code comments

## Missing Features (Per Requirements)
1. ❌ Defer reason capture (currently just increments deferCount)
2. ❌ Focus timer flow in Today Mode
3. ❌ Default expand #1 task in Today Mode
4. ❌ "Later today" collapsible for #2 and #3
5. ❌ Disclaimer shown at start of onboarding
6. ❌ Nutrition-specific question examples in intake
7. ❌ "Rules of the week" in plan output
8. ❌ "Why this plan works" explanation
9. ❌ Commit confirmation dialog
10. ❌ Defer reason used in micro-step generation

## Test Coverage
- `src/screens/Start/__tests__/StartScreen.test.tsx`
- `src/screens/Plan/__tests__/PlanScreen.test.tsx`
- `src/screens/Today/__tests__/TodayScreen.test.tsx`
- `src/services/__tests__/aiCoach.test.ts`
- `src/state/__tests__/coach.store.test.ts`
- `src/state/__tests__/compliance.store.test.ts`
- `src/services/__tests__/auth.test.ts`
- `src/services/__tests__/paywall.test.ts`

## Next Steps
1. Create `/src/_graveyard/` folder
2. Move/delete unused screens
3. Begin Phase 1 cleanup



