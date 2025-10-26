# FIIT Operator Guide

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 14+ and CocoaPods
- Android: Android Studio with SDK 33+
- RevenueCat account
- OpenAI API key
- Nutritionix API credentials

### 2. Setup

```bash
# Clone and install
git clone <repository-url>
cd fiit
npm install

# Configure environment
cp .env.example .env
# Edit .env with your actual API keys

# Install iOS dependencies
cd ios && pod install && cd ..
```

### 3. Environment Variables

**Required for MVP:**

- `EXPO_PUBLIC_OPENAI_API_KEY` - AI meal planning & feedback
- `EXPO_PUBLIC_NUTRITIONIX_APP_ID` - Food database
- `EXPO_PUBLIC_NUTRITIONIX_API_KEY` - Food database
- `EXPO_PUBLIC_REVENUECAT_API_KEY` - Subscriptions

**Recommended:**

- `EXPO_PUBLIC_POSTHOG_KEY` - Analytics
- `EXPO_PUBLIC_SENTRY_DSN` - Error tracking

### 4. Run Development

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Type check
npm run type-check
```

## Core Flows to Test

### Flow 1: Onboarding → Home

1. Launch app → Landing screen
2. Tap "Start Free 7-Day Trial"
3. Complete onboarding:
   - Age, sex, height, current weight, goal weight, timeframe
   - Activity level
   - Diet preferences, allergies, budget, cooking time
4. See "Your Plan" summary with calorie/macro targets
5. Land on Home screen with empty state

**Expected:** Home shows calorie target (e.g., 1800 cal) and macro targets (e.g., 135g protein).

### Flow 2: Log Meal

1. Home → Tap "Add Meal" or go to Log tab
2. Try search: type "chicken breast"
3. Select result → tap to add
4. Return to Home → see meal in "Today's Meals"
5. Verify totals updated

**Expected:** Meal appears, totals show calories/protein/carbs/fat.

### Flow 3: AI Meal Plan

1. Go to Planner tab
2. Tap "Generate Week Plan"
3. Wait ~5-10s (AI call)
4. See 7 days with meals listed
5. Switch to "Grocery List" tab
6. See consolidated shopping list

**Expected:** Plan covers 7 days, ~3 meals/day, grocery list has 15-30 items.

### Flow 4: Daily Feedback

1. Log at least one meal
2. Home → Tap "Get Today's Feedback" (Pro feature)
3. If not Pro, paywall appears; if Pro, AI generates feedback
4. See summary + tomorrow's tip

**Expected:** Feedback is personalized, mentions today's protein intake, suggests improvements.

### Flow 5: Weight Tracking

1. Go to Progress tab
2. Enter today's weight
3. Tap "Add Weight"
4. See weight in history list
5. (If multiple entries) See projection graph

**Expected:** Weight saved, projection shows trend line toward goal.

### Flow 6: Subscription

1. Trigger paywall (e.g., try Planner when not Pro)
2. See "Lose 7 lbs in 30 days" headline
3. See $79/year (7-day free trial) option
4. Tap "Start 7-Day Free Trial"
5. Complete purchase flow (use sandbox account)
6. Return to app → Pro features unlocked

**Expected:** Trial starts, no charge for 7 days, Pro badge shown.

## Production Deployment

### RevenueCat Setup

1. **Create Products in App Store Connect / Google Play Console:**
   - `fiit_weekly`: $9.00/week (7-day trial)
   - `fiit_yearly`: $79.00/year (7-day trial)
   - `fiit_premium`: $199.00/year (7-day trial)

2. **RevenueCat Dashboard:**
   - Create entitlements: `fiit_pro`, `fiit_premium`
   - Create offering: `default` with 3 packages (weekly, yearly, premium)
   - Link products to packages

3. **Update app.json:**
   ```json
   "extra": {
     "RC_IOS_API_KEY": "your_real_ios_key",
     "RC_ANDROID_API_KEY": "your_real_android_key"
   }
   ```

### Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

### Environment for Production

Update `.env` for production:

```
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_OPENAI_API_KEY=<production key with usage limits set>
EXPO_PUBLIC_POSTHOG_KEY=<production project key>
EXPO_PUBLIC_SENTRY_DSN=<production DSN>
```

## Monitoring

### Key Metrics to Track

**User Acquisition:**

- Landing page views
- Onboarding starts
- Onboarding completions

**Engagement:**

- Daily active users (DAU)
- Meals logged per user per day
- AI feedback requests
- Meal plans generated
- Weight entries added

**Revenue:**

- Trial starts
- Trial → Paid conversions
- MRR (Monthly Recurring Revenue)
- Churn rate

**Technical:**

- API success rates (OpenAI, Nutritionix)
- App crashes (Sentry)
- Average response times

### PostHog Events

```typescript
// Track these events:
-landing_viewed -
  onboarding_started -
  onboarding_completed -
  meal_logged -
  photo_scan_attempted -
  photo_scan_success -
  plan_generated -
  feedback_viewed -
  weight_added -
  paywall_shown -
  trial_started -
  purchase_completed;
```

## Troubleshooting

### "OpenAI API error: 401"

- Check `EXPO_PUBLIC_OPENAI_API_KEY` is set correctly
- Verify key has credits in OpenAI dashboard
- Check network requests in dev tools

### "Nutritionix API error"

- Verify App ID and API Key in .env
- Check rate limits (500/day free tier)
- Try mock data by commenting out API call

### "No offerings available"

- Verify RevenueCat keys in app.json
- Check products are created in app stores
- Ensure offering is published in RevenueCat dashboard
- Try "Restore Purchases" in paywall

### Photo scan not working

- Only works on real devices (not simulator)
- Check camera permissions in device settings
- Verify expo-camera is installed: `npx expo install expo-camera`

### Weight projection not showing

- Need at least 2 weight entries
- Check entries are on different dates
- Verify `projectWeight()` returns valid data

## API Cost Management

### OpenAI

- Use `gpt-4o-mini` (default) for cost efficiency
- Set monthly usage limits in OpenAI dashboard
- Cache meal plans for 24h to reduce repeat calls
- Average: ~$0.15 per user per month

### Nutritionix

- Free tier: 500 requests/day
- Developer Plan: $50/month for 20,000 requests/day
- Upgrade when hitting limits
- Cache common foods locally

## Support Contacts

- **OpenAI**: https://help.openai.com
- **Nutritionix**: support@nutritionix.com
- **RevenueCat**: https://docs.revenuecat.com
- **Expo**: https://docs.expo.dev

## Release Checklist

Before shipping to production:

- [ ] All API keys configured in .env
- [ ] RevenueCat products created and tested
- [ ] Privacy Policy and Terms of Service added
- [ ] App Store / Play Store listing complete
- [ ] Screenshots and preview video ready
- [ ] Medical disclaimer shown on first launch
- [ ] Age gate (18+) implemented
- [ ] Analytics and error tracking enabled
- [ ] Test subscription flows in sandbox
- [ ] Test on real devices (iOS and Android)
- [ ] Performance profiling complete
- [ ] Accessibility audit passed
- [ ] Security review complete

---

**FIIT v1.0 - Production Ready**
