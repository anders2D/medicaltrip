import { Money } from '../values/Money';
import { InvalidGuideShiftError, InvariantViolationError } from '../errors/DomainErrors';

export type CompanionModality =
  | 'SPANISH_WITH_CAR'
  | 'SPANISH_WITHOUT_CAR'
  | 'ENGLISH_WITH_CAR_DRIVER';

export interface GuideProps {
  id: string; // e.g. "GUIA-01"
  name: string;
  languages: string[];
  phone?: string;
  isMedicalSpecialist?: boolean;
  modality?: CompanionModality;
}

export interface ShiftCalculationOptions {
  modality?: CompanionModality;
  hasPrepAllowance?: boolean;
  hasDeliveryAllowance?: boolean;
  isSundayOrHoliday?: boolean;
  nightHours?: number; // Hours worked after 19:00
  isHospitalization?: boolean;
  hasPicoYPlaca?: boolean;
  zonalTransit?: 'POBLADO' | 'LAURELES' | null;
  applyMinimumHoursFloor?: boolean;
}

export interface ShiftCalculationResult {
  hours: number;
  billedHours: number;
  baseFee: Money;
  nightFee: Money;
  prepFee: Money;
  deliveryFee: Money;
  holidayFee: Money;
  transitFee: Money;
  mealSubsidy: Money;
  totalFee: Money;
  mealTier: 0 | 1 | 2 | 3 | 4;
  modality: CompanionModality;
}

/**
 * Guide Entity (GUIA)
 * Represents a bilingual field companion and clinical coordinator.
 */
export class Guide {
  static readonly BASE_HOURLY_RATE_COP_CENTS = 1550000n; // $15.500 COP
  static readonly NIGHT_HOURLY_RATE_COP_CENTS = 1650000n; // $16.500 COP (07:00 pm en adelante)
  static readonly SUNDAY_HOLIDAY_COMPENSATORY_COP_CENTS = 1550000n; // $15.500 COP (1 hora extra)

  // English driver tiered hourly rates (Continuous degresive scale)
  static readonly ENGLISH_TIER_1_HOURLY_RATE_COP_CENTS = 4000000n; // $40.000 COP (<= 1.5h)
  static readonly ENGLISH_TIER_2_HOURLY_RATE_COP_CENTS = 3500000n; // $35.000 COP (1.51 - 2.5h)
  static readonly ENGLISH_TIER_3_HOURLY_RATE_COP_CENTS = 3000000n; // $30.000 COP (2.51 - 5.5h)
  static readonly ENGLISH_TIER_4_HOURLY_RATE_COP_CENTS = 2500000n; // $25.000 COP (> 5.5h)

  // Folder allowances
  static readonly PREPARATION_ALLOWANCE_COP_CENTS = 1550000n; // $15.500 COP (Español)
  static readonly BILINGUAL_PREPARATION_ALLOWANCE_COP_CENTS = 2500000n; // $25.000 COP (Inglés)
  static readonly FOLDER_DELIVERY_ALLOWANCE_SPANISH_COP_CENTS = 3000000n; // $30.000 COP (Español)
  static readonly FOLDER_DELIVERY_ALLOWANCE_ENGLISH_COP_CENTS = 3500000n; // $35.000 COP (Inglés)

  // Meal subsidies: Standard Spanish Scale
  static readonly MEAL_SUBSIDY_TIER_1_COP_CENTS = 800000n; // $8.000 COP (1 - 3h / < 4h)
  static readonly MEAL_SUBSIDY_TIER_2_COP_CENTS = 2500000n; // $25.000 COP (3.5 - 7h / 4h - 6h)
  static readonly MEAL_SUBSIDY_TIER_3_COP_CENTS = 3500000n; // $35.000 COP (7.5 - 9h / > 6h - 8h)
  static readonly MEAL_SUBSIDY_TIER_4_COP_CENTS = 4500000n; // $45.000 COP (> 9h)

  // Meal subsidies: English Driver Reduced Scale
  static readonly ENGLISH_MEAL_SUBSIDY_TIER_MID_COP_CENTS = 1000000n; // $10.000 COP (2.51 - 5.5h)
  static readonly ENGLISH_MEAL_SUBSIDY_TIER_FULL_COP_CENTS = 2000000n; // $20.000 COP (> 5.5h)

  // Transportation allowances
  static readonly ZONAL_TRANSIT_POBLADO_COP_CENTS = 2000000n; // $20.000 COP ida y regreso
  static readonly ZONAL_TRANSIT_LAURELES_COP_CENTS = 1600000n; // $16.000 COP ida y regreso
  static readonly PICO_Y_PLACA_ALLOWANCE_COP_CENTS = 3000000n; // $30.000 COP
  static readonly HOSPITALIZATION_TRANSIT_PER_TRIP_COP_CENTS = 3000000n; // $30.000 COP por trayecto

  // Anti-withholding tax threshold
  static readonly WITHHOLDING_TAX_THRESHOLD_COP_CENTS = 52370000n; // $523.700 COP

  readonly id: string;
  readonly name: string;
  readonly languages: readonly string[];
  readonly phone?: string;
  readonly isMedicalSpecialist: boolean;
  readonly modality: CompanionModality;

  constructor(props: GuideProps) {
    if (!props.id || !props.id.trim()) {
      throw new InvariantViolationError('[Guía]: ID es obligatorio.');
    }
    if (!props.name || !props.name.trim()) {
      throw new InvariantViolationError('[Guía]: Nombre es obligatorio.');
    }

    this.id = props.id.trim();
    this.name = props.name.trim();
    this.languages = Object.freeze(props.languages ? [...props.languages] : ['Español', 'Inglés']);
    this.phone = props.phone;
    this.isMedicalSpecialist = Boolean(props.isMedicalSpecialist);
    
    // Auto-detect default modality if not provided
    if (props.modality) {
      this.modality = props.modality;
    } else if (this.languages.some((l) => l.toLowerCase().includes('ingl') || l.toLowerCase().includes('engl'))) {
      this.modality = 'ENGLISH_WITH_CAR_DRIVER';
    } else {
      this.modality = 'SPANISH_WITH_CAR';
    }

    Object.freeze(this);
  }

  /**
   * Calculates the exact compensation for a companion shift according to official Medical Trip rules.
   * Supports both legacy signature `(hours, hasPrepAllowance)` and full options object.
   */
  static calculateShiftFee(
    hours: number,
    optionsOrHasPrep: boolean | ShiftCalculationOptions = false
  ): ShiftCalculationResult {
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      throw new InvalidGuideShiftError(`[Turno de Guía]: Horas laboradas inválidas: ${hours}. Debe estar entre 0 y 24 horas.`);
    }

    // Resolve options
    let options: ShiftCalculationOptions;
    if (typeof optionsOrHasPrep === 'boolean') {
      options = { hasPrepAllowance: optionsOrHasPrep, modality: 'SPANISH_WITH_CAR', applyMinimumHoursFloor: false };
    } else {
      options = optionsOrHasPrep || {};
    }

    const modality: CompanionModality = options.modality || 'SPANISH_WITH_CAR';
    const isEnglishDriver = modality === 'ENGLISH_WITH_CAR_DRIVER';

    // 1. Effective billed hours (minimum 2 hours floor for Spanish modalities if enabled)
    let billedHours = hours;
    if (options.applyMinimumHoursFloor && !isEnglishDriver && hours > 0 && hours < 2.0) {
      billedHours = 2.0;
    }

    // 2. Base hourly fees & Night fees
    let baseFee = Money.zero('COP');
    let nightFee = Money.zero('COP');

    if (isEnglishDriver) {
      // Degresive hourly scale for English driver
      let hourlyRateCents = Guide.ENGLISH_TIER_4_HOURLY_RATE_COP_CENTS;
      if (hours <= 1.5) {
        hourlyRateCents = Guide.ENGLISH_TIER_1_HOURLY_RATE_COP_CENTS; // $40.000
      } else if (hours <= 2.5) {
        hourlyRateCents = Guide.ENGLISH_TIER_2_HOURLY_RATE_COP_CENTS; // $35.000
      } else if (hours <= 5.5) {
        hourlyRateCents = Guide.ENGLISH_TIER_3_HOURLY_RATE_COP_CENTS; // $30.000
      }
      baseFee = Money.fromCents(hourlyRateCents, 'COP').multiply(billedHours);
    } else {
      // Spanish modalities ($15.500 day, $16.500 night)
      const rawNightHours = Math.max(0, Math.min(billedHours, options.nightHours || 0));
      const dayHours = Math.max(0, billedHours - rawNightHours);

      const dayRate = Money.fromCents(Guide.BASE_HOURLY_RATE_COP_CENTS, 'COP');
      const nightRate = Money.fromCents(Guide.NIGHT_HOURLY_RATE_COP_CENTS, 'COP');

      baseFee = dayRate.multiply(dayHours);
      nightFee = nightRate.multiply(rawNightHours);
    }

    // 3. Folder allowances
    let prepFee = Money.zero('COP');
    if (options.hasPrepAllowance) {
      const prepCents = isEnglishDriver
        ? Guide.BILINGUAL_PREPARATION_ALLOWANCE_COP_CENTS
        : Guide.PREPARATION_ALLOWANCE_COP_CENTS;
      prepFee = Money.fromCents(prepCents, 'COP');
    }

    let deliveryFee = Money.zero('COP');
    if (options.hasDeliveryAllowance) {
      const deliveryCents = isEnglishDriver
        ? Guide.FOLDER_DELIVERY_ALLOWANCE_ENGLISH_COP_CENTS
        : Guide.FOLDER_DELIVERY_ALLOWANCE_SPANISH_COP_CENTS;
      deliveryFee = Money.fromCents(deliveryCents, 'COP');
    }

    // 4. Sunday / Holiday compensatory
    let holidayFee = Money.zero('COP');
    if (options.isSundayOrHoliday) {
      holidayFee = Money.fromCents(Guide.SUNDAY_HOLIDAY_COMPENSATORY_COP_CENTS, 'COP');
    }

    // 5. Transit allowances
    let transitFee = Money.zero('COP');
    if (modality === 'SPANISH_WITHOUT_CAR') {
      if (options.zonalTransit === 'POBLADO') {
        transitFee = transitFee.add(Money.fromCents(Guide.ZONAL_TRANSIT_POBLADO_COP_CENTS, 'COP'));
      } else if (options.zonalTransit === 'LAURELES') {
        transitFee = transitFee.add(Money.fromCents(Guide.ZONAL_TRANSIT_LAURELES_COP_CENTS, 'COP'));
      }
    } else if (modality === 'SPANISH_WITH_CAR') {
      if (options.hasPicoYPlaca) {
        transitFee = transitFee.add(Money.fromCents(Guide.PICO_Y_PLACA_ALLOWANCE_COP_CENTS, 'COP'));
      }
      if (options.isHospitalization) {
        // 2 trips: ida y regreso = $60.000
        transitFee = transitFee.add(Money.fromCents(Guide.HOSPITALIZATION_TRANSIT_PER_TRIP_COP_CENTS * 2n, 'COP'));
      }
    }

    // 6. Tiered meal subsidy
    let mealSubsidyCents = 0n;
    let mealTier: 0 | 1 | 2 | 3 | 4 = 0;

    if (isEnglishDriver) {
      if (hours > 2.5 && hours <= 5.5) {
        mealSubsidyCents = Guide.ENGLISH_MEAL_SUBSIDY_TIER_MID_COP_CENTS; // $10.000
        mealTier = 2;
      } else if (hours > 5.5) {
        mealSubsidyCents = Guide.ENGLISH_MEAL_SUBSIDY_TIER_FULL_COP_CENTS; // $20.000
        mealTier = 3;
      }
    } else {
      const isExplicitOptions = typeof optionsOrHasPrep === 'object' && optionsOrHasPrep !== null;
      if (isExplicitOptions) {
        if (hours > 0 && hours < 3.5) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_1_COP_CENTS; // $8.000
          mealTier = 1;
        } else if (hours >= 3.5 && hours <= 6.0) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_2_COP_CENTS; // $25.000
          mealTier = 2;
        } else if (hours > 6.0 && hours < 9.5) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_3_COP_CENTS; // $35.000
          mealTier = 3;
        } else if (hours >= 9.5) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_4_COP_CENTS; // $45.000
          mealTier = 4;
        }
      } else {
        if (hours > 0 && hours < 4.0) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_1_COP_CENTS; // $8.000
          mealTier = 1;
        } else if (hours >= 4.0 && hours <= 6.0) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_2_COP_CENTS; // $25.000
          mealTier = 2;
        } else if (hours > 6.0 && hours <= 10.0) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_3_COP_CENTS; // $35.000
          mealTier = 3;
        } else if (hours > 10.0) {
          mealSubsidyCents = Guide.MEAL_SUBSIDY_TIER_4_COP_CENTS; // $45.000
          mealTier = 4;
        }
      }
    }

    const mealSubsidy = Money.fromCents(mealSubsidyCents, 'COP');
    const totalFee = baseFee
      .add(nightFee)
      .add(prepFee)
      .add(deliveryFee)
      .add(holidayFee)
      .add(transitFee)
      .add(mealSubsidy);

    return {
      hours,
      billedHours,
      baseFee,
      nightFee,
      prepFee,
      deliveryFee,
      holidayFee,
      transitFee,
      mealSubsidy,
      totalFee,
      mealTier,
      modality,
    };
  }

  toJSON(): GuideProps {
    return {
      id: this.id,
      name: this.name,
      languages: [...this.languages],
      phone: this.phone,
      isMedicalSpecialist: this.isMedicalSpecialist,
      modality: this.modality,
    };
  }
}

