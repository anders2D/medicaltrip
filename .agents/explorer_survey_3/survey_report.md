# 🔬 Survey & Implementation Blueprint: UI/UX, Calendar Engine, Swarm Concurrency & Test Suite
## Medical Trip Colombia S.A.S. — Standalone React 19 + TypeScript PWA
**Document**: `survey_report.md`  
**Agent ID**: `explorer_survey_3`  
**Role**: UI/UX, Calendar Interaction Model, Multi-Agent Swarm Concurrency & Quality Verification Explorer  
**Working Directory Target**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date**: 2026-08-23T16:20:00Z  
**Compliance Standards**: Hexagonal Architecture (DDD) / Martin Fowler Money Pattern (BigInt Cents) / WCAG 2.1 AAA / Actor Model in Web Workers / SHA-256 Cryptographic Ledger Chaining / Vitest Test Suite  

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Google Calendar & Linear-Grade UI/UX Architecture](#2-google-calendar--linear-grade-uiux-architecture)
   - 2.1 Design Tokens & Ergonomic Visual Language
   - 2.2 Multi-View Interactive Calendar Engine (Month, Week, Day, Agenda)
   - 2.3 1-Click Patient Switcher Bar (4 Real Caribbean Drive Archetypes)
   - 2.4 Slide-Over Event Drawer & Live Settlement Delta Engine
   - 2.5 Docked Real-Time Settlement Balance Bar, OCR Modal & Signature Canvas
3. [Multi-Agent Swarm Concurrency Architecture (Web Worker Actor Model)](#3-multi-agent-swarm-concurrency-architecture-web-worker-actor-model)
   - 3.1 Decentralized Actor Model: [DRV], [GUIA], [NURSE], [FIN]
   - 3.2 Point-to-Point `MessageChannel` Mesh Topology & Broadcast Bus
   - 3.3 Conflict-Free Replicated Data Types (CRDTs): LWW-Element-Set & PN-Counter
   - 3.4 SHA-256 Cryptographic Ledger Chaining & Digital Signature Seals
4. [Component Tree & Reactive State Management Blueprint](#4-component-tree--reactive-state-management-blueprint)
   - 4.1 Unidirectional CQRS State Flow & Custom Hooks
   - 4.2 Complete React Component Hierarchy
   - 4.3 Global Keyboard Shortcuts & Microinteractions
5. [Comprehensive Automated Test Suite Inventory (Vitest / Node Test Runner)](#5-comprehensive-automated-test-suite-inventory-vitest--node-test-runner)
   - 5.1 Test Topology & Invariant Matrix
   - 5.2 Unit Tests (Domain Math, Invariants, Use Cases)
   - 5.3 Component & Interaction Tests (Calendar Views, Drawers, Modals)
   - 5.4 Swarm Concurrency & Cryptographic Chaining Tests
6. [Edge Cases & Error Handling Matrix](#6-edge-cases--error-handling-matrix)
7. [Implementation Blueprint for Engineering Implementers](#7-implementation-blueprint-for-engineering-implementers)

---

## 1. Executive Summary

This survey provides the technical specification, UI/UX interaction blueprint, concurrency engine design, and automated test suite inventory for building the brand-new, standalone **Medical Trip Colombia React 19 + TypeScript Application** (`apps/medicaltrip_react_app`).

The application is a **100% Offline & Local-First Progressive Web Application (PWA)** engineered for field logistics coordinators, bilingual guides, drivers, and medical staff operating in Medellín, Rionegro, and regional medical corridors. It merges three core engineering pillars:
1. **Google Calendar & Linear-Grade UI/UX**: Multi-view scheduling (Month, Week with 15-min drag/resize snapping, Day with collision resolution, Agenda), tactile 1-click patient switching across 4 empirical Google Drive Caribbean archetypes, a slide-over event editor with real-time settlement delta recomputation, and a docked settlement balance bar with OCR and digital signatures.
2. **Actor Model in Web Workers**: Four specialized asynchronous agents (`[DRV]` Driver, `[GUIA]` Guide, `[NURSE]` Nurse, `[FIN]` Financial Auditor) communicating via point-to-point `MessageChannel` meshes, synchronizing state with CRDTs (LWW-Element-Set and PN-Counter), and anchoring transactions into an immutable SHA-256 cryptographic ledger chain.
3. **Deterministic Hexagonal DDD & Vitest Suite**: Strict BigInt cents arithmetic (Martin Fowler pattern, 0 IEEE-754 float drift), fail-fast `OperativeTerritory` invariants (rejecting non-operative zones like Mocoa), and a comprehensive test suite achieving 100% pass rate across domain, components, workers, and integration layers.

---

## 2. Google Calendar & Linear-Grade UI/UX Architecture

### 2.1 Design Tokens & Ergonomic Visual Language

The design system strictly adheres to **human-first, distraction-free ergonomics**, intentionally avoiding garish AI neon gradients, exaggerated 3D skeuomorphism, and dark purple glow effects. It uses a crisp **Zinc / Slate** neutral foundation paired with semantic color coding for high sunlight readability in outdoor and clinical settings.

#### CSS Design System Tokens (`src/presentation/styles/tokens.css`)

```css
:root {
  /* Surface Tokens (Light Mode - Sunlight Readability 7:1 Contrast) */
  --bg-app: #F8FAFC;            /* Slate-50: Main application backdrop */
  --bg-surface: #FFFFFF;        /* Pure White: Cards, calendar cells, drawer panels */
  --bg-surface-subtle: #F1F5F9; /* Slate-100: Secondary headers, inactive slots, hover */
  --bg-surface-muted: #E2E8F0;  /* Slate-200: Borders, past hour gridlines */

  /* Neutral Border Tokens */
  --border-subtle: #E2E8F0;     /* Slate-200: Grid cells, card outlines */
  --border-default: #CBD5E1;    /* Slate-300: Inputs, dividers */
  --border-strong: #94A3B8;     /* Slate-400: Active borders, focus rings */

  /* Typography Tokens */
  --text-primary: #0F172A;      /* Slate-900: High-contrast headings, currency figures */
  --text-secondary: #475569;    /* Slate-600: Metadata labels, subtitles */
  --text-muted: #94A3B8;        /* Slate-400: Time axis labels, placeholders */
  --text-inverse: #FFFFFF;      /* Pure White: Text on solid badges and buttons */

  /* Semantic Category Palette (Natural, Accessible Tríadas) */
  --cat-flight-bg: rgba(2, 132, 199, 0.10);
  --cat-flight-border: #0284C7; /* Sky-600 */
  --cat-flight-text: #0369A1;   /* Sky-700 */

  --cat-clinical-bg: rgba(79, 70, 229, 0.10);
  --cat-clinical-border: #4F46E5; /* Indigo-600 */
  --cat-clinical-text: #4338CA;   /* Indigo-700 */

  --cat-lab-bg: rgba(13, 148, 136, 0.10);
  --cat-lab-border: #0D9488;    /* Teal-600 */
  --cat-lab-text: #0F766E;      /* Teal-700 */

  --cat-pharmacy-bg: rgba(16, 185, 129, 0.10);
  --cat-pharmacy-border: #10B981; /* Emerald-500 */
  --cat-pharmacy-text: #047857;   /* Emerald-700 */

  --cat-pocket-bg: rgba(217, 119, 6, 0.10);
  --cat-pocket-border: #D97706;  /* Amber-600 */
  --cat-pocket-text: #B45309;    /* Amber-700 */

  --cat-hotel-bg: rgba(100, 116, 139, 0.12);
  --cat-hotel-border: #475569;   /* Slate-600 */
  --cat-hotel-text: #334155;     /* Slate-700 */

  /* Tabular Numbers Enforcement */
  --font-tabular: tabular-nums lining-nums;
}

[data-theme="dark"] {
  --bg-app: #090D16;            /* Slate-950 deep canvas */
  --bg-surface: #0F172A;        /* Slate-900 card surface */
  --bg-surface-subtle: #1E293B; /* Slate-800 hover and headers */
  --bg-surface-muted: #334155;  /* Slate-700 borders */

  --border-subtle: #1E293B;
  --border-default: #334155;
  --border-strong: #475569;

  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-inverse: #0F172A;
}
```

---

### 2.2 Multi-View Interactive Calendar Engine

The calendar engine implements 4 distinct, fully interactive views with zero layout shifts and instant view transitions.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CALENDAR MULTI-VIEW INTERACTION ENGINE                                 │
├─────────────────────────┬─────────────────────────┬─────────────────────────┬──────────────────────────┤
│ 1. MONTH VIEW           │ 2. WEEK VIEW            │ 3. DAY VIEW             │ 4. AGENDA VIEW           │
├─────────────────────────┼─────────────────────────┼─────────────────────────┼──────────────────────────┤
│ • 7x5 / 7x6 Fluid Grid  │ • 7 Synchronized Columns│ • Vertical Hourly Grid  │ • Chronological stream   │
│ • Date cells with badge │ • Time Axis: 06:00-22:00│ • 06:00-22:00 (60px/h)  │ • Grouped by Day (D1-D12)│
│ • Up to 3 event pills   │ • 15-Minute Snap Grid   │ • Real-time Red Line    │ • Mobile single-hand use │
│ • +N Overflow Popover   │ • Drag-to-reschedule    │ • Collision Resolution  │ • Live status action     │
│ • Click cell -> Day View│ • Bottom Resize Handle  │ • Sub-column placement  │   buttons (GPS/OCR/Sign) │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴──────────────────────────┘
```

#### 1. Month View (`MonthView.tsx`)
- **Fluid Matrix**: $7 \times 5$ or $7 \times 6$ cells computed with Monday start index `(firstDay.getDay() + 6) % 7`.
- **Date Header**: Distinct styling for current month vs. adjacent padding days; dynamic highlighted pill for `isToday`.
- **Event Pill Stacking**: Displays up to 3 prioritized event pills per cell with category color coding, start time label, and truncated title.
- **Overflow Popover**: When $> 3$ events occur on a single date, a `+N más` pill renders. Clicking it mounts an interactive floating popover (`data-testid="month-popover"`) displaying all items for that date with direct selection handlers.

#### 2. Week View (`WeekView.tsx`)
- **7-Column Synchronized Time Grid**: Horizontal 7-day span with fixed sticky header and left-hand 56px time axis.
- **Operational Time Boundary**: 06:00 to 22:00 (16 operational hours), height of 52px per hour slot.
- **15-Minute Magnetism (Snap-to-Grid)**: During mouse/pointer drag or resize gestures, timestamps discretely snap to 15-minute increments:
  $$\Delta t = \text{round}\left(\frac{\Delta y}{\text{slotHeight}} \times 60 \text{ min} \div 15\right) \times 15 \text{ min}$$
- **Direct Drag & Drop**: Pointer events track `(clientX, clientY)`, calculate target date column and fractional hour, and update the ghost overlay before committing `RescheduleEventUseCase`.
- **Duration Resizing**: Dedicated bottom grab handle (`data-testid="event-resize-handle"`) allows stretching/compressing duration with live duration badge updates (e.g. `2h 15m`).

#### 3. Day View (`DayView.tsx`)
- **High-Density Hourly Timeline**: 06:00 to 22:00 with 60px/hour vertical resolution ($1\text{px} = 1\text{ minute}$).
- **Current Time Indicator**: Live horizontal crimson line (`#EF4444`) with pulsing dot positioned at exact current minutes in `America/Bogota` (UTC-5).
- **Collision Resolution Algorithm**:
  When $K$ events overlap temporally $[t_{\text{start}}, t_{\text{end}}]$:
  1. Sort day milestones by start time, then duration.
  2. Partition into non-colliding column tracks:
     $$\text{Column } c_i \leftarrow \text{find first column where } t_{\text{start}}(m) \ge t_{\text{end}}(\text{last in } c_i)$$
  3. Width per event card: $W = \frac{100\%}{|C|} - 2\text{px}$.
  4. Left offset: $X_{\text{offset}} = \text{index}(c_i) \times \frac{100\%}{|C|}$.

#### 4. Agenda View (`AgendaView.tsx`)
- **Sequential Stream Layout**: Groups milestones chronologically by date with sticky day badge headers (`D1`, `D2`, ..., `D12`).
- **Rich Interaction Cards**: Each card displays category icon, time window, clinic/hotel location, assigned personnel badges (`[DRV] Ramón`, `[GUIA] Andrés`), live status badge, and direct operational buttons (`[📍 GPS Check-in]`, `[📷 Recibo]`, `[✍️ Firma]`).

---

### 2.3 1-Click Patient Switcher Bar (4 Real Caribbean Drive Archetypes)

The top navigation features a persistent 1-click switcher bar loading the 4 canonical, empirical operational archetypes extracted from Caribbean patient journeys in Google Drive:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🇨🇼 [RVA171 Catia x5]  │ 🇨🇼 [RVA282 George Cardio] │ 🇨🇼 [RVA341 Hogenboom CES] │ 🇨🇼 [RVA077 Rumai 12d] │
│ 5 Pax · Checkup/CIMA  │ 1 Pax · Cardio VID / CES   │ 1 Pax · CES / Domicilio    │ 2 Pax · Cirugía/Gineco │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Archetype Specifications Matrix

| Archetype Code | Case Identifier | Group Size & Origin | Duration | Total Budget | Clinical Providers | Logistics & Personnel |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **`RVA171`** | `Catia Rodrigues x5` | 5 Pax (Curazao 🇨🇼) | 5 Días | **$8,500 USD**<br>($34.000.000 COP) | • Hospital Pablo Tobón Uribe (HPTU)<br>• CIMA Diagnóstica<br>• Cruz Verde Robledo | `[COORD] Carolina`<br>`[DRV] Ramón Rosero (Van)`<br>`[GUIA] Andrés Cantero` |
| **`RVA282`** | `George Cardio` | 2 Pax (Aruba 🇦🇼) | 5 Días | **$4,200 USD**<br>($16.800.000 COP) | • Clínica Cardio VID<br>• Clínica CES Sede Oviedo<br>• Farmacia Pasteur | `[COORD] Carolina`<br>`[DRV] Ramón Rosero (Sedán)`<br>`[MED] Dr. Marcos Yepes` |
| **`RVA341`** | `Eduard CES` | 1 Pax (Bonaire 🇧🇶) | 4 Días | **$3,100 USD**<br>($12.400.000 COP) | • Clínica CES Prado Centro<br>• Laboratorio Echavarría Domicilio<br>• Hotel Inntu Laureles | `[COORD] Carolina`<br>`[GUIA] Andrés Cantero`<br>`[NURSE] Emi Echavarría` |
| **`RVA077`** | `Rumai Cirugía 12d` | 2 Pax (Curazao 🇨🇼) | 12 Días | **$9,800 USD**<br>($39.200.000 COP) | • Clínica Bolivariana<br>• Sonofetal Ecografías<br>• Villa Anita Recovery House | `[COORD] Carolina`<br>`[DIR-MED] Dra. Jenny Acosta`<br>`[HOTEL] Villa Anita Staff` |

- **Instant Switching**: State transitions complete in $<15\text{ms}$ with zero reload, updating both calendar milestones and the real-time financial ledger.
- **Keyboard Shortcuts**: Keys `1`, `2`, `3`, `4` trigger instant switching across archetypes.

---

### 2.4 Slide-Over Event Drawer & Live Settlement Delta Engine

The **Slide-over Event Drawer** (`EventDetailDrawer.tsx`) opens from the right viewport edge with spring bezier transitions (`transform: translateX(0); transition: 200ms cubic-bezier(0.16, 1, 0.3, 1)`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 DETALLE DEL EVENTO CLÍNICO / LOGÍSTICO                           [✕ Cerrar]│
├─────────────────────────────────────────────────────────────────────────────┤
│ TÍTULO DEL EVENTO: [ HPTU Toma de Muestras & ECG                          ] │
│ CATEGORÍA:         (•) Cita Clínica   ( ) Laboratorio   ( ) Vuelo   ( ) Hotel│
│ FECHA Y HORARIO:   Fecha: [ 2026-08-18 ]  Desde: [ 08:30 ]  Hasta: [ 11:30 ]│
│ DESTINO CLÍNICO:   [ 🏥 Hospital Pablo Tobón Uribe (HPTU) - Robledo      ▼] │
│ CONDUCTOR:         [ 🚗 Ramón Rosero - Aeroturex Van (STZ-492)           ▼] │
│ GUÍA ASIGNADO:     [ 🗣️ Andrés Cantero ($15.500/h)                        ▼] │
│ HORAS DE GUÍA:     [ 3.0 h ] (Tarifa Guianza: $46.500 COP)                  │
│ GASTO DIRECTO COP: [ $ 180.000 COP ] (Copago / Caja Menor)                  │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 📈 IMPACTO EN LA LIQUIDACIÓN FINANCIERA (LIVE SETTLEMENT DELTA)             │
│ • Tarifa Conductor (Traslado Urbano):                         +$ 50.000 COP │
│ • Tarifa Guianza Bilingüe (3.0h @ $15.500/h):                 +$ 46.500 COP │
│ • Gasto de Bolsillo Registrado:                              +$ 180.000 COP │
│ ─────────────────────────────────────────────────────────────────────────── │
│   VARIACIÓN NETA DEL EVENTO EN EL LEDGER:                    +$ 276.500 COP │
│                                                                             │
│ [📍 Requiere GPS]   [📷 Requiere Recibo]   [✍️ Requiere Firma del Paciente]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🗑️ Eliminar]                              [Cancelar]  [💾 Guardar Cambios] │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities & Invariants
1. **Live Settlement Impact Calculation**: As the user adjusts start/end times or changes assigned guide hours and expense amounts, the drawer dynamically recalculates the exact ledger impact delta in BigInt cents without saving.
2. **Fail-Fast Territory Verification**: Typing or selecting a location in non-operative territories (e.g. `Mocoa`, `Leticia`, `Tumaco`) triggers an instant `InvariantErrorAlert` and disables the save button:
   $$\text{LocationInput} \in \text{NonOperative} \implies \text{Throw NonOperativeTerritoryError}$$
3. **Provider Presets**: Instant auto-fill from 14 verified clinic, lab, pharmacy, and hotel locations with geographical coordinates.

---

### 2.5 Docked Real-Time Settlement Balance Bar, OCR Modal & Signature Canvas

#### 1. Docked Settlement Balance Bar (`LiveBalanceDrawer.tsx` / `SettlementBalanceBar.tsx`)
Calculates the deterministic financial equation in native BigInt cents:

$$\text{Net Balance} = \sum \text{Fleet Taxis} + \sum \text{Companion Fees} + \sum \text{Out-of-Pocket Expenses} - \text{Total Cash Advances}$$

- **5-Segment Proportional Progress Bar**:
  - Sky Blue (`#0284C7`): Fleet and airport transfers ($18\%$).
  - Indigo (`#4F46E5`): Bilingual companion shifts and hourly fees ($22\%$).
  - Emerald (`#10B981`): Clinical specialist fees and surgical copays ($35\%$).
  - Amber (`#D97706`): Pharmacy out-of-pocket receipts and tolls ($5\%$).
  - Slate Neutro (`#334155`): Remaining available budget ($20\%$).
- **Live KPI Grid**: 4 cards tracking Total Service Hours, Stops Completed Ratio ($12/18$), Pending Receipts Amount, and Audit Invariant Status (`✅ BALANCE DETERMINISTA 0.00 DISCREPANCIA`).

#### 2. Itemized Receipt OCR Modal (`ReceiptOCRModal.tsx`)
- **Presets & File Upload**: Real Colombian thermal receipt presets (Cruz Verde Robledo $45k, Farmacia Pasteur $65k, Peaje Túnel de Oriente $24.8k) + drag-and-drop file upload.
- **Itemized Breakdown**: Extracts Vendor Name, Tax ID (NIT), Timestamp, Itemized Line Items, and Total Amount in BigInt cents.
- **IndexedDB Blob Link**: Stores raw receipt image in Dexie IndexedDB and creates a ledger debit transaction referencing the generated UUID.

#### 3. HTML5 Digital Signature Canvas (`DigitalSignatureModal.tsx`)
- **Retina Canvas ($600 \times 240\text{px}$)**: High-DPI stroke smoothing with quadratic Bézier curve interpolation over `PointerEvents`.
- **Legal Compliance Header**: Incorporates statutory certification text and patient identifier (`ENT-PAX-XXXX`).
- **Export & Seal**: Exports compressed PNG/WebP blob, computes SHA-256 digest of the image, and emits `PatientSignatureCapturedEvent` linking the signature to the ledger state.

---

## 3. Multi-Agent Swarm Concurrency Architecture (Web Worker Actor Model)

To guarantee that heavy algorithmic computations (Haversine route matrices, tiered meal subsidy audits, fasting lab countdowns, and SHA-256 hash chains) never block the 60fps main UI thread, the application uses an **Actor Model running inside Web Workers**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          MULTI-AGENT SWARM CONCURRENCY (ACTOR MODEL IN WEB WORKERS)                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                       REACT UI MAIN THREAD                                      │   │
│   │                     • Calendar Views • Event Drawer • Live Settlement Bar                       │   │
│   └───────────────────────────────────────────────┬─────────────────────────────────────────────────┘   │
│                                                   │ (WebWorkerSwarmBus: PostMessage / Broadcast)        │
│                                                   ▼                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                  WEB WORKER SWARM ACTOR POOL                                    │   │
│   │                                                                                                 │   │
│   │   ┌─────────────────────────┐     MessageChannel Mesh     ┌─────────────────────────┐           │   │
│   │   │   [DRV] DRIVER ACTOR    │ ◄─────────────────────────► │    [GUIA] GUIDE ACTOR   │           │   │
│   │   │ • Haversine Geofencing  │                             │ • Shift Hours & Subsidies│          │   │
│   │   │ • Airport/Urban Fares   │                             │ • Tiered Meals ($8k-$45k)│          │   │
│   │   │ • Route Validation      │                             │ • Language Matching (PT)│          │   │
│   │   └────────────┬────────────┘                             └────────────┬────────────┘           │   │
│   │                │                                                       │                        │   │
│   │                │ MessageChannel                         MessageChannel │                        │   │
│   │                ▼                                                       ▼                        │   │
│   │   ┌─────────────────────────┐     MessageChannel Mesh     ┌─────────────────────────┐           │   │
│   │   │   [NURSE] NURSE ACTOR   │ ◄─────────────────────────► │  [FIN] FINANCIAL AUDITOR│           │   │
│   │   │ • Fasting Windows (8h)  │                             │ • SHA-256 Hash Chaining │           │   │
│   │   │ • At-Home Lab Sampling  │                             │ • BigInt Settlement Math│           │   │
│   │   │ • Pre-Op Checklists     │                             │ • Tamper Detection Proof│           │   │
│   │   └─────────────────────────┘                             └─────────────────────────┘           │   │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                   │                                                     │
│                                                   ▼                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                 CRDT STATE SYNCHRONIZATION ENGINE                               │   │
│   │              • LWW-Element-Set (Add-bias)        • PN-Counter (Replicated Metrics)              │   │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Decentralized Actor Model: [DRV], [GUIA], [NURSE], [FIN]

Each agent executes inside isolated worker scopes, exposing deterministic message-handling contracts:

#### 1. [DRV] Driver Subagent (`driverWorker.ts`)
- **Haversine Distance**: Calculates spherical surface distance across coordinates:
  $$d = 2R \arcsin \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}$$
- **Fare Matrix**:
  - JMC Airport $\leftrightarrow$ Medellín: $\$145.000\text{ COP}$ (Standard) / $\$160.000\text{ COP}$ (Uber XL).
  - Intra-City Urban Transfers: $\$45.000\text{ COP}$ base.
  - Waiting Time Surcharge: $\$25.000\text{ COP}$ per hour.
- **Fail-Fast Boundary Invariant**: Rejects any origin or destination string/coordinate containing prohibited zones (`MOCOA`, `LETICIA`, `TUMACO`, `ARAUCA`, `CHOCO`).

#### 2. [GUIA] Bilingual Guide Subagent (`guideWorker.ts`)
- **Base Rate**: Fixed $\$15.500\text{ COP}$ per hour.
- **Tiered Meal Subsidies**:
  - $< 3\text{ hours} \implies \$0\text{ COP}$ (No subsidy).
  - $3 \le t < 5\text{ hours} \implies \$8.000\text{ COP}$ (Snack tier).
  - $5 \le t < 8\text{ hours} \implies \$25.000\text{ COP}$ (Half-day tier).
  - $8 \le t < 12\text{ hours} \implies \$35.000\text{ COP}$ (Full-day tier).
  - $\ge 12\text{ hours} \implies \$45.000\text{ COP}$ (Extended shift tier).
- **Preparation Allowance**: $\$20.000\text{ COP}$ flat prep allowance when requested.
- **Language Matcher**: Matches guides fluent in English, Dutch, Papiamento, and Portuguese.

#### 3. [NURSE] Nurse Subagent (`nurseWorker.ts`)
- **Fasting Lab Window**: Given a scheduled laboratory sampling timestamp $T_{\text{lab}}$, calculates:
  $$T_{\text{fasting\_start}} = T_{\text{lab}} - 8\text{ hours}, \quad T_{\text{water\_cutoff}} = T_{\text{lab}} - 2\text{ hours}$$
  Generates 4 automated alert checkpoints (12h prior dinner recommendation, 8h strict fasting, 2h water cutoff, 1h nurse en-route).
- **At-Home Sampling**: Schedules at-home visits with hotel room dispatch ($\$65.000\text{ COP}$ fixed service fee).
- **Pre-Op Clinical Checklist**: Validates surgical suspension of anticoagulants and aspirin 72h prior.

#### 4. [FIN] Financial Auditor Subagent (`financialAuditorWorker.ts`)
- **Ledger Audit & Equation Validation**: Computes exact net balance and determines settlement status (`DEFICIT_PAYABLE`, `SURPLUS_MEDICAL_TRIP`, `SETTLED`).
- **Synchronous Pure-JS SHA-256 Engine**: Native 32-bit bitwise SHA-256 implementation running with zero dependencies and microsecond latency.

---

### 3.2 Point-to-Point `MessageChannel` Mesh Topology & Broadcast Bus

The `WebWorkerSwarmBus` (`WebWorkerSwarmBus.ts`) manages communication across actors:
1. **Direct P2P Mesh**: Creates dedicated `MessageChannel` pairs between actors (`createPointToPointChannel('DRV', 'GUIA')`), enabling zero-copy `ArrayBuffer` transfer without main thread serialization bottlenecks.
2. **Role-Based Subscriptions**: Main thread and subagents subscribe to specific roles (`DRV`, `GUIA`, `NURSE`, `FIN`, `COORD`) or global `BROADCAST` streams.
3. **RPC Task Execution**: Exposes `executeAgentTask(role, action, payload)` providing uniform invocation in both browser Web Workers and Node.js/Vitest test harnesses.

---

### 3.3 Conflict-Free Replicated Data Types (CRDTs): LWW-Element-Set & PN-Counter

To support concurrent edits across disconnected field devices, the swarm implements two state-based CRDTs:

#### 1. Last-Write-Wins Element Set (LWW-Element-Set)
- Maintains two internal sets: $A$ (Add Set) and $R$ (Remove Set), mapping elements to epoch millisecond timestamps.
- **Membership Predicate (Add-Bias)**:
  $$e \in S \iff \exists (e, t_a) \in A \land (\forall (e, t_r) \in R \implies t_a \ge t_r)$$
- **Deterministic Merge**:
  $$A_{\text{merged}} = A_1 \sqcup A_2 = \{ (e, \max(t_{a1}, t_{a2})) \}, \quad R_{\text{merged}} = R_1 \sqcup R_2 = \{ (e, \max(t_{r1}, t_{r2})) \}$$

#### 2. Positive-Negative Counter (PN-Counter)
- Replicates multi-node counters (e.g. accumulated service hours and mileage).
- Maintains positive vector $P$ and negative vector $N$ across actor nodes:
  $$\text{Value} = \sum_{k} P[k] - \sum_{k} N[k], \quad \text{Merge}(C_1, C_2) = (\max(P_1, P_2), \max(N_1, N_2))$$

---

### 3.4 SHA-256 Cryptographic Ledger Chaining & Digital Signature Seals

Every financial event in the system is linked into a tamper-evident cryptographic hash chain:

$$\begin{aligned}
\text{Block}_0.\text{prevHash} &= \text{"GENESIS\_HASH"} \\
\text{Block}_0.\text{hash} &= \text{SHA256}(\text{JSON}(\text{Tx}_0) + \text{Block}_0.\text{prevHash}) \\
\text{Block}_i.\text{hash} &= \text{SHA256}(\text{JSON}(\text{Tx}_i) + \text{Block}_{i-1}.\text{hash})
\end{aligned}$$

- **Tamper Detection**: `verifyHashChain(blocks)` iteratively verifies that each block's `hash` matches its recomputed digest and that `prevHash` strictly equals the predecessor's hash. If an adversary tampers with an amount in Block $k$, verification fails immediately at index $k$.
- **Digital Signature Seal (`signLedgerSeal`)**: Generates an immutable cryptographic seal binding the latest ledger head hash to the patient's signature bitmap digest:
  $$\text{Seal} = \text{SHA256}(\text{LedgerHeadHash} + \text{SHA256}(\text{SignatureDataUrl}) + \text{PatientId} + \text{Timestamp})$$

---

## 4. Component Tree & Reactive State Management Blueprint

### 4.1 Unidirectional CQRS State Flow & Custom Hooks

The presentation layer consumes application use cases through reactive hooks, keeping components purely presentational:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CQRS REACTIVE STATE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        USER / GESTURE ACTION                        │   │
│   │        (Drag Event, Edit Form, Switch Archetype, Sign Canvas)       │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   APPLICATION USE CASES (PORTS)                     │   │
│   │    • ScheduleMilestoneUseCase       • RescheduleMilestoneUseCase    │   │
│   │    • CalculateSettlementUseCase     • SignOffItineraryUseCase       │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    DOMAIN AGGREGATE & INVARIANTS                    │   │
│   │    • MedicalItinerary               • Money (BigInt Cents)          │   │
│   │    • OperativeTerritory             • ItineraryMilestone            │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 INFRASTRUCTURE PERSISTENCE & SWARM                  │   │
│   │    • Dexie IndexedDB Store          • WebWorkerSwarmBus (CRDT)      │   │
│   │    • SHA-256 Audit Hash Chain       • LocalStorage CQRS Stream      │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │               REACTIVE HOOKS & MAIN THREAD UI UPDATE                │   │
│   │    • useMedicalItinerary()          • useSettlementBalance()        │   │
│   │    • useSwarmBus()                  • useCalendarNavigation()       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Custom Hook Interfaces

```typescript
// src/presentation/hooks/useMedicalItinerary.ts
export function useMedicalItinerary(initialArchetypeId: string = 'rva171') {
  const [archetypeId, setArchetypeId] = useState(initialArchetypeId);
  const [itinerary, setItinerary] = useState<MedicalItinerary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const switchArchetype = (newId: string) => { ... };
  const scheduleMilestone = async (data: CreateMilestoneDTO) => { ... };
  const rescheduleMilestone = async (milestoneId: string, newStart: Date, newEnd: Date) => { ... };
  const updateMilestoneStatus = async (milestoneId: string, status: MilestoneStatus) => { ... };
  const deleteMilestone = async (milestoneId: string) => { ... };
  const recordExpense = async (milestoneId: string, expense: ExpenseDTO) => { ... };
  const captureSignature = async (milestoneId: string, signatureDataUrl: string) => { ... };

  return {
    archetypeId,
    itinerary,
    isLoading,
    switchArchetype,
    scheduleMilestone,
    rescheduleMilestone,
    updateMilestoneStatus,
    deleteMilestone,
    recordExpense,
    captureSignature,
  };
}

// src/presentation/hooks/useSettlementBalance.ts
export function useSettlementBalance(itinerary: MedicalItinerary | null) {
  return useMemo(() => {
    if (!itinerary) return null;
    return calculateSettlementKPIs(itinerary);
  }, [itinerary]);
}
```

---

### 4.2 Complete React Component Hierarchy

```
AppRoot (`src/presentation/AppRoot.tsx`)
├── TopNavbar (`src/presentation/components/layout/TopNavbar.tsx`)
│   ├── BrandLogo ("Medical Trip Colombia S.A.S.")
│   ├── ArchetypeSwitcherBar (`ArchetypeSwitcherBar.tsx`)
│   │   ├── ArchetypeTab (RVA171 Catia x5)
│   │   ├── ArchetypeTab (RVA282 George Cardio)
│   │   ├── ArchetypeTab (RVA341 Eduard CES)
│   │   └── ArchetypeTab (RVA077 Rumai 12d)
│   ├── OfflineBadgeIndicator (Pulsing 100% Offline Badge)
│   ├── ThemeToggle (Light / Dark mode switcher)
│   └── GlobalActions ([+ Nueva Cita], [🤖 Swarm Status])
│
├── MasterDetailLayout (`src/presentation/components/layout/MasterDetailLayout.tsx`)
│   ├── LeftMasterPane (Calendar Module)
│   │   ├── CalendarHeader (`CalendarHeader.tsx`)
│   │   │   ├── DateNavigation ([<], [Hoy], [>], CurrentDateLabel)
│   │   │   └── ViewSelectorTabs ([Día], [Semana], [Mes], [Agenda])
│   │   │
│   │   ├── MonthView (`MonthView.tsx`)
│   │   │   ├── WeekDayHeaderRow
│   │   │   ├── MonthGridMatrix (35/42 DateCells)
│   │   │   └── OverflowPillPopover (`[+N más]`)
│   │   │
│   │   ├── WeekView (`WeekView.tsx`)
│   │   │   ├── 7DayHeaderRow
│   │   │   ├── TimeAxisColumn (06:00 to 22:00)
│   │   │   ├── WeekColumnsGrid (7 DayColumns with 15-min Snap)
│   │   │   └── MilestoneCard (`MilestoneCard.tsx` with Drag/Resize handles)
│   │   │
│   │   ├── DayView (`DayView.tsx`)
│   │   │   ├── DayTitleBanner
│   │   │   ├── HourlyGrid (60px/hour)
│   │   │   ├── CurrentTimeIndicatorLine (Red pulsing line)
│   │   │   └── CollisionResolvedMilestoneCards
│   │   │
│   │   ├── AgendaView (`AgendaView.tsx`)
│   │   │   ├── StickyDayHeader (`D1`, `D2`, `D3`...)
│   │   │   └── AgendaMilestoneCardsList
│   │   │
│   │   └── DragDropGhostOverlay (`DragDropGhost.tsx`)
│   │
│   └── RightDetailPane (Settlement & Concurrency Module)
│       └── LiveBalanceDrawer (`LiveBalanceDrawer.tsx`)
│           ├── SettlementHeader (Reserva ID & Hotel Name)
│           ├── SettlementStatusPill (Surplus / Payable / Settled)
│           ├── SettlementBalanceBar (`SettlementBalanceBar.tsx` - 5 Segments)
│           ├── KpiSummaryGrid (4 KPI Cards: Hours, Stops, Expenses, Audit)
│           ├── CqrsLedgerStream (Itemized Journal Entries)
│           └── ActionButtons ([📷 Cargar Recibo], [✍️ Firma Paciente], [🤖 Swarm Bus])
│
├── SlideOverDrawers & Modals
│   ├── EventDetailDrawer (`EventDetailDrawer.tsx` with Live Settlement Delta)
│   ├── ReceiptOCRModal (`ReceiptOCRModal.tsx` with Presets & Camera OCR)
│   ├── DigitalSignatureModal (`DigitalSignatureModal.tsx` with Retina Canvas)
│   ├── GpsCheckInModal (`GpsCheckInModal.tsx` with Haversine Geofencing)
│   └── SwarmStatusDrawer (`SwarmStatusDrawer.tsx` with Actor RPC Diagnostics)
│
└── ToastNotificationContainer (`ToastContainer.tsx`)
```

---

### 4.3 Global Keyboard Shortcuts & Microinteractions

| Key Combination | Action Description | UI Target |
| :--- | :--- | :--- |
| `D` | Switch to **Day View** | Global Calendar View |
| `W` | Switch to **Week View** | Global Calendar View |
| `M` | Switch to **Month View** | Global Calendar View |
| `A` | Switch to **Agenda View** | Global Calendar View |
| `T` | Jump to **Today** (`America/Bogota`) | Calendar Navigation |
| `C` | Create **New Milestone / Cita** | Opens `EventDetailDrawer` |
| `1` | Switch to Archetype **RVA171 Catia x5** | Top Switcher Bar |
| `2` | Switch to Archetype **RVA282 George Cardio** | Top Switcher Bar |
| `3` | Switch to Archetype **RVA341 Eduard CES** | Top Switcher Bar |
| `4` | Switch to Archetype **RVA077 Rumai 12d** | Top Switcher Bar |
| `Esc` | Close active Modal or Slide-over Drawer | Modals / Drawers |

---

## 5. Comprehensive Automated Test Suite Inventory (Vitest / Node Test Runner)

### 5.1 Test Topology & Invariant Matrix

The automated testing framework covers four concentric rings:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VITEST AUTOMATED TEST SUITE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 RING 1: PURE DOMAIN & MATHEMATICS                   │   │
│   │  • BigInt Money Arithmetic (0 Float Drift, Sub-cent rounding)       │   │
│   │  • OperativeTerritory Geo-Fencing (Fail-Fast on Mocoa)             │   │
│   │  • Domain Entities (ItineraryMilestone, PatientBooking)             │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  RING 2: APPLICATION USE CASES                      │   │
│   │  • ScheduleMilestone, RescheduleMilestone (15-min Snap)            │   │
│   │  • CalculateSettlement (Debits == Credits, Net Balance)             │   │
│   │  • ProcessReceiptOCR, SignOffItinerary (IndexedDB persistence)      │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │             RING 3: SWARM CONCURRENCY & CRYPTOGRAPHY                │   │
│   │  • WebWorkerSwarmBus (P2P MessageChannel, Broadcast)                │   │
│   │  • [DRV], [GUIA], [NURSE], [FIN] Actor Task Handlers                │   │
│   │  • SHA-256 Ledger Hash Chaining & Tamper Detection                  │   │
│   │  • CRDT State Convergence (LWW-Element-Set, PN-Counter)             │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │             RING 4: REACT COMPONENT & INTERACTION TESTS             │   │
│   │  • Calendar Views Rendering (Month, Week, Day, Agenda)              │   │
│   │  • Archetype Switcher Bar (RVA171, RVA282, RVA341, RVA077)         │   │
│   │  • Event Detail Drawer (Form Validation, Live Settlement Delta)     │   │
│   │  • Docked Settlement Bar, Signature Canvas, OCR Modal               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Unit Tests (Domain Math, Invariants, Use Cases)

#### Test File: `tests/unit/domain/Money.test.ts`
- `UT-MONEY-01`: Eliminates standard IEEE-754 float rounding errors (`0.10 + 0.20 = 0.30 COP`).
- `UT-MONEY-02`: Creates Money from native `BigInt` integer cents (`1550000n` cents = `$15.500 COP`).
- `UT-MONEY-03`: Creates Money from numeric and string cents formats.
- `UT-MONEY-04`: Applies deterministic half-up rounding on sub-cent fractional amounts (`15500.555 -> 1550056n`).
- `UT-MONEY-05`: Preserves immutability during arithmetic additions and subtractions.
- `UT-MONEY-06`: Multiplies by decimal guide hours (`3.5h @ $15.500/h = $54.250 COP`).
- `UT-MONEY-07`: Splits monetary amounts across $N$ participants with zero residual penny leakage (remainder distribution).
- `UT-MONEY-08`: Throws `InvalidMoneyAmountError` on non-numeric inputs or unsupported currencies.
- `UT-MONEY-09`: Throws `CurrencyMismatchError` when attempting cross-currency operations (`COP + USD`).

#### Test File: `tests/unit/domain/OperativeTerritory.test.ts`
- `UT-TERR-01`: Accepts approved medical locations in Medellín (`HPTU`, `Cardio VID`, `CES`, `Clofán`, `Park 42`).
- `UT-TERR-02`: Accepts Rionegro JMC airport corridor (`Aeropuerto Internacional JMC`).
- `UT-TERR-03`: Accepts regional authorized medical corridors (Envigado, Sabaneta, Manizales, Pereira, Bogotá).
- `UT-TERR-04`: **Fail-Fast Invariant**: Throws `NonOperativeTerritoryError` on Mocoa (`Hospital San Francisco de Mocoa`).
- `UT-TERR-05`: **Fail-Fast Invariant**: Throws `NonOperativeTerritoryError` on Leticia, Amazonas.
- `UT-TERR-06`: **Fail-Fast Invariant**: Throws `NonOperativeTerritoryError` on Tumaco, Arauca, Guaviare, Mitú, Inírida, Chocó.
- `UT-TERR-07`: Validates geographic bounding boxes (Medellín lat `6.16` to `6.50`, lng `-75.80` to `-75.30`).
- `UT-TERR-08`: Throws `NonOperativeTerritoryError` when coordinates fall in Mocoa (lat `1.15`, lng `-76.65`).

#### Test File: `tests/unit/application/CalculateSettlementUseCase.test.ts`
- `UT-SETTLE-01`: Calculates multi-day balance sheet for `RVA171 Catia x5` with 0 float rounding error.
- `UT-SETTLE-02`: Reconciles cash advances (`$2.098.100 COP`) against total expenses, yielding exact net balance.
- `UT-SETTLE-03`: Accurately separates Fleet Taxis, Bilingual Companion Fees, and Pharmacy Receipts.
- `UT-SETTLE-04`: Calculates exact surplus status when cash advances exceed expenses (`SURPLUS_MEDICAL_TRIP`).
- `UT-SETTLE-05`: Calculates payable deficit when expenses exceed advances (`DEFICIT_PAYABLE`).

---

### 5.3 Component & Interaction Tests (Calendar Views, Drawers, Modals)

#### Test File: `tests/unit/presentation/CalendarViews.test.tsx`
- `CT-CAL-01`: Renders `MonthView` grid with 7 weekday headers, correct days count, and event category badges.
- `CT-CAL-02`: Renders `+N más` overflow pill in `MonthView` when day exceeds 3 events, and opens popover on click.
- `CT-CAL-03`: Renders `WeekView` with 7 columns and time slots from 06:00 to 22:00.
- `CT-CAL-04`: Snaps dragging events to 15-minute boundaries in `WeekView`.
- `CT-CAL-05`: Renders `DayView` with current time indicator line and executes collision column layout on simultaneous appointments.
- `CT-CAL-06`: Renders `AgendaView` with grouped date headers (`D1`, `D2`...) and quick action buttons.

#### Test File: `tests/unit/presentation/EventDetailDrawer.test.tsx`
- `CT-DRAWER-01`: Opens drawer and hydrates form fields with selected milestone attributes.
- `CT-DRAWER-02`: Computes live settlement delta box when guide hours or direct expenses change.
- `CT-DRAWER-03`: Displays fail-fast invariant alert when user inputs `Mocoa Putumayo` as location.
- `CT-DRAWER-04`: Dispatches `SaveEvent` payload with sanitized BigInt amounts on form submit.

#### Test File: `tests/unit/presentation/SettlementBarAndModals.test.tsx`
- `CT-BAR-01`: Renders 5-segment proportional settlement bar with exact percentage widths matching BigInt math.
- `CT-OCR-01`: Loads receipt presets in `ReceiptOCRModal`, extracts itemized line items, and updates modal form.
- `CT-SIGN-01`: Initializes `DigitalSignatureModal` retina canvas, captures pointer strokes, and outputs valid data URL.
- `CT-SIGN-02`: Disallows saving when canvas has 0 captured pointer points.

---

### 5.4 Swarm Concurrency & Cryptographic Chaining Tests

#### Test File: `tests/integration/workers/ActorSwarm.test.ts`
- `IT-SWARM-01`: **[DRV] Driver Actor**: Computes standard JMC transfer fare ($145k COP) and Uber XL 5 pax fare ($160k COP).
- `IT-SWARM-02`: **[DRV] Driver Actor**: Computes Haversine distance between JMC airport and Inntu Laureles ($21.4\text{ km}$).
- `IT-SWARM-03`: **[DRV] Driver Actor**: Rejects routes to/from Mocoa with `Zona Prohibida` error.
- `IT-SWARM-04`: **[GUIA] Guide Actor**: Calculates tiered meal subsidies ($0 for <3h, $8k for 4h, $25k for 6h, $35k for 8h, $45k for 13h).
- `IT-SWARM-05`: **[GUIA] Guide Actor**: Matches available bilingual guides for Portuguese and French patients.
- `IT-SWARM-06`: **[NURSE] Nurse Actor**: Computes 8-hour fasting window start time and 2-hour water cutoff for morning lab samples.
- `IT-SWARM-07`: **[NURSE] Nurse Actor**: Schedules at-home sample with hotel room details and $65k COP service fee.
- `IT-SWARM-08`: **[FIN] Financial Actor**: Audits ledger transactions verifying `Out-of-Pocket + Guide + Fleet - Advances = Net Balance`.
- `IT-SWARM-09`: **SHA-256 Chaining**: Builds immutable blockchain-style linked audit chain ($B_0 \to B_1 \to B_2$).
- `IT-SWARM-10`: **Tamper Detection**: Detects modified amounts or broken hash links, identifying the exact tampered index.
- `IT-SWARM-11`: **Digital Signature Seal**: Creates cryptographic digital signature seal over latest ledger head hash.
- `IT-SWARM-12`: **WebWorkerSwarmBus**: Delivers point-to-point and broadcast messages across actor subscribers.
- `IT-SWARM-13`: **CRDT LWW-Element-Set**: Resolves offline concurrent adds and removals with deterministic add-bias.
- `IT-SWARM-14`: **CRDT PN-Counter**: Converges replicated positive-negative counters across simulated network partitions.

---

## 6. Edge Cases & Error Handling Matrix

| # | Operational Feature | Edge Case Input / Trigger | Deterministic System Behavior |
|---|---|---|---|
| 1 | **Geofencing / Invariants** | Check-in coordinates in Mocoa, Putumayo (`1.1528, -76.6521`) | Throws `NonOperativeTerritoryError`, blocks status transition to `EN_SITIO`, and displays high-visibility red alert banner in UI. |
| 2 | **GPS Check-in** | Coordinates 450m from HPTU (tolerance: 300m) | Flags state as `FUERA_DE_RANGO`, requests operational override reason before allowing manual check-in. |
| 3 | **Digital Signature** | User clicks save on empty canvas (0 drawn points) | Save button remains disabled; programmatic invocation throws `CanvasEmptyError`. |
| 4 | **Device Orientation** | Tablet rotates from landscape to portrait during signature | Canvas redraws stroke point vector buffer without scaling distortion or point loss. |
| 5 | **Receipt OCR** | Upload of non-image/non-PDF file or corrupted file | Rejects file with `UnsupportedMediaError` and displays friendly format instructions. |
| 6 | **Receipt OCR** | Thermal receipt faded or zero total amount detected | Sets editable amount field to `$0 COP`, requiring manual verification before confirmation. |
| 7 | **BigInt Settlements** | Aggregation of 1,000 microtransactions with sub-cent splits | Zero floating-point rounding error (`0n` residual drift) maintained across multi-day rollups. |
| 8 | **Budget Balance Bar** | Unexpected expense exceeds total case budget | Balance bar clamps remaining budget to 0% and displays flashing `PRESUPUESTO_EXCEDIDO` banner with exact deficit amount. |
| 9 | **Calendar Snapping** | User drags event beyond 23:45 or before 06:00 | Collision engine restricts event bounds within 06:00–22:00 or offers auto-shift to next day. |
| 10 | **Archetype Switching** | Fast clicking between archetypes during active IndexedDB save | Active write finishes in isolated scope without corrupting newly selected archetype state. |
| 11 | **Offline Airplane Mode** | Complete network disconnection | Application operates at 100% functionality on Dexie IndexedDB and Web Workers. |
| 12 | **Viewport Resizing** | Dynamic resize from 1600px desktop to 390px mobile | Seamlessly transforms right panel into collapsible slide-up bottom drawer, retaining current selection. |

---

## 7. Implementation Blueprint for Engineering Implementers

When creating and implementing `apps/medicaltrip_react_app`, engineering agents should follow this step-by-step blueprint:

### Phase 1: Toolchain Scaffolding & Configuration
- Create `package.json` with React 19, TypeScript 5.x, Vite 6.x, Tailwind CSS, Lucide-React, Dexie.js, and Vitest.
- Configure `tsconfig.json` with `strict: true`, `target: ES2022`, `moduleResolution: bundler`.
- Configure `vite.config.ts` with React plugin, worker format `es`, and test environment `jsdom` / `happy-dom`.
- Set up `manifest.json` and `service-worker.js` for 100% offline standalone PWA support.

### Phase 2: Domain Layer (`src/domain/`)
- Implement `Money` value object with BigInt integer cents and Martin Fowler arithmetic operations.
- Implement `Coordinates` and `OperativeTerritory` with fail-fast invariants for Mocoa and forbidden zones.
- Implement `ItineraryMilestone`, `PatientBooking`, `CompanionShift`, `DriverTransfer`, and `SettlementLedger` entities.
- Define abstract ports (`IStoragePort`, `IBlobStoragePort`, `IActorSwarmBus`, `IReceiptOCRService`).

### Phase 3: Application Layer (`src/application/`)
- Implement CQRS use cases: `ScheduleMilestoneUseCase`, `RescheduleMilestoneUseCase`, `CalculateSettlementUseCase`, `ProcessReceiptOCRUseCase`, `SignOffItineraryUseCase`.

### Phase 4: Infrastructure Layer (`src/infrastructure/`)
- Implement `DexieStorageAdapter` and `InMemoryItineraryRepository`.
- Implement `ItemizedReceiptOCRAdapter`.
- Implement `ArchetypeRegistry` with all 4 empirical Drive datasets (`rva171`, `rva282`, `rva341`, `rva077`).
- Implement `WebWorkerSwarmBus`, `driverWorker`, `guideWorker`, `nurseWorker`, `financialAuditorWorker`, `LWWElementSet`, `PNCounter`, and SHA-256 hash chaining.

### Phase 5: Presentation Layer (`src/presentation/`)
- Implement CSS design tokens in `tokens.css` and Tailwind config.
- Implement custom hooks: `useMedicalItinerary`, `useSettlementBalance`, `useSwarmBus`.
- Implement calendar views: `MonthView`, `WeekView` (with 15-min snap, drag & resize), `DayView` (with collision layout), `AgendaView`.
- Implement layout components: `TopNavbar`, `ArchetypeSwitcherBar`, `MasterDetailLayout`.
- Implement drawers & modals: `EventDetailDrawer` (with live settlement delta), `LiveBalanceDrawer` (with 5-segment bar), `ReceiptOCRModal`, `DigitalSignatureModal`, `GpsCheckInModal`, `SwarmStatusDrawer`.

### Phase 6: Vitest Test Suite Execution & Verification
- Implement all unit, component, integration, and worker tests in `tests/`.
- Execute `npm test` and verify **100% PASS rate** with 0 errors and 0 type warnings.
- Run `npm run build` and verify clean production build in `dist/`.

---
*Report compiled by Explorer 3 (`explorer_survey_3`) — Medical Trip Colombia S.A.S.*
