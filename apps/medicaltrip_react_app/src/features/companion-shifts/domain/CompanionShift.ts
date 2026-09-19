import { Money } from '@/core/domain';

export type MealSubsidyTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

export class CompanionShift {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly guideId: string;
  public readonly guideName: string;
  public readonly dayNumber: number;
  public readonly date: string;
  public readonly hoursLogged: number;
  public readonly hourlyRate: Money;
  public readonly prepAllowance: Money;
  public readonly mealSubsidyTier: MealSubsidyTier;
  public readonly mealSubsidyAmount: Money;
  public readonly notes: string;
  public readonly status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';

  // Standard Medical Trip guide rates in COP
  public static readonly DEFAULT_HOURLY_RATE_COP = Money.fromAmount(15500, 'COP');
  public static readonly DEFAULT_PREP_ALLOWANCE_COP = Money.fromAmount(15500, 'COP');

  constructor(params: {
    id: string;
    bookingId: string;
    guideId: string;
    guideName: string;
    dayNumber: number;
    date: string;
    hoursLogged: number;
    hourlyRate?: Money;
    prepAllowance?: Money;
    mealSubsidyTier?: MealSubsidyTier;
    mealSubsidyAmount?: Money;
    notes?: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  }) {
    this.id = params.id;
    this.bookingId = params.bookingId;
    this.guideId = params.guideId;
    this.guideName = params.guideName;
    this.dayNumber = params.dayNumber;
    this.date = params.date;
    this.hoursLogged = Math.max(0, params.hoursLogged);
    this.hourlyRate = params.hourlyRate || CompanionShift.DEFAULT_HOURLY_RATE_COP;
    this.prepAllowance = params.prepAllowance || CompanionShift.DEFAULT_PREP_ALLOWANCE_COP;

    const subsidy = params.mealSubsidyTier
      ? { tier: params.mealSubsidyTier, amount: params.mealSubsidyAmount || CompanionShift.resolveMealSubsidyAmount(params.mealSubsidyTier) }
      : CompanionShift.resolveMealSubsidyTier(this.hoursLogged);

    this.mealSubsidyTier = subsidy.tier;
    this.mealSubsidyAmount = subsidy.amount;
    this.notes = params.notes || '';
    this.status = params.status || 'SCHEDULED';
    Object.freeze(this);
  }

  public calculateTotalFee(): Money {
    const hourlySubtotal = this.hourlyRate.multiply(this.hoursLogged);
    return hourlySubtotal.add(this.prepAllowance).add(this.mealSubsidyAmount);
  }

  public static resolveMealSubsidyTier(hours: number): { tier: MealSubsidyTier; amount: Money } {
    if (hours < 3) {
      return { tier: 'TIER_0', amount: Money.zero() };
    } else if (hours < 5) {
      return { tier: 'TIER_1', amount: Money.fromAmount(8000, 'COP') };
    } else if (hours < 8) {
      return { tier: 'TIER_2', amount: Money.fromAmount(25000, 'COP') };
    } else if (hours < 12) {
      return { tier: 'TIER_3', amount: Money.fromAmount(35000, 'COP') };
    } else {
      return { tier: 'TIER_4', amount: Money.fromAmount(45000, 'COP') };
    }
  }

  public static resolveMealSubsidyAmount(tier: MealSubsidyTier): Money {
    switch (tier) {
      case 'TIER_0': return Money.zero();
      case 'TIER_1': return Money.fromAmount(8000, 'COP');
      case 'TIER_2': return Money.fromAmount(25000, 'COP');
      case 'TIER_3': return Money.fromAmount(35000, 'COP');
      case 'TIER_4': return Money.fromAmount(45000, 'COP');
    }
  }
}
