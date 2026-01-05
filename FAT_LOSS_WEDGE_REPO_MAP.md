# PHASE 0 — REPO MAP FOR FAT LOSS WEDGE

## Navigation
- **RootStack**: `src/app/RootStack.tsx`
- **Active Screens**: Start, Plan, Today, Settings, Upgrade, Privacy, Terms

## Domain Types/Models
- **Types**: `src/types/coach.ts`
  - Goal (needs track field)
  - PlanTask (actionType is optional, needs to be required)
  - ActionType enum (needs update: protein -> protein_anchor, workout -> steps)
  - DeferReason (needs: cravings, noFoodReady, noTime)

## AI Coach Module
- **File**: `src/services/aiCoach.ts`
  - QuestionSchema (needs fat loss questions)
  - PlanTaskSchema (actionType required)
  - WeeklyPlanSchema (needs fat loss constraints)
  - Fallback plan generator (needs fat loss focus)

## Store/State Layer
- **File**: `src/state/coach.store.ts`
  - createGoal, createWeeklyPlan, addPlanTask
  - deferTask (needs new reasons)
  - adaptPlanForAvoidance (needs fat loss adaptations)

## Copy/Strings
- **File**: `src/copy/strings.ts`
  - Needs complete fat loss rewrite

## Components (Already Exist)
- **ActionTypeBadge**: `src/components/ActionTypeBadge.tsx` (needs label updates)
- **FocusTimerModal**: `src/components/FocusTimerModal.tsx` (exists, may need tweaks)
- **MedicalDisclaimerModal**: `src/components/MedicalDisclaimerModal.tsx` (two-step exists)

## Screens to Edit
- **StartScreen**: `src/screens/Start/StartScreen.tsx` (onboarding questions)
- **PlanScreen**: `src/screens/Plan/PlanScreen.tsx` (badges, copy)
- **TodayScreen**: `src/screens/Today/TodayScreen.tsx` (badges, copy, timer integration)

## Files to Create/Edit
1. `src/types/coach.ts` - Add GoalTrack, update ActionType, update DeferReason
2. `src/utils/taskNormalizer.ts` - NEW: normalizeTask function
3. `src/services/aiCoach.ts` - Fat loss questions, constraints, fallback
4. `src/state/coach.store.ts` - normalizeTask on read, fat loss adaptations
5. `src/copy/strings.ts` - Fat loss copy rewrite
6. `src/components/ActionTypeBadge.tsx` - Update labels
7. `src/screens/Start/StartScreen.tsx` - Fat loss questions
8. `src/screens/Plan/PlanScreen.tsx` - Fat loss copy
9. `src/screens/Today/TodayScreen.tsx` - Fat loss copy

