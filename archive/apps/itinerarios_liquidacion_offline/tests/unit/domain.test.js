import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DomainError,
  GeospatialInvariantViolationError,
  CurrencyMismatchError,
  InvalidStateTransitionError,
  Money,
  OperativeTerritory,
  VALID_OPERATIVE_CORRIDORS,
  FORBIDDEN_NON_OPERATIVE_ZONES,
  LocationCoordinate,
  ActorEvent,
  sha256,
  ItineraryItem,
  ITINERARY_STATUSES,
  ExpenseItem,
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  CompanionShift,
  COMPANION_SHIFT_STATUSES,
  DriverTransfer,
  DRIVER_TRANSFER_STATUSES,
  PatientSignature,
  SettlementLedger,
  IStoragePort,
  IBlobStoragePort,
  IActorEventBusPort,
  IGeolocationPort,
  IOCRPort
} from '../../src/domain/index.js';

describe('Milestone 1 — Hexagonal Domain Core Unit Tests', () => {

  describe('1. Money Value Object (Martin Fowler Pattern & Exact BigInt Cents)', () => {
    it('creates Money from BigInt cents, numbers, and strings', () => {
      const m1 = new Money(5000000n, 'COP');
      const m2 = Money.fromCents(5000000, 'COP');
      const m3 = Money.fromCents('5000000', 'COP');

      assert.equal(m1.amountInCents, 5000000n);
      assert.equal(m1.amount, 50000);
      assert.equal(m1.currency, 'COP');
      assert.ok(m1.equals(m2));
      assert.ok(m1.equals(m3));
    });

    it('creates Money from decimal units without IEEE 754 float rounding loss', () => {
      const m1 = Money.fromAmount(150.50, 'USD');
      assert.equal(m1.amountInCents, 15050n);
      assert.equal(m1.amount, 150.5);

      const m2 = Money.fromAmount('120000.75', 'COP');
      assert.equal(m2.amountInCents, 12000075n);
      assert.equal(m2.amount, 120000.75);

      const mNeg = Money.fromAmount('-45.30', 'USD');
      assert.equal(mNeg.amountInCents, -4530n);
      assert.equal(mNeg.isNegative(), true);
    });

    it('executes exact addition and subtraction with zero float drift', () => {
      const m1 = Money.fromAmount('100.10', 'USD');
      const m2 = Money.fromAmount('200.20', 'USD');
      const sum = m1.add(m2);

      assert.equal(sum.amountInCents, 30030n);
      assert.equal(sum.amount, 300.3);

      const diff = sum.subtract(m1);
      assert.ok(diff.equals(m2));
    });

    it('throws CurrencyMismatchError when operating on mismatched currencies', () => {
      const cop = Money.fromAmount(50000, 'COP');
      const usd = Money.fromAmount(50, 'USD');

      assert.throws(
        () => cop.add(usd),
        (err) => err instanceof CurrencyMismatchError && err.code === 'CURRENCY_MISMATCH'
      );

      assert.throws(
        () => cop.subtract(usd),
        (err) => err instanceof CurrencyMismatchError
      );
    });

    it('multiplies Money by integer, bigint, and decimal factors deterministically', () => {
      const base = Money.fromAmount('50.00', 'USD');
      const double = base.multiply(2);
      assert.equal(double.amountInCents, 10000n);

      const bigMult = base.multiply(3n);
      assert.equal(bigMult.amountInCents, 15000n);

      const half = base.multiply('0.5');
      assert.equal(half.amountInCents, 2500n);

      const oneThird = Money.fromCents(100n, 'USD').multiply('0.333333');
      assert.equal(oneThird.amountInCents, 33n);
    });

    it('implements Martin Fowler exact split algorithm with 0 cents lost', () => {
      // 100 cents split 3 ways: 34 + 33 + 33 = 100
      const hundredCents = Money.fromCents(100n, 'COP');
      const parts3 = hundredCents.split(3);

      assert.equal(parts3.length, 3);
      assert.equal(parts3[0].amountInCents, 34n);
      assert.equal(parts3[1].amountInCents, 33n);
      assert.equal(parts3[2].amountInCents, 33n);

      const totalSplit = parts3[0].add(parts3[1]).add(parts3[2]);
      assert.ok(totalSplit.equals(hundredCents));

      // 10,000,000 cents split 7 ways
      const bigMoney = Money.fromAmount(100000, 'COP'); // 10,000,000 cents
      const parts7 = bigMoney.split(7);
      assert.equal(parts7.length, 7);

      let sumParts = Money.zero('COP');
      for (const p of parts7) {
        sumParts = sumParts.add(p);
      }
      assert.ok(sumParts.equals(bigMoney));

      // Negative amount split
      const negMoney = Money.fromCents(-100n, 'USD');
      const negParts = negMoney.split(3);
      assert.equal(negParts[0].amountInCents, -34n);
      assert.equal(negParts[1].amountInCents, -33n);
      assert.equal(negParts[2].amountInCents, -33n);
      const negSum = negParts[0].add(negParts[1]).add(negParts[2]);
      assert.ok(negSum.equals(negMoney));
    });

    it('correctly evaluates comparison and sign methods', () => {
      const m10 = Money.fromAmount(10, 'COP');
      const m20 = Money.fromAmount(20, 'COP');
      const m0 = Money.zero('COP');
      const mNeg = Money.fromAmount(-5, 'COP');

      assert.ok(m20.isGreaterThan(m10));
      assert.ok(m10.isLessThan(m20));
      assert.ok(m10.isGreaterThanOrEqual(m10));
      assert.ok(m10.isLessThanOrEqual(m10));
      assert.ok(m0.isZero());
      assert.ok(m10.isPositive());
      assert.ok(mNeg.isNegative());
      assert.equal(m10.sign, 1);
      assert.equal(mNeg.sign, -1);
      assert.equal(m0.sign, 0);
    });

    it('enforces immutability and valid formatting/serialization', () => {
      const m = Money.fromAmount(50000, 'COP');
      assert.ok(Object.isFrozen(m));

      const json = m.toJSON();
      assert.equal(json.amountInCents, '5000000');
      assert.equal(json.currency, 'COP');
      assert.equal(json.amount, 50000);
      assert.ok(typeof json.formatted === 'string');
    });
  });

  describe('2. OperativeTerritory Fail-Fast Invariants', () => {
    it('accepts all canonical operative corridors in Antioquia and Eje Cafetero', () => {
      for (const corridor of VALID_OPERATIVE_CORRIDORS) {
        assert.ok(OperativeTerritory.assertOperative(corridor));
        const territory = new OperativeTerritory(corridor);
        assert.equal(territory.zoneName, corridor);
      }
    });

    it('deterministically fails-fast on forbidden non-operative zones (e.g. MOCOA, LETICIA)', () => {
      for (const forbidden of FORBIDDEN_NON_OPERATIVE_ZONES) {
        assert.throws(
          () => new OperativeTerritory(forbidden),
          (err) => {
            assert.ok(err instanceof GeospatialInvariantViolationError || err instanceof DomainError);
            assert.match(err.message, /\[Violación de Invariante Geoespacial\] Zona no operativa/);
            return true;
          }
        );
      }
    });

    it('validates GPS coordinates against operative bounding corridors', () => {
      // Medellín Poblado (Operative)
      assert.ok(OperativeTerritory.isWithinCorridor(6.2088, -75.5678));
      // Rionegro JMC Airport (Operative)
      assert.ok(OperativeTerritory.isWithinCorridor(6.1645, -75.4278));
      // Manizales (Operative)
      assert.ok(OperativeTerritory.isWithinCorridor(5.0689, -75.5174));
      // Pereira (Operative)
      assert.ok(OperativeTerritory.isWithinCorridor(4.8133, -75.6961));

      // Mocoa Putumayo (Non-Operative centroid: 1.15, -76.65)
      assert.equal(OperativeTerritory.isWithinCorridor(1.1528, -76.6521), false);
      // Leticia Amazonas (Non-Operative: -4.21, -69.94)
      assert.equal(OperativeTerritory.isWithinCorridor(-4.2153, -69.9406), false);
      // Outside Colombia (e.g. Paris 48.85, 2.35)
      assert.equal(OperativeTerritory.isWithinCorridor(48.8566, 2.3522), false);
    });

    it('resolves territory from valid coordinates and throws for invalid ones', () => {
      const medellinTerritory = new OperativeTerritory({ lat: 6.2088, lng: -75.5678 });
      assert.equal(medellinTerritory.zoneName, 'MEDELLIN');

      const rionegroTerritory = new OperativeTerritory({ lat: 6.1645, lng: -75.4278 });
      assert.equal(rionegroTerritory.zoneName, 'RIONEGRO');

      assert.throws(
        () => new OperativeTerritory({ lat: 1.1528, lng: -76.6521 }),
        (err) => err instanceof GeospatialInvariantViolationError
      );
    });
  });

  describe('3. LocationCoordinate Value Object & Haversine Distance', () => {
    it('creates immutable LocationCoordinate and validates lat/lng ranges', () => {
      const loc = new LocationCoordinate({
        lat: 6.2088,
        lng: -75.5678,
        name: 'Clínica El Rosario - El Tesoro',
        address: 'Cra 20 # 2Sur-185, El Poblado',
        geofenceRadiusMeters: 100
      });

      assert.ok(Object.isFrozen(loc));
      assert.equal(loc.lat, 6.2088);
      assert.equal(loc.lng, -75.5678);
      assert.equal(loc.name, 'Clínica El Rosario - El Tesoro');
      assert.equal(loc.geofenceRadiusMeters, 100);

      assert.throws(() => new LocationCoordinate({ lat: 95.0, lng: -75.5 }));
      assert.throws(() => new LocationCoordinate({ lat: 6.0, lng: -200.0 }));
    });

    it('calculates accurate Haversine distance and geofence containment', () => {
      // Clinica El Rosario El Poblado
      const clinica = new LocationCoordinate({
        lat: 6.2088,
        lng: -75.5678,
        name: 'Clinica El Rosario',
        geofenceRadiusMeters: 150
      });

      // Point 50 meters away
      const nearPoint = { lat: 6.2085, lng: -75.5676 };
      const distNear = clinica.distanceTo(nearPoint);
      assert.ok(distNear < 100);
      assert.ok(clinica.isWithinGeofence(nearPoint));

      // JMC Airport (~16-18km away)
      const airport = new LocationCoordinate({
        lat: 6.1645,
        lng: -75.4278,
        name: 'Aeropuerto JMC Rionegro'
      });
      const distAirport = clinica.distanceTo(airport);
      assert.ok(distAirport > 15000 && distAirport < 25000);
      assert.equal(clinica.isWithinGeofence(airport), false);
    });
  });

  describe('4. ActorEvent Value Object & SHA-256 Hash Chaining', () => {
    it('creates immutable ActorEvent with deterministic SHA-256 hash', () => {
      const event1 = new ActorEvent({
        eventId: 'EVT-001',
        actorId: 'DRV-RAMON-01',
        actorRole: 'DRIVER',
        eventType: 'STATUS_TRANSITIONED',
        aggregateId: 'ITN-ITEM-101',
        payload: { status: 'EN_CAMINO', coords: { lat: 6.2088, lng: -75.5678 } },
        timestamp: '2026-08-23T10:00:00.000Z',
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000'
      });

      assert.ok(Object.isFrozen(event1));
      assert.ok(event1.hash);
      assert.equal(event1.hash.length, 64);
      assert.ok(event1.verifyIntegrity());

      // Next event in hash chain
      const event2 = new ActorEvent({
        eventId: 'EVT-002',
        actorId: 'DRV-RAMON-01',
        actorRole: 'DRIVER',
        eventType: 'STATUS_TRANSITIONED',
        aggregateId: 'ITN-ITEM-101',
        payload: { status: 'EN_SITIO' },
        timestamp: '2026-08-23T10:30:00.000Z',
        previousHash: event1.hash
      });

      assert.ok(event2.verifyIntegrity(event1.hash));
    });

    it('detects tampering and integrity violations', () => {
      const event = new ActorEvent({
        eventId: 'EVT-003',
        actorId: 'FIN-AUDITOR-01',
        actorRole: 'FINANCIAL_AUDITOR',
        eventType: 'EXPENSE_APPROVED',
        aggregateId: 'EXP-501',
        payload: { amountInCents: '5000000' }
      });

      assert.ok(event.verifyIntegrity());

      // Attempting to supply invalid pre-calculated hash throws
      assert.throws(
        () =>
          new ActorEvent({
            eventId: 'EVT-004',
            actorId: 'FIN-AUDITOR-01',
            actorRole: 'FINANCIAL_AUDITOR',
            eventType: 'EXPENSE_APPROVED',
            aggregateId: 'EXP-501',
            payload: { amountInCents: '5000000' },
            hash: 'tampered_invalid_sha256_hash_1234567890abcdef'
          }),
        (err) => err instanceof DomainError
      );
    });
  });

  describe('5. ItineraryItem Entity & FSM State Machine', () => {
    it('executes valid FSM state lifecycle transitions', () => {
      const item = new ItineraryItem({
        id: 'ITN-001',
        dayNumber: 1,
        date: '2026-09-01',
        timeWindow: '08:00 - 10:00',
        title: 'Consulta Prequirúrgica Cardiología',
        specialty: 'Cardiología',
        clinicName: 'Clínica Cardio VID',
        location: { lat: 6.2754, lng: -75.5684, geofenceRadiusMeters: 200 },
        requiresGpsCheckIn: true,
        requiresSignature: true
      });

      assert.equal(item.status, 'PROGRAMADO');

      // 1. Start transit
      item.startTransit('2026-09-01T07:30:00Z');
      assert.equal(item.status, 'EN_CAMINO');

      // 2. Arrive on site inside geofence
      item.arriveOnSite({
        coords: { lat: 6.2755, lng: -75.5683 },
        timestamp: '2026-09-01T07:55:00Z'
      });
      assert.equal(item.status, 'EN_SITIO');
      assert.ok(item.checkInTimestamp);

      // 3. Complete with signature
      item.complete({
        signatureBlobId: 'blob-sig-uuid-999',
        timestamp: '2026-09-01T09:45:00Z'
      });
      assert.equal(item.status, 'COMPLETADO');
      assert.equal(item.signatureBlobId, 'blob-sig-uuid-999');
      assert.ok(item.completionTimestamp);
    });

    it('enforces GPS check-in guard when actor is outside geofence', () => {
      const item = new ItineraryItem({
        id: 'ITN-002',
        dayNumber: 1,
        title: 'Valoración Anestesiología',
        location: { lat: 6.2088, lng: -75.5678, geofenceRadiusMeters: 100 },
        requiresGpsCheckIn: true
      });

      item.startTransit();

      // Attempt check-in 5 km away
      assert.throws(
        () => item.arriveOnSite({ coords: { lat: 6.2500, lng: -75.5800 } }),
        (err) => err instanceof DomainError && /Guardia de Check-In GPS/.test(err.message)
      );
    });

    it('enforces Patient Signature guard on completion when requiresSignature is true', () => {
      const item = new ItineraryItem({
        id: 'ITN-003',
        dayNumber: 2,
        title: 'Cirugía Cardiovascular',
        location: { lat: 6.2088, lng: -75.5678 },
        requiresSignature: true
      });

      item.arriveOnSite();

      // Attempt complete without signature
      assert.throws(
        () => item.complete(),
        (err) => err instanceof DomainError && /Guardia de Firma/.test(err.message)
      );

      // Complete with signature succeeds
      item.complete({ signatureBlobId: 'sig-valid-123' });
      assert.equal(item.status, 'COMPLETADO');
    });

    it('rejects forbidden non-operative locations for itinerary item', () => {
      assert.throws(
        () =>
          new ItineraryItem({
            id: 'ITN-ERR-01',
            dayNumber: 1,
            title: 'Cita en Mocoa',
            location: { lat: 1.1528, lng: -76.6521 } // Mocoa Putumayo
          }),
        (err) => err instanceof DomainError
      );
    });
  });

  describe('6. ExpenseItem Entity & Auditing Lifecycle', () => {
    it('manages expense proposal, approval, and rejection with Money value object', () => {
      const expense = new ExpenseItem({
        id: 'EXP-101',
        itineraryItemId: 'ITN-001',
        category: 'TAXI',
        description: 'Taxi del Hotel Diez a Clínica Medellín Poblado',
        amount: Money.fromAmount(28000, 'COP'),
        actorId: 'DRV-RAMON'
      });

      assert.equal(expense.isProposed(), true);
      assert.equal(expense.amount.amount, 28000);

      // Attach receipt
      expense.attachReceipt('receipt-blob-001');
      assert.equal(expense.receiptBlobId, 'receipt-blob-001');

      // Approve
      expense.approve('FIN-AUDITOR-01');
      assert.equal(expense.isApproved(), true);
      assert.equal(expense.auditedBy, 'FIN-AUDITOR-01');

      // Create another expense and reject
      const badExpense = new ExpenseItem({
        id: 'EXP-102',
        category: 'PHARMACY',
        description: 'Medicamentos sin fórmula médica',
        amount: Money.fromAmount(75000, 'COP'),
        actorId: 'GUIA-BILINGUE'
      });

      badExpense.reject('FIN-AUDITOR-01', 'Falta prescripción médica y soporte fiscal');
      assert.equal(badExpense.isRejected(), true);
      assert.equal(badExpense.rejectionReason, 'Falta prescripción médica y soporte fiscal');
    });
  });

  describe('7. CompanionShift & DriverTransfer Entities', () => {
    it('calculates companion shift total costs with hourly rates and meal subsidy', () => {
      const shift = new CompanionShift({
        id: 'SHF-001',
        guideActorId: 'GUIA-LILIANA',
        dayNumber: 2,
        startTime: '2026-09-02T08:00:00Z',
        endTime: '2026-09-02T16:00:00Z',
        totalHours: 8,
        hourlyRate: Money.fromAmount(45000, 'COP'),
        mealSubsidy: Money.fromAmount(20000, 'COP')
      });

      // totalCost = (45,000 * 8) + 20,000 = 360,000 + 20,000 = 380,000 COP
      assert.equal(shift.totalCost.amount, 380000);
      assert.equal(shift.totalCost.amountInCents, 38000000n);

      // Dynamic shift finish
      const shift2 = new CompanionShift({
        id: 'SHF-002',
        guideActorId: 'GUIA-LILIANA',
        dayNumber: 3,
        startTime: '2026-09-03T09:00:00Z',
        hourlyRate: Money.fromAmount(45000, 'COP'),
        mealSubsidy: Money.fromAmount(20000, 'COP')
      });

      shift2.endShift('2026-09-03T14:00:00Z', 5);
      // (45,000 * 5) + 20,000 = 245,000 COP
      assert.equal(shift2.totalCost.amount, 245000);
    });

    it('calculates driver transfer costs with flat rate, surcharges, and geo validation', () => {
      const transfer = new DriverTransfer({
        id: 'TRF-001',
        driverActorId: 'DRV-RAMON',
        origin: { lat: 6.1645, lng: -75.4278, name: 'Aeropuerto JMC' },
        destination: { lat: 6.2088, lng: -75.5678, name: 'Hotel Poblado Plaza' },
        flatRate: Money.fromAmount(120000, 'COP'),
        surcharge: Money.fromAmount(15000, 'COP') // Night surcharge
      });

      // totalCost = 120,000 + 15,000 = 135,000 COP
      assert.equal(transfer.totalCost.amount, 135000);
      assert.ok(transfer.estimatedDistanceMeters > 15000);

      // Invariant check: Fail on transfer to forbidden territory
      assert.throws(
        () =>
          new DriverTransfer({
            id: 'TRF-BAD',
            driverActorId: 'DRV-RAMON',
            origin: { lat: 6.2088, lng: -75.5678 },
            destination: { lat: 1.1528, lng: -76.6521 }, // Mocoa
            flatRate: Money.fromAmount(100000, 'COP')
          }),
        (err) => err instanceof DomainError
      );
    });
  });

  describe('8. PatientSignature Entity', () => {
    it('creates valid SVG and PNG signatures with immutability', () => {
      const sigSvg = new PatientSignature({
        id: 'SIG-001',
        itineraryItemId: 'ITN-001',
        patientUuid: 'ENT-PAX-0171',
        signerName: 'Catia Rodriguez',
        blobId: 'blob-sig-catia-01',
        format: 'svg'
      });

      assert.ok(Object.isFrozen(sigSvg));
      assert.equal(sigSvg.isSvg(), true);
      assert.equal(sigSvg.isPng(), false);
      assert.equal(sigSvg.signerName, 'Catia Rodriguez');

      assert.throws(
        () =>
          new PatientSignature({
            id: 'SIG-002',
            itineraryItemId: 'ITN-001',
            patientUuid: 'ENT-PAX-0171',
            signerName: 'Catia Rodriguez',
            blobId: 'blob-sig-catia-01',
            format: 'bmp' // Invalid format
          }),
        (err) => err instanceof DomainError
      );
    });
  });

  describe('9. SettlementLedger Aggregate Root & Multi-Day Financial Balancing', () => {
    it('accurately balances advances, expenses, transfers, and companion fees (RVA171 Archetype)', () => {
      const ledger = new SettlementLedger({
        reservationCode: 'RVA171',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP'
      });

      // 1. Patient deposits advances: 2,000,000 COP
      ledger.addAdvance(Money.fromAmount(2000000, 'COP'));

      // 2. Out-of-pocket expenses: Taxi (35,000) + Pharmacy (120,000) + Medical Lab (85,000)
      ledger.addExpense(
        new ExpenseItem({
          id: 'EXP-1',
          category: 'TAXI',
          description: 'Taxi Aeropuerto - Hotel',
          amount: Money.fromAmount(35000, 'COP'),
          actorId: 'DRV-RAMON'
        })
      );
      ledger.addExpense(
        new ExpenseItem({
          id: 'EXP-2',
          category: 'PHARMACY',
          description: 'Antibióticos y analgésicos',
          amount: Money.fromAmount(120000, 'COP'),
          actorId: 'GUIA-LILIANA'
        })
      );
      ledger.addExpense(
        new ExpenseItem({
          id: 'EXP-3',
          category: 'MEDICAL_LAB',
          description: 'Pruebas de laboratorio prequirúrgicas',
          amount: Money.fromAmount(85000, 'COP'),
          actorId: 'GUIA-LILIANA'
        })
      );

      // 3. Driver airport transfer: 130,000 COP
      ledger.addDriverTransfer(
        new DriverTransfer({
          id: 'TRF-1',
          driverActorId: 'DRV-RAMON',
          origin: { lat: 6.1645, lng: -75.4278 },
          destination: { lat: 6.2088, lng: -75.5678 },
          flatRate: Money.fromAmount(130000, 'COP')
        })
      );

      // 4. Companion shift: 6 hours @ 40,000 + 20,000 subsidy = 260,000 COP
      ledger.addCompanionShift(
        new CompanionShift({
          id: 'SHF-1',
          guideActorId: 'GUIA-LILIANA',
          dayNumber: 1,
          startTime: '2026-09-01T08:00:00Z',
          endTime: '2026-09-01T14:00:00Z',
          totalHours: 6,
          hourlyRate: Money.fromAmount(40000, 'COP'),
          mealSubsidy: Money.fromAmount(20000, 'COP')
        })
      );

      // Total Expenses = 35k + 120k + 85k + 130k + 260k = 630,000 COP (63,000,000 cents)
      // Total Advances = 2,000,000 COP (200,000,000 cents)
      // Net Balance = 2,000,000 - 630,000 = +1,370,000 COP (Credit refund due to patient)
      assert.equal(ledger.totalAdvances.amount, 2000000);
      assert.equal(ledger.totalExpenses.amount, 630000);
      assert.equal(ledger.netBalance.amount, 1370000);
      assert.equal(ledger.netBalance.amountInCents, 137000000n);

      const audit = ledger.getAuditSummary();
      assert.equal(audit.balanceStatus, 'CREDIT_REFUND_DUE');
      assert.equal(audit.breakdown.pharmacyAndMeds.amount, 120000);
      assert.equal(audit.breakdown.taxisAndTransfers.amount, 165000); // 35k + 130k
      assert.equal(audit.breakdown.companionFees.amount, 260000);
      assert.equal(audit.breakdown.medicalLabs.amount, 85000);
    });

    it('correctly identifies patient debt when expenses exceed advances', () => {
      const ledger = new SettlementLedger({
        reservationCode: 'RVA282',
        patientUuid: 'ENT-PAX-0282',
        currency: 'USD'
      });

      ledger.addAdvance(Money.fromAmount(500, 'USD'));
      ledger.addExpense(
        new ExpenseItem({
          id: 'EXP-USD-1',
          category: 'OTHER',
          description: 'Specialized Medical Device Rental',
          amount: Money.fromAmount(750, 'USD'),
          actorId: 'NURSE-01'
        })
      );

      // Advances: $500, Expenses: $750 => Net: -$250 (Patient owes $250)
      assert.equal(ledger.netBalance.amount, -250);
      assert.equal(ledger.netBalance.isNegative(), true);
      assert.equal(ledger.getAuditSummary().balanceStatus, 'DEBT_OWED_BY_PATIENT');
    });
  });

  describe('10. Abstract Ports Interface Contract Verification', () => {
    it('enforces method implementation on IStoragePort', async () => {
      const port = new IStoragePort();
      await assert.rejects(() => port.saveItinerary({}), DomainError);
      await assert.rejects(() => port.getItinerary('123'), DomainError);
      await assert.rejects(() => port.appendEvent({}), DomainError);
    });

    it('enforces method implementation on IBlobStoragePort', async () => {
      const port = new IBlobStoragePort();
      await assert.rejects(() => port.saveBlob('id', 'image/png', new Uint8Array()), DomainError);
      await assert.rejects(() => port.getBlob('id'), DomainError);
    });

    it('enforces method implementation on IActorEventBusPort', async () => {
      const port = new IActorEventBusPort();
      await assert.rejects(() => port.publish({}), DomainError);
      assert.throws(() => port.subscribe('TEST', () => {}), DomainError);
    });

    it('enforces method implementation on IGeolocationPort and IOCRPort', async () => {
      const geoPort = new IGeolocationPort();
      await assert.rejects(() => geoPort.getCurrentPosition(), DomainError);

      const ocrPort = new IOCRPort();
      await assert.rejects(() => ocrPort.parseReceipt('blob'), DomainError);
    });
  });
});
