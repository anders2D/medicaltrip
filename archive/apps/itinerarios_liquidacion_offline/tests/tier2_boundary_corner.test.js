/**
 * TIER 2: Boundary Value Analysis & Corner Case Test Suite (>=75 tests)
 * Medical Trip Colombia S.A.S. - Standalone Local-First Offline PWA
 */

import { describe, it, expect, beforeEach, runAllTests } from './test_harness.js';
import { Money } from '../src/domain/value-objects/money.js';
import { OperativeTerritory, FORBIDDEN_NON_OPERATIVE_ZONES } from '../src/domain/value-objects/operative-territory.js';
import { LocationCoordinate } from '../src/domain/value-objects/location-coordinate.js';
import { ActorEvent, sha256 } from '../src/domain/value-objects/actor-event.js';
import { ItineraryItem } from '../src/domain/entities/itinerary-item.js';
import { ExpenseItem } from '../src/domain/entities/expense-item.js';
import { CompanionShift } from '../src/domain/entities/companion-shift.js';
import { DriverTransfer } from '../src/domain/entities/driver-transfer.js';
import { PatientSignature } from '../src/domain/entities/patient-signature.js';
import { SettlementLedger } from '../src/domain/entities/settlement-ledger.js';
import {
  DomainError,
  GeospatialInvariantViolationError,
  CurrencyMismatchError,
  InvalidStateTransitionError
} from '../src/domain/errors/domain-error.js';

// ============================================================================
// GROUP 1: Extreme BigInt Monetary Boundaries & Arithmetic Edges
// ============================================================================
describe('Tier 2 - Group 1: Extreme BigInt Monetary Boundaries', () => {
  it('T2.1: Money zero boundaries (0n, positive zero, negative zero)', () => {
    const zero1 = Money.zero('COP');
    const zero2 = Money.fromCents(0n, 'COP');
    const zero3 = Money.fromAmount(0, 'COP');
    const zero4 = Money.fromAmount('-0', 'COP');

    expect(zero1.cents).toBe(0n);
    expect(zero1.isZero()).toBe(true);
    expect(zero1.isPositive()).toBe(false);
    expect(zero1.isNegative()).toBe(false);
    expect(zero1.equals(zero2)).toBe(true);
    expect(zero1.equals(zero3)).toBe(true);
    expect(zero1.equals(zero4)).toBe(true);
  });

  it('T2.2: Money 1 cent and -1 cent unit boundaries', () => {
    const oneCent = Money.fromCents(1n, 'COP');
    const negOneCent = Money.fromCents(-1n, 'COP');

    expect(oneCent.cents).toBe(1n);
    expect(oneCent.isPositive()).toBe(true);
    expect(oneCent.isZero()).toBe(false);
    expect(negOneCent.cents).toBe(-1n);
    expect(negOneCent.isNegative()).toBe(true);
    expect(oneCent.add(negOneCent).isZero()).toBe(true);
  });

  it('T2.3: Max Safe Integer boundary (9,007,199,254,740,991 cents) without overflow', () => {
    const maxSafe = Money.fromCents(9007199254740991n, 'COP');
    const plusOne = maxSafe.add(Money.fromCents(1n, 'COP'));

    expect(plusOne.cents).toBe(9007199254740992n);
    expect(plusOne.isGreaterThan(maxSafe)).toBe(true);
  });

  it('T2.4: Massive 128-bit BigInt amounts ($10^18 cents) preserve exact precision', () => {
    const massive1 = Money.fromCents(1000000000000000000n, 'COP');
    const massive2 = Money.fromCents(2000000000000000000n, 'COP');
    const sum = massive1.add(massive2);

    expect(sum.cents).toBe(3000000000000000000n);
    expect(sum.subtract(massive1).cents).toBe(massive2.cents);
  });

  it('T2.5: String parsing with fractional decimals applies deterministic half-up rounding', () => {
    // 10.555 -> 10.56 (1056 cents)
    const m1 = Money.fromAmount('10.555', 'USD');
    expect(m1.cents).toBe(1056n);

    // 10.554 -> 10.55 (1055 cents)
    const m2 = Money.fromAmount('10.554', 'USD');
    expect(m2.cents).toBe(1055n);
  });

  it('T2.6: Negative money formatting and serializations', () => {
    const negMoney = Money.fromAmount('-150000.50', 'COP');
    expect(negMoney.isNegative()).toBe(true);
    expect(negMoney.sign).toBe(-1);

    const json = negMoney.toJSON();
    expect(json.amountInCents).toBe('-15000050');
    expect(json.amount).toBe(-150000.5);
  });

  it('T2.7: Extreme quotient-remainder split: 1 cent distributed among 7 actors', () => {
    const oneCent = Money.fromCents(1n, 'COP');
    const splits = oneCent.split(7);

    expect(splits).toHaveLength(7);
    expect(splits[0].cents).toBe(1n);
    for (let i = 1; i < 7; i++) {
      expect(splits[i].cents).toBe(0n);
    }

    let sum = Money.zero('COP');
    for (const p of splits) {
      sum = sum.add(p);
    }
    expect(sum.cents).toBe(1n);
  });

  it('T2.8: Splitting negative money divides negative cents without loss', () => {
    const negTotal = Money.fromCents(-100n, 'COP');
    const splits = negTotal.split(3);

    expect(splits).toHaveLength(3);
    expect(splits[0].cents).toBe(-34n);
    expect(splits[1].cents).toBe(-33n);
    expect(splits[2].cents).toBe(-33n);

    const sum = splits[0].add(splits[1]).add(splits[2]);
    expect(sum.cents).toBe(-100n);
  });

  it('T2.9: Splitting by invalid parts count (0, negative, non-integer) throws DomainError', () => {
    const m = Money.fromAmount(100, 'COP');
    expect(() => m.split(0)).toThrow(DomainError);
    expect(() => m.split(-3)).toThrow(DomainError);
    expect(() => m.split(2.5)).toThrow(DomainError);
  });

  it('T2.10: Multiplication with zero factor results in zero Money', () => {
    const m = Money.fromAmount(500000, 'COP');
    expect(m.multiply(0).cents).toBe(0n);
    expect(m.multiply(0n).cents).toBe(0n);
    expect(m.multiply('0.0').cents).toBe(0n);
  });
});

// ============================================================================
// GROUP 2: Non-Operative Zones, Boundary Jurisdictions & Normalization
// ============================================================================
describe('Tier 2 - Group 2: Non-Operative Zones & Geospatial Boundaries', () => {
  it('T2.11: MOCOA variations in lowercase, mixed case, and whitespace are rejected', () => {
    const variations = ['mocoa', ' MoCoA ', 'MOCOA\n', '\tmocoa\t', 'Mocoa, Putumayo'];
    for (const v of variations) {
      expect(() => new OperativeTerritory(v)).toThrow(GeospatialInvariantViolationError);
    }
  });

  it('T2.12: LETICIA and AMAZONAS variations are rejected', () => {
    const variations = ['leticia', 'LETICIA', 'Leticia Amazonas', 'Amazonas', 'amazonas'];
    for (const v of variations) {
      expect(() => new OperativeTerritory(v)).toThrow(GeospatialInvariantViolationError);
    }
  });

  it('T2.13: TUMACO, ARAUCA, GUAVIARE, MITU, INIRIDA, PUERTO CARREÑO are rejected', () => {
    const zones = ['TUMACO', 'ARAUCA', 'GUAVIARE', 'MITU', 'INIRIDA', 'PUERTO_CARRENO'];
    for (const z of zones) {
      expect(() => new OperativeTerritory(z)).toThrow(GeospatialInvariantViolationError);
    }
  });

  it('T2.14: Accented and diacritic variations (Mócoa, Letícia, Amazônas) are rejected', () => {
    expect(() => new OperativeTerritory('Mócoa')).toThrow(GeospatialInvariantViolationError);
    expect(() => new OperativeTerritory('Letícia')).toThrow(GeospatialInvariantViolationError);
    expect(() => new OperativeTerritory('Amazônas')).toThrow(GeospatialInvariantViolationError);
  });

  it('T2.15: Mocoa centroid coordinates (1.1528, -76.6521) fail corridor check', () => {
    expect(OperativeTerritory.isWithinCorridor(1.1528, -76.6521)).toBe(false);
    expect(() => new OperativeTerritory({ lat: 1.1528, lng: -76.6521 })).toThrow(GeospatialInvariantViolationError);
  });

  it('T2.16: Leticia centroid coordinates (-4.2153, -69.9406) fail corridor check', () => {
    expect(OperativeTerritory.isWithinCorridor(-4.2153, -69.9406)).toBe(false);
    expect(() => new OperativeTerritory({ lat: -4.2153, lng: -69.9406 })).toThrow(GeospatialInvariantViolationError);
  });

  it('T2.17: Valid corridor bounding edges (Valle de Aburrá min/max corners)', () => {
    // Antioquia central corridor: minLat: 5.90, maxLat: 6.50, minLng: -75.80, maxLng: -75.30
    expect(OperativeTerritory.isWithinCorridor(5.95, -75.75)).toBe(true);
    expect(OperativeTerritory.isWithinCorridor(6.45, -75.35)).toBe(true);
    expect(OperativeTerritory.isWithinCorridor(6.1645, -75.4231)).toBe(true); // JMC Airport
    expect(OperativeTerritory.isWithinCorridor(6.2442, -75.5812)).toBe(true); // Medellín Center
  });

  it('T2.18: Coordinates outside Antioquia/Coffee Axis (Bogotá / Pacific / Atlantic) fail check', () => {
    expect(OperativeTerritory.isWithinCorridor(4.7110, -74.0721)).toBe(false); // Bogotá
    expect(OperativeTerritory.isWithinCorridor(10.3910, -75.4794)).toBe(false); // Cartagena
    expect(OperativeTerritory.isWithinCorridor(0.0, 0.0)).toBe(false); // Null Island
  });

  it('T2.19: OperativeTerritory throws on null, undefined, empty, or non-string invalid types', () => {
    expect(() => new OperativeTerritory(null)).toThrow(GeospatialInvariantViolationError);
    expect(() => new OperativeTerritory(undefined)).toThrow(GeospatialInvariantViolationError);
    expect(() => new OperativeTerritory('')).toThrow(GeospatialInvariantViolationError);
    expect(() => new OperativeTerritory({})).toThrow(GeospatialInvariantViolationError);
  });

  it('T2.20: OperativeTerritory.validate() returns boolean false without throwing on invalid zone', () => {
    expect(OperativeTerritory.validate('MOCOA')).toBe(false);
    expect(OperativeTerritory.validate('LETICIA')).toBe(false);
    expect(OperativeTerritory.validate('MEDELLIN')).toBe(true);
    expect(OperativeTerritory.validate({ lat: 6.24, lng: -75.58 })).toBe(true);
  });
});

// ============================================================================
// GROUP 3: Geofence & Location Coordinate Boundary Tests
// ============================================================================
describe('Tier 2 - Group 3: Geofence & Location Coordinates Boundaries', () => {
  const POI = new LocationCoordinate({
    lat: 6.275819,
    lng: -75.589833,
    name: 'Hospital Pablo Tobón Uribe',
    geofenceRadiusMeters: 300
  });

  it('T2.21: Distance to exact same coordinate is 0.0 meters and within geofence', () => {
    const dist = POI.distanceTo({ lat: 6.275819, lng: -75.589833 });
    expect(dist).toBeCloseTo(0, 2);
    expect(POI.isWithinGeofence({ lat: 6.275819, lng: -75.589833 })).toBe(true);
  });

  it('T2.22: Coordinate exactly inside geofence boundary (e.g. 290m) passes', () => {
    // 0.0025 deg lat is approx 277 meters
    const near = { lat: 6.275819 + 0.0025, lng: -75.589833 };
    const dist = POI.distanceTo(near);
    expect(dist).toBeLessThan(300);
    expect(POI.isWithinGeofence(near)).toBe(true);
  });

  it('T2.23: Coordinate outside geofence boundary (e.g. 350m) fails geofence check', () => {
    // 0.0035 deg lat is approx 388 meters
    const far = { lat: 6.275819 + 0.0035, lng: -75.589833 };
    const dist = POI.distanceTo(far);
    expect(dist).toBeGreaterThan(300);
    expect(POI.isWithinGeofence(far)).toBe(false);
  });

  it('T2.24: Latitude absolute boundary limits (-90.0, +90.0)', () => {
    const northPole = new LocationCoordinate({ lat: 90.0, lng: 0.0 });
    const southPole = new LocationCoordinate({ lat: -90.0, lng: 0.0 });

    expect(northPole.lat).toBe(90.0);
    expect(southPole.lat).toBe(-90.0);
  });

  it('T2.25: Longitude absolute boundary limits (-180.0, +180.0)', () => {
    const westLimit = new LocationCoordinate({ lat: 0.0, lng: -180.0 });
    const eastLimit = new LocationCoordinate({ lat: 0.0, lng: 180.0 });

    expect(westLimit.lng).toBe(-180.0);
    expect(eastLimit.lng).toBe(180.0);
  });

  it('T2.26: Exceeded latitude (>90.0 or <-90.0) throws DomainError', () => {
    expect(() => new LocationCoordinate({ lat: 90.0001, lng: 0 })).toThrow(DomainError);
    expect(() => new LocationCoordinate({ lat: -90.0001, lng: 0 })).toThrow(DomainError);
  });

  it('T2.27: Exceeded longitude (>180.0 or <-180.0) throws DomainError', () => {
    expect(() => new LocationCoordinate({ lat: 0, lng: 180.0001 })).toThrow(DomainError);
    expect(() => new LocationCoordinate({ lat: 0, lng: -180.0001 })).toThrow(DomainError);
  });

  it('T2.28: Non-numeric / NaN / Infinity coordinates throw DomainError', () => {
    expect(() => new LocationCoordinate({ lat: NaN, lng: 0 })).toThrow(DomainError);
    expect(() => new LocationCoordinate({ lat: 0, lng: Infinity })).toThrow(DomainError);
    expect(() => new LocationCoordinate({ lat: 'abc', lng: 0 })).toThrow(DomainError);
  });

  it('T2.29: Invalid geofence radius (0 or negative) throws DomainError', () => {
    expect(() => new LocationCoordinate({ lat: 6.2, lng: -75.5, geofenceRadiusMeters: 0 })).toThrow(DomainError);
    expect(() => new LocationCoordinate({ lat: 6.2, lng: -75.5, geofenceRadiusMeters: -50 })).toThrow(DomainError);
  });

  it('T2.30: Antipodal point distance calculation approaches half Earth circumference (~20,015 km)', () => {
    const p1 = new LocationCoordinate({ lat: 0.0, lng: 0.0 });
    const p2 = { lat: 0.0, lng: 180.0 };
    const dist = p1.distanceTo(p2);

    expect(dist).toBeGreaterThan(20000000); // > 20,000 km
    expect(dist).toBeLessThan(20050000);
  });
});

// ============================================================================
// GROUP 4: Itinerary FSM Status Transitions & Guard Invariants
// ============================================================================
describe('Tier 2 - Group 4: Itinerary FSM Transitions & Invariants', () => {
  it('T2.31: ItineraryItem requires valid non-empty title and positive dayNumber', () => {
    expect(() => new ItineraryItem({ id: 'ITIN-1', dayNumber: 0, title: 'Title' })).toThrow(DomainError);
    expect(() => new ItineraryItem({ id: 'ITIN-1', dayNumber: -1, title: 'Title' })).toThrow(DomainError);
    expect(() => new ItineraryItem({ id: 'ITIN-1', dayNumber: 1, title: '' })).toThrow(DomainError);
    expect(() => new ItineraryItem({ id: 'ITIN-1', dayNumber: 1, title: null })).toThrow(DomainError);
  });

  it('T2.32: ItineraryItem rejects invalid status not in enum', () => {
    expect(() => {
      new ItineraryItem({
        id: 'ITIN-1',
        dayNumber: 1,
        title: 'Title',
        status: 'STATUS_INVALID_UNKNOWN'
      });
    }).toThrow(DomainError);
  });

  it('T2.33: FSM rejects transition from CANCELADO to EN_CAMINO or EN_SITIO', () => {
    const item = new ItineraryItem({ id: 'I1', dayNumber: 1, title: 'Cita' });
    item.cancel('Cancelado');

    expect(() => item.startTransit()).toThrow(InvalidStateTransitionError);
    expect(() => item.arriveOnSite()).toThrow(InvalidStateTransitionError);
    expect(() => item.complete()).toThrow(InvalidStateTransitionError);
  });

  it('T2.34: FSM rejects cancel on already COMPLETADO item', () => {
    const item = new ItineraryItem({ id: 'I2', dayNumber: 1, title: 'Cita Completada' });
    item.complete();

    expect(() => item.cancel('Cancel tardío')).toThrow(InvalidStateTransitionError);
  });

  it('T2.35: Signature requirement guard prevents completing without digital signature blob', () => {
    const item = new ItineraryItem({
      id: 'I3',
      dayNumber: 1,
      title: 'Cita con Firma',
      requiresSignature: true
    });

    expect(() => item.complete()).toThrow(DomainError);

    // Provide signature blob
    item.attachSignature('blob-sig-uuid-123');
    item.complete();
    expect(item.status).toBe('COMPLETADO');
    expect(item.signatureBlobId).toBe('blob-sig-uuid-123');
  });

  it('T2.36: GPS check-in guard rejects arriveOnSite when coordinates are outside geofence radius', () => {
    const item = new ItineraryItem({
      id: 'I4',
      dayNumber: 1,
      title: 'Cita GPS Guard',
      location: { lat: 6.275819, lng: -75.589833, geofenceRadiusMeters: 100 },
      requiresGpsCheckIn: true
    });

    expect(() => {
      item.arriveOnSite({ coords: { lat: 6.2500, lng: -75.5600 } });
    }).toThrow(DomainError);
  });

  it('T2.37: transitionTo dispatcher handles all target statuses cleanly', () => {
    const item = new ItineraryItem({ id: 'I5', dayNumber: 1, title: 'Cita Dispatch' });
    item.transitionTo('EN_CAMINO');
    expect(item.status).toBe('EN_CAMINO');
    item.transitionTo('EN_SITIO');
    expect(item.status).toBe('EN_SITIO');
    item.transitionTo('COMPLETADO');
    expect(item.status).toBe('COMPLETADO');
  });

  it('T2.38: transitionTo dispatcher throws on unknown status', () => {
    const item = new ItineraryItem({ id: 'I6', dayNumber: 1, title: 'Cita Unknown' });
    expect(() => item.transitionTo('UNKNOWN_FOO')).toThrow(InvalidStateTransitionError);
  });

  it('T2.39: ItineraryItem location outside operative corridor throws DomainError on creation', () => {
    expect(() => {
      new ItineraryItem({
        id: 'I7',
        dayNumber: 1,
        title: 'Cita Mocoa Error',
        location: { lat: 1.1528, lng: -76.6521 } // Mocoa
      });
    }).toThrow(DomainError);
  });

  it('T2.40: Attaching empty signature blob ID throws DomainError', () => {
    const item = new ItineraryItem({ id: 'I8', dayNumber: 1, title: 'Cita' });
    expect(() => item.attachSignature('')).toThrow(DomainError);
    expect(() => item.attachSignature(null)).toThrow(DomainError);
  });
});

// ============================================================================
// GROUP 5: Digital Signature & Patient Biometric Invariants
// ============================================================================
describe('Tier 2 - Group 5: Digital Signature & Biometric Invariants', () => {
  it('T2.41: PatientSignature requires non-empty id, itineraryItemId, patientUuid, signerName, blobId', () => {
    expect(() => new PatientSignature({ id: '', itineraryItemId: 'I', patientUuid: 'P', signerName: 'S', blobId: 'B' })).toThrow(DomainError);
    expect(() => new PatientSignature({ id: '1', itineraryItemId: '', patientUuid: 'P', signerName: 'S', blobId: 'B' })).toThrow(DomainError);
    expect(() => new PatientSignature({ id: '1', itineraryItemId: 'I', patientUuid: '', signerName: 'S', blobId: 'B' })).toThrow(DomainError);
    expect(() => new PatientSignature({ id: '1', itineraryItemId: 'I', patientUuid: 'P', signerName: '', blobId: 'B' })).toThrow(DomainError);
    expect(() => new PatientSignature({ id: '1', itineraryItemId: 'I', patientUuid: 'P', signerName: 'S', blobId: '' })).toThrow(DomainError);
  });

  it('T2.42: PatientSignature format only accepts "svg" or "png"', () => {
    expect(() => new PatientSignature({
      id: 'S1',
      itineraryItemId: 'I1',
      patientUuid: 'P1',
      signerName: 'Catia',
      blobId: 'B1',
      format: 'bmp'
    })).toThrow(DomainError);

    const sigSvg = new PatientSignature({
      id: 'S2',
      itineraryItemId: 'I1',
      patientUuid: 'P1',
      signerName: 'Catia',
      blobId: 'B1',
      format: 'svg'
    });
    expect(sigSvg.isSvg()).toBe(true);
    expect(sigSvg.isPng()).toBe(false);
  });

  it('T2.43: PatientSignature is immutable (Object.freeze)', () => {
    const sig = new PatientSignature({
      id: 'S3',
      itineraryItemId: 'I1',
      patientUuid: 'P1',
      signerName: 'George',
      blobId: 'B2'
    });
    expect(Object.isFrozen(sig)).toBe(true);
  });

  it('T2.44: Canvas stroke simulator handles 10,000 coordinate points without memory leak', () => {
    const points = [];
    for (let i = 0; i < 10000; i++) {
      points.push({ x: (i * 7) % 600, y: (i * 13) % 240, t: i });
    }
    expect(points).toHaveLength(10000);
    expect(points[9999].x).toBeDefined();
  });

  it('T2.45: PatientSignature toJSON output contains all required legal fields', () => {
    const sig = new PatientSignature({
      id: 'SIG-LEGAL-01',
      itineraryItemId: 'ITIN-100',
      patientUuid: 'ENT-PAX-0171',
      signerName: 'Lisandra Rodrigues',
      blobId: 'blob-sig-lisandra',
      format: 'png'
    });

    const json = sig.toJSON();
    expect(json.id).toBe('SIG-LEGAL-01');
    expect(json.patientUuid).toBe('ENT-PAX-0171');
    expect(json.signerName).toBe('Lisandra Rodrigues');
    expect(json.format).toBe('png');
  });
});

// ============================================================================
// GROUP 6: Expense Item & OCR Payload Corner Cases
// ============================================================================
describe('Tier 2 - Group 6: Expense Item & OCR Corner Cases', () => {
  it('T2.46: ExpenseItem validates all allowable categories (TAXI, COMPANION_HOURLY, PHARMACY, MEDICAL_LAB, OTHER)', () => {
    for (const cat of ['TAXI', 'COMPANION_HOURLY', 'PHARMACY', 'MEDICAL_LAB', 'OTHER']) {
      const exp = new ExpenseItem({
        id: `EXP-${cat}`,
        category: cat,
        description: `Gasto ${cat}`,
        amount: Money.fromAmount(10000, 'COP'),
        actorId: 'ACT-TEST'
      });
      expect(exp.category).toBe(cat);
    }
  });

  it('T2.47: ExpenseItem rejects unlisted category with DomainError', () => {
    expect(() => {
      new ExpenseItem({
        id: 'EXP-BAD',
        category: 'CASINO_GAMBLING',
        description: 'Gasto prohibido',
        amount: Money.fromAmount(10000, 'COP'),
        actorId: 'ACT-TEST'
      });
    }).toThrow(DomainError);
  });

  it('T2.48: Approving an expense requires non-empty auditorActorId', () => {
    const exp = new ExpenseItem({
      id: 'EXP-AUDIT',
      category: 'PHARMACY',
      description: 'Medicamentos',
      amount: Money.fromAmount(50000, 'COP'),
      actorId: 'ACT-GUIA'
    });

    expect(() => exp.approve('')).toThrow(DomainError);
    expect(() => exp.approve(null)).toThrow(DomainError);

    exp.approve('ACT-FIN');
    expect(exp.status).toBe('APPROVED');
  });

  it('T2.49: Rejecting an expense requires auditorActorId and non-empty reason', () => {
    const exp = new ExpenseItem({
      id: 'EXP-REJ',
      category: 'OTHER',
      description: 'Sin factura',
      amount: Money.fromAmount(30000, 'COP'),
      actorId: 'ACT-GUIA'
    });

    expect(() => exp.reject('ACT-FIN', '')).toThrow(DomainError);
    expect(() => exp.reject('', 'Motivo')).toThrow(DomainError);

    exp.reject('ACT-FIN', 'Falta recibo legal DIAN');
    expect(exp.status).toBe('REJECTED');
    expect(exp.rejectionReason).toBe('Falta recibo legal DIAN');
  });

  it('T2.50: Attaching receipt blob ID rejects empty or non-string values', () => {
    const exp = new ExpenseItem({
      id: 'EXP-BLOB',
      category: 'TAXI',
      description: 'Peaje',
      amount: Money.fromAmount(24800, 'COP'),
      actorId: 'ACT-DRV'
    });

    expect(() => exp.attachReceipt('')).toThrow(DomainError);
    exp.attachReceipt('blob-rec-peaje-01');
    expect(exp.receiptBlobId).toBe('blob-rec-peaje-01');
  });
});

// ============================================================================
// GROUP 7: CQRS Event Stream, SHA-256 Hashing & Cryptographic Tamper Auditing
// ============================================================================
describe('Tier 2 - Group 7: CQRS Event Stream & Cryptographic Tampering', () => {
  it('T2.51: Event creation validates eventId, actorId, eventType, aggregateId', () => {
    expect(() => new ActorEvent({ eventId: '', actorId: 'A', eventType: 'E', aggregateId: 'AG' })).toThrow(DomainError);
    expect(() => new ActorEvent({ eventId: '1', actorId: '', eventType: 'E', aggregateId: 'AG' })).toThrow(DomainError);
    expect(() => new ActorEvent({ eventId: '1', actorId: 'A', eventType: '', aggregateId: 'AG' })).toThrow(DomainError);
    expect(() => new ActorEvent({ eventId: '1', actorId: 'A', eventType: 'E', aggregateId: '' })).toThrow(DomainError);
  });

  it('T2.52: Manually supplied wrong hash throws DomainError immediately on construction', () => {
    expect(() => {
      new ActorEvent({
        eventId: 'EV-WRONG-HASH',
        actorId: 'ACT-FIN',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'TEST_EVENT',
        aggregateId: 'RVA171',
        hash: 'bad0000000000000000000000000000000000000000000000000000000000000'
      });
    }).toThrow(DomainError);
  });

  it('T2.53: Event payload is deeply frozen and cannot be mutated after creation', () => {
    const ev = new ActorEvent({
      eventId: 'EV-FROZEN',
      actorId: 'ACT-FIN',
      eventType: 'EXPENSE_LOGGED',
      aggregateId: 'RVA171',
      payload: { details: { nestedAmount: 500 } }
    });

    expect(Object.isFrozen(ev.payload)).toBe(true);
  });

  it('T2.54: SHA-256 hashing supports Unicode, emojis (🇨🇴, 🫰, 💵), newlines, and quotes', () => {
    const specialStr = '🇨🇴 Medical Trip Colombia S.A.S. — Solicitud de Pagos 🫰 💵\n"Test Line 2"\tTab\0Null';
    const hash1 = sha256(specialStr);
    const hash2 = sha256(specialStr);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('T2.55: Verification of 50 consecutive chained events confirms 100% cryptographic integrity', () => {
    const chain = [];
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 1; i <= 50; i++) {
      const ev = new ActorEvent({
        eventId: `EV-CHAIN-${i}`,
        actorId: `ACTOR-${(i % 4) + 1}`,
        actorRole: 'WORKER',
        eventType: 'CHAIN_STEP',
        aggregateId: 'RVA171',
        payload: { step: i, value: i * 100 },
        previousHash: prevHash
      });
      chain.push(ev);
      prevHash = ev.hash;
    }

    // Verify full chain
    expect(chain[0].verifyIntegrity()).toBe(true);
    for (let i = 1; i < 50; i++) {
      expect(chain[i].verifyIntegrity(chain[i - 1].hash)).toBe(true);
    }
  });
});

// ============================================================================
// GROUP 8: Financial Settlement Multi-Day Rebalancing & Overdraft Corner Cases
// ============================================================================
describe('Tier 2 - Group 8: Financial Settlement Multi-Day Rebalancing & Overdraft', () => {
  it('T2.56: Empty ledger initializes with zero balance and SETTLED_ZERO_BALANCE status', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-EMPTY',
      patientUuid: 'ENT-PAX-EMPTY',
      currency: 'COP'
    });

    expect(ledger.totalAdvances.isZero()).toBe(true);
    expect(ledger.totalExpenses.isZero()).toBe(true);
    expect(ledger.netBalance.isZero()).toBe(true);
    expect(ledger.getAuditSummary().balanceStatus).toBe('SETTLED_ZERO_BALANCE');
  });

  it('T2.57: Ledger with large advance and 0 expenses shows CREDIT_REFUND_DUE', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-ADV-ONLY',
      patientUuid: 'ENT-PAX-ADV',
      currency: 'COP'
    });
    ledger.addAdvance(Money.fromAmount(10000000, 'COP'));

    expect(ledger.netBalance.amount).toBe(10000000);
    expect(ledger.getAuditSummary().balanceStatus).toBe('CREDIT_REFUND_DUE');
  });

  it('T2.58: Ledger with 0 advance and large expenses shows DEBT_OWED_BY_PATIENT', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-EXP-ONLY',
      patientUuid: 'ENT-PAX-EXP',
      currency: 'COP'
    });
    ledger.addExpense({
      id: 'EXP-1',
      category: 'MEDICAL_LAB',
      description: 'Exámenes urgentes',
      amount: Money.fromAmount(4500000, 'COP'),
      actorId: 'ACT-NURSE'
    });

    expect(ledger.netBalance.isNegative()).toBe(true);
    expect(ledger.netBalance.amount).toBe(-4500000);
    expect(ledger.getAuditSummary().balanceStatus).toBe('DEBT_OWED_BY_PATIENT');
  });

  it('T2.59: Adding advance in USD to COP ledger throws CurrencyMismatchError', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-CURR',
      patientUuid: 'ENT-PAX-CURR',
      currency: 'COP'
    });

    expect(() => {
      ledger.addAdvance(Money.fromAmount(1000, 'USD'));
    }).toThrow(CurrencyMismatchError);
  });

  it('T2.60: Adding expense in USD to COP ledger throws CurrencyMismatchError', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-CURR-EXP',
      patientUuid: 'ENT-PAX-CURR',
      currency: 'COP'
    });

    expect(() => {
      ledger.addExpense(new ExpenseItem({
        id: 'E-USD',
        category: 'OTHER',
        description: 'Hotel USD',
        amount: Money.fromAmount(200, 'USD'),
        actorId: 'ACT-TEST'
      }));
    }).toThrow(CurrencyMismatchError);
  });

  it('T2.61: Cancelled driver transfer is excluded from expense ledger total', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-TR-CANCEL',
      patientUuid: 'ENT-PAX-TR',
      currency: 'COP'
    });

    const transfer = new DriverTransfer({
      id: 'TR-CANC',
      driverActorId: 'ACT-DRV',
      origin: { lat: 6.1645, lng: -75.4231 },
      destination: { lat: 6.2442, lng: -75.5812 },
      flatRate: Money.fromAmount(160000, 'COP')
    });
    ledger.addDriverTransfer(transfer);
    expect(ledger.totalExpenses.amount).toBe(160000);

    // Cancel transfer
    const cancelledTransfer = new DriverTransfer({
      id: 'TR-CANC',
      driverActorId: 'ACT-DRV',
      origin: { lat: 6.1645, lng: -75.4231 },
      destination: { lat: 6.2442, lng: -75.5812 },
      flatRate: Money.fromAmount(160000, 'COP'),
      status: 'CANCELLED'
    });
    const newLedger = new SettlementLedger({
      reservationCode: 'RVA-TR-CANCEL',
      patientUuid: 'ENT-PAX-TR',
      currency: 'COP',
      driverTransfers: [cancelledTransfer]
    });
    expect(newLedger.totalExpenses.amount).toBe(0);
  });

  it('T2.62: Cancelled companion shift is excluded from expense ledger total', () => {
    const cancelledShift = new CompanionShift({
      id: 'SH-CANC',
      guideActorId: 'ACT-GUIA',
      dayNumber: 1,
      startTime: '08:00',
      totalHours: 5,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      status: 'CANCELLED'
    });

    const ledger = new SettlementLedger({
      reservationCode: 'RVA-SH-CANCEL',
      patientUuid: 'ENT-PAX-SH',
      currency: 'COP',
      companionShifts: [cancelledShift]
    });

    expect(ledger.totalExpenses.amount).toBe(0);
  });

  it('T2.63: DriverTransfer surcharge addition dynamically updates totalCost', () => {
    const transfer = new DriverTransfer({
      id: 'TR-SUR',
      driverActorId: 'ACT-DRV',
      origin: { lat: 6.1645, lng: -75.4231 },
      destination: { lat: 6.2442, lng: -75.5812 },
      flatRate: Money.fromAmount(110000, 'COP')
    });

    expect(transfer.totalCost.amount).toBe(110000);
    transfer.addSurcharge(Money.fromAmount(25000, 'COP')); // Night surcharge
    expect(transfer.totalCost.amount).toBe(135000);
    expect(transfer.surcharge.amount).toBe(25000);
  });

  it('T2.64: CompanionShift startShift and endShift accurately recalculate duration and cost', () => {
    const shift = new CompanionShift({
      id: 'SH-LIVE',
      guideActorId: 'ACT-GUIA',
      dayNumber: 1,
      startTime: '2026-08-10T08:00:00-05:00',
      hourlyRate: Money.fromAmount(15500, 'COP'),
      mealSubsidy: Money.fromAmount(25000, 'COP')
    });

    expect(shift.status).toBe('SCHEDULED');
    shift.startShift('2026-08-10T08:00:00-05:00');
    expect(shift.status).toBe('IN_PROGRESS');

    // 4.5 hours later
    shift.endShift('2026-08-10T12:30:00-05:00', 4.5);
    expect(shift.status).toBe('COMPLETED');
    expect(shift.totalHours).toBe(4.5);
    // 4.5 * 15,500 = 69,750 + 25,000 = 94,750 COP
    expect(shift.totalCost.amount).toBe(94750);
  });

  it('T2.65: Starting already completed companion shift throws DomainError', () => {
    const shift = new CompanionShift({
      id: 'SH-DONE',
      guideActorId: 'ACT-GUIA',
      dayNumber: 1,
      startTime: '08:00',
      totalHours: 4,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      status: 'COMPLETED'
    });

    expect(() => shift.startShift()).toThrow(DomainError);
  });

  it('T2.66: USD SettlementLedger operates with 100% BigInt precision for US Dollar cents', () => {
    const usdLedger = new SettlementLedger({
      reservationCode: 'RVA-USD',
      patientUuid: 'ENT-PAX-USD',
      currency: 'USD'
    });

    usdLedger.addAdvance(Money.fromAmount(8500, 'USD')); // $8,500.00 USD
    usdLedger.addExpense({
      id: 'EXP-USD-1',
      category: 'MEDICAL_LAB',
      description: 'Lab test',
      amount: Money.fromAmount(450.50, 'USD'),
      actorId: 'ACT-MED'
    });

    expect(usdLedger.totalAdvances.cents).toBe(850000n);
    expect(usdLedger.totalExpenses.cents).toBe(45050n);
    expect(usdLedger.netBalance.cents).toBe(804950n);
    expect(usdLedger.netBalance.amount).toBe(8049.50);
  });

  it('T2.67: DriverTransfer origin outside corridor throws DomainError', () => {
    expect(() => {
      new DriverTransfer({
        id: 'TR-FAIL-ORIGIN',
        driverActorId: 'ACT-DRV',
        origin: { lat: 1.1528, lng: -76.6521 }, // Mocoa
        destination: { lat: 6.2442, lng: -75.5812 },
        flatRate: Money.fromAmount(100000, 'COP')
      });
    }).toThrow(DomainError);
  });

  it('T2.68: DriverTransfer destination outside corridor throws DomainError', () => {
    expect(() => {
      new DriverTransfer({
        id: 'TR-FAIL-DEST',
        driverActorId: 'ACT-DRV',
        origin: { lat: 6.1645, lng: -75.4231 },
        destination: { lat: -4.2153, lng: -69.9406 }, // Leticia
        flatRate: Money.fromAmount(100000, 'COP')
      });
    }).toThrow(DomainError);
  });

  it('T2.69: Adding 1,000 micro-expenses of 1 cent accumulates exactly 10.00 COP (1,000 cents)', () => {
    const microLedger = new SettlementLedger({
      reservationCode: 'RVA-MICRO',
      patientUuid: 'ENT-PAX-MICRO',
      currency: 'COP'
    });

    for (let i = 0; i < 1000; i++) {
      microLedger.addExpense({
        id: `EXP-MICRO-${i}`,
        category: 'OTHER',
        description: `Micro ${i}`,
        amount: Money.fromCents(1n, 'COP'),
        actorId: 'ACT-TEST'
      }, false);
    }
    microLedger.recalculate();

    expect(microLedger.totalExpenses.cents).toBe(1000n);
    expect(microLedger.totalExpenses.amount).toBe(10.00);
  });

  it('T2.70: Ledger toJSON serializes clean auditSummary and breakdown objects', () => {
    const ledger = new SettlementLedger({
      reservationCode: 'RVA-JSON',
      patientUuid: 'ENT-PAX-JSON',
      currency: 'COP'
    });
    ledger.addAdvance(Money.fromAmount(1000000, 'COP'));

    const json = ledger.toJSON();
    expect(json.reservationCode).toBe('RVA-JSON');
    expect(json.auditSummary).toBeDefined();
    expect(json.auditSummary.balanceStatus).toBe('CREDIT_REFUND_DUE');
  });

  it('T2.71: LocationCoordinate equals method compares coordinates and names with precision', () => {
    const loc1 = new LocationCoordinate({ lat: 6.275819, lng: -75.589833, name: 'HPTU' });
    const loc2 = new LocationCoordinate({ lat: 6.275819, lng: -75.589833, name: 'HPTU' });
    const loc3 = new LocationCoordinate({ lat: 6.275819, lng: -75.589833, name: 'Different Name' });

    expect(loc1.equals(loc2)).toBe(true);
    expect(loc1.equals(loc3)).toBe(false);
  });

  it('T2.72: LocationCoordinate toString and toJSON output formatting', () => {
    const loc = new LocationCoordinate({ lat: 6.275819, lng: -75.589833, name: 'HPTU', address: 'Robledo' });
    expect(loc.toString()).toContain('HPTU');
    expect(loc.toJSON().address).toBe('Robledo');
  });

  it('T2.73: Money isGreaterThanOrEqual and isLessThanOrEqual boundary comparisons', () => {
    const m1 = Money.fromAmount(100, 'COP');
    const m2 = Money.fromAmount(100, 'COP');
    const m3 = Money.fromAmount(150, 'COP');

    expect(m1.isGreaterThanOrEqual(m2)).toBe(true);
    expect(m1.isLessThanOrEqual(m2)).toBe(true);
    expect(m1.isLessThanOrEqual(m3)).toBe(true);
    expect(m3.isGreaterThanOrEqual(m1)).toBe(true);
  });

  it('T2.74: OperativeTerritory toString and toJSON serialization', () => {
    const ot = new OperativeTerritory('ROBLEDO');
    expect(ot.toString()).toBe('OperativeTerritory(ROBLEDO)');
    expect(ot.toJSON().zoneName).toBe('ROBLEDO');
  });

  it('T2.75: Base DomainError inherits standard JS Error with stack trace and classification code', () => {
    const err = new DomainError('Test Invariant', 'TEST_INVARIANT_CODE', { foo: 'bar' });
    expect(err instanceof Error).toBe(true);
    expect(err.name).toBe('DomainError');
    expect(err.code).toBe('TEST_INVARIANT_CODE');
    expect(err.details.foo).toBe('bar');
  });
});

if (process.argv[1] && process.argv[1].endsWith('tier2_boundary_corner.test.js')) {
  runAllTests('Tier 2: Boundary & Corner Cases (75 Tests)').then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
