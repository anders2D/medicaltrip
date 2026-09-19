import { describe, it, expect, beforeEach } from 'vitest';
import { RescheduleMilestoneUseCase } from '../../../src/application/use-cases/RescheduleMilestoneUseCase';
import { InMemoryItineraryRepository } from './mocks/InMemoryItineraryRepository';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';
import { MilestoneNotFoundError } from '../../../src/domain/errors/DomainErrors';

describe('RescheduleMilestoneUseCase', () => {
  let repo: InMemoryItineraryRepository;
  let useCase: RescheduleMilestoneUseCase;

  beforeEach(async () => {
    repo = new InMemoryItineraryRepository();
    useCase = new RescheduleMilestoneUseCase(repo);

    const booking = new Booking({
      id: 'bkg-1',
      code: 'RVA171-4',
      patientId: 'ENT-PAX-0171',
      paxCount: 5,
      arrivalDate: '2026-08-20T10:00:00Z',
      departureDate: '2026-08-25T18:00:00Z',
      hotelName: 'Hotel Inntu Laureles',
    });

    const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

    const milestone = new ItineraryMilestone({
      id: 'itn-171-01',
      reservaId: 'RVA171-4',
      dayNumber: 1,
      title: 'Consulta Clofán',
      category: 'CLINICAL',
      startDateTime: '2026-08-20T14:00:00.000Z',
      endDateTime: '2026-08-20T16:00:00.000Z',
      location: 'Clínica Clofán Ciudad del Río',
    });
    itinerary.addMilestone(milestone);

    await repo.save(itinerary);
  });

  it('reschedules an existing milestone maintaining its duration', async () => {
    const result = await useCase.execute({
      reservaId: 'RVA171-4',
      milestoneId: 'itn-171-01',
      newStartDateTime: '2026-08-20T16:30:00.000Z',
    });

    expect(result.startDateTime).toBe('2026-08-20T16:30:00.000Z');
    expect(result.endDateTime).toBe('2026-08-20T18:30:00.000Z');
    expect(result.durationMinutes).toBe(120);

    const savedItinerary = await repo.getByBookingCode('RVA171-4');
    const savedMilestone = savedItinerary?.getMilestone('itn-171-01');
    expect(savedMilestone?.startDateTime.toISOString()).toBe('2026-08-20T16:30:00.000Z');
  });

  it('throws MilestoneNotFoundError when rescheduling non-existent milestone', async () => {
    await expect(
      useCase.execute({
        reservaId: 'RVA171-4',
        milestoneId: 'non-existent-id',
        newStartDateTime: '2026-08-20T16:30:00.000Z',
      })
    ).rejects.toThrow(MilestoneNotFoundError);
  });
});
