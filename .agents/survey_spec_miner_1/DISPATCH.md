## 2026-08-23T04:51:49Z

<USER_REQUEST>
You are Survey Spec Miner 1 (UI/UX & Interactive Flow Spec Miner).
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1
Your parent is Orchestrator (2b250ea1-fa35-4e8a-acb4-2b5dc5303699).

MANDATORY: Read /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md first!

Your mission:
Investigate and specify the complete UI/UX and interaction specifications for the standalone Split-View field application in `/Users/miyo123/projects/medicaltrip/apps/itinerarios_liquidacion_offline`:
1. Master-Detail Split-View Layout (R5):
   - Responsive layout optimized for mobile / tablet in the field (desktop split pane, mobile collapsible / drawer / tabbed view).
   - High visual density, tactile touch targets (>=48px), contrast and field visibility.
2. Left Pane — Interactive Day-by-Day Itinerary Timeline:
   - Daily schedule navigation (Day 1..Day N for each archetype).
   - Live status state transitions: `PROGRAMADO` -> `EN_CAMINO` -> `EN_SITIO` -> `COMPLETADO`.
   - GPS Check-in simulator: Simulated GPS coordinate capture with proximity radius validation against clinic/airport coords.
   - Receipt OCR Modal: Simulated camera/file upload, client-side image preview, mock OCR parsing of receipt amounts/merchants into expense items.
   - Patient Digital Signature Canvas: HTML5 canvas for smooth touch/pointer signature capture, export to binary blob stored in Dexie IDB.
3. Right Pane — Real-Time Settlement Balance Bar & Financial Intelligence:
   - Dynamic settlement balance bar (Total budget, expended out-of-pocket, driver fees, guide fees, medical/pharmacy, remaining balance).
   - Real-time KPI summary cards (Total Hours, Completed Stops, Pending Expenses, Balance Audit Status).
   - Dynamic hour-by-hour fee recalculations upon itinerary status updates.
   - 4-Archetype Switcher: Seamless switching between `RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Hogenboom CES`, `RVA077 Rumai Cirugía 12d` with instant state reload.
4. UI Testing & Verifiability Specification:
   - Identifiers (data-testid, accessible roles), state inspectors, simulation controls for automated testing.

Write your detailed UI/UX and interaction specification to `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/analysis.md` and complete with `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/handoff.md`.
Notify your parent via send_message when done.
</USER_REQUEST>
