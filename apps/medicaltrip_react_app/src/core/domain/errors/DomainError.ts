export abstract class DomainError extends Error {
  public readonly timestamp: string;

  constructor(message: string, public readonly code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidMoneyAmountError extends DomainError {
  constructor(message: string = 'Invalid monetary amount specified') {
    super(message, 'INVALID_MONEY_AMOUNT');
  }
}

export class CurrencyMismatchError extends DomainError {
  constructor(sourceCurrency: string, targetCurrency: string) {
    super(`Cannot perform arithmetic between incompatible currencies: ${sourceCurrency} and ${targetCurrency}`, 'CURRENCY_MISMATCH');
  }
}

export class InvalidEventTransitionError extends DomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(`Illegal milestone state transition from ${fromStatus} to ${toStatus}`, 'INVALID_EVENT_TRANSITION');
  }
}

export class InvalidBookingError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_BOOKING');
  }
}

export class EventNotFoundError extends DomainError {
  constructor(eventId: string) {
    super(`Itinerary event with ID '${eventId}' was not found in the domain repository`, 'EVENT_NOT_FOUND');
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message, 'INVARIANT_VIOLATION');
  }
}
