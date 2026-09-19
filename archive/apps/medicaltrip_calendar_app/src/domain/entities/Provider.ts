import { OperativeTerritory } from '../values/OperativeTerritory';
import { InvariantViolationError } from '../errors/DomainErrors';

export type ProviderCategory = 'CLINIC' | 'LAB' | 'DIAGNOSTIC_CENTER' | 'PHARMACY';

export interface ProviderProps {
  id: string;
  code: string; // e.g. "CLINIC-HPTU", "LAB-ECHAVARRIA"
  name: string;
  category: ProviderCategory;
  address: string;
  territory: OperativeTerritory | string;
  specialties: string[];
  isHomeVisitAvailable?: boolean;
  phone?: string;
}

/**
 * Healthcare Provider Entity (CLINIC / LAB / PHARMACY)
 * Represents an accredited institutional clinical partner.
 */
export class Provider {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly category: ProviderCategory;
  readonly address: string;
  readonly territory: OperativeTerritory;
  readonly specialties: readonly string[];
  readonly isHomeVisitAvailable: boolean;
  readonly phone?: string;

  constructor(props: ProviderProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Proveedor]: ID es obligatorio.');
    }
    if (!props.name || !props.name.trim()) {
      throw new InvariantViolationError('[Proveedor]: Nombre es obligatorio.');
    }

    this.id = props.id.trim();
    this.code = props.code || props.id;
    this.name = props.name.trim();
    this.category = props.category;
    this.address = props.address || '';
    this.territory =
      props.territory instanceof OperativeTerritory
        ? props.territory
        : new OperativeTerritory(props.territory || props.address);
    this.specialties = Object.freeze(props.specialties ? [...props.specialties] : []);
    this.isHomeVisitAvailable = Boolean(props.isHomeVisitAvailable);
    this.phone = props.phone;

    Object.freeze(this);
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      category: this.category,
      address: this.address,
      territory: this.territory.toJSON(),
      specialties: [...this.specialties],
      isHomeVisitAvailable: this.isHomeVisitAvailable,
      phone: this.phone,
    };
  }
}
