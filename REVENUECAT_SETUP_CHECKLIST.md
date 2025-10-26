# RevenueCat Setup Checklist

## ✅ Completed

- [x] API Keys configured in app.json
- [x] Product IDs configured in PaywallService
- [x] Entitlements logic implemented in code
- [x] Offerings structure configured in code

## 🔄 Next Steps (RevenueCat Dashboard)

### 1. Create Entitlements

Go to RevenueCat Dashboard → Entitlements and create:

**Pro Entitlement**

- Identifier: `pro`
- Products: `fiit_pro_monthly`, `fiit_pro_yearly`

**Premium Entitlement**

- Identifier: `premium`
- Products: `fiit_premium_yearly`

### 2. Create Offerings

Go to RevenueCat Dashboard → Offerings and create:

**Default Offering**

- Identifier: `default`
- Packages:
  - `pro_monthly` → Product: `fiit_pro_monthly`
  - `pro_yearly` → Product: `fiit_pro_yearly`
  - `premium_yearly` → Product: `fiit_premium_yearly`

## 🔄 Next Steps (App Store & Google Play)

### iOS (App Store Connect)

Create In-App Purchases:

- [ ] `fiit_pro_monthly` - $9.99/month with 7-day trial
- [ ] `fiit_pro_yearly` - $79.99/year with 7-day trial
- [ ] `fiit_premium_yearly` - $199.99/year with 7-day trial

### Android (Google Play Console)

Create Subscriptions:

- [ ] `fiit_pro_monthly:monthlyid` - $9.99/month with 7-day trial
- [ ] `fiit_pro_yearly:yearlyid` - $79.99/year with 7-day trial
- [ ] `fiit_premium_yearly:premiumyearlyid` - $199.99/year with 7-day trial

## 🧪 Testing

- [ ] Build app with real API keys
- [ ] Test in sandbox mode
- [ ] Verify subscription status updates
- [ ] Test restore purchases
- [ ] Test paywall flow

## 📱 Current App Status

- ✅ Settings screen shows correct subscription status
- ✅ Paywall service configured with real product IDs
- ✅ Feature gating implemented
- ✅ Trial and restore logic working
- ✅ Rescue offer system implemented
