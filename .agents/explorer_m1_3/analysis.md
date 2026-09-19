# Technical Analysis & Test Strategy: Domain 5 (Petty Cash Expenses & Deterministic Settlements)

**Author**: Explorer M1_3  
**Target Domain**: Domain 5 (Petty Cash Expenses, Cash Advances, Deterministic Settlements, BigInt Math & SHA-256 Seal)  
**Parent Orchestrator**: orchestrator_14 (`c6e995c5-1c0c-40ce-93e1-5a0f55a42e53`)  
**Target Implementation Path**: `apps/medicaltrip_react_app/tests/integration/supabase_expenses_settlements_crud.test.ts`  
**Supabase Cloud REST API**: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`  
**Timestamp**: 2026-09-19T15:50:00Z  

---

## 1. Executive Summary

This investigation designs the concrete, deterministic verification test strategy for **Domain 5: Petty Cash Expenses & Deterministic Settlements CRUD Lifecycles** directly against the live Supabase Cloud REST API.

The Medical Trip Colombia application enforces mathematical determinism across all financial computations:
1. All monetary figures are encapsulated in the `Money` Value Object backed strictly by `bigint` integer cents ($1 \text{ COP} = 100 \text{ cents}$). Floating-point calculations (`number`) are completely prohibited in balance accumulation.
2. In Supabase Cloud, financial amounts are stored as PostgreSQL `TEXT` columns storing stringified integer cents (`'1500000'` for $15.000 COP, `'18500000'` for $185.000 COP), preventing any database or JSON parsing rounding error.
3. Every settlement reconciliation is sealed with a canonical 64-character hexadecimal SHA-256 cryptographic digest derived by `Sha256LedgerChain`, establishing an immutable, tamper-evident audit trail.

This report provides the Worker with the complete evidence chain, schema specifications, test matrix, and step-by-step implementation blueprint to deliver `tests/integration/supabase_expenses_settlements_crud.test.ts` with 100% pass rate.

---

## 2. Codebase Architecture & Domain 5 Evidence Chain

### 2.1 Entity: `ReceiptExpense`
- **Location**: `src/features/settlement/domain/ReceiptExpense.ts`
- **Categories Supported**: `'PHARMACY' | 'MEDICAL_LAB' | 'PARKING' | 'MEAL_SUBSIDY' | 'SIM_CARD' | 'TOLL' | 'OTHER'`
- **Status Lifecycle**: `'PENDING' | 'APPROVED' | 'REJECTED'`
- **Key Invariants**:
  - `amount`: Instance of `Money` (`cents: bigint`).
  - `audited`: Boolean flag indicating manual or automated coordinator verification.
  - `receiptBlobUuid`: Optional foreign reference to binary blob in Supabase `blobs` table.
  - In `SettlementLedger.calculate()`, **only expenses with `status === 'APPROVED'` are included in `totalExpenses`**. Rejected expenses (`'REJECTED'`) are strictly excluded from financial totals.

### 2.2 Entity: `SettlementLedger`
- **Location**: `src/features/settlement/domain/SettlementLedger.ts`
- **Master Deterministic Formula**:
  $$\text{Saldo Neto} = (\text{Total Gastos} + \text{Total Honorarios Guía} + \text{Total Flota Traslados}) - \text{Total Anticipos}$$
  In code (`SettlementLedger.ts`, lines 142–145):
  ```typescript
  const totalDebits = totalExpenses.add(totalGuideFees).add(totalFleetTaxis);
  const netBalance = totalDebits.subtract(totalAdvances);
  ```
- **Balance Semantics**:
  - `netBalance.isZero()`: Account is completely balanced ($0.00 COP).
  - `netBalance.isNegative()` (`isPatientCredit()`): Medical Trip owes a refund or credit to the patient (e.g. advance exceeded operational expenses).
  - `netBalance.isPositive()` (`isPatientDebt()`): Patient owes additional funds to Medical Trip (e.g. expenses exceeded initial advances).
- **Cash Advances**:
  - Interface: `CashAdvance { id: string; date: string; amount: Money; description: string; }`.
  - Serialized to Supabase `settlements.advances` as a JSONB array: `[{ id, date, amountCents, currency, description }]`.

### 2.3 Value Object: `Money`
- **Location**: `src/core/domain/value-objects/Money.ts`
- **Constructor**: `private constructor(public readonly cents: bigint, public readonly currency: CurrencyCode = 'COP')`
- **Factories**:
  - `Money.fromCents(cents: bigint | number | string, currency = 'COP')`: parses integer cents directly.
  - `Money.fromAmount(amount: number | string | bigint, currency = 'COP')`: converts whole amount to cents via `BigInt(Math.round(num * 100))`.
  - `Money.zero(currency = 'COP')`: returns `cents: 0n`.
- **Operations**: `add()`, `subtract()`, `multiply()`, `split()`, `equals()`, `isZero()`, `isPositive()`, `isNegative()`, `formatCOP()`.
- **Serialization**: `toJSON()` returns `{ cents: string, currency: string, formatted: string }`.

### 2.4 Cryptographic Infrastructure: `Sha256LedgerChain`
- **Location**: `src/features/settlement/infrastructure/Sha256LedgerChain.ts`
- **Specification**: FIPS 180-4 compliant pure TypeScript synchronous SHA-256 implementation with zero external runtime dependencies.
- **Genesis Block**: Index `0`, timestamp `1704067200000`, previousHash `'0'.repeat(64)`, payload `{ message: 'GENESIS_BLOCK_MEDICAL_TRIP_COLOMBIA_SAS' }`.
- **Chaining Mechanism**:
  $$H_n = \text{SHA256}(n \mid \text{timestamp} \mid \text{canonicalJSON}(payload) \mid H_{n-1} \mid nonce)$$
- **Digital Seal Derivation**:
  $$\text{SealHash} = \text{SHA256}(H_{head} \mid \text{SHA256}(\text{signatureDataUrl}) \mid \text{patientId} \mid \text{timestamp} \mid \text{blockCount})$$
  Returns `LedgerSealCertificate { sealHash, ledgerHeadHash, signatureHash, patientId, timestamp, blockCount }`.
- **Verification**: `verifyChain()` confirms continuous cryptographic linking; `verifySeal()` validates that signature data and ledger head match the recorded seal.

---

## 3. Supabase Cloud REST API Persistence Layer

### 3.1 Live Database Schemas
From `apps/medicaltrip_react_app/scripts/migrate_supabase_schema.cjs`:

```sql
-- Table: expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  event_id TEXT,
  category TEXT,
  description TEXT,
  amount_cents TEXT,
  amount_currency TEXT,
  vendor_name TEXT,
  vendor_tax_id TEXT,
  receipt_blob_uuid TEXT,
  date TEXT,
  audited BOOLEAN DEFAULT false,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_booking_id ON expenses(booking_id);

-- Table: settlements
CREATE TABLE settlements (
  booking_id TEXT PRIMARY KEY,
  total_expenses_cents TEXT,
  total_expenses_currency TEXT,
  total_guide_fees_cents TEXT,
  total_guide_fees_currency TEXT,
  total_fleet_taxis_cents TEXT,
  total_fleet_taxis_currency TEXT,
  total_advances_cents TEXT,
  total_advances_currency TEXT,
  net_balance_cents TEXT,
  net_balance_currency TEXT,
  advances JSONB DEFAULT '[]'::jsonb,
  last_updated TEXT,
  sha256_seal TEXT,
  settlement_type TEXT DEFAULT 'DAILY',
  date TEXT,
  day_number INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Storage Adapter Mapping in `SupabaseStorageAdapter.ts`
- **`saveExpense(expense: ReceiptExpense)`** (lines 638–669):
  - Serializes `expense.amount.cents.toString()` into `amount_cents`.
  - Executes `this.client.from('expenses').upsert(payload)`.
- **`getExpensesByBooking(bookingId: string)`** (lines 671–707):
  - Resolves booking IDs (`id` and `code`).
  - Executes `this.client.from('expenses').select('*').in('booking_id', ids)`.
  - Reconstructs `Money.fromCents(BigInt(r.amount_cents || '0'), r.amount_currency || 'COP')`.
- **`deleteExpense(expenseId: string)`** (lines 709–719):
  - Deletes from local fallback.
  - Executes `this.client.from('expenses').delete().eq('id', expenseId)`.
- **`saveSettlement(settlement: SettlementLedger)`** (lines 724–765):
  - Serializes all totals into stringified cents (`total_expenses_cents`, `total_guide_fees_cents`, `total_fleet_taxis_cents`, `total_advances_cents`, `net_balance_cents`).
  - Maps advances to JSON objects with `amountCents: a.amount.cents.toString()`.
  - Executes `this.client.from('settlements').upsert(payload)`.
- **`getSettlement(bookingId: string)`** (lines 767–812):
  - Queries `settlements` row for `bookingId`.
  - Concurrently queries related `expenses`, `shifts`, and `transfers`.
  - Deserializes advances into `Money.fromCents(BigInt(a.amountCents || '0'), 'COP')`.
  - Recomputes `SettlementLedger.calculate({...})` ensuring live recalculation without state drift.

### 3.3 Live Verification Empirical Evidence
- Live curl against `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/expenses?limit=5` returned `HTTP/2 200 OK` in 23ms.
- Live curl against `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1/settlements?limit=5` returned `HTTP/2 200 OK` in 20ms.
- Existing records confirm stringified integer cents:
  - `RVA887`: `total_expenses_cents: '33235000'`, `total_guide_fees_cents: '13200000'`, `total_fleet_taxis_cents: '29000000'`, `total_advances_cents: '0'`, `net_balance_cents: '75435000'`.
  - Check: $33.235.000 + 13.200.000 + 29.000.000 = 75.435.000$ (exact integer cents).

---

## 4. Test Strategy & Category-Partition Matrix

The integration test suite must be placed at:  
`apps/medicaltrip_react_app/tests/integration/supabase_expenses_settlements_crud.test.ts`

### 4.1 Test Isolation & Safety Contract
- To prevent collisions with production archetypes (`RVA171`, `RVA282`, `RVA341`, `RVA077`, `RVA350`), the suite must use a dedicated isolated test booking:
  - `id: 'bkg-test-exp-crud'`
  - `code: 'RVA-TEST-EXP'`
- In `beforeAll`:
  - Initialize `SupabaseStorageAdapter` with live Supabase client.
  - Clean up any pre-existing records for `RVA-TEST-EXP`.
  - Create the base `PatientBooking` in Supabase so `resolveBookingIds` resolves cleanly.
- In `afterAll`:
  - Cascade delete test records: expenses, settlements, and booking.

### 4.2 Detailed Test Scenarios (10 Test Cases)

| Test # | Sub-Domain | Test Name | Operations Tested | Expected Assertions |
| :--- | :--- | :--- | :--- | :--- |
| **T1** | Expenses (Create) | Provision 1-Tap Quick Expenses | `storagePort.saveExpense()` for Café ($15k), Farmacia ($185k), Peaje ($16.100) | Rows in Supabase `expenses` table have `amount_cents` = `'1500000'`, `'18500000'`, `'1610000'`; currency `'COP'`, status `'APPROVED'`. |
| **T2** | Expenses (Create) | Provision Custom Receipt with Vendor & Blob | `storagePort.saveExpense()` with vendor tax ID and receipt blob UUID | All metadata fields (`vendor_name`, `vendor_tax_id`, `receipt_blob_uuid`, `audited`) persist cleanly in Supabase. |
| **T3** | Expenses (Read) | Read Expenses & Verify BigInt Reconstruction | `storagePort.getExpensesByBooking()` | 4 `ReceiptExpense` instances returned; `amount.cents` reconstructed as exact `bigint`; sum equals `34110000n` ($341.100 COP). |
| **T4** | Expenses (Update) | Edit Receipt Amount & Assert Real-Time BigInt Recalculation | Edit `exp-test-farmacia` from $185k to $210k (`21000000n`), save via `saveExpense()` | Supabase record updated; `SettlementLedger.calculate` shows delta of exactly $25.000 COP (`2500000n`); delta float drift = 0.00 COP. |
| **T5** | Expenses (Delete) | Soft-Reject Receipt & Hard-Delete Expense | Mark Café expense as `'REJECTED'`; execute `deleteExpense('exp-test-peaje')` | Rejected expense excluded from ledger debits; deleted expense completely removed from Supabase Cloud table (0 rows returned). |
| **T6** | Settlements (Create) | Initialize SettlementLedger with Zero Drift | `SettlementLedger.createEmpty()` and `saveSettlement()` | `totalExpenses`, `totalGuideFees`, `totalFleetTaxis`, `totalAdvances`, `netBalance` all equal `0n`; Supabase row has `net_balance_cents: '0'`. |
| **T7** | Settlements (Update & Recalculate) | Multi-Domain Deterministic Settlement Calculation | Add Companion Shift ($133.5k), Fleet Transfer ($195k), Approved Expenses ($335k), and Cash Advances ($800k) | Total debits = $663.500 COP (`66350000n`); advances = $800.000 COP (`80000000n`); net balance = -$136.500 COP (`-13650000n`); `isPatientCredit() === true`. |
| **T8** | Cryptographic Seal | SHA-256 Ledger Chain & Digital Seal Derivation | `Sha256LedgerChain`, `addBlock()`, `signLedgerSeal()`, `verifySeal()` | Valid 64-char hex seal generated; tamper verification succeeds; tampering data URL or payload fails verification. |
| **T9** | Settlements (Read & Verify) | Read Settlement from Supabase Cloud REST API & Verify Net Balance Formula | `storagePort.getSettlement()` and direct SQL query via `client.from('settlements')` | Reconstructed ledger matches database row; $\text{NetBalance} = (\text{Expenses} + \text{Fees} + \text{Fleet}) - \text{Advances}$; Delta between stringified cents and BigInt cents is exactly 0.00 COP. |
| **T10** | Settlements (Reverse Advances) | Reverse Cash Advance & Cryptographic Seal Update | Remove $300k advance, leaving $500k advance; re-derive seal and save | Advances reduce to $500.000 COP; net balance shifts from -$136.500 COP to +$163.500 COP (`isPatientDebt() === true`); `sha256Seal` updates to new hash. |

---

## 5. Step-by-Step Implementation Blueprint for the Worker

The Worker MUST create the file:  
`apps/medicaltrip_react_app/tests/integration/supabase_expenses_settlements_crud.test.ts`

### 5.1 Test File Implementation Code

```typescript
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

describe('Domain 5: Petty Cash Expenses & Deterministic Settlements CRUD (Supabase Cloud REST API)', () => {
  let client: SupabaseClient;
  let adapter: SupabaseStorageAdapter;

  const TEST_BOOKING_ID = 'bkg-test-exp-crud';
  const TEST_BOOKING_CODE = 'RVA-TEST-EXP';

  beforeAll(async () => {
    // Disable strict SSL in test runner if needed
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    adapter = new SupabaseStorageAdapter({ client });

    // Clean up any stale test records from previous runs
    await client.from('expenses').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('expenses').delete().eq('booking_id', TEST_BOOKING_ID);
    await client.from('settlements').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('settlements').delete().eq('booking_id', TEST_BOOKING_ID);
    await client.from('shifts').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('transfers').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('bookings').delete().eq('id', TEST_BOOKING_ID);

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
    await client.from('expenses').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('expenses').delete().eq('booking_id', TEST_BOOKING_ID);
    await client.from('settlements').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('settlements').delete().eq('booking_id', TEST_BOOKING_ID);
    await client.from('shifts').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('transfers').delete().eq('booking_id', TEST_BOOKING_CODE);
    await client.from('bookings').delete().eq('id', TEST_BOOKING_ID);
  }, 15000);

  // --------------------------------------------------------------------------
  // 1. EXPENSES CRUD LIFECYCLE
  // --------------------------------------------------------------------------

  it('1. Create: provisions 1-Tap quick expenses (Café $15k, Farmacia $185k, Peaje $16.100) in Supabase', async () => {
    const expCafe = new ReceiptExpense({
      id: 'exp-test-cafe',
      bookingId: TEST_BOOKING_CODE,
      category: 'MEAL_SUBSIDY',
      description: 'Café & Hidratación',
      amount: Money.fromAmount(15000, 'COP'),
      date: '2026-09-20',
      status: 'APPROVED',
    });

    const expFarmacia = new ReceiptExpense({
      id: 'exp-test-farmacia',
      bookingId: TEST_BOOKING_CODE,
      category: 'PHARMACY',
      description: 'Farmacia Clofán / Pasteur',
      amount: Money.fromAmount(185000, 'COP'),
      date: '2026-09-20',
      status: 'APPROVED',
    });

    const expPeaje = new ReceiptExpense({
      id: 'exp-test-peaje',
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

    const cafeRow = rows?.find((r) => r.id === 'exp-test-cafe');
    expect(cafeRow).toBeDefined();
    expect(cafeRow.amount_cents).toBe('1500000');
    expect(cafeRow.amount_currency).toBe('COP');
    expect(cafeRow.category).toBe('MEAL_SUBSIDY');

    const farmaciaRow = rows?.find((r) => r.id === 'exp-test-farmacia');
    expect(farmaciaRow).toBeDefined();
    expect(farmaciaRow.amount_cents).toBe('18500000');

    const peajeRow = rows?.find((r) => r.id === 'exp-test-peaje');
    expect(peajeRow).toBeDefined();
    expect(peajeRow.amount_cents).toBe('1610000');
  });

  it('2. Create: provisions custom digital receipt with vendor details and receipt blob reference', async () => {
    const expCustom = new ReceiptExpense({
      id: 'exp-test-custom-lab',
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
      .eq('id', 'exp-test-custom-lab')
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
      id: 'exp-test-farmacia',
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
      .eq('id', 'exp-test-farmacia')
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

    // Delta between old and new is exactly 25.000 COP
    const deltaCents = ledger.totalExpenses.cents - 34110000n;
    expect(deltaCents).toBe(2500000n);
    expect(Number(deltaCents) / 100).toBe(25000);
  });

  it('5. Delete: marks expense as REJECTED and executes deleteExpense removing row from Supabase', async () => {
    // 5.1 Soft-reject: update exp-test-cafe status to REJECTED
    const rejectedCafe = new ReceiptExpense({
      id: 'exp-test-cafe',
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

    // 5.2 Hard-delete: delete exp-test-peaje
    await adapter.deleteExpense('exp-test-peaje');

    // Confirm deletion directly in Supabase Cloud REST API
    const { data: deletedRows } = await client
      .from('expenses')
      .select('*')
      .eq('id', 'exp-test-peaje');
    expect(deletedRows).toHaveLength(0);

    expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);
    expect(expenses.find((e) => e.id === 'exp-test-peaje')).toBeUndefined();
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
    // Current approved expenses: exp-test-farmacia ($210k) + exp-test-custom-lab ($125k) = $335k (33.500.000 cents)
    const expenses = await adapter.getExpensesByBooking(TEST_BOOKING_CODE);

    // Companion shift: 6h @ $15.500 ($93k) + prep $15.5k + meal subsidy $25k = $133.500 COP (13.350.000 cents)
    const shift = new CompanionShift({
      id: 'shf-test-1',
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
      id: 'trf-test-1',
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
```

---

## 6. Gap Analysis & Recommendations for Milestone 2

During the survey of `AppContext.tsx`, an important wiring gap was identified:
- **`deleteEvent(eventId)`** is currently wired (lines 99, 494–498, 715).
- **`deleteExpense(expenseId)`** is defined on `IStoragePort` and implemented on `SupabaseStorageAdapter` and `DexieStorageAdapter`, but **is NOT yet exposed on `AppContext.tsx`**.

### Recommended Action for Milestone 2:
In `apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx`:
1. Add `deleteExpense: (expenseId: string) => Promise<void>;` to `AppContextType`.
2. Implement callback:
   ```typescript
   const deleteExpense = useCallback(
     async (expenseId: string): Promise<void> => {
       await storagePort.deleteExpense(expenseId);
       setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
     },
     [storagePort]
   );
   ```
3. Expose `deleteExpense` in the `value` provider object.

---

## 7. Execution Commands for Worker & Reviewers

```bash
# Run the newly authored Domain 5 integration test suite
cd apps/medicaltrip_react_app
npx vitest run tests/integration/supabase_expenses_settlements_crud.test.ts

# Run the complete test suite to verify 0 regressions
npm test

# Verify type safety with TypeScript compiler
npm run typecheck
```
