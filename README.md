# FIIT - AI Execution Coach

<div align="center">
  <img src="assets/logo.png" alt="FIIT Logo" width="200" height="200">
  <h3>Turn vague goals into a clear daily execution plan</h3>
  <p>
    <strong>Built with TypeScript, Expo, and RevenueCat</strong>
  </p>
  <p>
    <a href="#core-promise">Core Promise</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#architecture">Architecture</a>
  </p>
</div>

## 🎯 Core Promise

**FIIT turns vague goals into a clear daily execution plan — and keeps asking the right questions until action is obvious.**

FIIT is an opinionated execution coach. It narrows your goal with guided questions, locks a 7‑day plan, and shows only today’s 1–3 actions so you stop thinking and start moving.

## ✨ Features

### 🧭 Guided Goal Clarification

- One question at a time to remove ambiguity
- Structured answers that converge on a decision
- Fast onboarding (under 2 minutes)

### ✅ Locked Weekly Plan

- Generate a 7‑day execution plan once
- Commitment moment with explicit lock
- Reset only via a deliberate "Reset Plan"

### 📌 Today Mode

- Shows only 1–3 tasks for today
- Single “Start” CTA per task
- No browsing or endless tweaking

### 🧠 Micro‑Step Coaching

- Detects repeated deferrals
- Rewrites tasks into 5‑minute steps
- Limits for free tier, unlimited in Coach Mode

### 💰 Monetization Ready

- RevenueCat integration for subscriptions
- Free daily execution
- Paid unlocks: resets, deeper coaching, audits

## 🛠 Tech Stack

### Mobile

- **React Native** with Expo SDK
- **TypeScript** with strict mode
- **Zustand** for state management
- **React Navigation** for routing
- **Zod** for runtime validation

### Infrastructure

- **EAS Build** for app builds
- **Jest** for unit tests
- **Sentry** for error monitoring (optional)
- **PostHog** for analytics (optional)

> Note: `backend/fiit-food101` is legacy nutrition infrastructure and is not part of the current execution‑coach product loop.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- EAS CLI (optional for builds)

### Installation

```bash
git clone https://github.com/yourusername/fiit.git
cd fiit
npm install
```

### Run the App

```bash
npm start
```

### Development Builds

```bash
npm run dev
```

## 🧪 Quality

```bash
npm run check
```

Runs lint, typecheck, and tests.

## 🏗 Architecture

```
src/
├── app/                # Navigation shell
├── screens/            # Start / Plan / Today / Settings / Upgrade
├── services/           # AI coach + analytics + notifications
├── state/              # Coach domain store (goals, plans, tasks)
├── types/              # Domain types
└── design-system/      # Design tokens and components
```

## 🚀 Deployment

```bash
eas build --platform all --profile preview
eas build --platform all --profile production
```

## 📄 License

MIT License. See [LICENSE](LICENSE).
