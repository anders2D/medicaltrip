# Project: Medical Trip Calendar & Settlement App (Hexagonal DDD & Local-First)

## Architecture
Strictly decoupled Hexagonal Architecture (Ports & Adapters) with Local-First offline persistence and Web Worker concurrency.

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                   |
|   React 19 + TypeScript + Vite + Tailwind CSS (Google Calendar / Linear Tokens)   |
|   Multi-View Calendar (Day/Week/Month/Agenda) | Master-Detail Split Pane          |
|   Live Settlement Drawer | Receipt OCR Modal | Signature Canvas | Archetype Bar   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              APPLICATION LAYER                                    |
|   Use Cases: ScheduleEvent, RescheduleMilestone, SettleItinerary,                 |
|              ProcessReceiptOCR, SignOffItinerary, SwitchArchetype                 |
|   Ports (Interfaces): IItineraryRepository, ILedgerRepository,                    |
|                       IActorSwarmBus, IReceiptOCRAdapter, IStoragePersistAdapter   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                DOMAIN LAYER                                       |
|   0 External Dependencies | Pure TypeScript Entities & Value Objects              |
|   - Money (BigInt integer cents, zero IEEE-754 floats, rounding invariants)       |
|   - OperativeTerritory (Fail-fast validation: allowed vs forbidden like Mocoa)    |
|   - Entities: Patient (ENT-PAX), Booking (RVA/CTZ), Driver (DRV), Guide (GUIA),   |
|               Clinic/Lab (CLINIC/LAB), Hotel (HOTEL), ItineraryMilestone, Ledger  |
+-----------------------------------------------------------------------------------+
                                         ▲
                                         │ (Implements Ports)
+-----------------------------------------------------------------------------------+
|                            INFRASTRUCTURE LAYER                                   |
|   - Local Storage: Dexie.js (IndexedDB) for CQRS events & binary assets           |
|   - Storage Persistence: navigator.storage.persist() + PWA Service Worker Cache   |
|   - Concurrency: Actor Swarm Web Workers ([DRV], [GUIA], [NURSE], [FIN])           |
|                  with MessageChannel, CRDT sync, and SHA-256 cryptographic chain  |
|   - Hardware Adapters: HTML5 Retina Canvas Signature, OCR Parsing Engine          |
+-----------------------------------------------------------------------------------+
```

## Feature Inventory
Every feature from the Survey phase is assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | BigInt Money Pattern | Exact integer cents math eliminating all float errors | M1 | ORIGINAL_REQUEST §R3 |
| F02 | OperativeTerritory Validation | Fail-fast invariant rejecting non-operative zones like Mocoa | M1 | ORIGINAL_REQUEST §R1, §R4 |
| F03 | Core Domain Model Entities | ENT-PAX, RVA, CTZ, DRV, GUIA, CLINIC, LAB, HOTEL models | M1 | ORIGINAL_REQUEST §R2 |
| F04 | Financial Settlement Ledger Domain | Formula: Out-of-Pocket + Guide Fees + Taxis - Advances = Net | M1 | ORIGINAL_REQUEST §R3 |
| F05 | Application Ports & Use Cases | Use cases for event scheduling, settlement, sign-off | M1 | ORIGINAL_REQUEST §R1 |
| F06 | Dexie.js Local-First Persistence | IndexedDB relational store + binary blobs with persistent storage | M2 | ORIGINAL_REQUEST §R4 |
| F07 | Web Worker Actor Swarm | Subagents [DRV], [GUIA], [NURSE], [FIN] on MessageChannel | M2 | ORIGINAL_REQUEST §R5 |
| F08 | CRDT & SHA-256 Ledger Chaining | Decentralized conflict resolution and cryptographic verification | M2 | ORIGINAL_REQUEST §R5 |
| F09 | PWA & Service Worker Engine | 100% offline standalone operation with cache-first strategy | M2 | ORIGINAL_REQUEST §R4 |
| F10 | Human-First Design System Tokens | Zinc/slate neutrals, Inter typography, 48px touch targets | M3 | ORIGINAL_REQUEST §R1 |
| F11 | Multi-View Calendar Engine | Day, Week, Month, Agenda views with zero layout shifts | M3 | ORIGINAL_REQUEST §R1 |
| F12 | Direct Milestone Manipulation | Drag-to-reschedule (15-min snap), duration resize, click create | M3 | ORIGINAL_REQUEST §R1 |
| F13 | Semantic Category Badge System | Sky Blue, Indigo, Teal, Emerald/Amber, Warm Slate badges | M3 | ORIGINAL_REQUEST §R1 |
| F14 | Master-Detail Event Drawer | 60/40 split view, provider search, staff assignment, live delta | M3 | ORIGINAL_REQUEST §R1 |
| F15 | Live Balance Drawer & Visual Bar | Real-time proportional balance bar with BigInt cents | M4 | ORIGINAL_REQUEST §R3 |
| F16 | Pharmacy Receipt OCR Uploader | Itemized expense parser with instant settlement deduction | M4 | ORIGINAL_REQUEST §R3 |
| F17 | Digital Signature Canvas | Retina touch/mouse canvas for patient legal sign-off | M4 | ORIGINAL_REQUEST §R3 |
| F18 | GPS Check-in Simulator | Haversine distance calculator with Mocoa invariant rejection | M4 | ORIGINAL_REQUEST §R1 |
| F19 | 4 Drive Archetypes Data Loader | High-fidelity loader for RVA171, RVA282, RVA341, RVA077 | M4 | ORIGINAL_REQUEST §AC |
| F20 | Comprehensive E2E Verification | 100% test pass rate across unit, integration, and E2E journeys | M5 | ORIGINAL_REQUEST §AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Domain Core & Deterministic Financial Engine | Pure DDD entities, BigInt Money, OperativeTerritory fail-fast, Settlement Ledger, Application Ports | none | DONE |
| M2 | Local-First Storage & Web Worker Multi-Agent Swarm | Dexie.js schema, PWA Service Worker, Web Workers ([DRV],[GUIA],[NURSE],[FIN]) with MessageChannel & SHA-256 chain | M1 | DONE |
| M3 | Google Calendar / Linear-Grade Consumer UI/UX | Tailwind Zinc/Slate design tokens, Multi-View Calendar (Day/Week/Month/Agenda), Drag-and-Drop, Event Drawer | M1, M2 | DONE |
| M4 | Field Productivity Tools & 4 Archetypes Loader | Live Balance Drawer, Receipt OCR modal, Digital Signature Canvas, GPS Check-in, 4 Drive Archetypes | M1, M2, M3 | DONE |
| M5 | Final Milestone: 100% E2E Test Suite & Adversarial Hardening | Pass 100% E2E test suite (Tiers 1-4) and adversarial coverage hardening (Tier 5) | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Domain ↔ Application (Ports)
- `IItineraryRepository`: `getById(id: string)`, `save(itinerary: Itinerary)`, `list()`, `delete(id: string)`
- `ILedgerRepository`: `getLedger(itineraryId: string)`, `appendTransaction(tx: FinancialTransaction)`, `calculateBalance(itineraryId: string): BalanceSheet`
- `IActorSwarmBus`: `postMessageToAgent(agentType: AgentRole, message: SwarmMessage)`, `subscribe(agentType: AgentRole, handler: (msg: SwarmMessage) => void)`
- `IReceiptOCRService`: `extractReceiptData(blob: Blob): Promise<ParsedReceipt>`
- `ISignatureStorageService`: `saveSignature(itineraryId: string, signatureDataUrl: string): Promise<string>`

### Application ↔ Presentation (State & Hooks)
- `useItineraryStore`: reactive Zustand / custom store exposing current itinerary, selected milestone, view mode (`day`|`week`|`month`|`agenda`), filters, and active archetype.
- `useSettlementBalance`: reactive hook recalculating BigInt net balance on any milestone or expense change.
- `useActorSwarm`: hook connecting main thread UI to the 4 Web Worker subagents with live status badges.

## Code Layout
```
apps/medicaltrip_calendar_app/
├── public/
│   ├── manifest.json
│   ├── favicon.svg
│   └── sw.js
├── src/
│   ├── domain/
│   │   ├── values/
│   │   │   ├── Money.ts
│   │   │   ├── OperativeTerritory.ts
│   │   │   └── Coordinates.ts
│   │   ├── entities/
│   │   │   ├── Patient.ts
│   │   │   ├── Booking.ts
│   │   │   ├── Driver.ts
│   │   │   ├── Guide.ts
│   │   │   ├── Provider.ts
│   │   │   ├── Hotel.ts
│   │   │   ├── ItineraryMilestone.ts
│   │   │   └── FinancialTransaction.ts
│   │   ├── aggregates/
│   │   │   └── MedicalItinerary.ts
│   │   └── errors/
│   │       └── DomainErrors.ts
│   ├── application/
│   │   ├── ports/
│   │   │   ├── IItineraryRepository.ts
│   │   │   ├── ILedgerRepository.ts
│   │   │   ├── IActorSwarmBus.ts
│   │   │   └── IReceiptOCRService.ts
│   │   └── usecases/
│   │       ├── ScheduleMilestoneUseCase.ts
│   │       ├── RescheduleMilestoneUseCase.ts
│   │       ├── CalculateSettlementUseCase.ts
│   │       ├── ProcessReceiptOCRUseCase.ts
│   │       ├── SignOffItineraryUseCase.ts
│   │       └── LoadArchetypeUseCase.ts
│   ├── infrastructure/
│   │   ├── storage/
│   │   │   ├── DexieMedicalTripDB.ts
│   │   │   ├── DexieItineraryRepository.ts
│   │   │   └── StoragePersistAdapter.ts
│   │   ├── workers/
│   │   │   ├── driverWorker.ts
│   │   │   ├── guideWorker.ts
│   │   │   ├── nurseWorker.ts
│   │   │   ├── financialAuditorWorker.ts
│   │   │   └── WebWorkerSwarmBus.ts
│   │   ├── ocr/
│   │   │   └── ItemizedReceiptOCRAdapter.ts
│   │   └── archetypes/
│   │       ├── rva171_catia_data.ts
│   │       ├── rva282_george_data.ts
│   │       ├── rva341_eduard_data.ts
│   │       ├── rva077_rumai_data.ts
│   │       └── ArchetypeRegistry.ts
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── MasterDetailContainer.tsx
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarHeader.tsx
│   │   │   │   ├── DayView.tsx
│   │   │   │   ├── WeekView.tsx
│   │   │   │   ├── MonthView.tsx
│   │   │   │   ├── AgendaView.tsx
│   │   │   │   ├── MilestoneCard.tsx
│   │   │   │   └── DragDropGhost.tsx
│   │   │   ├── drawers/
│   │   │   │   ├── EventDetailDrawer.tsx
│   │   │   │   ├── LiveBalanceDrawer.tsx
│   │   │   │   └── SwarmStatusDrawer.tsx
│   │   │   ├── modals/
│   │   │   │   ├── ReceiptOCRModal.tsx
│   │   │   │   ├── DigitalSignatureModal.tsx
│   │   │   │   └── ArchetypeSelectorModal.tsx
│   │   │   └── common/
│   │   │       ├── CategoryBadge.tsx
│   │   │       ├── MoneyDisplay.tsx
│   │   │       └── InvariantErrorAlert.tsx
│   │   ├── hooks/
│   │   │   ├── useItinerary.ts
│   │   │   ├── useSettlementBalance.ts
│   │   │   └── useActorSwarm.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── tests/
    ├── unit/
    │   ├── domain/
    │   └── application/
    ├── integration/
    │   ├── storage/
    │   └── workers/
    └── e2e/
        ├── calendar_interactions.spec.ts
        ├── financial_settlement.spec.ts
        └── archetypes_verification.spec.ts
```
