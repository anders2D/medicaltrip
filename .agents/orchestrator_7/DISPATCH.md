# DISPATCH Assignment

## 2026-08-23T21:54:17Z
Implement, streamline, and rigorously verify end-to-end operational flows with minimal user friction (Minimum Clicks / Zero-Friction UX) for Medical Trip Colombia S.A.S. in `apps/medicaltrip_react_app`, pairing dedicated UI/UX Designers and QA Engineers across all operational journeys from patient onboarding to final settlement.

Organize your team of agents into flow-specific UI/UX and QA pairs to design, implement, and exhaustively test the end-to-end journeys across:
1. Flow 1: 1-Click Patient & Group Onboarding (`+ Nuevo Paciente / Reserva`)
   - UI/UX Streamlining: Quick-modal / drawer with smart defaults (origin country, spoken language, assigned hotel, group size 1 to 5 pax) allowing complete booking creation in <= 2 clicks or via keyboard shortcut (`N`).
   - QA Verification: Validation of UUID generation, duplicate booking detection, territory invariants, and persistent storage in Dexie IndexedDB.
2. Flow 2: 1-Click Surgical/Clinical Smart Itinerary Generator
   - UI/UX Streamlining: One-click "Generar Itinerario Inteligente" button with surgical/diagnostic presets (e.g. Cirugía Plástica 12d, Cardiología 5d, Oftalmología 3d) that automatically schedules: Flight Arrival -> Fasting Lab (05:30 AM) -> Specialist Consultation -> Surgery / Clinic -> Post-Op Nursing Visit -> Fit-to-Fly Check -> Airport Return.
   - QA Verification: Chronological order verification, non-overlapping constraints, geofenced clinical coordinates, and 15-min calendar slot snapping.
3. Flow 3: Frictionless In-Line Event Mutation & Drag-to-Reschedule
   - UI/UX Streamlining: Direct click-to-create on calendar time slots, drag-to-reschedule with optimistic ghost feedback, single-tap status progression (`PROGRAMADO` -> `EN_CAMINO` -> `EN_SITIO` -> `COMPLETADO`), and keyboard shortcuts (`T` for Today, `M`/`W`/`D`/`A` for views).
   - QA Verification: Timezone consistency (ISO-8601 UTC-5), CRDT state resolution across concurrent edits, and Web Worker background dispatch.
4. Flow 4: Instant Expense & Out-of-Pocket Logging (Café, Farmacia, Taxis)
   - UI/UX Streamlining: Fast-action expense presets (Café $15.000 COP, Farmacia $185.000 COP, Almuerzo Guía $25.000 COP, Peaje $18.000 COP, Taxi JMC $90.000 COP) plus 1-tap Camera OCR scanner, updating the live settlement balance in <= 1 click.
   - QA Verification: BigInt arithmetic precision (delta = 0), expense categorization (`PHARMACY`, `MEAL_SUBSIDY`, `TOLL`, `OTHER`), and receipt blob storage.
5. Flow 5: 1-Tap Settlement Reconciliation, Digital Signature & PDF Export
   - UI/UX Streamlining: Prominent "Liquidar & Firmar Itinerario" CTA that opens a pre-filled high-DPI signature pad, captures biometric signature, executes SHA-256 seal, triggers celebratory confetti, and auto-downloads the audit PDF in 1 smooth sequence.
   - QA Verification: Mathematical balance verification (`Flota + Guía + Gastos - Anticipos = Saldo`), SHA-256 cryptographic chain verification, and PDF format compliance.

Acceptance Criteria:
- Click-reduction benchmarks verified: <= 3 interactions for patient+itinerary, 1 single click for expense logging, 1-tap settlement/sign/export.
- 100% test pass rate across all Vitest test suites.
- 0 TypeScript compilation errors under `strict: true`.
- Clean production build in `dist/` with zero console runtime exceptions.
