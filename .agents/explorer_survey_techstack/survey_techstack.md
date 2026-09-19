# 🏗️ Technical Stack & Architecture Blueprint
# Medical Trip Calendar & Settlement Standalone Application (`apps/medicaltrip_calendar_app`)

> **Author**: Technical Stack & Architecture Explorer (Teamwork Agent)  
> **Target Path**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`  
> **Design Paradigms**: Hexagonal Architecture (Ports & Adapters) • Pure DDD • Martin Fowler Money Pattern (BigInt Cents) • Local-First Radical Persistence • Actor-Model Web Worker Concurrency (MessageChannels & CRDT) • Google Calendar / Linear Human-First UI/UX Design System.

---

## 1. Executive Summary & Architectural Goals

The **Medical Trip Calendar & Settlement Application** is a standalone, consumer-grade, Local-First Progressive Web Application designed for on-the-ground operational field coordination and deterministic financial settlement for **Medical Trip Colombia S.A.S.**.

### Core Value Drivers & Non-Negotiable Invariants
1. **Human-First Ergonomic UI/UX**: Clean, distraction-free interface inspired by Google Calendar, Notion, and Linear (zinc/slate neutrals, crisp typography, accessible contrast, subtle micro-interactions, zero AI-gimmick neon gradients).
2. **Strict Hexagonal Architecture (Ports & Adapters)**: Pure TypeScript domain layer completely decoupled from frameworks, UI, and external libraries.
3. **Deterministic Financial Arithmetic**: 100% elimination of IEEE 754 floating-point errors by modeling all currency operations strictly in integer cents using native JavaScript `BigInt` (Martin Fowler Money Pattern).
4. **Fail-Fast Geospatial Geofencing**: `OperativeTerritory` Value Object that deterministically rejects non-operative jurisdictions (e.g., Mocoa, Leticia, Arauca) while validating valid corridors (Medellín, Rionegro, Envigado, Sabaneta, Manizales, Pereira).
5. **Local-First Radical Persistence (100% Offline)**: Multi-tier offline persistence using Dexie.js (IndexedDB) for structured relational CQRS ledgers and binary blob storage (receipt photos, signature vectors), backed by `navigator.storage.persist()` against browser cache eviction.
6. **Decentralized Multi-Agent Swarm Concurrency**: Dedicated Web Worker actors (`[DRV]` Driver, `[GUIA]` Guide, `[NURSE]` Nurse, `[FIN]` Financial Auditor) communicating via point-to-point `MessageChannel` instances, CRDT state synchronization, and SHA-256 cryptographic ledger chaining.
7. **Four Canonical Operational Archetypes**: Out-of-the-box support for full operational schedules: `RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Eduard CES`, and `RVA077 Rumai Cirugía 12d`.

---

## 2. Host Environment & Tooling Survey

An exhaustive scan of `/Users/miyo123/projects/medicaltrip` revealed the following environment configuration:

| Component | Detected Version / Status | Configuration / Execution Path |
| :--- | :--- | :--- |
| **Node.js** | `v20.18.0` (Local) / `v22.21.1` (Host) | `/Users/miyo123/projects/medicaltrip/.bin/bin/node` |
| **NPM** | `10.8.2` | `/Users/miyo123/projects/medicaltrip/.bin/bin/npm` |
| **TypeScript** | `v5.5+` | Host installed & available via `npx tsc` |
| **TSX Engine** | `v4.19+` | Available in `./node_modules/.bin/tsx` |
| **Network Status** | Online (Registry PING: 546ms) | Full NPM registry package installation support |
| **Target App Directory** | Clean directory ready for scaffolding | `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app` |

---

## 3. Comprehensive Hexagonal Directory Structure

The standalone application is organized into four concentric hexagonal layers, guaranteeing that domain logic remains pure and independent of infrastructure or UI frameworks.

```
apps/medicaltrip_calendar_app/
├── public/
│   ├── favicon.svg                          # Vector app icon (Caduceus & Calendar motif)
│   ├── manifest.json                        # PWA standalone manifest
│   ├── sw.js                                # PWA cache-first service worker
│   └── mock_receipts/                       # Pre-loaded sample receipts for OCR testing
│       ├── cruz_verde_receipt.jpg
│       ├── pasteur_receipt.jpg
│       └── echavarria_lab_receipt.jpg
│
├── src/
│   ├── domain/                              # [LAYER 1] Pure Domain (Zero External Dependencies)
│   │   ├── entities/
│   │   │   ├── ItineraryEvent.ts            # Medical/logistics milestone aggregate
│   │   │   ├── BookingReservation.ts        # RVA patient dossier & booking aggregate
│   │   │   ├── DriverTransfer.ts            # Aeroturex vehicle transfer record & rate calculation
│   │   │   ├── CompanionShift.ts            # Bilingual guide / nurse shift & meal subsidies
│   │   │   ├── ExpenseReceipt.ts            # Itemized out-of-pocket expense record
│   │   │   ├── SettlementLedger.ts          # Single-writer CQRS ledger aggregate root
│   │   │   └── PatientSignature.ts          # Digital sign-off record & crypto seal
│   │   ├── value-objects/
│   │   │   ├── Money.ts                     # Martin Fowler Money Pattern (BigInt cents, COP/USD)
│   │   │   ├── OperativeTerritory.ts        # Geofencing & fail-fast non-operative jurisdiction validator
│   │   │   ├── TimeSlot.ts                  # ISO-8601 America/Bogota (UTC-5) interval & duration
│   │   │   ├── GeoCoordinate.ts             # WGS84 Lat/Lng with Haversine distance calculator
│   │   │   ├── EventCategory.ts             # Enum: FLIGHT, CLINICAL, LAB, PHARMACY, LODGING
│   │   │   ├── EventStatus.ts               # State machine: SCHEDULED, EN_ROUTE, ON_SITE, COMPLETED, CANCELLED
│   │   │   └── ActorRole.ts                 # Enum: DRV, GUIA, NURSE, FIN, COORD, DIR_MED
│   │   ├── errors/
│   │   │   ├── DomainError.ts               # Base domain error class
│   │   │   ├── NonOperativeZoneError.ts     # Thrown when a prohibited location (e.g. Mocoa) is used
│   │   │   ├── CurrencyMismatchError.ts     # Thrown when attempting mixed COP/USD operations
│   │   │   ├── InvariantViolationError.ts   # State machine & scheduling conflict errors
│   │   │   └── LedgerArithmeticError.ts     # Ledger balancing discrepancy errors
│   │   ├── events/
│   │   │   ├── DomainEvent.ts               # Base immutable domain event interface
│   │   │   ├── ItineraryEventCreatedEvent.ts
│   │   │   ├── ItineraryEventRescheduledEvent.ts
│   │   │   ├── ExpenseItemLoggedEvent.ts
│   │   │   └── SettlementFinalizedEvent.ts
│   │   └── index.ts                         # Domain barrel export
│   │
│   ├── application/                         # [LAYER 2] Ports & Use Cases (Pure Business Orchestration)
│   │   ├── ports/
│   │   │   ├── IItineraryRepository.ts      # Query & mutate itinerary events and reservations
│   │   │   ├── ISettlementRepository.ts     # CQRS event store & ledger persistence
│   │   │   ├── IBlobStoragePort.ts          # Binary asset storage (IndexedDB Blobs: images, signatures)
│   │   │   ├── IActorSwarmBusPort.ts        # Inter-agent Web Worker communication bus
│   │   │   ├── IReceiptOCRPort.ts           # Optical character recognition parser interface
│   │   │   ├── IGeolocationPort.ts          # GPS sensor & location proximity provider
│   │   │   └── ISignatureStoragePort.ts     # Digital signature storage & verification port
│   │   ├── use-cases/
│   │   │   ├── ScheduleEventUseCase.ts      # Create milestone with territory & actor checks
│   │   │   ├── RescheduleMilestoneUseCase.ts# Drag-and-drop time updates & shift recalculation
│   │   │   ├── SettleItineraryUseCase.ts    # Reconcile transfers, shifts, and out-of-pocket expenses
│   │   │   ├── ProcessReceiptOCRUseCase.ts  # Ingest image, extract items, append to expense ledger
│   │   │   ├── CheckInLocationUseCase.ts    # Verify GPS proximity and transition status to ON_SITE
│   │   │   ├── SignOffItineraryUseCase.ts   # Attach canvas signature & seal settlement ledger
│   │   │   └── SwitchArchetypeUseCase.ts    # Load one of 4 canonical Google Drive archetypes
│   │   ├── dtos/
│   │   │   ├── ItineraryDTOs.ts
│   │   │   ├── SettlementDTOs.ts
│   │   └── index.ts                         # Application barrel export
│   │
│   ├── infrastructure/                      # [LAYER 3] Adapters (Dexie, Workers, OCR, Hardware, PWA)
│   │   ├── storage/
│   │   │   ├── DexieDatabase.ts             # Dexie.js database schema definition & versioning
│   │   │   ├── DexieItineraryRepository.ts  # Implementation of IItineraryRepository
│   │   │   ├── DexieSettlementRepository.ts # Implementation of ISettlementRepository
│   │   │   ├── DexieBlobStorageAdapter.ts   # Implementation of IBlobStoragePort
│   │   │   └── PersistentStorageManager.ts  # navigator.storage.persist() & quota monitoring
│   │   ├── actors/
│   │   │   ├── WebWorkerActorMeshAdapter.ts # Manages 4 Web Worker instances and MessageChannels
│   │   │   ├── CRDTStateSynchronizer.ts     # LWW-Element-Set CRDT state synchronizer
│   │   │   ├── CryptoLedgerChainer.ts       # SHA-256 cryptographic chain hasher
│   │   │   └── workers/
│   │   │       ├── driver.worker.ts         # [DRV] Actor: validates transfers & vehicle rates
│   │   │       ├── guide.worker.ts          # [GUIA] Actor: calculates hours, prep & meal allowances
│   │   │       ├── nurse.worker.ts          # [NURSE] Actor: clinical checklists & care logs
│   │   │       └── financial.worker.ts      # [FIN] Actor: BigInt single-writer ledger balancing
│   │   ├── ocr/
│   │   │   ├── RegexReceiptOCRAdapter.ts    # High-precision Colombian pharmacy receipt parser
│   │   │   └── TesseractWasmOCRAdapter.ts   # Client-side WASM OCR fallback
│   │   ├── hardware/
│   │   │   ├── BrowserGeolocationAdapter.ts # HTML5 Geolocation API with simulated fallback
│   │   │   └── CanvasSignatureAdapter.ts    # Smooth Bezier 2D canvas vector capture
│   │   ├── pwa/
│   │   │   ├── ServiceWorkerManager.ts      # Cache-first PWA registration and lifecycle
│   │   │   └── StandaloneDetector.ts        # Display-mode detection (standalone vs browser)
│   │   ├── data/
│   │   │   ├── ArchetypesRepository.ts      # 4 Real-world Google Drive archetypes fixtures
│   │   │   └── ClinicalDirectory.ts         # Pre-configured geo-tagged hospitals and hotels
│   │   └── index.ts                         # Infrastructure barrel export
│   │
│   ├── presentation/                        # [LAYER 4] React + Tailwind CSS UI Layer
│   │   ├── components/
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarContainer.tsx    # Master container with Day/Week/Month/Agenda switching
│   │   │   │   ├── CalendarHeader.tsx       # Date navigator, view switcher, archetype picker
│   │   │   │   ├── DayView.tsx              # High-density 06:00-22:00 vertical time grid
│   │   │   │   ├── WeekView.tsx             # 7-day multi-column interactive timeline grid
│   │   │   │   ├── MonthView.tsx            # Full month grid with color-coded milestone badges
│   │   │   │   ├── AgendaView.tsx           # Linear/Notion-style chronological milestone list
│   │   │   │   ├── EventCard.tsx            # Event badge with status dot, category tag, actor avatars
│   │   │   │   └── DragDropGhost.tsx        # Rescheduling visual indicator
│   │   │   ├── editor/
│   │   │   │   ├── EventEditorModal.tsx     # Slide-over milestone inspector & editor
│   │   │   │   ├── LocationPicker.tsx       # Clinic/Hotel selector with geofence validation
│   │   │   │   ├── ActorAssignmentSelect.tsx# [DRV], [GUIA], [NURSE] multi-select pill tags
│   │   │   │   └── CategoryColorPicker.tsx  # Sky Blue, Indigo, Teal, Emerald, Amber, Slate
│   │   │   ├── settlement/
│   │   │   │   ├── SettlementDrawer.tsx     # Slide-out real-time financial balance sheet
│   │   │   │   ├── BalanceBreakdownCard.tsx # Net balance, expenses, guide fees, driver fees, advances
│   │   │   │   ├── ExpenseLedgerTable.tsx   # Itemized expense list with audit badges
│   │   │   │   ├── ReceiptOCRModal.tsx      # Receipt image upload, dropzone & OCR line items
│   │   │   │   ├── DigitalSignatureModal.tsx# HTML5 signature canvas with smooth ink & clear/save
│   │   │   │   └── ExportLedgerButton.tsx   # Export balance report to JSON / CSV / Print format
│   │   │   ├── common/
│   │   │   │   ├── ArchetypeSelector.tsx    # Dropdown for RVA171, RVA282, RVA341, RVA077
│   │   │   │   ├── OfflineBadge.tsx         # Real-time online/offline and storage persist badge
│   │   │   │   ├── ActorSwarmStatus.tsx     # Web Worker subagent health and activity indicator
│   │   │   │   └── ToastNotification.tsx    # Linear-style micro-toast alert component
│   │   ├── hooks/
│   │   │   ├── useItinerary.ts              # Custom hook binding presentation to Schedule use cases
│   │   │   ├── useSettlement.ts             # Custom hook providing real-time BigInt financial balance
│   │   │   ├── useActorSwarm.ts             # Custom hook subscribing to Web Worker CRDT events
│   │   │   ├── useCalendarDragDrop.ts       # Drag-and-drop rescheduling state machine hook
│   │   │   └── usePersistentStorage.ts      # Storage quota and persistent storage status hook
│   │   ├── context/
│   │   │   ├── DependencyContext.tsx        # Inversion of Control React Context providing Ports
│   │   │   └── CalendarStateContext.tsx     # Active date, active view, filter state, selected archetype
│   │   ├── styles/
│   │   │   ├── index.css                    # Tailwind CSS base, components, and utilities
│   │   │   └── calendar.css                 # Custom scrollbars, grid lines, and drag transitions
│   │   ├── App.tsx                          # Root master-detail split-view layout
│   │   └── main.tsx                         # Entry point: IoC bootstrapping & React mount
│   │
│   ├── tests/                               # Comprehensive Automated Test Suite
│   │   ├── unit/
│   │   │   ├── Money.test.ts                # BigInt arithmetic, allocation, formatting, currency mismatch
│   │   │   ├── OperativeTerritory.test.ts   # Approved corridors & Mocoa fail-fast invariant checks
│   │   │   ├── SettlementLedger.test.ts     # Deterministic zero-rounding ledger calculation
│   │   │   └── ItineraryEvent.test.ts       # State transitions & milestone invariants
│   │   ├── integration/
│   │   │   ├── UseCases.test.ts             # Application use cases against Dexie in-memory store
│   │   │   └── ActorSwarm.test.ts           # Web Worker MessageChannel & SHA-256 hash chaining
│   │   └── e2e/
│   │       ├── CalendarNavigation.test.ts   # Multi-view switching & event rendering
│   │       ├── RescheduleDragDrop.test.ts   # Rescheduling interaction & live settlement update
│   │       ├── ReceiptOCRWorkflow.test.ts   # Receipt upload & expense ledger deduction
│   │       ├── SignatureSignOff.test.ts     # Canvas signature capture & ledger sealing
│   │       └── ArchetypesFidelity.test.ts   # All 4 Google Drive archetypes loading & verification
│   │
│   ├── package.json                         # Scripts & dependencies
│   ├── tsconfig.json                        # Strict TypeScript compiler options
│   ├── vite.config.ts                       # Vite build config with worker support & path aliases
│   ├── tailwind.config.js                   # Ergonomic zinc/slate color palette & typography tokens
│   ├── postcss.config.js                    # PostCSS configuration
│   └── index.html                           # Single-page application shell
```

---

## 4. Deep-Dive: Domain Layer & Value Objects Specification

### 4.1. The `Money` Value Object (Martin Fowler Pattern)
To eradicate IEEE 754 floating-point errors (such as `0.1 + 0.2 = 0.30000000000000004`), `Money` stores all amounts as integer cents in a `bigint`.

```typescript
// src/domain/value-objects/Money.ts
export type CurrencyCode = 'COP' | 'USD';

export class Money {
  readonly #amountInCents: bigint;
  readonly #currency: CurrencyCode;

  constructor(amountInCents: bigint | number | string, currency: CurrencyCode = 'COP') {
    const normCurrency = String(currency).toUpperCase().trim() as CurrencyCode;
    if (normCurrency !== 'COP' && normCurrency !== 'USD') {
      throw new DomainError(`[Moneda Inválida] Divisa no soportada: '${currency}'. Soportadas: COP, USD`);
    }
    try {
      this.#amountInCents = typeof amountInCents === 'bigint' ? amountInCents : BigInt(amountInCents);
    } catch {
      throw new DomainError(`[Monto Inválido] No se pudo convertir '${amountInCents}' a BigInt cents.`);
    }
    this.#currency = normCurrency;
    Object.freeze(this);
  }

  get amountInCents(): bigint { return this.#amountInCents; }
  get currency(): CurrencyCode { return this.#currency; }
  get amount(): number { return Number(this.#amountInCents) / 100; }

  static fromCents(cents: bigint | number | string, currency: CurrencyCode = 'COP'): Money {
    return new Money(cents, currency);
  }

  static fromAmount(amount: number | string | bigint, currency: CurrencyCode = 'COP'): Money {
    if (typeof amount === 'bigint') return new Money(amount * 100n, currency);
    const raw = String(amount).trim();
    if (!raw || isNaN(Number(raw))) throw new DomainError(`[Monto Inválido]: '${amount}'`);
    const isNeg = raw.startsWith('-');
    const clean = isNeg ? raw.slice(1) : raw;
    const [intPart = '0', fracPart = ''] = clean.split('.');
    const centsStr = intPart + fracPart.padEnd(2, '0').slice(0, 2);
    const cents = BigInt(centsStr) * (isNeg ? -1n : 1n);
    return new Money(cents, currency);
  }

  static zero(currency: CurrencyCode = 'COP'): Money {
    return new Money(0n, currency);
  }

  add(other: Money): Money {
    this.#assertSameCurrency(other);
    return new Money(this.#amountInCents + other.#amountInCents, this.#currency);
  }

  subtract(other: Money): Money {
    this.#assertSameCurrency(other);
    return new Money(this.#amountInCents - other.#amountInCents, this.#currency);
  }

  multiply(factor: number | bigint): Money {
    if (typeof factor === 'bigint') {
      return new Money(this.#amountInCents * factor, this.#currency);
    }
    const scaledFactor = BigInt(Math.round(factor * 10000));
    const resultCents = (this.#amountInCents * scaledFactor + 5000n) / 10000n;
    return new Money(resultCents, this.#currency);
  }

  format(): string {
    const isNeg = this.#amountInCents < 0n;
    const abs = isNeg ? -this.#amountInCents : this.#amountInCents;
    const intPart = (abs / 100n).toString();
    const fracPart = (abs % 100n).toString().padStart(2, '0');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const prefix = isNeg ? '-' : '';
    if (this.#currency === 'COP') return `${prefix}$ ${formattedInt} COP`;
    return `${prefix}$${formattedInt}.${fracPart} USD`;
  }

  #assertSameCurrency(other: Money): void {
    if (this.#currency !== other.#currency) {
      throw new CurrencyMismatchError(this.#currency, other.#currency);
    }
  }
}
```

### 4.2. The `OperativeTerritory` Value Object & Invariant Enforcement
Enforces strict fail-fast domain logic rejecting any location outside the canonical Medical Trip operational corridor.

```typescript
// src/domain/value-objects/OperativeTerritory.ts
export const VALID_CORRIDORS = Object.freeze([
  'MEDELLIN', 'RIONEGRO', 'POBLADO', 'LAURELES', 'ROBLEDO',
  'CIUDAD_DEL_RIO', 'ENVIGADO', 'SABANETA', 'BELLO', 'ITAGUI',
  'MANIZALES', 'PEREIRA'
]);

export const FORBIDDEN_NON_OPERATIVE_ZONES = Object.freeze([
  'MOCOA', 'LETICIA', 'AMAZONAS', 'ARAUCA', 'GUAVIARE',
  'TUMACO', 'MITU', 'INIRIDA', 'PUERTO_CARRENO'
]);

export class OperativeTerritory {
  readonly zoneName: string;
  readonly coordinates: { lat: number; lng: number } | null;

  constructor(zoneOrCoords: string | { name: string; lat?: number; lng?: number }) {
    const rawZone = typeof zoneOrCoords === 'string' ? zoneOrCoords : zoneOrCoords.name;
    const norm = OperativeTerritory.normalizeZoneName(rawZone);
    OperativeTerritory.assertOperative(norm);
    this.zoneName = norm;
    this.coordinates = typeof zoneOrCoords === 'object' && zoneOrCoords.lat && zoneOrCoords.lng
      ? { lat: zoneOrCoords.lat, lng: zoneOrCoords.lng }
      : null;
    Object.freeze(this);
  }

  static normalizeZoneName(zone: string): string {
    return String(zone || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  static assertOperative(normalizedZone: string): void {
    for (const forbidden of FORBIDDEN_NON_OPERATIVE_ZONES) {
      if (normalizedZone.includes(forbidden)) {
        throw new NonOperativeZoneError(
          normalizedZone,
          `[Violación Invariante Geoespacial] Zona No Operativa Prohibida: '${normalizedZone}'. Operación denegada en Mocoa/Amazonía/Zonas no autorizadas.`
        );
      }
    }
    const isApproved = VALID_CORRIDORS.some(c => normalizedZone.includes(c));
    if (!isApproved && normalizedZone !== '') {
      throw new NonOperativeZoneError(
        normalizedZone,
        `[Zona No Autorizada] '${normalizedZone}' no pertenece a los corredores aprobados (Medellín/Rionegro/Envigado/Sabaneta/Manizales/Pereira).`
      );
    }
  }
}
```

### 4.3. Pure Domain Entities
- **`ItineraryEvent`**: Models a medical consultation, lab test, surgery, flight, or hotel recovery session. Contains status transitions (`SCHEDULED` ➔ `EN_ROUTE` ➔ `ON_SITE` ➔ `COMPLETED`), actor assignments (`DRV`, `GUIA`, `NURSE`), location with `OperativeTerritory`, and validation flags (`requiresGpsCheckIn`, `requiresSignature`, `requiresReceipt`).
- **`DriverTransfer`**: Vehicle transfer with flat rate ($130.000 COP for Airport JMC, $35.000 COP intra-city), origin, destination, and waiting/nocturnal surcharges.
- **`CompanionShift`**: Hourly shifts with base rate ($15.500 COP/h), preparation allowance ($15.500 COP), and tiered meal subsidies:
  * 0–4 hours: No meal subsidy ($0)
  * 4–6 hours: Snack subsidy ($8.000 COP)
  * 6–8 hours: Standard meal subsidy ($25.000 COP)
  * 8–10 hours: Extended meal subsidy ($35.000 COP)
  * >10 hours: Full day meal subsidy ($45.000 COP)
- **`SettlementLedger`**: Single-Writer CQRS Aggregate calculating:
  $$\text{Net Balance} = (\sum \text{Out-of-Pocket Expenses} + \sum \text{Companion Fees} + \sum \text{Driver Transfers}) - \sum \text{Cash Advances}$$

---

## 5. Web Worker Actor Swarm Concurrency & Event Sourcing

```
[Presentation / UI Main Thread]
       |         |         |         | (MessageChannels 1-4)
       v         v         v         v
     [DRV]     [GUIA]   [NURSE]    [FIN]
     Driver    Guide    Nurse    Financial
     Actor     Actor    Actor    Auditor
       \         |       /          |
        \        |      /           v
      [Point-to-Point Mesh] ---> [Single-Writer Append]
                                    |
                                    v
                         [SHA-256 Hash Chain Ledger]
                                    |
                                    v
                         [Dexie.js IndexedDB Store]
```

### Actor Roles and Protocols
1. **`[DRV]` Driver Actor (`driver.worker.ts`)**:
   - Calculates transfer distance, assesses route feasibility, validates pickup points against `OperativeTerritory`, applies flat rates + surcharges, and dispatches `TRANSFER_CALCULATED`.
2. **`[GUIA]` Guide Actor (`guide.worker.ts`)**:
   - Computes billable accompaniment hours, applies preparation allowances ($15.500 COP) and meal subsidies based on shift duration, checks translation notes, and dispatches `SHIFT_AUDITED`.
3. **`[NURSE]` Nurse Actor (`nurse.worker.ts`)**:
   - Enforces clinical preparation invariants (fasting requirements, pre-op clearance, post-op drainage notes), signs off medical checklists, and dispatches `CLINICAL_VALIDATION_PASSED`.
4. **`[FIN]` Financial Auditor Actor (`financial.worker.ts`)**:
   - Acts as the **Single-Writer Ledger Auditor**. Subscribes to all financial events, executes exact `BigInt` ledger arithmetic, verifies the cryptographic hash chain, and dispatches `SETTLEMENT_RECONCILED` or `AUDIT_DISCREPANCY_FLAGGED`.

### Cryptographic Hash Chaining (`CryptoLedgerChainer.ts`)
Each ledger mutation produces an immutable event record:
$$\text{Hash}_n = \text{SHA-256}\left(\text{Index}_n \,\|\, \text{Timestamp}_n \,\|\, \text{Payload}_n \,\|\, \text{Hash}_{n-1}\right)$$
This guarantees zero tampering of financial records in offline IndexedDB storage.

---

## 6. Local-First Storage & PWA Architecture

### 6.1. Multi-Tier Storage Strategy
1. **Structured Relational Storage (Dexie.js / IndexedDB)**:
   - `reservations`: Key `reservationCode` (`RVA171`, `RVA282`, etc.).
   - `itinerary_events`: Key `id` (`ITN-RVA171-D1-01`), indexed by `reservationCode`, `date`, `status`.
   - `driver_transfers`: Key `id`, indexed by `reservationCode`, `driverActorId`.
   - `companion_shifts`: Key `id`, indexed by `reservationCode`, `guideActorId`.
   - `expense_items`: Key `id`, indexed by `reservationCode`, `category`.
   - `settlement_ledgers`: Key `reservationCode`.
   - `ledger_events`: Key `hash`, indexed by `reservationCode`, `index`.
2. **Binary Blob Storage (Dexie.js `blobs` table)**:
   - Stores raw receipt photos (`image/jpeg`, `image/png`) and digital signatures (`image/svg+xml`, `image/png`), decoupled from relational records and referenced by lightweight UUIDs.
3. **Storage Eviction Neutralization**:
   - Calls `navigator.storage.persist()` on app initialization to grant persistent storage privilege and neutralize Safari/WebKit 7-day eviction policies.

### 6.2. PWA & Offline Readiness
- `manifest.json`: Defines `standalone` display mode, high-res SVG and PNG icons, and `#0f172a` slate theme color.
- `sw.js`: Cache-First strategy for static JS/CSS bundles and WASM assets; Network-First with Cache Fallback for dynamic data.

---

## 7. Presentation Layer & UI/UX Design System

### 7.1. Aesthetic Philosophy (Google Calendar / Linear / Notion)
- **Palette**: Clean zinc/slate neutral backgrounds (`bg-zinc-50`, `border-zinc-200`, `text-zinc-900`, dark accents `bg-zinc-900`), zero garish neon gradients.
- **Typography**: Clean `Inter` font stack with `tabular-nums` for deterministic currency alignment.
- **Micro-Interactions**: Subtle border highlights on hover, 150ms ease-out modal transitions, tactile drag-and-drop ghost indicators.

### 7.2. Semantic Event Categorization Tokens

| Category | Tailored Purpose | Background & Border | Badge Text |
| :--- | :--- | :--- | :--- |
| **Flights & Arrivals** | Airport JMC / BOG pickups, flight tracking | `bg-sky-50 border-sky-200` | `text-sky-700` |
| **Clinical Appointments** | Consultations, surgeries, medical evaluations | `bg-indigo-50 border-indigo-200` | `text-indigo-700` |
| **Lab Diagnostics** | Echavarría blood draws, CT scans, biopsies | `bg-teal-50 border-teal-200` | `text-teal-700` |
| **Pharmacy & Caja Menor** | Cruz Verde / Pasteur medication purchases | `bg-emerald-50 border-emerald-200` | `text-emerald-700` |
| **Hotel & Recovery** | Lodging check-ins, room recovery, drainage | `bg-slate-100 border-slate-300` | `text-slate-700` |

### 7.3. Master-Detail Layout Architecture
```
+----------------------------------------------------------------------------------------------------+
|  [Logo] Medical Trip Calendar  | [RVA Selector: RVA171 Catia x5 v] | [Day|Week|Month|Agenda] | [Sync]   |
+----------------------------------------------------------------------------------------------------+
|  < Sep 2026 >  Today  [+ New Event]                 |  REAL-TIME SETTLEMENT DRAWER                  |
+-----------------------------------------------------+----------------------------------------------+
|  08:00  [ 08:00 - 10:30 | Clinica El Rosario ]      |  Reservation: RVA171 - Catia Rodrigues       |
|         Valoracion Pre-Anestesica [INDIGO]          |  Currency: COP | Status: IN_PROGRESS         |
|         Actors: [DRV-Ramon] [GUIA-Liliana]          |  ------------------------------------------  |
|                                                     |  (+) Out-of-Pocket Expenses:  $  210.000 COP |
|  11:00  [ 11:00 - 12:30 | Drogueria Cruz Verde ]    |  (+) Companion Shift Fees:    $  340.000 COP |
|         Compra Medicamentos Post-Op [EMERALD]       |  (+) Driver Transfers:        $  180.000 COP |
|         Actors: [GUIA-Liliana]                      |  (-) Cash Advances Received:  $2.000.000 COP |
|                                                     |  ==========================================  |
|  14:00  [ 14:00 - 16:30 | Lab Echavarria ]          |  NET BALANCE:                 -$1.270.000 COP|
|         Toma de Muestras de Sangre [TEAL]           |  (Favor Paciente / Saldo a Devolver)         |
|         Requires: [Check-in] [Receipt] [Signature]  |  ------------------------------------------  |
|                                                     |  [Scan Receipt OCR]  [Capture Signature]     |
+-----------------------------------------------------+----------------------------------------------+
```

---

## 8. The 4 Canonical Google Drive Archetypes Data

| Archetype Code | Patient Name | Country & Language | Specialty | Currency | Duration | Advance Deposit |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **`RVA171`** | Catia Rodrigues (x5 pax) | USA / Brazil (EN/PT) | Aesthetic & Bariatric Surgery | `COP` | 5 Days | `$2.000.000 COP` |
| **`RVA282`** | George Miller | Canada (EN) | Interventional Cardiology | `USD` | 8 Days | `$3,500.00 USD` |
| **`RVA341`** | Hendrik Hogenboom | Netherlands (NL/EN) | Ophthalmology & Maxillofacial | `COP` | 6 Days | `$5.000.000 COP` |
| **`RVA077`** | Rumai Al-Mansoor | UAE (EN/AR) | Complex Multidisciplinary Rehab | `COP` | 12 Days | `$15.000.000 COP` |

---

## 9. Build, Bundling & Automated Testing Configuration

### 9.1. `package.json` Dependencies Specification
```json
{
  "name": "medicaltrip-calendar-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "dexie": "^4.0.8",
    "lucide-react": "^0.439.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

### 9.2. `vite.config.ts` Specification
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
```

---

## 10. Implementation Plan & Work Packages (Next Steps)

1. **Package WP1 — Scaffolding & Configuration**:
   - Initialize `apps/medicaltrip_calendar_app` with `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, and `index.html`.
2. **Package WP2 — Pure Domain Core (Hexagonal Layer 1)**:
   - Implement `Money.ts`, `OperativeTerritory.ts`, `TimeSlot.ts`, `ItineraryEvent.ts`, `DriverTransfer.ts`, `CompanionShift.ts`, `ExpenseReceipt.ts`, and `SettlementLedger.ts`.
   - Write comprehensive unit tests in `tests/unit/` verifying all invariants, Mocoa fail-fast, and BigInt arithmetic.
3. **Package WP3 — Application Ports & Use Cases (Hexagonal Layer 2)**:
   - Implement repository ports, use cases (`ScheduleEvent`, `RescheduleMilestone`, `SettleItinerary`, `ProcessReceiptOCR`, `SignOffItinerary`), and DTOs.
4. **Package WP4 — Infrastructure Adapters & Worker Mesh (Hexagonal Layer 3)**:
   - Setup Dexie.js schemas, Blob storage, `navigator.storage.persist()`, 4 Web Worker subagents with `MessageChannels`, CRDT state synchronizer, and SHA-256 hash chaining.
5. **Package WP5 — Presentation Layer & Design System (Hexagonal Layer 4)**:
   - Build Google Calendar / Linear multi-view timeline (Day/Week/Month/Agenda), event editor drawer, real-time settlement drawer, receipt OCR modal, and digital signature canvas.
6. **Package WP6 — Automated E2E Verification & Delivery**:
   - Execute unit, integration, and E2E test suites, ensuring 100% PASS rate and complete operational readiness.
