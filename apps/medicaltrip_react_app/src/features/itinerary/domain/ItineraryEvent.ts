import { Money } from '@/core/domain';
import { OperativeTerritory, GeoCoordinates } from '@/core/domain';
import { EventCategoryType } from './EventCategory';
import { EventStatus, EventStatusType } from './EventStatus';
import { InvariantViolationError } from '@/core/domain';

export type FinancialExpenseType = 'OUT_OF_POCKET' | 'GUIDE_FEE' | 'FLEET_TAXI' | 'COMMERCIAL_COMMISSION' | 'NONE';

export class ItineraryEvent {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly dayNumber: number;
  public readonly title: string;
  public readonly category: EventCategoryType;
  public readonly startDateTime: string; // ISO-8601 UTC
  public readonly endDateTime: string;   // ISO-8601 UTC
  public readonly location: OperativeTerritory;
  public readonly coordinates?: GeoCoordinates;
  public readonly providerId?: string;
  public readonly providerName?: string;
  public readonly assignedDriverId?: string;
  public readonly assignedGuideId?: string;
  public readonly assignedNurseId?: string;
  public readonly financialType: FinancialExpenseType;
  public readonly cost: Money;
  public readonly guideHours?: number;
  public readonly status: EventStatusType;
  public readonly requiresGpsCheckIn: boolean;
  public readonly requiresSignature: boolean;
  public readonly requiresReceipt: boolean;
  public readonly gpsChecked: boolean;
  public readonly signatureUuid?: string;
  public readonly receiptUuid?: string;
  public readonly notes: string;

  constructor(params: {
    id: string;
    bookingId: string;
    dayNumber: number;
    title: string;
    category: EventCategoryType;
    startDateTime: string;
    endDateTime: string;
    location: OperativeTerritory;
    coordinates?: GeoCoordinates;
    providerId?: string;
    providerName?: string;
    assignedDriverId?: string;
    assignedGuideId?: string;
    assignedNurseId?: string;
    financialType?: FinancialExpenseType;
    cost?: Money;
    guideHours?: number;
    status?: EventStatusType;
    requiresGpsCheckIn?: boolean;
    requiresSignature?: boolean;
    requiresReceipt?: boolean;
    gpsChecked?: boolean;
    signatureUuid?: string;
    receiptUuid?: string;
    notes?: string;
  }) {
    if (new Date(params.endDateTime) < new Date(params.startDateTime)) {
      throw new InvariantViolationError(`Event end time (${params.endDateTime}) cannot precede start time (${params.startDateTime})`);
    }

    this.id = params.id;
    this.bookingId = params.bookingId;
    this.dayNumber = params.dayNumber;
    this.title = params.title.trim();
    this.category = params.category;
    this.startDateTime = params.startDateTime;
    this.endDateTime = params.endDateTime;
    this.location = params.location;
    this.coordinates = params.coordinates || params.location.coordinates;
    this.providerId = params.providerId;
    this.providerName = params.providerName;
    this.assignedDriverId = params.assignedDriverId;
    this.assignedGuideId = params.assignedGuideId;
    this.assignedNurseId = params.assignedNurseId;
    this.financialType = params.financialType || 'NONE';
    this.cost = params.cost || Money.zero();
    this.guideHours = params.guideHours;
    this.status = params.status || 'PROGRAMADO';
    this.requiresGpsCheckIn = params.requiresGpsCheckIn || false;
    this.requiresSignature = params.requiresSignature || false;
    this.requiresReceipt = params.requiresReceipt || false;
    this.gpsChecked = params.gpsChecked || false;
    this.signatureUuid = params.signatureUuid;
    this.receiptUuid = params.receiptUuid;
    this.notes = params.notes || '';
    Object.freeze(this);
  }

  public get durationMinutes(): number {
    const diffMs = new Date(this.endDateTime).getTime() - new Date(this.startDateTime).getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  public get territory(): OperativeTerritory {
    return this.location;
  }

  public reschedule(newStartDateTime: string, newEndDateTime: string): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      startDateTime: newStartDateTime,
      endDateTime: newEndDateTime,
    });
  }

  public transitionStatus(nextStatus: EventStatusType): ItineraryEvent {
    EventStatus.assertTransition(this.status, nextStatus);
    return new ItineraryEvent({
      ...this,
      status: nextStatus,
    });
  }

  public checkInGps(): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      gpsChecked: true,
      status: this.status === 'PROGRAMADO' || this.status === 'EN_CAMINO' ? 'EN_SITIO' : this.status,
    });
  }

  public attachReceipt(receiptUuid: string): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      receiptUuid,
    });
  }

  public attachSignature(signatureUuid: string): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      signatureUuid,
      status: 'COMPLETADO',
    });
  }
}
