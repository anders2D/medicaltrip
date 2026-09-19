import { describe, it, expect } from 'vitest';
import { Money } from '../../../src/domain/values/Money';
import {
  CurrencyMismatchError,
  InvalidMoneyAmountError,
} from '../../../src/domain/errors/DomainErrors';

describe('Money Value Object — Deterministic BigInt Cents Engine', () => {
  describe('Zero Floating-Point Precision & Construction', () => {
    it('eliminates standard IEEE-754 float rounding errors (0.1 + 0.2 = 0.3)', () => {
      const m1 = Money.fromAmount('0.10', 'COP');
      const m2 = Money.fromAmount('0.20', 'COP');
      const sum = m1.add(m2);

      expect(sum.amountInCents).toBe(30n);
      expect(sum.amount).toBe(0.3);
    });

    it('creates Money from BigInt cents directly', () => {
      const m = Money.fromCents(1550000n, 'COP');
      expect(m.amountInCents).toBe(1550000n);
      expect(m.amount).toBe(15500);
      expect(m.currency).toBe('COP');
    });

    it('creates Money from number cents', () => {
      const m = Money.fromCents(2500000, 'COP');
      expect(m.amountInCents).toBe(2500000n);
      expect(m.amount).toBe(25000);
    });

    it('creates Money from string cents', () => {
      const m = Money.fromCents('3500000', 'COP');
      expect(m.amountInCents).toBe(3500000n);
    });

    it('applies deterministic half-up rounding for sub-cent decimal inputs', () => {
      // 15500.555 -> 1550056n cents
      const m1 = Money.fromAmount('15500.555', 'COP');
      expect(m1.amountInCents).toBe(1550056n);

      // 15500.554 -> 1550055n cents
      const m2 = Money.fromAmount('15500.554', 'COP');
      expect(m2.amountInCents).toBe(1550055n);
    });

    it('handles negative amounts cleanly', () => {
      const neg = Money.fromAmount('-50000', 'COP');
      expect(neg.amountInCents).toBe(-5000000n);
      expect(neg.isNegative()).toBe(true);
      expect(neg.isPositive()).toBe(false);
      expect(neg.abs().amountInCents).toBe(5000000n);
    });

    it('throws InvalidMoneyAmountError on non-numeric inputs', () => {
      expect(() => Money.fromAmount('not-a-number', 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromCents('abc', 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromAmount(NaN, 'COP')).toThrow(InvalidMoneyAmountError);
    });

    it('throws InvalidMoneyAmountError on unsupported currencies', () => {
      expect(() => Money.fromAmount('100', 'EUR' as any)).toThrow(InvalidMoneyAmountError);
    });
  });

  describe('Immutable Arithmetic Operations', () => {
    it('adds two Money instances of the same currency', () => {
      const m1 = Money.fromCents(10000000n, 'COP'); // $100.000 COP
      const m2 = Money.fromCents(4500000n, 'COP'); // $45.000 COP
      const result = m1.add(m2);

      expect(result.amountInCents).toBe(14500000n);
      expect(m1.amountInCents).toBe(10000000n); // Immutability preserved
    });

    it('subtracts two Money instances of the same currency', () => {
      const m1 = Money.fromCents(200000000n, 'COP'); // $2.000.000 COP
      const m2 = Money.fromCents(53320800n, 'COP'); // $533.208 COP
      const result = m1.subtract(m2);

      expect(result.amountInCents).toBe(146679200n); // $1.466.792 COP
    });

    it('multiplies by integer and decimal factors accurately', () => {
      const feePerHour = Money.fromAmount(15500, 'COP'); // 1550000n cents
      const result3_5h = feePerHour.multiply(3.5);

      expect(result3_5h.amountInCents).toBe(5425000n); // 54.250 COP
      expect(result3_5h.amount).toBe(54250);

      const multipliedBigInt = feePerHour.multiply(2n);
      expect(multipliedBigInt.amountInCents).toBe(3100000n);
    });

    it('splits money into N parts with zero lost cents (remainder distribution invariant)', () => {
      // 100 cents split 3 ways: 34 + 33 + 33 = 100
      const hundredCents = Money.fromCents(100n, 'COP');
      const split3 = hundredCents.split(3);

      expect(split3.length).toBe(3);
      expect(split3[0].amountInCents).toBe(34n);
      expect(split3[1].amountInCents).toBe(33n);
      expect(split3[2].amountInCents).toBe(33n);

      const sum = split3.reduce((acc, part) => acc.add(part), Money.zero('COP'));
      expect(sum.equals(hundredCents)).toBe(true);

      // 1000 COP (100000n cents) split 7 ways
      const thousandCop = Money.fromAmount(1000, 'COP');
      const split7 = thousandCop.split(7);
      expect(split7.length).toBe(7);

      const sum7 = split7.reduce((acc, part) => acc.add(part), Money.zero('COP'));
      expect(sum7.amountInCents).toBe(thousandCop.amountInCents);
    });

    it('throws CurrencyMismatchError when operating between COP and USD', () => {
      const cop = Money.fromAmount(100000, 'COP');
      const usd = Money.fromAmount(25, 'USD');

      expect(() => cop.add(usd)).toThrow(CurrencyMismatchError);
      expect(() => cop.subtract(usd)).toThrow(CurrencyMismatchError);
      expect(() => cop.isGreaterThan(usd)).toThrow(CurrencyMismatchError);
    });
  });

  describe('Currency Conversion & Formatting', () => {
    it('converts COP to USD and USD to COP with exchange rate', () => {
      // 1 USD = 4000 COP => exchange rate 1 USD = 4000 COP => 1 COP = 0.00025 USD
      const usd100 = Money.fromAmount(100, 'USD');
      const convertedToCop = usd100.convert(4000, 'COP');
      expect(convertedToCop.currency).toBe('COP');
      expect(convertedToCop.amount).toBe(400000);

      const cop400k = Money.fromAmount(400000, 'COP');
      const convertedToUsd = cop400k.convert(0.00025, 'USD');
      expect(convertedToUsd.currency).toBe('USD');
      expect(convertedToUsd.amount).toBe(100);
    });

    it('formats COP amounts with Colombian thousands dot formatting', () => {
      const m1 = Money.fromAmount(15500, 'COP');
      expect(m1.format()).toBe('$ 15.500 COP');

      const m2 = Money.fromAmount(2098100, 'COP');
      expect(m2.format()).toBe('$ 2.098.100 COP');

      const neg = Money.fromAmount(-466792, 'COP');
      expect(neg.format()).toBe('-$ 466.792 COP');
    });

    it('formats USD amounts with comma and two decimal places', () => {
      const m1 = Money.fromAmount('3500.00', 'USD');
      expect(m1.format()).toBe('$3,500.00 USD');

      const m2 = Money.fromAmount('150.50', 'USD');
      expect(m2.format()).toBe('$150.50 USD');
    });
  });
});
