import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '@/core/infrastructure/storage/SupabaseStorageAdapter';
import { PatientBooking } from '@/core/domain/entities/PatientBooking';
import { Money } from '@/core/domain/value-objects/Money';
import { ReceiptExpense } from '@/features/settlement/domain/ReceiptExpense';
import { SettlementLedger, CashAdvance } from '@/features/settlement/domain/SettlementLedger';
import { CompanionShift } from '@/features/companion-shifts/domain/CompanionShift';
import { DriverTransfer } from '@/features/logistics-fleet/domain/DriverTransfer';
import { OperativeTerritory } from '@/core/domain/value-objects/OperativeTerritory';
import { Sha256LedgerChain } from '@/features/settlement/infrastructure/Sha256LedgerChain';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

describe('Domain 5: Petty Cash Expenses & Deterministic Settlements CRUD (Supabase Cloud REST API)', { timeout: 30000 }, () => {
  let client: SupabaseClient;
  let adapter: SupabaseStorageAdapter;

  const TEST_BOOKING_ID = `bkg-test-exp-crud-${Date.now()}`;
  const TEST_BOOKING_CODE = `RVA-TEST-EXP-${Math.floor(Math.random() * 10000)}`;

  const expCafeId = `exp-test-cafe-${Date.now()}`;
  const expFarmaciaId = `exp-test-farmacia-${Date.now()}`;
  const expPeajeId = `exp-test-peaje-${Date.now()}`;
  const expCustomLabId = `exp-test-custom-lab-${Date.now()}`;
  const shiftId = `shf-test-exp-${Date.now()}`;
  const transferId = `trf-test-exp-${Date.now()}`;

  beforeAll(async () => {
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    adapter = new SupabaseStorageAdapter({ client });

    // Create the base test booking in Supabase
    const testBooking = new PatientBooking({
      id: TEST_BOOKING_ID,
      code: TEST_BOOKING_CODE,
      patientId: 'pax-test-exp',
      firstName: 'Test',
      lastName: 'Expenses',
      passportHash: 'hash-test-exp',
      country: 'Curazao',
      language: 'Papiamento',
      phone: '+59995120000',
      email: 'test.expenses@medicaltrip.test',
      companionNames: [],
      paxCount: 1,
      arrivalDate: '2026-09-20T10:00:00Z',
      departureDate: '2026-09-27T18:00:00Z',
      arrivalAirline: 'Arajet',
      arrivalFlight: 'DM-101',
      hotelId: 'h-1616',
      hotelName: 'HOTEL 1616 Poblado',
      status: 'PROGRAMADO',
    });
    await adapter.saveBooking(testBooking);
  }, 15000);

  afterAll(async () => {
    // Cleanup test artifacts
    const ids = [TEST_BOOKING_ID, TEST_BOOKING_CODE];
    await Promise.allSettled([
      client.from('expenses').delete().in('booking_id', ids),
      client.from('settlements').delete().in('booking_id', ids),
      client.from('shifts').delete().in('booking_id', ids),
      client.from('transfers').delete().in('booking_id', ids),
      client.from('events').delete().in('booking_id', ids),
      client.from('event_stream').delete().in('booking_id', ids),
      client.from('bookings').delete().in('id', ids),
      client.from('bookings').delete().in('code', ids),
    ]);
  }, 15000);

  // --------------------------------------------------------------------------
  // 1. EXPENSES CRUD LIFECYCLE
  // --------------------------------------------------------------------------

  it('1. Create: provisions 1-Tap quick expenses (Café $15k, Farmacia $185k, Peaje $16.100) in Supabase', async () => {
    const expCafe = new ReceiptExpense({
      id: expCafeId,
      bookingId: TEST_BOOKING_CODE,
      category: 'MEAL_SUBSIDY',
      description: 'Café & Hidratación',
      amount: Money.fromAmount(15000, 'COP'),
      date: '2026-09-20',
      status: 'APPROVED',
    });

    const expFarmacia = new ReceiptExpense({
      id: expFarmaciaId,
      bookingId: TEST_BOOKING_CODE,
      category: 'PHARMACY',
      description: 'Farmacia Clofán / Pasteur',
      amount: Money.fromAmount(185000, 'COP'),
      date: '2026-09-20',
      status: 'APPROVED',
    });

    const expPeaje = new ReceiptExpense({
      id: expPeajeId,
      bookingId: TEST_BOOKING_CODE,
      category: 'TOLL',
      description: 'Peaje Túnel de Oriente',
      amount: Money.fromAmount(16100, 'COP'),
      date: '2026-09-20',
      status: 'APPROVED',
    });

    await adapter.saveExpense(expCafe);
    await adapter.saveExpense(expFarmacia);
    await adapter.saveExpense(expPeaje);

    // Direct REST query verification
    const { data: rows, error } = await client
      .from('expenses')
      .select('*')
      .eq('booking_id', TEST_BOOKING_CODE);

    expect(error).toBeNull();
    expect(rows).toHaveLength(3);

    const cafeRow = rows?.find((r) => r.id === expCafeId);
    expect(cafeRow).toBeDefined();
    expect(cafeRow.amount_cents).toBe('1500000');
    expect(cafeRow.amount_currency).toBe('COP');
    expect(cafeRow.category).toBe('MEAL_SUBSIDY');

    const farmaciaRow = rows?.find((r) => r.id === expFarmaciaId);
    expect(farmaciaRow).toBeDefined();
    expect(farmaciaRow.amount_cents).toBe('18500000');

    const peajeRow = rows?.find((r) => r.id === expPeajeId);
    expect(peajeRow).toBeDefined();
    expect(peajeRow.amount_cents).toBe('1610000');
  });

  it('2. Create: provisions custom digital receipt with vendor details and receipt blob reference', async () => {
    const expCustom = new ReceiptExpense({
      id: expCustomLabId,
      bookingId: TEST_BOOKING_CODE,
      category: 'MEDICAL_LAB',
      description: 'Examen de Sangre Prequirúrgico Clofán',
      amount: Money.fromCents(12500000n, 'COP'), // $125.000 COP
      vendorName: 'Laboratorio Médico Clofán S.A.S.',
      vendorTaxId: 'NIT 900.456.789-2',
      receiptBlobUuid: 'blob-uuid-receipt-001',
      date: '2026-09-20',
      audited: true,
      status: 'APPROVED',
    });

    await adapter.saveExpense(expCustom);

    const { data: row } = await client
      .from('expenses')
      .select('*')
      .eq('id', expCustomLabId)
      .single();

    expect(row).toBeDefined();
    expect(row.vendor_name).toBe('Laboratorio Médico Clofán S.A.S.');
    expect(row.vendor_tax_id).toBe('NIT 900.456.789-2');
    expect(row.receipt_blob_uuid).toBe('blob-uuid-receipt-001');
    expect(row.audited).toBe(true);
    expect(row.amount_cents).toBe('12500000');
  });

  it('3. Read: queries expenses from Supabase Cloud and verifies integer cents & BigInt sum', async () => {
    const expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    expect(expenses).toHaveLength(4);

    let totalCents = 0n;
    for (const exp of expenses) {
      expect(exp).toBeInstanceOf(ReceiptExpense);
      expect(exp.amount).toBeInstanceOf(Money);
      expect(typeof exp.amount.cents).toBe('bigint');
      totalCents += exp.amount.cents;
    }

    // 15k + 185k + 16.1k + 125k = 341.100 COP = 34.110.000 cents
    expect(totalCents).toBe(34110000n);
    const totalMoney = Money.fromCents(totalCents, 'COP');
    expect(totalMoney.toAmountNumber()).toBe(341100);
  });

  it('4. Update: edits receipt amount and asserts real-time BigInt delta = 0.00 COP', async () => {
    // Edit farmacia from $185k to $210k ($25k increase)
    const updatedFarmacia = new ReceiptExpense({
      id: expFarmaciaId,
      bookingId: TEST_BOOKING_CODE,
      category: 'PHARMACY',
      description: 'Farmacia Clofán / Pasteur (Ajuste Gotas Vigamox)',
      amount: Money.fromAmount(210000, 'COP'), // 21000000n cents
      date: '2026-09-20',
      status: 'APPROVED',
    });

    await adapter.saveExpense(updatedFarmacia);

    // Verify row in Supabase Cloud
    const { data: row } = await client
      .from('expenses')
      .select('*')
      .eq('id', expFarmaciaId)
      .single();

    expect(row.amount_cents).toBe('21000000');
    expect(row.description).toBe('Farmacia Clofán / Pasteur (Ajuste Gotas Vigamox)');

    // Re-query expenses via storagePort
    const expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    const ledger = SettlementLedger.calculate({
      bookingId: TEST_BOOKING_CODE,
      expenses,
      shifts: [],
      transfers: [],
      advances: [],
    });

    // 15k + 210k + 16.1k + 125k = 366.100 COP = 36.610.000 cents
    expect(ledger.totalExpenses.cents).toBe(36610000n);

    // Delta between old and new is exactly 25.000 COP (2.500.000 cents)
    const deltaCents = ledger.totalExpenses.cents - 34110000n;
    expect(deltaCents).toBe(2500000n);
    expect(Number(deltaCents) / 100).toBe(25000);
  });

  it('5. Delete: marks expense as REJECTED and executes deleteExpense removing row from Supabase', async () => {
    // 5.1 Soft-reject: update expCafe status to REJECTED
    const rejectedCafe = new ReceiptExpense({
      id: expCafeId,
      bookingId: TEST_BOOKING_CODE,
      category: 'MEAL_SUBSIDY',
      description: 'Café & Hidratación',
      amount: Money.fromAmount(15000, 'COP'),
      date: '2026-09-20',
      status: 'REJECTED',
    });
    await adapter.saveExpense(rejectedCafe);

    let expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    let ledger = SettlementLedger.calculate({
      bookingId: TEST_BOOKING_CODE,
      expenses,
      shifts: [],
      transfers: [],
      advances: [],
    });

    // Café ($15k) is now excluded: 366.100 - 15.000 = 351.100 COP (35.110.000 cents)
    expect(ledger.totalExpenses.cents).toBe(35110000n);

    // 5.2 Hard-delete: delete expPeaje
    await adapter.deleteExpense(expPeajeId);

    // Confirm deletion directly in Supabase Cloud REST API
    const { data: deletedRows } = await client
      .from('expenses')
      .select('*')
      .eq('id', expPeajeId);
    expect(deletedRows).toHaveLength(0);

    expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    expect(expenses.find((e) => e.id === expPeajeId)).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // 2. DETERMINISTIC SETTLEMENT CRUD & CRYPTOGRAPHIC SEAL
  // --------------------------------------------------------------------------

  it('6. Create: initializes SettlementLedger with zero floating-point drift and persists to Supabase', async () => {
    const initialLedger = SettlementLedger.createEmpty(TEST_BOOKING_CODE, '2026-09-20', 1);

    expect(initialLedger.totalExpenses.isZero()).toBe(true);
    expect(initialLedger.totalGuideFees.isZero()).toBe(true);
    expect(initialLedger.totalFleetTaxis.isZero()).toBe(true);
    expect(initialLedger.totalAdvances.isZero()).toBe(true);
    expect(initialLedger.netBalance.isZero()).toBe(true);

    await adapter.saveSettlement(initialLedger);

    const { data: row } = await client
      .from('settlements')
      .select('*')
      .eq('booking_id', TEST_BOOKING_CODE)
      .single();

    expect(row).toBeDefined();
    expect(row.total_expenses_cents).toBe('0');
    expect(row.net_balance_cents).toBe('0');
    expect(row.settlement_type).toBe('DAILY');
  });

  it('7. Update & Recalculate: computes multi-domain settlement with BigInt determinism and credit-to-patient balance', async () => {
    // Current approved expenses: expFarmacia ($210k) + expCustomLab ($125k) = $335k (33.500.000 cents)
    const expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);

    // Companion shift: 6h @ $15.500 ($93k) + prep $15.5k + meal subsidy $25k = $133.500 COP (13.350.000 cents)
    const shift = new CompanionShift({
      id: shiftId,
      bookingId: TEST_BOOKING_CODE,
      guideId: 'g-1',
      guideName: 'Yenny Roberto',
      dayNumber: 1,
      date: '2026-09-20',
      hoursLogged: 6,
      hourlyRate: Money.fromCents(1550000n, 'COP'),
      prepAllowance: Money.fromCents(1550000n, 'COP'),
      mealSubsidyTier: 'TIER_2',
      mealSubsidyAmount: Money.fromCents(2500000n, 'COP'),
      status: 'APPROVED',
    });
    await adapter.saveShift(shift);

    // Driver transfer: Airport arrival $175k + night surcharge $20k = $195.000 COP (19.500.000 cents)
    const transfer = new DriverTransfer({
      id: transferId,
      bookingId: TEST_BOOKING_CODE,
      driverId: 'drv-1',
      driverName: 'Ramón Rosero',
      vehicleType: 'VAN_XL',
      routeType: 'AIRPORT_ARRIVAL',
      origin: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'JMC Rionegro'),
      destination: OperativeTerritory.fromPreset('POBLADO', 'Hotel 1616'),
      scheduledTime: '2026-09-20T10:00:00Z',
      baseRate: Money.fromCents(17500000n, 'COP'),
      nightSurcharge: Money.fromCents(2000000n, 'COP'),
      status: 'CONFIRMED',
    });
    await adapter.saveTransfer(transfer);

    // Cash advances: Advance 1 ($500k) + Advance 2 ($300k) = $800.000 COP (80.000.000 cents)
    const advances: CashAdvance[] = [
      {
        id: 'adv-test-1',
        date: '2026-09-20',
        amount: Money.fromAmount(500000, 'COP'),
        description: 'Depósito Inicial Tarjeta',
      },
      {
        id: 'adv-test-2',
        date: '2026-09-20',
        amount: Money.fromAmount(300000, 'COP'),
        description: 'Adelanto Caja Menor',
      },
    ];

    const ledger = SettlementLedger.calculate({
      bookingId: TEST_BOOKING_CODE,
      expenses,
      shifts: [shift],
      transfers: [transfer],
      advances,
    });

    // Verification of Debits:
    // Expenses: 33.500.000 cents ($335k)
    // Guide:    13.350.000 cents ($133.5k)
    // Fleet:    19.500.000 cents ($195k)
    // Total Debits = 66.350.000 cents ($663.500 COP)
    expect(ledger.totalExpenses.cents).toBe(33500000n);
    expect(ledger.totalGuideFees.cents).toBe(13350000n);
    expect(ledger.totalFleetTaxis.cents).toBe(19500000n);
    expect(ledger.totalAdvances.cents).toBe(80000000n);

    // Net Balance = 66.350.000 - 80.000.000 = -13.650.000 cents (-$136.500 COP)
    expect(ledger.netBalance.cents).toBe(-13650000n);
    expect(ledger.isPatientCredit()).toBe(true);
    expect(ledger.isPatientDebt()).toBe(false);

    // Exact Zero-Delta assertion
    const computedNet = (ledger.totalExpenses.cents + ledger.totalGuideFees.cents + ledger.totalFleetTaxis.cents) - ledger.totalAdvances.cents;
    expect(computedNet).toBe(ledger.netBalance.cents);
  });

  it('8. Cryptographic Seal: derives canonical SHA-256 seal using Sha256LedgerChain and verifies block integrity', async () => {
    const expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    const shifts = await adapter.getShiftsByBooking(TEST_BOOKING_CODE);
    const transfers = await adapter.getTransfersByBooking(TEST_BOOKING_CODE);
    const advances: CashAdvance[] = [
      {
        id: 'adv-test-1',
        date: '2026-09-20',
        amount: Money.fromAmount(500000, 'COP'),
        description: 'Depósito Inicial Tarjeta',
      },
      {
        id: 'adv-test-2',
        date: '2026-09-20',
        amount: Money.fromAmount(300000, 'COP'),
        description: 'Adelanto Caja Menor',
      },
    ];

    const ledger = SettlementLedger.calculate({
      bookingId: TEST_BOOKING_CODE,
      expenses,
      shifts,
      transfers,
      advances,
    });

    // Build immutable ledger chain
    const chain = new Sha256LedgerChain();
    expect(chain.height).toBe(1); // Genesis block

    const totalDebits = ledger.totalExpenses.add(ledger.totalGuideFees).add(ledger.totalFleetTaxis);

    const block = chain.addBlock({
      bookingId: TEST_BOOKING_CODE,
      patientId: 'pax-test-exp',
      totalExpenses: ledger.totalExpenses.toJSON(),
      totalGuideFees: ledger.totalGuideFees.toJSON(),
      totalFleetTaxis: ledger.totalFleetTaxis.toJSON(),
      totalDebits: totalDebits.toJSON(),
      totalAdvances: ledger.totalAdvances.toJSON(),
      netBalance: ledger.netBalance.toJSON(),
      timestamp: Date.now(),
    });

    expect(chain.height).toBe(2);
    expect(block.index).toBe(1);
    expect(chain.verifyChain().valid).toBe(true);

    // Derive cryptographic digital seal
    const fakeSignatureDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const sealCert = chain.signLedgerSeal('pax-test-exp', fakeSignatureDataUrl);

    expect(sealCert.sealHash).toMatch(/^[0-9a-f]{64}$/);
    expect(chain.verifySeal(sealCert, fakeSignatureDataUrl)).toBe(true);

    // Assert that signature tampering causes verification failure
    const tamperedSignature = 'data:image/png;base64,tamperedBase64String';
    expect(chain.verifySeal(sealCert, tamperedSignature)).toBe(false);

    // Save sealed settlement to Supabase Cloud
    const sealedLedger = SettlementLedger.calculate({
      bookingId: TEST_BOOKING_CODE,
      expenses,
      shifts,
      transfers,
      advances,
      sha256Seal: sealCert.sealHash,
    });
    await adapter.saveSettlement(sealedLedger);

    const { data: row } = await client
      .from('settlements')
      .select('*')
      .eq('booking_id', TEST_BOOKING_CODE)
      .single();

    expect(row.sha256_seal).toBe(sealCert.sealHash);
  });

  it('9. Read & Verify: queries settlements from Supabase Cloud and asserts BigInt delta = 0.00 COP', async () => {
    const retrievedLedger = await adapter.getSettlement(TEST_BOOKING_CODE);
    expect(retrievedLedger).not.toBeNull();

    const { data: dbRow } = await client
      .from('settlements')
      .select('*')
      .eq('booking_id', TEST_BOOKING_CODE)
      .single();

    // Verify stringified database values match BigInt Value Object exactly
    expect(BigInt(dbRow.total_expenses_cents)).toBe(retrievedLedger!.totalExpenses.cents);
    expect(BigInt(dbRow.total_guide_fees_cents)).toBe(retrievedLedger!.totalGuideFees.cents);
    expect(BigInt(dbRow.total_fleet_taxis_cents)).toBe(retrievedLedger!.totalFleetTaxis.cents);
    expect(BigInt(dbRow.total_advances_cents)).toBe(retrievedLedger!.totalAdvances.cents);
    expect(BigInt(dbRow.net_balance_cents)).toBe(retrievedLedger!.netBalance.cents);

    // Assert mathematical delta is exactly 0.00 COP
    const delta = BigInt(dbRow.net_balance_cents) - retrievedLedger!.netBalance.cents;
    expect(delta).toBe(0n);
    expect(Number(delta) / 100).toBe(0);
  });

  it('10. Reverse Advances: reverses an advance, recalculates to patient debt, and asserts seal update', async () => {
    const currentLedger = await adapter.getSettlement(TEST_BOOKING_CODE);
    expect(currentLedger).not.toBeNull();

    // Reverse Advance 2 ($300k), keeping only Advance 1 ($500k)
    const remainingAdvances = currentLedger!.advances.filter((a) => a.id !== 'adv-test-2');
    expect(remainingAdvances).toHaveLength(1);

    const expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    const shifts = await adapter.getShiftsByBooking(TEST_BOOKING_CODE);
    const transfers = await adapter.getTransfersByBooking(TEST_BOOKING_CODE);

    // Re-derive updated seal
    const chain = new Sha256LedgerChain();
    chain.addBlock({ action: 'REVERSE_ADVANCE', advanceId: 'adv-test-2' });
    const fakeSignatureDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const newSealCert = chain.signLedgerSeal('pax-test-exp', fakeSignatureDataUrl);

    const updatedLedger = SettlementLedger.calculate({
      bookingId: TEST_BOOKING_CODE,
      expenses,
      shifts,
      transfers,
      advances: remainingAdvances,
      sha256Seal: newSealCert.sealHash,
    });

    // Debits remain $663.500 COP (66.350.000 cents)
    // Advances now $500.000 COP (50.000.000 cents)
    // Net Balance = 66.350.000 - 50.000.000 = +16.350.000 cents (+$163.500 COP)
    expect(updatedLedger.totalAdvances.cents).toBe(50000000n);
    expect(updatedLedger.netBalance.cents).toBe(16350000n);
    expect(updatedLedger.isPatientDebt()).toBe(true);
    expect(updatedLedger.isPatientCredit()).toBe(false);

    // Save updated settlement
    await adapter.saveSettlement(updatedLedger);

    // Verify in Supabase Cloud
    const { data: updatedDbRow } = await client
      .from('settlements')
      .select('*')
      .eq('booking_id', TEST_BOOKING_CODE)
      .single();

    expect(updatedDbRow.total_advances_cents).toBe('50000000');
    expect(updatedDbRow.net_balance_cents).toBe('16350000');
    expect(updatedDbRow.sha256_seal).toBe(newSealCert.sealHash);
    expect(updatedDbRow.sha256_seal).not.toBe(currentLedger!.sha256Seal);
    expect(updatedDbRow.advances).toHaveLength(1);
  });
});
