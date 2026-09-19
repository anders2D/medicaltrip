import { describe, it, expect, beforeEach } from 'vitest';
import { Money, CurrencyCode } from '../../../src/domain/values/Money';
import { OperativeTerritory } from '../../../src/domain/values/OperativeTerritory';
import { Coordinates } from '../../../src/domain/values/Coordinates';
import { Booking } from '../../../src/domain/entities/Booking';
import { Patient } from '../../../src/domain/entities/Patient';
import { ItineraryMilestone } from '../../../src/domain/entities/ItineraryMilestone';
import { FinancialTransaction } from '../../../src/domain/entities/FinancialTransaction';
import { MedicalItinerary } from '../../../src/domain/aggregates/MedicalItinerary';
import {
  DomainError,
  NonOperativeTerritoryError,
  CurrencyMismatchError,
  InvalidMoneyAmountError,
  InvariantViolationError,
  MilestoneNotFoundError,
  InvalidMilestoneTransitionError,
} from '../../../src/domain/errors/DomainErrors';
import {
  WebWorkerSwarmBus,
  LWWElementSet,
  PNCounter,
  calculateTransferFee,
  validateRouteLocations,
  calculateGuidePay,
  calculateFastingWindow,
  auditLedger,
  buildHashChain,
  verifyHashChain,
  sha256Sync,
  signLedgerSeal,
} from '../../../src/infrastructure/workers';
import { ItemizedReceiptOCRAdapter } from '../../../src/infrastructure/ocr/ItemizedReceiptOCRAdapter';
import { LoadArchetypeUseCase } from '../../../src/application/use-cases/LoadArchetypeUseCase';
import { ProcessReceiptOCRUseCase } from '../../../src/application/use-cases/ProcessReceiptOCRUseCase';
import { SignOffItineraryUseCase } from '../../../src/application/use-cases/SignOffItineraryUseCase';
import { InMemoryItineraryRepository } from '../../unit/application/mocks/InMemoryItineraryRepository';
import { ISignatureStorageService } from '../../../src/application/ports/ISignatureStorageService';
import { SwarmMessage } from '../../../src/application/ports/IActorSwarmBus';

// Mock in-memory signature storage service for testing
class MockSignatureStorageService implements ISignatureStorageService {
  public signatures = new Map<string, string>();

  async saveSignature(reservaId: string, milestoneId: string, signatureDataUrl: string): Promise<string> {
    if (!signatureDataUrl || signatureDataUrl.trim().length === 0) {
      throw new InvariantViolationError('[Firma Digital]: La firma no puede estar vacía.');
    }
    const uuid = `sig-${reservaId}-${milestoneId}-${Date.now()}`;
    this.signatures.set(uuid, signatureDataUrl);
    return uuid;
  }

  async getSignature(signatureUuid: string): Promise<string | null> {
    return this.signatures.get(signatureUuid) || null;
  }

  async deleteSignature(signatureUuid: string): Promise<void> {
    this.signatures.delete(signatureUuid);
  }
}

describe('Tier 5: Adversarial Coverage Hardening & Extreme Stress Suite', () => {
  let repo: InMemoryItineraryRepository;
  let signatureStorage: MockSignatureStorageService;
  let ocrAdapter: ItemizedReceiptOCRAdapter;
  let swarmBus: WebWorkerSwarmBus;

  beforeEach(() => {
    repo = new InMemoryItineraryRepository();
    signatureStorage = new MockSignatureStorageService();
    ocrAdapter = new ItemizedReceiptOCRAdapter();
    swarmBus = new WebWorkerSwarmBus();
  });

  // =========================================================================
  // 1. Extreme BigInt Values ($10^15 Cents / Multi-Trillion Precision)
  // =========================================================================
  describe('1. Extreme BigInt Values ($10^15 Cents Arithmetic & Zero Loss)', () => {
    it('handles exact $10^15 cents ($10 Trillion COP) without precision loss', () => {
      const tenToTheFifteen = 1000000000000000n; // 10^15 cents
      const m1 = Money.fromCents(tenToTheFifteen, 'COP');
      const m2 = Money.fromCents(tenToTheFifteen * 2n, 'COP');

      const sum = m1.add(m2);
      expect(sum.amountInCents).toBe(3000000000000000n);
      expect(sum.amount).toBe(30000000000000); // 30 Trillion units
      expect(sum.format()).toBe('$ 30.000.000.000.000 COP');

      const diff = m2.subtract(m1);
      expect(diff.amountInCents).toBe(tenToTheFifteen);
      expect(diff.format()).toBe('$ 10.000.000.000.000 COP');
    });

    it('handles 1 Quintillion ($10^18) cents arithmetic and negative boundaries', () => {
      const quintillion = 1000000000000000000n;
      const pos = Money.fromCents(quintillion, 'COP');
      const neg = Money.fromCents(-quintillion, 'COP');

      expect(pos.add(neg).amountInCents).toBe(0n);
      expect(pos.add(neg).isZero()).toBe(true);

      const multiplied = pos.multiply(5n);
      expect(multiplied.amountInCents).toBe(5000000000000000000n);

      const split100 = pos.split(100);
      expect(split100.length).toBe(100);
      const sumSplit = split100.reduce((acc, p) => acc.add(p), Money.zero('COP'));
      expect(sumSplit.amountInCents).toBe(quintillion);
    });

    it('processes settlement balance sheet with extreme $10^15 amounts', () => {
      const booking = new Booking({
        id: 'bkg-huge',
        code: 'RVA-HUGE-01',
        patientId: 'ENT-PAX-HUGE',
        paxCount: 1,
        arrivalDate: '2026-08-20T10:00:00Z',
        departureDate: '2026-08-25T10:00:00Z',
      });
      const itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

      const advance = Money.fromCents(1000000000000000n, 'COP'); // 10^15 cents
      const expense = Money.fromCents(999999999999900n, 'COP'); // 10^15 - 100 cents

      itinerary.recordCashAdvance(advance, 'Mega Corporate Advance');
      itinerary.recordOutOfPocketExpense('High Tech Surgical Fleet', expense);

      const sheet = itinerary.calculateBalanceSheet();
      expect(sheet.totalCashAdvances.amountInCents).toBe(1000000000000000n);
      expect(sheet.totalExpenses.amountInCents).toBe(999999999999900n);
      expect(sheet.netBalance.amountInCents).toBe(-100n); // 1 COP refund due
      expect(sheet.isRefundDue).toBe(true);
      expect(sheet.isPatientOwing).toBe(false);
      expect(sheet.netBalance.format()).toBe('-$ 1 COP');
    });

    it('rejects invalid inputs on Money construction (non-numeric, non-finite, NaN, garbage)', () => {
      expect(() => Money.fromAmount('not-a-number', 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromAmount(NaN, 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromAmount(Infinity, 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromAmount(-Infinity, 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromCents('abc', 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromCents(NaN, 'COP')).toThrow(InvalidMoneyAmountError);
      expect(() => Money.fromCents(100, 'EUR' as any)).toThrow(InvalidMoneyAmountError);
    });
  });

  // =========================================================================
  // 2. Non-Operative Territory Injections & Bounding Box Stress
  // =========================================================================
  describe('2. Non-Operative Territory Injections & Adversarial Geo-Fencing', () => {
    const forbiddenInjections = [
      'MOCOA',
      'mocoa',
      'Mocóa',
      '  mocoa  \t',
      'Clinica San Rafael en Mocoa',
      'Traslado Aeropuerto Mocoa Putumayo',
      'LETICIA',
      'Leticia Amazonas Decameron',
      'Tumaco Nariño',
      'Arauca Capital',
      'Mitú Vaupés',
      'Puerto Inírida Guainía',
      'Puerto Carreño Vichada',
      'Quibdó Chocó Hospital',
      'Riohacha La Guajira Centro',
      'Puerto Asís Putumayo',
      'San José del Guaviare',
    ];

    for (const injected of forbiddenInjections) {
      it(`blocks forbidden injection: '${injected}' in OperativeTerritory`, () => {
        expect(() => new OperativeTerritory(injected)).toThrow(NonOperativeTerritoryError);
      });

      it(`blocks forbidden injection: '${injected}' in ItineraryMilestone location`, () => {
        expect(() => {
          new ItineraryMilestone({
            id: 'm-forbidden',
            reservaId: 'RVA-TEST',
            dayNumber: 1,
            title: 'Procedimiento Ilegal',
            category: 'CLINICAL',
            startDateTime: '2026-08-20T10:00:00Z',
            location: injected,
          });
        }).toThrow(NonOperativeTerritoryError);
      });
    }

    it('rejects forbidden uppercase zones in driverWorker validateRouteLocations', () => {
      const basicForbidden = ['MOCOA', 'LETICIA', 'AMAZONAS', 'TUMACO', 'NARINO', 'ARAUCA', 'CHOCO'];
      for (const zone of basicForbidden) {
        expect(() => {
          calculateTransferFee({
            origin: 'Aeropuerto JMC',
            destination: `Hotel Decameron en ${zone}`,
          });
        }).toThrow();
      }
    });

    it('rejects forbidden coordinates and out-of-bounds geographic coordinates', () => {
      const adversarialCoords = [
        { name: 'Mocoa City Center', lat: 1.15, lng: -76.65 },
        { name: 'Leticia Amazonas', lat: -4.21, lng: -69.94 },
        { name: 'Tumaco Nariño Port', lat: 1.80, lng: -78.76 },
        { name: 'Null Island', lat: 0.0, lng: 0.0 },
        { name: 'North Pole', lat: 90.0, lng: 0.0 },
        { name: 'South Pole', lat: -90.0, lng: 0.0 },
        { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
        { name: 'New York City', lat: 40.7128, lng: -74.006 },
        { name: 'Just Out Antioquia West', lat: 6.20, lng: -75.81 },
        { name: 'Just Out Antioquia East', lat: 6.20, lng: -75.29 },
      ];

      for (const pt of adversarialCoords) {
        expect(() => {
          new OperativeTerritory({
            name: pt.name,
            coordinates: new Coordinates(pt.lat, pt.lng),
          });
        }, `Expected coordinates for '${pt.name}' to throw NonOperativeTerritoryError`).toThrow(
          NonOperativeTerritoryError
        );
      }
    });

    it('validates Coordinates value object invariants strictly', () => {
      expect(() => new Coordinates(91, 0)).toThrow(InvariantViolationError);
      expect(() => new Coordinates(-91, 0)).toThrow(InvariantViolationError);
      expect(() => new Coordinates(0, 181)).toThrow(InvariantViolationError);
      expect(() => new Coordinates(0, -181)).toThrow(InvariantViolationError);
      expect(() => new Coordinates(NaN, 0)).toThrow(InvariantViolationError);
      expect(() => new Coordinates(0, NaN)).toThrow(InvariantViolationError);
      expect(() => new Coordinates(Infinity, 0)).toThrow(InvariantViolationError);
    });
  });

  // =========================================================================
  // 3. Out-of-Bounds Dates & Temporal Anomaly Testing
  // =========================================================================
  describe('3. Out-of-Bounds Dates & Temporal Anomaly Resilience', () => {
    it('rejects milestone creation where endDateTime is before startDateTime', () => {
      expect(() => {
        new ItineraryMilestone({
          id: 'm-inv-time',
          reservaId: 'RVA-TIME-01',
          dayNumber: 1,
          title: 'Inverted Milestone',
          category: 'CLINICAL',
          startDateTime: '2026-08-20T15:00:00Z',
          endDateTime: '2026-08-20T14:00:00Z', // 1 hour earlier!
          location: 'Clínica Clofán',
        });
      }).toThrow(InvariantViolationError);
    });

    it('rejects invalid or garbage date strings', () => {
      expect(() => {
        new ItineraryMilestone({
          id: 'm-garbage-date',
          reservaId: 'RVA-TIME-02',
          dayNumber: 1,
          title: 'Garbage Date Milestone',
          category: 'CLINICAL',
          startDateTime: 'invalid-date-string',
          location: 'Clínica Clofán',
        });
      }).toThrow(InvariantViolationError);
    });

    it('handles boundary dates accurately (epoch 1970, leap years, distant future 2099)', () => {
      // Leap year 2028-02-29
      const leapMilestone = new ItineraryMilestone({
        id: 'm-leap',
        reservaId: 'RVA-TIME-03',
        dayNumber: 1,
        title: 'Leap Day Exam',
        category: 'LAB',
        startDateTime: '2028-02-29T10:00:00Z',
        endDateTime: '2028-02-29T12:00:00Z',
        location: 'Clínica Clofán',
      });
      expect(leapMilestone.durationMinutes).toBe(120);
      expect(leapMilestone.startDateTime.getUTCFullYear()).toBe(2028);
      expect(leapMilestone.startDateTime.getUTCDate()).toBe(29);

      // Distant future 2099
      const futureMilestone = new ItineraryMilestone({
        id: 'm-future',
        reservaId: 'RVA-TIME-04',
        dayNumber: 1,
        title: 'Future Checkup',
        category: 'CLINICAL',
        startDateTime: '2099-12-31T22:00:00Z',
        endDateTime: '2100-01-01T01:00:00Z', // Crosses century and midnight (3 hours)
        location: 'Hospital Pablo Tobón Uribe Robledo',
      });
      expect(futureMilestone.durationMinutes).toBe(180);
      expect(futureMilestone.durationHours).toBe(3);
    });

    it('handles instantaneous 0-minute duration milestones', () => {
      const instant = new ItineraryMilestone({
        id: 'm-instant',
        reservaId: 'RVA-TIME-05',
        dayNumber: 1,
        title: 'Check-in Notification',
        category: 'HOTEL',
        startDateTime: '2026-08-20T10:00:00Z',
        endDateTime: '2026-08-20T10:00:00Z',
        location: 'Hotel Inntu Laureles',
      });
      expect(instant.durationMinutes).toBe(0);
      expect(instant.durationHours).toBe(0);
    });
  });

  // =========================================================================
  // 4. Corrupted OCR Inputs & Error Resilience
  // =========================================================================
  describe('4. Corrupted OCR Inputs & Extraction Fallback Hardening', () => {
    it('handles completely empty string without throwing', () => {
      const result = ocrAdapter.parseReceiptText('');
      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalAmount.amountInCents).toBeGreaterThanOrEqual(0n);
    });

    it('handles binary junk, script tags, and noise gracefully', () => {
      const adversarialText = `
        <script>alert("XSS injection")</script>
        %PDF-1.4 %âãÏÓ
        0000000000 65535 f
        RANDOM_GARBAGE_NO_PRICE
        @@##$$%%^^&&**
      `;
      const result = ocrAdapter.parseReceiptText(adversarialText);
      expect(result).toBeDefined();
      expect(result.receiptUuid.startsWith('rec-ocr-')).toBe(true);
      expect(result.totalAmount.isPositive()).toBe(true);
    });

    it('handles negative or unusual price strings in OCR text safely', () => {
      const textWithNegative = `
        DROGUERIA CRUZ VERDE
        NIT: 800.149.695-1
        DESCUENTO: -$15.000
        TOTAL COP: $30.000
      `;
      const result = ocrAdapter.parseReceiptText(textWithNegative);
      expect(result.vendorName).toBe('Droguería Cruz Verde Robledo');
      expect(result.totalAmount.amountInCents).toBe(3000000n); // $30.000 COP
    });

    it('processes receipt OCR use case and updates itinerary ledger seamlessly', async () => {
      const loadUseCase = new LoadArchetypeUseCase(repo);
      await loadUseCase.execute('RVA171');

      const processOcrUseCase = new ProcessReceiptOCRUseCase(repo, ocrAdapter);
      const ocrResult = await processOcrUseCase.execute({
        reservaId: 'RVA171-4',
        imageBlobOrBase64: `
          FARMACIA PASTEUR LAURELES
          NIT: 890.900.123-4
          FECHA: 2026-08-21
          1x Gotas Oftálmicas Tobramicina $65.000
          TOTAL: $65.000
        `,
      });

      expect(ocrResult.vendorName).toBe('Farmacia Pasteur Laureles');
      expect(ocrResult.extractedAmountFormatted).toBe('$ 65.000 COP');
      expect(ocrResult.updatedSettlement).toBeDefined();
      expect(ocrResult.updatedSettlement.totalOutOfPocket.amountCents).toBe('15000000'); // 85k + 65k = 150k
    });
  });

  // =========================================================================
  // 5. Empty & Malformed Signatures
  // =========================================================================
  describe('5. Empty & Malformed Digital Signatures & State Machine Guardrails', () => {
    it('rejects empty signature payload in SignOffItineraryUseCase', async () => {
      const loadUseCase = new LoadArchetypeUseCase(repo);
      await loadUseCase.execute('RVA171');

      const signOffUseCase = new SignOffItineraryUseCase(repo, signatureStorage);

      await expect(
        signOffUseCase.execute({
          reservaId: 'RVA171-4',
          milestoneId: 'itn-171-03',
          signatureDataUrl: '',
          signedByPaxName: 'Catia Rodrigues',
        })
      ).rejects.toThrow(InvariantViolationError);

      await expect(
        signOffUseCase.execute({
          reservaId: 'RVA171-4',
          milestoneId: 'itn-171-03',
          signatureDataUrl: '   ',
          signedByPaxName: 'Catia Rodrigues',
        })
      ).rejects.toThrow(InvariantViolationError);
    });

    it('rejects sign-off on non-existent booking reservation', async () => {
      const signOffUseCase = new SignOffItineraryUseCase(repo, signatureStorage);
      await expect(
        signOffUseCase.execute({
          reservaId: 'RVA-NON-EXISTENT',
          milestoneId: 'itn-ghost',
          signatureDataUrl: 'data:image/png;base64,mockSignatureData',
          signedByPaxName: 'Ghost Patient',
        })
      ).rejects.toThrow(InvariantViolationError);
    });

    it('enforces milestone state machine transitions and rejects illegal transitions', () => {
      const milestone = new ItineraryMilestone({
        id: 'm-sm-test',
        reservaId: 'RVA-SM',
        dayNumber: 1,
        title: 'State Machine Test',
        category: 'CLINICAL',
        startDateTime: '2026-08-20T10:00:00Z',
        location: 'Clínica Clofán',
        status: 'PROGRAMADO',
      });

      // Valid: PROGRAMADO -> EN_CAMINO
      const inTransit = milestone.startTransit();
      expect(inTransit.status).toBe('EN_CAMINO');

      // Valid: EN_CAMINO -> EN_SITIO
      const onSite = inTransit.arriveOnSite();
      expect(onSite.status).toBe('EN_SITIO');

      // Valid: EN_SITIO -> COMPLETADO
      const completed = onSite.complete({ signatureUuid: 'sig-123' });
      expect(completed.status).toBe('COMPLETADO');
      expect(completed.signatureUuid).toBe('sig-123');

      // Invalid: COMPLETADO -> CANCELADO
      expect(() => completed.cancel()).toThrow(InvalidMilestoneTransitionError);

      // Invalid: COMPLETADO -> EN_CAMINO
      expect(() => completed.startTransit()).toThrow(InvalidMilestoneTransitionError);

      // Invalid: COMPLETADO -> COMPLETADO (repeat)
      expect(() => completed.complete()).toThrow(InvalidMilestoneTransitionError);
    });
  });

  // =========================================================================
  // 6. Rapid Archetype Switching & State Isolation
  // =========================================================================
  describe('6. Rapid Archetype Switching & Memory Isolation', () => {
    it('rapidly alternates across all 4 archetypes with zero state pollution', async () => {
      const loadUseCase = new LoadArchetypeUseCase(repo);
      const archetypes: Array<'RVA171' | 'RVA282' | 'RVA341' | 'RVA077'> = [
        'RVA171',
        'RVA282',
        'RVA341',
        'RVA077',
        'RVA171',
        'RVA341',
        'RVA282',
        'RVA077',
      ];

      for (const archId of archetypes) {
        const res = await loadUseCase.execute(archId);
        expect(res.itinerary).toBeDefined();
        expect(res.patient).toBeDefined();

        // Verify archetype-specific properties
        if (archId === 'RVA171') {
          expect(res.patient.firstName).toBe('Catia');
          expect(res.itinerary.booking.code).toBe('RVA171-4');
          expect(res.itinerary.milestones.length).toBe(4);
        } else if (archId === 'RVA282') {
          expect(res.patient.firstName).toBe('George');
          expect(res.itinerary.booking.code).toBe('RVA282-5');
          expect(res.itinerary.milestones.length).toBe(2);
        } else if (archId === 'RVA341') {
          expect(res.patient.firstName).toBe('Eduard');
          expect(res.itinerary.booking.code).toBe('RVA341-1');
          expect(res.itinerary.milestones.length).toBe(2);
        } else if (archId === 'RVA077') {
          expect(res.patient.firstName).toBe('Alejandra');
          expect(res.itinerary.booking.code).toBe('RVA077-5');
          expect(res.itinerary.milestones.length).toBe(3);
        }

        // Verify balance sheet calculation is isolated
        const balance = res.itinerary.calculateBalanceSheet();
        expect(balance.totalCashAdvances.isPositive()).toBe(true);
        expect(balance.netBalance).toBeDefined();
      }

      // Verify all 4 itineraries exist independently in repository
      const rva171 = await repo.getByBookingCode('RVA171-4');
      const rva282 = await repo.getByBookingCode('RVA282-5');
      const rva341 = await repo.getByBookingCode('RVA341-1');
      const rva077 = await repo.getByBookingCode('RVA077-5');

      expect(rva171).not.toBeNull();
      expect(rva282).not.toBeNull();
      expect(rva341).not.toBeNull();
      expect(rva077).not.toBeNull();
    });

    it('rejects invalid or unknown archetype IDs immediately', async () => {
      const loadUseCase = new LoadArchetypeUseCase(repo);
      await expect(loadUseCase.execute('RVA999' as any)).rejects.toThrow(InvariantViolationError);
      await expect(loadUseCase.execute('' as any)).rejects.toThrow(InvariantViolationError);
      await expect(loadUseCase.execute('UNKNOWN' as any)).rejects.toThrow(InvariantViolationError);
    });

    it('handles concurrent archetype loading calls without racing or corruption', async () => {
      const loadUseCase = new LoadArchetypeUseCase(repo);
      const results = await Promise.all([
        loadUseCase.execute('RVA171'),
        loadUseCase.execute('RVA282'),
        loadUseCase.execute('RVA341'),
        loadUseCase.execute('RVA077'),
      ]);

      expect(results.length).toBe(4);
      expect(results[0].patient.firstName).toBe('Catia');
      expect(results[1].patient.firstName).toBe('George');
      expect(results[2].patient.firstName).toBe('Eduard');
      expect(results[3].patient.firstName).toBe('Alejandra');
    });
  });

  // =========================================================================
  // 7. Concurrent Message Handling & Worker Swarm Stress
  // =========================================================================
  describe('7. Concurrent Message Handling Across Workers & CRDT Sync', () => {
    it('handles 100 simultaneous executeAgentTask calls across all 4 subagents', async () => {
      const tasks: Promise<any>[] = [];

      for (let i = 0; i < 25; i++) {
        // DRV
        tasks.push(
          swarmBus.executeAgentTask('DRV', 'CALCULATE_TRANSFER_FEE', {
            origin: 'Aeropuerto JMC Rionegro',
            destination: 'Hotel Inntu Laureles',
            paxCount: (i % 4) + 1,
            vehicleType: i % 2 === 0 ? 'Standard' : 'Uber XL',
          })
        );
        // GUIA
        tasks.push(
          swarmBus.executeAgentTask('GUIA', 'CALCULATE_GUIDE_PAY', {
            hours: ((i % 12) + 1) * 1.0,
            includePrepAllowance: i % 2 === 0,
          })
        );
        // NURSE
        tasks.push(
          swarmBus.executeAgentTask('NURSE', 'CALCULATE_FASTING_WINDOW', {
            scheduledLabTime: `2026-08-2${i % 9}T05:30:00.000Z`,
            fastingHours: 8,
          })
        );
        // FIN
        tasks.push(
          swarmBus.executeAgentTask('FIN', 'AUDIT_LEDGER', {
            totalCuentaCobro: 100000 * (i + 1),
            advanceTotal: 200000 * (i + 1),
          })
        );
      }

      const results = await Promise.all(tasks);
      expect(results.length).toBe(100);

      // Verify DRV results
      const drvResults = results.filter((r) => r.transferFeeCOP !== undefined);
      expect(drvResults.length).toBe(25);

      // Verify GUIA results
      const guiaResults = results.filter((r) => r.totalPayCOP !== undefined);
      expect(guiaResults.length).toBe(25);

      // Verify NURSE results
      const nurseResults = results.filter((r) => r.fastingHours !== undefined);
      expect(nurseResults.length).toBe(25);

      // Verify FIN results
      const finResults = results.filter((r) => r.audited === true);
      expect(finResults.length).toBe(25);
    });

    it('handles high-frequency point-to-point and broadcast message delivery', async () => {
      const receivedMessages: SwarmMessage[] = [];
      const unsub = swarmBus.subscribe('FIN', (msg) => {
        receivedMessages.push(msg);
      });

      const promises: Promise<void>[] = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          swarmBus.postMessageToAgent('FIN', {
            id: `msg-concurrent-${i}`,
            sender: 'COORD',
            recipient: 'FIN',
            topic: 'AUDIT_REQUEST',
            payload: { index: i },
            timestamp: new Date().toISOString(),
          })
        );
      }

      await Promise.all(promises);
      expect(receivedMessages.length).toBe(50);
      unsub();
    });

    it('CRDT LWWElementSet resolves concurrent chaotic adds, deletes, and multi-node merges', () => {
      const nodeA = new LWWElementSet<{ id: string; val: number }>((x) => x.id);
      const nodeB = new LWWElementSet<{ id: string; val: number }>((x) => x.id);
      const nodeC = new LWWElementSet<{ id: string; val: number }>((x) => x.id);

      const item1 = { id: 'item-1', val: 100 };
      const item2 = { id: 'item-2', val: 200 };
      const item3 = { id: 'item-3', val: 300 };

      // Concurrent operations with timestamp ordering
      nodeA.add(item1, 100);
      nodeB.add(item2, 120);
      nodeC.add(item3, 130);

      nodeA.remove(item2, 150); // nodeA removes item2 after nodeB added it
      nodeB.remove(item1, 90);  // nodeB removes item1 BEFORE nodeA added it (t=90 < t=100) -> add wins

      // 3-way merge
      const merged = nodeA.merge(nodeB).merge(nodeC);

      expect(merged.has(item1)).toBe(true);  // Add at t=100 won over Remove at t=90
      expect(merged.has(item2)).toBe(false); // Remove at t=150 won over Add at t=120
      expect(merged.has(item3)).toBe(true);  // Add at t=130
    });

    it('CRDT PNCounter converges accurately under multi-node concurrent increments and decrements', () => {
      const counters = [new PNCounter(), new PNCounter(), new PNCounter(), new PNCounter()];

      // 4 worker nodes independently updating their counters
      counters[0].increment('node-0', 10);
      counters[0].decrement('node-0', 3);

      counters[1].increment('node-1', 25);
      counters[1].decrement('node-1', 5);

      counters[2].increment('node-2', 50);

      counters[3].decrement('node-3', 12);

      // Merge all 4 nodes into one
      const unified = counters.reduce((acc, c) => acc.merge(c), new PNCounter());

      // (10 - 3) + (25 - 5) + (50 - 0) + (0 - 12) = 7 + 20 + 50 - 12 = 65
      expect(unified.value()).toBe(65);
    });

    it('SHA-256 Hash Chain detects micro-tampering across thousands of blocks', () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `tx-${i}`,
        cost: 15500 * (i + 1),
        description: `Tx description ${i}`,
      }));

      const chain = buildHashChain(transactions);
      expect(chain.length).toBe(100);
      expect(verifyHashChain(chain).valid).toBe(true);

      // Tamper block 42
      chain[42].tx.cost = 999999;
      const tamperResult = verifyHashChain(chain);
      expect(tamperResult.valid).toBe(false);
      expect(tamperResult.tamperedIndex).toBe(42);
    });
  });
});
