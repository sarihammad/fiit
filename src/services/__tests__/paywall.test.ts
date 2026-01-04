const { PaywallService, SubscriptionTier } = require('../paywall');

describe('PaywallService', () => {
  it('gates plan resets and coaching features by tier', () => {
    expect(
      PaywallService.canAccessFeature('daily_execution', SubscriptionTier.FREE)
    ).toBe(true);
    expect(
      PaywallService.canAccessFeature('plan_resets', SubscriptionTier.FREE)
    ).toBe(false);
    expect(
      PaywallService.canAccessFeature('plan_resets', SubscriptionTier.PRO)
    ).toBe(true);
    expect(
      PaywallService.canAccessFeature('unlimited_micro_steps', SubscriptionTier.PRO)
    ).toBe(true);
    expect(
      PaywallService.canAccessFeature('deep_coaching', SubscriptionTier.PRO)
    ).toBe(false);
    expect(
      PaywallService.canAccessFeature('deep_coaching', SubscriptionTier.PREMIUM)
    ).toBe(true);
  });

  it('returns updated tier benefits', () => {
    const freeBenefits = PaywallService.getTierBenefits(SubscriptionTier.FREE);
    const proBenefits = PaywallService.getTierBenefits(SubscriptionTier.PRO);
    const premiumBenefits = PaywallService.getTierBenefits(SubscriptionTier.PREMIUM);

    expect(freeBenefits.length).toBeGreaterThan(0);
    expect(proBenefits.length).toBeGreaterThan(0);
    expect(premiumBenefits.length).toBeGreaterThan(0);
  });
});
