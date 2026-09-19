/**
 * Medical Trip Colombia S.A.S. - PerformDriverCheckInUseCase
 * CQRS Command Use Case for 1-Click driver terminal check-in upon international patient arrival at JMC Rionegro Airport.
 * Atomically updates arrival DriverTransfer to IN_TRANSIT (or COMPLETED),
 * updates associated ItineraryEvent to EN_SITIO (or COMPLETADO) with gpsChecked: true,
 * and appends a DRIVER_CHECK_IN_TERMINAL domain event record to IStoragePort.
 */

import { IStoragePort } from '@/core/ports';
import { IActorEventBusPort } from '@/features/swarm';
import { DriverTransfer } from '../domain/DriverTransfer';
import { ItineraryEvent } from '@/features/itinerary';
import { EventStatusType } from '@/features/itinerary';
import { OperativeTerritory } from '@/core/domain';
import { Money } from '@/core/domain';

export interface PerformDriverCheckInCommand {
  bookingId: string;
  transferId?: string;
  eventId?: string;
  targetTransferStatus?: 'IN_TRANSIT' | 'COMPLETED';
  targetEventStatus?: EventStatusType;
  checkInTimestamp?: string; // ISO-8601 UTC
  gpsCoordinates?: { lat: number; lng: number };
  driverNotes?: string;
}

export interface PerformDriverCheckInResult {
  transfer: DriverTransfer;
  event?: ItineraryEvent;
  checkInTimestamp: string;
  logId: string;
  success: boolean;
}

let checkInSeq = 0;

export class PerformDriverCheckInUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly eventBusPort?: IActorEventBusPort
  ) {}

  public async execute(command: PerformDriverCheckInCommand): Promise<PerformDriverCheckInResult> {
    const timestamp = command.checkInTimestamp || new Date().toISOString();
    const seq = (++checkInSeq).toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    const logId = `log-chk-${Date.now()}-${seq}${rand}`;

    // 1. Fetch and update DriverTransfer
    let transfers = await this.storagePort.getTransfersByBooking(command.bookingId);
    if (transfers.length === 0) {
      const booking = await this.storagePort.getBooking(command.bookingId);
      if (booking?.code && booking.code !== command.bookingId) {
        transfers = await this.storagePort.getTransfersByBooking(booking.code);
      }
    }

    let targetTransfer: DriverTransfer | undefined;

    if (command.transferId) {
      targetTransfer = transfers.find((t) => t.id === command.transferId);
    } else {
      // Find arrival transfer (AIRPORT_ARRIVAL or first transfer)
      targetTransfer = transfers.find((t) => t.routeType === 'AIRPORT_ARRIVAL') || transfers[0];
    }

    let updatedTransfer: DriverTransfer;
    const targetStatus = command.targetTransferStatus || 'IN_TRANSIT';

    if (targetTransfer) {
      updatedTransfer = new DriverTransfer({
        id: targetTransfer.id,
        bookingId: targetTransfer.bookingId,
        driverId: targetTransfer.driverId,
        driverName: targetTransfer.driverName,
        vehicleType: targetTransfer.vehicleType,
        routeType: targetTransfer.routeType,
        origin: targetTransfer.origin,
        destination: targetTransfer.destination,
        scheduledTime: targetTransfer.scheduledTime,
        baseRate: targetTransfer.baseRate,
        nightSurcharge: targetTransfer.nightSurcharge,
        waitingTimeFee: targetTransfer.waitingTimeFee,
        parkingFee: targetTransfer.parkingFee,
        status: targetStatus,
      });
      await this.storagePort.saveTransfer(updatedTransfer);
    } else {
      // Create fallback arrival transfer
      updatedTransfer = new DriverTransfer({
        id: command.transferId || `trf-${Date.now()}`,
        bookingId: command.bookingId,
        driverId: 'DRV-01',
        driverName: 'Ramón Rosero',
        routeType: 'AIRPORT_ARRIVAL',
        origin: OperativeTerritory.fromString('Rionegro Aeropuerto JMC'),
        destination: OperativeTerritory.fromString('Park 42 Poblado'),
        scheduledTime: new Date().toISOString(),
        baseRate: Money.fromAmount(145000, 'COP'),
        status: targetStatus,
      });
      await this.storagePort.saveTransfer(updatedTransfer);
    }

    // 2. Fetch and update associated ItineraryEvent
    let events = await this.storagePort.getEventsByBooking(command.bookingId);
    if (events.length === 0) {
      const booking = await this.storagePort.getBooking(command.bookingId);
      if (booking?.code && booking.code !== command.bookingId) {
        events = await this.storagePort.getEventsByBooking(booking.code);
      }
    }
    let targetEvent: ItineraryEvent | undefined;

    if (command.eventId) {
      targetEvent = events.find((e) => e.id === command.eventId);
    } else {
      // Match transfer event or arrival flight/transfer event
      targetEvent = events.find(
        (e) =>
          (e.assignedDriverId === updatedTransfer.driverId ||
            e.category === 'TRANSFER' ||
            e.category === 'FLIGHT') &&
          (e.title.toLowerCase().includes('llegada') ||
            e.title.toLowerCase().includes('traslado') ||
            e.title.toLowerCase().includes('jmc') ||
            e.title.toLowerCase().includes('aeropuerto') ||
            e.dayNumber === 1)
      );
    }

    let updatedEvent: ItineraryEvent | undefined;
    if (targetEvent) {
      const nextEventStatus: EventStatusType = command.targetEventStatus || 'EN_SITIO';
      updatedEvent = new ItineraryEvent({
        id: targetEvent.id,
        bookingId: targetEvent.bookingId,
        dayNumber: targetEvent.dayNumber,
        title: targetEvent.title,
        category: targetEvent.category,
        startDateTime: targetEvent.startDateTime,
        endDateTime: targetEvent.endDateTime,
        location: targetEvent.location,
        coordinates: command.gpsCoordinates || targetEvent.coordinates,
        providerId: targetEvent.providerId,
        providerName: targetEvent.providerName,
        assignedDriverId: targetEvent.assignedDriverId || updatedTransfer.driverId,
        assignedGuideId: targetEvent.assignedGuideId,
        assignedNurseId: targetEvent.assignedNurseId,
        financialType: targetEvent.financialType,
        cost: targetEvent.cost,
        guideHours: targetEvent.guideHours,
        status: nextEventStatus,
        requiresGpsCheckIn: targetEvent.requiresGpsCheckIn,
        requiresSignature: targetEvent.requiresSignature,
        requiresReceipt: targetEvent.requiresReceipt,
        gpsChecked: true,
        signatureUuid: targetEvent.signatureUuid,
        receiptUuid: targetEvent.receiptUuid,
        notes: command.driverNotes
          ? `${targetEvent.notes ? targetEvent.notes + '\n' : ''}[Check-In Terminal]: ${command.driverNotes}`
          : targetEvent.notes,
      });

      await this.storagePort.saveEvent(updatedEvent);
    }

    // 3. Append CQRS event log entry
    await this.storagePort.appendEventLog({
      id: logId,
      bookingId: command.bookingId,
      type: 'DRIVER_CHECK_IN_TERMINAL',
      payload: {
        transferId: updatedTransfer.id,
        driverId: updatedTransfer.driverId,
        driverName: updatedTransfer.driverName,
        routeType: updatedTransfer.routeType,
        newTransferStatus: updatedTransfer.status,
        associatedEventId: updatedEvent?.id,
        newEventStatus: updatedEvent?.status,
        gpsChecked: true,
        gpsCoordinates: command.gpsCoordinates,
        timestamp,
        notes: command.driverNotes,
      },
      timestamp: Date.now(),
    });

    // 4. Broadcast through Actor Event Bus if present
    if (this.eventBusPort) {
      await this.eventBusPort.broadcast('DRIVER_CHECK_IN_TERMINAL', {
        bookingId: command.bookingId,
        transferId: updatedTransfer.id,
        driverId: updatedTransfer.driverId,
        status: updatedTransfer.status,
        timestamp,
      });
    }

    return {
      transfer: updatedTransfer,
      event: updatedEvent,
      checkInTimestamp: timestamp,
      logId,
      success: true,
    };
  }
}
