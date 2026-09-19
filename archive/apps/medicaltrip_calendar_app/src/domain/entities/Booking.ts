import { InvalidBookingError, InvariantViolationError } from '../errors/DomainErrors';

export type BookingStatus = 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';

export interface BookingProps {
  id: string;
  code: string; // e.g. "RVA171-4", "CTZ282-3"
  patientId: string;
  paxCount: number; // 1 to 5 pax
  arrivalDate: Date | string;
  departureDate: Date | string;
  arrivalAirline?: string;
  arrivalFlight?: string;
  hotelId?: string;
  hotelName?: string;
  status?: BookingStatus;
  checkMigIn?: boolean;
  checkMigOut?: boolean;
  notes?: string;
}

/**
 * Booking Entity (RVA / CTZ)
 * Master operational case and reservation dossier.
 */
export class Booking {
  readonly id: string;
  readonly code: string;
  readonly patientId: string;
  readonly paxCount: number;
  readonly arrivalDate: Date;
  readonly departureDate: Date;
  readonly arrivalAirline?: string;
  readonly arrivalFlight?: string;
  readonly hotelId?: string;
  readonly hotelName?: string;
  readonly status: BookingStatus;
  readonly checkMigIn: boolean;
  readonly checkMigOut: boolean;
  readonly notes?: string;

  constructor(props: BookingProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvalidBookingError('[Reserva]: ID es obligatorio.');
    }
    if (!props.code || !props.code.trim()) {
      throw new InvalidBookingError('[Reserva]: Código (RVA/CTZ) es obligatorio.');
    }
    if (!props.patientId || !props.patientId.trim()) {
      throw new InvalidBookingError('[Reserva]: patientId es obligatorio.');
    }

    const pax = Number(props.paxCount);
    if (!Number.isInteger(pax) || pax <= 0 || pax > 20) {
      throw new InvariantViolationError(`[Reserva]: paxCount debe ser un número entero positivo válido (1 a 20). Recibido: ${props.paxCount}`);
    }

    const arr = new Date(props.arrivalDate);
    const dep = new Date(props.departureDate);

    if (isNaN(arr.getTime()) || isNaN(dep.getTime())) {
      throw new InvalidBookingError('[Reserva]: Las fechas de llegada y salida deben ser válidas.');
    }

    if (dep.getTime() < arr.getTime()) {
      throw new InvariantViolationError('[Reserva]: La fecha de salida no puede ser anterior a la fecha de llegada.');
    }

    this.id = props.id.trim();
    this.code = props.code.trim();
    this.patientId = props.patientId.trim();
    this.paxCount = pax;
    this.arrivalDate = arr;
    this.departureDate = dep;
    this.arrivalAirline = props.arrivalAirline;
    this.arrivalFlight = props.arrivalFlight;
    this.hotelId = props.hotelId;
    this.hotelName = props.hotelName;
    this.status = props.status || 'PROGRAMADO';
    this.checkMigIn = Boolean(props.checkMigIn);
    this.checkMigOut = Boolean(props.checkMigOut);
    this.notes = props.notes;

    Object.freeze(this);
  }

  get durationDays(): number {
    const diffMs = this.departureDate.getTime() - this.arrivalDate.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      patientId: this.patientId,
      paxCount: this.paxCount,
      arrivalDate: this.arrivalDate.toISOString(),
      departureDate: this.departureDate.toISOString(),
      durationDays: this.durationDays,
      arrivalAirline: this.arrivalAirline,
      arrivalFlight: this.arrivalFlight,
      hotelId: this.hotelId,
      hotelName: this.hotelName,
      status: this.status,
      checkMigIn: this.checkMigIn,
      checkMigOut: this.checkMigOut,
      notes: this.notes,
    };
  }
}
