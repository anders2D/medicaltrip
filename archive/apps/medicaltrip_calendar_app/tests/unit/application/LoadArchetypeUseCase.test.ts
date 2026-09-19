import { describe, it, expect, beforeEach } from 'vitest';
import { LoadArchetypeUseCase } from '../../../src/application/use-cases/LoadArchetypeUseCase';
import { InMemoryItineraryRepository } from './mocks/InMemoryItineraryRepository';
import { InvariantViolationError } from '../../../src/domain/errors/DomainErrors';

describe('LoadArchetypeUseCase — 4 Canonical Google Drive Operational Archetypes', () => {
  let repo: InMemoryItineraryRepository;
  let useCase: LoadArchetypeUseCase;

  beforeEach(() => {
    repo = new InMemoryItineraryRepository();
    useCase = new LoadArchetypeUseCase(repo);
  });

  it('loads RVA171 Catia x5 (Cosmetic & Pediatric Group Itinerary)', async () => {
    const result = await useCase.execute('RVA171');

    expect(result.patient.id).toBe('ENT-PAX-0171');
    expect(result.patient.fullName).toBe('Catia Rodrigues');
    expect(result.patient.country).toBe('Curazao');
    expect(result.patient.language).toBe('Papiamento');
    expect(result.patient.companionNames.length).toBe(4);

    expect(result.itinerary.booking.paxCount).toBe(5);
    expect(result.itinerary.booking.hotelName).toBe('Hotel Inntu Laureles');
    expect(result.milestoneCount).toBeGreaterThanOrEqual(4);

    const sheet = result.itinerary.calculateBalanceSheet();
    expect(sheet.totalCashAdvances.amountInCents).toBe(209810000n); // $2.098.100 COP
    expect(sheet.currency).toBe('COP');
  });

  it('loads RVA282 George Cardio (Cardiovascular Checkup & 32-Day Stay)', async () => {
    const result = await useCase.execute('RVA282');

    expect(result.patient.id).toBe('ENT-PAX-0282');
    expect(result.patient.fullName).toBe('George Hernandez');
    expect(result.itinerary.booking.hotelName).toBe('Edificio Park 42 Poblado');
    expect(result.itinerary.booking.arrivalFlight).toBe('Wingo 7449');

    const sheet = result.itinerary.calculateBalanceSheet();
    expect(sheet.totalCashAdvances.amountInCents).toBe(120000000n); // $1.200.000 COP
  });

  it('loads RVA341 Eduard CES (Ophthalmology & Urology English Translation)', async () => {
    const result = await useCase.execute('RVA341');

    expect(result.patient.id).toBe('ENT-PAX-0341');
    expect(result.patient.fullName).toBe('Eduard Hogenboom');
    expect(result.itinerary.booking.hotelName).toBe('Hotel Inntu Laureles Hab. 1004');

    const labMilestone = result.itinerary.milestones.find((m) => m.category === 'LAB');
    expect(labMilestone).toBeDefined();
    expect(labMilestone?.providerName).toBe('Laboratorio Echavarría');
  });

  it('loads RVA077 Rumai 12d (12-Day Extended Multidisciplinary Rehab Journey)', async () => {
    const result = await useCase.execute('RVA077');

    expect(result.patient.id).toBe('ENT-PAX-0077');
    expect(result.patient.fullName).toBe('Alejandra Rumai');
    expect(result.itinerary.booking.durationDays).toBe(12);
    expect(result.itinerary.booking.hotelName).toBe('Hotel Novelty Suites El Poblado');

    const sheet = result.itinerary.calculateBalanceSheet();
    expect(sheet.totalCashAdvances.amountInCents).toBe(350000000n); // $3.500.000 COP
  });

  it('throws InvariantViolationError for unapproved archetype codes', async () => {
    await expect(useCase.execute('UNKNOWN_ARCHETYPE' as any)).rejects.toThrow(
      InvariantViolationError
    );
  });
});
