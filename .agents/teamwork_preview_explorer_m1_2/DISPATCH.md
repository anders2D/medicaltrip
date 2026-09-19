## 2026-08-23T21:59:47Z
You are teamwork_preview_explorer_m1_2.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_m1_2
Read the original request at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (see ## 2026-08-23T21:53:41Z).
Project specification: /Users/miyo123/projects/medicaltrip/PROJECT.md
Target codebase: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

Milestone 1 Scope (Domain & Application Use Cases for Flow 1 & Flow 2):
1. Flow 1 Application & Domain:
   - Design `CreatePatientBookingUseCase.ts` (`src/application/use-cases/CreatePatientBookingUseCase.ts`):
     * Input DTO: `code?`, `patientName`, `country`, `language`, `paxCount`, `arrivalDate`, `departureDate`, `hotel`, `airline?`, `flightNumber?`.
     * Validates invariants: 1 <= paxCount <= 20, T_dep >= T_arr, hotel passes OperativeTerritory validation.
     * Generates standard id (e.g. booking_${Date.now()} or UUID) and unique code (e.g. RVA-XXXX).
     * Handles duplicate booking code collisions gracefully (auto-increments code suffix if collision detected).
     * Persists to IStoragePort (DexieStorageAdapter.saveBooking) and initializes fresh SettlementLedger.
2. Flow 2 Application & Domain:
   - Design `GenerateSmartItineraryUseCase.ts` (`src/application/use-cases/GenerateSmartItineraryUseCase.ts`):
     * Input DTO: `bookingId`, `presetType` ('PLASTIC_SURGERY_12D' | 'CARDIOLOGY_5D' | 'OPHTHALMOLOGY_3D' | 'UROLOGY_4D'), `arrivalDateTimeISO`.
     * Chronological scheduling:
       - Day 1: Airport Arrival Transfer -> Hotel Check-in.
       - Day 2 (05:30 AM): At-home Fasting Blood Lab (Echavarría) -> Specialist Consultation (HPTU / Cardio VID / Clofán / CES Oviedo).
       - Day 3 (or procedure day): Surgery / Procedure Transfer & Clinic Stay -> Companion Shift.
       - Post-Op Days: At-hotel Nurse Evaluation -> Recovery Period.
       - Penultimate Day: Fit-to-Fly Medical Certification.
       - Final Day: Hotel Check-out -> Airport Return Transfer.
     * Enforces non-overlapping constraints and 15-minute slot snapping on all start/end times.
     * Assigns accurate geocoded coordinates from providers.data.ts.
     * Persists generated events, companion shifts, and driver transfers to Dexie IndexedDB.

Produce a detailed technical specification and code design report.
Write your report to `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_m1_2/handoff.md`.
Communicate back via send_message when done.
