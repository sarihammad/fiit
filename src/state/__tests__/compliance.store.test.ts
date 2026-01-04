jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useComplianceStore } from '../compliance.store';

describe('Compliance store', () => {
  beforeEach(() => {
    useComplianceStore.getState().resetCompliance();
  });

  it('records age confirmation and disclaimer acceptance', () => {
    const store = useComplianceStore.getState();
    expect(store.hasConfirmedAge).toBe(false);
    expect(store.hasAcceptedDisclaimer).toBe(false);

    store.confirmAge();
    expect(useComplianceStore.getState().hasConfirmedAge).toBe(true);
    expect(useComplianceStore.getState().ageConfirmedAt).toBeDefined();

    store.acceptDisclaimer();
    expect(useComplianceStore.getState().hasAcceptedDisclaimer).toBe(true);
    expect(useComplianceStore.getState().disclaimerAcceptedAt).toBeDefined();
  });
});
