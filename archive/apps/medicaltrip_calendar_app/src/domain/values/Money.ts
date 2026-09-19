import { CurrencyMismatchError, InvalidMoneyAmountError } from '../errors/DomainErrors';

export type CurrencyCode = 'COP' | 'USD';

/**
 * Money Value Object (Martin Fowler Pattern)
 * Models all monetary amounts in exact integer cents using native JavaScript BigInt.
 * Guarantees zero IEEE-754 floating point rounding errors across multi-day aggregations.
 */
export class Money {
  readonly amountInCents: bigint;
  readonly currency: CurrencyCode;

  private constructor(amountInCents: bigint, currency: CurrencyCode = 'COP') {
    this.amountInCents = amountInCents;
    this.currency = currency;
    Object.freeze(this);
  }

  /**
   * Creates a Money instance directly from integer cents (BigInt, number, or string).
   */
  static fromCents(cents: bigint | number | string, currency: CurrencyCode = 'COP'): Money {
    const validCurrency = Money.normalizeCurrency(currency);
    let parsedCents: bigint;
    try {
      if (typeof cents === 'bigint') {
        parsedCents = cents;
      } else if (typeof cents === 'number') {
        if (!Number.isFinite(cents)) {
          throw new InvalidMoneyAmountError(cents, `El monto en centavos debe ser un número finito.`);
        }
        parsedCents = BigInt(Math.round(cents));
      } else if (typeof cents === 'string') {
        const trimmed = cents.trim();
        if (!trimmed || !/^-?\d+$/.test(trimmed)) {
          throw new InvalidMoneyAmountError(cents, `Formato de centavos en string inválido: '${cents}'`);
        }
        parsedCents = BigInt(trimmed);
      } else {
        throw new InvalidMoneyAmountError(cents);
      }
    } catch (err) {
      if (err instanceof InvalidMoneyAmountError) throw err;
      throw new InvalidMoneyAmountError(cents, `No se pudo parsear '${cents}' a BigInt centavos.`);
    }

    return new Money(parsedCents, validCurrency);
  }

  /**
   * Creates a Money instance from standard units/amount (e.g. 15500.50 COP -> 1550050n cents).
   * Applies deterministic half-up rounding at the sub-cent level.
   */
  static fromAmount(amount: number | string | bigint, currency: CurrencyCode = 'COP'): Money {
    const validCurrency = Money.normalizeCurrency(currency);
    if (typeof amount === 'bigint') {
      return new Money(amount * 100n, validCurrency);
    }

    const str = String(amount).trim();
    if (!str || str.toLowerCase() === 'nan' || str.toLowerCase() === 'infinity') {
      throw new InvalidMoneyAmountError(amount, `El monto '${amount}' no es numérico.`);
    }

    // Check valid number format with optional sign and decimals
    const match = str.match(/^(-)?(\d+)(?:\.(\d+))?$/);
    if (!match) {
      // Try parsing float as fallback
      const num = Number(str);
      if (isNaN(num) || !isFinite(num)) {
        throw new InvalidMoneyAmountError(amount, `Formato numérico no válido: '${amount}'`);
      }
      return Money.fromAmount(num.toFixed(4), validCurrency);
    }

    const isNegative = Boolean(match[1]);
    const integerPart = match[2];
    const fractionPart = match[3] || '';

    // Handle fractional cents with half-up rounding
    // We want 2 decimal places in cents.
    // e.g. "15500.555" -> integer = 15500, fraction = 555
    const twoDecimals = fractionPart.slice(0, 2).padEnd(2, '0');
    const rest = fractionPart.slice(2);
    let centsNum = BigInt(integerPart) * 100n + BigInt(twoDecimals);

    // Half-up rounding for the 3rd decimal place (>= 5 rounds up)
    if (rest.length > 0 && Number(rest[0]) >= 5) {
      centsNum += 1n;
    }

    if (isNegative) {
      centsNum = -centsNum;
    }

    return new Money(centsNum, validCurrency);
  }

  /**
   * Creates a zero-value Money instance for the specified currency.
   */
  static zero(currency: CurrencyCode = 'COP'): Money {
    return new Money(0n, Money.normalizeCurrency(currency));
  }

  /**
   * Helper alias matching common terminology.
   */
  static fromUnits(units: number | string | bigint, currency: CurrencyCode = 'COP'): Money {
    return Money.fromAmount(units, currency);
  }

  get amount(): number {
    return Number(this.amountInCents) / 100;
  }

  get units(): number {
    return this.amount;
  }

  get cents(): bigint {
    return this.amountInCents;
  }

  add(other: Money): Money {
    this.assertCompatibleCurrency(other);
    return new Money(this.amountInCents + other.amountInCents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertCompatibleCurrency(other);
    return new Money(this.amountInCents - other.amountInCents, this.currency);
  }

  /**
   * Deterministic multiplication by a numeric or BigInt scalar.
   */
  multiply(factor: number | bigint): Money {
    if (typeof factor === 'bigint') {
      return new Money(this.amountInCents * factor, this.currency);
    }
    if (!Number.isFinite(factor)) {
      throw new InvalidMoneyAmountError(factor, 'El factor de multiplicación debe ser un número finito.');
    }
    // Scale factor by 1,000,000,000 (10^9) for high precision arithmetic before division
    const SCALE = 1000000000n;
    const factorScaled = BigInt(Math.round(factor * 1000000000));
    const isNeg = (this.amountInCents < 0n && factorScaled > 0n) || (this.amountInCents > 0n && factorScaled < 0n);
    const absProduct = (this.amountInCents < 0n ? -this.amountInCents : this.amountInCents) * 
                       (factorScaled < 0n ? -factorScaled : factorScaled);
    
    // Half-up rounding
    const roundedCents = (absProduct + (SCALE / 2n)) / SCALE;
    const finalCents = isNeg ? -roundedCents : roundedCents;
    return new Money(finalCents, this.currency);
  }

  /**
   * Splits money into N equal parts with remainder distribution to guarantee zero cent loss.
   * e.g. $100 COP split 3 ways => [$34 COP, $33 COP, $33 COP]
   */
  split(parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new InvalidMoneyAmountError(parts, 'El número de partes para dividir debe ser un entero positivo mayor a 0.');
    }

    const bigParts = BigInt(parts);
    const quotient = this.amountInCents / bigParts;
    const remainder = this.amountInCents % bigParts;

    const absRemainder = remainder < 0n ? -remainder : remainder;
    const sign = this.amountInCents < 0n ? -1n : 1n;

    const result: Money[] = [];
    for (let i = 0; i < parts; i++) {
      let partCents = quotient;
      if (BigInt(i) < absRemainder) {
        partCents += sign * 1n;
      }
      result.push(new Money(partCents, this.currency));
    }
    return result;
  }

  /**
   * Converts the money to another currency given an exchange rate.
   * exchangeRate is: 1 this.currency = exchangeRate targetCurrency
   */
  convert(exchangeRate: number | string, targetCurrency: CurrencyCode): Money {
    const validTarget = Money.normalizeCurrency(targetCurrency);
    if (this.currency === validTarget) {
      return this;
    }
    const rateNum = Number(exchangeRate);
    if (isNaN(rateNum) || rateNum <= 0 || !isFinite(rateNum)) {
      throw new InvalidMoneyAmountError(exchangeRate, `Tasa de cambio inválida: '${exchangeRate}'`);
    }
    return this.multiply(rateNum).withCurrency(validTarget);
  }

  withCurrency(targetCurrency: CurrencyCode): Money {
    return new Money(this.amountInCents, Money.normalizeCurrency(targetCurrency));
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amountInCents === other.amountInCents;
  }

  isGreaterThan(other: Money): boolean {
    this.assertCompatibleCurrency(other);
    return this.amountInCents > other.amountInCents;
  }

  isLessThan(other: Money): boolean {
    this.assertCompatibleCurrency(other);
    return this.amountInCents < other.amountInCents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.assertCompatibleCurrency(other);
    return this.amountInCents >= other.amountInCents;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.assertCompatibleCurrency(other);
    return this.amountInCents <= other.amountInCents;
  }

  isZero(): boolean {
    return this.amountInCents === 0n;
  }

  isPositive(): boolean {
    return this.amountInCents > 0n;
  }

  isNegative(): boolean {
    return this.amountInCents < 0n;
  }

  abs(): Money {
    return new Money(this.amountInCents < 0n ? -this.amountInCents : this.amountInCents, this.currency);
  }

  negate(): Money {
    return new Money(-this.amountInCents, this.currency);
  }

  /**
   * Formats money into human-readable strings.
   * COP: "$ 15.500 COP" or "$ 1.200.000 COP"
   * USD: "$150.50 USD"
   */
  format(): string {
    const isNeg = this.amountInCents < 0n;
    const absCents = isNeg ? -this.amountInCents : this.amountInCents;
    const units = absCents / 100n;
    const centsFraction = absCents % 100n;

    const prefix = isNeg ? '-' : '';

    if (this.currency === 'COP') {
      const formattedInt = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${prefix}$ ${formattedInt} COP`;
    } else {
      const formattedInt = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedFrac = centsFraction.toString().padStart(2, '0');
      return `${prefix}$${formattedInt}.${formattedFrac} USD`;
    }
  }

  toJSON(): { amountInCents: string; currency: CurrencyCode; formatted: string } {
    return {
      amountInCents: this.amountInCents.toString(),
      currency: this.currency,
      formatted: this.format()
    };
  }

  private assertCompatibleCurrency(other: Money): void {
    if (!other || this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other?.currency || 'UNKNOWN');
    }
  }

  private static normalizeCurrency(currency: string): CurrencyCode {
    const norm = String(currency || '').trim().toUpperCase();
    if (norm !== 'COP' && norm !== 'USD') {
      throw new InvalidMoneyAmountError(currency, `Divisa '${currency}' no soportada. Solo se admiten 'COP' y 'USD'.`);
    }
    return norm as CurrencyCode;
  }
}
