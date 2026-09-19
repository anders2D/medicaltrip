import { IItineraryRepository } from '../ports/IItineraryRepository';
import { ISignatureStorageService } from '../ports/ISignatureStorageService';
import { SignOffItineraryCommand, MilestoneDTO } from '../dtos/ItineraryDTOs';
import { InvariantViolationError } from '../../domain/errors/DomainErrors';

export class SignOffItineraryUseCase {
  constructor(
    private readonly itineraryRepo: IItineraryRepository,
    private readonly signatureStorage: ISignatureStorageService
  ) {}

  async execute(command: SignOffItineraryCommand): Promise<{
    milestone: MilestoneDTO;
    signatureUuid: string;
    isCompleted: boolean;
  }> {
    const itinerary = await this.itineraryRepo.getByBookingCode(command.reservaId);
    if (!itinerary) {
      throw new InvariantViolationError(
        `[Firma Digital]: No se encontró el itinerario para la reserva '${command.reservaId}'.`
      );
    }

    // 1. Save signature blob via port
    const signatureUuid = await this.signatureStorage.saveSignature(
      command.reservaId,
      command.milestoneId,
      command.signatureDataUrl
    );

    // 2. Mark milestone as completed with signature attached
    const updatedMilestone = itinerary.updateMilestoneStatus(
      command.milestoneId,
      'COMPLETADO',
      { signatureUuid }
    );

    // 3. Save updated itinerary
    await this.itineraryRepo.save(itinerary);

    return {
      signatureUuid,
      isCompleted: updatedMilestone.status === 'COMPLETADO',
      milestone: {
        id: updatedMilestone.id,
        reservaId: updatedMilestone.reservaId,
        dayNumber: updatedMilestone.dayNumber,
        title: updatedMilestone.title,
        category: updatedMilestone.category,
        startDateTime: updatedMilestone.startDateTime.toISOString(),
        endDateTime: updatedMilestone.endDateTime.toISOString(),
        durationMinutes: updatedMilestone.durationMinutes,
        location: updatedMilestone.location.rawName,
        canonicalCorridor: updatedMilestone.location.canonicalCorridor,
        status: updatedMilestone.status,
        costFormatted: updatedMilestone.cost.format(),
        costCents: updatedMilestone.cost.amountInCents.toString(),
        currency: updatedMilestone.cost.currency,
        providerName: updatedMilestone.providerName,
        assignedDriverId: updatedMilestone.assignedDriverId,
        assignedGuideId: updatedMilestone.assignedGuideId,
        assignedNurseId: updatedMilestone.assignedNurseId,
        gpsChecked: updatedMilestone.gpsChecked,
        requiresGpsCheckIn: updatedMilestone.requiresGpsCheckIn,
        requiresSignature: updatedMilestone.requiresSignature,
        requiresReceipt: updatedMilestone.requiresReceipt,
        signatureUuid: updatedMilestone.signatureUuid,
        receiptUuid: updatedMilestone.receiptUuid,
        notes: updatedMilestone.notes,
      },
    };
  }
}
