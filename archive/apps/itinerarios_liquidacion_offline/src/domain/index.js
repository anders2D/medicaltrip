/**
 * Domain Layer Barrel Export
 * Medical Trip Colombia S.A.S. — Hexagonal Architecture Pure Core
 * 0 external framework dependencies.
 */

// Errors
export {
  DomainError,
  GeospatialInvariantViolationError,
  CurrencyMismatchError,
  InvalidStateTransitionError
} from './errors/domain-error.js';

// Value Objects
export { Money } from './value-objects/money.js';
export {
  OperativeTerritory,
  VALID_OPERATIVE_CORRIDORS,
  FORBIDDEN_NON_OPERATIVE_ZONES
} from './value-objects/operative-territory.js';
export { LocationCoordinate } from './value-objects/location-coordinate.js';
export { ActorEvent, sha256 } from './value-objects/actor-event.js';

// Entities
export { ItineraryItem, ITINERARY_STATUSES } from './entities/itinerary-item.js';
export { ExpenseItem, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from './entities/expense-item.js';
export { CompanionShift, COMPANION_SHIFT_STATUSES } from './entities/companion-shift.js';
export { DriverTransfer, DRIVER_TRANSFER_STATUSES } from './entities/driver-transfer.js';
export { PatientSignature } from './entities/patient-signature.js';
export { SettlementLedger } from './entities/settlement-ledger.js';

// Ports
export { IStoragePort } from './ports/storage-port.js';
export { IBlobStoragePort } from './ports/blob-storage-port.js';
export { IActorEventBusPort } from './ports/actor-event-bus-port.js';
export { IGeolocationPort } from './ports/geolocation-port.js';
export { IOCRPort } from './ports/ocr-port.js';
