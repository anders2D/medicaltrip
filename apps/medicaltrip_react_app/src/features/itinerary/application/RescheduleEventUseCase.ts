/**
 * Medical Trip Colombia S.A.S. - RescheduleEventUseCase
 * CQRS Command Use Case for moving, stretching, or adjusting scheduled itinerary milestones.
 */

import { IStoragePort } from '@/core/ports';
import { IActorEventBusPort } from '@/features/swarm';
import { ItineraryEvent } from '../domain/ItineraryEvent';
import { EventNotFoundError } from '@/core/domain';
import { OperativeTerritory } from '@/core/domain';

import { EventStatusType } from '../domain/EventStatus';

export interface RescheduleEventCommand {
  eventId: string;
  newStartDateTime: string;
  newEndDateTime: string;
  newLocation?: string | OperativeTerritory;
  newStatus?: EventStatusType;
  reason?: string;
}

export class RescheduleEventUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly eventBusPort?: IActorEventBusPort
  ) {}

  public async execute(command: RescheduleEventCommand): Promise<ItineraryEvent> {
    const existing = await this.storagePort.getEventById(command.eventId);
    if (!existing) {
      throw new EventNotFoundError(command.eventId);
    }

    let updatedLocation = existing.location;
    if (command.newLocation) {
      updatedLocation = typeof command.newLocation === 'string'
        ? OperativeTerritory.fromString(command.newLocation)
        : command.newLocation;
    }

    const rescheduled = new ItineraryEvent({
      ...existing,
      startDateTime: command.newStartDateTime,
      endDateTime: command.newEndDateTime,
      location: updatedLocation,
      coordinates: updatedLocation.coordinates || existing.coordinates,
      status: command.newStatus || existing.status,
    });

    await this.storagePort.saveEvent(rescheduled);

    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: rescheduled.bookingId,
      type: 'EVENT_RESCHEDULED',
      payload: {
        eventId: rescheduled.id,
        previousStart: existing.startDateTime,
        previousEnd: existing.endDateTime,
        newStart: rescheduled.startDateTime,
        newEnd: rescheduled.endDateTime,
      },
      timestamp: Date.now(),
    });

    if (this.eventBusPort) {
      await this.eventBusPort.broadcast('EVENT_RESCHEDULED', {
        eventId: rescheduled.id,
        bookingId: rescheduled.bookingId,
        newStartDateTime: rescheduled.startDateTime,
        newEndDateTime: rescheduled.endDateTime,
      });
    }

    return rescheduled;
  }
}
