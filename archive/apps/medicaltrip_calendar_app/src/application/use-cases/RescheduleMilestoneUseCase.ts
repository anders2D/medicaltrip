import { IItineraryRepository } from '../ports/IItineraryRepository';
import { IActorSwarmBus } from '../ports/IActorSwarmBus';
import { RescheduleMilestoneCommand, MilestoneDTO } from '../dtos/ItineraryDTOs';
import { InvariantViolationError } from '../../domain/errors/DomainErrors';

export class RescheduleMilestoneUseCase {
  constructor(
    private readonly itineraryRepo: IItineraryRepository,
    private readonly swarmBus?: IActorSwarmBus
  ) {}

  async execute(command: RescheduleMilestoneCommand): Promise<MilestoneDTO> {
    const itinerary = await this.itineraryRepo.getByBookingCode(command.reservaId);
    if (!itinerary) {
      throw new InvariantViolationError(
        `[Reagendamiento]: No se encontró el itinerario para la reserva '${command.reservaId}'.`
      );
    }

    const updated = itinerary.rescheduleMilestone(
      command.milestoneId,
      command.newStartDateTime,
      command.newEndDateTime
    );

    await this.itineraryRepo.save(itinerary);

    if (this.swarmBus) {
      await this.swarmBus.broadcast({
        id: `msg-${Date.now()}`,
        sender: 'COORD',
        recipient: 'BROADCAST',
        topic: 'MILESTONE_RESCHEDULED',
        payload: {
          milestoneId: updated.id,
          reservaId: command.reservaId,
          newStart: updated.startDateTime.toISOString(),
          newEnd: updated.endDateTime.toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return {
      id: updated.id,
      reservaId: updated.reservaId,
      dayNumber: updated.dayNumber,
      title: updated.title,
      category: updated.category,
      startDateTime: updated.startDateTime.toISOString(),
      endDateTime: updated.endDateTime.toISOString(),
      durationMinutes: updated.durationMinutes,
      location: updated.location.rawName,
      canonicalCorridor: updated.location.canonicalCorridor,
      status: updated.status,
      costFormatted: updated.cost.format(),
      costCents: updated.cost.amountInCents.toString(),
      currency: updated.cost.currency,
      providerName: updated.providerName,
      assignedDriverId: updated.assignedDriverId,
      assignedGuideId: updated.assignedGuideId,
      assignedNurseId: updated.assignedNurseId,
      gpsChecked: updated.gpsChecked,
      requiresGpsCheckIn: updated.requiresGpsCheckIn,
      requiresSignature: updated.requiresSignature,
      requiresReceipt: updated.requiresReceipt,
      signatureUuid: updated.signatureUuid,
      receiptUuid: updated.receiptUuid,
      notes: updated.notes,
    };
  }
}
