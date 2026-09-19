# Task Assignment: Explorer M1_3 (Expenses, Settlements BigInt Math & SHA-256 Seal)

You are Explorer M1_3 for Medical Trip Colombia.
Working Directory: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/
Parent: orchestrator_14 (Conversation ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53)

Authoritative Requirements:
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z)
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md

## Objective
Design the concrete verification test strategy for Domain 5 (Petty Cash Expenses & Deterministic Settlements) CRUD lifecycles directly against Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`):
1. **Expenses CRUD**:
   - Create: Provision 1-Tap quick expenses (`Café $15k`, `Farmacia $185k`, `Peaje $16.100`), custom receipts, and cash advances using `ReceiptExpense` and `Money` VO (`cents: bigint`). Save to Supabase `expenses` table.
   - Read: Query expenses from Supabase Cloud `expenses` table, verify currency, category, and integer cents representations.
   - Update: Edit receipt amounts, assert real-time BigInt recalculation in `SettlementLedger` (Delta = 0.00 COP).
   - Delete: Execute `storagePort.deleteExpense()` on rejected receipts, reverse cash advances, assert removal in Supabase.
2. **Deterministic Settlement CRUD & Cryptographic Seal**:
   - Create: Initialize `SettlementLedger` for booking, verify initial balance calculation with zero floating point drift.
   - Update & Recalculate: Save updated settlement via `storagePort.saveSettlement()`, asserting `sha256Seal` updates automatically using `Sha256LedgerChain`.
   - Read & Verify: Query `settlements` from Supabase Cloud, verify net balance formula:
     $$\text{Saldo Neto} = (\text{Gastos} + \text{Honorarios} + \text{Flota}) - \text{Anticipos}$$
     Assert that Delta between stringified cents in Supabase and BigInt `Money.fromCents()` is exactly 0.00 COP.

Evaluate existing utilities and formulate exact step-by-step implementation recommendations for the Worker. DO NOT implement code yourself.

Write report to `/Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/analysis.md` and deliver `handoff.md`.
Communicate back via send_message to recipient c6e995c5-1c0c-40ce-93e1-5a0f55a42e53.

## 2026-09-19T15:46:17Z
You are Explorer M1_3 for Medical Trip Colombia.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/
Read your task instructions at: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/DISPATCH.md
MANDATORY: Read the authoritative requirements file at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z) and /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md.

Design the concrete verification test strategy for Domain 5 (Petty Cash Expenses & Deterministic Settlements) CRUD lifecycles directly against Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`):
1. Expenses CRUD: Create (1-Tap & custom), Read, Update (edit amounts), Delete (reject receipts & reverse advances).
2. Settlements CRUD: Create, Update & Recalculate (BigInt delta = 0.00 COP), SHA-256 seal derivation, Read & Verify.

Formulate exact step-by-step implementation recommendations for the Worker. DO NOT implement code yourself.
Write report to `/Users/miyo123/projects/medicaltrip/.agents/explorer_m1_3/analysis.md` and deliver `handoff.md`.
Communicate back via send_message to recipient c6e995c5-1c0c-40ce-93e1-5a0f55a42e53.
