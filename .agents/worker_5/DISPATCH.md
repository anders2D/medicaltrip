## 2026-08-23T05:10:00Z
You are Worker M5 (worker_m5) for Medical Trip Colombia S.A.S.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/worker_5
Your parent is Orchestrator (2b250ea1-fa35-4e8a-acb4-2b5dc5303699).

MANDATORY: Read /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md first!
Also read /Users/miyo123/projects/medicaltrip/apps/itinerarios_liquidacion_offline/PROJECT.md and existing code across `src/domain/`, `src/infrastructure/`, `src/application/`, and `src/actors/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own:
- `apps/itinerarios_liquidacion_offline/index.html`
- `apps/itinerarios_liquidacion_offline/assets/css/**`
- `apps/itinerarios_liquidacion_offline/src/ui/**`
- `apps/itinerarios_liquidacion_offline/src/app.js`
- `apps/itinerarios_liquidacion_offline/tests/unit/ui.test.js`
Do NOT modify other directories.

Your mission:
Implement Milestone 5 (Master-Detail Split-View Field UI/UX & Microinteractions) in `apps/itinerarios_liquidacion_offline/`:
1. `index.html`:
   - Standalone PWA Master-Detail Split-View interface (Left Pane: Day-by-Day timeline with live status badges, GPS Check-in button, Receipt OCR button, Patient Signature button; Right Pane: Proportional Settlement Balance Bar, 4 KPI Cards, 4-Archetype Selector, Accounting Balance Sheet).
   - High visual density, >=48px touch targets, WCAG AAA contrast for field sunlight readability, PWA meta tags, manifest and service-worker registration.
2. `assets/css/`:
   - `variables.css`: Design tokens, colors, touch targets, elevation shadows.
   - `base.css`: Typography, field layout, responsive container.
   - `layout.css`: 60/40 desktop split view grid, mobile collapsible bottom drawer.
   - `timeline.css`: Timeline nodes, status chips (`PROGRAMADO`, `EN_CAMINO`, `EN_SITIO`, `COMPLETADO`).
   - `balance-bar.css`: Multi-segment colored proportional balance bar with BigInt values.
   - `modals.css`: Modals for GPS Check-in (with interactive coordinate simulation and distance meter), Receipt OCR (with camera preview and extracted amount/category), Signature Pad (with HTML5 canvas drawing and clear/save), and Audit Balance Sheet.
3. `src/ui/`:
   - `state/app-store.js`: Reactive UI state store connected to SQLite, Dexie, Actors, and Application CQRS handlers. Exposes `window.MedicalTripFieldApp` automation bridge with methods: `getActiveArchetype()`, `setActiveArchetype(code)`, `getItinerary()`, `transitionStatus(id, newStatus)`, `submitCheckIn(id, coords)`, `submitSignature(id, blob)`, `submitExpense(expense)`, `getSettlementBalance()`, `getAuditReport()`, `simulateReceiptOcr(file)`.
   - `components/itinerary-timeline.js`: Interactive timeline with day tabs, stop cards, live FSM transition buttons, and microinteraction triggers.
   - `components/settlement-balance-bar.js`: Dynamic balance bar rendering Advances vs Expenses, category breakdown pills, KPI summary cards, and overdraft alerts.
   - `components/archetype-switcher.js`: Instant switcher between `RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Hogenboom CES`, and `RVA077 Rumai Cirugía 12d` with clean state isolation.
   - `components/gps-checkin-modal.js`: GPS modal with Haversine distance feedback and radius verification.
   - `components/receipt-ocr-modal.js`: Receipt modal with client-side OCR parsing simulation.
   - `components/signature-pad-modal.js`: HTML5 canvas signature pad with touch/pointer drawing and PNG/SVG export.
   - `components/audit-sheet-modal.js`: Full itemized accounting balance sheet view.
4. `src/app.js`: Main application bootstrapper.
5. `tests/unit/ui.test.js`: Automated DOM/UI integration tests verifying rendering, archetype hydration, status transitions, balance recalculations, and microinteraction flows.

Execute tests and verify that the UI and automation bridge integrate seamlessly with the existing test runner (`node tests/e2e_test_runner.js`).
Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_5/handoff.md` and notify parent via send_message when done.
