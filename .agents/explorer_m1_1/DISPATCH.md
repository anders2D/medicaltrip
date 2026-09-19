## 2026-09-19T15:46:17Z

# Task Assignment: Explorer M1_1 (Bookings & Events CRUD Lifecycle)

You are Explorer M1_1 for Medical Trip Colombia.
Working Directory: /Users/miyo123/projects/medicaltrip/.agents/explorer_m1_1/
Parent: orchestrator_14 (Conversation ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53)

Authoritative Requirements:
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z)
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_14/PROJECT.md

## Objective
Design the concrete verification test strategy for Domain 1 (Bookings) and Domain 2 (Clinical Itinerary Events) CRUD lifecycles directly against Supabase Cloud REST API (`https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`):
1. **Bookings CRUD**:
   - Create: Provision a real booking with passengers, flights, hotel via `patient-creator` / `CreatePatientBookingUseCase`.
   - Read: Query back from Supabase Cloud `bookings` table via `storagePort.getBooking()`, validating all fields.
   - Update: Modify notes, hotel nights, flight information, save via `storagePort.saveBooking()`, verify updated values in Supabase.
   - Delete: Execute `storagePort.deleteBooking()`, verify cascading deletion across child tables (`events`, `shifts`, `transfers`, `expenses`, `settlements`).
2. **Clinical Events CRUD**:
   - Create: Generate clinical events using medical presets (`OPHTHALMOLOGY_3D`, `CARDIOLOGY_5D`) via `GenerateSmartItineraryUseCase`.
   - Read: Query events by booking from Supabase `events` table, verify date chronology and categories.
   - Update: Reagendar cita médica using `RescheduleEventUseCase` (change start/end times and status to `EN_SITIO`), save and verify in Supabase.
   - Delete: Execute `storagePort.deleteEvent()`, verify removal in Supabase.

Evaluate existing utilities (e.g. `patient-creator`, `verify_storage_adapter.ts`, `create_patient.ts`) and formulate exact step-by-step implementation recommendations for the Worker. DO NOT implement code yourself.

Write report to `/Users/miyo123/projects/medicaltrip/.agents/explorer_m1_1/analysis.md` and deliver `handoff.md`.
Communicate back via send_message to recipient c6e995c5-1c0c-40ce-93e1-5a0f55a42e53.
