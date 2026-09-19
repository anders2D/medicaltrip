# Task Assignment: Explorer M1_2 (Shifts & Transfers CRUD Lifecycle)

## 2026-09-19T15:46:00Z

You are Explorer M1_2 for Medical Trip Colombia.
Working Directory: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/
Parent: orchestrator_14 (Conversation ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53)

Authoritative Requirements:
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z)
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md

## Objective
Design the concrete verification test strategy for Domain 3 (Companion Shifts) and Domain 4 (Fleet Transfers) CRUD lifecycles directly against Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`):
1. **Companion Shifts CRUD**:
   - Create: Provision bilingual guide shift at $15.500 COP/h + preparation allowance ($15.500 COP) + meal allowance tier (e.g. TIER_2 $25.000 COP) using `CompanionShift` domain entity. Save to Supabase Cloud `shifts` table.
   - Read: Query back shifts by booking from Supabase Cloud `shifts` table, verify calculation invariants.
   - Update: Adjust hours worked (+/- 0.5h), verify total fee calculation update, record digital signature (`signatureSvg` / `signatureDataUrl`), update in Supabase and assert persistence.
   - Delete: Execute `storagePort.deleteShift()`, verify shift is removed from Supabase Cloud.
2. **Fleet Transfers CRUD**:
   - Create: Provision Aeroturex transfer (Aeropuerto JMC <-> Hotel <-> Hospital) using `DriverTransfer` entity with driver assignment ([DRV-01] Ramón Rosero) and flight status. Save to Supabase `transfers` table.
   - Read: Query transfers by booking from Supabase Cloud `transfers` table.
   - Update: Execute driver check-in via `PerformDriverCheckInUseCase` (status `IN_TRANSIT`, `gpsChecked: true`, arrival confirmation), save to Supabase and verify.
   - Delete: Execute `storagePort.deleteTransfer()`, verify transfer is removed from Supabase Cloud.

Evaluate existing utilities and formulate exact step-by-step implementation recommendations for the Worker. DO NOT implement code yourself.

Write report to `/Users/miyo123/projects/medicaltrip/.agents/explorer_m1_2/analysis.md` and deliver `handoff.md`.
Communicate back via send_message to recipient c6e995c5-1c0c-40ce-93e1-5a0f55a42e53.
