import { DomainError, InvalidStateTransitionError } from '../errors/domain-error.js';
import { LocationCoordinate } from '../value-objects/location-coordinate.js';
import { OperativeTerritory } from '../value-objects/operative-territory.js';

export const ITINERARY_STATUSES = Object.freeze([
  'PROGRAMADO',
  'EN_CAMINO',
  'EN_SITIO',
  'COMPLETADO',
  'CANCELADO'
]);

/**
 * ItineraryItem Entity.
 * Represents an individual medical appointment, transfer, surgery, or escort task on the patient's schedule.
 * Enforces strict FSM state transitions and field validation guards.
 */
export class ItineraryItem {
  /** @type {string} */
  #id;
  /** @type {number} */
  #dayNumber;
  /** @type {string} */
  #date;
  /** @type {string} */
  #timeWindow;
  /** @type {string} */
  #title;
  /** @type {string} */
  #description;
  /** @type {string} */
  #specialty;
  /** @type {string} */
  #clinicName;
  /** @type {LocationCoordinate} */
  #location;
  /** @type {'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'} */
  #status;
  /** @type {string[]} */
  #assignedActorIds;
  /** @type {boolean} */
  #requiresGpsCheckIn;
  /** @type {boolean} */
  #requiresSignature;
  /** @type {boolean} */
  #requiresReceipt;
  /** @type {string | null} */
  #transitStartedAt;
  /** @type {string | null} */
  #checkInTimestamp;
  /** @type {string | null} */
  #completionTimestamp;
  /** @type {string | null} */
  #signatureBlobId;
  /** @type {string | null} */
  #cancellationReason;

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {number} params.dayNumber
   * @param {string} params.date
   * @param {string} params.timeWindow - e.g. "08:00 - 10:00"
   * @param {string} params.title
   * @param {string} [params.description='']
   * @param {string} [params.specialty='']
   * @param {string} [params.clinicName='']
   * @param {LocationCoordinate | { lat: number, lng: number, name?: string, address?: string, geofenceRadiusMeters?: number }} params.location
   * @param {'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'} [params.status='PROGRAMADO']
   * @param {string[]} [params.assignedActorIds=[]]
   * @param {boolean} [params.requiresGpsCheckIn=false]
   * @param {boolean} [params.requiresSignature=false]
   * @param {boolean} [params.requiresReceipt=false]
   * @param {string} [params.checkInTimestamp=null]
   * @param {string} [params.completionTimestamp=null]
   * @param {string} [params.signatureBlobId=null]
   * @param {string} [params.cancellationReason=null]
   */
  constructor({
    id,
    dayNumber,
    date,
    timeWindow,
    title,
    description = '',
    specialty = '',
    clinicName = '',
    location,
    status = 'PROGRAMADO',
    assignedActorIds = [],
    requiresGpsCheckIn = false,
    requiresSignature = false,
    requiresReceipt = false,
    checkInTimestamp = null,
    completionTimestamp = null,
    signatureBlobId = null,
    cancellationReason = null
  } = {}) {
    if (!id || typeof id !== 'string') {
      throw new DomainError('[Itinerario Inválido] id es obligatorio.');
    }
    if (dayNumber === undefined || dayNumber === null || Number(dayNumber) < 1) {
      throw new DomainError('[Itinerario Inválido] dayNumber debe ser un entero >= 1.');
    }
    if (!title || typeof title !== 'string') {
      throw new DomainError('[Itinerario Inválido] title es obligatorio.');
    }

    const normStatus = String(status || 'PROGRAMADO').toUpperCase();
    if (!ITINERARY_STATUSES.includes(normStatus)) {
      throw new DomainError(
        `[Itinerario Inválido] Estado '${status}' no válido. Permitidos: ${ITINERARY_STATUSES.join(', ')}`
      );
    }

    const parsedLocation = location instanceof LocationCoordinate ? location : new LocationCoordinate(location || { lat: 6.2442, lng: -75.5812 });

    // Validate geospatial invariant for itinerary location
    if (parsedLocation.lat && parsedLocation.lng) {
      if (!OperativeTerritory.isWithinCorridor(parsedLocation.lat, parsedLocation.lng)) {
        throw new DomainError(
          `[Violación de Invariante Geoespacial] Zona no operativa para el punto de itinerario: (${parsedLocation.lat}, ${parsedLocation.lng})`
        );
      }
    }

    this.#id = id;
    this.#dayNumber = Number(dayNumber);
    this.#date = date || new Date().toISOString().split('T')[0];
    this.#timeWindow = timeWindow || '08:00 - 10:00';
    this.#title = title.trim();
    this.#description = description.trim();
    this.#specialty = specialty.trim();
    this.#clinicName = clinicName.trim();
    this.#location = parsedLocation;
    this.#status = /** @type {'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'} */ (normStatus);
    this.#assignedActorIds = Array.isArray(assignedActorIds) ? [...assignedActorIds] : [];
    this.#requiresGpsCheckIn = Boolean(requiresGpsCheckIn);
    this.#requiresSignature = Boolean(requiresSignature);
    this.#requiresReceipt = Boolean(requiresReceipt);
    this.#checkInTimestamp = checkInTimestamp;
    this.#completionTimestamp = completionTimestamp;
    this.#signatureBlobId = signatureBlobId;
    this.#cancellationReason = cancellationReason;
  }

  get id() {
    return this.#id;
  }

  get dayNumber() {
    return this.#dayNumber;
  }

  get date() {
    return this.#date;
  }

  get timeWindow() {
    return this.#timeWindow;
  }

  get title() {
    return this.#title;
  }

  get description() {
    return this.#description;
  }

  get specialty() {
    return this.#specialty;
  }

  get clinicName() {
    return this.#clinicName;
  }

  get location() {
    return this.#location;
  }

  get status() {
    return this.#status;
  }

  get assignedActorIds() {
    return [...this.#assignedActorIds];
  }

  get requiresGpsCheckIn() {
    return this.#requiresGpsCheckIn;
  }

  get requiresSignature() {
    return this.#requiresSignature;
  }

  get requiresReceipt() {
    return this.#requiresReceipt;
  }

  get transitStartedAt() {
    return this.#transitStartedAt;
  }

  get checkInTimestamp() {
    return this.#checkInTimestamp;
  }

  get completionTimestamp() {
    return this.#completionTimestamp;
  }

  get signatureBlobId() {
    return this.#signatureBlobId;
  }

  get cancellationReason() {
    return this.#cancellationReason;
  }

  /**
   * FSM Transition Guard: PROGRAMADO -> EN_CAMINO
   * @param {string} [timestamp]
   */
  startTransit(timestamp) {
    if (this.#status === 'COMPLETADO' || this.#status === 'CANCELADO') {
      throw new InvalidStateTransitionError(this.#status, 'EN_CAMINO', 'La cita ya fue cerrada.');
    }
    this.#status = 'EN_CAMINO';
    this.#transitStartedAt = timestamp || new Date().toISOString();
  }

  /**
   * FSM Transition Guard: EN_CAMINO | PROGRAMADO -> EN_SITIO
   * Validates GPS geofence if required.
   * @param {object} [options]
   * @param {{ lat: number, lng: number }} [options.coords]
   * @param {string} [options.timestamp]
   */
  arriveOnSite(options = {}) {
    if (this.#status === 'COMPLETADO' || this.#status === 'CANCELADO') {
      throw new InvalidStateTransitionError(this.#status, 'EN_SITIO', 'La cita ya fue finalizada.');
    }

    if (this.#requiresGpsCheckIn && options.coords) {
      const isInside = this.#location.isWithinGeofence(options.coords);
      if (!isInside) {
        const dist = Math.round(this.#location.distanceTo(options.coords));
        throw new DomainError(
          `[Guardia de Check-In GPS] El actor está a ${dist}m de la clínica (Radio permitido: ${this.#location.geofenceRadiusMeters}m).`
        );
      }
    }

    this.#status = 'EN_SITIO';
    this.#checkInTimestamp = options.timestamp || new Date().toISOString();
  }

  /**
   * Attaches patient signature blob ID.
   * @param {string} blobId
   */
  attachSignature(blobId) {
    if (!blobId || typeof blobId !== 'string') {
      throw new DomainError('[Firma Inválida] blobId es obligatorio.');
    }
    this.#signatureBlobId = blobId;
  }

  /**
   * FSM Transition Guard: EN_SITIO -> COMPLETADO
   * Validates patient digital signature guard if required.
   * @param {object} [options]
   * @param {string} [options.signatureBlobId]
   * @param {string} [options.timestamp]
   */
  complete(options = {}) {
    if (this.#status === 'CANCELADO') {
      throw new InvalidStateTransitionError(this.#status, 'COMPLETADO', 'La cita está cancelada.');
    }

    const signatureId = options.signatureBlobId || this.#signatureBlobId;
    if (this.#requiresSignature && !signatureId) {
      throw new DomainError(
        '[Guardia de Firma] Se requiere la firma digital del paciente para completar este hito.'
      );
    }

    if (options.signatureBlobId) {
      this.#signatureBlobId = options.signatureBlobId;
    }

    this.#status = 'COMPLETADO';
    this.#completionTimestamp = options.timestamp || new Date().toISOString();
  }

  /**
   * Cancels itinerary item.
   * @param {string} [reason]
   */
  cancel(reason) {
    if (this.#status === 'COMPLETADO') {
      throw new InvalidStateTransitionError(this.#status, 'CANCELADO', 'No se puede cancelar una cita completada.');
    }
    this.#status = 'CANCELADO';
    this.#cancellationReason = reason || 'Cancelado por el operador.';
  }

  /**
   * General transition dispatcher with guard enforcement.
   * @param {'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'} newStatus
   * @param {object} [context={}]
   */
  transitionTo(newStatus, context = {}) {
    const target = String(newStatus).toUpperCase();
    switch (target) {
      case 'PROGRAMADO':
        this.#status = 'PROGRAMADO';
        break;
      case 'EN_CAMINO':
        this.startTransit(context.timestamp);
        break;
      case 'EN_SITIO':
        this.arriveOnSite(context);
        break;
      case 'COMPLETADO':
        this.complete(context);
        break;
      case 'CANCELADO':
        this.cancel(context.reason);
        break;
      default:
        throw new InvalidStateTransitionError(this.#status, newStatus, 'Estado desconocido.');
    }
  }

  toJSON() {
    return {
      id: this.#id,
      dayNumber: this.#dayNumber,
      date: this.#date,
      timeWindow: this.#timeWindow,
      title: this.#title,
      description: this.#description,
      specialty: this.#specialty,
      clinicName: this.#clinicName,
      location: this.#location.toJSON(),
      status: this.#status,
      assignedActorIds: this.assignedActorIds,
      requiresGpsCheckIn: this.#requiresGpsCheckIn,
      requiresSignature: this.#requiresSignature,
      requiresReceipt: this.#requiresReceipt,
      transitStartedAt: this.#transitStartedAt,
      checkInTimestamp: this.#checkInTimestamp,
      completionTimestamp: this.#completionTimestamp,
      signatureBlobId: this.#signatureBlobId,
      cancellationReason: this.#cancellationReason
    };
  }
}
