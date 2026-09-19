import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  DomainError,
  GeospatialInvariantViolationError,
  Money,
  ActorEvent,
  sha256,
  IActorEventBusPort
} from '../../src/domain/index.js';

import {
  CRDTPNCounter,
  CRDTLWWElementSet,
  CRDTObservedRemoveSet,
  CRDTActorState,
  DriverActor,
  GuideActor,
  NurseActor,
  FinancialAuditorActor,
  GENESIS_HASH,
  ActorMeshController,
  SimulatedMessageChannel,
  createChannel
} from '../../src/actors/index.js';

describe('Milestone 4 — Decentralized Actor Model & Concurrency Unit Tests', () => {

  // ==========================================================================
  // 1. CRDT Conflict-Free Replicated Data Types (PN-Counter, LWW, OR-Set)
  // ==========================================================================
  describe('1. CRDT Conflict-Free State Synchronization Primitives', () => {
    describe('PN-Counter (Positive-Negative Counter in BigInt Cents)', () => {
      it('tracks increments and decrements accurately without float rounding drift', () => {
        const counter = new CRDTPNCounter();
        counter.increment('ACTOR-DRV', 5000000n); // 50,000 COP (5M cents)
        counter.increment('ACTOR-GUIA', 8500000n); // 85,000 COP (8.5M cents)
        counter.decrement('ACTOR-DRV', 1000000n); // 10,000 COP adjustment

        assert.equal(counter.value, 12500000n);
        assert.equal(counter.positiveValue, 13500000n);
        assert.equal(counter.negativeValue, 1000000n);
      });

      it('satisfies commutativity, idempotency, and associativity during state merge', () => {
        const nodeA = new CRDTPNCounter();
        const nodeB = new CRDTPNCounter();

        nodeA.increment('NODE-1', 100n);
        nodeA.increment('NODE-2', 50n);

        nodeB.increment('NODE-1', 120n);
        nodeB.increment('NODE-3', 200n);
        nodeB.decrement('NODE-2', 30n);

        // 1. Idempotency: A.merge(A) === A
        const cloneA = nodeA.clone();
        cloneA.merge(nodeA);
        assert.equal(cloneA.value, nodeA.value);

        // 2. Commutativity: Merge(A, B) === Merge(B, A)
        const mergeAB = nodeA.clone().merge(nodeB);
        const mergeBA = nodeB.clone().merge(nodeA);

        assert.equal(mergeAB.value, mergeBA.value);
        // Node 1: max(100, 120) = 120
        // Node 2: max(50, 0) - max(0, 30) = 50 - 30 = 20
        // Node 3: max(0, 200) = 200
        // Total = 120 + 20 + 200 = 340
        assert.equal(mergeAB.value, 340n);

        // 3. Associativity: (A + B) + C === A + (B + C)
        const nodeC = new CRDTPNCounter();
        nodeC.increment('NODE-4', 500n);

        const leftAssoc = nodeA.clone().merge(nodeB).merge(nodeC);
        const rightAssoc = nodeA.clone().merge(nodeB.clone().merge(nodeC));
        assert.equal(leftAssoc.value, rightAssoc.value);
      });

      it('correctly serializes to and deserializes from JSON', () => {
        const original = new CRDTPNCounter();
        original.increment('DRV', 4500000n);
        original.decrement('DRV', 500000n);

        const json = original.toJSON();
        const restored = CRDTPNCounter.fromJSON(json);

        assert.equal(restored.value, original.value);
        assert.equal(restored.positiveValue, 4500000n);
        assert.equal(restored.negativeValue, 500000n);
      });
    });

    describe('LWW-Element-Set (Last-Write-Wins Register)', () => {
      it('resolves concurrent status updates with timestamp and deterministic actor tie-breaking', () => {
        const lwwA = new CRDTLWWElementSet();
        const lwwB = new CRDTLWWElementSet();

        // Node A updates stop STOP-01 at timestamp 1000
        lwwA.set('STOP-01', 'EN_CAMINO', 1000, 'DRV');
        // Node B updates stop STOP-01 at timestamp 2000
        lwwB.set('STOP-01', 'EN_SITIO', 2000, 'GUIA');

        // Merging A and B resolves to newest timestamp (2000 => 'EN_SITIO')
        lwwA.merge(lwwB);
        assert.equal(lwwA.get('STOP-01'), 'EN_SITIO');

        // Simultaneous write tie-breaker: same timestamp, higher actorId wins
        const lww1 = new CRDTLWWElementSet();
        const lww2 = new CRDTLWWElementSet();
        lww1.set('KEY-TIE', 'VAL-A', 5000, 'ACTOR-A');
        lww2.set('KEY-TIE', 'VAL-B', 5000, 'ACTOR-B'); // 'ACTOR-B' > 'ACTOR-A'

        lww1.merge(lww2);
        assert.equal(lww1.get('KEY-TIE'), 'VAL-B');
      });

      it('supports element removal via tombstones and respects removal timestamps', () => {
        const lww = new CRDTLWWElementSet();
        lww.set('STOP-TEMP', 'ACTIVE', 1000, 'DRV');
        assert.equal(lww.has('STOP-TEMP'), true);

        // Remove at timestamp 1500
        lww.remove('STOP-TEMP', 1500, 'DRV');
        assert.equal(lww.has('STOP-TEMP'), false);
        assert.equal(lww.get('STOP-TEMP'), undefined);

        // Subsequent re-addition at timestamp 2000 wins over removal
        lww.set('STOP-TEMP', 'RE-ACTIVATED', 2000, 'GUIA');
        assert.equal(lww.has('STOP-TEMP'), true);
        assert.equal(lww.get('STOP-TEMP'), 'RE-ACTIVATED');
      });
    });

    describe('Observed-Remove Set (OR-Set / Add-Wins Set)', () => {
      it('supports additions with unique causal tags and removal of observed elements', () => {
        const orSet = new CRDTObservedRemoveSet();
        const tag1 = orSet.add('TASK-1', { desc: 'Recoger paciente en Clofán' }, 'GUIA');
        assert.ok(tag1);
        assert.equal(orSet.has('TASK-1'), true);
        assert.equal(orSet.get('TASK-1').desc, 'Recoger paciente en Clofán');

        // Remove observed task
        orSet.remove('TASK-1');
        assert.equal(orSet.has('TASK-1'), false);
      });

      it('exhibits add-wins semantics when concurrent addition occurs during remove merge', () => {
        const node1 = new CRDTObservedRemoveSet();
        const node2 = new CRDTObservedRemoveSet();

        // Both nodes observe TASK-A
        node1.add('TASK-A', 'Data V1', 'NODE1', 'tag-initial');
        node2.merge(node1);

        // Node 1 removes TASK-A (tombstones tag-initial)
        node1.remove('TASK-A');

        // Node 2 concurrently adds TASK-A with a fresh tag
        node2.add('TASK-A', 'Data V2 Concurrente', 'NODE2', 'tag-concurrent');

        // Merging node1 and node2: the unobserved fresh addition wins!
        node1.merge(node2);
        assert.equal(node1.has('TASK-A'), true);
        assert.equal(node1.get('TASK-A'), 'Data V2 Concurrente');
      });
    });

    describe('CRDTActorState Composite Document', () => {
      it('converges multi-actor state across stops, expenses, locations, and vector clocks', () => {
        const stateDriver = new CRDTActorState();
        const stateGuide = new CRDTActorState();

        stateDriver.updateStopStatus('STOP-CLOFAN', 'EN_CAMINO', 'DRV-RAMON', 1000);
        stateDriver.updateActorLocation('DRV-RAMON', { lat: 6.2206, lng: -75.5714 }, 1000);
        stateDriver.addExpenseCents('DRV-RAMON', 3500000n);

        stateGuide.updateStopStatus('STOP-CLOFAN', 'EN_SITIO', 'GUIA-YENNY', 1500);
        stateGuide.addExpenseCents('GUIA-YENNY', 8500000n);

        // Merge Guide into Driver
        stateDriver.merge(stateGuide);
        const snap = stateDriver.getSnapshot();

        assert.equal(snap.totalExpenseCents, '12000000'); // 35k + 85k = 120k COP (12,000,000 cents)
        assert.equal(snap.stopStatuses['STOP-CLOFAN'].status, 'EN_SITIO');
        assert.equal(snap.stopStatuses['STOP-CLOFAN'].updatedBy, 'GUIA-YENNY');
        assert.equal(snap.actorLocations['DRV-RAMON'].lat, 6.2206);
        assert.equal(snap.vectorClock['DRV-RAMON'], 3);
        assert.equal(snap.vectorClock['GUIA-YENNY'], 2);
      });
    });
  });

  // ==========================================================================
  // 2. [DRV] Driver Actor
  // ==========================================================================
  describe('2. [DRV] Driver Actor (Ramón Rosero / Aeroturex Kia Sonet NLX666)', () => {
    let driver;

    beforeEach(() => {
      driver = new DriverActor({
        actorId: 'ACTOR-DRV-RAMON',
        driverName: 'Ramón Rosero',
        vehicle: 'Aeroturex Kia Sonet NLX666'
      });
    });

    it('processes transfer lifecycle: START_TRANSFER -> ARRIVE_ORIGIN -> PASSENGER_PICKED_UP -> ARRIVE_DESTINATION', async () => {
      // 1. Start transfer from JMC Airport to Hotel Poblado
      const startRes = await driver.receive({
        action: 'START_TRANSFER',
        payload: {
          transferId: 'TRF-001',
          origin: { lat: 6.1645, lng: -75.4278, name: 'Aeropuerto JMC' },
          destination: { lat: 6.2088, lng: -75.5678, name: 'Hotel Poblado Plaza' },
          patientName: 'Catia Rodriguez',
          patientUuid: 'ENT-PAX-0171'
        }
      });

      assert.equal(startRes.success, true);
      assert.equal(driver.status, 'EN_CAMINO');
      assert.equal(driver.activeTransfer.transferId, 'TRF-001');

      // 2. Arrive at Airport origin
      const arrOrigRes = await driver.receive({
        action: 'ARRIVE_ORIGIN',
        payload: {
          transferId: 'TRF-001',
          coords: { lat: 6.1645, lng: -75.4278 }
        }
      });
      assert.equal(arrOrigRes.success, true);
      assert.equal(driver.status, 'EN_ORIGEN');

      // 3. Passenger boarded
      const paxRes = await driver.receive({
        action: 'PASSENGER_PICKED_UP',
        payload: {
          transferId: 'TRF-001',
          passengerName: 'Catia Rodriguez',
          patientUuid: 'ENT-PAX-0171'
        }
      });
      assert.equal(paxRes.success, true);
      assert.equal(driver.status, 'EN_TRANSITO_DESTINO');

      // 4. Arrive at destination
      const destRes = await driver.receive({
        action: 'ARRIVE_DESTINATION',
        payload: {
          transferId: 'TRF-001',
          coords: { lat: 6.2088, lng: -75.5678 },
          finalOdometerKm: 12450
        }
      });
      assert.equal(destRes.success, true);
      assert.equal(driver.status, 'COMPLETADO');
      assert.equal(driver.completedTransfers.length, 1);
    });

    it('enforces geospatial fail-fast invariant for non-operative destination (e.g. MOCOA)', async () => {
      await assert.rejects(
        () =>
          driver.receive({
            action: 'START_TRANSFER',
            payload: {
              transferId: 'TRF-FAIL-01',
              origin: { lat: 6.1645, lng: -75.4278 },
              destination: { lat: 1.1528, lng: -76.6521 } // Mocoa Putumayo (Non-operative)
            }
          }),
        (err) => err instanceof GeospatialInvariantViolationError || err instanceof DomainError
      );
    });

    it('processes toll expense submissions with exact BigInt cents', async () => {
      const tollRes = await driver.receive({
        action: 'SUBMIT_TOLL_EXPENSE',
        payload: {
          expenseId: 'EXP-TOLL-01',
          transferId: 'TRF-001',
          tollBoothName: 'Peaje Túnel de Oriente',
          amountInCents: 2460000n, // 24,600 COP
          receiptBlobId: 'blob-toll-receipt-01'
        }
      });

      assert.equal(tollRes.success, true);
      assert.equal(tollRes.amountInCents, '2460000');
      assert.equal(driver.submittedTolls.length, 1);
      assert.equal(driver.submittedTolls[0].description, 'Peaje Peaje Túnel de Oriente - Aeroturex Kia Sonet NLX666');
    });

    it('updates GPS coordinates and telemetry stream', async () => {
      const gpsRes = await driver.receive({
        action: 'UPDATE_GPS_POSITION',
        payload: {
          lat: 6.2150,
          lng: -75.5700,
          speed: 45,
          heading: 180
        }
      });

      assert.equal(gpsRes.success, true);
      assert.equal(driver.currentLocation.lat, 6.2150);
      assert.equal(driver.currentLocation.speed, 45);
    });
  });

  // ==========================================================================
  // 3. [GUIA] Bilingual Guide Actor
  // ==========================================================================
  describe('3. [GUIA] Bilingual Guide Actor (Yenny Restrepo / Alejandro)', () => {
    let guide;

    beforeEach(() => {
      guide = new GuideActor({
        actorId: 'ACTOR-GUIA-YENNY',
        guideName: 'Yenny Restrepo',
        languages: ['ES', 'EN']
      });
    });

    it('starts shift and records clinic check-in and patient symptoms', async () => {
      // 1. Start shift
      const shiftRes = await guide.receive({
        action: 'START_SHIFT',
        payload: {
          shiftId: 'SHIFT-YENNY-01',
          dayNumber: 1,
          startTime: '2026-09-01T07:00:00.000Z',
          hourlyRateCents: 1550000n, // 15,500 COP/hr
          mealSubsidyCents: 3500000n, // 35,000 COP subsidy
          patientUuid: 'ENT-PAX-0171',
          patientName: 'Catia Rodriguez'
        }
      });

      assert.equal(shiftRes.success, true);
      assert.equal(guide.status, 'ON_SHIFT');
      assert.equal(guide.activeShift.patientName, 'Catia Rodriguez');

      // 2. Clinic Check-in
      const checkinRes = await guide.receive({
        action: 'LOG_CLINIC_CHECKIN',
        payload: {
          clinicName: 'Clínica Clofán',
          coords: { lat: 6.2206, lng: -75.5714 },
          appointmentType: 'Valoración Oftalmológica Clofán',
          itineraryItemId: 'ITN-CLOFAN-01'
        }
      });

      assert.equal(checkinRes.success, true);
      assert.equal(guide.status, 'IN_CONSULTATION');
      assert.equal(guide.clinicCheckIns.length, 1);

      // 3. Log Patient Symptom
      const symptomRes = await guide.receive({
        action: 'LOG_PATIENT_SYMPTOM',
        payload: {
          patientUuid: 'ENT-PAX-0171',
          symptomDescription: 'Leve molestia ocular post-dilatación pupilar',
          severity: 'MILD',
          vitalSigns: { bp: '118/76', pulse: 68 },
          reportedToDoctor: true
        }
      });

      assert.equal(symptomRes.success, true);
      assert.equal(guide.symptomLogs.length, 1);
    });

    it('computes exact shift duration, overtime (>8.0 hours), and total financial earnings in cents', async () => {
      // Start 10-hour shift (07:00 to 17:00 => 10 hours => 8.0 base + 2.0 overtime)
      await guide.receive({
        action: 'START_SHIFT',
        payload: {
          shiftId: 'SHIFT-OVERTIME-01',
          startTime: '2026-09-01T07:00:00.000Z',
          hourlyRateCents: 2000000n, // 20,000 COP/hr
          mealSubsidyCents: 3000000n // 30,000 COP subsidy
        }
      });

      const endRes = await guide.receive({
        action: 'END_SHIFT',
        payload: {
          shiftId: 'SHIFT-OVERTIME-01',
          endTime: '2026-09-01T17:00:00.000Z', // 10 hours later
          breaksMinutes: 0
        }
      });

      assert.equal(endRes.success, true);
      assert.equal(guide.status, 'SHIFT_ENDED');
      const shift = endRes.finalizedShift;

      assert.equal(shift.totalHours, 10);
      assert.equal(shift.baseHours, 8);
      assert.equal(shift.overtimeHours, 2);

      // Base Earnings: 8 hrs * 20,000 = 160,000 COP (16,000,000 cents)
      assert.equal(shift.baseEarningsCents, '16000000');
      // Overtime Earnings: 2 hrs * (20,000 * 1.5) = 2 * 30,000 = 60,000 COP (6,000,000 cents)
      assert.equal(shift.overtimeEarningsCents, '6000000');
      // Subsidy: 30,000 COP (3,000,000 cents)
      assert.equal(shift.mealSubsidyCents, '3000000');
      // Total: 160k + 60k + 30k = 250,000 COP (25,000,000 cents)
      assert.equal(shift.totalEarningsCents, '25000000');
    });

    it('submits out-of-pocket pharmacy and taxi expenses', async () => {
      const expRes = await guide.receive({
        action: 'SUBMIT_OUT_OF_POCKET_EXPENSE',
        payload: {
          expenseId: 'EXP-PHARM-01',
          itineraryItemId: 'ITN-CLOFAN-01',
          category: 'PHARMACY',
          description: 'Colirios e insumos postoperatorios Cruz Verde',
          amountInCents: 8500000n, // 85,000 COP
          receiptBlobId: 'blob-pharm-receipt-01'
        }
      });

      assert.equal(expRes.success, true);
      assert.equal(expRes.amountInCents, '8500000');
      assert.equal(guide.outOfPocketExpenses.length, 1);
    });
  });

  // ==========================================================================
  // 4. [NURSE] Nurse Actor
  // ==========================================================================
  describe('4. [NURSE] Nurse Actor (Villa Anita / Emi Echavarría)', () => {
    let nurse;

    beforeEach(() => {
      nurse = new NurseActor({
        actorId: 'ACTOR-NURSE-EMI',
        nurseName: 'Emi Echavarría',
        licenseNumber: 'COL-ENF-8841'
      });
    });

    it('executes domiciliary visit: vitals logging, medication, wound photo, and completion', async () => {
      // 1. Start Visit
      const startRes = await nurse.receive({
        action: 'START_DOMICILIARY_VISIT',
        payload: {
          visitId: 'VISIT-001',
          patientUuid: 'ENT-PAX-0077',
          patientName: 'Rumai Quirúrgico',
          address: 'Apartamento Poblado Edificio Energy Living',
          coords: { lat: 6.2088, lng: -75.5678 }
        }
      });

      assert.equal(startRes.success, true);
      assert.equal(nurse.status, 'IN_VISIT');

      // 2. Log Vital Signs
      const vitalsRes = await nurse.receive({
        action: 'LOG_VITAL_SIGNS',
        payload: {
          visitId: 'VISIT-001',
          patientUuid: 'ENT-PAX-0077',
          bloodPressure: { systolic: 115, diastolic: 75 },
          heartRate: 72,
          o2Saturation: 99,
          temperature: 36.5,
          painScale: 2
        }
      });

      assert.equal(vitalsRes.success, true);
      assert.equal(nurse.vitalsHistory.length, 1);

      // 3. Record Medication
      const medRes = await nurse.receive({
        action: 'RECORD_MEDICATION_ADMINISTERED',
        payload: {
          visitId: 'VISIT-001',
          patientUuid: 'ENT-PAX-0077',
          medicationName: 'Cefalexina 500mg',
          dosage: '1 cápsula VO',
          route: 'ORAL',
          batchNumber: 'LOTE-CFX-2026',
          prescribingDoctor: 'Dr. Cirujano Plástico'
        }
      });

      assert.equal(medRes.success, true);
      assert.equal(nurse.medicationsAdministered.length, 1);

      // 4. Capture Wound Photo & Drainage
      const woundRes = await nurse.receive({
        action: 'CAPTURE_WOUND_PHOTO',
        payload: {
          visitId: 'VISIT-001',
          patientUuid: 'ENT-PAX-0077',
          woundLocation: 'Abdomen / Incisión quirúrgica',
          drainageType: 'SEROHEMÁTICO',
          drainageAmountMl: 25,
          photoBlobId: 'blob-wound-photo-001'
        }
      });

      assert.equal(woundRes.success, true);
      assert.equal(nurse.woundPhotos.length, 1);

      // 5. Complete Visit
      const compRes = await nurse.receive({
        action: 'COMPLETE_VISIT',
        payload: {
          visitId: 'VISIT-001',
          patientSignatureBlobId: 'blob-sig-patient-0077',
          clinicalNotes: 'Paciente evoluciona favorablemente. Sin signos de infección.'
        }
      });

      assert.equal(compRes.success, true);
      assert.equal(nurse.status, 'VISIT_COMPLETED');
      assert.equal(nurse.completedVisits.length, 1);
    });

    it('rejects physiological impossible vital signs (fail-fast validation)', async () => {
      await assert.rejects(
        () =>
          nurse.receive({
            action: 'LOG_VITAL_SIGNS',
            payload: {
              bloodPressure: { systolic: 320, diastolic: 75 } // Systolic 320 is fatal / impossible
            }
          }),
        (err) => err.message.includes('Presión sistólica fuera de rango')
      );

      await assert.rejects(
        () =>
          nurse.receive({
            action: 'LOG_VITAL_SIGNS',
            payload: {
              temperature: 55.0 // 55°C is impossible
            }
          }),
        (err) => err.message.includes('Temperatura fuera de rango')
      );
    });

    it('logs domiciliary blood sample collection with tubes count', async () => {
      const sampleRes = await nurse.receive({
        action: 'LOG_SAMPLE_COLLECTION',
        payload: {
          visitId: 'VISIT-002',
          patientUuid: 'ENT-PAX-1126',
          testTypes: ['HEMOGRAMA', 'TIEMPOS_COAGULACION', 'UROANÁLISIS'],
          tubesCount: 3,
          labName: 'Laboratorio Médico Echavarría'
        }
      });

      assert.equal(sampleRes.success, true);
      assert.equal(sampleRes.tubesCount, 3);
      assert.equal(nurse.status, 'SAMPLE_COLLECTED');
    });
  });

  // ==========================================================================
  // 5. [FIN] Single-Writer Financial Auditor Actor
  // ==========================================================================
  describe('5. [FIN] Single-Writer Financial Auditor (Dra. Jenny Acosta)', () => {
    let auditor;

    beforeEach(() => {
      auditor = new FinancialAuditorActor({
        actorId: 'ACTOR-FIN-AUDITOR',
        auditorName: 'Dra. Jenny Acosta',
        reservationCode: 'RVA171',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP'
      });
    });

    it('acts as single-writer authority: validates, audits, and appends to SHA-256 hash chain', async () => {
      // 1. Record Patient Advance of 2,000,000 COP
      const advRes = await auditor.receive({
        action: 'RECORD_ADVANCE',
        payload: {
          advanceId: 'ADV-171-01',
          reservationCode: 'RVA171',
          amountInCents: 200000000n // 2,000,000 COP
        }
      });

      assert.equal(advRes.success, true);
      assert.equal(auditor.eventStream.length, 1);
      assert.equal(auditor.headHash.length, 64);
      assert.notEqual(auditor.headHash, GENESIS_HASH);

      // 2. Propose & Approve Driver Toll: 25,000 COP
      const tollRes = await auditor.receive({
        action: 'PROPOSE_EXPENSE',
        payload: {
          expenseId: 'EXP-171-01',
          category: 'TAXI',
          description: 'Peaje Túnel de Oriente Aeropuerto',
          amountInCents: 2500000n,
          actorId: 'ACTOR-DRV-RAMON',
          actorRole: 'DRIVER'
        }
      });

      assert.equal(tollRes.success, true);
      assert.equal(tollRes.status, 'APPROVED');
      assert.equal(auditor.eventStream.length, 2);

      // Verify second event links to first event hash
      const evt1 = auditor.eventStream[0];
      const evt2 = auditor.eventStream[1];
      assert.equal(evt2.previousHash, evt1.hash);
      assert.equal(evt2.verifyIntegrity(evt1.hash), true);

      // 3. Propose & Approve Pharmacy: 85,000 COP
      const pharmRes = await auditor.receive({
        action: 'PROPOSE_EXPENSE',
        payload: {
          expenseId: 'EXP-171-02',
          category: 'PHARMACY',
          description: 'Colirios Cruz Verde',
          amountInCents: 8500000n,
          actorId: 'ACTOR-GUIA-YENNY',
          actorRole: 'GUIDE'
        }
      });

      assert.equal(pharmRes.success, true);
      assert.equal(auditor.eventStream.length, 3);

      // 4. Verify Full Hash Chain Integrity from Genesis to Head
      const chainAudit = auditor.verifyChainIntegrity();
      assert.equal(chainAudit.valid, true);
      assert.equal(chainAudit.eventCount, 3);
      assert.equal(chainAudit.headHash, auditor.headHash);

      // 5. Verify Settlement Financial Balance
      // Advances: 2,000,000 COP
      // Expenses: 25,000 + 85,000 = 110,000 COP
      // Net Balance: 2,000,000 - 110,000 = +1,890,000 COP (189,000,000 cents)
      const settlement = auditor.getSettlementState();
      assert.equal(settlement.totalAdvances, 2000000);
      assert.equal(settlement.totalExpenses, 110000);
      assert.equal(settlement.netBalance, 1890000);
      assert.equal(settlement.netBalanceCents, '189000000');
      assert.equal(settlement.balanceStatus, 'CREDIT_REFUND_DUE');
    });

    it('rejects invalid proposals (negative amount, missing description, invalid category)', async () => {
      // 1. Negative amount
      const resNeg = await auditor.receive({
        action: 'PROPOSE_EXPENSE',
        payload: {
          expenseId: 'EXP-BAD-01',
          category: 'TAXI',
          description: 'Gasto negativo',
          amountInCents: -50000n
        }
      });
      assert.equal(resNeg.success, false);
      assert.equal(resNeg.status, 'REJECTED');
      assert.match(resNeg.reason, /positiv/i);

      // 2. Missing description
      const resNoDesc = await auditor.receive({
        action: 'PROPOSE_EXPENSE',
        payload: {
          expenseId: 'EXP-BAD-02',
          category: 'TAXI',
          description: '   ',
          amountInCents: 50000n
        }
      });
      assert.equal(resNoDesc.success, false);
      assert.match(resNoDesc.reason, /descripción/i);

      // 3. Invalid category
      const resBadCat = await auditor.receive({
        action: 'PROPOSE_EXPENSE',
        payload: {
          expenseId: 'EXP-BAD-03',
          category: 'CASINO_GAMBLING', // Invalid
          description: 'Apuestas',
          amountInCents: 50000n
        }
      });
      assert.equal(resBadCat.success, false);
      assert.match(resBadCat.reason, /Categoría inválida/i);
    });
  });

  // ==========================================================================
  // 6. Actor Mesh Controller & Point-to-Point Concurrency
  // ==========================================================================
  describe('6. Actor Mesh Controller & Point-to-Point Concurrency', () => {
    let mesh;

    beforeEach(async () => {
      mesh = new ActorMeshController();
      await mesh.initializeMesh({
        reservationCode: 'RVA171',
        patientUuid: 'ENT-PAX-0171',
        currency: 'COP'
      });
    });

    it('instantiates all 4 subagents and establishes direct point-to-point channels', () => {
      assert.ok(mesh.driverActor);
      assert.ok(mesh.guideActor);
      assert.ok(mesh.nurseActor);
      assert.ok(mesh.financialAuditor);

      assert.ok(mesh.driverActor.finPort);
      assert.ok(mesh.guideActor.finPort);
      assert.ok(mesh.nurseActor.finPort);
      assert.ok(mesh.driverActor.guidePort);
      assert.ok(mesh.guideActor.driverPort);
    });

    it('executes concurrent multi-actor operations and balances ledger cleanly', async () => {
      // 1. Record Advance
      await mesh.dispatchCommand('FINANCIAL_AUDITOR', 'RECORD_ADVANCE', {
        advanceId: 'ADV-MESH-01',
        amountInCents: 100000000n // 1,000,000 COP
      });

      // 2. Driver starts transfer
      const drvRes = await mesh.dispatchCommand('DRIVER', 'START_TRANSFER', {
        transferId: 'TRF-MESH-01',
        origin: { lat: 6.1645, lng: -75.4278 },
        destination: { lat: 6.2088, lng: -75.5678 }
      });
      assert.equal(drvRes.status, 'EN_CAMINO');

      // 3. Guide starts shift
      const guiaRes = await mesh.dispatchCommand('GUIDE', 'START_SHIFT', {
        shiftId: 'SHIFT-MESH-01',
        hourlyRateCents: 2000000n
      });
      assert.equal(guiaRes.status, 'ON_SHIFT');

      // 4. Concurrent expense proposals from Driver, Guide, and Nurse
      const p1 = mesh.dispatchCommand('DRIVER', 'SUBMIT_TOLL_EXPENSE', {
        expenseId: 'EXP-MESH-TOLL',
        amountInCents: 2460000n // 24,600 COP
      });

      const p2 = mesh.dispatchCommand('GUIDE', 'SUBMIT_OUT_OF_POCKET_EXPENSE', {
        expenseId: 'EXP-MESH-PHARM',
        category: 'PHARMACY',
        description: 'Medicamentos Cruz Verde',
        amountInCents: 7540000n // 75,400 COP
      });

      const p3 = mesh.dispatchCommand('NURSE', 'SUBMIT_SUPPLY_EXPENSE', {
        expenseId: 'EXP-MESH-SUPPLY',
        description: 'Gasas y apósitos estériles',
        amountInCents: 3000000n // 30,000 COP
      });

      // Wait for all 3 concurrent proposals to complete
      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
      assert.equal(r1.success, true);
      assert.equal(r2.success, true);
      assert.equal(r3.success, true);

      // Verify Financial Auditor processed all proposals and maintained hash chain
      const finStatus = await mesh.getFinancialSummary();
      assert.equal(finStatus.success, true);

      // Verify SHA-256 chain integrity
      const chainVerify = await mesh.dispatchCommand('FINANCIAL_AUDITOR', 'VERIFY_CHAIN_INTEGRITY');
      assert.equal(chainVerify.valid, true);
      assert.equal(chainVerify.eventCount, 4); // 1 advance + 3 expenses

      // Total Advances = 1,000,000 COP (100,000,000 cents)
      // Total Expenses = 24.6k + 75.4k + 30k = 130,000 COP (13,000,000 cents)
      // Net Balance = 1,000,000 - 130,000 = 870,000 COP (87,000,000 cents)
      assert.equal(finStatus.totalAdvances, 1000000);
      assert.equal(finStatus.totalExpenses, 130000);
      assert.equal(finStatus.netBalance, 870000);
      assert.equal(finStatus.netBalanceCents, '87000000');
    });

    it('implements IActorEventBusPort interface methods (publish, subscribe, sendActorMessage)', async () => {
      assert.ok(mesh instanceof IActorEventBusPort);

      let receivedEvent = null;
      const unsubscribe = mesh.subscribe('CUSTOM_TEST_EVENT', (evt) => {
        receivedEvent = evt;
      });

      await mesh.publish(
        new ActorEvent({
          eventId: 'EVT-BUS-TEST-01',
          actorId: 'ACTOR-TEST',
          actorRole: 'SYSTEM',
          eventType: 'CUSTOM_TEST_EVENT',
          aggregateId: 'TEST-AGG-01',
          payload: { message: 'Bus Event Delivered' }
        })
      );

      assert.ok(receivedEvent);
      assert.equal(receivedEvent.payload.message, 'Bus Event Delivered');

      unsubscribe();

      // Test sendActorMessage
      const statusRes = await mesh.sendActorMessage('DRIVER', { action: 'GET_STATUS' });
      assert.equal(statusRes.success, true);
      assert.equal(statusRes.actorRole, 'DRIVER');
    });

    it('guarantees non-blocking async execution without stalling main-thread microtasks', async () => {
      const start = Date.now();
      let microtaskExecuted = false;

      queueMicrotask(() => {
        microtaskExecuted = true;
      });

      await mesh.dispatchCommand('DRIVER', 'GET_STATUS');

      assert.equal(microtaskExecuted, true);
      assert.ok(Date.now() - start < 1000);
    });
  });
});
