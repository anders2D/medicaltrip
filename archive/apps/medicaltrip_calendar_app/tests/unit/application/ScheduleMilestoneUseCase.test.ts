import { describe, it, expect, beforeEach } from 'vitest';
import { ScheduleMilestoneUseCase } from '../../../src/application/use-cases/ScheduleMilestoneUseCase';
import { InMemoryItineraryRepository } from './mocks/InMemoryItineraryRepository';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { NonOperativeTerritoryError } from '../../../src/domain/errors/DomainErrors';

describe('ScheduleMilestoneUseCase', () => {
  let repo: InMemoryItineraryRepository;
  let useCase: ScheduleMilestoneUseCase;

  beforeEach(async () => {
    repo = new InMemoryItineraryRepository();
    useCase = new ScheduleMilestoneUseCase(repo);

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
    await repo.save(itinerary);
  });

  it('schedules a new clinical milestone inside approved corridor', async () => {
    const result = await useCase.execute({
      reservaId: 'RVA171-4',
      dayNumber: 1,
      title: 'Consulta Oftalmología Dr. Peláez',
      category: 'CLINICAL',
      startDateTime: '2026-08-20T15:00:00.000Z',
      endDateTime: '2026-08-20T17:30:00.000Z',
      location: 'Clínica Clofán Ciudad del Río',
      costCents: 5425000n, // $54.250 COP
      currency: 'COP',
      financialType: 'GUIDE_FEE',
      assignedGuideId: 'GUIA-01',
    });

    expect(result.id).toBeDefined();
    expect(result.title).toBe('Consulta Oftalmología Dr. Peláez');
    expect(result.location).toBe('Clínica Clofán Ciudad del Río');
    expect(result.canonicalCorridor).toBe('MEDELLIN');
    expect(result.durationMinutes).toBe(150);
    expect(result.status).toBe('PROGRAMADO');

    const savedItinerary = await repo.getByBookingCode('RVA171-4');
    expect(savedItinerary?.milestones.length).toBe(1);
  });

  it('fails fast when attempting to schedule a milestone in MOCOA', async () => {
    await expect(
      useCase.execute({
        reservaId: 'RVA171-4',
        dayNumber: 2,
        title: 'Consulta No Autorizada en Mocoa',
        category: 'CLINICAL',
        startDateTime: '2026-08-21T10:00:00.000Z',
        location: 'Hospital Departamental de Mocoa',
      })
    ).rejects.toThrow(NonOperativeTerritoryError);
  });
});
