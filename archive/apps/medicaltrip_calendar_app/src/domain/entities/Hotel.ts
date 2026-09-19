import { OperativeTerritory } from '../values/OperativeTerritory';
import { InvariantViolationError } from '../errors/DomainErrors';

export interface HotelProps {
  id: string;
  code: string;
  name: string;
  address: string;
  territory: OperativeTerritory | string;
  roomTypes?: string[];
  amenities?: string[];
  isRecoveryHouse?: boolean;
  phone?: string;
}

/**
 * Hotel / Accommodation Entity (HOTEL)
 * Represents authorized patient lodging and recovery locations.
 */
export class Hotel {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly address: string;
  readonly territory: OperativeTerritory;
  readonly roomTypes: readonly string[];
  readonly amenities: readonly string[];
  readonly isRecoveryHouse: boolean;
  readonly phone?: string;

  constructor(props: HotelProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Hotel]: ID es obligatorio.');
    }
    if (!props.name || !props.name.trim()) {
      throw new InvariantViolationError('[Hotel]: Nombre es obligatorio.');
    }

    this.id = props.id.trim();
    this.code = props.code || props.id;
    this.name = props.name.trim();
    this.address = props.address || '';
    this.territory =
      props.territory instanceof OperativeTerritory
        ? props.territory
        : new OperativeTerritory(props.territory || props.address);
    this.roomTypes = Object.freeze(props.roomTypes ? [...props.roomTypes] : ['Standard Suite']);
    this.amenities = Object.freeze(props.amenities ? [...props.amenities] : []);
    this.isRecoveryHouse = Boolean(props.isRecoveryHouse);
    this.phone = props.phone;

    Object.freeze(this);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      address: this.address,
      territory: this.territory.toJSON(),
      roomTypes: [...this.roomTypes],
      amenities: [...this.amenities],
      isRecoveryHouse: this.isRecoveryHouse,
      phone: this.phone,
    };
  }
}
