import { describe, it, expect, beforeEach } from 'vitest';
import { CalculateSettlementUseCase } from '../../../src/application/use-cases/CalculateSettlementUseCase';
import { InMemoryItineraryRepository } from './mocks/InMemoryItineraryRepository';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { Money } from '../../../src/domain/values/Money';

describe('CalculateSettlementUseCase', () => {
  let repo: InMemoryItineraryRepository;
  let useCase: CalculateSettlementUseCase;

  beforeEach(async () => {
    repo = new InMemoryItineraryRepository();
    useCase = new CalculateSettlementUseCase(repo);

    const booking = new Booking({
      id: 'bkg-rva171',
      code: 'RVA171-4',
      patientId: 'ENT-PAX-0171',
      paxCount: 5,
      arrivalDate: '2026-08-20T10:00:00Z',
      departureDate: '2026-08-25T18:00:00Z',
      hotelName: 'Hotel Inntu Laureles',
    });

    const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

    // Cash advances: $2.098.100 COP
    itinerary.recordCashAdvance(Money.fromCents(100000000n, 'COP'), 'Abono 1');
    itinerary.recordCashAdvance(Money.fromCents(109810000n, 'COP'), 'Abono 2');

    // Out-of-pocket: $167.000 COP
    itinerary.recordOutOfPocketExpense('Cruz Verde Medicamentos', Money.fromCents(8500000n, 'COP'));
    itinerary.recordOutOfPocketExpense('Parqueaderos Clofán', Money.fromCents(8200000n, 'COP'));

    await repo.save(itinerary);
  });

  it('calculates the complete itemized settlement report', async () => {
    const settlement = await useCase.execute('RVA171-4');

    expect(settlement.reservaId).toBe('RVA171-4');
    expect(settlement.currency).toBe('COP');
    expect(settlement.totalOutOfPocket.amountCents).toBe('16700000');
    expect(settlement.totalCashAdvances.amountCents).toBe('209810000');
    expect(settlement.netBalance.amountCents).toBe('-193110000'); // -1.931.100 COP
    expect(settlement.isRefundDue).toBe(true);
    expect(settlement.isPatientOwing).toBe(false);
    expect(settlement.transactions.length).toBe(4);
  });
});
