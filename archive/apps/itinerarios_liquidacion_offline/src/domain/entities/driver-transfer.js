import { DomainError } from '../errors/domain-error.js';
import { Money } from '../value-objects/money.js';
import { LocationCoordinate } from '../value-objects/location-coordinate.js';
import { OperativeTerritory } from '../value-objects/operative-territory.js';

export const DRIVER_TRANSFER_STATUSES = Object.freeze([
  'ASSIGNED',
  'EN_CAMINO',
  'EN_SITIO',
  'COMPLETED',
  'CANCELLED'
]);

/**
 * DriverTransfer Entity.
 * Represents a ground transportation transfer executed by a designated driver (e.g. Ramón Rosero).
 */
export class DriverTransfer {
  /** @type {string} */
  #id;
  /** @type {string} */
  #driverActorId;
  /** @type {string | null} */
  #itineraryItemId;
  /** @type {LocationCoordinate} */
  #origin;
  /** @type {LocationCoordinate} */
  #destination;
  /** @type {Money} */
  #flatRate;
  /** @type {Money} */
  #surcharge;
  /** @type {Money} */
  #totalCost;
  /** @type {'ASSIGNED' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETED' | 'CANCELLED'} */
  #status;
  /** @type {string | null} */
  #startedAt;
  /** @type {string | null} */
  #completedAt;

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.driverActorId
   * @param {string} [params.itineraryItemId=null]
   * @param {LocationCoordinate | { lat: number, lng: number, name?: string, address?: string }} params.origin
   * @param {LocationCoordinate | { lat: number, lng: number, name?: string, address?: string }} params.destination
   * @param {Money | { amountInCents: bigint | number, currency?: 'COP' | 'USD' }} params.flatRate
   * @param {Money | { amountInCents: bigint | number, currency?: 'COP' | 'USD' }} [params.surcharge]
   * @param {'ASSIGNED' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETED' | 'CANCELLED'} [params.status='ASSIGNED']
   * @param {string} [params.startedAt=null]
   * @param {string} [params.completedAt=null]
   */
  constructor({
    id,
    driverActorId,
    itineraryItemId = null,
    origin,
    destination,
    flatRate,
    surcharge = null,
    status = 'ASSIGNED',
    startedAt = null,
    completedAt = null
  } = {}) {
    if (!id || typeof id !== 'string') {
      throw new DomainError('[Traslado Conductor] id es obligatorio.');
    }
    if (!driverActorId || typeof driverActorId !== 'string') {
      throw new DomainError('[Traslado Conductor] driverActorId es obligatorio.');
    }

    const normStatus = String(status || 'ASSIGNED').toUpperCase();
    if (!DRIVER_TRANSFER_STATUSES.includes(normStatus)) {
      throw new DomainError(
        `[Traslado Inválido] Estado '${status}' no válido. Permitidos: ${DRIVER_TRANSFER_STATUSES.join(', ')}`
      );
    }

    const parsedOrigin = origin instanceof LocationCoordinate ? origin : new LocationCoordinate(origin);
    const parsedDestination = destination instanceof LocationCoordinate ? destination : new LocationCoordinate(destination);

    // Verify geoespacial corridor invariant for origin and destination
    if (parsedOrigin.lat && parsedOrigin.lng) {
      if (!OperativeTerritory.isWithinCorridor(parsedOrigin.lat, parsedOrigin.lng)) {
        throw new DomainError(
          `[Violación de Invariante Geoespacial] Zona no operativa en origen: (${parsedOrigin.lat}, ${parsedOrigin.lng})`
        );
      }
    }
    if (parsedDestination.lat && parsedDestination.lng) {
      if (!OperativeTerritory.isWithinCorridor(parsedDestination.lat, parsedDestination.lng)) {
        throw new DomainError(
          `[Violación de Invariante Geoespacial] Zona no operativa en destino: (${parsedDestination.lat}, ${parsedDestination.lng})`
        );
      }
    }

    let parsedFlatRate;
    if (flatRate instanceof Money) {
      parsedFlatRate = flatRate;
    } else if (flatRate && typeof flatRate === 'object' && flatRate.amountInCents !== undefined) {
      parsedFlatRate = new Money(flatRate.amountInCents, flatRate.currency || 'COP');
    } else if (flatRate !== undefined && flatRate !== null) {
      parsedFlatRate = Money.fromAmount(flatRate);
    } else {
      throw new DomainError('[Traslado Conductor] flatRate debe ser un Money válido.');
    }

    let parsedSurcharge;
    if (surcharge instanceof Money) {
      parsedSurcharge = surcharge;
    } else if (surcharge && typeof surcharge === 'object' && surcharge.amountInCents !== undefined) {
      parsedSurcharge = new Money(surcharge.amountInCents, surcharge.currency || parsedFlatRate.currency);
    } else if (surcharge !== undefined && surcharge !== null) {
      parsedSurcharge = Money.fromAmount(surcharge, parsedFlatRate.currency);
    } else {
      parsedSurcharge = Money.zero(parsedFlatRate.currency);
    }

    this.#id = id;
    this.#driverActorId = driverActorId;
    this.#itineraryItemId = itineraryItemId;
    this.#origin = parsedOrigin;
    this.#destination = parsedDestination;
    this.#flatRate = parsedFlatRate;
    this.#surcharge = parsedSurcharge;
    this.#totalCost = parsedFlatRate.add(parsedSurcharge);
    this.#status = /** @type {'ASSIGNED' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETED' | 'CANCELLED'} */ (normStatus);
    this.#startedAt = startedAt;
    this.#completedAt = completedAt;
  }

  get id() {
    return this.#id;
  }

  get driverActorId() {
    return this.#driverActorId;
  }

  get itineraryItemId() {
    return this.#itineraryItemId;
  }

  get origin() {
    return this.#origin;
  }

  get destination() {
    return this.#destination;
  }

  get flatRate() {
    return this.#flatRate;
  }

  get surcharge() {
    return this.#surcharge;
  }

  get totalCost() {
    return this.#totalCost;
  }

  get status() {
    return this.#status;
  }

  get startedAt() {
    return this.#startedAt;
  }

  get completedAt() {
    return this.#completedAt;
  }

  /**
   * Approximate route distance in meters.
   * @returns {number}
   */
  get estimatedDistanceMeters() {
    return this.#origin.distanceTo(this.#destination);
  }

  /**
   * Applies an additional surcharge (e.g. night fee or waiting time).
   * @param {Money} additionalSurcharge
   */
  addSurcharge(additionalSurcharge) {
    this.#surcharge = this.#surcharge.add(additionalSurcharge);
    this.#totalCost = this.#flatRate.add(this.#surcharge);
  }

  startTransit(timestamp) {
    this.#status = 'EN_CAMINO';
    this.#startedAt = timestamp || new Date().toISOString();
  }

  arriveOnSite() {
    this.#status = 'EN_SITIO';
  }

  completeTransfer(timestamp) {
    this.#status = 'COMPLETED';
    this.#completedAt = timestamp || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.#id,
      driverActorId: this.#driverActorId,
      itineraryItemId: this.#itineraryItemId,
      origin: this.#origin.toJSON(),
      destination: this.#destination.toJSON(),
      flatRate: this.#flatRate.toJSON(),
      surcharge: this.#surcharge.toJSON(),
      totalCost: this.#totalCost.toJSON(),
      status: this.#status,
      startedAt: this.#startedAt,
      completedAt: this.#completedAt,
      estimatedDistanceMeters: this.estimatedDistanceMeters
    };
  }
}
