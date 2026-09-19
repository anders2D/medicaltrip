import { DomainError } from './DomainError';

export class NonOperativeTerritoryError extends DomainError {
  constructor(public readonly inputLocation: string, public readonly reason: string) {
    super(
      `OperativeTerritory violation: Location '${inputLocation}' is outside authorized medical corridors. Reason: ${reason}`,
      'NON_OPERATIVE_TERRITORY'
    );
  }
}
