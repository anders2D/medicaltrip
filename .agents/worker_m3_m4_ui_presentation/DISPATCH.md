## 2026-08-23T15:52:00Z

<DISPATCH>
You are Worker 3 for Milestone 3 & Milestone 4: Google Calendar / Linear-Grade Consumer UI/UX, Master-Detail Calendar Engine, Live Financial Settlement Drawer, and 4 Real-World Archetypes.
Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/worker_m3_m4_ui_presentation`.
The target app directory is `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`.
The master project blueprint is at `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/PROJECT.md`.
The UI/UX specifications are at `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_ui/survey_ui.md`.
The domain survey is at `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_domain/survey_domain.md`.
The original request is at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.

Your write ownership:
- `apps/medicaltrip_calendar_app/src/presentation/**/*`
- `apps/medicaltrip_calendar_app/src/infrastructure/archetypes/**/*`
- `apps/medicaltrip_calendar_app/src/infrastructure/ocr/**/*`
- `apps/medicaltrip_calendar_app/src/App.tsx`
- `apps/medicaltrip_calendar_app/src/main.tsx`
- `apps/medicaltrip_calendar_app/src/index.css`
- `apps/medicaltrip_calendar_app/index.html`

Your task:
1. Implement the 4 Real-World Drive Archetypes data in `src/infrastructure/archetypes/`:
   - `rva171_catia_data.ts`: 5 pax (Curacao/Papiamento), Clofán eye surgery + CIMA ultrasound + pediatric urology, Inntu Laureles, Uber XL fleet, multi-day itinerary with advances and expenses.
   - `rva282_george_data.ts`: 2 pax (Curacao/USA), Cardio VID cardiac evaluation + CES Oviedo urology + Echavarría lab, 32-day stay in Park 42 Poblado, Colasistencia insurance, eSIM 80GB, Aeroturex transfers.
   - `rva341_eduard_data.ts`: 2 pax (Aruba/Netherlands - English/Dutch), CES Oviedo & Prado urological surgery, at-home fasting lab draw at 05:30 AM in room 1004 Hotel Inntu ($65.000 + $32.350 early arrival fee).
   - `rva077_rumai_data.ts`: 2-4 pax (Curacao), 12-day extensive surgery journey at HPTU and Hernán Ocazionez ($170.755 COP), Novelty Suites / Villa Anita, 22 vehicle transfers, multi-stage settlement.
   - `ArchetypeRegistry.ts`: Registry mapping IDs to archetypes with metadata and hydration functions.
2. Implement Receipt OCR and Digital Signature Adapters:
   - `src/infrastructure/ocr/ItemizedReceiptOCRAdapter.ts`: Implements `IReceiptOCRService` with regex/heuristic itemized pharmacy/taxi extraction.
3. Implement Presentation State Hooks:
   - `src/presentation/hooks/useItinerary.ts`: Loads and manages active itinerary, selected milestone, active view (`day`|`week`|`month`|`agenda`), filters, and archetype switching.
   - `src/presentation/hooks/useSettlementBalance.ts`: Reactive hook computing master BigInt settlement balance and category breakdown on any change.
   - `src/presentation/hooks/useActorSwarm.ts`: Reactively connects to `WebWorkerSwarmBus` with live worker statuses ([DRV], [GUIA], [NURSE], [FIN]) and audit log stream.
4. Implement UI Components with Google Calendar / Linear Design Tokens (Neutral Zinc/Slate, Inter typography, 48px touch targets, zero AI-gimmick neon gradients):
   - Layout: `Header.tsx`, `Sidebar.tsx`, `MasterDetailContainer.tsx` (60/40 desktop split, responsive mobile toggle).
   - Calendar Engine: `CalendarHeader.tsx` (view switcher, date navigation, search/filter, new event button), `DayView.tsx` (hourly time grid 06:00-22:00, concurrent collision handling), `WeekView.tsx` (7-day column grid with all-day banner), `MonthView.tsx` (7x5 month matrix with overflow pills), `AgendaView.tsx` (chronological list), `MilestoneCard.tsx` (semantic color tags, time, location, staff, status pill), `DragDropGhost.tsx` (15-min snapping).
   - Drawers: `EventDetailDrawer.tsx` (rich editor: title, times, category, provider/clinic selector, hotel selector, driver/guide assignment, out-of-pocket expenses, live settlement delta), `LiveBalanceDrawer.tsx` (multi-segment proportional balance bar in BigInt cents, real-time KPI cards, itemized ledger breakdown), `SwarmStatusDrawer.tsx` (actor status and cryptographic SHA-256 chain verification badge).
   - Modals: `ReceiptOCRModal.tsx` (receipt image drag-drop/uploader, itemized line-item extractor, instant ledger deduction), `DigitalSignatureModal.tsx` (HTML5 Retina canvas with Bézier curve smoothing, clear/save, legal disclaimer), `ArchetypeSelectorModal.tsx` (one-click preset switcher across RVA171, RVA282, RVA341, RVA077).
   - Common: `CategoryBadge.tsx` (Sky Blue Flights, Indigo Clinical, Teal Labs, Emerald/Amber Pharmacy, Warm Slate Hotel), `MoneyDisplay.tsx` (formatted COP/USD in BigInt cents with tabular nums), `InvariantErrorAlert.tsx` (fail-fast error banner for forbidden territories like Mocoa).
   - App Root: `App.tsx`, `main.tsx`, `index.css` (Tailwind styles, custom scrollbars, clean transitions).
5. Build and test:
   - Run `npm run typecheck` and `npm run build`.
   - Run all unit, integration, and E2E tests (`npx vitest run`).
   - Verify 100% tests pass and 0 TypeScript errors.
6. Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_m3_m4_ui_presentation/handoff.md` and message back the orchestrator.
</DISPATCH>
