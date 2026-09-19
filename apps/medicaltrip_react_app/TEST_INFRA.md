# Medical Trip Colombia S.A.S. — Test Infrastructure & 4-Tier Methodology (TEST_INFRA)

## 1. Test Philosophy & Core Principles

The Medical Trip Colombia S.A.S. Web Application (`apps/medicaltrip_react_app`) operates in high-intensity medical tourism logistics across Medellín and the Caribbean basin (Curazao, Aruba, Bonaire). The testing infrastructure enforces four cardinal invariants:

1. **Opaque-Box Requirement-Driven Verification**: Every test derives directly from authoritative business requirements (`ORIGINAL_REQUEST.md`, `PROJECT.md`), testing observable behaviors and interface contracts rather than transient implementation internals.
2. **Zero Floating-Point Drift Tolerance**: All financial operations execute in BigInt integer cents (`Money` Value Object), guaranteeing 0 rounding discrepancies across multi-day aggregations.
3. **Fail-Fast Invariant Enforcement**: Non-operative geographic territories (e.g. Mocoa, Putumayo) immediately trigger domain-level rejections.
4. **Empirical Fidelity Across 4 Caribbean Archetypes**: Automated verification of real-world operational datasets (`RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Eduard CES`, `RVA077 Alejandra Rumai 12d`).
5. **Dual-Paradigm Responsive Layout Integrity**: Deterministic rendering and interaction verification across Desktop (>=1024px), Tablet (768px–1023px), and Mobile (<768px, specifically 375px) viewports with strict 44x44px touch target compliance.

---

## 2. The 4-Tier Testing Methodology Matrix

```
+-----------------------------------------------------------------------------------------------+
| 4-TIER TESTING ARCHITECTURE MATRIX                                                            |
+--------+--------------------------+--------------------------------------+--------------------+
| Tier   | Scope & Level            | Focus Areas                          | Target Suites      |
+--------+--------------------------+--------------------------------------+--------------------+
| Tier 1 | Feature Coverage         | Pure Domain Entities, Value Objects, | domain/*,          |
|        | (Unit & Component)       | CQRS Use Cases, Storage Adapters,    | application/*,     |
|        |                          | UI Components, Calendar Views        | presentation/*     |
+--------+--------------------------+--------------------------------------+--------------------+
| Tier 2 | Boundary & Corner        | Invariant Limits, Territory Fencing, | tier2/*,           |
|        | (Stress & Invariants)    | Extreme Amounts, CRDT Concurrency,   | adversarial/*      |
|        |                          | Tampered Cryptographic Hashes        |                    |
+--------+--------------------------+--------------------------------------+--------------------+
| Tier 3 | Cross-Feature            | Pairwise Multi-Component Integration,| tier3/*,           |
|        | (Reactive Workflows)     | Event Sourcing Ledger Synchronization| e2e/*              |
|        |                          | OCR ➔ Ledger ➔ Signature Flows       |                    |
+--------+--------------------------+--------------------------------------+--------------------+
| Tier 4 | Real-World Workloads     | Full Multi-Day Patient Journeys for  | tier4/*            |
|        | (4 Drive Archetypes)     | RVA171, RVA282, RVA341, RVA077       |                    |
+--------+--------------------------+--------------------------------------+--------------------+
| Pres.  | Multi-Device Layout      | 375px Mobile, 768px Tablet, 1280px   | tests/presentation/|
| Matrix | Ergonomics & Touch       | Desktop, 1920px Widescreen, 44px     | ResponsiveLayout*, |
|        | Verification             | Touch Targets, Retina Signature Canvas| MobileErgonomics*, |
|        |                          |                                      | TouchInteractions* |
+--------+--------------------------+--------------------------------------+--------------------+
```

---

## 3. Feature Inventory & Test Mapping

| Feature ID | Feature Name | Specification Source | Tier 1 (Unit) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Archetypes) | Presentation Matrix |
|:----------:|:-------------|:---------------------|:-------------:|:-----------------:|:--------------:|:-------------------:|:-------------------:|
| **F01** | `Money` VO in Native BigInt Cents | ORIGINAL_REQUEST §R2 | `Money.test.ts` (9) | `BoundaryExtremeAmounts.test.ts` (7) | `CrossFeature.test.ts` (1) | `Archetype*.test.ts` (20) | `SettlementBar.test.tsx` (6) |
| **F02** | `OperativeTerritory` Fail-Fast Invariant | ORIGINAL_REQUEST §R2 | `OperativeTerritory.test.ts` (6) | `DomainInvariantsAdversarial.test.ts` (100) | `EventDrawer.test.tsx` (5) | `Archetype*.test.ts` (20) | `ResponsiveLayoutMatrix.test.tsx` |
| **F03** | Domain Entities (PAX, DRV, GUIA, Ledger) | ORIGINAL_REQUEST §R2 | `domain/*.test.ts` (12) | `CQRSSettlementsAdversarial.test.ts` (9) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `ArchetypeSwitcher.test.tsx` (5) |
| **F04** | CQRS Use Cases (Create, Settle, Reconcile) | ORIGINAL_REQUEST §R2 | `application/*.test.ts` (14) | `CQRSUseCases.test.ts` (11) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `EventDrawer.test.tsx` (5) |
| **F05** | Local-First Storage & Dexie IndexedDB | ORIGINAL_REQUEST §R2 | `DexieStorageAdapter.test.ts` (7) | `BoundaryCorruptedSha256.test.ts` (5) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `ArchetypeSwitcher.test.tsx` (5) |
| **F06** | Web Worker Actor Swarms & CRDT | ORIGINAL_REQUEST §R4 | `ActorSwarm.test.ts` (21) | `BoundaryActorCRDTRace.test.ts` (5) | `AdversarialSwarmCrdtLedger.test.ts` (31) | `FullOfflineJourney.test.ts` (1) | `SwarmStatus.test.tsx` (5) |
| **F07** | SHA-256 Cryptographic Chaining | ORIGINAL_REQUEST §R4 | `Sha256LedgerChain.test.ts` (13) | `BoundaryCorruptedSha256.test.ts` (5) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `SettlementBar.test.tsx` (6) |
| **F08** | Multi-View Calendar Engine (Month/Week/Day/Agenda) | ORIGINAL_REQUEST §R3 | `CalendarViews.test.tsx` (8) | `BoundaryCalendarSnapping.test.ts` (7) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `ResponsiveLayoutMatrix.test.tsx`, `MobileErgonomics.test.tsx` |
| **F09** | Slide-Over Event Detail Drawer & Validation | ORIGINAL_REQUEST §R3 | `EventDrawer.test.tsx` (5) | `DomainInvariantsAdversarial.test.ts` (100) | `CrossFeature.test.ts` (1) | `Archetype*.test.ts` (20) | `ResponsiveLayoutMatrix.test.tsx`, `MobileErgonomics.test.tsx` |
| **F10** | Docked Real-Time Settlement Balance Bar | ORIGINAL_REQUEST §R3 | `SettlementBar.test.tsx` (6) | `FinancialMathAdversarial.test.ts` (16) | `CrossFeature.test.ts` (1) | `Archetype*.test.ts` (20) | `TouchInteractions.test.tsx`, `MobileErgonomics.test.tsx` |
| **F11** | Pharmacy Receipt OCR Scanner Modal | ORIGINAL_REQUEST §R3 | `ReceiptOcrModal.test.tsx` (4) | `SimulatedReceiptOCRAdapter.test.ts` (5) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `TouchInteractions.test.tsx` |
| **F12** | High-DPI Retina Digital Signature Pad | ORIGINAL_REQUEST §R3 | `DigitalSignaturePad.test.tsx` (5) | `SignOffItineraryUseCase.test.ts` (1) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `TouchInteractions.test.tsx` |
| **F13** | 4 Real Caribbean Drive Archetypes Loader | ORIGINAL_REQUEST §R3 | `ArchetypeSwitcher.test.tsx` (5) | `LoadArchetypeUseCase.test.ts` (3) | `FullOfflineJourney.test.ts` (1) | `Archetype*.test.ts` (20) | `MobileErgonomics.test.tsx` |
| **F14** | Responsive Layout Matrix (375px/768px/1280px/1920px) | ORIGINAL_REQUEST §R5 | `ResponsiveLayoutMatrix.test.tsx` | `ResponsiveLayoutMatrix.test.tsx` | `ResponsiveLayoutMatrix.test.tsx` | `ResponsiveLayoutMatrix.test.tsx` | `ResponsiveLayoutMatrix.test.tsx` |
| **F15** | Mobile Ergonomics (Navigation, FAB, Carousel) | ORIGINAL_REQUEST §R1 | `MobileErgonomics.test.tsx` | `MobileErgonomics.test.tsx` | `MobileErgonomics.test.tsx` | `MobileErgonomics.test.tsx` | `MobileErgonomics.test.tsx` |
| **F16** | Touch Interactions (44px Targets, Pointer, Signature) | ORIGINAL_REQUEST §R4 | `TouchInteractions.test.tsx` | `TouchInteractions.test.tsx` | `TouchInteractions.test.tsx` | `TouchInteractions.test.tsx` | `TouchInteractions.test.tsx` |

---

## 4. Multi-Device Layout Verification Matrix

```
+-----------------------------------------------------------------------------------------------+
| RESPONSIVE BREAKPOINT TEST MATRIX                                                             |
+-------------------+---------------+-----------------------------------------------------------+
| Viewport          | Resolution    | Verification Criteria                                     |
+-------------------+---------------+-----------------------------------------------------------+
| Mobile            | 375 x 667     | - Zero horizontal scroll overflow (overflow-hidden)       |
|                   |               | - Touch-optimized header & horizontal patient carousel    |
|                   |               | - Responsive navigation & 44x44px minimum tap targets     |
|                   |               | - Docked settlement bar adapts gracefully                 |
+-------------------+---------------+-----------------------------------------------------------+
| Tablet            | 768 x 1024    | - Fluid 2-column or adaptive grid layout                  |
|                   |               | - Calendar view switcher tabs accessible                  |
|                   |               | - Right-hand drawer properly sized without truncation     |
|                   |               | - Settlement formula line wraps cleanly                   |
+-------------------+---------------+-----------------------------------------------------------+
| Desktop           | 1280 x 800    | - High-density master-detail layout                       |
|                   |               | - Full 7-column week view with time gutter (06:00-22:00)  |
|                   |               | - Live settlement formula + progress bar + action buttons |
|                   |               | - Right slide-over drawer (max-w-lg)                      |
+-------------------+---------------+-----------------------------------------------------------+
| Widescreen (FHD)  | 1920 x 1080   | - max-w-7xl content containment                           |
|                   |               | - No visual stretching, clean centered alignments         |
|                   |               | - Optimal whitespace distribution and crisp typography    |
+-------------------+---------------+-----------------------------------------------------------+
```

---

## 5. Test Execution Instructions

### Complete Automated Test Suite:
```bash
export PATH="/Users/miyo123/projects/medicaltrip/.bin/bin:$PATH" && npm test
```

### Typecheck & Production Build:
```bash
export PATH="/Users/miyo123/projects/medicaltrip/.bin/bin:$PATH" && npm run typecheck
export PATH="/Users/miyo123/projects/medicaltrip/.bin/bin:$PATH" && npm run build
```

---

## 6. Continuous Verification & Quarantine Rules

- **Zero Tolerance Policy**: Any test failure in any tier immediately halts release progression.
- **Flakiness Elimination**: Pure deterministic timers, mock storage adapters (`InMemoryStorageAdapter`, `fake-indexeddb`), and explicit DOM `waitFor` conditions eliminate race conditions.
- **Privacy Enforcement**: All mock and synthetic test fixtures sanitize patient identifiers to standard format (`ENT-PAX-XXXX`) with 0 real PII/PHI leakage.
