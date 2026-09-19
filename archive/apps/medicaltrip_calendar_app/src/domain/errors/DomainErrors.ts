/**
 * Pure Domain Errors for Medical Trip Calendar & Settlement System
 * Framework-agnostic custom domain error hierarchy.
 */

export class DomainError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, code = 'DOMAIN_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NonOperativeTerritoryError extends DomainError {
  readonly territoryName: string;

  constructor(territoryName: string, reason?: string) {
    const defaultMsg = `[Violación Geoespacial]: La ubicación '${territoryName}' está prohibida o fuera de los corredores operativos autorizados de Medical Trip Colombia (Medellín, Rionegro, Valle de Aburrá, Manizales, Pereira, Bogotá).`;
    super(reason || defaultMsg, 'NON_OPERATIVE_TERRITORY_ERROR', { territoryName });
    this.territoryName = territoryName;
  }
}

export class CurrencyMismatchError extends DomainError {
  readonly expectedCurrency: string;
  readonly actualCurrency: string;

  constructor(expectedCurrency: string, actualCurrency: string) {
    super(
      `[Incompatibilidad de Divisas]: No se pueden operar montos con monedas distintas (${expectedCurrency} vs ${actualCurrency}) sin una tasa de cambio explícita.`,
      'CURRENCY_MISMATCH_ERROR',
      { expectedCurrency, actualCurrency }
    );
    this.expectedCurrency = expectedCurrency;
    this.actualCurrency = actualCurrency;
  }
}

export class InvalidMoneyAmountError extends DomainError {
  readonly invalidAmount: unknown;

  constructor(invalidAmount: unknown, reason?: string) {
    super(
      reason || `[Monto Monetario Inválido]: El valor '${invalidAmount}' no puede ser interpretado como un monto monetario válido.`,
      'INVALID_MONEY_AMOUNT_ERROR',
      { invalidAmount }
    );
    this.invalidAmount = invalidAmount;
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVARIANT_VIOLATION_ERROR', details);
  }
}

export class MilestoneNotFoundError extends DomainError {
  readonly milestoneId: string;

  constructor(milestoneId: string) {
    super(`[Hito No Encontrado]: El hito con ID '${milestoneId}' no existe en el itinerario.`, 'MILESTONE_NOT_FOUND_ERROR', { milestoneId });
    this.milestoneId = milestoneId;
  }
}

export class InvalidMilestoneTransitionError extends DomainError {
  readonly currentStatus: string;
  readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string, reason?: string) {
    super(
      reason || `[Transición Inválida de Estado]: No se puede transicionar el hito de '${currentStatus}' a '${targetStatus}'.`,
      'INVALID_MILESTONE_TRANSITION_ERROR',
      { currentStatus, targetStatus }
    );
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export class InvalidGuideShiftError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_GUIDE_SHIFT_ERROR', details);
  }
}

export class InvalidBookingError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_BOOKING_ERROR', details);
  }
}
