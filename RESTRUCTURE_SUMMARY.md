# FIIT RESTRUCTURE SUMMARY

## Completed Phases

### ✅ Phase 0: Repo Audit
- Documented framework (Expo/React Native)
- Identified active screens (7 routes in RootStack)
- Quarantined 8 unused screen directories to `/_graveyard/`
- Mapped data layer (Zustand + AsyncStorage)
- Documented AI engine structure

### ✅ Phase 1: Delete/Quarantine Dead Screens
- Moved unused screens to `src/_graveyard/`:
  - Auth/SignInScreen.tsx
  - Home/ (empty)
  - Log/ (empty)
  - Onboarding/ (tests only)
  - Paywall/ (tests only)
  - Planner/ (tests only)
  - Progress/ (empty)
  - LandingScreen.tsx
- Created graveyard README with explanation

### ✅ Phase 2: Rename Domain Vocabulary
- Created central copy file (`src/copy/strings.ts`)
- Updated all user-facing strings to nutrition-focused language
- Replaced generic terms:
  - "Goal" → "Nutrition Goal" (in UI)
  - "Tasks" → "Actions" (in UI)
  - "Defer" → "Not today"
  - "Micro-step" → "Make it 5 minutes"
  - "Weekly Plan" → "7-Day Nutrition Plan"

### ✅ Phase 3: Onboarding Flow
- Added MedicalDisclaimerModal to StartScreen
- Shows before goal intake on first visit
- Updated intake with nutrition examples:
  - "Lose 15 lbs without starving"
  - "Hit 140g protein daily"
  - "Stop ordering food 5x/week"
  - "Meal prep twice a week"
  - "Reduce sugar cravings at night"
- Added tap-to-autofill for examples

### ✅ Phase 4: AI Coach Engine - Nutrition Prompts
- Updated question keys to nutrition-specific:
  - `targetOutcome`, `constraints`, `schedule`, `resources`, `habits`, `timeAvailable`, `confidence`
- Updated question templates with nutrition-focused prompts
- Enhanced plan schema:
  - Added `actionType` (meal_prep, grocery, protein, hydration, workout, sleep, environment, craving_plan)
  - Added `rulesOfTheWeek` (max 3)
  - Added `whyThisWorks` explanation
- Updated fallback plan generator with nutrition tasks
- Enhanced micro-step to accept `deferReason` parameter

### ✅ Phase 5: Plan Screen Enhancements
- Added commit confirmation dialog
- Display "Rules of the week" in preview and locked plan
- Display "Why this plan works" explanation
- Updated all copy to use central strings file
- Improved reset UX with clear messaging

### ✅ Phase 6: Today Mode Refactor
- **Bossy focus**: #1 task expanded by default with large `nextAction` display
- **Defer reason capture**: Modal with 4 options (too hard, too long, not important, don't know how)
- **Later today**: Collapsible section for tasks #2 and #3
- **Micro-step improvements**: Uses `deferReason` to generate better 5-minute versions
- Updated all copy to nutrition-focused language

### ✅ Phase 7: Settings Refactor
- Added reset week info with remaining count
- Added medical disclaimer access
- Removed generic "productivity" language
- Updated footer to say "nutrition coaching tool, not medical advice"

### ✅ Phase 8: Copywriting Overhaul
- Created `src/copy/strings.ts` with all user-facing strings
- No "AI-powered", "engine", "workflow", "generate" language
- Short, confident, action-first copy
- Outcome-driven language throughout
- Emotionally resonant headlines

## Remaining Work

### ⏳ Phase 9: Remove Remaining Generic Language
Most generic language has been removed from user-facing strings. Remaining instances are:
- Internal variable names (acceptable - no user impact)
- Test files (can be updated in Phase 10)
- Analytics event names (internal only)
- Comments (acceptable)

### ⏳ Phase 10: Critical Path Tests
Tests need to be updated to reflect:
1. Nutrition-focused onboarding flow
2. Defer reason capture
3. New plan schema (rulesOfTheWeek, whyThisWorks, actionType)
4. Updated question keys
5. Micro-step with deferReason

## Key Changes Summary

### Data Model Updates
- `PlanTask` now includes:
  - `actionType?: ActionType`
  - `lastDeferReason?: DeferReason`
- `WeeklyPlan` output includes:
  - `rulesOfTheWeek: string[]`
  - `whyThisWorks?: string`

### New Types
- `ActionType`: meal_prep | grocery | protein | hydration | workout | sleep | environment | craving_plan
- `DeferReason`: tooHard | tooLong | notImportant | dontKnowHow

### Navigation
- Only 7 active routes remain (Start, Plan, Today, Settings, Upgrade, Privacy, Terms)
- All dead screens quarantined

### Copy Strategy
- Centralized in `src/copy/strings.ts`
- Nutrition-focused throughout
- No AI/productivity jargon
- Action-first, outcome-driven

## Testing Checklist

Before considering complete, verify:
- [ ] New user flow: Start → Disclaimer → Goal Intake → 7 Questions → Plan Preview → Commit → Today
- [ ] Plan shows rulesOfTheWeek and whyThisWorks
- [ ] Today Mode shows #1 task expanded with large nextAction
- [ ] Defer reason capture works and stores correctly
- [ ] Micro-step generation uses deferReason
- [ ] "Later today" collapsible works for tasks #2 and #3
- [ ] Commit confirmation dialog appears
- [ ] Reset week shows remaining count
- [ ] All copy is nutrition-focused (no generic language)

## Next Steps

1. Run the app and test the full flow
2. Update test files to match new structure
3. Review and refine copy based on user testing
4. Consider adding focus timer flow (mentioned in requirements but not yet implemented)
5. Add analytics events for new features (defer reason, etc.)





