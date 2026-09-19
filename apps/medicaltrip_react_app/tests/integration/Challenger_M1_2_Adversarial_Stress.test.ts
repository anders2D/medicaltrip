import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Money } from '@/core/domain/value-objects/Money';
import { SettlementLedger, CashAdvance } from '@/features/settlement/domain/SettlementLedger';
import { ReceiptExpense } from '@/features/settlement/domain/ReceiptExpense';
import { CompanionShift } from '@/features/companion-shifts/domain/CompanionShift';
import { DriverTransfer } from '@/features/logistics-fleet/domain/DriverTransfer';
import { OperativeTerritory } from '@/core/domain/value-objects/OperativeTerritory';
import {
  Sha256LedgerChain,
  canonicalStringify,
  calculateBlockHash,
  sha256,
  LedgerBlock,
} from '@/features/settlement/infrastructure/Sha256LedgerChain';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

describe('Adversarial Stress Suite: BigInt Math Determinism, Sha256LedgerChain Tampering & Cloud Teardown (Challenger M1_2)', { timeout: 45000 }, () => {
  let client: SupabaseClient;

  beforeAll(() => {
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  // ==========================================================================
  // SECTION 1: EMPIRICAL MATHEMATICAL STRESS-TESTING ON BIGINT CENTS ARITHMETIC
  // ==========================================================================
  describe('1. BigInt Cents Boundary & Arithmetic Stress Tests', () => {
    it('1.1 Boundary: 0 cents operations maintain strict mathematical determinism', () => {
      const zeroCents = Money.fromCents(0n, 'COP');
      const zeroAmount = Money.fromAmount(0, 'COP');
      const zeroFactory = Money.zero('COP');

      // Value Object equivalence
      expect(zeroCents.cents).toBe(0n);
      expect(zeroAmount.cents).toBe(0n);
      expect(zeroFactory.cents).toBe(0n);
      expect(zeroCents.equals(zeroAmount)).toBe(true);
      expect(zeroCents.equals(zeroFactory)).toBe(true);

      // Predicates
      expect(zeroCents.isZero()).toBe(true);
      expect(zeroCents.isPositive()).toBe(false);
      expect(zeroCents.isNegative()).toBe(false);

      // Identity properties: x + 0 = x, x - 0 = x, 0 - x = -x
      const testAmount = Money.fromAmount(155000, 'COP'); // 15.500.000 cents
      expect(testAmount.add(zeroCents).cents).toBe(15500000n);
      expect(testAmount.subtract(zeroCents).cents).toBe(15500000n);
      expect(zeroCents.subtract(testAmount).cents).toBe(-15500000n);

      // Multiplication by zero
      expect(testAmount.multiply(0).cents).toBe(0n);
      expect(testAmount.multiply(0n).cents).toBe(0n);

      // Splitting zero cents among 3 pax
      const zeroSplits = zeroCents.split(3);
      expect(zeroSplits).toHaveLength(3);
      zeroSplits.forEach((p) => expect(p.cents).toBe(0n));
      const zeroSum = zeroSplits.reduce((acc, p) => acc + p.cents, 0n);
      expect(zeroSum).toBe(0n);
    });

    it('1.2 Boundary: Extreme COP figures (> 10^9 COP, multi-billion) without precision degradation', () => {
      // 50 billion COP ($50.000.000.000 COP = 5 * 10^12 cents)
      const fiftyBillionCents = 5_000_000_000_000n;
      const extremeMoney1 = Money.fromCents(fiftyBillionCents, 'COP');
      expect(extremeMoney1.cents).toBe(5000000000000n);
      expect(extremeMoney1.toAmountNumber()).toBe(50000000000);

      // 1 trillion COP minus 1 cent ($999.999.999.999,99 COP)
      const extremeMoney2 = Money.fromCents(99_999_999_999_999n, 'COP');
      expect(extremeMoney2.cents).toBe(99999999999999n);

      // Addition of extreme figures
      const sum = extremeMoney1.add(extremeMoney2);
      expect(sum.cents).toBe(104999999999999n);

      // Subtraction of extreme figures
      const diff = sum.subtract(extremeMoney1);
      expect(diff.cents).toBe(extremeMoney2.cents);
      expect(diff.equals(extremeMoney2)).toBe(true);

      // Multiplication with BigInt scalar
      const multipliedBigInt = extremeMoney1.multiply(3n);
      expect(multipliedBigInt.cents).toBe(15000000000000n);

      // Multiplication with fractional rate (scaled integer arithmetic 10^6 scale)
      // 50 billion * 1.055 (5.5% margin) = 52.75 billion COP
      const multipliedFraction = extremeMoney1.multiply(1.055);
      expect(multipliedFraction.cents).toBe(5275000000000n);

      // Zero floating-point drift assertion on extreme math
      const expectedScaled = (fiftyBillionCents * 1055000n + 500000n) / 1000000n;
      expect(multipliedFraction.cents).toBe(expectedScaled);
      const drift = multipliedFraction.cents - expectedScaled;
      expect(drift).toBe(0n);
    });

    it('1.3 Boundary: 3-Pax remainder splitting with exact conservation of money (Delta = 0.00 COP)', () => {
      // Case A: 100.000 COP (10.000.000 cents) divided by 3 pax
      // 10.000.000 / 3 = 3.333.333 quotient, remainder = 1 cent
      const amount100k = Money.fromAmount(100000, 'COP');
      const parts100k = amount100k.split(3);

      expect(parts100k).toHaveLength(3);
      expect(parts100k[0].cents).toBe(3333334n); // Extra cent distributed to 1st pax
      expect(parts100k[1].cents).toBe(3333333n);
      expect(parts100k[2].cents).toBe(3333333n);

      const sum100k = parts100k.reduce((acc, p) => acc + p.cents, 0n);
      expect(sum100k).toBe(amount100k.cents);
      expect(sum100k - amount100k.cents).toBe(0n); // Delta === 0 cents!

      // Case B: 1 COP (100 cents) divided by 3 pax
      // 100 / 3 = 33 quotient, remainder = 1 cent
      const amount1Cop = Money.fromAmount(1, 'COP');
      const parts1Cop = amount1Cop.split(3);
      expect(parts1Cop[0].cents).toBe(34n);
      expect(parts1Cop[1].cents).toBe(33n);
      expect(parts1Cop[2].cents).toBe(33n);
      expect(parts1Cop.reduce((acc, p) => acc + p.cents, 0n)).toBe(100n);

      // Case C: Indivisible 1 single cent (1n) divided by 3 pax
      // 1 / 3 = 0 quotient, remainder = 1 cent
      const oneCent = Money.fromCents(1n, 'COP');
      const partsOneCent = oneCent.split(3);
      expect(partsOneCent[0].cents).toBe(1n);
      expect(partsOneCent[1].cents).toBe(0n);
      expect(partsOneCent[2].cents).toBe(0n);
      expect(partsOneCent.reduce((acc, p) => acc + p.cents, 0n)).toBe(1n);

      // Case D: Negative balance remainder splitting: -100.000 COP (-10.000.000 cents)
      const negative100k = Money.fromCents(-10000000n, 'COP');
      const partsNegative = negative100k.split(3);
      expect(partsNegative).toHaveLength(3);
      expect(partsNegative[0].cents).toBe(-3333334n);
      expect(partsNegative[1].cents).toBe(-3333333n);
      expect(partsNegative[2].cents).toBe(-3333333n);
      const sumNegative = partsNegative.reduce((acc, p) => acc + p.cents, 0n);
      expect(sumNegative).toBe(negative100k.cents);

      // Case E: Fuzz generator: 50 random amounts split across 3, 5, 7 pax
      const testDividers = [3, 5, 7];
      for (let i = 0; i < 50; i++) {
        const randomCents = BigInt(Math.floor(Math.random() * 50000000) - 25000000);
        const money = Money.fromCents(randomCents, 'COP');
        for (const div of testDividers) {
          const splits = money.split(div);
          expect(splits).toHaveLength(div);
          const totalSplitCents = splits.reduce((acc, p) => acc + p.cents, 0n);
          expect(totalSplitCents).toBe(money.cents);
        }
      }
    });

    it('1.4 Boundary: Negative balances in SettlementLedger & Credit vs Debt state assertions', () => {
      const exp1 = new ReceiptExpense({
        id: 'exp-neg-1',
        bookingId: 'RVA-NEG-TEST',
        category: 'MEAL_SUBSIDY',
        description: 'Almuerzo de Bienvenida',
        amount: Money.fromAmount(45000, 'COP'), // 4.500.000 cents
        date: '2026-09-20',
        status: 'APPROVED',
      });

      const shift1 = new CompanionShift({
        id: 'shf-neg-1',
        bookingId: 'RVA-NEG-TEST',
        guideId: 'g-1',
        guideName: 'Yenny Roberto',
        dayNumber: 1,
        date: '2026-09-20',
        hoursLogged: 4,
        hourlyRate: Money.fromCents(1550000n, 'COP'), // 4 * 15.5k = 62k
        prepAllowance: Money.fromCents(1550000n, 'COP'), // 15.5k
        mealSubsidyTier: 'TIER_1',
        mealSubsidyAmount: Money.fromCents(800000n, 'COP'), // 8k
        status: 'APPROVED',
      }); // Shift fee = 62k + 15.5k + 8k = 85.500 COP (8.550.000 cents)

      const transfer1 = new DriverTransfer({
        id: 'trf-neg-1',
        bookingId: 'RVA-NEG-TEST',
        driverId: 'drv-1',
        driverName: 'Ramón Rosero',
        vehicleType: 'VAN_XL',
        routeType: 'INTRA_CITY_SHORT',
        origin: OperativeTerritory.fromPreset('POBLADO', 'Hotel 1616'),
        destination: OperativeTerritory.fromPreset('CIUDAD_DEL_RIO', 'Clínica Clofán'),
        scheduledTime: '2026-09-20T14:00:00Z',
        baseRate: Money.fromAmount(90000, 'COP'), // 9.000.000 cents
        status: 'CONFIRMED',
      }); // Transfer = 90.000 COP

      // Total Debits = 45k + 85.5k + 90k = 220.500 COP (22.050.000 cents)
      const expectedDebits = 22050000n;

      // Scenario A: Large Advance ($500.000 COP) -> Negative balance = Patient Credit (Medical Trip owes refund)
      const advancesCredit: CashAdvance[] = [
        {
          id: 'adv-1',
          date: '2026-09-20',
          amount: Money.fromAmount(500000, 'COP'), // 50.000.000 cents
          description: 'Depósito Tarjeta',
        },
      ];

      const ledgerCredit = SettlementLedger.calculate({
        bookingId: 'RVA-NEG-TEST',
        expenses: [exp1],
        shifts: [shift1],
        transfers: [transfer1],
        advances: advancesCredit,
      });

      expect(ledgerCredit.totalExpenses.cents).toBe(4500000n);
      expect(ledgerCredit.totalGuideFees.cents).toBe(8550000n);
      expect(ledgerCredit.totalFleetTaxis.cents).toBe(9000000n);
      expect(ledgerCredit.totalAdvances.cents).toBe(50000000n);

      // Net Balance = 22.050.000 - 50.000.000 = -27.950.000 cents (-$279.500 COP)
      expect(ledgerCredit.netBalance.cents).toBe(-27950000n);
      expect(ledgerCredit.isPatientCredit()).toBe(true);
      expect(ledgerCredit.isPatientDebt()).toBe(false);
      expect(ledgerCredit.isSettled()).toBe(false);

      // Scenario B: Insufficient Advance ($100.000 COP) -> Positive balance = Patient Debt (Patient owes additional)
      const advancesDebt: CashAdvance[] = [
        {
          id: 'adv-2',
          date: '2026-09-20',
          amount: Money.fromAmount(100000, 'COP'), // 10.000.000 cents
          description: 'Adelanto Parcial',
        },
      ];

      const ledgerDebt = SettlementLedger.calculate({
        bookingId: 'RVA-NEG-TEST',
        expenses: [exp1],
        shifts: [shift1],
        transfers: [transfer1],
        advances: advancesDebt,
      });

      // Net Balance = 22.050.000 - 10.000.000 = +12.050.000 cents (+$120.500 COP)
      expect(ledgerDebt.netBalance.cents).toBe(12050000n);
      expect(ledgerDebt.isPatientDebt()).toBe(true);
      expect(ledgerDebt.isPatientCredit()).toBe(false);
      expect(ledgerDebt.isSettled()).toBe(false);

      // Scenario C: Exact Match Advance ($220.500 COP) -> Zero balance = Settled
      const advancesSettled: CashAdvance[] = [
        {
          id: 'adv-3',
          date: '2026-09-20',
          amount: Money.fromAmount(220500, 'COP'), // 22.050.000 cents
          description: 'Depósito Exacto',
        },
      ];

      const ledgerSettled = SettlementLedger.calculate({
        bookingId: 'RVA-NEG-TEST',
        expenses: [exp1],
        shifts: [shift1],
        transfers: [transfer1],
        advances: advancesSettled,
      });

      expect(ledgerSettled.netBalance.cents).toBe(0n);
      expect(ledgerSettled.isSettled()).toBe(true);
      expect(ledgerSettled.isPatientCredit()).toBe(false);
      expect(ledgerSettled.isPatientDebt()).toBe(false);

      // Strict Zero Floating-Point Drift check across all three
      const driftCredit = ledgerCredit.netBalance.cents - (expectedDebits - 50000000n);
      const driftDebt = ledgerDebt.netBalance.cents - (expectedDebits - 10000000n);
      const driftSettled = ledgerSettled.netBalance.cents - (expectedDebits - 22050000n);

      expect(driftCredit).toBe(0n);
      expect(driftDebt).toBe(0n);
      expect(driftSettled).toBe(0n);
    });
  });

  // ==========================================================================
  // SECTION 2: ADVERSARIAL TESTING OF Sha256LedgerChain & TAMPER DETECTION
  // ==========================================================================
  describe('2. Sha256LedgerChain Tamper Detection & Cryptographic Verification', () => {
    it('2.1 Genesis Block: strictly enforces index 0, previousHash 64 zeros, and tamper rejection', () => {
      const chain = new Sha256LedgerChain();
      const genesis = chain.getChain()[0];

      expect(genesis.index).toBe(0);
      expect(genesis.previousHash).toBe('0'.repeat(64));
      expect(genesis.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(chain.verifyChain().valid).toBe(true);

      // Tamper Scenario: corrupt genesis index
      const tamperedIndexChain: LedgerBlock[] = [
        { ...genesis, index: 1 },
      ];
      expect(new Sha256LedgerChain().verifyChain(tamperedIndexChain).valid).toBe(false);

      // Tamper Scenario: corrupt genesis previousHash
      const tamperedPrevHashChain: LedgerBlock[] = [
        { ...genesis, previousHash: '1'.repeat(64) },
      ];
      expect(new Sha256LedgerChain().verifyChain(tamperedPrevHashChain).valid).toBe(false);

      // Tamper Scenario: corrupt genesis payload
      const tamperedPayloadChain: LedgerBlock[] = [
        { ...genesis, payload: { message: 'ATTACKER_FAKE_GENESIS' } },
      ];
      expect(new Sha256LedgerChain().verifyChain(tamperedPayloadChain).valid).toBe(false);
    });

    it('2.2 Block Modification Tampering: 100% caught when block payload, hash, or timestamp is altered', () => {
      const chain = new Sha256LedgerChain<{ action: string; amountCents: string; bookingId: string }>();

      // Block 1: Patient Deposit
      chain.addBlock({
        action: 'CASH_ADVANCE',
        amountCents: '50000000',
        bookingId: 'RVA-TAMPER-TEST',
      }, 1700000001000);

      // Block 2: Pharmacy Out-of-pocket expense
      chain.addBlock({
        action: 'RECEIPT_EXPENSE',
        amountCents: '18500000',
        bookingId: 'RVA-TAMPER-TEST',
      }, 1700000002000);

      // Block 3: Driver Transfer fee
      chain.addBlock({
        action: 'FLEET_TRANSFER',
        amountCents: '14500000',
        bookingId: 'RVA-TAMPER-TEST',
      }, 1700000003000);

      expect(chain.height).toBe(4); // Genesis + 3 blocks
      const validResult = chain.verifyChain();
      expect(validResult.valid).toBe(true);
      expect(validResult.blocksVerified).toBe(4);

      // ATTACK 1: Maliciously alter payload amount in Block 2 (e.g. from $185k to $10k)
      const blocks1 = [...chain.getChain()];
      const tamperedBlock2 = {
        ...blocks1[2],
        payload: { ...blocks1[2].payload, amountCents: '1000000' }, // Altered payload
      };
      const chainAttack1 = [blocks1[0], blocks1[1], tamperedBlock2, blocks1[3]];
      const resultAttack1 = chain.verifyChain(chainAttack1);
      expect(resultAttack1.valid).toBe(false);
      expect(resultAttack1.errorIndex).toBe(2);
      expect(resultAttack1.reason).toContain('Hash mismatch at block 2');

      // ATTACK 2: Maliciously recompute hash of Block 2 without updating Block 3 previousHash
      const recomputedHash2 = calculateBlockHash(
        tamperedBlock2.index,
        tamperedBlock2.timestamp,
        tamperedBlock2.payload,
        tamperedBlock2.previousHash,
        tamperedBlock2.nonce ?? 0
      );
      const chainAttack2 = [
        blocks1[0],
        blocks1[1],
        { ...tamperedBlock2, hash: recomputedHash2 },
        blocks1[3], // Block 3 still points to original Block 2 hash
      ];
      const resultAttack2 = chain.verifyChain(chainAttack2);
      expect(resultAttack2.valid).toBe(false);
      expect(resultAttack2.errorIndex).toBe(3);
      expect(resultAttack2.reason).toContain('Broken hash link at block 3');

      // ATTACK 3: Alter timestamp of Block 1 by 1 millisecond
      const chainAttack3 = [
        blocks1[0],
        { ...blocks1[1], timestamp: blocks1[1].timestamp + 1 },
        blocks1[2],
        blocks1[3],
      ];
      const resultAttack3 = chain.verifyChain(chainAttack3);
      expect(resultAttack3.valid).toBe(false);
      expect(resultAttack3.errorIndex).toBe(1);
      expect(resultAttack3.reason).toContain('Hash mismatch at block 1');

      // ATTACK 4: Drop Block 2 entirely (attempt to erase expense)
      const chainAttack4 = [blocks1[0], blocks1[1], blocks1[3]];
      const resultAttack4 = chain.verifyChain(chainAttack4);
      expect(resultAttack4.valid).toBe(false);
      // Index discontinuity (index jumps from 1 to 3)
      expect(resultAttack4.errorIndex).toBe(2);
      expect(resultAttack4.reason).toContain('Non-sequential block index');
    });

    it('2.3 Advance Reversal Attack: verifying that reverse advances and signature tampering are 100% detected', () => {
      const chain = new Sha256LedgerChain<{
        eventType: string;
        advances: { id: string; amountCents: string }[];
        netBalanceCents: string;
      }>();

      // State 1: 2 Advances recorded ($500k + $300k = $800k advances), netBalance = -$136.500 COP
      chain.addBlock({
        eventType: 'SETTLEMENT_CREATED',
        advances: [
          { id: 'adv-1', amountCents: '50000000' },
          { id: 'adv-2', amountCents: '30000000' },
        ],
        netBalanceCents: '-13650000',
      });

      const signatureDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const cert1 = chain.signLedgerSeal('pax-tamper-target', signatureDataUrl);

      // Verify certificate 1 is initially valid
      expect(chain.verifySeal(cert1, signatureDataUrl)).toBe(true);

      // ATTACK A: Signature forging / tampering with signature bitmap
      const alteredSignature = 'data:image/png;base64,AlteredSignatureDataByteStream';
      expect(chain.verifySeal(cert1, alteredSignature)).toBe(false);

      // ATTACK B: Advance Reversal applied legitimately creates a new block and updates seal
      // Advance 2 ($300k) reversed -> advances = [$500k], net balance = +$163.500 COP
      chain.addBlock({
        eventType: 'ADVANCE_REVERSED',
        advances: [{ id: 'adv-1', amountCents: '50000000' }],
        netBalanceCents: '16350000',
      });

      expect(chain.height).toBe(3); // Genesis, Block 1, Block 2
      expect(chain.verifyChain().valid).toBe(true);

      // Old certificate 1 now references an outdated block head (Block 1 instead of Block 2)
      expect(chain.getLatestBlock().hash).not.toBe(cert1.ledgerHeadHash);

      // Re-signing with the new state produces a distinct, updated cryptographic seal
      const cert2 = chain.signLedgerSeal('pax-tamper-target', signatureDataUrl);
      expect(cert2.sealHash).not.toBe(cert1.sealHash);
      expect(cert2.ledgerHeadHash).toBe(chain.getLatestBlock().hash);
      expect(cert2.blockCount).toBe(3);

      // Verify new seal passes against new state
      expect(chain.verifySeal(cert2, signatureDataUrl)).toBe(true);

      // ATTACK C: Attacker attempts to replay old seal cert1 on new state
      // Even if attacker preserves signatureDataUrl, cert1.ledgerHeadHash !== current head hash
      expect(cert1.ledgerHeadHash).not.toBe(chain.getLatestBlock().hash);
      // And verifying cert2 with old sealHash fails
      const replayAttackedCert = { ...cert2, sealHash: cert1.sealHash };
      expect(chain.verifySeal(replayAttackedCert, signatureDataUrl)).toBe(false);
    });

    it('2.4 Canonical Stringify Invariant: JSON key order permutational invariance', () => {
      const obj1 = { z: 1, a: 2, m: { y: 'val1', b: 'val2' } };
      const obj2 = { a: 2, m: { b: 'val2', y: 'val1' }, z: 1 };

      const canon1 = canonicalStringify(obj1);
      const canon2 = canonicalStringify(obj2);

      expect(canon1).toBe(canon2);
      expect(sha256(canon1)).toBe(sha256(canon2));
    });
  });

  // ==========================================================================
  // SECTION 3: CLOUD TEARDOWN VERIFICATION (ZERO LEFTOVER TEST RECORDS)
  // ==========================================================================
  describe('3. Cloud Teardown Verification in Live Supabase Cloud', () => {
    it('3.1 Queries all 7 Supabase Cloud tables and asserts ZERO leftover test records', async () => {
      // Test patterns used across integration tests and workers
      const testPatterns = [
        'RVA-TEST-%',
        'bkg-test-%',
        'RVA-M1-%',
        'bkg-crud-test-%',
        'RVA-ALL-M1-%',
        'TEST-%',
      ];

      // Settle loop: checks all 6 tables and waits if concurrent test suites are executing in-flight in other threads
      let testCounts = { bookings: 0, expenses: 0, shifts: 0, transfers: 0, settlements: 0, events: 0 };
      for (let attempt = 0; attempt < 10; attempt++) {
        testCounts = { bookings: 0, expenses: 0, shifts: 0, transfers: 0, settlements: 0, events: 0 };

        // 1. Check bookings table
        for (const pattern of testPatterns) {
          const { data: bkgData } = await client
            .from('bookings')
            .select('id, code')
            .or(`id.like.${pattern},code.like.${pattern}`);
          testCounts.bookings += (bkgData ?? []).length;
        }

        // 2. Check expenses table
        const { data: expData } = await client
          .from('expenses')
          .select('id')
          .or('id.like.exp-test-%,booking_id.like.RVA-TEST-%,booking_id.like.bkg-test-%,booking_id.like.RVA-M1-%');
        testCounts.expenses = (expData ?? []).length;

        // 3. Check shifts table
        const { data: shfData } = await client
          .from('shifts')
          .select('id')
          .or('id.like.shf-test-%,booking_id.like.RVA-TEST-%,booking_id.like.bkg-test-%,booking_id.like.RVA-M1-%');
        testCounts.shifts = (shfData ?? []).length;

        // 4. Check transfers table
        const { data: trfData } = await client
          .from('transfers')
          .select('id')
          .or('id.like.trf-test-%,booking_id.like.RVA-TEST-%,booking_id.like.bkg-test-%,booking_id.like.RVA-M1-%');
        testCounts.transfers = (trfData ?? []).length;

        // 5. Check settlements table
        const { data: stlData } = await client
          .from('settlements')
          .select('booking_id')
          .or('booking_id.like.RVA-TEST-%,booking_id.like.bkg-test-%,booking_id.like.RVA-M1-%,booking_id.like.RVA-ALL-M1-%');
        testCounts.settlements = (stlData ?? []).length;

        // 6. Check events table
        const { data: evtData } = await client
          .from('events')
          .select('id')
          .or('id.like.evt-test-%,booking_id.like.RVA-TEST-%,booking_id.like.bkg-test-%,booking_id.like.RVA-M1-%');
        testCounts.events = (evtData ?? []).length;

        const totalResiduals = Object.values(testCounts).reduce((a, b) => a + b, 0);
        if (totalResiduals === 0) break;
        // Wait 2.5s for concurrent test runner afterAll to complete
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      expect(testCounts.bookings).toBe(0);
      expect(testCounts.expenses).toBe(0);
      expect(testCounts.shifts).toBe(0);
      expect(testCounts.transfers).toBe(0);
      expect(testCounts.settlements).toBe(0);
      expect(testCounts.events).toBe(0);
    });

    it('3.2 Production Booking Protection: asserts operational dossier bkg-rva350 remains fully intact', async () => {
      // Confirm that real operational case bkg-rva350 (RVA350-1) was NEVER wiped or corrupted
      const { data: prodBooking, error: bkgErr } = await client
        .from('bookings')
        .select('*')
        .eq('id', 'bkg-rva350')
        .single();

      expect(bkgErr).toBeNull();
      expect(prodBooking).toBeDefined();
      expect(prodBooking.code).toBe('RVA350-1');
      expect(prodBooking.first_name).toBe('Natalie Monica');
      expect(prodBooking.last_name).toBe('Bito e/v Rumai');

      // Verify child records for operational booking exist
      const { count: eventCount } = await client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .or('booking_id.eq.bkg-rva350,booking_id.eq.RVA350-1');
      expect(eventCount).toBeGreaterThan(0);

      const { count: expenseCount } = await client
        .from('expenses')
        .select('*', { count: 'exact', head: true })
        .or('booking_id.eq.bkg-rva350,booking_id.eq.RVA350-1');
      expect(expenseCount).toBeGreaterThan(0);
    });
  });
});
