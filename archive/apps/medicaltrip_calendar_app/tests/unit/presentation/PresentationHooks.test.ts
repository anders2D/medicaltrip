import { describe, it, expect } from 'vitest';
import { loadArchetypeBundle } from '../../../src/infrastructure/archetypes/ArchetypeRegistry';
import { calculateSettlementKPIs } from '../../../src/presentation/hooks/useSettlementBalance';

describe('Presentation Layer Hooks & Settlement Calculations', () => {
  it('computes exact KPI metrics and balance sheet for RVA171', () => {
    const bundle = loadArchetypeBundle('rva171');
    const { balanceSheet, kpis, ledgerTransactions } = calculateSettlementKPIs(bundle.itinerary);

    expect(balanceSheet.reservaId).toBe('RVA171-4');
    expect(balanceSheet.currency).toBe('COP');
    expect(balanceSheet.totalCashAdvances.amountInCents).toBe(209810000n);

    expect(kpis.totalGuideHours).toBeGreaterThan(0);
    expect(kpis.totalMilestonesCount).toBeGreaterThanOrEqual(5);
    expect(kpis.transportPct).toBeGreaterThan(0);
    expect(ledgerTransactions.length).toBeGreaterThan(0);
  });

  it('computes exact KPI metrics and balance sheet for RVA282', () => {
    const bundle = loadArchetypeBundle('rva282');
    const { balanceSheet, kpis } = calculateSettlementKPIs(bundle.itinerary);

    expect(balanceSheet.reservaId).toBe('RVA282-5');
    expect(balanceSheet.totalCashAdvances.amountInCents).toBe(120000000n);
    expect(kpis.totalFleetTaxis.amountInCents).toBe(14500000n);
  });

  it('computes exact KPI metrics and balance sheet for RVA077 (12 days)', () => {
    const bundle = loadArchetypeBundle('rva077');
    const { balanceSheet, kpis } = calculateSettlementKPIs(bundle.itinerary);

    expect(balanceSheet.reservaId).toBe('RVA077-2');
    expect(balanceSheet.totalCashAdvances.amountInCents).toBe(350000000n);
    expect(kpis.totalMilestonesCount).toBe(6);
  });
});
