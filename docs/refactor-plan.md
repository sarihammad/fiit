# FIIT Refactor Plan: AI Execution Coach

## Context
FIIT is being refocused from a general goal/tracking tool into a sharp, opinionated
AI execution coach. The product must remove thinking friction by guiding users
from vague goals to a locked weekly plan and a daily "Today Mode" that shows only
1–3 tasks.

## New Product Identity
- One-liner: "FIIT turns vague goals into a clear daily execution plan — and keeps asking the right questions until action is obvious."
- Primary user need: clarity, momentum, and relief from overthinking.
- Core loop: goal intake → guided questions → plan lock → daily execution → light accountability.

## Phase 0: Repo Audit (Summary)
- Framework: Expo/React Native app + FastAPI backend for ML.
- Current navigation: Landing + Onboarding + Auth + Paywall + Tabbed Home/Planner/Log/Progress/Settings.
- Data layer: Zustand + AsyncStorage, no central domain models for goals/plans/tasks.
- AI usage: scattered across planner/food/feedback with no single "coach" interface.
- Copy tone: feature-driven, not outcome-driven.
- Main gap: no "Today Mode", no plan locking, too many screens.

## Refactor Goals
- Reduce feature surface area to 4 routes: Start, Plan, Today, Settings.
- Implement guided Q/A onboarding (one question at a time).
- Generate a 7‑day plan once, lock it, and allow resets only with explicit intent.
- Make Today Mode the default home and show only 1–3 tasks.
- Add lightweight avoidance detection and micro-step rewrites.
- Consolidate AI into a single opinionated "AI Coach Engine" with schema validation.
- Replace all feature-driven copy with outcome-driven copy.

## Proposed Commit Sequence (PR-sized)
1) chore: repo audit & refactor plan notes
2) feat: add new domain models (Goal, WeeklyPlan, PlanTask, ClarificationAnswer)
3) feat: implement guided onboarding flow (goal intake + Q/A storage)
4) feat: implement AI Coach Engine with schema validation
5) feat: generate and commit weekly plan + locking rules
6) feat: build Today Mode as primary home experience
7) feat: implement avoidance detection + micro-step help
8) refactor: remove unused screens/providers and simplify navigation
9) feat: add monetization gating + upgrade screen
10) test: add core flow tests
11) chore: polish copy & UX micro-interactions

## Data Model Draft (Local Store)
- Goal: id, userId, title, status, createdAt, updatedAt
- GoalClarificationAnswer: id, goalId, questionKey, questionText, answerText, createdAt
- WeeklyPlan: id, goalId, userId, startDate, status, createdAt
- PlanTask: id, weeklyPlanId, title, whyThisMatters, nextAction, estimateMinutes,
  scheduledDate, priority, status, deferCount, lastDeferredAt, createdAt, updatedAt
- ExecutionEvent: id, userId, taskId, type, createdAt (optional)

## AI Coach Engine (Single Module)
Only three decision bottlenecks use AI:
- Clarification question generation
- Weekly plan generation
- Micro-step rewrite

All outputs must be JSON-validated with a fallback template to prevent crashes.

## Navigation Targets (MVP)
- Start: goal intake + Q/A
- Plan: locked weekly plan with minimal controls
- Today: 1–3 tasks, start CTA, micro-step CTA
- Settings: account, billing, plan reset

## Risks & Mitigations
- Risk: breaking existing screens/routes. Mitigation: migrate gradually, keep small commits.
- Risk: schema mismatch in AI output. Mitigation: strict Zod validation + fallback.
- Risk: users stuck without plan reset. Mitigation: explicit reset CTA + tier gating.

## Testing Requirements (Core)
- Onboarding Q/A stores answers and advances one question at a time
- Plan generation creates 1–3 tasks/day and locks plan
- Today Mode shows max 3 tasks and can mark done/defer
- Defer >= 3 triggers micro-step CTA
- AI schema validation fails safely (fallback)
