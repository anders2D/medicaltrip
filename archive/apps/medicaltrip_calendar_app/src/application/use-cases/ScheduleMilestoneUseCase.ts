import { IItineraryRepository } from '../ports/IItineraryRepository';
import { IActorSwarmBus } from '../ports/IActorSwarmBus';
import { ScheduleMilestoneCommand, MilestoneDTO } from '../dtos/ItineraryDTOs';
import { ItineraryMilestone } from '../../domain/entities/ItineraryMilestone';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';
import { Money } from '../../domain/values/Money';
import { InvariantViolationError } from '../../domain/errors/DomainErrors';

export class ScheduleMilestoneUseCase {
  constructor(
    private readonly itineraryRepo: IItineraryRepository,
    private readonly swarmBus?: IActorSwarmBus
  ) {}

  async execute(command: ScheduleMilestoneCommand): Promise<MilestoneDTO> {
    const itinerary = await this.itineraryRepo.getByBookingCode(command.reservaId);
    if (!itinerary) {
      throw new InvariantViolationError(
        `[Agendamiento]: No se encontró el expediente/itinerario para la reserva '${command.reservaId}'.`
      );
    }

    // Territory fail-fast validation happens during OperativeTerritory instantiation
    const territory = new OperativeTerritory({
      name: command.location,
      coordinates: command.coordinates
        ? new Coordinates(command.coordinates.latitude, command.coordinates.longitude)
        : undefined,
    });

    const cost = command.costCents !== undefined
      ? Money.fromCents(command.costCents, command.currency || itinerary.defaultCurrency)
      : Money.zero(command.currency || itinerary.defaultCurrency);

    const milestoneId = `itn-${command.reservaId.toLowerCase()}-d${command.dayNumber}-${Date.now().toString(36)}`;

    const milestone = new ItineraryMilestone({
      id: milestoneId,
      reservaId: command.reservaId,
      dayNumber: command.dayNumber,
      title: command.title,
      category: command.category,
      startDateTime: command.startDateTime,
      endDateTime: command.endDateTime,
      location: territory,
      coordinates: territory.coordinates || undefined,
      providerId: command.providerId,
      providerName: command.providerName,
      assignedDriverId: command.assignedDriverId,
      assignedGuideId: command.assignedGuideId,
      assignedNurseId: command.assignedNurseId,
      financialType: command.financialType || 'NONE',
      cost,
      guideHours: command.guideHours,
      notes: command.notes,
      requiresGpsCheckIn: command.requiresGpsCheckIn,
      requiresSignature: command.requiresSignature,
      requiresReceipt: command.requiresReceipt,
    });

    itinerary.addMilestone(milestone);
    await this.itineraryRepo.save(itinerary);

    // Notify swarm bus if driver or guide assigned
    if (this.swarmBus) {
      if (milestone.assignedDriverId) {
        await this.swarmBus.postMessageToAgent('DRV', {
          id: `msg-${Date.now()}`,
          sender: 'COORD',
          recipient: 'DRV',
          topic: 'MILESTONE_SCHEDULED',
          payload: { milestoneId: milestone.id, location: territory.rawName },
          timestamp: new Date().toISOString(),
        });
      }
      if (milestone.assignedGuideId) {
        await this.swarmBus.postMessageToAgent('GUIA', {
          id: `msg-${Date.now()}`,
          sender: 'COORD',
          recipient: 'GUIA',
          topic: 'MILESTONE_SCHEDULED',
          payload: { milestoneId: milestone.id, location: territory.rawName },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return {
      id: milestone.id,
      reservaId: milestone.reservaId,
      dayNumber: milestone.dayNumber,
      title: milestone.title,
      category: milestone.category,
      startDateTime: milestone.startDateTime.toISOString(),
      endDateTime: milestone.endDateTime.toISOString(),
      durationMinutes: milestone.durationMinutes,
      location: milestone.location.rawName,
      canonicalCorridor: milestone.location.canonicalCorridor,
      status: milestone.status,
      costFormatted: milestone.cost.format(),
      costCents: milestone.cost.amountInCents.toString(),
      currency: milestone.cost.currency,
      providerName: milestone.providerName,
      assignedDriverId: milestone.assignedDriverId,
      assignedGuideId: milestone.assignedGuideId,
      assignedNurseId: milestone.assignedNurseId,
      gpsChecked: milestone.gpsChecked,
      requiresGpsCheckIn: milestone.requiresGpsCheckIn,
      requiresSignature: milestone.requiresSignature,
      requiresReceipt: milestone.requiresReceipt,
      signatureUuid: milestone.signatureUuid,
      receiptUuid: milestone.receiptUuid,
      notes: milestone.notes,
    };
  }
}
