import { InvalidMoneyAmountError, CurrencyMismatchError } from '../errors/DomainError';

export type CurrencyCode = 'COP' | 'USD';

export class Money {
  public readonly cents: bigint;
  public readonly currency: CurrencyCode;

  private constructor(cents: bigint, currency: CurrencyCode = 'COP') {
    this.cents = cents;
    this.currency = currency;
    Object.freeze(this);
  }

  public static fromCents(cents: bigint | number | string, currency: CurrencyCode = 'COP'): Money {
    try {
      const bigintCents = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(Number(cents)));
      return new Money(bigintCents, currency);
    } catch {
      throw new InvalidMoneyAmountError(`Invalid cents representation: ${cents}`);
    }
  }

  public static fromAmount(amount: number | string | bigint, currency: CurrencyCode = 'COP'): Money {
    if (typeof amount === 'bigint') {
      return new Money(amount * 100n, currency);
    }
    let num: number;
    if (typeof amount === 'string') {
      const cleanStr = amount.trim().replace(/[^0-9.,-]/g, '');
      if (cleanStr.includes('.') && cleanStr.includes(',')) {
        // Format 1.500.000,50
        num = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
      } else if ((cleanStr.match(/\./g) || []).length > 1) {
        // Format 1.500.000
        num = parseFloat(cleanStr.replace(/\./g, ''));
      } else if (currency === 'COP' && cleanStr.includes('.')) {
        const parts = cleanStr.split('.');
        if (parts[1] && parts[1].length === 3) {
          num = parseFloat(cleanStr.replace(/\./g, ''));
        } else {
          num = parseFloat(cleanStr);
        }
      } else {
        num = parseFloat(cleanStr);
      }
    } else {
      num = amount;
    }
    if (isNaN(num) || !isFinite(num)) {
      throw new InvalidMoneyAmountError(`Cannot parse monetary amount: ${amount}`);
    }
    const roundedCents = BigInt(Math.round(num * 100));
    return new Money(roundedCents, currency);
  }

  public static zero(currency: CurrencyCode = 'COP'): Money {
    return new Money(0n, currency);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  public multiply(factor: number | bigint): Money {
    if (typeof factor === 'bigint') {
      return new Money(this.cents * factor, this.currency);
    }
    if (isNaN(factor) || !isFinite(factor)) {
      throw new InvalidMoneyAmountError(`Multiplication factor is invalid: ${factor}`);
    }
    // High-precision scaled integer arithmetic (10^6 scale)
    const scale = 1_000_000n;
    const factorScaled = BigInt(Math.round(factor * 1_000_000));
    const resultCents = (this.cents * factorScaled + (scale / 2n)) / scale;
    return new Money(resultCents, this.currency);
  }

  public split(parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new InvalidMoneyAmountError(`Split parts must be a positive integer. Received: ${parts}`);
    }
    const n = BigInt(parts);
    const quotient = this.cents / n;
    const remainder = this.cents % n;

    const result: Money[] = [];
    for (let i = 0; i < parts; i++) {
      const extraCent = BigInt(i) < (remainder >= 0n ? remainder : -remainder) ? (this.cents >= 0n ? 1n : -1n) : 0n;
      result.push(new Money(quotient + extraCent, this.currency));
    }
    return result;
  }

  public convert(exchangeRateCOPPerUSD: number, targetCurrency: CurrencyCode): Money {
    if (this.currency === targetCurrency) return this;
    if (exchangeRateCOPPerUSD <= 0) {
      throw new InvalidMoneyAmountError(`Exchange rate must be positive: ${exchangeRateCOPPerUSD}`);
    }

    if (this.currency === 'USD' && targetCurrency === 'COP') {
      return this.multiply(exchangeRateCOPPerUSD).withCurrency('COP');
    } else {
      const inverse = 1 / exchangeRateCOPPerUSD;
      return this.multiply(inverse).withCurrency('USD');
    }
  }

  public withCurrency(currency: CurrencyCode): Money {
    return new Money(this.cents, currency);
  }

  public equals(other: Money): boolean {
    return this.currency === other.currency && this.cents === other.cents;
  }

  public isZero(): boolean {
    return this.cents === 0n;
  }

  public isPositive(): boolean {
    return this.cents > 0n;
  }

  public isNegative(): boolean {
    return this.cents < 0n;
  }

  public toAmountNumber(): number {
    return Number(this.cents) / 100;
  }

  public formatCOP(): string {
    const amount = Number(this.cents) / 100;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  public format(): string {
    const amount = Number(this.cents) / 100;
    if (this.currency === 'COP') {
      return this.formatCOP();
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  public toJSON(): { cents: string; currency: CurrencyCode; formatted: string } {
    return {
      cents: this.cents.toString(),
      currency: this.currency,
      formatted: this.format(),
    };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}
