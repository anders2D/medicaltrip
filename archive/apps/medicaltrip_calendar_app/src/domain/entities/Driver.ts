import { Money } from '../values/Money';
import { InvariantViolationError } from '../errors/DomainErrors';

export type VehicleType = 'AEROTUREX_SEDAN' | 'UBER_XL_VAN' | 'RENAULT_DUSTER' | 'SEDAN_EJECUTIVO';

export type RouteType =
  | 'AIRPORT_JMC'
  | 'URBANO_CORTO'
  | 'URBANO_MEDIO'
  | 'URBANO_LARGO'
  | 'SUR_METROPOLITANO';

export interface DriverProps {
  id: string; // e.g. "DRV-01"
  name: string;
  phone?: string;
  vehicleType: VehicleType;
  licensePlate: string;
  providerCompany?: string; // e.g. "Aeroturex", "Flota Privada"
}

/**
 * Driver Entity (DRV)
 * Represents an authorized transport driver with standard rate engine.
 */
export class Driver {
  readonly id: string;
  readonly name: string;
  readonly phone?: string;
  readonly vehicleType: VehicleType;
  readonly licensePlate: string;
  readonly providerCompany: string;

  constructor(props: DriverProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Conductor]: ID es obligatorio.');
    }
    if (!props.name || !props.name.trim()) {
      throw new InvariantViolationError('[Conductor]: Nombre es obligatorio.');
    }
    if (!props.licensePlate || !props.licensePlate.trim()) {
      throw new InvariantViolationError('[Conductor]: Placa de vehículo es obligatoria.');
    }

    this.id = props.id.trim();
    this.name = props.name.trim();
    this.phone = props.phone;
    this.vehicleType = props.vehicleType;
    this.licensePlate = props.licensePlate.trim().toUpperCase();
    this.providerCompany = props.providerCompany || 'Aeroturex';

    Object.freeze(this);
  }

  /**
   * Calculates standard driver transfer fee based on route type, vehicle type, and night surcharge.
   */
  static calculateTransferFee(
    routeType: RouteType,
    options: { isVan?: boolean; isNightShift?: boolean; paxCount?: number } = {}
  ): { baseFee: Money; nightSurcharge: Money; totalFee: Money } {
    const isVan = Boolean(options.isVan || (options.paxCount && options.paxCount >= 3));
    const isNight = Boolean(options.isNightShift);

    let baseCents = 3500000n; // default 35k COP

    switch (routeType) {
      case 'AIRPORT_JMC':
        baseCents = isVan ? 16000000n : 14500000n; // 160k or 145k COP
        break;
      case 'URBANO_CORTO':
        baseCents = 2500000n; // 25k COP
        break;
      case 'URBANO_MEDIO':
        baseCents = 3500000n; // 35k COP
        break;
      case 'URBANO_LARGO':
        baseCents = 5500000n; // 55k COP (e.g. Poblado -> Robledo)
        break;
      case 'SUR_METROPOLITANO':
        baseCents = 4500000n; // 45k COP (Envigado / Sabaneta / Villa Anita)
        break;
    }

    const baseFee = Money.fromCents(baseCents, 'COP');
    const nightSurcharge = isNight ? Money.fromCents(2500000n, 'COP') : Money.zero('COP');
    const totalFee = baseFee.add(nightSurcharge);

    return { baseFee, nightSurcharge, totalFee };
  }

  /**
   * Check if a given time falls in the nocturnal window (20:00 to 06:00).
   */
  static isNocturnalTime(dateTime: Date): boolean {
    const hour = dateTime.getHours();
    return hour >= 20 || hour < 6;
  }

  toJSON(): DriverProps {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      vehicleType: this.vehicleType,
      licensePlate: this.licensePlate,
      providerCompany: this.providerCompany,
    };
  }
}
