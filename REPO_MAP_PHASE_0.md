# PHASE 0 — REPO MAP

## File Locations

### Core Screens
- **TodayScreen**: `src/screens/Today/TodayScreen.tsx`
- **PlanScreen**: `src/screens/Plan/PlanScreen.tsx`
- **StartScreen**: `src/screens/Start/StartScreen.tsx`

### Components
- **MedicalDisclaimerModal**: `src/components/MedicalDisclaimerModal.tsx`

### Services
- **AI Coach Engine**: `src/services/aiCoach.ts`

### State Management
- **Coach Store**: `src/state/coach.store.ts`

### Types/Models
- **Coach Types** (PlanTask, ActionType, DeferReason, etc.): `src/types/coach.ts`

### Copy/Strings
- **Central Copy File**: `src/copy/strings.ts`

## Current Structure Summary
- TodayScreen: Shows max 3 tasks, has defer reason modal, micro-step flow
- PlanScreen: Preview + Commit Plan flow
- StartScreen: Goal intake + 7 questions + disclaimer
- MedicalDisclaimerModal: Full long disclaimer (needs two-step)
- aiCoach: Has schemas with actionType, generates plans
- coach.store: Has deferTask(taskId, reason), planTasks, etc.
- coach.ts: Defines ActionType, DeferReason, PlanTask with actionType?

## Implementation Plan
1. Focus Timer Modal component
2. ActionType badges component
3. Two-step disclaimer
4. Commit framing
5. Adaptive coaching logic



