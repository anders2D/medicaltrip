/**
 * Medical Trip Calendar App — Domain Value Object: Money
 * Patrón Money (Martin Fowler): Cero errores de coma flotante IEEE 754.
 * Todos los cálculos operan estrictamente en centavos enteros con BigInt.
 */

export class Money {
    /**
     * @param {number|bigint} amountInCents Monto en centavos (ej. $35.000 COP = 3500000n)
     * @param {string} currency 'COP' | 'USD'
     */
    constructor(amountInCents, currency = 'COP') {
        this._cents = typeof amountInCents === 'bigint' ? amountInCents : BigInt(Math.round(Number(amountInCents) || 0));
        this._currency = currency.toUpperCase();
        Object.freeze(this);
    }

    static fromUnits(units, currency = 'COP') {
        return new Money(BigInt(Math.round((Number(units) || 0) * 100)), currency);
    }

    static fromCents(cents, currency = 'COP') {
        return new Money(cents, currency);
    }

    static zero(currency = 'COP') {
        return new Money(0n, currency);
    }

    get cents() {
        return this._cents;
    }

    get units() {
        return Number(this._cents) / 100;
    }

    get currency() {
        return this._currency;
    }

    add(other) {
        this._assertSameCurrency(other);
        return new Money(this._cents + other.cents, this._currency);
    }

    subtract(other) {
        this._assertSameCurrency(other);
        return new Money(this._cents - other.cents, this._currency);
    }

    multiply(factor) {
        const scale = 10000n;
        const scaledFactor = BigInt(Math.round(factor * 10000));
        const newCents = (this._cents * scaledFactor) / scale;
        return new Money(newCents, this._currency);
    }

    isPositive() {
        return this._cents > 0n;
    }

    isZero() {
        return this._cents === 0n;
    }

    isNegative() {
        return this._cents < 0n;
    }

    format() {
        const value = this.units;
        if (this._currency === 'COP') {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0
            }).format(value);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    }

    _assertSameCurrency(other) {
        if (!other || this._currency !== other.currency) {
            throw new Error(`[Money Error]: Incompatibilidad de monedas (${this._currency} vs ${other?.currency})`);
        }
    }
}
