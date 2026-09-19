import { describe, it, expect, beforeEach } from 'vitest';
import {
  WebWorkerSwarmBus,
  LWWElementSet,
  PNCounter,
  calculateHaversineDistance,
  calculateTransferFee,
  validateRouteLocations,
  calculateGuidePay,
  matchGuide,
  calculateFastingWindow,
  scheduleAtHomeSample,
  generatePreOpChecklist,
  auditLedger,
  buildHashChain,
  verifyHashChain,
  sha256Sync,
  signLedgerSeal,
} from '../../../src/infrastructure/workers';
import { SwarmMessage } from '../../../src/application/ports/IActorSwarmBus';

describe('Integration Test: Web Worker Multi-Agent Swarm Concurrency & CRDT', () => {
  let swarmBus: WebWorkerSwarmBus;

  beforeEach(() => {
    swarmBus = new WebWorkerSwarmBus();
  });

  // ==========================================================================
  // 1. [DRV] Driver Subagent
  // ==========================================================================
  describe('1. Driver Subagent Worker [DRV]', () => {
    it('calculates standard and XL transfer fees with waiting surcharge', () => {
      // Standard JMC transfer
      const stdTransfer = calculateTransferFee({
        origin: 'Aeropuerto JMC Rionegro',
        destination: 'Hotel Inntu Laureles',
        paxCount: 2,
        vehicleType: 'Standard',
      });
      expect(stdTransfer.transferFeeCOP).toBe(145000);
      expect(stdTransfer.corridor).toBe('RIONEGRO_MEDELLIN');

      // Uber XL with 5 pax
      const xlTransfer = calculateTransferFee({
        origin: 'Aeropuerto JMC Rionegro',
        destination: 'Hotel Inntu Laureles',
        paxCount: 5,
        vehicleType: 'Uber XL',
      });
      expect(xlTransfer.transferFeeCOP).toBe(160000);

      // Urban transfer with 2 waiting hours
      const urbanWithWait = calculateTransferFee({
        origin: 'Hotel Inntu Laureles',
        destination: 'Clínica CIMA El Poblado',
        vehicleType: 'Standard',
        waitingHours: 2,
      });
      expect(urbanWithWait.baseFareCOP).toBe(45000);
      expect(urbanWithWait.waitingFeeCOP).toBe(50000); // 2 * 25,000 COP
      expect(urbanWithWait.transferFeeCOP).toBe(95000);
    });

    it('computes Haversine distance between coordinates accurately', () => {
      const jmcCoords = { latitude: 6.1645, longitude: -75.4278 };
      const inntuCoords = { latitude: 6.2442, longitude: -75.5922 };

      const distanceKm = calculateHaversineDistance(jmcCoords, inntuCoords);
      expect(distanceKm).toBeGreaterThan(15);
      expect(distanceKm).toBeLessThan(30);
    });

    it('enforces fail-fast invariant rejecting non-operative zones (Mocoa)', () => {
      expect(() => {
        calculateTransferFee({
          origin: 'Aeropuerto JMC Rionegro',
          destination: 'Hotel Mocoa Putumayo',
        });
      }).toThrowError(/Zona Prohibida/);
    });
  });

  // ==========================================================================
  // 2. [GUIA] Guide Subagent
  // ==========================================================================
  describe('2. Guide Subagent Worker [GUIA]', () => {
    it('calculates tiered meal subsidies correctly ($8k, $25k, $35k, $45k, $0)', () => {
      // < 3 hours -> 0 meal subsidy
      const shortShift = calculateGuidePay(2.5);
      expect(shortShift.basePayCOP).toBe(38750);
      expect(shortShift.mealSubsidyCOP).toBe(0);
      expect(shortShift.totalPayCOP).toBe(38750);

      // 3 to 4.5 hours -> 8,000 COP snack tier
      const snackShift = calculateGuidePay(4.0);
      expect(snackShift.basePayCOP).toBe(62000);
      expect(snackShift.mealSubsidyCOP).toBe(8000);
      expect(snackShift.totalPayCOP).toBe(70000);

      // 5 to 7.5 hours -> 25,000 COP half day tier
      const halfDayShift = calculateGuidePay(6.0);
      expect(halfDayShift.basePayCOP).toBe(93000);
      expect(halfDayShift.mealSubsidyCOP).toBe(25000);
      expect(halfDayShift.totalPayCOP).toBe(118000);

      // 8 to 11.5 hours -> 35,000 COP full day tier
      const fullDayShift = calculateGuidePay({ hours: 8.0, includePrepAllowance: true });
      expect(fullDayShift.basePayCOP).toBe(124000);
      expect(fullDayShift.mealSubsidyCOP).toBe(35000);
      expect(fullDayShift.prepAllowanceCOP).toBe(20000);
      expect(fullDayShift.totalPayCOP).toBe(179000);

      // >= 12 hours -> 45,000 COP extended full day tier
      const extendedShift = calculateGuidePay(13.0);
      expect(extendedShift.mealSubsidyCOP).toBe(45000);
    });

    it('matches available guides based on required patient languages', () => {
      const matchPortuguese = matchGuide({ patientLanguages: ['PT', 'ES'] });
      expect(matchPortuguese.length).toBeGreaterThan(0);
      expect(matchPortuguese[0].languages).toContain('PT');

      const matchFrench = matchGuide({ patientLanguages: ['FR'] });
      expect(matchFrench.length).toBeGreaterThan(0);
      expect(matchFrench[0].languages).toContain('FR');
    });
  });

  // ==========================================================================
  // 3. [NURSE] Nurse Subagent
  // ==========================================================================
  describe('3. Nurse Subagent Worker [NURSE]', () => {
    it('calculates fasting countdown and alert checkpoints', () => {
      const scheduledLab = '2026-08-26T05:30:00.000Z';
      const fasting = calculateFastingWindow({
        scheduledLabTime: scheduledLab,
        fastingHours: 8,
      });

      expect(fasting.fastingHours).toBe(8);
      // Fasting start should be 8 hours before 05:30 -> 21:30 previous day
      expect(new Date(fasting.fastingStartTime).toISOString()).toBe('2026-08-25T21:30:00.000Z');
      expect(fasting.alertCheckpoints.length).toBe(4);
    });

    it('schedules at-home sampling with hotel room details and standard fee', () => {
      const sample = scheduleAtHomeSample({
        patientId: 'ENT-PAX-0341',
        hotel: 'Hotel Inntu Laureles',
        roomNumber: '1004',
        scheduledTime: '2026-08-26T05:30:00.000Z',
        targetLab: 'Laboratorio Echavarría',
      });

      expect(sample.serviceFeeCOP).toBe(65000);
      expect(sample.hotel).toBe('Hotel Inntu Laureles');
      expect(sample.roomNumber).toBe('1004');
      expect(sample.fastingRequired).toBe(true);
      expect(sample.assignedNurseName).toBe('Enf. Andrea Morales');
    });

    it('generates pre-op preparation checklist and medication alerts', () => {
      const preOp = generatePreOpChecklist({
        surgeryType: 'Rinoplastia & Blefaroplastia',
        surgeryDateTime: '2026-08-27T08:00:00.000Z',
      });

      expect(preOp.checklist.length).toBe(5);
      expect(preOp.checklist[0].task).toContain('anticoagulantes');
    });
  });

  // ==========================================================================
  // 4. [FIN] Financial Auditor Subagent & Cryptographic Hashing
  // ==========================================================================
  describe('4. Financial Auditor Subagent [FIN] & SHA-256 Ledger Chaining', () => {
    it('audits ledger items: Out-of-Pocket + Companion + Taxis - Advances = Net', () => {
      const auditResult = auditLedger({
        transactions: [
          { id: 'tx-1', type: 'FLEET_TAXI', amountUnits: 160000 },
          { id: 'tx-2', type: 'GUIDE_FEE', amountUnits: 124000 },
          { id: 'tx-3', type: 'OUT_OF_POCKET', amountUnits: 85000 },
          { id: 'tx-4', type: 'CASH_ADVANCE', amountUnits: 500000 },
        ],
      });

      expect(auditResult.audited).toBe(true);
      expect(auditResult.totalFleetTaxis).toBe(160000);
      expect(auditResult.totalCompanionFees).toBe(124000);
      expect(auditResult.totalOutOfPocket).toBe(85000);
      expect(auditResult.totalExpenses).toBe(369000);
      expect(auditResult.totalAdvances).toBe(500000);
      expect(auditResult.netBalance).toBe(-131000);
      expect(auditResult.status).toBe('SURPLUS_MEDICAL_TRIP');
      expect(auditResult.isRefundDue).toBe(true);
    });

    it('generates deterministic SHA-256 hashes and builds linked blockchain-style audit chain', () => {
      const hash1 = sha256Sync('Medical Trip Colombia 2026');
      const hash2 = sha256Sync('Medical Trip Colombia 2026');
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);

      const txs = [
        { id: 'tx-01', cost: 160000, desc: 'JMC Airport Transfer' },
        { id: 'tx-02', cost: 159000, desc: 'Guide Shift 8h' },
        { id: 'tx-03', cost: 85000, desc: 'Cruz Verde Pharmacy Gotas' },
      ];

      const chain = buildHashChain(txs);
      expect(chain.length).toBe(3);
      expect(chain[0].prevHash).toBe('GENESIS_HASH');
      expect(chain[1].prevHash).toBe(chain[0].hash);
      expect(chain[2].prevHash).toBe(chain[1].hash);

      const verification = verifyHashChain(chain);
      expect(verification.valid).toBe(true);
      expect(verification.chainLength).toBe(3);
    });

    it('detects tampering in amounts or broken previous hash pointers', () => {
      const txs = [
        { id: 'tx-01', cost: 160000 },
        { id: 'tx-02', cost: 159000 },
        { id: 'tx-03', cost: 85000 },
      ];

      const chain = buildHashChain(txs);
      expect(verifyHashChain(chain).valid).toBe(true);

      // Tamper transaction amount in block 1
      chain[1].tx.cost = 999999;
      const tamperCheck = verifyHashChain(chain);
      expect(tamperCheck.valid).toBe(false);
      expect(tamperCheck.tamperedIndex).toBe(1);
    });

    it('creates cryptographic digital signature seal over ledger head hash', () => {
      const txs = [{ id: 'tx-1', cost: 160000 }];
      const chain = buildHashChain(txs);
      const headHash = chain[0].hash;

      const seal = signLedgerSeal(headHash, 'data:image/png;base64,mockSignatureImage', {
        patientId: 'ENT-PAX-0171',
        patientName: 'Catia Rodrigues',
      });

      expect(seal.signedLedgerHash).toBe(headHash);
      expect(seal.signatureBlobHash.length).toBe(64);
      expect(seal.patientName).toBe('Catia Rodrigues');
    });
  });

  // ==========================================================================
  // 5. WebWorkerSwarmBus Point-to-Point & Broadcast Dispatching
  // ==========================================================================
  describe('5. Swarm Bus Messaging & RPC Task Execution', () => {
    it('dispatches point-to-point and broadcast messages to subscribers', async () => {
      const receivedDrv: SwarmMessage[] = [];
      const receivedBroadcast: SwarmMessage[] = [];

      const unsubDrv = swarmBus.subscribe('DRV', (msg) => {
        receivedDrv.push(msg);
      });

      const unsubBroad = swarmBus.subscribe('BROADCAST', (msg) => {
        receivedBroadcast.push(msg);
      });

      const msg1: SwarmMessage = {
        id: 'msg-1',
        sender: 'COORD',
        recipient: 'DRV',
        topic: 'DISPATCH_TRANSFER',
        payload: { patientId: 'rva171' },
        timestamp: new Date().toISOString(),
      };

      await swarmBus.postMessageToAgent('DRV', msg1);
      expect(receivedDrv.length).toBe(1);
      expect(receivedDrv[0].id).toBe('msg-1');

      const broadcastMsg: SwarmMessage = {
        id: 'msg-2',
        sender: 'COORD',
        topic: 'DAILY_STANDUP',
        payload: { date: '2026-08-25' },
        timestamp: new Date().toISOString(),
      };

      await swarmBus.broadcast(broadcastMsg);
      expect(receivedBroadcast.length).toBe(1);

      unsubDrv();
      unsubBroad();
    });

    it('executes tasks across all 4 subagent actors via executeAgentTask()', async () => {
      // DRV task
      const drvRes = await swarmBus.executeAgentTask('DRV', 'CALCULATE_TRANSFER_FEE', {
        origin: 'Aeropuerto JMC',
        destination: 'Hotel Inntu',
        paxCount: 1,
      });
      expect(drvRes.transferFeeCOP).toBe(145000);

      // GUIA task
      const guiaRes = await swarmBus.executeAgentTask('GUIA', 'CALCULATE_GUIDE_PAY', {
        hours: 8.0,
      });
      expect(guiaRes.totalPayCOP).toBe(159000);

      // NURSE task
      const nurseRes = await swarmBus.executeAgentTask('NURSE', 'CALCULATE_FASTING_WINDOW', {
        scheduledLabTime: '2026-08-26T06:00:00.000Z',
        fastingHours: 8,
      });
      expect(nurseRes.fastingHours).toBe(8);

      // FIN task
      const finRes = await swarmBus.executeAgentTask('FIN', 'AUDIT_LEDGER', {
        totalCuentaCobro: 434000,
        advanceTotal: 2098100,
      });
      expect(finRes.audited).toBe(true);
      expect(finRes.netBalance).toBe(-1664100);
    });
  });

  // ==========================================================================
  // 6. CRDT Conflict-Free State Synchronization (LWW-Element-Set & PN-Counter)
  // ==========================================================================
  describe('6. CRDT Conflict-Free State Synchronization', () => {
    it('LWWElementSet: resolves offline concurrent adds and removals with add-bias', () => {
      const setA = new LWWElementSet<{ id: string; name: string }>((i) => i.id);
      const setB = new LWWElementSet<{ id: string; name: string }>((i) => i.id);

      const item1 = { id: 'evt-01', name: 'Consulta Oftalmológica' };
      const item2 = { id: 'evt-02', name: 'Traslado JMC' };

      // Node A adds item 1 at t=100
      setA.add(item1, 100);

      // Node B adds item 2 at t=110, removes item 1 at t=150
      setB.add(item2, 110);
      setB.remove(item1, 150);

      expect(setA.has(item1)).toBe(true);
      expect(setB.has(item1)).toBe(false);

      // Merge B into A
      const mergedAB = setA.merge(setB);
      expect(mergedAB.has(item1)).toBe(false); // Remove at t=150 won over Add at t=100
      expect(mergedAB.has(item2)).toBe(true);

      // Node A re-adds item 1 with later timestamp t=200
      mergedAB.add(item1, 200);
      expect(mergedAB.has(item1)).toBe(true);
    });

    it('PNCounter: converges replicated positive-negative counters across swarm nodes', () => {
      const counterNode1 = new PNCounter();
      const counterNode2 = new PNCounter();

      // Node 1: Guide logs +3 hours, -1 hour correction
      counterNode1.increment('guide-01', 3);
      counterNode1.decrement('guide-01', 1);

      // Node 2: Coordinator logs +5 hours for driver
      counterNode2.increment('driver-01', 5);

      expect(counterNode1.value()).toBe(2);
      expect(counterNode2.value()).toBe(5);

      // Merge counters
      const merged = counterNode1.merge(counterNode2);
      expect(merged.value()).toBe(7); // (3 - 1) + 5 = 7
    });
  });
});
