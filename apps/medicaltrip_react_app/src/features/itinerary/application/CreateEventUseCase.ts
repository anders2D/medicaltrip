/**
 * Medical Trip Colombia S.A.S. - CreateEventUseCase
 * CQRS Command Use Case for scheduling discrete milestones in a patient's medical journey.
 */

import { IStoragePort } from '@/core/ports';
import { IActorEventBusPort } from '@/features/swarm';
import { ItineraryEvent, FinancialExpenseType } from '../domain/ItineraryEvent';
import { EventCategoryType } from '../domain/EventCategory';
import { EventStatusType } from '../domain/EventStatus';
import { OperativeTerritory, GeoCoordinates } from '@/core/domain';
import { Money } from '@/core/domain';

export interface CreateEventCommand {
  id?: string;
  bookingId: string;
  dayNumber: number;
  title: string;
  category: EventCategoryType;
  startDateTime: string;
  endDateTime: string;
  location?: string | OperativeTerritory;
  locationStr?: string;
  coordinates?: GeoCoordinates;
  providerId?: string;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  financialType?: FinancialExpenseType;
  cost?: Money;
  costAmount?: number;
  guideHours?: number;
  status?: EventStatusType;
  requiresGpsCheckIn?: boolean;
  requiresSignature?: boolean;
  requiresReceipt?: boolean;
  notes?: string;
}

export class CreateEventUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly eventBusPort?: IActorEventBusPort
  ) {}

  public async execute(command: CreateEventCommand): Promise<ItineraryEvent> {
    const id = command.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    
    const locInput = command.location || command.locationStr || '';
    // Resolve OperativeTerritory (will throw fail-fast NonOperativeTerritoryError if invalid or forbidden)
    const location = typeof locInput === 'string'
      ? OperativeTerritory.fromString(locInput, command.coordinates)
      : locInput;

    const cost = command.cost || (command.costAmount !== undefined ? Money.fromAmount(command.costAmount, 'COP') : Money.zero());

    const event = new ItineraryEvent({
      id,
      bookingId: command.bookingId,
      dayNumber: command.dayNumber,
      title: command.title,
      category: command.category,
      startDateTime: command.startDateTime,
      endDateTime: command.endDateTime,
      location,
      coordinates: command.coordinates || location.coordinates,
      providerId: command.providerId,
      providerName: command.providerName,
      assignedDriverId: command.assignedDriverId,
      assignedGuideId: command.assignedGuideId,
      assignedNurseId: command.assignedNurseId,
      financialType: command.financialType || 'NONE',
      cost,
      guideHours: command.guideHours,
      status: command.status || 'PROGRAMADO',
      requiresGpsCheckIn: command.requiresGpsCheckIn || false,
      requiresSignature: command.requiresSignature || false,
      requiresReceipt: command.requiresReceipt || false,
      notes: command.notes || '',
    });

    // Persist to storage
    await this.storagePort.saveEvent(event);

    // Append to CQRS event stream
    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: command.bookingId,
      type: 'EVENT_CREATED',
      payload: {
        eventId: event.id,
        category: event.category,
        title: event.title,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        location: location.toJSON(),
      },
      timestamp: Date.now(),
    });

    // Broadcast through Actor Swarm if available
    if (this.eventBusPort) {
      await this.eventBusPort.broadcast('EVENT_CREATED', {
        eventId: event.id,
        bookingId: event.bookingId,
        category: event.category,
        assignedGuideId: event.assignedGuideId,
        assignedDriverId: event.assignedDriverId,
      });
    }

    return event;
  }
}
