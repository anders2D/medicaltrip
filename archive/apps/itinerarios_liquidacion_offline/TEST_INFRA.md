# E2E Test Infra: Gestión de Itinerarios Médicos en Terreno y Liquidación Financiera Automática (PWA Offline)

## Test Philosophy
- Opaque-box, requirement-driven testing directly derived from `ORIGINAL_REQUEST.md`.
- No internal mock shortcuts: tests run against real domain instances, storage adapters, actors, and headless/virtual DOM UI states.
- 100% offline verification (0 external network calls).
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing (4 Archetypes).

## Feature Inventory & Test Coverage Plan
| # | Feature | Source (Requirement) | Tier 1 (Coverage ≥5) | Tier 2 (Boundary ≥5) | Tier 3 (Cross-Feature) | Tier 4 (Archetypes) |
|---|---------|----------------------|:-------------------:|:--------------------:|:---------------------:|:-------------------:|
| 1 | Pure Domain Entities & Invariants | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | `OperativeTerritory` Fail-Fast (Mocoa rejection) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | `Money` BigInt Integer Cents & Zero Float Error | ORIGINAL_REQUEST §R1, R3 | 5 | 5 | ✓ | ✓ |
| 4 | Abstract Ports & Hexagonal Interfaces | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | Multi-Tier Storage (SQLite Relational + CQRS) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | Binary Asset Storage (Dexie.js IndexedDB) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Storage Persistence & Service Worker A2HS | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | Single-Writer CQRS Event Stream & Hash Chain | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 9 | Automated Financial Settlement & Balance Audit | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 10 | Decentralized Web Worker Actor Model | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 11 | MessageChannel Mesh & CRDT State Sync (60fps) | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 12 | Split-View Master-Detail UI Layout | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 13 | Interactive Timeline & FSM Transitions | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 14 | Microinteractions: GPS, OCR, Signature Canvas | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |
| 15 | 4 Real Google Drive Archetypes Hydration | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Node.js automated test runner located at `apps/itinerarios_liquidacion_offline/tests/e2e_test_runner.js`.
- **Invocation**: `node tests/e2e_test_runner.js` (executes all tiers sequentially, reports summary table, exit code 0 if 100% pass).
- **Directory Layout**:
  - `tests/tier1_feature_coverage.test.js`: ≥75 test cases (≥5 per feature across 15 features).
  - `tests/tier2_boundary_corner.test.js`: ≥75 test cases (edge cases, extreme BigInt values, non-operative zones like Mocoa, out-of-order CRDT events, corrupt blob UUIDs).
  - `tests/tier3_cross_feature.test.js`: ≥15 test cases (Actor-to-Finance CRDT sync, SQLite CQRS + Dexie Blob transaction consistency, GPS check-in triggering status transition and driver fee recalculation).
  - `tests/tier4_real_world_archetypes.test.js`: 4 comprehensive full multi-day simulations for `RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Hogenboom CES`, and `RVA077 Rumai Cirugía 12d`.
  - `tests/tier5_adversarial_stress.test.js`: Adversarial stress tests (concurrency races, memory leak checks, SHA-256 tamper detection, forensic integrity verification).

## Minimum Coverage Thresholds
- Tier 1: ≥75 test cases
- Tier 2: ≥75 test cases
- Tier 3: ≥15 test cases
- Tier 4: ≥4 full multi-day application workflows (1 per archetype)
- Tier 5: ≥20 adversarial stress tests
- **Total Minimum Target**: ≥189 automated test cases.
