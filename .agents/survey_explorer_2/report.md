# Frontend Architecture & Radical Functional Minimalist UI/UX Survey Report

**Explorer**: `survey_explorer_2` (Frontend Architecture Explorer)  
**Target Repository**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date**: 2026-08-25  
**Mission**: Forensic survey of the frontend architecture, component hierarchy, Tailwind styling, typographic scale, operational workflows, and interaction models for the Radical Functional Minimalist UI/UX Refactoring (Requirement R2, Phases 1-4).

---

## 1. Executive Summary

A comprehensive architectural and forensic inspection was performed on the React application (`apps/medicaltrip_react_app`). The application has a rock-solid domain and state foundation (101 test files passing, 904 tests total), deterministic BigInt cents arithmetic, and robust CQRS / offline Dexie persistence.

However, the user interface exhibits visual and cognitive debt accumulated across rapid iterations:
1. **Visual Clutter & Noise**: Heavy shadow utilities (`shadow-2xl`, `shadow-xl`, `shadow-lg`, `shadow-md`) and pseudo-classes (`shadow-2xs`) proliferate across 30+ files. Artificial linear gradients (`bg-gradient-to-r`) exist in logistics cards.
2. **Component & Button Overload**: The docked settlement bar houses 8 action buttons plus 5 fast expense presets in a single view, violating Hick-Hyman Law (cognitive capacity <= 5 primary actions).
3. **Typographic Fragmentation**: Fragmented font sizes (`text-[9px]`, `text-[10px]`, `text-[11px]`) violate monotonic scaling (12px, 14px, 16px, 20px). While `tabular-nums` is used in several components, key timestamps, flight schedules, and financial totals remain in standard proportional font.
4. **Missing Minimalist Invariants**:
   - **Dual-Timezone Indicator**: Lacks explicit `COT (Medellín, UTC-5)` vs `AST (Caribe, UTC-4)` synchronized display.
   - **Optimistic UI with Toast Undo**: Lacks a universal toast notification provider with `Ctrl+Z` / "Deshacer" rollback for state mutations.
   - **DOM Nesting & Containers**: Excessive nested rounded box wrappers (`bg-zinc-50 border border-zinc-200 rounded-xl p-3.5`) cluttering modals and drawers.

---

## 2. Comprehensive Frontend Source Tree Inventory

```
apps/medicaltrip_react_app/src/
├── App.tsx                                 # MainAppLayout root shell & layout orchestrator
├── main.tsx                                # React 18 createRoot bootstrap
├── index.css                               # CSS variables, custom scrollbars, tabular-nums utility
├── application/                            # CQRS application use cases (12 use cases)
│   ├── use-cases/
│   │   ├── CreateEventUseCase.ts
│   │   ├── CreatePatientBookingUseCase.ts
│   │   ├── ExportSettlementPDFUseCase.ts
│   │   ├── GenerateSmartItineraryUseCase.ts
│   │   ├── LoadArchetypeUseCase.ts
│   │   ├── OneTapSettlementWorkflowUseCase.ts
│   │   ├── PerformDriverCheckInUseCase.ts
│   │   ├── PersistStorageUseCase.ts
│   │   ├── ReconcileSettlementUseCase.ts
│   │   ├── RescheduleEventUseCase.ts
│   │   ├── SettleExpenseUseCase.ts
│   │   └── SignOffItineraryUseCase.ts
├── domain/                                 # Pure Hexagonal Domain Entities & Value Objects
│   ├── entities/                           # PatientBooking, ItineraryEvent, CompanionShift, DriverTransfer, ReceiptExpense, SettlementLedger
│   ├── value-objects/                      # Money (BigInt), OperativeTerritory, EventCategory, EventStatus
│   ├── errors/                             # DomainError, NonOperativeTerritoryError
│   └── ports/                              # IStoragePort, IExportPort, IOCRPort, IActorEventBusPort
├── infrastructure/                         # Storage, OCR, PDF export, CRDTs, Sha256LedgerChain
├── presentation/                           # React Presentation Layer
│   ├── state/
│   │   └── AppContext.tsx                  # Master state, keyboard shortcuts ([1-4], [M,W,D,A], [T], [C], [N], [I], [G], [K])
│   ├── hooks/
│   │   ├── useArchetypes.ts                # Archetype loading & active profile switching
│   │   ├── useItinerary.ts                 # Itinerary event CRUD & scheduling
│   │   ├── useSettlement.ts                # Real-time ledger accounting & KPI derivations
│   │   ├── useSwarmActors.ts               # Web Worker actor RPC messaging
│   │   ├── useConfetti.ts                  # Canvas confetti burst triggers
│   │   └── useMediaQuery.ts                # Responsive viewport matchers
│   ├── i18n/
│   │   ├── LanguageContext.tsx             # Multilingual context (ES, EN, NL, PAP)
│   │   ├── translations/                   # es.ts, en.ts, nl.ts, pap.ts
│   │   └── types.ts                        # Translation dictionary schema
│   └── components/                         # UI Components
│       ├── badges/
│       │   ├── LanguageBadge.tsx           # Multi-language badge (PAP, NL, EN, ES)
│       │   └── NationalityBadge.tsx        # Country flag & territory badge (CW, AW, BQ)
│       ├── calendar/
│       │   ├── CalendarContainer.tsx       # Master calendar wrapper
│       │   ├── CalendarHeader.tsx          # Date navigation, view switcher, action triggers
│       │   ├── MonthView.tsx               # 7-col desktop grid & mobile dot agenda
│       │   ├── WeekView.tsx                # Proportional 06:00-22:00 timeline + 15m D&D
│       │   ├── DayView.tsx                 # Collision clustering timeline canvas
│       │   ├── AgendaView.tsx              # Chronological list with daily totals & arrival card
│       │   ├── EventCard.tsx               # Polymorphic event card (month, week, day, agenda)
│       │   ├── EventHoverCard.tsx          # Hover popover card
│       │   └── GhostDropIndicator.tsx      # D&D snap ghost preview
│       ├── common/
│       │   ├── Button.tsx                  # Primary, secondary, outline, ghost, danger, subtle
│       │   ├── Input.tsx                   # Form input with prefix/suffix icons & errors
│       │   ├── Select.tsx                  # Form select dropdown
│       │   ├── Modal.tsx                   # Accessible modal dialog with backdrop & ESC handler
│       │   └── Badge.tsx                   # Multi-variant semantic badge with dot
│       ├── companion/
│       │   ├── CompanionTurnSheetModal.tsx # 15m stepper, hourly rates, digital signature, SHA-256 seal
│       │   └── MealSubsidySelector.tsx     # 5-tier meal allowance selector ($0-$45k COP)
│       ├── drawer/
│       │   ├── EventDetailDrawer.tsx       # Desktop slide-over & mobile bottom sheet
│       │   └── EventForm.tsx               # Complete itinerary event edit form
│       ├── language/
│       │   └── LanguageSwitcher.tsx        # 4-language toggle pill
│       ├── logistics/
│       │   ├── ArrivalTrackingCard.tsx     # Flight tracker, driver info, hotel, 1-click check-in
│       │   ├── DriverCheckInAction.tsx     # 1-click JMC terminal check-in button
│       │   ├── OrientationKitPreview.tsx   # Welcome kit summary preview
│       │   └── WelcomeOrientationModal.tsx # SIM card, emergency numbers, exchange rate modal
│       ├── modals/
│       │   ├── NewPatientModal.tsx         # Fast 1-click onboarding modal with smart defaults
│       │   └── SmartItineraryModal.tsx     # 4 canonical clinical preset generator modal
│       ├── navigation/
│       │   ├── FloatingActionButton.tsx    # Mobile (+) floating action button
│       │   └── MobileBottomNav.tsx         # Mobile 5-tab fixed navigation bar
│       ├── settlement/
│       │   ├── DockedSettlementBar.tsx     # Fixed bottom bar, 5-seg progress, fast expense presets
│       │   ├── SettlementKpiCards.tsx      # 5 KPI cards (fleet, guide, pharmacy, advances, net)
│       │   ├── DigitalSignaturePad.tsx     # HTML5 canvas signature pad + 1-Tap settlement
│       │   └── ReceiptOcrModal.tsx         # Simulated laser scanning & itemized receipt parser
│       ├── swarm/
│       │   ├── SwarmDiagnosticsModal.tsx   # Diagnostics modal for Web Worker actors
│       │   └── SwarmStatusIndicator.tsx    # Micro telemetry status pill
│       └── switcher/
│           └── ArchetypeSwitcherBar.tsx    # Brand logo, offline status, 4 patient pills
```

---

## 3. Forensic Review of Current Styling & Anti-Patterns

### 3.1 Heavy Shadows Inventory (Prohibited Utilities to Purge)

| File Path | Line | Current Class | Refactoring Action |
|:---|:---|:---|:---|
| `navigation/FloatingActionButton.tsx` | 23 | `shadow-2xl` | Replace with `shadow-sm ring-1 ring-white/10` |
| `drawer/EventDetailDrawer.tsx` | 114 | `shadow-xl` | Replace with `border-l border-zinc-200 shadow-none` |
| `common/Modal.tsx` | 60 | `shadow-xl` | Replace with `shadow-sm ring-1 ring-zinc-950/5` |
| `modals/NewPatientModal.tsx` | 192 | `shadow-xl` | Replace with `shadow-sm ring-1 ring-zinc-950/5` |
| `modals/SmartItineraryModal.tsx` | 448 | `shadow-xl` | Replace with `shadow-sm ring-1 ring-zinc-950/5` |
| `modals/SmartItineraryModal.tsx` | 517 | `shadow-md` | Replace with `ring-1 ring-zinc-900 shadow-none` |
| `calendar/EventHoverCard.tsx` | 82 | `shadow-xl` | Replace with `border border-zinc-200 shadow-sm` |
| `calendar/MonthView.tsx` | 381 | `shadow-xl` | Replace with `border border-zinc-200 shadow-sm` |
| `settlement/DockedSettlementBar.tsx` | 290 | `shadow-[0_-4px_24px_rgba(0,0,0,0.06)]` | Replace with clean `border-t border-zinc-200` |
| `settlement/DockedSettlementBar.tsx` | 296 | `shadow-lg` | Replace with `border border-zinc-800 shadow-sm` |
| `calendar/EventCard.tsx` | 233, 236, 324 | `shadow-md`, `shadow-lg` | Replace with `ring-1 ring-indigo-600 shadow-none` |
| Multiple files (30+ instances) | Various | `shadow-2xs`, `shadow-xs` | Purge custom `shadow-2xs` in favor of standard 1px border dividers |

### 3.2 Gradient Inventory

| File Path | Line | Current Gradient Class | Refactoring Action |
|:---|:---|:---|:---|
| `logistics/ArrivalTrackingCard.tsx` | 103 | `bg-gradient-to-r from-zinc-900 to-zinc-800` | Replace with solid flat `bg-zinc-950` with subtle `border-b border-zinc-800` |

### 3.3 Container Nesting & Decorative Box Clutter

1. **`CompanionTurnSheetModal.tsx`**: Contains 6 nested container boxes (`bg-zinc-50 border border-zinc-200 rounded-xl p-3.5`), stacking cards inside cards. Flatten into clean border-divided rows (`divide-y divide-zinc-200/60`).
2. **`SmartItineraryModal.tsx`**: Presets grid has nested boxes, inside which are additional nested pills. Flatten into a cohesive selection list.
3. **`ArrivalTrackingCard.tsx`**: 3 inner boxes for Flight, Driver, and Hotel each have background fills and borders. Streamline into 3 clean vertical columns separated by 1px hairline dividers.
4. **`EventForm.tsx`**: Multiple sections wrapped in `bg-zinc-50 border border-zinc-200 rounded-xl`. Replace with simple section headers and whitespace.

### 3.4 Button & Action Overload (Hick-Hyman Law Violation)

- **`CalendarHeader.tsx`** currently displays:
  1. Prev / Today / Next date stepper
  2. View Switcher (Mes, Semana, Día, Agenda)
  3. Turnos Guía (`[G]`)
  4. Kit de Bienvenida (`[K]`)
  5. Itinerario Inteligente (`[I]`)
  6. Nuevo Evento (`[C]`)
  *Total*: 6 disparate controls competing for attention on the top bar.
- **`DockedSettlementBar.tsx`** currently displays:
  1. Master balance formula
  2. 5-segment progress bar
  3. 5 fast expense preset buttons
  4. Liquidar & Firmar CTA
  5. Turnos Guía button
  6. Firmar button (duplicate of Liquidar & Firmar)
  7. OCR button
  8. PDF export button
  9. KPIs drawer toggle
  10. Recalculate button
  11. Export JSON button
  *Total*: 13 distinct interactive buttons on a single docked bar!
  *Solution*: Consolidate into 1 Primary CTA ("Liquidar & Firmar"), 2 Secondary Actions ("Escanear OCR", "Exportar PDF"), 5 Fast Presets, and 1 Overflow Menu (`...`) for secondary tools (Turnos Guía, JSON, Recalculate).

---

## 4. Typographic Scale & Tabular Numbers Audit

### 4.1 Non-Monotonic Font Sizes to Purge

| Non-Standard Size | Found Locations | Standard Replacement |
|:---|:---|:---|
| `text-[9px]` | `MealSubsidySelector.tsx:132`, `CalendarHeader.tsx:259`, `SwarmStatusIndicator.tsx:58` | `text-xs font-mono` (12px) |
| `text-[10px]` | `ArchetypeSwitcherBar.tsx:41,102,117,125`, `EventCard.tsx:212,252`, `SmartItineraryModal.tsx:492,534` | `text-xs` (12px) |
| `text-[11px]` | `ArchetypeSwitcherBar.tsx:45,55`, `MonthView.tsx:200,238,268`, `WeekView.tsx:254,297`, `EventCard.tsx:205,240,408`, `ArrivalTrackingCard.tsx:118,142,152,158`, `SettlementBar.tsx:448,541` | `text-xs` (12px) |
| `text-lg` / `text-xl` | `SettlementKpiCards.tsx:60,83,106`, `ReceiptOcrModal.tsx:476`, `CalendarHeader.tsx:212` | Unify headings to `text-base font-bold` (16px) or `text-xl font-extrabold` (20px) |

### 4.2 Tabular Numbers & Font-Mono Verification

- **Currently Compliant**:
  - `Money.formatCOP()` outputs formatted currency strings.
  - Financial KPI cards in `SettlementKpiCards.tsx` and `DockedSettlementBar.tsx` use `tabular-nums`.
  - Date numbers in `MonthView.tsx`, `WeekView.tsx`, and `DayView.tsx` use `tabular-nums`.
- **Missing / Incomplete Areas**:
  - `ArrivalTrackingCard.tsx`: Flight scheduled arrival time (`formattedTime`) lacks `tabular-nums`.
  - `EventCard.tsx` (Agenda View): Duration minutes `(60m)` and category tags lack `font-mono`.
  - `ReceiptOcrModal.tsx`: Quantity column and item numbers lack `font-mono tabular-nums`.
  - `CompanionTurnSheetModal.tsx`: Step counters and rate breakdown headers need strict `font-mono tabular-nums`.

---

## 5. Operational Workflows & Ergonomics Survey

### 5.1 Flow 1: Patient Selection & Onboarding
- **Strengths**: Instant switching between 4 Google Drive archetypes (`rva171`, `rva282`, `rva341`, `rva077`) via keyboard shortcuts `[1-4]`. Clean creation of new bookings via `[N]`.
- **Optimization Opportunities**:
  - In `ArchetypeSwitcherBar.tsx`, remove redundant labels ("Terreno", "Pax", flag emoji styling).
  - Streamline `NewPatientModal.tsx` to autofocus patient name field and submit on `Enter`.

### 5.2 Flow 2: Smart Itinerary Generator
- **Strengths**: 1-click generation of 4 clinical pathways (`PLASTIC_SURGERY_12D`, `CARDIOLOGY_5D`, `OPHTHALMOLOGY_3D`, `UROLOGY_4D`). Realistic timestamps (05:30 AM fasting lab, 14:00 pre-op consultation, Fit-to-Fly certificate).
- **Optimization Opportunities**:
  - In `SmartItineraryModal.tsx`, remove the heavy 2x2 colored cards and replace with a sleek list selector showing duration, clinic, and 1-click action.

### 5.3 Flow 3: Calendar Ergonomics & Snapping
- **Strengths**: Month, Week, Day, Agenda views with 15-minute drag-and-drop snapping and collision-free day tracks.
- **Optimization Opportunities**:
  - In `WeekView.tsx`, remove redundant `GMT-5` text corner; replace with clean dual-timezone header.
  - In `MonthView.tsx`, eliminate the popover modal for overflow events in favor of an inline expandable accordion or quick day agenda focus.

### 5.4 Flow 4: Fast In-Situ Expense Ingestion
- **Strengths**: 5 fast presets (`☕ Café $15k`, `💊 Farmacia $185k`, `🍽️ Almuerzo $25k`, `🛣️ Peaje $18k`, `🚕 Taxi $90k`) commit directly to the ledger in 1 click.
- **Optimization Opportunities**:
  - In `DockedSettlementBar.tsx`, streamline the presets bar with cleaner monochrome icons and subtle hover fills (`hover:bg-zinc-100`), removing excessive colored backgrounds (`bg-amber-50`, `bg-emerald-50`, `bg-indigo-50`, `bg-yellow-50`).

### 5.5 Flow 5: 1-Tap Settlement, Signature & PDF Export
- **Strengths**: High-DPI canvas signature pad, automatic SHA-256 seal calculation, multi-burst confetti, instant PDF statement export in <= 2 clicks.
- **Optimization Opportunities**:
  - Eliminate duplicate "Firmar" and "Liquidar & Firmar" buttons in `DockedSettlementBar.tsx`.
  - Provide a single unified flow: clicking "Liquidar & Firmar" opens `DigitalSignaturePad.tsx`, which signs, calculates seal, triggers confetti, and downloads PDF in 1 tap.

### 5.6 International Caribbean Experience & Logistics
- **Strengths**: 4-language support (`Papiamento`, `Nederlands`, `English`, `Español`), arrival tracking card with driver check-in, companion turn sheet with tiered meals.
- **Optimization Opportunities**:
  - Modernize `ArrivalTrackingCard.tsx` from dark gradient header to flat minimalist surface.
  - Add Dual-Timezone Indicator displaying `COT (Medellín)` and `AST (Caribe)` timestamps side-by-side.

---

## 6. Micro-Interactions, Optimistic UI & Toast Undo Architecture

### 6.1 Current Gap: Missing Toast Undo Stack
Currently, when an event is deleted, rescheduled, or a fast-expense is logged, the mutation executes immediately. The notification is either a brief floating banner in the settlement bar or console log. There is **no universal undo stack (`Ctrl+Z`)**.

### 6.2 Target Architecture for Phase 4:
- Create `ToastContext` / `useToast` with non-blocking bottom-right (desktop) / bottom-sheet (mobile) toasts.
- Toast structure:
  - Message: e.g., "Gasto de Farmacia $185.000 registrado" or "Evento 'Laboratorio Clínico' eliminado".
  - Action button: "Deshacer" (`Ctrl+Z`).
  - Auto-dismiss timer: 5000ms.
- Global keyboard listener for `Ctrl+Z` / `Cmd+Z` that pops the latest undo mutation from history.

---

## 7. Master Phased Refactoring Roadmap (Phases 1-4)

### Phase 1: The Forensic Purge (Visual Clutter & Noise Elimination)
- [ ] **CSS & Tailwind Config**:
  - Purge `shadow-xl`, `shadow-2xl`, `shadow-lg`, `shadow-md`, and custom `shadow-2xs` from all components.
  - Restrict shadow palette to standard subtle borders and `shadow-xs` / `shadow-subtle`.
  - Purge all `bg-gradient-*` classes across the entire codebase (specifically `ArrivalTrackingCard.tsx`).
- [ ] **DOM & Container Flattening**:
  - Flatten nested cards in `CompanionTurnSheetModal.tsx`, `SmartItineraryModal.tsx`, `ArrivalTrackingCard.tsx`, and `NewPatientModal.tsx`.
  - Replace heavy container borders with 1px hairline dividers (`border-zinc-200/60`).
- [ ] **Action Consolidation (Hick-Hyman Law)**:
  - Streamline `CalendarHeader.tsx` actions to <= 4 controls.
  - Streamline `DockedSettlementBar.tsx` buttons to 1 Primary CTA + 2 Secondary CTAs + Overflow menu.

### Phase 2: Token & Typographic Unification
- [ ] **Typographic Scale Normalization**:
  - Replace all `text-[9px]`, `text-[10px]`, `text-[11px]` with monotonic `text-xs` (12px).
  - Enforce standard hierarchy: `text-xs` (12px metadata), `text-sm` (14px body/labels), `text-base` (16px headers/cards), `text-xl` (20px top titles/totals).
- [ ] **Data Formatting Invariants**:
  - Ensure all currency figures, timestamps, dates, flight codes, and step counters use `tabular-nums font-mono`.
- [ ] **Surface Palette Allow-List**:
  - Strict palette: `bg-white` (surfaces), `bg-zinc-50` (subtle rows), `bg-zinc-100` (canvases/badges), `bg-zinc-900` / `bg-zinc-950` (primary dark buttons/text).

### Phase 3: <= 2 Click Workflows & Inline Editing
- [ ] **Inline Event Status Progression**:
  - Refactor `EventCard.tsx` status pills to allow seamless 1-click status transitions without layout shift.
- [ ] **Inline Editing in Drawers & Ledgers**:
  - Add quick inline edit mode in `EventDetailDrawer.tsx` and `SettlementKpiCards.tsx`.
- [ ] **Modal Depth Reduction**:
  - Guarantee maximum modal depth = 1 (no modal opened from inside another modal).
  - Open `WelcomeOrientationModal` directly from the navigation bar or drawer rather than nesting inside `ArrivalTrackingCard`.

### Phase 4: Micro-Interactions, Dual Timezone & Optimistic Resilience
- [ ] **Dual-Timezone Status Indicator**:
  - Implement `DualTimezoneChip` component showing synchronized `COT (Medellín, UTC-5)` and `AST (Caribe, UTC-4)` live clocks.
  - Display in `CalendarHeader.tsx` and `ArrivalTrackingCard.tsx`.
- [ ] **Universal Toast Provider with Undo Stack (`Ctrl+Z`)**:
  - Create `presentation/state/ToastContext.tsx` with non-blocking toast notifications and 1-click / `Ctrl+Z` "Deshacer" capability.
  - Wire undo handlers for: `logFastExpense`, `deleteEvent`, `rescheduleEvent`, `createEvent`.
- [ ] **Tactile Kinetic Transitions**:
  - Add `active:scale-98 transition-all duration-150` on all interactive buttons, pills, and cards.

---

## 8. Summary of Components to Refactor

| Component Path | Current Issues | Target Minimalist Refactoring |
|:---|:---|:---|
| `src/App.tsx` | Multiple modal registrations at root | Wrap with `ToastProvider`, clean DOM hierarchy |
| `src/index.css` | Extra variables, missing strict allow-list | Ensure WCAG AAA contrast, monotonic fonts, clean scrollbars |
| `src/presentation/components/calendar/CalendarHeader.tsx` | 6 competing action buttons | Consolidate to View Tabs + `+ Nuevo Evento` + `Itinerario` + Overflow `...` |
| `src/presentation/components/calendar/MonthView.tsx` | `shadow-xl` on popover, `text-[11px]` | Flatten popover, unify to `text-xs font-mono tabular-nums` |
| `src/presentation/components/calendar/WeekView.tsx` | Raw `GMT-5` header, heavy shadows on drag | Add Dual-Timezone chip, replace shadows with clean focus ring |
| `src/presentation/components/calendar/DayView.tsx` | Heavy container banners, non-standard font sizes | Flatten header banner, enforce monotonic typography |
| `src/presentation/components/calendar/AgendaView.tsx` | Card borders inside cards | Flatten chronological list with hairline dividers |
| `src/presentation/components/calendar/EventCard.tsx` | Proliferated `shadow-2xs`, `shadow-md`, `shadow-lg` | Purge all shadows; use hairline 1px border & clean status pills |
| `src/presentation/components/settlement/DockedSettlementBar.tsx` | 13 action buttons, custom box shadow, duplicate CTAs | Consolidate to 1 Primary CTA + 2 Secondary + 5 fast presets + Overflow menu |
| `src/presentation/components/settlement/SettlementKpiCards.tsx` | Colored card borders and background fills | Flatten into monochrome cards with subtle border dividers |
| `src/presentation/components/logistics/ArrivalTrackingCard.tsx` | Dark linear gradient, nested cards | Replace with flat `bg-zinc-950` header, dual timezone display, clean 3-col grid |
| `src/presentation/components/companion/CompanionTurnSheetModal.tsx` | 6 nested container boxes, `shadow-2xs` | Flatten into border-divided rows (`divide-y divide-zinc-200`) |
| `src/presentation/components/modals/NewPatientModal.tsx` | `shadow-xl`, complex advanced accordion | Clean modal with autofocus name, 1-click fast create |
| `src/presentation/components/modals/SmartItineraryModal.tsx` | `shadow-xl`, `shadow-md`, nested cards | Streamline into compact preset list with 1-click trigger |
| `src/presentation/components/navigation/FloatingActionButton.tsx` | `shadow-2xl` | Replace with `shadow-sm ring-1 ring-white/10` |
| `src/presentation/components/navigation/MobileBottomNav.tsx` | Custom shadow | Clean hairline border-t with safe-area padding |
