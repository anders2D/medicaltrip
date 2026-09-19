import { IItineraryRepository } from '../ports/IItineraryRepository';
import { IReceiptOCRService } from '../ports/IReceiptOCRService';
import { ProcessReceiptOCRCommand, SettlementDTO } from '../dtos/SettlementDTOs';
import { CalculateSettlementUseCase } from './CalculateSettlementUseCase';
import { InvariantViolationError } from '../../domain/errors/DomainErrors';

export class ProcessReceiptOCRUseCase {
  constructor(
    private readonly itineraryRepo: IItineraryRepository,
    private readonly ocrService: IReceiptOCRService
  ) {}

  async execute(command: ProcessReceiptOCRCommand): Promise<{
    receiptUuid: string;
    vendorName: string;
    extractedAmountFormatted: string;
    updatedSettlement: SettlementDTO;
  }> {
    const itinerary = await this.itineraryRepo.getByBookingCode(command.reservaId);
    if (!itinerary) {
      throw new InvariantViolationError(
        `[OCR Recibo]: No se encontró el itinerario para la reserva '${command.reservaId}'.`
      );
    }

    // 1. Send image to OCR service
    const parsedReceipt = await this.ocrService.extractReceiptData(command.imageBlobOrBase64);

    // 2. Attach to milestone if milestoneId was supplied
    if (command.milestoneId) {
      const milestone = itinerary.getMilestone(command.milestoneId);
      if (milestone) {
        itinerary.addMilestone(milestone.attachReceipt(parsedReceipt.receiptUuid, parsedReceipt.totalAmount));
      }
    } else {
      // 3. Record standalone out of pocket transaction in the itinerary ledger
      itinerary.recordOutOfPocketExpense(
        `Factura ${parsedReceipt.vendorName} (${parsedReceipt.items.length} ítems)`,
        parsedReceipt.totalAmount,
        {
          receiptUuid: parsedReceipt.receiptUuid,
          timestamp: parsedReceipt.date || new Date().toISOString(),
        }
      );
    }

    // 4. Persist updated itinerary
    await this.itineraryRepo.save(itinerary);

    // 5. Calculate updated settlement
    const settlementUseCase = new CalculateSettlementUseCase(this.itineraryRepo);
    const updatedSettlement = await settlementUseCase.execute(command.reservaId);

    return {
      receiptUuid: parsedReceipt.receiptUuid,
      vendorName: parsedReceipt.vendorName,
      extractedAmountFormatted: parsedReceipt.totalAmount.format(),
      updatedSettlement,
    };
  }
}
