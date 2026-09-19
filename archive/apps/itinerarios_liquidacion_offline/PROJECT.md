# Project: Gestión de Itinerarios Médicos en Terreno y Liquidación Financiera Automática (Local-First Offline PWA)

## Architecture
The application is a standalone, 100% offline-first Progressive Web Application (PWA) built with a strictly decoupled Hexagonal Architecture (Ports and Adapters) and Domain-Driven Design (DDD).

```
                      ┌─────────────────────────────────────────────────────────┐
                      │    Field Master-Detail Split-View UI/UX (Main Thread)   │
                      │  Left: Interactive Day Itinerary, FSM, GPS, OCR, Canvas │
                      │  Right: Live Settlement Balance Bar, KPIs, 4 Archetypes  │
                      └────────────────────────────┬────────────────────────────┘
                                                   │
                         ┌─────────────────────────▼──────────────────────────┐
                         │      Actor Mesh Dispatcher & CRDT State Sync       │
                         └───────┬──────────────┬──────────────┬──────────────┘
                                 │              │              │
                    ┌────────────▼──┐   ┌───────▼──────┐   ┌───▼───────────┐
                    │ [DRV] Driver  │   │ [GUIA] Guide │   │ [NURSE] Nurse │
                    │ Web Worker    │   │ Web Worker   │   │ Web Worker    │
                    └────────────┬──┘   └───────┬──────┘   └───┬───────────┘
                                 │              │              │
                                 │      MessageChannels        │
                                 └──────────────┼──────────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │ [FIN] Financial Single│
                                    │ Writer Auditor Worker │
                                    └───────────┬───────────┘
                                                │
       ┌────────────────────────────────────────┼────────────────────────────────────────┐
       │                                        │                                        │
┌──────▼──────────────────────┐ ┌───────────────▼──────────────┐ ┌───────────────────────▼──────┐
│  Pure Domain Layer (Core)   │ │  Persistence Adapter (Tier 1)│ │  Blob Storage Adapter (Tier 2)│
│  - Immutable Money (BigInt) │ │  - Embedded SQLite Relational│ │  - Dexie.js (IndexedDB)       │
│  - OperativeTerritory (Fail)│ │  - CQRS Event Log / Schema   │ │  - Receipts, Signatures, PDFs │
│  - Entities & Value Objects │ │  - 0 Network Dependency      │ │  - Storage Persistence API    │
└─────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Hexagonal Domain Core & DDD Entities | Pure, framework-agnostic TypeScript domain entities (`ItineraryItem`, `SettlementLedger`, `ExpenseItem`, `CompanionShift`, `DriverTransfer`, `PatientSignature`). | M1 | ORIGINAL_REQUEST R1 |
| 2 | Value Objects with Fail-Fast Invariants | Immutable `OperativeTerritory` (strictly rejects non-operative zones like `MOCOA` with domain error) and `Money` (exact BigInt integer cents, 0 float error, quotient/remainder split). | M1 | ORIGINAL_REQUEST R1 |
| 3 | Abstract Repository & Gateway Ports | Abstract TypeScript port interfaces (`IStoragePort`, `IBlobStoragePort`, `IActorEventBusPort`, `IGeolocationPort`, `IOCRPort`, `ISignaturePort`). | M1 | ORIGINAL_REQUEST R1 |
| 4 | Embedded Relational Database (Tier 1) | Embedded SQLite / sql.js / wa-sqlite relational storage for structured itinerary records, appointment tables, and CQRS event streams. | M2 | ORIGINAL_REQUEST R2 |
| 5 | Binary Asset Storage via IndexedDB (Tier 2) | Dexie.js IndexedDB repository for storing heavy receipt image blobs, vector SVG/PNG digital signatures, and PDF documents referenced by UUID. | M2 | ORIGINAL_REQUEST R2 |
| 6 | Storage Persistence & Standalone A2HS (Tier 3) | `navigator.storage.persist()` invocation, Service Worker caching, and Web Manifest to neutralize WebKit/Safari 7-day eviction policies. | M2 | ORIGINAL_REQUEST R2 |
| 7 | Single-Writer CQRS Event Stream & Hash Chain | Deterministic append-only financial ledger recording every out-of-pocket taxi ride, companion hourly fee, and pharmacy expense with SHA-256 hash chaining. | M3 | ORIGINAL_REQUEST R3 |
| 8 | Automated Financial Settlement & Balance Audit | Real-time calculation of advances, out-of-pocket expenses, accounts payable/receivable, and automated audit balance sheets with 0 float error. | M3 | ORIGINAL_REQUEST R3 |
| 9 | Decentralized Actor Model in Web Workers | Autonomous subagents (`[DRV] Driver Agent`, `[GUIA] Bilingual Guide Agent`, `[NURSE] Nurse Agent`, `[FIN] Financial Auditor Agent`) executing in dedicated Web Workers. | M4 | ORIGINAL_REQUEST R4 |
| 10 | Point-to-Point MessageChannel Mesh & CRDT Sync | Peer-to-peer actor communication via `MessageChannel` ports and CRDT state synchronization guaranteeing 60fps main UI responsiveness. | M4 | ORIGINAL_REQUEST R4 |
| 11 | High-Density Field Split-View UI/UX | Ergonomic Master-Detail field interface (desktop split, mobile collapsible/drawer), >=48px touch targets, WCAG AAA sunlight contrast. | M5 | ORIGINAL_REQUEST R5 |
| 12 | Interactive Day-by-Day Itinerary Timeline | Multi-day schedule navigation with live FSM status transitions (`PROGRAMADO`, `EN_CAMINO`, `EN_SITIO`, `COMPLETADO`). | M5 | ORIGINAL_REQUEST R5 |
| 13 | Field Microinteractions Simulator | GPS check-in simulator with Haversine geofence validation, HTML5 patient signature canvas, and camera receipt OCR expense parser modal. | M5 | ORIGINAL_REQUEST R5 |
| 14 | Real-Time Settlement Visual Balance Bar & KPIs | Multi-segment proportional balance bar, dynamic hour-by-hour fee recalculations upon status transitions, and real-time financial KPI cards. | M5 | ORIGINAL_REQUEST R5 |
| 15 | 4 Real Google Drive Archetypes Switcher | Instant hydration and switching between `RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Hogenboom CES`, and `RVA077 Rumai Cirugía 12d`. | M5 | ORIGINAL_REQUEST R5 |
| 16 | Opaque-Box E2E Automated Test Suite (Tiers 1-4) | Comprehensive test harness executing >=50 test cases across Feature Coverage, Boundary/Corner Cases, Pairwise Combinations, and Real Archetype Scenarios. | E2E Track / M6 | ORIGINAL_REQUEST Acceptance |
| 17 | Adversarial Hardening & Forensic Integrity (Tier 5) | White-box stress tests, invariant verification, zero hardcoding, zero facade, and Forensic Auditor sign-off. | M6 | ORIGINAL_REQUEST Integrity |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track (Infra & Tiers 1-4) | Feature 16 (Test infrastructure, test runner, Tiers 1-4 tests, TEST_READY.md) | none | DONE |
| M1 | Hexagonal Architecture & Pure Domain Core | Features 1, 2, 3 (DDD entities, `Money` BigInt, `OperativeTerritory` fail-fast, Ports) | none | DONE |
| M2 | Local-First Multi-Tier Persistence Subsystem | Features 4, 5, 6 (SQLite embedded, Dexie IDB binary store, `storage.persist()`, A2HS) | M1 | DONE |
| M3 | Deterministic Financial Settlement & CQRS Ledger | Features 7, 8 (Single-Writer CQRS stream, hash chain, BigInt settlements, audit sheet) | M1, M2 | DONE |
| M4 | Decentralized Actor Model & Web Worker Concurrency | Features 9, 10 (Driver, Guide, Nurse, Fin Auditor Web Workers, MessageChannel, CRDT) | M1, M3 | DONE |
| M5 | Master-Detail Split-View UI/UX & Microinteractions | Features 11, 12, 13, 14, 15 (Timeline, FSM, GPS, Canvas, OCR, Balance Bar, 4 Archetypes) | M1-M4 | DONE |
| M6 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Features 16, 17 (Phase 1: Pass 100% E2E tests Tiers 1-4; Phase 2: Tier 5 Challenger stress test & Forensic Audit CLEAN) | E2E, M1-M5 | DONE |

## Interface Contracts
### Domain Core (M1) ↔ Persistence & Infrastructure (M2/M3)
- `IStoragePort`: `saveItinerary(item: ItineraryItem): Promise<void>`, `getItinerary(id: string): Promise<ItineraryItem | null>`, `appendEvent(event: LedgerEvent): Promise<void>`, `getEventStream(aggregateId: string): Promise<LedgerEvent[]>`.
- `IBlobStoragePort`: `saveBlob(id: string, mimeType: string, data: Blob | Uint8Array): Promise<string>`, `getBlob(id: string): Promise<Blob | null>`, `deleteBlob(id: string): Promise<void>`.
- `Money`: Immutable object `{ amountInCents: bigint, currency: 'COP' | 'USD' }`, methods: `add()`, `subtract()`, `multiply()`, `split(parts: number): Money[]`, `format(): string`, `toJSON(): string`.
- `OperativeTerritory`: Pure validation function & Value Object. Validates `{ lat, lng, zoneName }`. Throws `DomainError("Violación de Invariante Geoespacial: Zona no operativa [MOCOA]")` for non-operative zones.

### Actors (M4) ↔ Main UI Thread (M5)
- Point-to-point `MessagePort` channels transferred via `postMessage`.
- Actor Command Message: `{ type: 'ACTOR_COMMAND', actorId: string, action: string, payload: any, timestamp: string }`.
- Actor State Broadcast: `{ type: 'ACTOR_STATE_UPDATE', actorId: string, crdtState: any, lastEventId: string }`.
- Financial Single-Writer: Only `[FIN]` worker writes to `IStoragePort` ledger. Other actors send `PROPOSE_EXPENSE` command to `[FIN]`.

### Storage / Actors ↔ Web UI (M5)
- UI subscribes to reactive state store hydrated from SQLite/Dexie and updated via CRDT actor events.
- Global Automation Bridge: `window.MedicalTripFieldApp` exposing `{ getActiveArchetype(), setActiveArchetype(code), getItinerary(), transitionStatus(id, newStatus), submitCheckIn(id, coords), submitSignature(id, blob), submitExpense(expense), getSettlementBalance(), getAuditReport() }`.

## Code Layout
```
/Users/miyo123/projects/medicaltrip/apps/itinerarios_liquidacion_offline/
├── index.html                                    # Main Master-Detail Split-View PWA Entry Point
├── package.json                                  # NPM manifest & test scripts
├── manifest.json                                 # PWA A2HS Web App Manifest
├── service-worker.js                             # Offline caching service worker (Cache API)
├── PROJECT.md                                    # Project architecture, features, milestones
├── TEST_INFRA.md                                 # E2E test suite architecture & specifications
├── TEST_READY.md                                 # Test suite publication signal
├── assets/
│   ├── css/
│   │   ├── variables.css                         # CSS design tokens, WCAG AAA colors, touch sizes
│   │   ├── base.css                              # Reset and typography
│   │   ├── layout.css                            # Master-Detail split-view grid / flex layout
│   │   ├── timeline.css                          # Itinerary timeline and status badges
│   │   ├── balance-bar.css                       # Real-time settlement visual balance bar
│   │   └── modals.css                            # GPS check-in, signature canvas, OCR modal
│   └── icons/                                    # PWA icons (192x192, 512x512)
├── src/
│   ├── domain/                                   # Pure Domain Layer (0 framework dependencies)
│   │   ├── entities/
│   │   │   ├── itinerary-item.js
│   │   │   ├── expense-item.js
│   │   │   ├── companion-shift.js
│   │   │   ├── driver-transfer.js
│   │   │   ├── patient-signature.js
│   │   │   └── settlement-ledger.js
│   │   ├── value-objects/
│   │   │   ├── money.js                          # BigInt integer cents Money pattern
│   │   │   ├── operative-territory.js            # Geoespacial fail-fast invariant
│   │   │   ├── location-coordinate.js
│   │   │   └── actor-event.js
│   │   └── ports/
│   │       ├── storage-port.js
│   │       ├── blob-storage-port.js
│   │       ├── actor-event-bus-port.js
│   │       ├── geolocation-port.js
│   │       └── ocr-port.js
│   ├── infrastructure/                           # Multi-Tier Storage & Hardware Adapters
│   │   ├── storage/
│   │   │   ├── sqlite-storage-adapter.js         # Embedded SQLite relational adapter
│   │   │   ├── dexie-blob-storage-adapter.js     # Dexie.js IndexedDB binary store
│   │   │   └── storage-persistence-manager.js    # navigator.storage.persist() API
│   │   ├── hardware/
│   │   │   ├── simulated-geolocation-adapter.js  # GPS simulation & Haversine geofence
│   │   │   ├── mock-ocr-adapter.js               # Simulated camera OCR scanner
│   │   │   └── canvas-signature-adapter.js       # HTML5 digital signature canvas
│   │   └── data/
│   │       └── archetypes-data.js                # 4 Canonical Drive Archetypes Fixtures
│   ├── application/                              # CQRS Handlers & Financial Settlement
│   │   ├── commands/
│   │   │   ├── transition-itinerary-status.js
│   │   │   ├── record-expense-command.js
│   │   │   └── capture-signature-command.js
│   │   ├── queries/
│   │   │   ├── get-itinerary-query.js
│   │   │   └── get-settlement-balance-query.js
│   │   └── settlement/
│   │       ├── settlement-calculator.js          # Exact BigInt multi-day settlement engine
│   │       └── ledger-hash-chain.js              # SHA-256 immutable CQRS event stream
│   ├── actors/                                   # Web Worker Actor Model
│   │   ├── actor-mesh-controller.js              # Main-thread coordinator & MessageChannels
│   │   ├── crdt-state-sync.js                    # Conflict-free state synchronization
│   │   └── workers/
│   │       ├── driver-actor.worker.js            # [DRV] Ramón Rosero Driver Agent
│   │       ├── guide-actor.worker.js             # [GUIA] Bilingual Companion Agent
│   │       ├── nurse-actor.worker.js             # [NURSE] Nurse Agent
│   │       └── financial-auditor.worker.js       # [FIN] Single-Writer Financial Auditor Agent
│   └── ui/                                       # UI Components & State Management
│       ├── state/
│       │   └── app-store.js                      # Reactive local store
│       └── components/
│           ├── itinerary-timeline.js             # Left pane day-by-day interactive timeline
│           ├── settlement-balance-bar.js         # Right pane balance bar & KPI cards
│           ├── archetype-switcher.js             # 4 Archetype selector tabs
│           ├── gps-checkin-modal.js              # GPS simulation modal with radius feedback
│           ├── receipt-ocr-modal.js              # Receipt upload / camera OCR preview
│           └── signature-pad-modal.js            # Digital signature canvas pad
└── tests/
    ├── e2e_test_runner.js                        # Standalone automated test runner
    ├── tier1_feature_coverage.test.js            # >=5 tests per feature (Features 1-15)
    ├── tier2_boundary_corner.test.js             # >=5 boundary tests per feature (Mocoa, BigInt limits)
    ├── tier3_cross_feature.test.js               # Pairwise actor/storage/finance combinations
    ├── tier4_real_world_archetypes.test.js       # End-to-end multi-day simulations for 4 archetypes
    └── tier5_adversarial_stress.test.js          # White-box stress tests & invariant audits
```
