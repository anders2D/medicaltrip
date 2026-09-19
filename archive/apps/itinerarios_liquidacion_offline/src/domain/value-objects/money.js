import { CurrencyMismatchError, DomainError } from '../errors/domain-error.js';

/**
 * Pure Martin Fowler Money Pattern Value Object.
 * Enforces zero floating-point arithmetic using exact BigInt integer cents.
 * Supports COP (Pesos Colombianos) and USD (US Dollars).
 * Immutable.
 */
export class Money {
  /** @type {bigint} */
  #amountInCents;
  /** @type {'COP' | 'USD'} */
  #currency;

  /**
   * @param {bigint | number | string} amountInCents
   * @param {'COP' | 'USD'} [currency='COP']
   */
  constructor(amountInCents, currency = 'COP') {
    const normCurrency = String(currency).toUpperCase().trim();
    if (normCurrency !== 'COP' && normCurrency !== 'USD') {
      throw new DomainError(`[Moneda Inválida] Divisa no soportada: '${currency}'. Soportadas: 'COP', 'USD'`);
    }

    try {
      this.#amountInCents = typeof amountInCents === 'bigint' ? amountInCents : BigInt(amountInCents);
    } catch {
      throw new DomainError(`[Monto Inválido] No se pudo convertir '${amountInCents}' a BigInt cents.`);
    }

    this.#currency = /** @type {'COP' | 'USD'} */ (normCurrency);
    Object.freeze(this);
  }

  /** @returns {bigint} */
  get amountInCents() {
    return this.#amountInCents;
  }

  /** @returns {bigint} */
  get cents() {
    return this.#amountInCents;
  }

  /** @returns {'COP' | 'USD'} */
  get currency() {
    return this.#currency;
  }

  /**
   * Approximate decimal amount as a standard JS number (read-only / display only).
   * @returns {number}
   */
  get amount() {
    return Number(this.#amountInCents) / 100;
  }

  /**
   * Returns -1 if negative, 0 if zero, 1 if positive.
   * @returns {number}
   */
  get sign() {
    if (this.#amountInCents > 0n) return 1;
    if (this.#amountInCents < 0n) return -1;
    return 0;
  }

  /**
   * Factory method to create Money from integer cents.
   * @param {bigint | number | string} cents
   * @param {'COP' | 'USD'} [currency='COP']
   * @returns {Money}
   */
  static fromCents(cents, currency = 'COP') {
    return new Money(cents, currency);
  }

  /**
   * Factory method to create Money from a decimal unit amount (e.g. 50000 or "150.50")
   * Uses string parsing to prevent IEEE 754 float rounding errors.
   * @param {number | string | bigint} amount
   * @param {'COP' | 'USD'} [currency='COP']
   * @returns {Money}
   */
  static fromAmount(amount, currency = 'COP') {
    if (typeof amount === 'bigint') {
      return new Money(amount * 100n, currency);
    }

    const rawStr = String(amount).trim();
    if (!rawStr || isNaN(Number(rawStr))) {
      throw new DomainError(`[Monto Inválido] Valor numérico inválido: '${amount}'`);
    }

    const isNegative = rawStr.startsWith('-');
    const cleanStr = isNegative ? rawStr.slice(1) : rawStr;
    const parts = cleanStr.split('.');

    const integerPart = parts[0] || '0';
    let fractionPart = parts[1] || '';

    // Normalize to 2 decimal places (cents)
    if (fractionPart.length > 2) {
      // Deterministic rounding to nearest cent (half-up)
      const firstTwo = fractionPart.slice(0, 2);
      const thirdDigit = Number(fractionPart[2]);
      let centsNum = BigInt(firstTwo);
      if (thirdDigit >= 5) {
        centsNum += 1n;
      }
      fractionPart = centsNum.toString().padStart(2, '0');
    } else {
      fractionPart = fractionPart.padEnd(2, '0');
    }

    const totalCentsBigInt = BigInt(integerPart) * 100n + BigInt(fractionPart);
    return new Money(isNegative ? -totalCentsBigInt : totalCentsBigInt, currency);
  }

  /**
   * Factory method to create zero Money.
   * @param {'COP' | 'USD'} [currency='COP']
   * @returns {Money}
   */
  static zero(currency = 'COP') {
    return new Money(0n, currency);
  }

  /**
   * Adds another Money value.
   * @param {Money} other
   * @returns {Money}
   */
  add(other) {
    this.#assertSameCurrency(other);
    return new Money(this.#amountInCents + other.amountInCents, this.#currency);
  }

  /**
   * Subtracts another Money value.
   * @param {Money} other
   * @returns {Money}
   */
  subtract(other) {
    this.#assertSameCurrency(other);
    return new Money(this.#amountInCents - other.amountInCents, this.#currency);
  }

  /**
   * Multiplies money by a factor (integer, bigint, or decimal number/string).
   * Executes without IEEE-754 precision loss.
   * @param {number | bigint | string} factor
   * @returns {Money}
   */
  multiply(factor) {
    if (typeof factor === 'bigint') {
      return new Money(this.#amountInCents * factor, this.#currency);
    }

    const factorStr = String(factor).trim();
    if (isNaN(Number(factorStr))) {
      throw new DomainError(`[Factor Inválido] Multiplicador numérico inválido: '${factor}'`);
    }

    const isNegFactor = factorStr.startsWith('-');
    const cleanFactorStr = isNegFactor ? factorStr.slice(1) : factorStr;
    const parts = cleanFactorStr.split('.');

    const intPart = parts[0] || '0';
    const decPart = parts[1] || '';
    const scale = decPart.length;

    const numerator = BigInt(intPart + decPart);
    const denominator = 10n ** BigInt(scale);

    const isNegResult = (this.#amountInCents < 0n) !== isNegFactor;
    const absCents = this.#amountInCents < 0n ? -this.#amountInCents : this.#amountInCents;

    // Multiply then divide with half-up rounding
    const product = absCents * numerator;
    const quotient = product / denominator;
    const remainder = product % denominator;

    let finalCents = quotient;
    if (denominator > 1n && remainder * 2n >= denominator) {
      finalCents += 1n;
    }

    return new Money(isNegResult && finalCents !== 0n ? -finalCents : finalCents, this.#currency);
  }

  /**
   * Martin Fowler exact quotient-and-remainder distribution.
   * Guarantees that the sum of the parts equals the original amount (0 cents lost).
   * @param {number} parts - Number of allocations (must be integer > 0).
   * @returns {Money[]}
   */
  split(parts) {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new DomainError(`[Split Inválido] El número de partes debe ser un entero positivo mayor a 0, recibido: ${parts}`);
    }

    if (parts === 1) {
      return [this];
    }

    const n = BigInt(parts);
    const isNeg = this.#amountInCents < 0n;
    const absAmount = isNeg ? -this.#amountInCents : this.#amountInCents;

    const baseQuotient = absAmount / n;
    const remainder = Number(absAmount % n);

    /** @type {Money[]} */
    const results = [];
    for (let i = 0; i < parts; i++) {
      const partCents = baseQuotient + (i < remainder ? 1n : 0n);
      results.push(new Money(isNeg ? -partCents : partCents, this.#currency));
    }

    return results;
  }

  /**
   * Compares equality with another Money instance.
   * @param {Money} other
   * @returns {boolean}
   */
  equals(other) {
    if (!other || !(other instanceof Money)) return false;
    return this.#currency === other.currency && this.#amountInCents === other.amountInCents;
  }

  /**
   * Compares if this Money is greater than another.
   * @param {Money} other
   * @returns {boolean}
   */
  isGreaterThan(other) {
    this.#assertSameCurrency(other);
    return this.#amountInCents > other.amountInCents;
  }

  /**
   * Compares if this Money is greater than or equal to another.
   * @param {Money} other
   * @returns {boolean}
   */
  isGreaterThanOrEqual(other) {
    this.#assertSameCurrency(other);
    return this.#amountInCents >= other.amountInCents;
  }

  /**
   * Compares if this Money is less than another.
   * @param {Money} other
   * @returns {boolean}
   */
  isLessThan(other) {
    this.#assertSameCurrency(other);
    return this.#amountInCents < other.amountInCents;
  }

  /**
   * Compares if this Money is less than or equal to another.
   * @param {Money} other
   * @returns {boolean}
   */
  isLessThanOrEqual(other) {
    this.#assertSameCurrency(other);
    return this.#amountInCents <= other.amountInCents;
  }

  /** @returns {boolean} */
  isZero() {
    return this.#amountInCents === 0n;
  }

  /** @returns {boolean} */
  isPositive() {
    return this.#amountInCents > 0n;
  }

  /** @returns {boolean} */
  isNegative() {
    return this.#amountInCents < 0n;
  }

  /**
   * Formats money into localized currency representation.
   * @param {string} [locale] - Default 'es-CO' for COP, 'en-US' for USD.
   * @param {'COP' | 'USD'} [overrideCurrency]
   * @returns {string}
   */
  format(locale, overrideCurrency) {
    const curr = overrideCurrency || this.#currency;
    const defaultLocale = curr === 'USD' ? 'en-US' : 'es-CO';
    const loc = locale || defaultLocale;

    const formatter = new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: curr === 'COP' ? 0 : 2,
      maximumFractionDigits: 2
    });

    return formatter.format(this.amount);
  }

  /**
   * Serializable JSON representation.
   * @returns {{ amountInCents: string, currency: string, amount: number, formatted: string }}
   */
  toJSON() {
    return {
      amountInCents: this.#amountInCents.toString(),
      currency: this.#currency,
      amount: this.amount,
      formatted: this.format()
    };
  }

  /**
   * String representation.
   * @returns {string}
   */
  toString() {
    return `${this.amount.toFixed(2)} ${this.#currency} (${this.#amountInCents} cents)`;
  }

  /**
   * @private
   * @param {Money} other
   */
  #assertSameCurrency(other) {
    if (!other || !(other instanceof Money)) {
      throw new DomainError(`[Operación Inválida] El valor a operar no es una instancia de Money.`);
    }
    if (this.#currency !== other.currency) {
      throw new CurrencyMismatchError(this.#currency, other.currency);
    }
  }
}
