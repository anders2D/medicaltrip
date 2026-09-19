import { Money } from '../values/Money';
import { OperativeTerritory } from '../values/OperativeTerritory';
import { Coordinates } from '../values/Coordinates';
import {
  InvalidMilestoneTransitionError,
  InvariantViolationError,
} from '../errors/DomainErrors';

export type MilestoneCategory =
  | 'FLIGHT'
  | 'CLINICAL'
  | 'LAB'
  | 'PHARMACY'
  | 'HOTEL';

export type MilestoneStatus =
  | 'PROGRAMADO'
  | 'EN_CAMINO'
  | 'EN_SITIO'
  | 'COMPLETADO'
  | 'CANCELADO';

export type MilestoneFinancialType =
  | 'OUT_OF_POCKET'
  | 'GUIDE_FEE'
  | 'FLEET_TAXI'
  | 'INCLUDED'
  | 'NONE';

export interface ItineraryMilestoneProps {
  id: string;
  reservaId: string;
  dayNumber: number;
  title: string;
  category: MilestoneCategory;
  startDateTime: Date | string;
  endDateTime?: Date | string;
  location: OperativeTerritory | string;
  coordinates?: Coordinates | { latitude: number; longitude: number };
  providerId?: string;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  financialType?: MilestoneFinancialType;
  cost?: Money | { amountInCents: bigint | number | string; currency: 'COP' | 'USD' };
  guideHours?: number;
  status?: MilestoneStatus;
  notes?: string;
  requiresGpsCheckIn?: boolean;
  requiresSignature?: boolean;
  requiresReceipt?: boolean;
  gpsChecked?: boolean;
  gpsCheckInTime?: Date | string;
  signatureUuid?: string;
  receiptUuid?: string;
}

/**
 * ItineraryMilestone Entity
 * Specific actionable milestone in the daily patient journey.
 */
export class ItineraryMilestone {
  readonly id: string;
  readonly reservaId: string;
  readonly dayNumber: number;
  readonly title: string;
  readonly category: MilestoneCategory;
  readonly startDateTime: Date;
  readonly endDateTime: Date;
  readonly location: OperativeTerritory;
  readonly coordinates?: Coordinates;
  readonly providerId?: string;
  readonly providerName?: string;
  readonly assignedDriverId?: string;
  readonly assignedGuideId?: string;
  readonly assignedNurseId?: string;
  readonly financialType: MilestoneFinancialType;
  readonly cost: Money;
  readonly guideHours: number;
  readonly status: MilestoneStatus;
  readonly notes?: string;
  readonly requiresGpsCheckIn: boolean;
  readonly requiresSignature: boolean;
  readonly requiresReceipt: boolean;
  readonly gpsChecked: boolean;
  readonly gpsCheckInTime?: Date;
  readonly signatureUuid?: string;
  readonly receiptUuid?: string;

  constructor(props: ItineraryMilestoneProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Hito de Itinerario]: ID es obligatorio.');
    }
    if (!props.reservaId || !props.reservaId.trim()) {
      throw new InvariantViolationError('[Hito de Itinerario]: reservaId es obligatorio.');
    }
    if (!props.title || !props.title.trim()) {
      throw new InvariantViolationError('[Hito de Itinerario]: Título es obligatorio.');
    }

    const start = new Date(props.startDateTime);
    if (isNaN(start.getTime())) {
      throw new InvariantViolationError('[Hito de Itinerario]: startDateTime no es una fecha válida.');
    }

    let end: Date;
    if (props.endDateTime) {
      end = new Date(props.endDateTime);
      if (isNaN(end.getTime())) {
        throw new InvariantViolationError('[Hito de Itinerario]: endDateTime no es una fecha válida.');
      }
      if (end.getTime() < start.getTime()) {
        throw new InvariantViolationError('[Hito de Itinerario]: endDateTime no puede ser anterior a startDateTime.');
      }
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
    }

    this.id = props.id.trim();
    this.reservaId = props.reservaId.trim();
    this.dayNumber = Math.max(1, Number(props.dayNumber) || 1);
    this.title = props.title.trim();
    this.category = props.category || 'CLINICAL';
    this.startDateTime = start;
    this.endDateTime = end;

    this.location =
      props.location instanceof OperativeTerritory
        ? props.location
        : new OperativeTerritory(props.location);

    if (props.coordinates) {
      this.coordinates =
        props.coordinates instanceof Coordinates
          ? props.coordinates
          : new Coordinates(props.coordinates.latitude, props.coordinates.longitude);
    }

    this.providerId = props.providerId;
    this.providerName = props.providerName;
    this.assignedDriverId = props.assignedDriverId;
    this.assignedGuideId = props.assignedGuideId;
    this.assignedNurseId = props.assignedNurseId;
    this.financialType = props.financialType || 'NONE';

    if (props.cost instanceof Money) {
      this.cost = props.cost;
    } else if (props.cost && typeof props.cost === 'object') {
      this.cost = Money.fromCents(props.cost.amountInCents, props.cost.currency);
    } else {
      this.cost = Money.zero('COP');
    }

    this.guideHours = Number(props.guideHours) || 0;
    this.status = props.status || 'PROGRAMADO';
    this.notes = props.notes;
    this.requiresGpsCheckIn = Boolean(props.requiresGpsCheckIn);
    this.requiresSignature = Boolean(props.requiresSignature);
    this.requiresReceipt = Boolean(props.requiresReceipt);
    this.gpsChecked = Boolean(props.gpsChecked);
    this.gpsCheckInTime = props.gpsCheckInTime ? new Date(props.gpsCheckInTime) : undefined;
    this.signatureUuid = props.signatureUuid;
    this.receiptUuid = props.receiptUuid;

    Object.freeze(this);
  }

  get durationMinutes(): number {
    return Math.round((this.endDateTime.getTime() - this.startDateTime.getTime()) / (1000 * 60));
  }

  get durationHours(): number {
    return this.durationMinutes / 60;
  }

  /**
   * Reschedules the milestone with new start and end timestamps.
   */
  reschedule(newStart: Date | string, newEnd?: Date | string): ItineraryMilestone {
    const start = new Date(newStart);
    let end: Date;
    if (newEnd) {
      end = new Date(newEnd);
    } else {
      end = new Date(start.getTime() + this.durationMinutes * 60 * 1000);
    }

    return new ItineraryMilestone({
      ...this.toJSON(),
      startDateTime: start,
      endDateTime: end,
      location: this.location,
      cost: this.cost,
    });
  }

  /**
   * State Machine Transition: PROGRAMADO -> EN_CAMINO
   */
  startTransit(): ItineraryMilestone {
    if (this.status !== 'PROGRAMADO') {
      throw new InvalidMilestoneTransitionError(this.status, 'EN_CAMINO');
    }
    return new ItineraryMilestone({
      ...this.toJSON(),
      status: 'EN_CAMINO',
      location: this.location,
      cost: this.cost,
    });
  }

  /**
   * State Machine Transition: EN_CAMINO / PROGRAMADO -> EN_SITIO
   */
  arriveOnSite(coords?: Coordinates): ItineraryMilestone {
    if (this.status !== 'PROGRAMADO' && this.status !== 'EN_CAMINO') {
      throw new InvalidMilestoneTransitionError(this.status, 'EN_SITIO');
    }

    return new ItineraryMilestone({
      ...this.toJSON(),
      status: 'EN_SITIO',
      gpsChecked: true,
      gpsCheckInTime: new Date(),
      coordinates: coords || this.coordinates,
      location: this.location,
      cost: this.cost,
    });
  }

  /**
   * State Machine Transition: EN_SITIO / EN_CAMINO / PROGRAMADO -> COMPLETADO
   */
  complete(options: { coords?: Coordinates; signatureUuid?: string; receiptUuid?: string } = {}): ItineraryMilestone {
    if (this.status === 'COMPLETADO' || this.status === 'CANCELADO') {
      throw new InvalidMilestoneTransitionError(this.status, 'COMPLETADO');
    }

    return new ItineraryMilestone({
      ...this.toJSON(),
      status: 'COMPLETADO',
      gpsChecked: options.coords ? true : this.gpsChecked,
      gpsCheckInTime: options.coords ? new Date() : this.gpsCheckInTime,
      coordinates: options.coords || this.coordinates,
      signatureUuid: options.signatureUuid || this.signatureUuid,
      receiptUuid: options.receiptUuid || this.receiptUuid,
      location: this.location,
      cost: this.cost,
    });
  }

  /**
   * Cancels the milestone.
   */
  cancel(): ItineraryMilestone {
    if (this.status === 'COMPLETADO') {
      throw new InvalidMilestoneTransitionError(this.status, 'CANCELADO', 'No se puede cancelar un hito ya completado.');
    }
    return new ItineraryMilestone({
      ...this.toJSON(),
      status: 'CANCELADO',
      location: this.location,
      cost: this.cost,
    });
  }

  /**
   * Attaches an expense receipt to the milestone.
   */
  attachReceipt(receiptUuid: string, updatedCost?: Money): ItineraryMilestone {
    return new ItineraryMilestone({
      ...this.toJSON(),
      receiptUuid,
      cost: updatedCost || this.cost,
      location: this.location,
    });
  }

  toJSON(): ItineraryMilestoneProps {
    return {
      id: this.id,
      reservaId: this.reservaId,
      dayNumber: this.dayNumber,
      title: this.title,
      category: this.category,
      startDateTime: this.startDateTime.toISOString(),
      endDateTime: this.endDateTime.toISOString(),
      location: this.location.toJSON().rawName,
      coordinates: this.coordinates ? this.coordinates.toJSON() : undefined,
      providerId: this.providerId,
      providerName: this.providerName,
      assignedDriverId: this.assignedDriverId,
      assignedGuideId: this.assignedGuideId,
      assignedNurseId: this.assignedNurseId,
      financialType: this.financialType,
      cost: this.cost.toJSON(),
      guideHours: this.guideHours,
      status: this.status,
      notes: this.notes,
      requiresGpsCheckIn: this.requiresGpsCheckIn,
      requiresSignature: this.requiresSignature,
      requiresReceipt: this.requiresReceipt,
      gpsChecked: this.gpsChecked,
      gpsCheckInTime: this.gpsCheckInTime ? this.gpsCheckInTime.toISOString() : undefined,
      signatureUuid: this.signatureUuid,
      receiptUuid: this.receiptUuid,
    };
  }
}
