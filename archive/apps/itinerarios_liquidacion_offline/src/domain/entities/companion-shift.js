import { DomainError } from '../errors/domain-error.js';
import { Money } from '../value-objects/money.js';

export const COMPANION_SHIFT_STATUSES = Object.freeze([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

/**
 * CompanionShift Entity.
 * Represents a bilingual accompaniment shift performed by a guide/nurse.
 */
export class CompanionShift {
  /** @type {string} */
  #id;
  /** @type {string} */
  #guideActorId;
  /** @type {number} */
  #dayNumber;
  /** @type {string} */
  #startTime;
  /** @type {string | null} */
  #endTime;
  /** @type {number} */
  #totalHours;
  /** @type {Money} */
  #hourlyRate;
  /** @type {Money} */
  #mealSubsidy;
  /** @type {'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'} */
  #status;
  /** @type {Money} */
  #totalCost;

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.guideActorId
   * @param {number} params.dayNumber
   * @param {string} params.startTime - ISO string or time string e.g. "08:00"
   * @param {string} [params.endTime=null]
   * @param {number} [params.totalHours=0]
   * @param {Money | { amountInCents: bigint | number, currency?: 'COP' | 'USD' }} params.hourlyRate
   * @param {Money | { amountInCents: bigint | number, currency?: 'COP' | 'USD' }} [params.mealSubsidy]
   * @param {'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'} [params.status='SCHEDULED']
   * @param {Money} [params.totalCost]
   */
  constructor({
    id,
    guideActorId,
    dayNumber,
    startTime,
    endTime = null,
    totalHours = 0,
    hourlyRate,
    mealSubsidy = null,
    status = 'SCHEDULED',
    totalCost = null
  } = {}) {
    if (!id || typeof id !== 'string') {
      throw new DomainError('[Turno de Acompañamiento] id es obligatorio.');
    }
    if (!guideActorId || typeof guideActorId !== 'string') {
      throw new DomainError('[Turno de Acompañamiento] guideActorId es obligatorio.');
    }
    if (dayNumber === undefined || dayNumber === null || dayNumber < 1) {
      throw new DomainError('[Turno de Acompañamiento] dayNumber debe ser un entero >= 1.');
    }

    const normStatus = String(status || 'SCHEDULED').toUpperCase();
    if (!COMPANION_SHIFT_STATUSES.includes(normStatus)) {
      throw new DomainError(
        `[Turno Inválido] Estado '${status}' no válido. Permitidos: ${COMPANION_SHIFT_STATUSES.join(', ')}`
      );
    }

    let parsedHourlyRate;
    if (hourlyRate instanceof Money) {
      parsedHourlyRate = hourlyRate;
    } else if (hourlyRate && typeof hourlyRate === 'object' && hourlyRate.amountInCents !== undefined) {
      parsedHourlyRate = new Money(hourlyRate.amountInCents, hourlyRate.currency || 'COP');
    } else if (typeof hourlyRate === 'number' || typeof hourlyRate === 'string' || typeof hourlyRate === 'bigint') {
      parsedHourlyRate = Money.fromAmount(hourlyRate);
    } else {
      throw new DomainError('[Turno de Acompañamiento] hourlyRate debe ser un Money válido.');
    }

    let parsedMealSubsidy;
    if (mealSubsidy instanceof Money) {
      parsedMealSubsidy = mealSubsidy;
    } else if (mealSubsidy && typeof mealSubsidy === 'object' && mealSubsidy.amountInCents !== undefined) {
      parsedMealSubsidy = new Money(mealSubsidy.amountInCents, mealSubsidy.currency || parsedHourlyRate.currency);
    } else if (mealSubsidy !== null && mealSubsidy !== undefined) {
      parsedMealSubsidy = Money.fromAmount(mealSubsidy, parsedHourlyRate.currency);
    } else {
      parsedMealSubsidy = Money.zero(parsedHourlyRate.currency);
    }

    this.#id = id;
    this.#guideActorId = guideActorId;
    this.#dayNumber = Number(dayNumber);
    this.#startTime = startTime || new Date().toISOString();
    this.#endTime = endTime;
    this.#totalHours = Number(totalHours) || 0;
    this.#hourlyRate = parsedHourlyRate;
    this.#mealSubsidy = parsedMealSubsidy;
    this.#status = /** @type {'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'} */ (normStatus);

    if (totalCost instanceof Money) {
      this.#totalCost = totalCost;
    } else {
      this.#totalCost = this.computeTotalCost();
    }
  }

  get id() {
    return this.#id;
  }

  get guideActorId() {
    return this.#guideActorId;
  }

  get dayNumber() {
    return this.#dayNumber;
  }

  get startTime() {
    return this.#startTime;
  }

  get endTime() {
    return this.#endTime;
  }

  get totalHours() {
    return this.#totalHours;
  }

  get hourlyRate() {
    return this.#hourlyRate;
  }

  get mealSubsidy() {
    return this.#mealSubsidy;
  }

  get status() {
    return this.#status;
  }

  get totalCost() {
    return this.#totalCost;
  }

  /**
   * Deterministically computes totalCost = (hourlyRate * totalHours) + mealSubsidy.
   * @returns {Money}
   */
  computeTotalCost() {
    const hoursCost = this.#hourlyRate.multiply(this.#totalHours);
    return hoursCost.add(this.#mealSubsidy);
  }

  /**
   * Starts companion shift.
   * @param {string} [startTime]
   */
  startShift(startTime) {
    if (this.#status === 'COMPLETED') {
      throw new DomainError('[Turno de Acompañamiento] No se puede iniciar un turno ya completado.');
    }
    this.#startTime = startTime || new Date().toISOString();
    this.#status = 'IN_PROGRESS';
  }

  /**
   * Ends companion shift and recalculates hours and totalCost.
   * @param {string} [endTime]
   * @param {number} [hours]
   */
  endShift(endTime, hours) {
    this.#endTime = endTime || new Date().toISOString();
    if (hours !== undefined && hours !== null) {
      this.#totalHours = Number(hours);
    } else if (this.#startTime && this.#endTime) {
      const startMs = new Date(this.#startTime).getTime();
      const endMs = new Date(this.#endTime).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
        this.#totalHours = Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100;
      }
    }
    this.#status = 'COMPLETED';
    this.#totalCost = this.computeTotalCost();
  }

  toJSON() {
    return {
      id: this.#id,
      guideActorId: this.#guideActorId,
      dayNumber: this.#dayNumber,
      startTime: this.#startTime,
      endTime: this.#endTime,
      totalHours: this.#totalHours,
      hourlyRate: this.#hourlyRate.toJSON(),
      mealSubsidy: this.#mealSubsidy.toJSON(),
      status: this.#status,
      totalCost: this.#totalCost.toJSON()
    };
  }
}
