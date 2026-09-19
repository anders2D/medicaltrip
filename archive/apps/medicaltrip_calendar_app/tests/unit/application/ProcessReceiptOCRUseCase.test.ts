import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessReceiptOCRUseCase } from '../../../src/application/use-cases/ProcessReceiptOCRUseCase';
import { InMemoryItineraryRepository } from './mocks/InMemoryItineraryRepository';
import { IReceiptOCRService, ParsedReceipt } from '../../../src/application/ports/IReceiptOCRService';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import { Booking } from '../../../src/domain/entities/Booking';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';
import { Money } from '../../../src/domain/values/Money';

class MockReceiptOCRService implements IReceiptOCRService {
  async extractReceiptData(_image: Blob | string): Promise<ParsedReceipt> {
    return {
      receiptUuid: 'rec-uuid-cruz-verde-85k',
      vendorName: 'Droguería Cruz Verde S.A.S.',
      taxId: '800.123.456-7',
      date: '2026-08-21T15:30:00.000Z',
      items: [
        {
          description: 'Colirio Tobramicina Dexametasona',
          quantity: 1,
          unitPrice: Money.fromCents(4500000n, 'COP'),
          totalPrice: Money.fromCents(4500000n, 'COP'),
        },
        {
          description: 'Lágrimas Artificiales Systane Ultra',
          quantity: 1,
          unitPrice: Money.fromCents(4000000n, 'COP'),
          totalPrice: Money.fromCents(4000000n, 'COP'),
        },
      ],
      totalAmount: Money.fromCents(8500000n, 'COP'), // $85.000 COP
      confidenceScore: 0.98,
      rawText: 'CRUZ VERDE - TOTAL: 85.000 COP',
    };
  }
}

describe('ProcessReceiptOCRUseCase', () => {
  let repo: InMemoryItineraryRepository;
  let ocrService: MockReceiptOCRService;
  let useCase: ProcessReceiptOCRUseCase;

  beforeEach(async () => {
    repo = new InMemoryItineraryRepository();
    ocrService = new MockReceiptOCRService();
    useCase = new ProcessReceiptOCRUseCase(repo, ocrService);

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

    const pharmacyMilestone = new ItineraryMilestone({
      id: 'itn-171-pharma',
      reservaId: 'RVA171-4',
      dayNumber: 2,
      title: 'Compra de Medicamentos Post-Op',
      category: 'PHARMACY',
      startDateTime: '2026-08-21T15:30:00.000Z',
      location: 'Droguería Cruz Verde Poblado',
      financialType: 'OUT_OF_POCKET',
      requiresReceipt: true,
    });
    itinerary.addMilestone(pharmacyMilestone);

    await repo.save(itinerary);
  });

  it('processes receipt image, extracts items, and attaches out-of-pocket transaction to settlement', async () => {
    const result = await useCase.execute({
      reservaId: 'RVA171-4',
      milestoneId: 'itn-171-pharma',
      imageBlobOrBase64: 'data:image/jpeg;base64,sampleFakeImageData',
    });

    expect(result.receiptUuid).toBe('rec-uuid-cruz-verde-85k');
    expect(result.vendorName).toBe('Droguería Cruz Verde S.A.S.');
    expect(result.extractedAmountFormatted).toBe('$ 85.000 COP');

    expect(result.updatedSettlement.totalOutOfPocket.amountCents).toBe('8500000');
    expect(result.updatedSettlement.transactions.length).toBe(1);

    const savedItinerary = await repo.getByBookingCode('RVA171-4');
    const milestone = savedItinerary?.getMilestone('itn-171-pharma');
    expect(milestone?.receiptUuid).toBe('rec-uuid-cruz-verde-85k');
  });
});
