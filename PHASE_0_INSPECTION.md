# PHASE 0 — INSPECTION RESULTS

## Navigation Structure
- **RootStack**: Stack navigator (not tabs)
- **Routes**: Start → Plan → Today → Settings → Upgrade → Privacy → Terms
- **Default Route Logic**: 
  - If locked plan exists → Today
  - If goal exists → Plan
  - Otherwise → Start
- **No MainTabs found** - app uses Stack navigation

## Current Screens
- ✅ **TodayScreen** exists at `src/screens/Today/TodayScreen.tsx`
  - Already shows 1-3 actions
  - Has FocusTimerModal integration
  - Has "Make it 5 minutes" flow
  - Uses planTasks from coach.store
- ❌ **No HomeScreen, LogScreen, or ProgressScreen found**
- ❌ **No MainTabs found**

## Data Storage
- **Coach State**: `src/state/coach.store.ts` (goals, plans, tasks)
- **User State**: `src/state/user.store.ts` (profile, biometrics)
- **Meal Log Types**: `src/types/api/meals.ts` (MealLogSchema exists)
- ❌ **No meal log state store found** - types exist but no implementation
- ❌ **No NutritionCoachService found** - needs to be created

## Existing Services
- `src/services/aiCoach.ts` - AICoachEngine (plan generation, questions)
- No nutritionCoach.ts service exists

## Current Today Screen Features
- Shows 1-3 tasks from plan
- Focus timer modal
- Defer reasons
- Micro-step generation
- Action type badges

## What's Missing
1. **NutritionCoachService** - generate feedback from logs
2. **fatLossActionPlanner** - generate actions from logs/targets (not just plan)
3. **Daily feedback display** - calories/protein/hydration + tomorrow tip
4. **Log integration** - connect meal logs to coach feedback

## Implementation Plan
1. Create NutritionCoachService (generates feedback from logs)
2. Create fatLossActionPlanner (generates actions from logs/targets)
3. Enhance TodayScreen to show coach feedback
4. Make Today generate actions from logs if available, fallback to plan tasks



