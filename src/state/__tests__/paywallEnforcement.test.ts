import { useCoachStore } from '../coach.store';

describe('Paywall Enforcement', () => {
  beforeEach(() => {
    // Reset store state
    useCoachStore.setState({
      planResetWindowStart: undefined,
      planResetCount: 0,
      planResetLimit: 1,
      microStepWindowStart: undefined,
      microStepCount: 0,
      microStepLimit: 5,
    });
  });

  describe('canResetPlan', () => {
    it('allows reset if under limit', () => {
      const { allowed, remaining } = useCoachStore.getState().canResetPlan();
      expect(allowed).toBe(true);
      expect(remaining).toBe(1);
    });

    it('blocks reset if limit reached', () => {
      useCoachStore.getState().recordPlanReset();
      const { allowed, remaining } = useCoachStore.getState().canResetPlan();
      expect(allowed).toBe(false);
      expect(remaining).toBe(0);
    });

    it('resets window after 30 days', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 31);
      useCoachStore.setState({
        planResetWindowStart: pastDate.toISOString(),
        planResetCount: 1,
      });
      
      const { allowed, remaining } = useCoachStore.getState().canResetPlan();
      expect(allowed).toBe(true);
      expect(remaining).toBe(1);
    });
  });

  describe('canUseMicroStep', () => {
    it('allows micro step if under limit', () => {
      const { allowed, remaining } = useCoachStore.getState().canUseMicroStep();
      expect(allowed).toBe(true);
      expect(remaining).toBe(5);
    });

    it('blocks micro step if limit reached', () => {
      // Use all 5
      for (let i = 0; i < 5; i++) {
        useCoachStore.getState().recordMicroStepUse();
      }
      const { allowed, remaining } = useCoachStore.getState().canUseMicroStep();
      expect(allowed).toBe(false);
      expect(remaining).toBe(0);
    });

    it('resets window after 1 day', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      useCoachStore.setState({
        microStepWindowStart: pastDate.toISOString(),
        microStepCount: 5,
      });
      
      const { allowed, remaining } = useCoachStore.getState().canUseMicroStep();
      expect(allowed).toBe(true);
      expect(remaining).toBe(5);
    });
  });
});

