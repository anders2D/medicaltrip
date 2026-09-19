/**
 * TIER 5: Adversarial Stress & Invariant Verification Test Suite (>=25 Stress Tests)
 * Medical Trip Colombia S.A.S. - Standalone Local-First Offline PWA
 *
 * Empirical Challenger White-Box Verification:
 * 1. Arithmetic Stress & 0-Cent Float Drift: 10,000 micro-expenses, quotient/remainder splits, scaling, BigInt limits.
 * 2. Geospatial Invariant Violations: Fail-fast rejection for non-operative zones (Mocoa, Leticia, Amazonas, Tumaco,
 *    Arauca, Guaviare, Mitú, Inírida, Puerto Carreño + accented, lowercase, whitespace & coordinate centroid variants).
 * 3. CQRS Cryptographic Tampering: SHA-256 hash chain tampering detection, pointer mutation, replay halting.
 * 4. Actor Concurrency Races: 200 concurrent expense proposals to [FIN] Single-Writer, CRDT state convergence (PN-Counter, LWW, OR-Set).
 * 5. FSM Invalid State Transitions: Guard violations, reverse transitions, unverified check-ins, missing signatures.
 *
 * Zero external framework dependencies. 100% pure Node.js ESM.
 */

import { describe, it, test, expect, beforeEach, runAllTests } from './test_harness.js';
import { Money } from '../src/domain/value-objects/money.js';
import {
  OperativeTerritory,
  FORBIDDEN_NON_OPERATIVE_ZONES,
  VALID_OPERATIVE_CORRIDORS
} from '../src/domain/value-objects/operative-territory.js';
import { LocationCoordinate } from '../src/domain/value-objects/location-coordinate.js';
import { ActorEvent, sha256 } from '../src/domain/value-objects/actor-event.js';
import { ItineraryItem, ITINERARY_STATUSES } from '../src/domain/entities/itinerary-item.js';
import { ExpenseItem, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from '../src/domain/entities/expense-item.js';
import { SettlementLedger } from '../src/domain/entities/settlement-ledger.js';
import { LedgerHashChain, GENESIS_PREVIOUS_HASH } from '../src/application/settlement/ledger-hash-chain.js';
import { TransitionItineraryStatusCommand } from '../src/application/commands/transition-itinerary-status.js';
import {
  CRDTPNCounter,
  CRDTLWWElementSet,
  CRDTObservedRemoveSet,
  CRDTActorState
} from '../src/actors/crdt-state-sync.js';
import {
  ActorMeshController,
  SimulatedMessageChannel,
  createChannel
} from '../src/actors/actor-mesh-controller.js';
import { FinancialAuditorActor } from '../src/actors/workers/financial-auditor.worker.js';
import { DriverActor } from '../src/actors/workers/driver-actor.worker.js';
import { GuideActor } from '../src/actors/workers/guide-actor.worker.js';
import { NurseActor } from '../src/actors/workers/nurse-actor.worker.js';
import {
  DomainError,
  GeospatialInvariantViolationError,
  CurrencyMismatchError,
  InvalidStateTransitionError
} from '../src/domain/errors/domain-error.js';

describe('Tier 5: Adversarial Stress & Invariant Verification Suite', () => {

  // ==========================================================================
  // SECTION 1: ARITHMETIC STRESS & 0-CENT FLOAT DRIFT INVARIANTS (6 Tests)
  // ==========================================================================
  describe('Suite 1: Arithmetic Stress & 0-Cent Float Drift Invariants', () => {

    it('T5.1: 10,000 randomized micro-expenses aggregated with exact BigInt cents (0 float drift)', () => {
      let accumulator = Money.zero('COP');
      let groundTruthCents = 0n;

      // Deterministic PRNG seed for reproducibility
      let seed = 42;
      function nextRandom() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      }

      for (let i = 0; i < 10000; i++) {
        // Random micro amount between 1 cent ($0.01) and 500,000 cents ($5,000.00 COP)
        const microCents = BigInt(Math.floor(nextRandom() * 500000) + 1);
        const expense = Money.fromCents(microCents, 'COP');

        accumulator = accumulator.add(expense);
        groundTruthCents += microCents;
      }

      expect(accumulator.cents).toBe(groundTruthCents);
      expect(accumulator.amountInCents).toBe(groundTruthCents);
      // Ensure zero IEEE 754 precision drift
      expect(Number(accumulator.cents) / 100).toBe(accumulator.amount);
    });

    it('T5.2: 10,000 randomized quotient-and-remainder splits guarantee exact conservation of cents', () => {
      let seed = 1337;
      function nextRandom() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      }

      for (let i = 0; i < 10000; i++) {
        const totalCents = BigInt(Math.floor(nextRandom() * 10000000) + 1); // Up to $100,000 COP
        const parts = Math.floor(nextRandom() * 16) + 2; // 2 to 17 parts
        const originalMoney = Money.fromCents(totalCents, 'COP');

        const splitResult = originalMoney.split(parts);
        expect(splitResult.length).toBe(parts);

        // Sum split parts
        let sumCents = 0n;
        for (const part of splitResult) {
          sumCents += part.cents;
        }

        // Exact conservation invariant
        expect(sumCents).toBe(totalCents);
      }
    });

    it('T5.3: 5,000 fractional multiplications maintain deterministic half-up rounding without IEEE 754 float drift', () => {
      let seed = 999;
      function nextRandom() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      }

      for (let i = 0; i < 5000; i++) {
        const baseHourlyRate = Money.fromAmount(15500, 'COP'); // $15,500 COP
        const fractionalHours = (nextRandom() * 12 + 0.25).toFixed(4); // e.g. "7.3333"

        const totalMoney = baseHourlyRate.multiply(fractionalHours);

        // Manual exact math calculation
        const rateCents = 1550000n;
        const [intH, decH] = fractionalHours.split('.');
        const factorNumerator = BigInt(intH + decH);
        const factorDenominator = 10n ** BigInt(decH.length);

        const prod = rateCents * factorNumerator;
        const quot = prod / factorDenominator;
        const rem = prod % factorDenominator;
        let expectedCents = quot;
        if (factorDenominator > 1n && rem * 2n >= factorDenominator) {
          expectedCents += 1n;
        }

        expect(totalMoney.cents).toBe(expectedCents);
      }
    });

    it('T5.4: Subtraction of 10,000 micro-amounts in reverse order yields exactly zero without float artifacts', () => {
      const amounts = [];
      let total = Money.zero('COP');

      let seed = 777;
      function nextRandom() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      }

      for (let i = 0; i < 10000; i++) {
        const cents = BigInt(Math.floor(nextRandom() * 100000) + 1);
        const m = Money.fromCents(cents, 'COP');
        amounts.push(m);
        total = total.add(m);
      }

      // Reverse subtraction
      for (let i = amounts.length - 1; i >= 0; i--) {
        total = total.subtract(amounts[i]);
      }

      expect(total.cents).toBe(0n);
      expect(total.isZero()).toBe(true);
      expect(total.isPositive()).toBe(false);
      expect(total.isNegative()).toBe(false);
    });

    it('T5.5: 1,000 cross-currency operations strictly fail-fast with CurrencyMismatchError', () => {
      const cop = Money.fromAmount(50000, 'COP');
      const usd = Money.fromAmount(15, 'USD');

      for (let i = 0; i < 1000; i++) {
        expect(() => cop.add(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.subtract(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.isGreaterThan(usd)).toThrow(CurrencyMismatchError);
        expect(() => cop.isLessThan(usd)).toThrow(CurrencyMismatchError);
      }
    });

    it('T5.6: Extreme magnitude BigInt stress handles trillion-cent values without numeric overflow', () => {
      const hugeCentsA = 999999999999999999n; // ~10 quadrillion cents
      const hugeCentsB = 888888888888888888n;

      const moneyA = Money.fromCents(hugeCentsA, 'COP');
      const moneyB = Money.fromCents(hugeCentsB, 'COP');

      const sum = moneyA.add(moneyB);
      expect(sum.cents).toBe(hugeCentsA + hugeCentsB);

      const diff = sum.subtract(moneyB);
      expect(diff.cents).toBe(hugeCentsA);

      const scaled = moneyA.multiply(2n);
      expect(scaled.cents).toBe(hugeCentsA * 2n);
    });
  });

  // ==========================================================================
  // SECTION 2: GEOSPATIAL INVARIANT VIOLATIONS & FAIL-FAST REJECTIONS (6 Tests)
  // ==========================================================================
  describe('Suite 2: Geospatial Invariants & Non-Operative Zone Rejections', () => {

    it('T5.7: Canonical non-operative zones strictly fail-fast with GeospatialInvariantViolationError', () => {
      const forbiddenZones = [
        'MOCOA',
        'LETICIA',
        'AMAZONAS',
        'TUMACO',
        'ARAUCA',
        'GUAVIARE',
        'MITU',
        'INIRIDA',
        'PUERTO_CARRENO'
      ];

      for (const zone of forbiddenZones) {
        expect(() => new OperativeTerritory(zone)).toThrow(GeospatialInvariantViolationError);
        expect(() => OperativeTerritory.assertOperative(zone)).toThrow(GeospatialInvariantViolationError);
        expect(OperativeTerritory.validate(zone)).toBe(false);
      }
    });

    it('T5.8: Accented, lowercase, mixed-case, and whitespace variants of forbidden zones are rejected', () => {
      const adversarialZoneVariants = [
        'mocoa',
        'Mocóá',
        '  MOCOA  ',
        'leticia',
        'Letícia',
        'amazonas',
        'Amázonás',
        'tumaco',
        'Tumáco',
        'arauca',
        'Aráucá',
        'guaviare',
        'San José del Guaviare',
        'mitu',
        'Mitú',
        'inirida',
        'Inírida',
        'puerto carreño',
        'Puerto Carreño',
        'PUERTO_CARREÑO',
        'pUeRtO_cArReÑo',
        '  puerto_carreno  '
      ];

      for (const variant of adversarialZoneVariants) {
        expect(() => new OperativeTerritory(variant)).toThrow(GeospatialInvariantViolationError);
        expect(OperativeTerritory.validate(variant)).toBe(false);
      }
    });

    it('T5.9: Coordinate centroids of non-operative jurisdictions are rejected by isWithinCorridor()', () => {
      const nonOperativeCoordinates = [
        { name: 'Mocoa Centroid', lat: 1.15, lng: -76.65 },
        { name: 'Leticia Centroid', lat: -4.21, lng: -69.94 },
        { name: 'Arauca Centroid', lat: 7.08, lng: -70.76 },
        { name: 'Tumaco Centroid', lat: 1.80, lng: -78.76 },
        { name: 'Mitú Centroid', lat: 1.25, lng: -70.23 },
        { name: 'Inírida Centroid', lat: 3.86, lng: -67.92 },
        { name: 'Puerto Carreño Centroid', lat: 6.18, lng: -67.48 },
        { name: 'Bogotá (Out of Corridor)', lat: 4.7110, lng: -74.0721 },
        { name: 'Cali (Out of Corridor)', lat: 3.4516, lng: -76.5320 },
        { name: 'Cartagena (Out of Corridor)', lat: 10.3910, lng: -75.4794 }
      ];

      for (const coord of nonOperativeCoordinates) {
        expect(OperativeTerritory.isWithinCorridor(coord.lat, coord.lng)).toBe(false);
        expect(() => new OperativeTerritory({ lat: coord.lat, lng: coord.lng })).toThrow(
          GeospatialInvariantViolationError
        );
      }
    });

    it('T5.10: Substring injection and delimiter fuzzing containing non-operative zones are rejected', () => {
      const injectionFuzz = [
        'MEDELLIN_MOCOA_EXPRESS',
        'CLOFAN_LETICIA_BRANCH',
        'HOTEL_TUMACO_SUITE',
        'MEDELLIN - LETICIA CORRIDOR',
        'POBLADO_AMAZONAS_CLINIC',
        'RIONEGRO_ARAUCA_TRANSFER'
      ];

      for (const injection of injectionFuzz) {
        expect(() => new OperativeTerritory(injection)).toThrow(GeospatialInvariantViolationError);
      }
    });

    it('T5.11: 500 boundary-adjacent coordinates far outside all corridor polygons fail-fast', () => {
      // Corridors are between lat 4.70 - 6.50, lng -75.80 - -75.30
      const outsideCoords = [];
      for (let i = 1; i <= 100; i++) {
        outsideCoords.push({ lat: 8.00 + (i * 0.05), lng: -75.50 });  // Far North (Caribbean Sea)
        outsideCoords.push({ lat: 2.00 - (i * 0.05), lng: -75.50 });  // Far South (Amazonas/Ecuador)
        outsideCoords.push({ lat: 6.20, lng: -78.00 - (i * 0.05) }); // Far West (Pacific Ocean)
        outsideCoords.push({ lat: 6.20, lng: -72.00 + (i * 0.05) }); // Far East (Orinoquía/Venezuela)
        outsideCoords.push({ lat: 0.00, lng: 0.00 });                 // Null island
      }

      expect(outsideCoords.length).toBe(500);
      for (const coord of outsideCoords) {
        expect(OperativeTerritory.isWithinCorridor(coord.lat, coord.lng)).toBe(false);
      }
    });

    it('T5.12: Null, undefined, empty, and invalid object inputs fail-fast deterministically', () => {
      expect(() => new OperativeTerritory(null)).toThrow(GeospatialInvariantViolationError);
      expect(() => new OperativeTerritory(undefined)).toThrow(GeospatialInvariantViolationError);
      expect(() => new OperativeTerritory('')).toThrow(GeospatialInvariantViolationError);
      expect(() => new OperativeTerritory({})).toThrow(GeospatialInvariantViolationError);
      expect(() => new OperativeTerritory({ lat: 'abc', lng: 'xyz' })).toThrow(GeospatialInvariantViolationError);
      expect(() => new OperativeTerritory({ zoneName: 'ZONA_INEXISTENTE_XYZ' })).toThrow(
        GeospatialInvariantViolationError
      );
    });
  });

  // ==========================================================================
  // SECTION 3: CQRS CRYPTOGRAPHIC TAMPERING & SHA-256 CHAIN AUDITS (6 Tests)
  // ==========================================================================
  describe('Suite 3: CQRS Cryptographic Tampering & SHA-256 Chain Audits', () => {
    let chain;

    beforeEach(() => {
      chain = new LedgerHashChain({ aggregateId: 'RVA-STRESS-001' });
    });

    it('T5.13: Modifying a single character in payload of historical event #42 halts replay and flags tamper', async () => {
      // Build 100-event SHA-256 chain
      for (let i = 1; i <= 100; i++) {
        await chain.appendEvent({
          actorId: 'ACT-FIN-AUDITOR',
          eventType: 'EXPENSE_APPROVED',
          payload: { expenseId: `EXP-${i}`, amountInCents: (i * 1000).toString(), description: `Expense ${i}` }
        });
      }

      const events = await chain.getEvents();
      expect(events.length).toBe(100);

      // Verify chain is valid initially
      const initialAudit = await chain.verifyChainIntegrity();
      expect(initialAudit.isValid).toBe(true);

      // Maliciously tamper with event payload at index 41 (event #42) while retaining stored hash
      const tamperedEvents = events.map((ev, idx) => {
        if (idx === 41) {
          // Keep the original hash header but corrupt the payload content
          const raw = ev.toJSON();
          raw.payload = { ...raw.payload, amountInCents: '999999999' };
          return raw;
        }
        return ev;
      });

      const tamperResult = LedgerHashChain.detectTampering(tamperedEvents);
      expect(tamperResult.isTampered).toBe(true);
      expect(tamperResult.tamperedIndex).toBe(41);
      expect(tamperResult.reason).toContain('Integridad Comprometida');
    });

    it('T5.14: Historical previousHash pointer mutation breaks linkage and is detected at exact index', async () => {
      for (let i = 1; i <= 20; i++) {
        await chain.appendEvent({
          actorId: 'ACT-FIN-AUDITOR',
          eventType: 'ADVANCE_RECORDED',
          payload: { advanceId: `ADV-${i}`, amountInCents: '50000000' }
        });
      }

      const events = await chain.getEvents();

      // Mutate previousHash of event index 10
      const corruptedEvents = events.map((ev, idx) => {
        if (idx === 10) {
          return new ActorEvent({
            eventId: ev.eventId,
            actorId: ev.actorId,
            actorRole: ev.actorRole,
            eventType: ev.eventType,
            aggregateId: ev.aggregateId,
            payload: ev.payload,
            timestamp: ev.timestamp,
            previousHash: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
          });
        }
        return ev;
      });

      const audit = LedgerHashChain.verifyStaticChain(corruptedEvents);
      expect(audit.isValid).toBe(false);
      expect(audit.brokenAtIndex).toBe(10);
      expect(audit.error).toContain('Enlace de Hash Quebrado');
    });

    it('T5.15: Unauthorized deletion of an event from the middle of the chain is cryptographically detected', async () => {
      for (let i = 1; i <= 15; i++) {
        await chain.appendEvent({
          actorId: 'ACT-FIN-AUDITOR',
          eventType: 'EXPENSE_APPROVED',
          payload: { expenseId: `EXP-${i}` }
        });
      }

      const events = await chain.getEvents();

      // Delete event at index 7
      const prunedEvents = events.filter((_, idx) => idx !== 7);
      expect(prunedEvents.length).toBe(14);

      const audit = LedgerHashChain.verifyStaticChain(prunedEvents);
      expect(audit.isValid).toBe(false);
      expect(audit.brokenAtIndex).toBe(7); // Next event has broken previousHash pointer
    });

    it('T5.16: Unauthorized reordering of two events triggers parent hash mismatch', async () => {
      for (let i = 1; i <= 10; i++) {
        await chain.appendEvent({
          actorId: 'ACT-FIN-AUDITOR',
          eventType: 'STATUS_TRANSITIONED',
          payload: { step: i }
        });
      }

      const events = await chain.getEvents();

      // Swap event 3 and event 4
      const swapped = [...events];
      const temp = swapped[3];
      swapped[3] = swapped[4];
      swapped[4] = temp;

      const audit = LedgerHashChain.verifyStaticChain(swapped);
      expect(audit.isValid).toBe(false);
      expect(audit.brokenAtIndex).toBe(3);
    });

    it('T5.17: Single-Writer CQRS strictly rejects writes from unauthorized actors', async () => {
      const unauthorizedActors = [
        { id: 'ACT-DRV-RAMON', role: 'DRIVER' },
        { id: 'ACT-GUIA-YENNY', role: 'GUIDE' },
        { id: 'ACT-NURSE-EMI', role: 'NURSE' },
        { id: 'ACT-MALICIOUS-HACKER', role: 'ATTACKER' },
        { id: 'ANONYMOUS_ACTOR', role: 'UNKNOWN' }
      ];

      for (const unauthorized of unauthorizedActors) {
        await expect(
          chain.appendEvent({
            actorId: unauthorized.id,
            actorRole: unauthorized.role,
            eventType: 'EXPENSE_APPROVED',
            payload: { amount: 10000 }
          })
        ).rejects.toThrow('Single-Writer Violation');
      }
    });

    it('T5.18: Replay state correctly projects 100 immutable events into financial state', async () => {
      for (let i = 1; i <= 50; i++) {
        await chain.appendEvent({
          actorId: 'ACT-FIN-AUDITOR',
          eventType: 'ADVANCE_RECORDED',
          payload: { amountCents: '20000000', currency: 'COP' }
        });
        await chain.appendEvent({
          actorId: 'ACT-FIN-AUDITOR',
          eventType: 'EXPENSE_APPROVED',
          payload: { expenseId: `EXP-${i}`, amountCents: '1500000', category: 'PHARMACY' }
        });
      }

      const state = await chain.replayState();
      expect(state.eventsApplied).toBe(100);
      expect(state.advances.length).toBe(50);
      expect(state.expenses.length).toBe(50);
    });
  });

  // ==========================================================================
  // SECTION 4: ACTOR CONCURRENCY RACES & CRDT CONVERGENCE (6 Tests)
  // ==========================================================================
  describe('Suite 4: Actor Concurrency Races & CRDT State Convergence', () => {

    it('T5.19: 200 concurrent expense proposals dispatched to [FIN] Single-Writer are ordered and aggregated', async () => {
      const finAuditor = new FinancialAuditorActor({
        actorId: 'ACTOR-FIN-AUDITOR',
        reservationCode: 'RVA-CONCURRENCY-200'
      });

      const promises = [];
      const expectedTotalCents = 200n * 3500000n; // 200 * $35,000 COP = 7,000,000 COP

      for (let i = 1; i <= 200; i++) {
        const actorId = i % 2 === 0 ? 'ACTOR-DRV-RAMON' : 'ACTOR-GUIA-YENNY';
        const actorRole = i % 2 === 0 ? 'DRIVER' : 'GUIDE';

        promises.push(
          finAuditor.receive({
            action: 'PROPOSE_EXPENSE',
            payload: {
              expenseId: `EXP-CONC-${i}`,
              category: i % 2 === 0 ? 'TAXI' : 'PHARMACY',
              description: `Concurrent Expense #${i}`,
              amountInCents: 3500000n, // $35,000 COP
              actorId,
              actorRole
            }
          })
        );
      }

      const results = await Promise.all(promises);

      // Verify all 200 proposals were processed successfully
      expect(results.length).toBe(200);
      for (const res of results) {
        expect(res.success).toBe(true);
        expect(res.status).toBe('APPROVED');
      }

      // Verify Single-Writer Ledger state
      expect(finAuditor.approvedExpenses.length).toBe(200);
      expect(finAuditor.ledger.totalExpenses.cents).toBe(expectedTotalCents);

      // Verify SHA-256 Hash Chain Integrity across all 200 events
      const chainAudit = finAuditor.verifyChainIntegrity();
      expect(chainAudit.valid).toBe(true);
      expect(chainAudit.eventCount).toBe(200);
    });

    it('T5.20: High-concurrency PN-Counter commutation: 500 parallel increments/decrements converge identically', () => {
      const replicaA = new CRDTPNCounter();
      const replicaB = new CRDTPNCounter();
      const replicaC = new CRDTPNCounter();

      // In PN-Counter CRDT, each replica node writes to its own node ID
      let nodeATotalP = 0n;
      let nodeATotalN = 0n;
      let nodeBTotalP = 0n;
      let nodeBTotalN = 0n;
      let nodeCTotalP = 0n;
      let nodeCTotalN = 0n;

      for (let i = 1; i <= 500; i++) {
        const incAmount = BigInt(i * 100);
        const decAmount = BigInt(i * 30);

        if (i % 3 === 0) {
          replicaA.increment('NODE-A-DRV', incAmount);
          replicaA.decrement('NODE-A-DRV', decAmount);
          nodeATotalP += incAmount;
          nodeATotalN += decAmount;
        } else if (i % 3 === 1) {
          replicaB.increment('NODE-B-GUIA', incAmount);
          replicaB.decrement('NODE-B-GUIA', decAmount);
          nodeBTotalP += incAmount;
          nodeBTotalN += decAmount;
        } else {
          replicaC.increment('NODE-C-NURSE', incAmount);
          replicaC.decrement('NODE-C-NURSE', decAmount);
          nodeCTotalP += incAmount;
          nodeCTotalN += decAmount;
        }
      }

      // Merge all replicas in arbitrary topological order: A -> B -> C -> A
      replicaA.merge(replicaB).merge(replicaC);
      replicaB.merge(replicaC).merge(replicaA);
      replicaC.merge(replicaA).merge(replicaB);

      const groundTruthP = nodeATotalP + nodeBTotalP + nodeCTotalP;
      const groundTruthN = nodeATotalN + nodeBTotalN + nodeCTotalN;
      const expectedNet = groundTruthP - groundTruthN;

      // Assert complete mathematical convergence
      expect(replicaA.value).toBe(expectedNet);
      expect(replicaB.value).toBe(expectedNet);
      expect(replicaC.value).toBe(expectedNet);
      expect(replicaA.positiveValue).toBe(groundTruthP);
      expect(replicaA.negativeValue).toBe(groundTruthN);
    });

    it('T5.21: High-concurrency LWW-Element-Set 200 competing writes converge deterministically', () => {
      const replica1 = new CRDTLWWElementSet();
      const replica2 = new CRDTLWWElementSet();

      // Competing writes with deterministic tie-breaking
      for (let i = 1; i <= 100; i++) {
        const ts = 1700000000000 + i;
        replica1.set(`STOP-${i}`, { status: 'EN_CAMINO', turn: 1 }, ts, 'ACT-DRV-01');
        replica2.set(`STOP-${i}`, { status: 'EN_SITIO', turn: 2 }, ts + 10, 'ACT-GUIA-01'); // Newer timestamp
      }

      replica1.merge(replica2);
      replica2.merge(replica1);

      for (let i = 1; i <= 100; i++) {
        const val1 = replica1.get(`STOP-${i}`);
        const val2 = replica2.get(`STOP-${i}`);

        expect(val1.status).toBe('EN_SITIO');
        expect(val2.status).toBe('EN_SITIO');
        expect(val1.turn).toBe(2);
      }
    });

    it('T5.22: High-concurrency OR-Set causal tag add/remove operations converge monotonically', () => {
      const nodeA = new CRDTObservedRemoveSet();
      const nodeB = new CRDTObservedRemoveSet();

      // Node A adds 50 tasks
      for (let i = 1; i <= 50; i++) {
        nodeA.add(`TASK-${i}`, { title: `Task ${i}` }, 'ACT-DRV', `tag-a-${i}`);
      }

      // Node B adds 50 tasks
      for (let i = 51; i <= 100; i++) {
        nodeB.add(`TASK-${i}`, { title: `Task ${i}` }, 'ACT-GUIA', `tag-b-${i}`);
      }

      // Cross-sync
      nodeA.merge(nodeB);
      nodeB.merge(nodeA);

      expect(nodeA.elements().length).toBe(100);
      expect(nodeB.elements().length).toBe(100);

      // Node A removes first 25 tasks
      for (let i = 1; i <= 25; i++) {
        nodeA.remove(`TASK-${i}`);
      }

      // Re-merge
      nodeB.merge(nodeA);
      expect(nodeB.elements().length).toBe(75);
      expect(nodeB.has('TASK-1')).toBe(false);
      expect(nodeB.has('TASK-50')).toBe(true);
    });

    it('T5.23: 4-Node decentralized mesh (DRV, GUIA, NURSE, FIN) achieves identical composite CRDT state', () => {
      const stateDrv = new CRDTActorState();
      const stateGuia = new CRDTActorState();
      const stateNurse = new CRDTActorState();
      const stateFin = new CRDTActorState();

      // Driver logs transfers & GPS
      stateDrv.updateActorLocation('ACT-DRV', { lat: 6.2442, lng: -75.5812 }, 1000);
      stateDrv.updateStopStatus('STOP-01', 'EN_CAMINO', 'ACT-DRV', 1001);
      stateDrv.addExpenseCents('ACT-DRV', 16000000n);

      // Guide logs check-in & companion shift
      stateGuia.updateStopStatus('STOP-01', 'EN_SITIO', 'ACT-GUIA', 1005);
      stateGuia.addExpenseCents('ACT-GUIA', 3500000n);

      // Nurse logs pharmacy purchase
      stateNurse.addExpenseCents('ACT-NURSE', 8500000n);

      // Fin logs audit approval
      stateFin.updateStopStatus('STOP-01', 'COMPLETADO', 'ACT-FIN', 1010);

      // Mesh synchronization (arbitrary multi-hop propagation)
      stateDrv.merge(stateGuia);
      stateNurse.merge(stateFin);
      stateDrv.merge(stateNurse);
      stateGuia.merge(stateDrv);
      stateFin.merge(stateGuia);
      stateNurse.merge(stateFin);
      stateDrv.merge(stateFin);

      const snapDrv = stateDrv.getSnapshot();
      const snapGuia = stateGuia.getSnapshot();
      const snapNurse = stateNurse.getSnapshot();
      const snapFin = stateFin.getSnapshot();

      // Assert complete convergence across all 4 decentralized nodes
      expect(snapDrv.totalExpenseCents).toBe((16000000n + 3500000n + 8500000n).toString());
      expect(snapGuia.totalExpenseCents).toBe(snapDrv.totalExpenseCents);
      expect(snapNurse.totalExpenseCents).toBe(snapDrv.totalExpenseCents);
      expect(snapFin.totalExpenseCents).toBe(snapDrv.totalExpenseCents);

      expect(snapDrv.stopStatuses['STOP-01'].status).toBe('COMPLETADO');
      expect(snapGuia.stopStatuses['STOP-01'].status).toBe('COMPLETADO');
      expect(snapFin.stopStatuses['STOP-01'].status).toBe('COMPLETADO');
    });

    it('T5.24: High-throughput MessageChannel burst delivers 1,000 messages without deadlocking or packet loss', async () => {
      const channel = createChannel();
      let receivedCount = 0;
      let sumReceived = 0;

      const completionPromise = new Promise((resolve) => {
        channel.port2.onmessage = (event) => {
          receivedCount++;
          sumReceived += event.data.value;
          if (receivedCount === 1000) {
            resolve();
          }
        };
      });

      let expectedSum = 0;
      for (let i = 1; i <= 1000; i++) {
        expectedSum += i;
        channel.port1.postMessage({ id: i, value: i });
      }

      await completionPromise;
      expect(receivedCount).toBe(1000);
      expect(sumReceived).toBe(expectedSum);
    });
  });

  // ==========================================================================
  // SECTION 5: FSM INVALID STATE TRANSITIONS & INVARIANT GUARDS (6 Tests)
  // ==========================================================================
  describe('Suite 5: FSM Invalid State Transitions & Invariant Guards', () => {

    it('T5.25: Reverse state jump rejection: COMPLETADO cannot transition to PROGRAMADO or EN_CAMINO', () => {
      const item = new ItineraryItem({
        id: 'ITIN-REV-01',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Consulta Médica Finalizada',
        location: { lat: 6.2206, lng: -75.5714 }
      });

      item.startTransit();
      item.arriveOnSite();
      item.complete();
      expect(item.status).toBe('COMPLETADO');

      // Attempt illegal reverse jumps
      expect(() => item.startTransit()).toThrow(InvalidStateTransitionError);
      expect(() => item.arriveOnSite()).toThrow(InvalidStateTransitionError);
      expect(() => item.cancel()).toThrow(InvalidStateTransitionError);
    });

    it('T5.26: Skip-state jump without mandatory signature guard throws DomainError', () => {
      const item = new ItineraryItem({
        id: 'ITIN-SIG-GUARD',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Cirugía Ambulatoria con Consentimiento Requerido',
        location: { lat: 6.2206, lng: -75.5714 },
        requiresSignature: true
      });

      item.startTransit();
      item.arriveOnSite();

      // Attempt completion without signature
      expect(() => item.complete()).toThrow(DomainError);
      expect(() => item.complete({})).toThrow('Guardia de Firma');
      expect(item.status).toBe('EN_SITIO'); // Remains in site

      // Providing signature unlocks completion
      item.complete({ signatureBlobId: 'sig-blob-verified-uuid' });
      expect(item.status).toBe('COMPLETADO');
      expect(item.signatureBlobId).toBe('sig-blob-verified-uuid');
    });

    it('T5.27: GPS Check-in guard rejects coordinates outside geofence radius', () => {
      const clofanLocation = { lat: 6.2206, lng: -75.5714, name: 'Clínica Clofán', geofenceRadiusMeters: 100 };
      const item = new ItineraryItem({
        id: 'ITIN-GPS-GUARD',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Consulta Oftalmología Clofán',
        location: clofanLocation,
        requiresGpsCheckIn: true
      });

      item.startTransit();

      // Far coordinate (Aeropuerto JMC ~18km away)
      const farCoords = { lat: 6.1645, lng: -75.4231 };
      expect(() => item.arriveOnSite({ coords: farCoords })).toThrow('Guardia de Check-In GPS');
      expect(item.status).toBe('EN_CAMINO');

      // Valid near coordinate (inside 100m)
      const nearCoords = { lat: 6.22062, lng: -75.57142 };
      item.arriveOnSite({ coords: nearCoords });
      expect(item.status).toBe('EN_SITIO');
    });

    it('T5.28: Operations on CANCELLED appointments are strictly rejected', () => {
      const item = new ItineraryItem({
        id: 'ITIN-CANCEL-01',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Cita Cancelada',
        location: { lat: 6.2206, lng: -75.5714 }
      });

      item.cancel('Paciente reprogramó vuelo');
      expect(item.status).toBe('CANCELADO');
      expect(item.cancellationReason).toBe('Paciente reprogramó vuelo');

      expect(() => item.startTransit()).toThrow(InvalidStateTransitionError);
      expect(() => item.arriveOnSite()).toThrow(InvalidStateTransitionError);
      expect(() => item.complete()).toThrow(InvalidStateTransitionError);
    });

    it('T5.29: TransitionItineraryStatusCommand enforces full validation pipeline and storage consistency', async () => {
      // Mock Storage Port
      const itemsMap = new Map();
      const mockStorage = {
        async saveItinerary(itineraryItem) {
          itemsMap.set(itineraryItem.id, itineraryItem);
        },
        async getItinerary(id) {
          return itemsMap.get(id) || null;
        }
      };

      const commandHandler = new TransitionItineraryStatusCommand({
        storagePort: mockStorage
      });

      const initialItem = new ItineraryItem({
        id: 'ITIN-CMD-01',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Cita de Prueba Command',
        location: { lat: 6.2206, lng: -75.5714, geofenceRadiusMeters: 200 },
        requiresGpsCheckIn: true,
        requiresSignature: true
      });
      await mockStorage.saveItinerary(initialItem);

      // Step 1: PROGRAMADO -> EN_CAMINO
      const step1 = await commandHandler.execute({
        itineraryItemId: 'ITIN-CMD-01',
        newStatus: 'EN_CAMINO'
      });
      expect(step1.success).toBe(true);
      expect(step1.newStatus).toBe('EN_CAMINO');

      // Step 2: Fail EN_SITIO with bad coords
      await expect(
        commandHandler.execute({
          itineraryItemId: 'ITIN-CMD-01',
          newStatus: 'EN_SITIO',
          coords: { lat: 6.0000, lng: -75.0000 }
        })
      ).rejects.toThrow('Guardia de Check-In GPS');

      // Step 3: Succeed EN_SITIO with good coords
      const step3 = await commandHandler.execute({
        itineraryItemId: 'ITIN-CMD-01',
        newStatus: 'EN_SITIO',
        coords: { lat: 6.22061, lng: -75.57141 }
      });
      expect(step3.success).toBe(true);
      expect(step3.newStatus).toBe('EN_SITIO');

      // Step 4: Fail COMPLETADO without signature
      await expect(
        commandHandler.execute({
          itineraryItemId: 'ITIN-CMD-01',
          newStatus: 'COMPLETADO'
        })
      ).rejects.toThrow('Guardia de Firma');

      // Step 5: Succeed COMPLETADO with signature
      const step5 = await commandHandler.execute({
        itineraryItemId: 'ITIN-CMD-01',
        newStatus: 'COMPLETADO',
        signatureBlobId: 'valid-sig-blob-123'
      });
      expect(step5.success).toBe(true);
      expect(step5.newStatus).toBe('COMPLETADO');
    });

    it('T5.30: FSM terminal state protection: terminal states COMPLETADO and CANCELADO reject all further transitions', () => {
      // Completed item rejects transitions
      const completedItem = new ItineraryItem({
        id: 'ITIN-TERM-01',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Cita Completada Terminal',
        location: { lat: 6.2206, lng: -75.5714 }
      });
      completedItem.startTransit();
      completedItem.arriveOnSite();
      completedItem.complete();

      expect(() => completedItem.startTransit()).toThrow(InvalidStateTransitionError);
      expect(() => completedItem.arriveOnSite()).toThrow(InvalidStateTransitionError);
      expect(() => completedItem.cancel()).toThrow(InvalidStateTransitionError);

      // Cancelled item rejects transitions
      const cancelledItem = new ItineraryItem({
        id: 'ITIN-TERM-02',
        dayNumber: 1,
        date: '2026-08-10',
        timeWindow: '08:00 - 10:00',
        title: 'Cita Cancelada Terminal',
        location: { lat: 6.2206, lng: -75.5714 }
      });
      cancelledItem.cancel('Cancelado por paciente');

      expect(() => cancelledItem.startTransit()).toThrow(InvalidStateTransitionError);
      expect(() => cancelledItem.arriveOnSite()).toThrow(InvalidStateTransitionError);
      expect(() => cancelledItem.complete()).toThrow(InvalidStateTransitionError);
    });
  });
});

if (process.argv[1] && process.argv[1].endsWith('tier5_adversarial_stress.test.js')) {
  runAllTests('Tier 5: Adversarial Stress & Invariant Verification Suite (>=25 Tests)').then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
