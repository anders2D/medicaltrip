/**
 * Base Domain Error for Medical Trip Colombia S.A.S.
 * Represents violations of business invariants, domain constraints, or state rules.
 */
export class DomainError extends Error {
  /**
   * @param {string} message - Description of the domain invariant violation.
   * @param {string} [code='DOMAIN_INVARIANT_VIOLATION'] - Error code classification.
   * @param {Record<string, any>} [details={}] - Contextual details.
   */
  constructor(message, code = 'DOMAIN_INVARIANT_VIOLATION', details = {}) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}

export class GeospatialInvariantViolationError extends DomainError {
  constructor(zoneOrCoords, customMessage) {
    const msg = customMessage || `[Violación de Invariante Geoespacial] Zona no operativa: ${zoneOrCoords}`;
    super(msg, 'GEOSPATIAL_INVARIANT_VIOLATION', { zoneOrCoords });
    this.name = 'GeospatialInvariantViolationError';
  }
}

export class CurrencyMismatchError extends DomainError {
  constructor(expectedCurrency, actualCurrency) {
    super(
      `[Discrepancia de Moneda] No se pueden operar montos con diferentes divisas: ${expectedCurrency} vs ${actualCurrency}`,
      'CURRENCY_MISMATCH',
      { expectedCurrency, actualCurrency }
    );
    this.name = 'CurrencyMismatchError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(fromStatus, toStatus, reason) {
    super(
      `[Transición Inválida] No se puede cambiar estado de '${fromStatus}' a '${toStatus}'${reason ? `: ${reason}` : ''}`,
      'INVALID_STATE_TRANSITION',
      { fromStatus, toStatus, reason }
    );
    this.name = 'InvalidStateTransitionError';
  }
}
