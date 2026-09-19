# Project: Medical Trip Feature-First Hexagonal Architecture & Storage Decoupling

## Architecture
- **Paradigm**: Autonomous Feature-First Hexagonal Architecture (Ports & Adapters) with Dependency Inversion.
- **Shared Kernel (`src/core/`)**:
  - `core/domain`: Base booking entities (`PatientBooking`), value objects (`Money`, `OperativeTerritory`), domain errors (`DomainError`).
  - `core/ports`: Swappable persistence ports (`IStoragePort`, `IStoragePersistPort`, `IBlobStoragePort`) with ZERO external database dependencies.
  - `core/infrastructure`: Concrete storage drivers (`DexieStorageAdapter`, `InMemoryStorageAdapter`, `WebKitPersistAdapter`), `ServiceContainer` Composition Root, CRDT algorithms, and core dataset archetypes.
  - `core/auth`: Authentication context and views.
  - `core/i18n`: Caribbean multilingual dictionaries (Papiamento, Dutch, English, Spanish) and context.
  - `core/ui`: Shared design system primitives (`Button`, `Input`, `Modal`, `Select`, `Badge`, `LanguageSwitcher`).
- **Vertical Feature Slices (`src/features/`)**:
  - `features/settlement`: Financial reconciliation, receipts, OCR scanning, digital signature, PDF export, BigInt exact cent math.
  - `features/itinerary`: Calendar views (Month, Week, Day, Agenda), drag-and-drop, clinical pathways, event drawers, dual timezone indicators.
  - `features/medical-plan`: Clinic networks (Clofán, Cardio VID, CIMA) and care pathway plan views.
  - `features/logistics-fleet`: JMC airport arrival tracking, driver check-in, transfer logistics.
  - `features/companion-shifts`: Bilingual companion shift calculator ($15.500/h), prep allowance, tiered meal subsidies.
  - `features/onboarding`: Patient invitations, registration links, self-registration view.
  - `features/directory`: Operative staff roster, passenger list, and provider directories.
  - `features/swarm`: Web Worker actor swarm (driver, nurse, guide, financial auditor) and status indicators.
- **Strict Boundary Encapsulation**: Each feature encapsulates its own internal files behind a strict public `index.ts` API. Cross-feature access is ONLY permitted through this barrel.
- **Composition Root**: `ServiceContainer` handles all instantiation and dependency injection. UI and application layers consume storage strictly via `IStoragePort`.
- **Legacy Quarantine**: Non-tested root prototypes (`index.html`, `flows_interactive_dashboard.html`, `src/js/`, `apps/medicaltrip_calendar_app`, `apps/itinerarios_liquidacion_offline`) archived in top-level `archive/`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Archive Legacy Prototypes | Move 5 non-tested legacy items to `archive/` without breaking app build | M1 | R4 (DONE) |
| 2 | Pure `IStoragePort` Contract | Abstract all persistence behind strongly-typed port with 0 Dexie/IndexedDB/Supabase refs | M2 | R2 (DONE) |
| 3 | `ServiceContainer` Composition Root | Central dependency injection container for storage drivers and use cases | M2 | R2 (DONE) |
| 4 | Dexie & Supabase Adapters | Operational `DexieStorageAdapter` + clean ready `SupabaseStorageAdapter` stub | M2 | R2 (DONE) |
| 5 | Storage Inversion in UI | Eliminate direct Dexie instantiation in `PatientSelfRegistrationView.tsx` & `AppContext.tsx` | M2 | R2 (DONE) |
| 6 | Eliminate `(storagePort as any)` | Extend `IStoragePort` with `IBlobStoragePort` so signature, OCR, and PDF don't cast | M2 | R2 (DONE) |
| 7 | Shared Kernel `src/core/` | Establish `domain`, `ports`, `infrastructure`, `auth`, `i18n`, `ui` with public barrels | M3 | R1 |
| 8 | Vertical Feature Slices | Establish 8 autonomous feature packages in `src/features/*` behind public `index.ts` | M3 | R1 |
| 9 | Path Aliases & Backward Compat | Add `@features/*`, `@core/*` aliases; provide legacy re-export shims for tests | M3 | R1 |
| 10| Automated Architectural Guardrail | Vitest suite `tests/architecture_boundaries.test.ts` enforcing encapsulation & inversion | M4 | R3 |
| 11| Zero Regressions Verification | 100% pass on all 935 existing tests, 0 typecheck errors, production build pass | M5 | R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Archive Legacy Prototypes (R4) | Move root `index.html`, `flows_interactive_dashboard.html`, `src/js/`, `apps/medicaltrip_calendar_app`, `apps/itinerarios_liquidacion_offline` to `archive/` | none | DONE (`archive/` verified, root clean, 935 tests pass) |
| M2 | Swappable Storage Port & IoC (R2) | Implement `IStoragePort`, `ServiceContainer`, `SupabaseStorageAdapter` stub; resolve direct Dexie imports in UI | M1 | DONE (`IStoragePort` pure, `ServiceContainer` operational, UI decoupled, 977 tests pass) |
| M3 | Feature-First Vertical Slices (R1) | Migrate code into `src/core/` and `src/features/*` with public barrels; preserve backward-compatible test shims | M2 | DONE (8 vertical slices, shared kernel, public barrels, path aliases) |
| M4 | Architectural Test Guardrail (R3) | Implement `tests/architecture_boundaries.test.ts` Vitest suite validating 4 boundary invariants | M3 | DONE (5/5 architectural tests pass, mutation tested) |
| M5 | Final Regression & Forensic Audit (R5) | Full Vitest run (100% test pass), `tsc --noEmit` passes (0 errors), Forensic Integrity Audit CLEAN | M4 | DONE (111/111 test files, 982/982 tests pass 100%, tsc 0 errors, CLEAN audit) |

## Interface Contracts
### `IStoragePort` Contract
```typescript
export interface IStoragePort extends IBlobStoragePort {
  saveBooking(booking: PatientBooking): Promise<void>;
  getBooking(idOrCode: string): Promise<PatientBooking | null>;
  getAllBookings(): Promise<PatientBooking[]>;
  saveEvent(event: ItineraryEvent): Promise<void>;
  getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]>;
  getEventById(eventId: string): Promise<ItineraryEvent | null>;
  deleteEvent(eventId: string): Promise<void>;
  saveShift(shift: CompanionShift): Promise<void>;
  getShiftsByBooking(bookingId: string): Promise<CompanionShift[]>;
  saveTransfer(transfer: DriverTransfer): Promise<void>;
  getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]>;
  saveExpense(expense: ReceiptExpense): Promise<void>;
  getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]>;
  saveSettlement(settlement: SettlementLedger): Promise<void>;
  getSettlement(bookingId: string): Promise<SettlementLedger | null>;
  appendEventLog(entry: DomainEventRecord): Promise<void>;
  getEventStream(bookingId: string): Promise<DomainEventRecord[]>;
  clearAll(): Promise<void>;
}
```

### `ServiceContainer` Contract
```typescript
export class ServiceContainer {
  public static getStoragePort(): IStoragePort;
  public static setStoragePort(port: IStoragePort): void;
  public static setDriver(driver: 'dexie' | 'memory' | 'supabase'): void;
  public static getInvitationRepository(): IPatientInvitationRepository;
  public static getExportPort(): IExportPort;
  public static getOCRPort(): IOCRPort;
  public static getPersistPort(): IStoragePersistPort;
  public static reset(): void;
}
```

### Feature Public API Contract
Each feature directory under `src/features/<feature>/` MUST expose a public `index.ts`.
External modules may only import:
`import { ... } from '@/features/<feature>';`
Deep imports (`@/features/<feature>/internal/...`) are strictly forbidden and enforced by `architecture_boundaries.test.ts`.

## Code Layout
```
apps/medicaltrip_react_app/src/
├── core/
│   ├── domain/ (PatientBooking, Money, OperativeTerritory, DomainError)
│   ├── ports/ (IStoragePort, IBlobStoragePort, IStoragePersistPort)
│   ├── infrastructure/ (DexieStorageAdapter, InMemoryStorageAdapter, ServiceContainer, CRDT, data)
│   ├── auth/ (AuthContext, LoginView)
│   ├── i18n/ (LanguageContext, translations)
│   └── ui/ (Button, Input, Modal, Select, Badge, LanguageSwitcher)
├── features/
│   ├── settlement/ (domain, application, infrastructure, presentation, index.ts)
│   ├── itinerary/ (domain, application, presentation, index.ts)
│   ├── medical-plan/ (presentation, index.ts)
│   ├── logistics-fleet/ (domain, application, presentation, index.ts)
│   ├── companion-shifts/ (domain, presentation, index.ts)
│   ├── onboarding/ (domain, application, infrastructure, presentation, index.ts)
│   ├── directory/ (presentation, infrastructure, index.ts)
│   └── swarm/ (domain, infrastructure, presentation, index.ts)
├── App.tsx
├── main.tsx
└── index.css
```
