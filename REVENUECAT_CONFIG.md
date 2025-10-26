# RevenueCat Configuration

## App IDs

- **RevenueCat iOS App ID**: `appd70fb9d3cc`
- **RevenueCat Android App ID**: `app8d724181c1`

## API Keys

- **iOS API Key**: `appl_EZZhGHPzidlBvHAUvXqlhLTqgCP`
- **Android API Key**: `goog_eGehbjajtUQWCTeStonOlzCOuVD`

## Product IDs

### iOS (App Store)

- **fiit_pro_monthly**: `prod40673a6730`
- **fiit_pro_yearly**: `prodc0631ac737`
- **fiit_premium_yearly**: `prod30320e4be2`

### Android (Google Play)

- **fiit_pro_monthly:monthlyid**: `prodf774d177cf`
- **fiit_pro_yearly:yearlyid**: `prodb12cfd2258`
- **fiit_premium_yearly:premiumyearlyid**: `prodfad149d2bc`

## Entitlements

- **pro**: `fiit_pro_monthly`, `fiit_pro_yearly`
- **premium**: `fiit_premium_yearly`

## Offerings

- **default**: Contains all packages (pro_monthly, pro_yearly, premium_yearly)

## Configuration Status

✅ API Keys configured in app.json
✅ Product IDs configured in PaywallService
✅ Entitlements configured in code
✅ Offerings configured in code

## Next Steps

1. Create products in App Store Connect and Google Play Console
2. Configure entitlements in RevenueCat Dashboard
3. Create offerings in RevenueCat Dashboard
4. Test purchases in sandbox mode
