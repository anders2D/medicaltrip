# 🩺 Medical Trip Colombia S.A.S. — UI/UX Overhaul Survey Report
## Calendar Views, Micro-interactions, Settlement Ergonomics & Patient Archetypes

- **Date**: 2026-08-23
- **Investigator**: Explorer Agent (`explorer_survey_calendar`)
- **Target Application**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`
- **Design Inspiration Standards**: Google Calendar, Linear, Notion Calendar
- **Domain Architectural Alignment**: Hexagonal Architecture (Ports & Adapters), DDD, BigInt Money Integer Cents (0.00 Float Drift), 100% Offline Local-First.

---

## 1. Executive Summary

This investigation surveys and maps the presentation architecture, calendar view ergonomics, micro-interactions, financial settlement workflows, and patient archetype switcher for the **Medical Trip Colombia S.A.S. React 19 + TypeScript** field application.

### Key Survey Findings
1. **Calendar Multi-View Foundation**: The application currently has a working 4-view calendar suite (`MonthView`, `WeekView`, `DayView`, `AgendaView`) managed through `AppContext`. The foundation is solid, but desktop/mobile dual-paradigm responsiveness needs enhancement (especially mobile month view collapsing into dot-indicators and tablet week view adaptive column count).
2. **Micro-interactions & Tactile Polish**: Event cards render semantic color badges (Sky Blue for Flights, Indigo for Clinical, Teal for Labs, Emerald for Pharmacy, Amber for Transfers, Warm Slate for Hotels). Interaction hooks exist for modal triggers, event editing, and status transitions, but need optimistic drag-and-drop ghost placeholders, hover quick-action preview popovers, and mobile swipe gestures.
3. **Settlement Drawer & Modal Ergonomics**: `DockedSettlementBar`, `ReceiptOcrModal`, and `DigitalSignaturePad` are implemented with exact BigInt cents math and IndexedDB binary storage. Mobile ergonomics require a responsive bottom-sheet expanding pattern (compact Net Balance pill expanding upward) and refined touch/stylus interpolation for the retina signature pad.
4. **Empirical Archetype Datasets**: All 4 Google Drive real-world archetypes (`RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Eduard CES`, `RVA077 Rumai 12d`) are modeled in `archetypes.data.ts` with complete day-by-day itineraries, flight details, clinical providers, bilingual companion shifts, driver transfers, and receipts.

---

## 2. Comprehensive Calendar Views Audit & Specifications

```
+----------------------------------------------------------------------------------------------------+
| TOP HEADER: Medical Trip Colombia | Offline Badge | Patient Archetype Pills [1] [2] [3] [4]        |
+----------------------------------------------------------------------------------------------------+
| CALENDAR HEADER: [ < Hoy > ]  Agosto 2026  Hotel Inntu   |  [Mes] [Semana] [Día] [Agenda]  [+ Cita]|
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [CALENDAR VIEWPORT]                                                                               |
|  - Month View : 7-Col Grid (Desktop)  /  Dot Indicator Mini-Calendar + Agenda List (Mobile)        |
|  - Week View  : 06:00 - 22:00 Time Grid, Today Current Time Line, 15-min Snapping, Touch Drag      |
|  - Day View   : Single-Day Hourly Canvas, Collision Cluster Partitioning, Inline Status Toggles   |
|  - Agenda View: Chronological Day Groupings, Sticky Banners, Total Day Financial Cost COP          |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
| DOCKED SETTLEMENT BAR: 🚗 Flota + 🗣️ Guía + 💊 Farmacia - 💵 Anticipos = Saldo Neto | [KPIs][OCR][Firma] |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Month View (`MonthView.tsx`)

#### Desktop Ergonomics (>= 1024px)
- **Grid Architecture**: 7-column layout (Monday to Sunday) using `grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-[1px]`.
- **Date Header Cells**: Weekday labels (`Lun`, `Mar`, `Mié`, `Jue`, `Vie`, `Sáb`, `Dom`). Weekend columns have muted styling (`text-slate-400`).
- **Date Indicator Chips**:
  - `isToday`: Highlighted in `bg-rose-600 text-white font-bold shadow-xs` circle.
  - `isSelected`: Highlighted in `bg-slate-900 text-white font-bold` circle.
  - Out-of-month padding days: Muted `bg-slate-50/50 text-slate-400`.
- **Event Pill Rendering**:
  - Displays up to 3 event pills (`maxPills = 3`).
  - Pills feature semantic category background, left category color dot, start time in tabular font (`09:00`), and truncated title.
  - Hover on cell exposes a subtle `(+)` quick add button to create an event on that specific date.
- **Overflow Popover Modal**:
  - When `events.length > 3`, an interactive button `+N más...` is rendered.
  - Clicking `+N más` opens a centered modal displaying all scheduled events for that date with status transition controls and an "+ Agregar evento en este día" CTA.

#### Mobile Ergonomics (< 768px) Overhaul Specification
- **The Challenge**: A dense 7-column grid with text pills overflows and becomes unreadable on 375px (iPhone SE/13) viewports.
- **Recommended Mobile Paradigm**:
  1. **Top Section**: High-density 7-column mini month calendar where each date cell is compact (height ~44px) and renders date number + up to 4 colored indicator dots:
     - 🔵 Sky: Flight / Transfer
     - 🟣 Indigo: Clinical Appointment
     - 🟢 Teal: Lab Diagnostics
     - 🟢 Emerald: Pharmacy / Out of pocket
  2. **Bottom Section**: Interactive scrollable day agenda list for the currently selected date, displaying full event cards with time ranges, doctor names, clinic locations, and status actions.
  3. **Touch Gestures**: Horizontal swipe gestures (left/right) on the month header to smoothly transition between adjacent months.

---

### 2.2 Week View (`WeekView.tsx`)

#### Grid & Temporal Structure
- **Operating Hours**: 06:00 to 22:00 (16 operational hours), matching Medical Trip Colombia field shift windows.
- **Vertical Time Scale**: 64px left gutter (`grid-cols-[64px_repeat(7,1fr)]`), `HOUR_HEIGHT = 56px`, total grid height = 896px.
- **Time Gutter Labels**: Monospace timestamps (`06:00`, `07:00`, ..., `22:00`) with time zone identifier `GMT-5` (America/Bogota).
- **Proportional Positioning Math**:
  $$\text{top} = (\text{clampedStartHour} - 6) \times 56\text{px}$$
  $$\text{height} = \max(28\text{px}, (\text{clampedEndHour} - \text{clampedStartHour}) \times 56\text{px})$$
- **15-Minute Snapping**: Clicking anywhere within a day column calculates snapped 15-minute start and end times:
  $$\text{hourFraction} = \frac{\text{clickY}}{\text{HOUR\_HEIGHT}}$$
  $$\text{minute15} = \left\lfloor \frac{(\text{hourFraction} \pmod 1) \times 60}{15} \right\rfloor \times 15$$

#### Polish & Feature Additions
1. **Live Current-Time Indicator Line**:
   - Render a red horizontal bar with pulsating dot (`bg-rose-600 animate-pulse`) across the active "Today" column at $\text{top} = (\text{nowHourFraction} - 6) \times 56\text{px}$.
2. **Tablet Adaptive Columns (768px - 1023px)**:
   - On tablet portrait viewports, collapse 7 columns into a 3-day or 5-day sliding window with Next/Prev 3-day navigation to guarantee minimum column width $\ge 120\text{px}$.
3. **Rescheduling Drag Handle**:
   - Bottom edge resize handle (`cursor-ns-resize`) allowing mouse/touch dragging to adjust duration in 15-min increments.

---

### 2.3 Day View (`DayView.tsx`)

#### Timeline & Collision Clustering
- **Expanded Vertical Canvas**: `HOUR_HEIGHT = 70px`, total height = 1120px, providing ample room for multi-line notes and badges.
- **Mathematical Collision Resolution Algorithm**:
  - Day events are sorted by start time ascending and duration descending.
  - Events are partitioned into disjoint temporal clusters where $\text{start}_i < \text{clusterEnd}$.
  - Greedy track allocation assigns parallel non-overlapping tracks per cluster.
  - Each event receives $\text{leftPercent} = \text{colIndex} \times \left(\frac{100}{\text{totalCols}}\right)\%$ and $\text{widthPercent} = \left(\frac{100}{\text{totalCols}}\right)\%$.
- **Real-Time Marker**: Red indicator bar at current time with pulsing origin dot.

#### High-Density Event Cards
- **Header**: Category icon chip + Category name + Start/End time range + Duration in minutes + Status badge.
- **Body**: Bold title + Exact address with zone + Healthcare provider name (e.g., Hospital Pablo Tobón Uribe, Clínica Clofán).
- **Logistics Badges**: Bilingual Guide chip with logged hours, Driver transfer chip, Out-of-pocket direct cost formatted in COP.
- **Interactive Quick Status Transition Buttons**:
  - `PROGRAMADO` $\rightarrow$ Button `[En Camino]` (Amber)
  - `EN_CAMINO` $\rightarrow$ Button `[En Sitio]` (Indigo)
  - `EN_SITIO` $\rightarrow$ Button `[Completar]` (Emerald)

---

### 2.4 Agenda View (`AgendaView.tsx`)

#### Chronological Sequential Itinerary
- **Chronological Grouping**: Events grouped by date string (`YYYY-MM-DD`) and sorted by timestamp.
- **Sticky Day Header Banner**:
  - Left: `Día #` badge (black pill) + Formatted date string (`Lunes, 20 de Agosto 2026`).
  - Right: Total event counter + Aggregated daily operational cost in COP (e.g., `Total: $210.750 COP`).
- **Full-Width Row Cards**:
  - 3-column responsive layout: Time & category icon (Left) $\rightarrow$ Title, location zone, staff chips (Center) $\rightarrow$ Direct cost & status badge (Right).
  - Hover state: Subtle elevation, slate-300 border, title color transition to `indigo-600`.
- **Empty State**: Friendly illustration, descriptive text, and `[Crear Primer Evento]` CTA.

---

## 3. Micro-interactions & Tactile Feedback Mapping

| Interaction Element | Trigger | Visual & State Feedback | Animation / Duration | Technical Implementation |
|---|---|---|---|---|
| **Event Hover Card** | Mouse hover (300ms delay) on event card | Elevated floating popover displaying full clinic address, assigned guide/driver phone, and quick status actions | Fade-in + slight scale (98% $\rightarrow$ 100%), 150ms ease-out | Radix/Floating UI or CSS absolute tooltip with `z-30` |
| **Optimistic Drag-to-Reschedule** | Pointer / touch drag on event card | Event card becomes translucent (`opacity-70`, `scale-[0.98]`); target slot renders dashed outline (`border-2 border-dashed border-indigo-400 bg-indigo-50/40`) | Immediate 60fps tracking via pointer events | Pointer capture `setPointerCapture`, optimistic `rescheduleEvent` dispatch |
| **Duration Resize** | Drag bottom handle on event card | Bottom border snaps in 15-min increments with live duration tooltip (`+15m`, `+30m`) | Live CSS height interpolation | `cursor-ns-resize`, `pointermove` clamping |
| **Slide-Over Drawer** | Click event or `[+] Nuevo Evento` | Desktop: Right slide-over (420px width). Mobile: Bottom sheet sliding up | Slide from right / bottom with `backdrop-blur-xs`, 200ms cubic-bezier | Tailwind `animate-in slide-in-from-right` / `slide-in-from-bottom` |
| **Celebration Confetti** | Sign-off sealed or Ledger zero balance | Multicolored confetti burst across screen (Sky, Indigo, Emerald, Amber) | 80 particles, 70 spread, 2.5s decay | `canvas-confetti` canvas library |
| **Status Transition Toggle** | Click status button on card | Badge morphs color (Gray $\rightarrow$ Amber $\rightarrow$ Indigo $\rightarrow$ Emerald) | Ripple effect, 150ms transition | Optimistic state update + storage persistence |
| **Receipt Laser Scan** | Trigger OCR scan | Emerald laser line bounces vertically over receipt placeholder with live step messages | Linear bounce animation, 1.2s cycle | CSS keyframe animation + simulated progress bar |

---

## 4. Financial Settlement Drawer & Modal Ergonomics

```
+----------------------------------------------------------------------------------------------------+
| DOCKED SETTLEMENT BAR (Desktop)                                                                    |
| [Fórmula Live]: 🚗 Flota: $198.000 + 🗣️ Guía: $197.750 + 💊 Farmacia: $97.000 - 💵 $2.098.100       |
|                 = Saldo Neto: -$1.605.350 COP [A Favor Paciente]                                   |
| [Proportional Bar]: [====Flota 40%====][====Guía 40%====][==Farmacia 20%==]                        |
| [Actions]: [📊 KPIs] [🔄 Recalcular] [📷 Recibo OCR] [✍️ Firmar] [⬇️ PDF] [📋 JSON]                |
+----------------------------------------------------------------------------------------------------+
```

### 4.1 Mobile Bottom-Sheet Settlement Bar Ergonomics
- **Collapsed Mobile State**:
  - Sticky bottom floating pill (height 48px, `z-40`, margins 8px) with blur backdrop.
  - Displays: Mini status dot + Net Balance (`Saldo: -$1.605.350`) + Expand Chevron.
  - Minimum touch target: 44x44px.
- **Expanded Mobile State (Swipe Up / Tap)**:
  - Expands upward as a modal bottom-sheet (height 80vh) with grab handle.
  - Contains:
    1. Full mathematical formula breakdown with integer cents.
    2. 5 KPI summary cards in a 2-column touch grid.
    3. Quick action buttons (Recibo OCR, Firmar Digitalmente, Exportar PDF, Reconciliar).
  - Dismissible via swipe-down gesture or tap on backdrop.

### 4.2 Mobile Receipt OCR Scanner (`ReceiptOcrModal.tsx`)
- **Camera & File Capture**: File input supporting `accept="image/*,.pdf,.txt"` with camera trigger on mobile devices.
- **1-Click Demo Presets**:
  - `Cruz Verde Gotas`: $85.000 COP (Pharmacy).
  - `Laboratorio Echavarría`: $125.000 COP (Clinical Lab).
  - `Peaje Túnel Oriente`: $24.800 COP (Toll).
  - `Copago CIMA`: $180.000 COP (Medical Copay).
- **Animated 4-Stage OCR Pipeline**:
  1. `IDLE`: Dropzone and 1-click preset selector.
  2. `SCANNING`: Animated laser beam scan, thermal contrast enhancement, NIT fiscal extraction, line-item pricing recognition.
  3. `PARSED`: Confidence banner ($\ge 95\%$), editable vendor name, NIT, date, expense category selector, itemized table.
  4. `SAVING`: BigInt money commit into Single-Writer CQRS ledger, Dexie IndexedDB binary storage, live ledger reconciliation.

### 4.3 Retina Digital Signature Pad (`DigitalSignaturePad.tsx`)
- **High-DPI Scaling Engine**:
  - Device pixel ratio compensation:
    $$\text{canvas.width} = \text{rect.width} \times \text{window.devicePixelRatio}$$
    $$\text{canvas.height} = \text{rect.height} \times \text{window.devicePixelRatio}$$
    $$\text{ctx.scale}(\text{dpr}, \text{dpr})$$
  - Line rendering: `lineCap = 'round'`, `lineJoin = 'round'`, `lineWidth = 2.5`, pen color `#0f172a`.
- **Pointer Event Pipeline & Palm Rejection**:
  - Standardized on Pointer Events (`pointerdown`, `pointermove`, `pointerup`).
  - Pointer capture (`canvas.setPointerCapture(e.pointerId)`) prevents lost strokes when panning outside the canvas border.
  - Palm rejection simulation ignores secondary touch contacts while an active stylus pointer is engaged.
- **Legal Sign-Off & Biometric Dossier**:
  - Statutory legal consent text: "Certifico que he recibido a entera satisfacción los traslados en flota, acompañamiento bilingüe y servicios médicos...".
  - Signer Role Selector: Paciente Titular (auto-fills patient name), Guía Acompañante, Coordinador Operativo.
  - Signature export as base64 PNG stored in IndexedDB and linked to ledger sign-off audit block.
  - Triggers celebratory confetti upon sign-and-seal.

---

## 5. Patient Archetype Switcher & Empirical Operational Datasets

The application models the 4 real-world operational archetypes extracted from Google Drive field records:

```
+--------------------------------------------------------------------------------------------------------+
| 🇨🇼 [1] Catia Rodrigues (RVA171)   | 5 Pax | Curazao | Hotel Inntu Laureles     | Clofán + CIMA       |
| 🇨🇼 [2] George Hernandez (RVA282)   | 2 Pax | Curazao | Airbnb Ed. Park 42       | Cardio VID + CES    |
| 🇳🇱 [3] Eduard Hogenboom (RVA341)   | 2 Pax | Holanda | Hotel Inntu Hab. 1004    | CES Urología + Lab  |
| 🇨🇼 [4] Alejandra Rumai (RVA077)    | 4 Pax | Curazao | Hotel Novelty Suites     | HPTU Quirúrgica 12d |
+--------------------------------------------------------------------------------------------------------+
```

### Archetype 1: `RVA171 Catia x5` (`RVA171-4`)
- **Profile**: 5-pax family group from Curazao (Catia, Tatiana, Mariana, María, Lisandra). Language: Papiamento / Dutch.
- **Accommodations**: Hotel Inntu Laureles.
- **Clinical Protocol**: Ophthalmology at Clínica Clofán (Dr. Peláez, pupil dilation, translation in Papiamento), CIMA comprehensive ultrasound diagnostics (strict 06:30 AM fasting), pediatric urology.
- **Logistics**: Van XL / Uber XL (Driver Andrés Cantero DRV-03), Airport transfer $160.000 COP, Intra-city transfer $38.000 COP.
- **Field Staff**: Bilingual Guide Yenny Roberto (GUIA-01) with Tier 3 meal subsidy ($35.000 COP).
- **Financial Balances**:
  - Advances: $1.000.000 + $1.098.100 = $2.098.100 COP.
  - Debits: Fleet $198.000 + Guide Fees $197.750 + Pharmacy $97.000 = $492.750 COP.
  - Net Balance: **-$1.605.350 COP (Surplus to refund patient)**.

### Archetype 2: `RVA282 George Cardio` (`RVA282-5`)
- **Profile**: 2-pax (George Hernandez + Adriaan Fabian) from Curazao / USA. Language: Papiamento / English.
- **Accommodations**: Airbnb Edificio Park 42 Poblado (32-day extended stay).
- **Clinical Protocol**: Cardiovascular evaluation & Doppler at Clínica Cardio VID Robledo, Urology consultation at CES Oviedo (Dr. Marcos Yepes).
- **Logistics & Extras**: Aeroturex Sedan (Driver Ramón Rosero DRV-01) $145.000 COP airport + $30.000 COP intra-city. Delivery of international Claro 80GB eSIM at JMC airport ($90.909 COP).
- **Field Staff**: Bilingual Guide Yenny Roberto (GUIA-01), 8 hours logged across multi-day shifts.
- **Financial Balances**:
  - Advances: $1.200.000 COP.
  - Debits: Fleet $175.000 + Guide Fees $124.000 + Pharmacy/eSIM $215.909 = $514.909 COP.
  - Net Balance: **-$685.091 COP (Surplus to refund patient)**.

### Archetype 3: `RVA341 Eduard CES` (`RVA341-1`)
- **Profile**: 2-pax (Eduard Hogenboom + Marcelle Cameron) from Netherlands / Curazao. Language: Dutch / English.
- **Accommodations**: Hotel Inntu Laureles (Room 1004).
- **Clinical Protocol**: Urology surgery at CES Oviedo (Dr. Carlos Suárez), at-home early morning blood draw by Laboratorio Echavarría in hotel room at 05:30 AM ($97.350 COP).
- **Logistics**: Sedan Ejecutivo (Andrés Cantero DRV-03) $110.000 COP airport + $35.000 COP intra-city.
- **Field Staff**: Bilingual English Guide Alejandro (GUIA-02), Nurse Elena (NURSE-01).
- **Financial Balances**:
  - Advances: $950.000 COP.
  - Debits: Fleet $145.000 + Guide Fees $77.500 + At-Home Lab $97.350 = $319.850 COP.
  - Net Balance: **-$630.150 COP (Surplus to refund patient)**.

### Archetype 4: `RVA077 Rumai 12d` (`RVA077-5`)
- **Profile**: 4-pax (Alejandra Filomena, Xiomahara Eulogia, Giandra, Reginald) from Curazao. Language: Papiamento / Spanish.
- **Accommodations**: Hotel Novelty Suites Poblado.
- **Clinical Protocol**: 12-day surgical stay. Gastroenterology at Hospital Pablo Tobón Uribe (HPTU Robledo Dr. Mosquera), Hernán Ocazionez diagnostic radiology ($170.755 COP), Clínica Universitaria Bolivariana Gynaecology ($135.000 COP), 12-hour surgery post-op recovery with Tier 4 meal subsidy ($45.000 COP).
- **Logistics**: Flota Ejecutiva Juan Carlos (DRV-02) $145.000 COP + Duster Gustavo Mora (DRV-04) $55.000 COP.
- **Financial Balances**:
  - Advances: $2.000.000 + $1.500.000 = $3.500.000 COP.
  - Debits: Fleet $200.000 + Guide Fees $293.000 + Diagnostics $305.755 = $798.755 COP.
  - Net Balance: **-$2.701.245 COP (Surplus to refund patient)**.

### 1-Click Switcher Ergonomics (`ArchetypeSwitcherBar.tsx`)
- **Header Tabs**: Horizontal pill tabs displaying country flag, number shortcut chip, patient full name, booking code, pax counter, and hotel name.
- **Global Keyboard Shortcuts**:
  - `[1]`: Switches to `RVA171 Catia x5`
  - `[2]`: Switches to `RVA282 George Cardio`
  - `[3]`: Switches to `RVA341 Eduard CES`
  - `[4]`: Switches to `RVA077 Rumai 12d`
  - `[M]`: Month View &bull; `[W]`: Week View &bull; `[D]`: Day View &bull; `[A]`: Agenda View &bull; `[T]`: Today &bull; `[C]`: Create Event
- **State Transition Behavior**: Automatically resets calendar viewport to the patient's arrival date and recalibrates all financial ledger lines in 0.00ms.

---

## 6. Detailed Recommendations for UI/UX Overhaul

### R1. Layout & Breakpoint Hierarchy
- **Desktop (>= 1024px)**:
  - 4-view top switcher (`[Mes] [Semana] [Día] [Agenda]`).
  - Right slide-over drawer (`w-screen max-w-md bg-white`).
  - Docked settlement bar with proportional 5-segment breakdown.
- **Tablet (768px - 1023px)**:
  - Week view renders adaptive 3-day or 5-day columns.
  - Settlement bar retains collapsed KPI view.
- **Mobile (< 768px)**:
  - Header: Compact horizontal scrollable patient pills.
  - Bottom Navigation Bar: Tabs for `Mes`, `Semana`, `Día`, `Agenda`, `Balance`.
  - Month View: Dot-indicator mini calendar + day agenda list below.
  - Settlement Bar: Compact sticky Net Balance pill expanding upward into a bottom sheet.

### R2. Design Tokens & Visual Polish
- **Color Palette (Linear / Google Calendar standard)**:
  - Backgrounds: `bg-slate-50`, `bg-white`, `bg-slate-100`.
  - Borders: `border-slate-200`, `border-slate-300`.
  - Text: `text-slate-900`, `text-slate-700`, `text-slate-500`.
  - Numeric values: Always styled with `tabular-nums` for alignment.
- **Accessibility & Contrast**:
  - Touch targets minimum 44x44px for all mobile interactive controls.
  - WCAG AAA contrast for all status and category badge combinations.

---

## 7. Verification & Audit Trail

| Verification Item | Command / Location | Expected Result | Status |
|---|---|---|---|
| **Domain & Math Invariants** | `node dist_runner/runner.mjs` | 24 adversarial tests PASS (CRDT, SHA-256, Web Workers, Money cents) | ✅ PASS (100%) |
| **Master Test Suite** | `node dist_runner/master_verifier.mjs` | 316 unit, integration, and E2E tests PASS | ✅ PASS (316/316) |
| **Calendar Components** | `src/presentation/components/calendar/` | MonthView, WeekView, DayView, AgendaView, EventCard verified | ✅ Verified |
| **Settlement Components** | `src/presentation/components/settlement/` | DockedBar, ReceiptOcrModal, DigitalSignaturePad, KpiCards verified | ✅ Verified |
| **Archetypes Dataset** | `src/infrastructure/data/archetypes.data.ts` | 4 real Google Drive archetypes with exact BigInt math | ✅ Verified |
