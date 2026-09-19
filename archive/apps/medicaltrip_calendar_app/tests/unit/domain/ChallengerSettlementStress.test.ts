import { describe, it, expect } from 'vitest';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';
import { FinancialTransaction } from '../../../src/domain/entities/FinancialTransaction';
import { Guide } from '../../../src/domain/entities/Guide';
import { Driver } from '../../../src/domain/entities/Driver';
import { Money } from '../../../src/domain/values/Money';
import { OperativeTerritory } from '../../../src/domain/values/OperativeTerritory';
import {
  InvalidGuideShiftError,
  InvariantViolationError,
  MilestoneNotFoundError,
  CurrencyMismatchError,
} from '../../../src/domain/errors/DomainErrors';
import { CalculateSettlementUseCase } from '../../../src/application/use-cases/CalculateSettlementUseCase';
import { RescheduleMilestoneUseCase } from '../../../src/application/use-cases/RescheduleMilestoneUseCase';
import { ScheduleMilestoneUseCase } from '../../../src/application/use-cases/ScheduleMilestoneUseCase';
import { InMemoryItineraryRepository } from '../application/mocks/InMemoryItineraryRepository';

describe('Challenger 2 — Adversarial Stress & Verification Suite', () => {
  const createBooking = (code = 'RVA-CHALLENGE-01') => {
    return new Booking({
      id: `bkg-${code}`,
      code,
      patientId: 'ENT-PAX-9999',
      paxCount: 2,
      arrivalDate: '2026-08-20T08:00:00Z',
      departureDate: '2026-08-30T20:00:00Z',
      hotelName: 'Hotel Novelty Suites',
    });
  };

  describe('1. Guide Fee Shift & Tiered Meal Subsidies Exhaustive Verification', () => {
    // Shifts: 1h, 4h, 8h, 12h with & without prep allowance ($15.500 COP)
    // Tiered subsidies:
    // Tier 1: (0, 4) h -> $8.000 COP (800000n cents)
    // Tier 2: [4, 6] h -> $25.000 COP (2500000n cents)
    // Tier 3: (6, 10] h -> $35.000 COP (3500000n cents)
    // Tier 4: (10, 24] h -> $45.000 COP (4500000n cents)

    const expectedTable = [
      // [hours, prepAllowance, expectedBaseCents, expectedPrepCents, expectedMealTier, expectedMealCents, expectedTotalCents]
      [1.0, false, 1550000n, 0n, 1, 800000n, 2350000n],
      [1.0, true, 1550000n, 1550000n, 1, 800000n, 3900000n],
      [4.0, false, 6200000n, 0n, 2, 2500000n, 8700000n],
      [4.0, true, 6200000n, 1550000n, 2, 2500000n, 10250000n],
      [8.0, false, 12400000n, 0n, 3, 3500000n, 15900000n],
      [8.0, true, 12400000n, 1550000n, 3, 3500000n, 17450000n],
      [12.0, false, 18600000n, 0n, 4, 4500000n, 23100000n],
      [12.0, true, 18600000n, 1550000n, 4, 4500000n, 24650000n],
    ] as const;

    for (const [hours, prep, expBase, expPrep, expTier, expMeal, expTotal] of expectedTable) {
      it(`calculates shift ${hours}h (prep: ${prep}) -> Base: ${expBase}c, MealTier: ${expTier} (${expMeal}c), Total: ${expTotal}c`, () => {
        const res = Guide.calculateShiftFee(hours, prep);
        expect(res.hours).toBe(hours);
        expect(res.baseFee.amountInCents).toBe(expBase);
        expect(res.prepFee.amountInCents).toBe(expPrep);
        expect(res.mealTier).toBe(expTier);
        expect(res.mealSubsidy.amountInCents).toBe(expMeal);
        expect(res.totalFee.amountInCents).toBe(expTotal);
        // Invariant: baseFee + prepFee + mealSubsidy === totalFee
        expect(res.baseFee.add(res.prepFee).add(res.mealSubsidy).equals(res.totalFee)).toBe(true);
      });
    }

    it('tests boundary edge values for meal subsidy tiers', () => {
      // 0 hours
      const zeroH = Guide.calculateShiftFee(0, false);
      expect(zeroH.mealTier).toBe(0);
      expect(zeroH.mealSubsidy.amountInCents).toBe(0n);
      expect(zeroH.totalFee.amountInCents).toBe(0n);

      // Just above 0 (0.01h) -> Tier 1
      const tier1Low = Guide.calculateShiftFee(0.01, false);
      expect(tier1Low.mealTier).toBe(1);
      expect(tier1Low.mealSubsidy.amountInCents).toBe(800000n);

      // Just below 4h (3.99h) -> Tier 1
      const tier1High = Guide.calculateShiftFee(3.99, false);
      expect(tier1High.mealTier).toBe(1);
      expect(tier1High.mealSubsidy.amountInCents).toBe(800000n);

      // Exactly 4h -> Tier 2
      const tier2Low = Guide.calculateShiftFee(4.0, false);
      expect(tier2Low.mealTier).toBe(2);
      expect(tier2Low.mealSubsidy.amountInCents).toBe(2500000n);

      // Exactly 6h -> Tier 2
      const tier2High = Guide.calculateShiftFee(6.0, false);
      expect(tier2High.mealTier).toBe(2);
      expect(tier2High.mealSubsidy.amountInCents).toBe(2500000n);

      // Just above 6h (6.01h) -> Tier 3
      const tier3Low = Guide.calculateShiftFee(6.01, false);
      expect(tier3Low.mealTier).toBe(3);
      expect(tier3Low.mealSubsidy.amountInCents).toBe(3500000n);

      // Exactly 10h -> Tier 3
      const tier3High = Guide.calculateShiftFee(10.0, false);
      expect(tier3High.mealTier).toBe(3);
      expect(tier3High.mealSubsidy.amountInCents).toBe(3500000n);

      // Just above 10h (10.01h) -> Tier 4
      const tier4Low = Guide.calculateShiftFee(10.01, false);
      expect(tier4Low.mealTier).toBe(4);
      expect(tier4Low.mealSubsidy.amountInCents).toBe(4500000n);

      // Exactly 24h -> Tier 4
      const tier4Max = Guide.calculateShiftFee(24.0, false);
      expect(tier4Max.mealTier).toBe(4);
      expect(tier4Max.mealSubsidy.amountInCents).toBe(4500000n);
    });

    it('calculates fractional shift hours with exact half-up sub-cent multiplication', () => {
      // 1.5h with prep: Base = 1.5 * 15500 = $23.250 (2325000n), Prep = $15.500 (1550000n), Tier 1 Meal = $8.000 (800000n)
      // Total = 2325000 + 1550000 + 800000 = 4675000n cents ($46.750 COP)
      const res1_5 = Guide.calculateShiftFee(1.5, true);
      expect(res1_5.baseFee.amountInCents).toBe(2325000n);
      expect(res1_5.totalFee.amountInCents).toBe(4675000n);

      // 4.5h without prep: Base = 4.5 * 15500 = $69.750 (6975000n), Tier 2 Meal = $25.000 (2500000n)
      // Total = 6975000 + 2500000 = 9475000n cents ($94.750 COP)
      const res4_5 = Guide.calculateShiftFee(4.5, false);
      expect(res4_5.baseFee.amountInCents).toBe(6975000n);
      expect(res4_5.mealTier).toBe(2);
      expect(res4_5.totalFee.amountInCents).toBe(9475000n);
    });

    it('rejects illegal shift durations strictly (< 0 or > 24 or non-finite)', () => {
      expect(() => Guide.calculateShiftFee(-0.1)).toThrow(InvalidGuideShiftError);
      expect(() => Guide.calculateShiftFee(24.01)).toThrow(InvalidGuideShiftError);
      expect(() => Guide.calculateShiftFee(NaN)).toThrow(InvalidGuideShiftError);
      expect(() => Guide.calculateShiftFee(Infinity)).toThrow(InvalidGuideShiftError);
    });
  });

  describe('2. High Volume Stress Testing & BigInt Arithmetic Stability', () => {
    it('handles 10,000 mixed transactions with zero floating-point drift', () => {
      const booking = createBooking('RVA-MASSIVE-TX');
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      let expectedOutOfPocketCents = 0n;
      let expectedGuideFeeCents = 0n;
      let expectedFleetTaxiCents = 0n;
      let expectedCashAdvanceCents = 0n;

      const N = 10000;
      for (let i = 0; i < N; i++) {
        const amountCents = BigInt((i % 500 + 1) * 100000 + (i % 99));
        const money = Money.fromCents(amountCents, 'COP');
        const typeMod = i % 4;

        if (typeMod === 0) {
          expectedOutOfPocketCents += amountCents;
          itinerary.recordOutOfPocketExpense(`Pharmacy Tx ${i}`, money);
        } else if (typeMod === 1) {
          expectedGuideFeeCents += amountCents;
          itinerary.addTransaction(
            new FinancialTransaction({
              id: `tx-guide-${i}`,
              reservaId: booking.code,
              timestamp: new Date(1700000000000 + i * 1000),
              type: 'GUIDE_FEE',
              amount: money,
              description: `Guide shift fee ${i}`,
            })
          );
        } else if (typeMod === 2) {
          expectedFleetTaxiCents += amountCents;
          itinerary.addTransaction(
            new FinancialTransaction({
              id: `tx-fleet-${i}`,
              reservaId: booking.code,
              timestamp: new Date(1700000000000 + i * 1000),
              type: 'FLEET_TAXI',
              amount: money,
              description: `Driver transport ${i}`,
            })
          );
        } else {
          expectedCashAdvanceCents += amountCents;
          itinerary.recordCashAdvance(money, `Cash Advance ${i}`);
        }
      }

      const balanceSheet = itinerary.calculateBalanceSheet();

      expect(balanceSheet.totalOutOfPocket.amountInCents).toBe(expectedOutOfPocketCents);
      expect(balanceSheet.totalCompanionFees.amountInCents).toBe(expectedGuideFeeCents);
      expect(balanceSheet.totalFleetTaxis.amountInCents).toBe(expectedFleetTaxiCents);
      expect(balanceSheet.totalCashAdvances.amountInCents).toBe(expectedCashAdvanceCents);

      const expectedTotalExpensesCents = expectedOutOfPocketCents + expectedGuideFeeCents + expectedFleetTaxiCents;
      const expectedNetBalanceCents = expectedTotalExpensesCents - expectedCashAdvanceCents;

      expect(balanceSheet.totalExpenses.amountInCents).toBe(expectedTotalExpensesCents);
      expect(balanceSheet.netBalance.amountInCents).toBe(expectedNetBalanceCents);

      // Invariant: OutOfPocket + CompanionFees + FleetTaxis - CashAdvances = NetBalance
      const sumCheck = balanceSheet.totalOutOfPocket
        .add(balanceSheet.totalCompanionFees)
        .add(balanceSheet.totalFleetTaxis)
        .subtract(balanceSheet.totalCashAdvances);

      expect(sumCheck.equals(balanceSheet.netBalance)).toBe(true);
      expect(balanceSheet.transactionCount).toBe(N);
    });

    it('handles extreme multi-billion COP values without truncation or loss of precision', () => {
      const booking = createBooking('RVA-BILLIONS');
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      // 5 billion COP in cents = 500,000,000,000n cents (500 Billion cents)
      const fiveBillionCop = Money.fromCents(500000000000n, 'COP');
      // 3 billion COP in cents = 300,000,000,000n cents
      const threeBillionCop = Money.fromCents(300000000000n, 'COP');

      itinerary.recordOutOfPocketExpense('High Cost Clinical Procedure', fiveBillionCop);
      itinerary.recordCashAdvance(threeBillionCop, 'Wire Transfer');

      const sheet = itinerary.calculateBalanceSheet();
      expect(sheet.totalExpenses.amountInCents).toBe(500000000000n);
      expect(sheet.totalCashAdvances.amountInCents).toBe(300000000000n);
      expect(sheet.netBalance.amountInCents).toBe(200000000000n);
      expect(sheet.isPatientOwing).toBe(true);
      expect(sheet.isRefundDue).toBe(false);
    });

    it('rejects cross-currency transaction addition in Money domain math', () => {
      const cop = Money.fromCents(100000n, 'COP');
      const usd = Money.fromCents(10000n, 'USD');

      expect(() => cop.add(usd)).toThrow(CurrencyMismatchError);
      expect(() => cop.subtract(usd)).toThrow(CurrencyMismatchError);
    });
  });

  describe('3. Dynamic Rescheduling & Milestone Temporal Invariants', () => {
    it('supports past, future, and overlapping dynamic rescheduling', () => {
      const booking = createBooking('RVA-RESCHED-STRESS');
      const itinerary = new MedicalItinerary({ booking });

      // Milestone 1: 2026-08-21 08:00 to 10:00 (2 hours)
      const m1 = new ItineraryMilestone({
        id: 'm-1',
        reservaId: booking.code,
        dayNumber: 2,
        title: 'Cita Laboratorio',
        category: 'LAB',
        startDateTime: '2026-08-21T08:00:00Z',
        endDateTime: '2026-08-21T10:00:00Z',
        location: 'Laboratorio Echavarría Poblado',
      });

      // Milestone 2: 2026-08-21 11:00 to 13:00 (2 hours)
      const m2 = new ItineraryMilestone({
        id: 'm-2',
        reservaId: booking.code,
        dayNumber: 2,
        title: 'Consulta Cardiología',
        category: 'CLINICAL',
        startDateTime: '2026-08-21T11:00:00Z',
        endDateTime: '2026-08-21T13:00:00Z',
        location: 'Clínica Cardio VID',
      });

      itinerary.addMilestone(m1);
      itinerary.addMilestone(m2);

      // Initial ordering: m1 then m2
      expect(itinerary.milestones[0].id).toBe('m-1');
      expect(itinerary.milestones[1].id).toBe('m-2');

      // Reschedule m2 to the PAST (earlier than m1): 2026-08-21 06:00
      itinerary.rescheduleMilestone('m-2', '2026-08-21T06:00:00Z');
      expect(itinerary.milestones[0].id).toBe('m-2');
      expect(itinerary.milestones[1].id).toBe('m-1');
      expect(itinerary.getMilestoneOrThrow('m-2').durationMinutes).toBe(120);

      // Reschedule m1 to OVERLAP exactly with m2 (concurrent time: 06:30 to 07:30)
      itinerary.rescheduleMilestone('m-1', '2026-08-21T06:30:00Z', '2026-08-21T07:30:00Z');
      expect(itinerary.getMilestoneOrThrow('m-1').durationMinutes).toBe(60);
      expect(itinerary.milestones[0].id).toBe('m-2'); // 06:00
      expect(itinerary.milestones[1].id).toBe('m-1'); // 06:30

      // Reschedule m2 to FUTURE: 2026-08-25 15:00
      itinerary.rescheduleMilestone('m-2', '2026-08-25T15:00:00Z');
      expect(itinerary.milestones[0].id).toBe('m-1'); // m1 is 08-21
      expect(itinerary.milestones[1].id).toBe('m-2'); // m2 is 08-25
    });

    it('preserves state and attachments during rescheduling across application use case', async () => {
      const repo = new InMemoryItineraryRepository();
      const booking = createBooking('RVA-USECASE-RESCHED');
      const itinerary = new MedicalItinerary({ booking });

      const m = new ItineraryMilestone({
        id: 'm-att',
        reservaId: booking.code,
        dayNumber: 1,
        title: 'Traslado JMC',
        category: 'FLIGHT',
        startDateTime: '2026-08-20T10:00:00Z',
        location: 'Aeropuerto JMC Rionegro',
        assignedDriverId: 'DRV-01',
        cost: Money.fromCents(14500000n, 'COP'),
        financialType: 'FLEET_TAXI',
      });
      itinerary.addMilestone(m);
      await repo.save(itinerary);

      const rescheduleUseCase = new RescheduleMilestoneUseCase(repo);
      const updatedDto = await rescheduleUseCase.execute({
        reservaId: booking.code,
        milestoneId: 'm-att',
        newStartDateTime: '2026-08-20T14:00:00Z',
      });

      expect(updatedDto.startDateTime).toBe('2026-08-20T14:00:00.000Z');
      expect(updatedDto.costCents).toBe('14500000');
      expect(updatedDto.assignedDriverId).toBe('DRV-01');
      expect(updatedDto.canonicalCorridor).toBe('RIONEGRO');
    });

    it('throws MilestoneNotFoundError when rescheduling non-existent milestone', () => {
      const booking = createBooking('RVA-NOTFOUND');
      const itinerary = new MedicalItinerary({ booking });
      expect(() => itinerary.rescheduleMilestone('m-ghost', new Date())).toThrow(MilestoneNotFoundError);
    });

    it('handles removing milestone and maintaining aggregate state integrity', () => {
      const booking = createBooking('RVA-REMOVE');
      const itinerary = new MedicalItinerary({ booking });

      const m = new ItineraryMilestone({
        id: 'm-to-remove',
        reservaId: booking.code,
        dayNumber: 1,
        title: 'Cita preliminar',
        category: 'CLINICAL',
        startDateTime: '2026-08-20T10:00:00Z',
        location: 'Clínica Clofán',
      });
      itinerary.addMilestone(m);
      expect(itinerary.milestones.length).toBe(1);

      itinerary.removeMilestone('m-to-remove');
      expect(itinerary.milestones.length).toBe(0);
      expect(() => itinerary.removeMilestone('m-to-remove')).toThrow(MilestoneNotFoundError);
    });
  });

  describe('4. Master Settlement Equation Balance Invariants', () => {
    it('verifies exact zero balance (Advances == Expenses)', () => {
      const booking = createBooking('RVA-BAL-ZERO');
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      // Out of pocket: $50.000 COP
      itinerary.recordOutOfPocketExpense('Medicamentos', Money.fromCents(5000000n, 'COP'));
      // Companion fee: $87.000 COP
      itinerary.addTransaction(
        new FinancialTransaction({
          id: 'tx-g',
          reservaId: booking.code,
          timestamp: new Date(),
          type: 'GUIDE_FEE',
          amount: Money.fromCents(8700000n, 'COP'),
          description: 'Acompañamiento 4h',
        })
      );
      // Fleet taxi: $35.000 COP
      itinerary.addTransaction(
        new FinancialTransaction({
          id: 'tx-t',
          reservaId: booking.code,
          timestamp: new Date(),
          type: 'FLEET_TAXI',
          amount: Money.fromCents(3500000n, 'COP'),
          description: 'Traslado Urbano Medio',
        })
      );

      // Total Expenses = 50k + 87k + 35k = 172.000 COP (17200000n cents)
      // Advance matching exactly: $172.000 COP
      itinerary.recordCashAdvance(Money.fromCents(17200000n, 'COP'), 'Pago exacto');

      const sheet = itinerary.calculateBalanceSheet();
      expect(sheet.totalExpenses.amountInCents).toBe(17200000n);
      expect(sheet.totalCashAdvances.amountInCents).toBe(17200000n);
      expect(sheet.netBalance.amountInCents).toBe(0n);
      expect(sheet.netBalance.isZero()).toBe(true);
      expect(sheet.isPatientOwing).toBe(false);
      expect(sheet.isRefundDue).toBe(false);
    });

    it('verifies patient owing (Expenses > Advances)', () => {
      const booking = createBooking('RVA-BAL-OWING');
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      itinerary.recordOutOfPocketExpense('Insumos', Money.fromCents(30000000n, 'COP')); // 300.000 COP
      itinerary.recordCashAdvance(Money.fromCents(10000000n, 'COP'), 'Anticipo'); // 100.000 COP

      const sheet = itinerary.calculateBalanceSheet();
      expect(sheet.netBalance.amountInCents).toBe(20000000n); // +200.000 COP
      expect(sheet.isPatientOwing).toBe(true);
      expect(sheet.isRefundDue).toBe(false);
    });

    it('verifies refund due (Expenses < Advances)', () => {
      const booking = createBooking('RVA-BAL-REFUND');
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      itinerary.recordOutOfPocketExpense('Gotas', Money.fromCents(4000000n, 'COP')); // 40.000 COP
      itinerary.recordCashAdvance(Money.fromCents(15000000n, 'COP'), 'Anticipo'); // 150.000 COP

      const sheet = itinerary.calculateBalanceSheet();
      expect(sheet.netBalance.amountInCents).toBe(-11000000n); // -110.000 COP
      expect(sheet.isPatientOwing).toBe(false);
      expect(sheet.isRefundDue).toBe(true);
    });

    it('verifies end-to-end calculation via CalculateSettlementUseCase DTO formatting', async () => {
      const repo = new InMemoryItineraryRepository();
      const booking = createBooking('RVA-USECASE-DTO');
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      itinerary.recordOutOfPocketExpense('Examen Sangre', Money.fromCents(12000000n, 'COP')); // $120.000 COP
      itinerary.recordCashAdvance(Money.fromCents(10000000n, 'COP'), 'Abono Inicial'); // $100.000 COP

      await repo.save(itinerary);

      const useCase = new CalculateSettlementUseCase(repo);
      const dto = await useCase.execute(booking.code);

      expect(dto.reservaId).toBe(booking.code);
      expect(dto.currency).toBe('COP');
      expect(dto.totalOutOfPocket.amountCents).toBe('12000000');
      expect(dto.totalOutOfPocket.formatted).toBe('$ 120.000 COP');
      expect(dto.totalCashAdvances.amountCents).toBe('10000000');
      expect(dto.totalCashAdvances.formatted).toBe('$ 100.000 COP');
      expect(dto.netBalance.amountCents).toBe('2000000');
      expect(dto.netBalance.formatted).toBe('$ 20.000 COP');
      expect(dto.isPatientOwing).toBe(true);
      expect(dto.isRefundDue).toBe(false);
      expect(dto.transactions.length).toBe(2);
    });
  });
});
