# FIIT - Setup Guide

## Overview

This guide walks through setting up FIIT's nutrition tracking app with AI meal planning, food recognition, and RevenueCat subscriptions.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.fiit.app

# AI Proxy Configuration (client chooses provider, keys live on backend)
EXPO_PUBLIC_AI_PROVIDER=openai

# Nutritionix Configuration (for food search and logging)
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_nutritionix_app_id
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_nutritionix_api_key

# Calorie Mama Configuration (optional, for photo recognition)
EXPO_PUBLIC_CALORIE_MAMA_API_KEY=your_calorie_mama_key

# Google OAuth Configuration
EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID=your_ios_google_client_id_here
EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID=your_android_google_client_id_here

# Apple OAuth Configuration
EXPO_PUBLIC_APPLE_CLIENT_ID=com.devign.fiit

# RevenueCat Configuration
RC_IOS_API_KEY=your_ios_api_key_here
RC_ANDROID_API_KEY=your_android_api_key_here
```

## AI Provider Setup

### 1. Get API Key (Backend)

1. Go to [OpenAI Platform](https://platform.openai.com/) or [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Create an API key
4. Set it on the backend service:
   - `OPENAI_API_KEY=sk-...` or `ANTHROPIC_API_KEY=...`

### 2. Client Configuration

FIIT uses `gpt-4o-mini` by default for cost-effective AI responses. To use a different model, update `src/services/ai.ts`:

```typescript
AIService.initialize({
  provider: 'openai',
  model: 'gpt-4o', // or 'gpt-4', 'gpt-3.5-turbo'
});
```

### 3. API Usage & Costs

- **gpt-4o-mini**: ~$0.15 per user per month (avg 30 meal plans + 30 feedback sessions)
- **gpt-4o**: ~$1.50 per user per month
- Set usage limits in OpenAI dashboard to control costs

## Nutritionix Setup

### 1. Create Account

1. Go to [Nutritionix Developer](https://developer.nutritionix.com/)
2. Sign up for a free account
3. Navigate to "API Keys"
4. Copy your Application ID and API Key

### 2. Add Credentials

```env
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_api_key
```

### 3. API Features Used

- **Instant Search**: Search 800,000+ foods
- **Natural Language**: "2 eggs and toast" → structured data
- **Branded Foods**: Restaurant items and packaged foods
- **Free Tier**: 500 requests/day (sufficient for testing)

### 4. Upgrade for Production

For production, upgrade to:

- **Developer Plan**: $50/month, 20,000 requests/day
- **Professional Plan**: Custom pricing for high volume

## Calorie Mama Setup (Optional)

### 1. Get API Key

1. Go to [Calorie Mama API](https://rapidapi.com/caloriemama/api/calorie-mama)
2. Subscribe to a plan (Basic: Free tier available)
3. Copy your RapidAPI key

### 2. Add Credential

```env
EXPO_PUBLIC_CALORIE_MAMA_API_KEY=your_rapidapi_key
```

### 3. Alternative: Nutritionix Vision

Nutritionix also offers photo recognition. Contact them for pricing.

## RevenueCat Setup

### 1. Create Products in App Stores

**App Store Connect:**

Weekly Product:

- Product ID: `fiit_weekly`
- Type: Auto-Renewable Subscription
- Price: $9.99/week
- Free Trial: 7 days

Yearly Product:

- Product ID: `fiit_yearly`
- Type: Auto-Renewable Subscription
- Price: $79.99/year
- Free Trial: 7 days

Premium Product:

- Product ID: `fiit_premium`
- Type: Auto-Renewable Subscription
- Price: $199.99/year
- Free Trial: 7 days

**Google Play Console:**

Create the same three products with matching IDs and pricing.

### 2. Configure RevenueCat Dashboard

1. **Create Entitlements:**
   - Name: `fiit_pro` - Description: "Access to meal planning, photo logging, daily feedback"
   - Name: `fiit_premium` - Description: "Premium AI Coach with weekly check-ins"

2. **Create Offering:**
   - Name: `default`
   - Description: "FIIT Subscription Plans"

3. **Add Packages:**
   - **Weekly Package:**
     - Identifier: `weekly`
     - Product: `fiit_weekly`
     - Display Name: "Weekly Plan"
   - **Yearly Package:**
     - Identifier: `yearly`
     - Product: `fiit_yearly`
     - Display Name: "Yearly Plan (Best Value)"
   - **Premium Package:**
     - Identifier: `premium`
     - Product: `fiit_premium`
     - Display Name: "AI Coach Premium"

### 3. Update App Configuration

The app is configured to use:

- Entitlements: `fiit_pro`, `fiit_premium`
- Offering: `default`
- Packages: `weekly`, `yearly`, `premium`

## Google OAuth Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

### 2. iOS Configuration

1. Create an iOS OAuth client ID
2. Bundle ID: `com.devign.fiit`
3. Add to `.env`: `EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID=your_ios_client_id`

### 3. Android Configuration

1. Create an Android OAuth client ID
2. Package name: `com.devign.fiit`
3. SHA-1 certificate fingerprint (get from your keystore)
4. Add to `.env`: `EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID=your_android_client_id`

## Apple Sign-In Setup

### 1. Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select your App ID (`com.devign.fiit`)
4. Enable "Sign In with Apple" capability

### 2. Configuration

```env
EXPO_PUBLIC_APPLE_CLIENT_ID=com.devign.fiit
```

## Camera Permissions

Already configured in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "FIIT needs camera access to scan your meals for automatic calorie logging.",
      "NSPhotoLibraryUsageDescription": "FIIT needs photo library access to analyze meal photos for calorie tracking."
    }
  },
  "android": {
    "permissions": ["CAMERA", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
  }
}
```

## Testing the Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Check Configuration

Run a configuration check script (add to your App.tsx during development):

```typescript
import { AIService } from '@/services/ai';
import { FoodService } from '@/services/food';

// Check AI configuration
const aiStatus = AIService.getStatus();
console.log('AI Service:', aiStatus);

// Check Food Service
const foodStatus = FoodService.isConfigured();
console.log('Food Service:', foodStatus);
```

### 3. Test Features

- **Food Search**: Try searching "chicken breast"
- **AI Meal Plan**: Generate a 7-day plan
- **Photo Recognition**: Test with a meal photo
- **Subscriptions**: Test purchase flow in sandbox

## Production Checklist

Before launching:

- [ ] OpenAI API key configured with usage limits
- [ ] Nutritionix API upgraded for production traffic
- [ ] RevenueCat products created in both app stores
- [ ] Apple/Google OAuth clients configured
- [ ] Camera permissions tested on real devices
- [ ] Subscription flow tested with sandbox accounts
- [ ] Push notifications tested
- [ ] AI prompts reviewed for safety/accuracy
- [ ] Error handling and fallbacks tested
- [ ] Analytics/monitoring set up

## Cost Estimates (per 1000 users/month)

- **OpenAI (gpt-4o-mini)**: ~$150
- **Nutritionix (Developer Plan)**: $50
- **RevenueCat**: Free up to $10k MRR
- **Infrastructure**: Varies (minimal if using Supabase/Firebase free tiers)

**Total**: ~$200-300/month for 1000 active users

## Troubleshooting

### "OpenAI API key not configured"

- Check `.env` file exists and has `EXPO_PUBLIC_OPENAI_API_KEY`
- Restart Expo dev server after adding env vars

### "Nutritionix API error: 401"

- Verify App ID and API Key are correct
- Check Nutritionix dashboard for rate limits

### "No offerings available"

- Verify RevenueCat API keys in `app.json`
- Check products are created in app stores
- Ensure offering is published in RevenueCat

### Photo upload not working

- Check camera permissions in device settings
- Test on real device (camera doesn't work in simulator)
- Verify expo-camera plugin is installed

## Support

For technical support:

- OpenAI: https://help.openai.com
- Nutritionix: support@nutritionix.com
- RevenueCat: https://docs.revenuecat.com
- Expo: https://docs.expo.dev

---

**FIIT Team**: Once configured, all services work together to provide seamless nutrition tracking and AI coaching!
