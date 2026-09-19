import { describe, it, expect, beforeEach } from 'vitest';
import { SignOffItineraryUseCase } from '../../../src/application/use-cases/SignOffItineraryUseCase';
import { InMemoryItineraryRepository } from './mocks/InMemoryItineraryRepository';
import { ISignatureStorageService } from '../../../src/application/ports/ISignatureStorageService';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';

class MockSignatureStorageService implements ISignatureStorageService {
  private readonly signatures = new Map<string, string>();

  async saveSignature(_reservaId: string, _milestoneId: string, signatureDataUrl: string): Promise<string> {
    const uuid = `sig-${Date.now()}`;
    this.signatures.set(uuid, signatureDataUrl);
    return uuid;
  }

  async getSignature(signatureUuid: string): Promise<string | null> {
    return this.signatures.get(signatureUuid) || null;
  }

  async deleteSignature(signatureUuid: string): Promise<void> {
    this.signatures.delete(signatureUuid);
  }
}

describe('SignOffItineraryUseCase', () => {
  let repo: InMemoryItineraryRepository;
  let signatureStorage: MockSignatureStorageService;
  let useCase: SignOffItineraryUseCase;

  beforeEach(async () => {
    repo = new InMemoryItineraryRepository();
    signatureStorage = new MockSignatureStorageService();
    useCase = new SignOffItineraryUseCase(repo, signatureStorage);

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

    const milestone = new ItineraryMilestone({
      id: 'itn-171-discharge',
      reservaId: 'RVA171-4',
      dayNumber: 5,
      title: 'Cierre Administrativo y Firma de Egreso',
      category: 'CLINICAL',
      startDateTime: '2026-08-25T13:00:00.000Z',
      location: 'Hotel Inntu Laureles',
      requiresSignature: true,
    });
    itinerary.addMilestone(milestone);

    await repo.save(itinerary);
  });

  it('saves patient digital signature and transitions milestone to COMPLETADO', async () => {
    const fakeSignatureDataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';

    const result = await useCase.execute({
      reservaId: 'RVA171-4',
      milestoneId: 'itn-171-discharge',
      signatureDataUrl: fakeSignatureDataUrl,
      signedByPaxName: 'Catia Rodrigues',
    });

    expect(result.signatureUuid).toMatch(/^sig-/);
    expect(result.isCompleted).toBe(true);
    expect(result.milestone.status).toBe('COMPLETADO');
    expect(result.milestone.signatureUuid).toBe(result.signatureUuid);

    const storedData = await signatureStorage.getSignature(result.signatureUuid);
    expect(storedData).toBe(fakeSignatureDataUrl);
  });
});
