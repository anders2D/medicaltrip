import { IItineraryRepository } from '../ports/IItineraryRepository';
import { SettlementDTO } from '../dtos/SettlementDTOs';
import { InvariantViolationError } from '../../domain/errors/DomainErrors';

export class CalculateSettlementUseCase {
  constructor(private readonly itineraryRepo: IItineraryRepository) {}

  async execute(reservaId: string): Promise<SettlementDTO> {
    const itinerary = await this.itineraryRepo.getByBookingCode(reservaId);
    if (!itinerary) {
      throw new InvariantViolationError(
        `[Liquidación]: No se encontró el expediente/itinerario para la reserva '${reservaId}'.`
      );
    }

    const sheet = itinerary.calculateBalanceSheet();

    return {
      reservaId: sheet.reservaId,
      currency: sheet.currency,
      totalOutOfPocket: {
        amountCents: sheet.totalOutOfPocket.amountInCents.toString(),
        formatted: sheet.totalOutOfPocket.format(),
      },
      totalCompanionFees: {
        amountCents: sheet.totalCompanionFees.amountInCents.toString(),
        formatted: sheet.totalCompanionFees.format(),
      },
      totalFleetTaxis: {
        amountCents: sheet.totalFleetTaxis.amountInCents.toString(),
        formatted: sheet.totalFleetTaxis.format(),
      },
      totalExpenses: {
        amountCents: sheet.totalExpenses.amountInCents.toString(),
        formatted: sheet.totalExpenses.format(),
      },
      totalCashAdvances: {
        amountCents: sheet.totalCashAdvances.amountInCents.toString(),
        formatted: sheet.totalCashAdvances.format(),
      },
      netBalance: {
        amountCents: sheet.netBalance.amountInCents.toString(),
        formatted: sheet.netBalance.format(),
      },
      isPatientOwing: sheet.isPatientOwing,
      isRefundDue: sheet.isRefundDue,
      transactions: itinerary.transactions.map((tx) => ({
        id: tx.id,
        timestamp: tx.timestamp.toISOString(),
        type: tx.type,
        amountCents: tx.amount.amountInCents.toString(),
        formattedAmount: tx.amount.format(),
        description: tx.description,
        receiptUuid: tx.receiptUuid,
        audited: tx.audited,
      })),
    };
  }
}
