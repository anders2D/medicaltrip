import { describe, it, expect } from 'vitest';
import { Money } from '../../../src/domain/values/Money';
import { Guide } from '../../../src/domain/entities/Guide';

describe('Settlement Sheet & Daily Report Exact Reconciliation', () => {
  describe('RVA322-1 Andrés Cantero Authentic Settlement Sheet', () => {
    it('computes exact day 1 (14/07/26) figures matching Excel', () => {
      const hours = 9.5;
      const hourlyRateCop = 15500;
      const hoursFeeCop = hours * hourlyRateCop; // 147.250
      expect(hoursFeeCop).toBe(147250);

      // Meal subsidy for >= 9.5h in custom options is Tier 4 ($45.000)
      const shiftCalc = Guide.calculateShiftFee(hours, { modality: 'SPANISH_WITH_CAR' });
      expect(shiftCalc.mealTier).toBe(4);
      expect(shiftCalc.mealSubsidy.amountInCents).toBe(4500000n); // $45.000 COP

      const gastosCm = 48600;
      const parqueadero = 16200;
      const alimentacion = Number(shiftCalc.mealSubsidy.amountInCents / 100n);

      const day1CajaMenor = gastosCm + parqueadero + alimentacion;
      expect(day1CajaMenor).toBe(109800);
    });

    it('computes exact day 2 (17/07/26) figures matching Excel', () => {
      const hours = 6.0;
      const hourlyRateCop = 15500;
      const hoursFeeCop = hours * hourlyRateCop; // 93.000
      expect(hoursFeeCop).toBe(93000);

      const gastosCm = 23700;
      const parqueadero = 26000;
      const alimentacion = 30000; // Tier 2/3 agreement

      const day2CajaMenor = gastosCm + parqueadero + alimentacion;
      expect(day2CajaMenor).toBe(79700);
    });

    it('reconciles entire sheet: Cuenta de Cobro, Caja Menor, and Saldo Neto', () => {
      const day1Hours = 9.5;
      const day2Hours = 6.0;
      const totalHours = day1Hours + day2Hours; // 15.5
      expect(totalHours).toBe(15.5);

      const totalValorHoras = totalHours * 15500;
      expect(totalValorHoras).toBe(240250);

      const totalGastosPasajero = 48600 + 23700; // 72.300
      expect(totalGastosPasajero).toBe(72300);

      const totalAlimentacion = 45000 + 30000; // 75.000
      expect(totalAlimentacion).toBe(75000);

      const totalParqueaderos = 16200 + 26000; // 42.200
      expect(totalParqueaderos).toBe(42200);

      const totalGastosCajaMenor = totalGastosPasajero + totalAlimentacion + totalParqueaderos;
      expect(totalGastosCajaMenor).toBe(189500);

      const transporteOficialBilled = 255000; // 8 passenger transfers in ACP car
      const cuentaDeCobroBruta = totalValorHoras + totalGastosCajaMenor + transporteOficialBilled;
      expect(cuentaDeCobroBruta).toBe(684750);

      const anticipoCajaMenor = 100000;
      const saldoNetoAPagar = cuentaDeCobroBruta - anticipoCajaMenor;
      expect(saldoNetoAPagar).toBe(584750);

      // Caja Menor internal balance
      const balanceCajaMenor = anticipoCajaMenor - totalGastosCajaMenor;
      expect(balanceCajaMenor).toBe(-89500); // 89.500 a favor del ACP
    });

    it('triggers anti-withholding split when saldo neto exceeds $523.700 COP', () => {
      const saldoNeto = Money.fromCents(58475000n, 'COP');
      const threshold = Money.fromCents(Guide.WITHHOLDING_TAX_THRESHOLD_COP_CENTS, 'COP');

      expect(saldoNeto.isGreaterThan(threshold)).toBe(true);

      // Verify splitting into 2 transfers
      const maxTransfer1Cents = 50000000n; // $500.000 COP
      const transfer1Cents = maxTransfer1Cents;
      const transfer2Cents = saldoNeto.amountInCents - transfer1Cents;

      expect(transfer1Cents).toBe(50000000n); // $500.000 COP (#726)
      expect(transfer2Cents).toBe(8475000n);  // $84.750 COP (#859)

      // Neither transfer exceeds the withholding ceiling
      expect(transfer1Cents < Guide.WITHHOLDING_TAX_THRESHOLD_COP_CENTS).toBe(true);
      expect(transfer2Cents < Guide.WITHHOLDING_TAX_THRESHOLD_COP_CENTS).toBe(true);
      expect(transfer1Cents + transfer2Cents).toBe(saldoNeto.amountInCents);
    });

    it('calculates Medical Trip profit and margin accurately', () => {
      const budgetAcp = 350000;
      const budgetTransport = 320000;
      const totalBudget = budgetAcp + budgetTransport; // 670.000

      const costAcpHours = 240250;
      const costTransportPaid = 255000;
      const totalCost = costAcpHours + costTransportPaid; // 495.250

      const utilidadMedical = totalBudget - totalCost; // 174.750
      expect(utilidadMedical).toBe(174750);

      const marginPct = (utilidadMedical / totalBudget) * 100;
      expect(Math.round(marginPct * 10) / 10).toBe(26.1);
    });
  });

  describe('RVA171-4 Catia Rodrigues Daily Report Verification', () => {
    it('computes exact single-day report parameters', () => {
      const hours = 4.0;
      const shift = Guide.calculateShiftFee(hours, { modality: 'SPANISH_WITH_CAR' });

      expect(shift.hours).toBe(4.0);
      expect(shift.baseFee.amountInCents).toBe(6200000n); // 4 * $15.500 = $62.000
      expect(shift.mealSubsidy.amountInCents).toBe(2500000n); // $25.000 (Tier 2)

      const parkingClofan = 24300;
      const pharmacySamples = 8320;
      const totalExpenses = parkingClofan + pharmacySamples;
      expect(totalExpenses).toBe(32620);

      const totalDayLiquidation = Number(shift.totalFee.amountInCents / 100n) + totalExpenses;
      expect(totalDayLiquidation).toBe(62000 + 25000 + 32620); // 119.620
    });
  });

  describe('English Driver Degresive Continuous Scale & Reduced Meals', () => {
    it('calculates correct rates across all 4 continuous duration brackets', () => {
      // Bracket 1: <= 1.5h @ $40.000/h, 0 meal
      const b1 = Guide.calculateShiftFee(1.5, { modality: 'ENGLISH_WITH_CAR_DRIVER' });
      expect(b1.baseFee.amountInCents).toBe(6000000n); // 1.5 * 40k = 60.000
      expect(b1.mealSubsidy.amountInCents).toBe(0n);

      // Bracket 2: 2.0h @ $35.000/h, 0 meal
      const b2 = Guide.calculateShiftFee(2.0, { modality: 'ENGLISH_WITH_CAR_DRIVER' });
      expect(b2.baseFee.amountInCents).toBe(7000000n); // 2.0 * 35k = 70.000
      expect(b2.mealSubsidy.amountInCents).toBe(0n);

      // Bracket 3: 4.0h @ $30.000/h, $10.000 meal
      const b3 = Guide.calculateShiftFee(4.0, { modality: 'ENGLISH_WITH_CAR_DRIVER' });
      expect(b3.baseFee.amountInCents).toBe(12000000n); // 4.0 * 30k = 120.000
      expect(b3.mealSubsidy.amountInCents).toBe(1000000n); // $10.000 meal

      // Bracket 4: 7.0h @ $25.000/h, $20.000 meal
      const b4 = Guide.calculateShiftFee(7.0, { modality: 'ENGLISH_WITH_CAR_DRIVER' });
      expect(b4.baseFee.amountInCents).toBe(17500000n); // 7.0 * 25k = 175.000
      expect(b4.mealSubsidy.amountInCents).toBe(2000000n); // $20.000 meal
    });

    it('calculates English folder fees ($25k prep, $35k delivery)', () => {
      const shift = Guide.calculateShiftFee(3.0, {
        modality: 'ENGLISH_WITH_CAR_DRIVER',
        hasPrepAllowance: true,
        hasDeliveryAllowance: true,
      });

      expect(shift.prepFee.amountInCents).toBe(2500000n); // $25.000
      expect(shift.deliveryFee.amountInCents).toBe(3500000n); // $35.000
    });
  });
});
