import test from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '../../../src/domain/Money.js';

test('F01: BigInt Money Pattern — Exact Integer Cents Math', async (t) => {
    await t.test('1. Eradicates IEEE-754 floating point errors on fractional cents', () => {
        const m1 = Money.fromUnits(0.1, 'COP');
        const m2 = Money.fromUnits(0.2, 'COP');
        const sum = m1.add(m2);
        assert.equal(sum.cents, 30n, '0.1 + 0.2 must exactly equal 30 cents');
        assert.equal(sum.units, 0.3);
    });

    await t.test('2. Subtraction and negative balance detection', () => {
        const advance = Money.fromUnits(100000, 'COP');
        const expenses = Money.fromUnits(150000, 'COP');
        const net = expenses.subtract(advance);
        assert.equal(net.cents, 5000000n);
        assert.equal(net.isPositive(), true);
        assert.equal(net.isNegative(), false);
        assert.equal(net.isZero(), false);

        const refund = advance.subtract(expenses);
        assert.equal(refund.cents, -5000000n);
        assert.equal(refund.isNegative(), true);
    });

    await t.test('3. Accurate scaled hourly rate multiplication', () => {
        // Medical Trip standard guide rate: $15.500 COP / hr
        const ratePerHour = Money.fromUnits(15500, 'COP');
        const total = ratePerHour.multiply(3.5); // 3.5 hours
        assert.equal(total.units, 54250);
        assert.equal(total.cents, 5425000n);

        // Complex duration: 7.75 hours
        const longShift = ratePerHour.multiply(7.75);
        assert.equal(longShift.cents, 12012500n);
        assert.equal(longShift.units, 120125);
    });

    await t.test('4. Currency safety invariant prevents cross-currency arithmetic', () => {
        const cop = Money.fromUnits(50000, 'COP');
        const usd = Money.fromUnits(50, 'USD');
        assert.throws(() => cop.add(usd), /Incompatibilidad de monedas/);
        assert.throws(() => cop.subtract(usd), /Incompatibilidad de monedas/);
    });

    await t.test('5. Locale formatting for COP and USD', () => {
        const copMoney = Money.fromUnits(2098100, 'COP');
        const formattedCop = copMoney.format();
        assert.ok(formattedCop.includes('2.098.100') || formattedCop.includes('2,098,100') || formattedCop.includes('2098100'));

        const usdMoney = Money.fromUnits(150.50, 'USD');
        const formattedUsd = usdMoney.format();
        assert.ok(formattedUsd.includes('150.50') || formattedUsd.includes('150,50'));
    });

    await t.test('6. Factory constructors and immutability (Object.freeze)', () => {
        const m = Money.fromCents(5000000n, 'COP');
        assert.equal(m.cents, 5000000n);
        assert.equal(m.currency, 'COP');
        assert.throws(() => {
            m._cents = 0n;
        });
    });
});
