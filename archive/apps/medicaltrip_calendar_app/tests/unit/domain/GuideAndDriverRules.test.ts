import { describe, it, expect } from 'vitest';
import { Guide } from '../../../src/domain/entities/Guide';
import { Driver } from '../../../src/domain/entities/Driver';
import { InvalidGuideShiftError } from '../../../src/domain/errors/DomainErrors';

describe('Guide & Driver Rate Engine Rules', () => {
  describe('Bilingual Guide Shift & Meal Subsidy Calculations', () => {
    it('calculates Tier 1 short shift (< 4 hours) with snack subsidy', () => {
      // 2.5 hours shift, no prep allowance
      // Base: 2.5 * $15.500 = $38.750 COP (3875000n cents)
      // Meal subsidy: Tier 1 = $8.000 COP (800000n cents)
      // Total = $46.750 COP (4675000n cents)
      const result = Guide.calculateShiftFee(2.5, false);

      expect(result.hours).toBe(2.5);
      expect(result.baseFee.amountInCents).toBe(3875000n);
      expect(result.mealSubsidy.amountInCents).toBe(800000n);
      expect(result.prepFee.amountInCents).toBe(0n);
      expect(result.mealTier).toBe(1);
      expect(result.totalFee.amountInCents).toBe(4675000n);
    });

    it('calculates Tier 2 standard shift (4 to 6 hours) with lunch subsidy & prep allowance', () => {
      // 4.0 hours shift + prep allowance
      // Base: 4.0 * $15.500 = $62.000 COP
      // Prep: $15.500 COP
      // Meal subsidy: Tier 2 = $25.000 COP
      // Total = $62.000 + $15.500 + $25.000 = $102.500 COP (10250000n cents)
      const result = Guide.calculateShiftFee(4.0, true);

      expect(result.baseFee.amountInCents).toBe(6200000n);
      expect(result.prepFee.amountInCents).toBe(1550000n);
      expect(result.mealSubsidy.amountInCents).toBe(2500000n);
      expect(result.mealTier).toBe(2);
      expect(result.totalFee.amountInCents).toBe(10250000n);
    });

    it('calculates Tier 3 full day shift (6 to 10 hours) with lunch + dinner subsidy', () => {
      // 8.0 hours shift (standard full day)
      // Base: 8.0 * $15.500 = $124.000 COP
      // Meal subsidy: Tier 3 = $35.000 COP
      // Total = $159.000 COP (15900000n cents)
      const result = Guide.calculateShiftFee(8.0, false);

      expect(result.baseFee.amountInCents).toBe(12400000n);
      expect(result.mealSubsidy.amountInCents).toBe(3500000n);
      expect(result.mealTier).toBe(3);
      expect(result.totalFee.amountInCents).toBe(15900000n);
    });

    it('calculates Tier 4 extended surgical shift (> 10 hours)', () => {
      // 12.0 hours surgical shift (e.g. Rumai Day 5)
      // Base: 12.0 * $15.500 = $186.000 COP
      // Meal subsidy: Tier 4 = $45.000 COP
      // Total = $231.000 COP (23100000n cents)
      const result = Guide.calculateShiftFee(12.0, false);

      expect(result.baseFee.amountInCents).toBe(18600000n);
      expect(result.mealSubsidy.amountInCents).toBe(4500000n);
      expect(result.mealTier).toBe(4);
      expect(result.totalFee.amountInCents).toBe(23100000n);
    });

    it('throws InvalidGuideShiftError for invalid shift hours', () => {
      expect(() => Guide.calculateShiftFee(-1)).toThrow(InvalidGuideShiftError);
      expect(() => Guide.calculateShiftFee(25)).toThrow(InvalidGuideShiftError);
    });
  });

  describe('Fleet Driver Rate Calculations', () => {
    it('calculates Airport JMC transfer rates for Sedan vs Van XL', () => {
      const sedanTransfer = Driver.calculateTransferFee('AIRPORT_JMC', { isVan: false });
      expect(sedanTransfer.baseFee.amountInCents).toBe(14500000n); // $145.000 COP
      expect(sedanTransfer.totalFee.amountInCents).toBe(14500000n);

      const vanTransfer = Driver.calculateTransferFee('AIRPORT_JMC', { isVan: true });
      expect(vanTransfer.baseFee.amountInCents).toBe(16000000n); // $160.000 COP
      expect(vanTransfer.totalFee.amountInCents).toBe(16000000n);
    });

    it('applies nocturnal surcharge ($25.000 COP) between 20:00 and 06:00', () => {
      const lateNightTransfer = Driver.calculateTransferFee('AIRPORT_JMC', {
        isVan: false,
        isNightShift: true,
      });

      expect(lateNightTransfer.baseFee.amountInCents).toBe(14500000n);
      expect(lateNightTransfer.nightSurcharge.amountInCents).toBe(2500000n); // $25.000 COP
      expect(lateNightTransfer.totalFee.amountInCents).toBe(17000000n); // $170.000 COP
    });

    it('detects nocturnal hours correctly', () => {
      const nightDate1 = new Date('2026-08-20T22:30:00');
      const nightDate2 = new Date('2026-08-20T04:15:00');
      const dayDate = new Date('2026-08-20T14:00:00');

      expect(Driver.isNocturnalTime(nightDate1)).toBe(true);
      expect(Driver.isNocturnalTime(nightDate2)).toBe(true);
      expect(Driver.isNocturnalTime(dayDate)).toBe(false);
    });

    it('calculates intra-city and metropolitan south routes', () => {
      const shortRoute = Driver.calculateTransferFee('URBANO_CORTO');
      expect(shortRoute.totalFee.amountInCents).toBe(2500000n);

      const mediumRoute = Driver.calculateTransferFee('URBANO_MEDIO');
      expect(mediumRoute.totalFee.amountInCents).toBe(3500000n);

      const longRoute = Driver.calculateTransferFee('URBANO_LARGO');
      expect(longRoute.totalFee.amountInCents).toBe(5500000n);

      const southRoute = Driver.calculateTransferFee('SUR_METROPOLITANO');
      expect(southRoute.totalFee.amountInCents).toBe(4500000n);
    });
  });
});
