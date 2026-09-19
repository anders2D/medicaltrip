import { describe, it, expect } from 'vitest';
import { Money, CurrencyCode } from '../../../src/domain/values/Money';
import {
  OperativeTerritory,
  FORBIDDEN_NON_OPERATIVE_ZONES,
  ALLOWED_CANONICAL_CORRIDORS,
  OPERATIVE_BOUNDING_BOXES,
} from '../../../src/domain/values/OperativeTerritory';
import { Coordinates } from '../../../src/domain/values/Coordinates';
import {
  DomainError,
  NonOperativeTerritoryError,
  CurrencyMismatchError,
  InvalidMoneyAmountError,
  InvariantViolationError,
} from '../../../src/domain/errors/DomainErrors';

describe('Challenger 1 — Adversarial Domain & Math Verification Suite', () => {
  describe('A. Money Arithmetic & Edge Cases', () => {
    describe('1. Zero Cents Invariants', () => {
      it('creates zero Money instances for COP and USD', () => {
        const zeroCop = Money.zero('COP');
        const zeroUsd = Money.zero('USD');

        expect(zeroCop.amountInCents).toBe(0n);
        expect(zeroCop.amount).toBe(0);
        expect(zeroCop.currency).toBe('COP');
        expect(zeroCop.isZero()).toBe(true);
        expect(zeroCop.isPositive()).toBe(false);
        expect(zeroCop.isNegative()).toBe(false);

        expect(zeroUsd.amountInCents).toBe(0n);
        expect(zeroUsd.amount).toBe(0);
        expect(zeroUsd.currency).toBe('USD');
        expect(zeroUsd.isZero()).toBe(true);
      });

      it('creates zero Money from various representations', () => {
        expect(Money.fromCents(0n).amountInCents).toBe(0n);
        expect(Money.fromCents(0).amountInCents).toBe(0n);
        expect(Money.fromCents('0').amountInCents).toBe(0n);
        expect(Money.fromAmount(0).amountInCents).toBe(0n);
        expect(Money.fromAmount('0').amountInCents).toBe(0n);
        expect(Money.fromAmount('0.00').amountInCents).toBe(0n);
        expect(Money.fromAmount('-0').amountInCents).toBe(0n);
      });

      it('acts as identity element in addition and subtraction', () => {
        const m = Money.fromAmount(15500, 'COP');
        const zero = Money.zero('COP');

        expect(m.add(zero).equals(m)).toBe(true);
        expect(zero.add(m).equals(m)).toBe(true);
        expect(m.subtract(zero).equals(m)).toBe(true);
        expect(m.subtract(m).equals(zero)).toBe(true);
      });

      it('multiplication by zero yields zero', () => {
        const m = Money.fromAmount(15500, 'COP');
        expect(m.multiply(0).amountInCents).toBe(0n);
        expect(m.multiply(0n).amountInCents).toBe(0n);
        expect(m.multiply(0.0).amountInCents).toBe(0n);
      });

      it('splitting zero yields exact zero slices', () => {
        const zero = Money.zero('COP');
        const slices = zero.split(5);
        expect(slices.length).toBe(5);
        for (const s of slices) {
          expect(s.amountInCents).toBe(0n);
        }
        const sum = slices.reduce((acc, s) => acc.add(s), Money.zero('COP'));
        expect(sum.equals(zero)).toBe(true);
      });

      it('formats zero correctly for COP and USD', () => {
        expect(Money.zero('COP').format()).toBe('$ 0 COP');
        expect(Money.zero('USD').format()).toBe('$0.00 USD');
      });
    });

    describe('2. Negative Values & Negation Invariants', () => {
      it('creates and identifies negative amounts correctly', () => {
        const neg = Money.fromAmount('-15500.50', 'COP');
        expect(neg.amountInCents).toBe(-1550050n);
        expect(neg.isNegative()).toBe(true);
        expect(neg.isPositive()).toBe(false);
        expect(neg.isZero()).toBe(false);
        expect(neg.units).toBe(-15500.5);
      });

      it('performs addition and subtraction with negative values', () => {
        const neg10 = Money.fromCents(-1000n, 'COP');
        const neg20 = Money.fromCents(-2000n, 'COP');
        const pos30 = Money.fromCents(3000n, 'COP');

        // (-10) + (-20) = -30
        expect(neg10.add(neg20).amountInCents).toBe(-3000n);
        // (-10) + 30 = 20
        expect(neg10.add(pos30).amountInCents).toBe(2000n);
        // (-10) - (-20) = 10
        expect(neg10.subtract(neg20).amountInCents).toBe(1000n);
        // 30 - (-10) = 40
        expect(pos30.subtract(neg10).amountInCents).toBe(4000n);
      });

      it('supports abs() and negate() operations', () => {
        const neg = Money.fromCents(-5000000n, 'COP');
        const pos = Money.fromCents(5000000n, 'COP');

        expect(neg.abs().amountInCents).toBe(5000000n);
        expect(pos.abs().amountInCents).toBe(5000000n);
        expect(neg.negate().amountInCents).toBe(5000000n);
        expect(pos.negate().amountInCents).toBe(-5000000n);
        expect(Money.zero().negate().amountInCents).toBe(0n);
        expect(Money.zero().abs().amountInCents).toBe(0n);
      });

      it('multiplies with negative scalars and negative amounts', () => {
        const pos = Money.fromCents(1000n, 'COP');
        const neg = Money.fromCents(-1000n, 'COP');

        expect(pos.multiply(-2).amountInCents).toBe(-2000n);
        expect(pos.multiply(-2n).amountInCents).toBe(-2000n);
        expect(neg.multiply(2).amountInCents).toBe(-2000n);
        expect(neg.multiply(2n).amountInCents).toBe(-2000n);
        expect(neg.multiply(-2).amountInCents).toBe(2000n);
        expect(neg.multiply(-2n).amountInCents).toBe(2000n);
      });

      it('splits negative amounts conserving remainder (sum === original)', () => {
        // -100 cents split 3 ways: -34, -33, -33 -> sum = -100
        const negHundred = Money.fromCents(-100n, 'COP');
        const split3 = negHundred.split(3);

        expect(split3.length).toBe(3);
        expect(split3[0].amountInCents).toBe(-34n);
        expect(split3[1].amountInCents).toBe(-33n);
        expect(split3[2].amountInCents).toBe(-33n);

        const sum3 = split3.reduce((acc, p) => acc.add(p), Money.zero('COP'));
        expect(sum3.equals(negHundred)).toBe(true);

        // -1 cent split 3 ways: -1, 0, 0 -> sum = -1
        const negOne = Money.fromCents(-1n, 'COP');
        const splitOne = negOne.split(3);
        expect(splitOne[0].amountInCents).toBe(-1n);
        expect(splitOne[1].amountInCents).toBe(0n);
        expect(splitOne[2].amountInCents).toBe(0n);
        const sumOne = splitOne.reduce((acc, p) => acc.add(p), Money.zero('COP'));
        expect(sumOne.equals(negOne)).toBe(true);
      });

      it('formats negative amounts with correct currency sign placement', () => {
        const negCop = Money.fromAmount(-466792, 'COP');
        expect(negCop.format()).toBe('-$ 466.792 COP');

        const negUsd = Money.fromAmount('-150.50', 'USD');
        expect(negUsd.format()).toBe('-$150.50 USD');
      });
    });

    describe('3. Large Integer Cents (Billions & Trillions beyond Number.MAX_SAFE_INTEGER)', () => {
      it('handles multi-billion COP amounts accurately', () => {
        // 500 Billion COP = 500,000,000,000 * 100 = 50,000,000,000,000n cents
        const big1 = Money.fromCents(50000000000000n, 'COP');
        const big2 = Money.fromCents(30000000000000n, 'COP');

        const sum = big1.add(big2);
        expect(sum.amountInCents).toBe(80000000000000n);

        const diff = big1.subtract(big2);
        expect(diff.amountInCents).toBe(20000000000000n);
      });

      it('handles amounts exceeding Javascript Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)', () => {
        // 1 Quintillion cents (10^18)
        const huge1 = Money.fromCents(1000000000000000000n, 'COP');
        const huge2 = Money.fromCents(2000000000000000000n, 'COP');

        const sum = huge1.add(huge2);
        expect(sum.amountInCents).toBe(3000000000000000000n);

        const multiplied = huge1.multiply(3n);
        expect(multiplied.amountInCents).toBe(3000000000000000000n);

        const splitHuge = huge1.split(3);
        expect(splitHuge.length).toBe(3);
        const sumSplit = splitHuge.reduce((acc, p) => acc.add(p), Money.zero('COP'));
        expect(sumSplit.equals(huge1)).toBe(true);
      });

      it('formats large numbers with dot and comma grouping', () => {
        const bigCop = Money.fromAmount(1234567890, 'COP');
        expect(bigCop.format()).toBe('$ 1.234.567.890 COP');

        const bigUsd = Money.fromAmount('1234567890.50', 'USD');
        expect(bigUsd.format()).toBe('$1,234,567,890.50 USD');
      });
    });

    describe('4. Decimal Precision & Half-Up Sub-Cent Rounding', () => {
      it('rounds sub-cents half-up deterministically on construction', () => {
        // .005 rounds up to 1 cent
        expect(Money.fromAmount('100.005', 'COP').amountInCents).toBe(10001n);
        // .0049 rounds down to 0 cent
        expect(Money.fromAmount('100.0049', 'COP').amountInCents).toBe(10000n);
        // .995 rounds up to 100 cents (1 unit increase)
        expect(Money.fromAmount('100.995', 'COP').amountInCents).toBe(10100n);
        // Multi-decimal sub-cents
        expect(Money.fromAmount('15500.555555', 'COP').amountInCents).toBe(1550056n);
        expect(Money.fromAmount('15500.554444', 'COP').amountInCents).toBe(1550055n);
      });

      it('multiplies by fractional hours with half-up rounding at scale 10^9', () => {
        const hourly = Money.fromAmount(15500, 'COP'); // 1550000n cents

        // 3.5 hours = 54.250 COP (5425000n cents)
        expect(hourly.multiply(3.5).amountInCents).toBe(5425000n);

        // 1/3 hour (0.333333333...) -> 15500 * (1/3) = 5166.6666... COP -> 516667n cents
        const thirdHour = hourly.multiply(1 / 3);
        expect(thirdHour.amountInCents).toBe(516667n);

        // 2/3 hour -> 15500 * (2/3) = 10333.3333... COP -> 1033333n cents
        const twoThirdsHour = hourly.multiply(2 / 3);
        expect(twoThirdsHour.amountInCents).toBe(1033333n);

        // Invariant: thirdHour + twoThirdsHour === hourly (516667 + 1033333 = 1550000)
        expect(thirdHour.add(twoThirdsHour).equals(hourly)).toBe(true);
      });

      it('rejects invalid multiplication factors (Infinity, NaN, -Infinity)', () => {
        const m = Money.fromAmount(1000, 'COP');
        expect(() => m.multiply(NaN)).toThrow(InvalidMoneyAmountError);
        expect(() => m.multiply(Infinity)).toThrow(InvalidMoneyAmountError);
        expect(() => m.multiply(-Infinity)).toThrow(InvalidMoneyAmountError);
      });
    });

    describe('5. Exhaustive Split Invariant Verification', () => {
      it('conserves total cents across various divisors [1 to 100]', () => {
        const testAmounts = [
          Money.fromCents(1n, 'COP'),
          Money.fromCents(2n, 'COP'),
          Money.fromCents(3n, 'COP'),
          Money.fromCents(7n, 'COP'),
          Money.fromCents(10n, 'COP'),
          Money.fromCents(99n, 'COP'),
          Money.fromCents(100n, 'COP'),
          Money.fromCents(1550000n, 'COP'),
          Money.fromCents(100000000n, 'COP'),
          Money.fromCents(-100n, 'COP'),
          Money.fromCents(-1550000n, 'COP'),
        ];

        const divisors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 17, 23, 50, 100];

        for (const amount of testAmounts) {
          for (const div of divisors) {
            const parts = amount.split(div);
            expect(parts.length).toBe(div);

            // Invariant 1: Sum of parts must equal original amount
            const sum = parts.reduce((acc, p) => acc.add(p), Money.zero('COP'));
            expect(sum.amountInCents).toBe(amount.amountInCents);

            // Invariant 2: Max difference between any two parts is <= 1 cent
            const centsArr = parts.map((p) => p.amountInCents);
            const minCents = centsArr.reduce((min, c) => (c < min ? c : min), centsArr[0]);
            const maxCents = centsArr.reduce((max, c) => (c > max ? c : max), centsArr[0]);
            const diff = maxCents - minCents;
            expect(diff <= 1n).toBe(true);
          }
        }
      });

      it('rejects invalid split partitions (0, negative, floats, non-numeric)', () => {
        const m = Money.fromAmount(1000, 'COP');
        expect(() => m.split(0)).toThrow(InvalidMoneyAmountError);
        expect(() => m.split(-1)).toThrow(InvalidMoneyAmountError);
        expect(() => m.split(2.5)).toThrow(InvalidMoneyAmountError);
        expect(() => m.split(NaN)).toThrow(InvalidMoneyAmountError);
        expect(() => m.split(Infinity)).toThrow(InvalidMoneyAmountError);
      });
    });

    describe('6. Currency Invariants & Operations', () => {
      it('throws CurrencyMismatchError on mixed-currency operations', () => {
        const cop = Money.fromAmount(100000, 'COP');
        const usd = Money.fromAmount(25, 'USD');

        expect(() => cop.add(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.subtract(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.isGreaterThan(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.isLessThan(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.isGreaterThanOrEqual(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.isLessThanOrEqual(usd)).toThrow(CurrencyMismatchError);
      });

      it('equals() returns false for different currencies even with same cents', () => {
        const cop = Money.fromCents(100n, 'COP');
        const usd = Money.fromCents(100n, 'USD');
        expect(cop.equals(usd)).toBe(false);
      });

      it('converts currencies using exchange rate correctly', () => {
        const cop = Money.fromAmount(400000, 'COP');
        // 1 COP = 0.00025 USD
        const usd = cop.convert(0.00025, 'USD');
        expect(usd.currency).toBe('USD');
        expect(usd.amountInCents).toBe(10000n); // $100.00 USD

        // Converting same currency returns identity
        const same = cop.convert(1, 'COP');
        expect(same.equals(cop)).toBe(true);
      });

      it('rejects invalid currency conversion rates (<= 0, NaN, non-finite)', () => {
        const cop = Money.fromAmount(1000, 'COP');
        expect(() => cop.convert(0, 'USD')).toThrow(InvalidMoneyAmountError);
        expect(() => cop.convert(-1, 'USD')).toThrow(InvalidMoneyAmountError);
        expect(() => cop.convert(NaN, 'USD')).toThrow(InvalidMoneyAmountError);
        expect(() => cop.convert(Infinity, 'USD')).toThrow(InvalidMoneyAmountError);
      });
    });

    describe('7. Float Leak Elimination & Sequential Accumulation', () => {
      it('accumulates 10,000 transactions of $0.10 COP with zero float drift', () => {
        let runningSum = Money.zero('COP');
        const tenCents = Money.fromAmount('0.10', 'COP'); // 10n cents

        for (let i = 0; i < 10000; i++) {
          runningSum = runningSum.add(tenCents);
        }

        // 10,000 * 10n cents = 100,000n cents = $1,000.00 COP
        expect(runningSum.amountInCents).toBe(100000n);
        expect(runningSum.amount).toBe(1000);
        expect(typeof runningSum.amountInCents).toBe('bigint');
      });

      it('maintains strict immutability (frozen object)', () => {
        const m = Money.fromAmount(1000, 'COP');
        expect(Object.isFrozen(m)).toBe(true);
        expect(() => {
          (m as any).amountInCents = 999n;
        }).toThrow();
      });
    });
  });

  describe('B. OperativeTerritory & Geo-Fencing Invariants', () => {
    describe('1. Forbidden Non-Operative Zones (Fail-Fast with NonOperativeTerritoryError)', () => {
      const forbiddenList = [
        'MOCOA',
        'LETICIA',
        'AMAZONAS',
        'TUMACO',
        'NARINO',
        'ARAUCA',
        'GUAVIARE',
        'MITU',
        'VAUPES',
        'INIRIDA',
        'GUAINIA',
        'PUERTO_CARRENO',
        'VICHADA',
        'CHOCO',
        'LA_GUAJIRA',
        'PUTUMAYO',
      ];

      for (const zone of forbiddenList) {
        it(`rejects forbidden zone: ${zone}`, () => {
          expect(() => new OperativeTerritory(zone)).toThrow(NonOperativeTerritoryError);
        });
      }

      it('rejects forbidden zones with lowercase, diacritics, whitespace, and punctuation', () => {
        const adversarialInputs = [
          'mocoa',
          'Mocóa',
          '  mocoa  ',
          'hospital de mocoa putumayo',
          'Leticia',
          'Letícia',
          'Hotel Decameron en Leticia Amazonas',
          'tumaco, nariño',
          'San Vicente de Arauca - Hospital',
          'San José del Guaviare',
          'Mitú (Vaupés)',
          'Puerto Inírida, Guainía',
          'Puerto Carreño, Vichada',
          'Quibdó, Chocó',
          'Riohacha, La Guajira',
          'Puerto Asís, Putumayo',
        ];

        for (const input of adversarialInputs) {
          expect(
            () => new OperativeTerritory(input),
            `Expected '${input}' to be rejected as forbidden`
          ).toThrow(NonOperativeTerritoryError);
        }
      });
    });

    describe('2. Authorized Operational Corridors', () => {
      it('accepts all canonical approved corridors', () => {
        for (const corridor of ALLOWED_CANONICAL_CORRIDORS) {
          const terr = new OperativeTerritory(corridor);
          expect(terr.canonicalCorridor).toBe(corridor);
        }
      });

      it('accepts and normalizes known medical facilities and hotels in Medellín corridor', () => {
        const approvedLocations = [
          { input: 'Clínica Clofán Ciudad del Río', expectedCorridor: 'MEDELLIN' },
          { input: 'Hospital Pablo Tobón Uribe Robledo', expectedCorridor: 'MEDELLIN' },
          { input: 'Clínica Cardio VID Medellín', expectedCorridor: 'MEDELLIN' },
          { input: 'CIMA Sede Poblado', expectedCorridor: 'MEDELLIN' },
          { input: 'CES Sede Oviedo El Poblado', expectedCorridor: 'MEDELLIN' },
          { input: 'Laboratorio Echavarría Laureles', expectedCorridor: 'MEDELLIN' },
          { input: 'Hotel Inntu Laureles', expectedCorridor: 'MEDELLIN' },
          { input: 'Edificio Park 42 Poblado', expectedCorridor: 'MEDELLIN' },
          { input: 'Hotel Novelty Suites El Poblado', expectedCorridor: 'MEDELLIN' },
          { input: 'Droguería Cruz Verde Santa Fe', expectedCorridor: 'MEDELLIN' },
          { input: 'Farmacia Pasteur Robledo', expectedCorridor: 'MEDELLIN' },
          { input: 'Locatel Laureles', expectedCorridor: 'MEDELLIN' },
          { input: 'Aeropuerto Internacional JMC Rionegro', expectedCorridor: 'RIONEGRO' },
          { input: 'Llanogrande Rionegro', expectedCorridor: 'RIONEGRO' },
          { input: 'Villa Anita Envigado', expectedCorridor: 'ENVIGADO' },
          { input: 'Casa de Reposo Sabaneta', expectedCorridor: 'SABANETA' },
          { input: 'Consultorio Médico Itagüí', expectedCorridor: 'ITAGUI' },
          { input: 'Clínica Bello Norte', expectedCorridor: 'BELLO' },
          { input: 'Hospital Manizales Caldas', expectedCorridor: 'MANIZALES' },
          { input: 'Clínica Los Rosales Pereira', expectedCorridor: 'PEREIRA' },
          { input: 'Aeropuerto El Dorado Bogotá', expectedCorridor: 'BOGOTA' },
        ];

        for (const { input, expectedCorridor } of approvedLocations) {
          const terr = new OperativeTerritory(input);
          expect(terr.canonicalCorridor).toBe(expectedCorridor);
        }
      });

      it('rejects unauthorized cities not in corridor map (e.g. Cali, Barranquilla, Cartagena, Miami)', () => {
        const unauthorizedCities = [
          'Cali Centro',
          'Barranquilla Norte',
          'Cartagena Bocagrande',
          'Bucaramanga Cabecera',
          'Cúcuta Santander',
          'Miami Florida',
          'Madrid España',
        ];

        for (const city of unauthorizedCities) {
          expect(() => new OperativeTerritory(city)).toThrow(NonOperativeTerritoryError);
        }
      });
    });

    describe('3. Geospatial Bounding Boxes & Coordinates Invariants', () => {
      it('accepts valid coordinates inside each operational bounding box', () => {
        const validGeoPoints = [
          // Medellín Central (Antioquia)
          { name: 'Clínica Clofán', coords: new Coordinates(6.2215, -75.5714), corridor: 'MEDELLIN' },
          // JMC Airport
          { name: 'Aeropuerto JMC', coords: new Coordinates(6.1645, -75.4267), corridor: 'RIONEGRO' },
          // Manizales
          { name: 'Hospital Manizales', coords: new Coordinates(5.0689, -75.5174), corridor: 'MANIZALES' },
          // Pereira
          { name: 'Clínica Pereira', coords: new Coordinates(4.8133, -75.6961), corridor: 'PEREIRA' },
          // Bogotá El Dorado
          { name: 'Aeropuerto El Dorado', coords: new Coordinates(4.7016, -74.1469), corridor: 'BOGOTA' },
        ];

        for (const pt of validGeoPoints) {
          const terr = new OperativeTerritory({ name: pt.name, coordinates: pt.coords });
          expect(terr.coordinates?.latitude).toBe(pt.coords.latitude);
          expect(terr.coordinates?.longitude).toBe(pt.coords.longitude);
          expect(terr.canonicalCorridor).toBe(pt.corridor);
        }
      });

      it('accepts exact bounding box edge coordinates', () => {
        // Test box edges of ANTIOQUIA_CENTRAL: [5.90, 6.50] x [-75.80, -75.30]
        const minCorner = new Coordinates(5.90, -75.80);
        const maxCorner = new Coordinates(6.50, -75.30);

        expect(new OperativeTerritory({ name: 'Clínica Borde Min', coordinates: minCorner })).toBeDefined();
        expect(new OperativeTerritory({ name: 'Clínica Borde Max', coordinates: maxCorner })).toBeDefined();
      });

      it('rejects coordinates immediately outside bounding box edges', () => {
        // ANTIOQUIA_CENTRAL: [5.90, 6.50] x [-75.80, -75.30]
        const justBelowLat = new Coordinates(5.899999, -75.50);
        const justAboveLat = new Coordinates(6.500001, -75.50);
        const justBelowLng = new Coordinates(6.20, -75.800001);
        const justAboveLng = new Coordinates(6.20, -75.299999);

        expect(() => new OperativeTerritory({ name: 'Clínica', coordinates: justBelowLat })).toThrow(
          NonOperativeTerritoryError
        );
        expect(() => new OperativeTerritory({ name: 'Clínica', coordinates: justAboveLat })).toThrow(
          NonOperativeTerritoryError
        );
        expect(() => new OperativeTerritory({ name: 'Clínica', coordinates: justBelowLng })).toThrow(
          NonOperativeTerritoryError
        );
        expect(() => new OperativeTerritory({ name: 'Clínica', coordinates: justAboveLng })).toThrow(
          NonOperativeTerritoryError
        );
      });

      it('rejects coordinates belonging to forbidden non-operative cities', () => {
        const forbiddenCoords = [
          { name: 'Mocoa', coords: new Coordinates(1.15, -76.65) },
          { name: 'Leticia', coords: new Coordinates(-4.21, -69.94) },
          { name: 'Tumaco', coords: new Coordinates(1.80, -78.76) },
          { name: 'Arauca', coords: new Coordinates(7.08, -70.76) },
          { name: 'Mitú', coords: new Coordinates(1.25, -70.23) },
          { name: 'Puerto Carreño', coords: new Coordinates(6.18, -67.48) },
          { name: 'Riohacha', coords: new Coordinates(11.54, -72.91) },
          { name: 'Quibdó', coords: new Coordinates(5.69, -76.66) },
          { name: 'NYC', coords: new Coordinates(40.7128, -74.006) },
          { name: 'Null Island', coords: new Coordinates(0, 0) },
        ];

        for (const fc of forbiddenCoords) {
          expect(
            () => new OperativeTerritory({ name: 'Punto', coordinates: fc.coords }),
            `Expected coords for '${fc.name}' to fail fast`
          ).toThrow(NonOperativeTerritoryError);
        }
      });

      it('Coordinates value object strictly validates latitude/longitude boundaries', () => {
        // Valid edge boundaries
        expect(new Coordinates(90, 180)).toBeDefined();
        expect(new Coordinates(-90, -180)).toBeDefined();

        // Invalid boundaries
        expect(() => new Coordinates(90.0001, 0)).toThrow(InvariantViolationError);
        expect(() => new Coordinates(-90.0001, 0)).toThrow(InvariantViolationError);
        expect(() => new Coordinates(0, 180.0001)).toThrow(InvariantViolationError);
        expect(() => new Coordinates(0, -180.0001)).toThrow(InvariantViolationError);
        expect(() => new Coordinates(NaN, 0)).toThrow(InvariantViolationError);
        expect(() => new Coordinates(0, NaN)).toThrow(InvariantViolationError);
        expect(() => new Coordinates(Infinity, 0)).toThrow(InvariantViolationError);
      });

      it('Haversine distance calculation is accurate and symmetric', () => {
        const medellin = new Coordinates(6.2442, -75.5812);
        const jmc = new Coordinates(6.1645, -75.4267);

        // Distance to self is 0
        expect(medellin.distanceTo(medellin)).toBe(0);

        // Symmetry: dist(A, B) === dist(B, A)
        const dist1 = medellin.distanceInKm(jmc);
        const dist2 = jmc.distanceInKm(medellin);
        expect(Math.abs(dist1 - dist2)).toBeLessThan(0.0001);

        // Approximate straight line distance between Medellín and JMC is ~19-20 km
        expect(dist1).toBeGreaterThan(18);
        expect(dist1).toBeLessThan(22);

        expect(medellin.isWithinRadius(jmc, 25000)).toBe(true); // 25 km radius
        expect(medellin.isWithinRadius(jmc, 10000)).toBe(false); // 10 km radius
      });
    });

    describe('4. Deterministic Error Hierarchy', () => {
      it('ensures all domain errors inherit from DomainError', () => {
        const nonOp = new NonOperativeTerritoryError('Mocoa');
        expect(nonOp instanceof DomainError).toBe(true);
        expect(nonOp instanceof Error).toBe(true);
        expect(nonOp.code).toBe('NON_OPERATIVE_TERRITORY_ERROR');
        expect(nonOp.territoryName).toBe('Mocoa');

        const currErr = new CurrencyMismatchError('COP', 'USD');
        expect(currErr instanceof DomainError).toBe(true);
        expect(currErr.code).toBe('CURRENCY_MISMATCH_ERROR');

        const moneyErr = new InvalidMoneyAmountError('abc');
        expect(moneyErr instanceof DomainError).toBe(true);
        expect(moneyErr.code).toBe('INVALID_MONEY_AMOUNT_ERROR');

        const invErr = new InvariantViolationError('violación');
        expect(invErr instanceof DomainError).toBe(true);
        expect(invErr.code).toBe('INVARIANT_VIOLATION_ERROR');
      });
    });
  });
});
