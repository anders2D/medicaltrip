/**
 * Medical Trip Domain — Value Object: Money
 * Patrón Money (Martin Fowler): Erradicación total de errores de coma flotante (IEEE 754).
 * Todos los cálculos se realizan en la unidad fraccionaria más pequeña (Centavos de COP / USD).
 */

export class Money {
    /**
     * @param {number|bigint} amountInCents Monto en centavos (ej: $35.000 COP = 3500000 centavos)
     * @param {string} currency 'COP' | 'USD'
     */
    constructor(amountInCents, currency = 'COP') {
        this._cents = typeof amountInCents === 'bigint' ? amountInCents : BigInt(Math.round(amountInCents));
        this._currency = currency.toUpperCase();
        Object.freeze(this);
    }

    static fromUnits(units, currency = 'COP') {
        return new Money(BigInt(Math.round(units * 100)), currency);
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
        if (this._currency !== other.currency) {
            throw new Error(`Monedas incompatibles: ${this._currency} vs ${other.currency}`);
        }
    }
}
