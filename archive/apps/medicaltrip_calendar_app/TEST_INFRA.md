# E2E Test Infra: Medical Trip Calendar & Settlement App

## Test Philosophy
- Opaque-box, requirement-driven, deterministic.
- Zero floating-point rounding tolerance.
- Fail-fast validation of domain invariants (e.g. Mocoa non-operative rejection).
- 4 Real-world Drive Archetypes fidelity verification (`RVA171`, `RVA282`, `RVA341`, `RVA077`).
- Methodology: 5-Tier Strategy (Category-Partition, Boundary Value Analysis, Pairwise Combinations, Real-World Scenarios, Adversarial Hardening).

## Feature Inventory & Test Mapping
| # | Feature | Requirement Source | Tier 1 (Unit/Feature) | Tier 2 (Boundaries) | Tier 3 (Pairwise) | Tier 4 (Workloads) |
|---|---------|-------------------|:--------------------:|:------------------:|:-----------------:|:------------------:|
| F01 | BigInt Money Math | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | ✓ | ✓ |
| F02 | OperativeTerritory Invariants | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F03 | Domain Entities (PAX, DRV, GUIA, etc.) | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ | ✓ |
| F04 | Financial Settlement Ledger | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | ✓ | ✓ |
| F05 | Application Use Cases | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F06 | Dexie.js Local-First Persistence | ORIGINAL_REQUEST §R4 | 5 tests | 5 tests | ✓ | ✓ |
| F07 | Web Worker Actor Swarm | ORIGINAL_REQUEST §R5 | 5 tests | 5 tests | ✓ | ✓ |
| F08 | CRDT & Cryptographic Chaining | ORIGINAL_REQUEST §R5 | 5 tests | 5 tests | ✓ | ✓ |
| F09 | PWA & Service Worker Offline | ORIGINAL_REQUEST §R4 | 5 tests | 5 tests | ✓ | ✓ |
| F10 | Design System & Token Rendering | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F11 | Multi-View Calendar Engine | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F12 | Direct Milestone Manipulation | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F13 | Semantic Category Badges | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F14 | Master-Detail Event Drawer | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F15 | Live Balance Drawer & Visual Bar | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | ✓ | ✓ |
| F16 | Pharmacy Receipt OCR Uploader | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | ✓ | ✓ |
| F17 | Digital Signature Canvas | ORIGINAL_REQUEST §R3 | 5 tests | 5 tests | ✓ | ✓ |
| F18 | GPS Check-in Simulator | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F19 | 4 Drive Archetypes Data Loader | ORIGINAL_REQUEST §AC | 5 tests | 5 tests | ✓ | ✓ |

## Test Architecture
- Test Runner: Vitest + Playwright / Testing Library
- Coverage Thresholds:
  * Tier 1: ≥5 per feature (~100 tests)
  * Tier 2: ≥5 per boundary/invariant (~95 tests)
  * Tier 3: Pairwise cross-feature interactions (~25 tests)
  * Tier 4: Real-world journey simulations across 4 Drive archetypes (~15 tests)
  * Tier 5: Adversarial edge cases, concurrency races, and stress tests (~20 tests)
