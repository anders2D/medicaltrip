import { describe, it, expect } from 'vitest';
import { Guide } from '../../../src/domain/entities/Guide';
import { Money } from '../../../src/domain/values/Money';

describe('Guide Modalities and Settlement Calculation Engine', () => {
  describe('Modalidad 1: SPANISH_WITH_CAR', () => {
    it('calculates standard day shift of 4 hours with lunch allowance', () => {
      // 4h @ $15.500 = $62.000 + $25.000 lunch = $87.000
      const result = Guide.calculateShiftFee(4.0, {
        modality: 'SPANISH_WITH_CAR'
      });
      expect(result.hours).toBe(4.0);
      expect(result.billedHours).toBe(4.0);
      expect(result.baseFee.units).toBe(62000);
      expect(result.mealSubsidy.units).toBe(25000);
      expect(result.totalFee.units).toBe(87000);
    });

    it('enforces minimum 2 hours floor when applyMinimumHoursFloor is true', () => {
      // 1h worked -> billed as 2h @ $15.500 = $31.000 + $8.000 snack = $39.000
      const result = Guide.calculateShiftFee(1.0, {
        modality: 'SPANISH_WITH_CAR',
        applyMinimumHoursFloor: true
      });
      expect(result.hours).toBe(1.0);
      expect(result.billedHours).toBe(2.0);
      expect(result.baseFee.units).toBe(31000);
      expect(result.totalFee.units).toBe(39000);
    });

    it('applies night surcharge of $16.500/h for hours after 19:00', () => {
      // 9.5 hours total: 7.5h day (@ $15.500 = $116.250) + 2h night (@ $16.500 = $33.000)
      // + $45.000 meal allowance = $194.250
      const result = Guide.calculateShiftFee(9.5, {
        modality: 'SPANISH_WITH_CAR',
        nightHours: 2.0
      });
      expect(result.baseFee.units).toBe(116250);
      expect(result.nightFee.units).toBe(33000);
      expect(result.mealSubsidy.units).toBe(45000);
      expect(result.totalFee.units).toBe(194250);
    });

    it('applies Sunday/holiday compensatory hour and folder allowances for Spanish', () => {
      const result = Guide.calculateShiftFee(4.0, {
        modality: 'SPANISH_WITH_CAR',
        hasPrepAllowance: true,
        hasDeliveryAllowance: true,
        isSundayOrHoliday: true
      });
      expect(result.prepFee.units).toBe(15500);
      expect(result.deliveryFee.units).toBe(30000);
      expect(result.holidayFee.units).toBe(15500);
      expect(result.totalFee.units).toBe(148000);
    });

    it('applies Pico y Placa and Hospitalization transit allowances', () => {
      const result = Guide.calculateShiftFee(4.0, {
        modality: 'SPANISH_WITH_CAR',
        hasPicoYPlaca: true,
        isHospitalization: true
      });
      expect(result.transitFee.units).toBe(90000);
    });
  });

  describe('Modalidad 2: SPANISH_WITHOUT_CAR', () => {
    it('applies zonal transit allowances for Poblado and Laureles', () => {
      const resultPoblado = Guide.calculateShiftFee(3.0, {
        modality: 'SPANISH_WITHOUT_CAR',
        zonalTransit: 'POBLADO'
      });
      expect(resultPoblado.transitFee.units).toBe(20000);

      const resultLaureles = Guide.calculateShiftFee(3.0, {
        modality: 'SPANISH_WITHOUT_CAR',
        zonalTransit: 'LAURELES'
      });
      expect(resultLaureles.transitFee.units).toBe(16000);
    });
  });

  describe('Modalidad 3: ENGLISH_WITH_CAR_DRIVER', () => {
    it('applies degresive hourly scale: <= 1.5h @ $40.000/h with $0 meal subsidy', () => {
      const result = Guide.calculateShiftFee(1.5, {
        modality: 'ENGLISH_WITH_CAR_DRIVER'
      });
      expect(result.baseFee.units).toBe(60000); // 1.5 * 40k
      expect(result.mealSubsidy.units).toBe(0);
      expect(result.totalFee.units).toBe(60000);
    });

    it('applies degresive hourly scale: 2.0h @ $35.000/h with $0 meal subsidy', () => {
      const result = Guide.calculateShiftFee(2.0, {
        modality: 'ENGLISH_WITH_CAR_DRIVER'
      });
      expect(result.baseFee.units).toBe(70000); // 2.0 * 35k
      expect(result.mealSubsidy.units).toBe(0);
      expect(result.totalFee.units).toBe(70000);
    });

    it('applies degresive hourly scale: 4.0h @ $30.000/h with $10.000 meal subsidy', () => {
      const result = Guide.calculateShiftFee(4.0, {
        modality: 'ENGLISH_WITH_CAR_DRIVER'
      });
      expect(result.baseFee.units).toBe(120000); // 4.0 * 30k
      expect(result.mealSubsidy.units).toBe(10000);
      expect(result.totalFee.units).toBe(130000);
    });

    it('applies degresive hourly scale: 8.0h @ $25.000/h with $20.000 meal subsidy', () => {
      const result = Guide.calculateShiftFee(8.0, {
        modality: 'ENGLISH_WITH_CAR_DRIVER'
      });
      expect(result.baseFee.units).toBe(200000); // 8.0 * 25k
      expect(result.mealSubsidy.units).toBe(20000);
      expect(result.totalFee.units).toBe(220000);
    });

    it('applies bilingual folder allowances ($25.000 prep, $35.000 delivery)', () => {
      const result = Guide.calculateShiftFee(4.0, {
        modality: 'ENGLISH_WITH_CAR_DRIVER',
        hasPrepAllowance: true,
        hasDeliveryAllowance: true
      });
      expect(result.prepFee.units).toBe(25000);
      expect(result.deliveryFee.units).toBe(35000);
    });
  });

  describe('Historical Real Cases Validation', () => {
    it('matches Catia Rodrigues (RVA171-4): 4h day shift @ $15.500 + $25.000 lunch', () => {
      const result = Guide.calculateShiftFee(4.0, {
        modality: 'SPANISH_WITH_CAR'
      });
      expect(result.baseFee.units).toBe(62000);
      expect(result.mealSubsidy.units).toBe(25000);
      expect(result.totalFee.units).toBe(87000);
    });

    it('matches Andres Cantero (RVA322-1 Day 1): 9.5h shift @ $15.500 = $147.250 + $45.000 meal', () => {
      const result = Guide.calculateShiftFee(9.5, {
        modality: 'SPANISH_WITH_CAR'
      });
      expect(result.baseFee.units).toBe(147250);
      expect(result.mealSubsidy.units).toBe(45000);
      expect(result.totalFee.units).toBe(192250);
    });

    it('matches Andres Cantero (RVA322-1 Day 2): 6.0h shift @ $15.500 = $93.000', () => {
      const result = Guide.calculateShiftFee(6.0, {
        modality: 'SPANISH_WITH_CAR'
      });
      expect(result.baseFee.units).toBe(93000);
    });
  });
});
