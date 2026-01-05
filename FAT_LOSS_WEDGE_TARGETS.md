# PHASE 0 — FILE TARGETS FOR FAT LOSS WEDGE

## Files to Edit

### Copy/Strings
- `src/copy/strings.ts` - All user-facing copy

### Start Screen
- `src/screens/Start/StartScreen.tsx` - Onboarding flow
- `src/utils/fatLossQuestions.ts` - Question definitions (if exists)

### AI Coach
- `src/services/aiCoach.ts` - Question schema, question bank, plan constraints

### Types
- `src/types/coach.ts` - DeferReason type

### Today Screen
- `src/screens/Today/TodayScreen.tsx` - Defer modal UI

### Tests
- `src/screens/Start/__tests__/StartScreen.test.tsx`
- `src/screens/Today/__tests__/TodayScreen.test.tsx`
- `src/services/__tests__/aiCoach.test.ts`

### Documentation
- Move phase completion docs to `/docs/archive/` or delete

