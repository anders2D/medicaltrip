/**
 * Medical Trip Colombia S.A.S. - Official Rate Cards & Disbursement Standards
 * Strictly denominated in BigInt integer cents ($1.00 COP = 100 centavos)
 */

import { Money } from '../../../core/domain/value-objects/Money';

export interface GuideRateCard {
  readonly hourlyRate: Money;
  readonly prepAllowance: Money;
  readonly fullDayPackage8h: Money;
  readonly mealSubsidies: {
    readonly tier0: Money; // < 3h -> $0
    readonly tier1: Money; // 3-4.9h -> $8.000 COP
    readonly tier2: Money; // 5-7.9h -> $25.000 COP
    readonly tier3: Money; // 8-11.9h -> $35.000 COP
    readonly tier4: Money; // >= 12h -> $45.000 COP
  };
}

export interface FleetRateCard {
  readonly airportJmcSedan: Money;
  readonly airportJmcVanXL: Money;
  readonly airportNightSurcharge: Money;
  readonly intraComunaShort: Money;
  readonly interComunaMedium: Money;
  readonly longTripRobledo: Money;
  readonly envigadoSabaneta: Money;
}

export interface StandardDisbursementsCard {
  readonly labEchavarriaHomeVisit: Money;
  readonly labEchavarriaUroanalysisUroculture: Money;
  readonly ocazionezImagingPackage: Money;
  readonly clinicBolivarianaConsultation: Money;
  readonly esimClaro80GB: Money;
  readonly colasistenciaDailyPerPax: Money;
}

export const GUIDE_RATES: GuideRateCard = {
  hourlyRate: Money.fromAmount(15500, 'COP'),
  prepAllowance: Money.fromAmount(15500, 'COP'),
  fullDayPackage8h: Money.fromAmount(124000, 'COP'),
  mealSubsidies: {
    tier0: Money.zero('COP'),
    tier1: Money.fromAmount(8000, 'COP'),
    tier2: Money.fromAmount(25000, 'COP'),
    tier3: Money.fromAmount(35000, 'COP'),
    tier4: Money.fromAmount(45000, 'COP'),
  },
};

export const FLEET_RATES: FleetRateCard = {
  airportJmcSedan: Money.fromAmount(145000, 'COP'),
  airportJmcVanXL: Money.fromAmount(160000, 'COP'),
  airportNightSurcharge: Money.fromAmount(25000, 'COP'),
  intraComunaShort: Money.fromAmount(35000, 'COP'),
  interComunaMedium: Money.fromAmount(40000, 'COP'),
  longTripRobledo: Money.fromAmount(55000, 'COP'),
  envigadoSabaneta: Money.fromAmount(45000, 'COP'),
};

export const STANDARD_DISBURSEMENTS: StandardDisbursementsCard = {
  labEchavarriaHomeVisit: Money.fromAmount(97350, 'COP'),
  labEchavarriaUroanalysisUroculture: Money.fromAmount(125000, 'COP'),
  ocazionezImagingPackage: Money.fromAmount(170755, 'COP'),
  clinicBolivarianaConsultation: Money.fromAmount(135000, 'COP'),
  esimClaro80GB: Money.fromAmount(90909, 'COP'),
  colasistenciaDailyPerPax: Money.fromAmount(6000, 'COP'),
};
