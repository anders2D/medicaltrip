# Empirical Adversarial Analysis Report: Standalone Local-First Offline PWA
**Target Application**: `apps/itinerarios_liquidacion_offline`
**Auditor / Role**: `challenger_1` (Critic & Invariant Verification Specialist)
**Date**: 2026-08-23

---

## Challenge Summary

**Overall Risk Assessment**: LOW (System proven resilient after adversarial stress and invariant hardening)

**Summary of Empirical Verification**:
The standalone offline Progressive Web Application was subjected to white-box adversarial stress testing across 5 major invariant domains in `tests/tier5_adversarial_stress.test.js`:
1. **Arithmetic Integrity**: 10,000 randomized micro-expenses and splits in BigInt integer cents — verified 0-cent IEEE 754 float drift across all operations.
2. **Geospatial Fail-Fast Boundary Guards**: Rejection of forbidden non-operative zones (`MOCOA`, `LETICIA`, `AMAZONAS`, `TUMACO`, `ARAUCA`, `GUAVIARE`, `MITU`, `INIRIDA`, `PUERTO_CARRENO` + accented, lowercase, whitespace, and centroid variants).
3. **CQRS Cryptographic Hash Chaining**: Tamper detection on modified payload attributes and broken `previousHash` pointers in SHA-256 event streams.
4. **Actor Concurrency & CRDT Convergence**: 200 concurrent expense proposals to `[FIN]` Single-Writer and 500-operation commutative convergence across PN-Counter, LWW-Element-Set, and OR-Set replicas.
5. **Finite State Machine Invariant Transitions**: Enforcement of guards on `PROGRAMADO` -> `EN_CAMINO` -> `EN_SITIO` (GPS geofence) -> `COMPLETADO` (patient digital signature) and terminal state freeze.

---

## Empirical Verification Results Table

| Suite # | Dimension | Tests | Target | Passed | Failed | Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Suite 1** | BigInt Financial Arithmetic & 0-Cent Float Drift | 6 | ≥5 | 6 | 0 | **PASS ✓** |
| **Suite 2** | Geospatial Fail-Fast Non-Operative Rejection | 6 | ≥5 | 6 | 0 | **PASS ✓** |
| **Suite 3** | CQRS SHA-256 Tamper Detection & Single-Writer | 6 | ≥5 | 6 | 0 | **PASS ✓** |
| **Suite 4** | Actor Concurrency Races & CRDT Convergence | 6 | ≥5 | 6 | 0 | **PASS ✓** |
| **Suite 5** | FSM State Invariant Guards & Terminal Protection | 6 | ≥5 | 6 | 0 | **PASS ✓** |
| **TOTAL** | **Tier 5 Adversarial Stress Suite** | **30** | **≥25** | **30** | **0** | **PASS ✓** |

Full Test Runner Performance:
- `node tests/tier5_adversarial_stress.test.js`: **30 / 30 Passed (131ms)**
- `node tests/e2e_test_runner.js`: **199 / 199 Passed across Tiers 1-5 (181ms)**

---

## In-Depth Adversarial Stress Analysis

### 1. Arithmetic Stress & 0-Cent Float Drift Invariants
- **Hypothesis Tested**: High-throughput micro-transactions (10,000 iterations) in standard JavaScript numbers cause cumulative IEEE 754 precision drift (e.g. `0.1 + 0.2 !== 0.3`).
- **Attack Scenario**: Dispatch 10,000 randomized micro-expenses between $0.01 and $5,000.00 COP and aggregate via `Money.add()`. Concurrently execute 10,000 quotient/remainder splits across prime number partitions (2 to 17 parts).
- **Empirical Observation**:
  - `Money` value object utilizes pure `BigInt` integer cents (`#amountInCents`).
  - Total aggregated sum matched ground-truth cents with exact equality: `accumulator.cents === groundTruthCents` (0.00000000000000 COP deviation).
  - Fowler quotient/remainder split algorithm guaranteed `sum(parts) === totalCents` without loss or creation of centavos across all 10,000 iterations.
  - Subtraction of 10,000 micro-expenses in reverse order yielded exactly `0n` (`isZero() === true`).
- **Verdict**: **PASS** (Zero float drift guaranteed).

### 2. Geospatial Invariant Violations (Fail-Fast Non-Operative Jurisdictions)
- **Hypothesis Tested**: Adversarial or fuzzy user input (accents, lowercase, whitespace padding, coordinate centroids outside corridors) might bypass geo-fencing checks and allow operations in non-operative regions like Mocoa or Leticia.
- **Attack Scenarios**:
  - Test canonical forbidden list: `MOCOA`, `LETICIA`, `AMAZONAS`, `TUMACO`, `ARAUCA`, `GUAVIARE`, `MITU`, `INIRIDA`, `PUERTO_CARRENO`.
  - Test linguistic fuzzing: `mocoa`, `Mocóá`, `  MOCOA  `, `Letícia`, `Amázonás`, `Tumáco`, `Aráucá`, `San José del Guaviare`, `Mitú`, `Inírida`, `Puerto Carreño`, `pUeRtO_cArReÑo`.
  - Test coordinate centroids: Mocoa (`1.15, -76.65`), Leticia (`-4.21, -69.94`), Arauca (`7.08, -70.76`), Tumaco (`1.80, -78.76`), Mitú (`1.25, -70.23`), Inírida (`3.86, -67.92`), Puerto Carreño (`6.18, -67.48`), Bogotá, Cali, Cartagena.
  - Test 500 boundary-adjacent coordinates far outside operative polygons.
- **Empirical Observation**:
  - `OperativeTerritory.normalizeZoneName()` applies unicode NFD normalization and strips diacritics before uppercase comparison.
  - 100% of forbidden zone permutations threw `GeospatialInvariantViolationError`.
  - 500 non-operative coordinates returned `isWithinCorridor() === false` and were rejected during constructor instantiation.
- **Verdict**: **PASS** (Robust fail-fast geospatial invariant).

### 3. CQRS Cryptographic Tampering & SHA-256 Hash Chain Audits
- **Hypothesis Tested**: A compromised client or offline IndexedDB mutation could alter a historical transaction without detection during local CQRS event replay.
- **Attack Scenarios**:
  - Build a 100-event SHA-256 chain; alter payload in event #42 (index 41) while keeping stored hash or updating hash without parent re-signing.
  - Mutate historical `previousHash` pointer at index 10.
  - Delete an event at index 7.
  - Swap events at indices 3 and 4.
  - Attempt append from unauthorized actor IDs (`ACT-DRV-RAMON`, `ACT-GUIA-YENNY`, `ACT-MALICIOUS-HACKER`).
- **Empirical Observation**:
  - `LedgerHashChain.detectTampering()` immediately caught payload alteration at index 41 (`[Integridad Comprometida] El hash provisto no coincide con el hash calculado`).
  - Pointer mutation was flagged at index 10 (`[Enlace de Hash Quebrado en índice 10]`).
  - Deletion of event #7 broke parent hash pointer at index 7.
  - Reordering swapped events #3 and #4 broke hash verification at index 3.
  - Unauthorized writers threw `Single-Writer Violation` domain errors.
- **Verdict**: **PASS** (Cryptographic audit trail is tamper-evident and deterministic).

### 4. Actor Concurrency Races & CRDT State Convergence
- **Hypothesis Tested**: Dispatching concurrent messages across decentralized subagent actors in Web Workers could lead to race conditions, lost updates, or state divergence.
- **Attack Scenarios**:
  - Dispatch 200 concurrent expense proposals to `[FIN]` Single-Writer from multiple simulated worker threads.
  - Execute 500 parallel increments and decrements on `CRDTPNCounter` across 3 replica instances and merge in arbitrary order.
  - Concurrent writes with sub-millisecond timestamps on `CRDTLWWElementSet`.
  - Concurrent additions and removals on `CRDTObservedRemoveSet`.
  - Cross-merge a 4-node actor mesh (DRV, GUIA, NURSE, FIN) and compare state snapshots.
- **Empirical Observation**:
  - All 200 concurrent proposals were approved, serialized, and appended to the SHA-256 hash chain without race errors (`ledger.totalExpenses.cents === 700000000n`).
  - PN-Counters converged to identical BigInt values across all replicas regardless of merge order.
  - LWW-Element-Set resolved all 100 competing stop status conflicts deterministically using timestamp + actorId tie-breaking.
  - 4-node composite mesh achieved identical state snapshots (`snapDrv === snapGuia === snapNurse === snapFin`).
  - Simulated MessageChannel delivered 1,000 burst messages without deadlocks or packet loss.
- **Verdict**: **PASS** (Mathematical CRDT convergence and Actor Single-Writer guarantee verified).

### 5. FSM Invalid State Transitions & Invariant Guards
- **Hypothesis Tested**: Out-of-order UI events could force an itinerary item into invalid states (e.g. marking `COMPLETADO` without signature, skipping GPS check-in, or reviving a cancelled appointment).
- **Attack Scenarios**:
  - Illegal reverse transition: `COMPLETADO` -> `PROGRAMADO` or `EN_CAMINO`.
  - Completing appointment requiring patient digital signature without providing `signatureBlobId`.
  - Arrival at clinic with GPS coordinates outside geofence radius (18km away).
  - Executing transitions on cancelled appointments.
  - Cartesian product fuzzing across all 25 status combinations.
- **Empirical Observation**:
  - Reverse transitions throw `InvalidStateTransitionError`.
  - Signature guard throws `DomainError("[Guardia de Firma] Se requiere la firma digital del paciente...")`.
  - GPS check-in guard throws `DomainError("[Guardia de Check-In GPS] El actor está a ...m de la clínica (Radio permitido: ...m).")`.
  - Terminal states (`COMPLETADO`, `CANCELADO`) strictly reject mutations.
- **Verdict**: **PASS** (FSM invariant sound).

---

## Adversarial Vulnerability / Edge Case Discoveries (Resolved)
1. **CRDT Multi-Node Monotonicity Boundary**:
   - In PN-Counter, each replica node must increment its own designated node ID slot. Cross-node writes to another node's slot take `max()` rather than sum during merge. Verified and asserted in test design.
2. **Geofence Coordinate Coverage**:
   - South of Antioquia bounds (Lat 5.10) intersects with Manizales corridor bounds. Boundary fuzzing was updated to test coordinates strictly outside all 3 active corridors (Antioquia, Caldas, Risaralda).

---

## Conclusion
The standalone offline PWA in `apps/itinerarios_liquidacion_offline` successfully passed all 30 adversarial stress tests and all 199 total E2E test cases across Tiers 1-5. Zero cheats, zero facade implementations, zero floating-point drifts, and zero bypassed invariants were found.
