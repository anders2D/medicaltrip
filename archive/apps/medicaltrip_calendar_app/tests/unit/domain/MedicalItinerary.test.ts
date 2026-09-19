import { describe, it, expect } from 'vitest';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';
import { Money } from '../../../src/domain/values/Money';
import {
  MilestoneNotFoundError,
  InvalidMilestoneTransitionError,
} from '../../../src/domain/errors/DomainErrors';

describe('MedicalItinerary Aggregate & Deterministic Settlement Engine', () => {
  const createTestBooking = () => {
    return new Booking({
      id: 'bkg-test-1',
      code: 'RVA171-4',
      patientId: 'ENT-PAX-0171',
      paxCount: 5,
      arrivalDate: '2026-08-20T10:00:00Z',
      departureDate: '2026-08-25T18:00:00Z',
      hotelName: 'Hotel Inntu Laureles',
    });
  };

  it('manages milestones and preserves chronological ordering', () => {
    const booking = createTestBooking();
    const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

    const m2 = new ItineraryMilestone({
      id: 'm-2',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Cita Oftalmología Clofán',
      category: 'CLINICAL',
      startDateTime: '2026-08-20T15:00:00Z',
      location: 'Clínica Clofán Ciudad del Río',
    });

    const m1 = new ItineraryMilestone({
      id: 'm-1',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Llegada Vuelo JMC',
      category: 'FLIGHT',
      startDateTime: '2026-08-20T10:00:00Z',
      location: 'Aeropuerto JMC Rionegro',
    });

    itinerary.addMilestone(m2);
    itinerary.addMilestone(m1);

    expect(itinerary.milestones.length).toBe(2);
    expect(itinerary.milestones[0].id).toBe('m-1'); // m1 is earlier
    expect(itinerary.milestones[1].id).toBe('m-2');
  });

  it('transitions milestone state machine: PROGRAMADO -> EN_CAMINO -> EN_SITIO -> COMPLETADO', () => {
    const booking = createTestBooking();
    const itinerary = new MedicalItinerary({ booking });

    const m = new ItineraryMilestone({
      id: 'm-trans',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Traslado Hospitalario',
      category: 'FLIGHT',
      startDateTime: '2026-08-20T10:00:00Z',
      location: 'Aeropuerto JMC Rionegro',
    });
    itinerary.addMilestone(m);

    expect(itinerary.getMilestoneOrThrow('m-trans').status).toBe('PROGRAMADO');

    itinerary.updateMilestoneStatus('m-trans', 'EN_CAMINO');
    expect(itinerary.getMilestoneOrThrow('m-trans').status).toBe('EN_CAMINO');

    itinerary.updateMilestoneStatus('m-trans', 'EN_SITIO');
    expect(itinerary.getMilestoneOrThrow('m-trans').status).toBe('EN_SITIO');
    expect(itinerary.getMilestoneOrThrow('m-trans').gpsChecked).toBe(true);

    itinerary.updateMilestoneStatus('m-trans', 'COMPLETADO', { signatureUuid: 'sig-123' });
    expect(itinerary.getMilestoneOrThrow('m-trans').status).toBe('COMPLETADO');
    expect(itinerary.getMilestoneOrThrow('m-trans').signatureUuid).toBe('sig-123');
  });

  it('rejects invalid milestone state transitions', () => {
    const booking = createTestBooking();
    const itinerary = new MedicalItinerary({ booking });

    const m = new ItineraryMilestone({
      id: 'm-inv',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Consulta',
      category: 'CLINICAL',
      startDateTime: '2026-08-20T10:00:00Z',
      location: 'Clínica Clofán',
      status: 'COMPLETADO',
    });
    itinerary.addMilestone(m);

    expect(() => itinerary.updateMilestoneStatus('m-inv', 'CANCELADO')).toThrow(
      InvalidMilestoneTransitionError
    );
  });

  it('reschedules a milestone and adjusts end time accurately', () => {
    const booking = createTestBooking();
    const itinerary = new MedicalItinerary({ booking });

    const m = new ItineraryMilestone({
      id: 'm-resched',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Consulta',
      category: 'CLINICAL',
      startDateTime: '2026-08-20T10:00:00Z',
      endDateTime: '2026-08-20T12:00:00Z', // 2 hours duration
      location: 'Clínica Clofán',
    });
    itinerary.addMilestone(m);

    itinerary.rescheduleMilestone('m-resched', '2026-08-20T14:00:00Z');
    const updated = itinerary.getMilestoneOrThrow('m-resched');

    expect(updated.startDateTime.toISOString()).toBe('2026-08-20T14:00:00.000Z');
    expect(updated.endDateTime.toISOString()).toBe('2026-08-20T16:00:00.000Z');
    expect(updated.durationMinutes).toBe(120);
  });

  it('calculates deterministic financial balance sheet without float errors', () => {
    const booking = createTestBooking();
    const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

    // 1. Advance: $2.098.100 COP (209810000n cents)
    itinerary.recordCashAdvance(Money.fromCents(209810000n, 'COP'), 'Anticipo Bancolombia');

    // 2. Transport milestone: $160.000 COP (16000000n cents)
    itinerary.addMilestone(
      new ItineraryMilestone({
        id: 'evt-taxi-1',
        reservaId: booking.code,
        dayNumber: 1,
        title: 'Traslado JMC Van XL',
        category: 'FLIGHT',
        startDateTime: '2026-08-20T10:00:00Z',
        location: 'Aeropuerto JMC ➔ Inntu Laureles',
        financialType: 'FLEET_TAXI',
        cost: Money.fromCents(16000000n, 'COP'),
      })
    );

    // 3. Guide fee milestone: $124.000 COP (12400000n cents)
    itinerary.addMilestone(
      new ItineraryMilestone({
        id: 'evt-guide-1',
        reservaId: booking.code,
        dayNumber: 2,
        title: 'Guianza CIMA',
        category: 'CLINICAL',
        startDateTime: '2026-08-21T06:30:00Z',
        location: 'CIMA Diagnósticos',
        financialType: 'GUIDE_FEE',
        cost: Money.fromCents(12400000n, 'COP'),
      })
    );

    // 4. Out of pocket expenses: $85.000 COP (8500000n cents) + $65.000 COP (6500000n cents)
    itinerary.recordOutOfPocketExpense('Farmacia Cruz Verde Gotas', Money.fromCents(8500000n, 'COP'));
    itinerary.recordOutOfPocketExpense('Toma Muestra Lab', Money.fromCents(6500000n, 'COP'));

    const sheet = itinerary.calculateBalanceSheet();

    // Total Fleet: 160.000 COP
    expect(sheet.totalFleetTaxis.amountInCents).toBe(16000000n);
    // Total Guide: 124.000 COP
    expect(sheet.totalCompanionFees.amountInCents).toBe(12400000n);
    // Total Out-of-pocket: 85.000 + 65.000 = 150.000 COP
    expect(sheet.totalOutOfPocket.amountInCents).toBe(15000000n);
    // Total Expenses: 160k + 124k + 150k = 434.000 COP (43400000n cents)
    expect(sheet.totalExpenses.amountInCents).toBe(43400000n);
    // Total Cash Advances: 2.098.100 COP (209810000n cents)
    expect(sheet.totalCashAdvances.amountInCents).toBe(209810000n);
    // Net Balance: 434.000 - 2.098.100 = -1.664.100 COP (-166410000n cents)
    expect(sheet.netBalance.amountInCents).toBe(-166410000n);
    expect(sheet.isPatientOwing).toBe(false);
    expect(sheet.isRefundDue).toBe(true);
  });
});
