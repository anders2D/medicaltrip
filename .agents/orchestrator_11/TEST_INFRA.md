# E2E Test Infra: Dual-Portal Architecture & Role Isolation

## Test Philosophy
- Opaque-box, requirement-driven.
- Verifies total isolation between Patient and Administrator experiences.
- Enforces 22-item DOM Absence Matrix in Patient Portal.
- Enforces scoped queries: patient cannot read or access other patients' records or ledgers.
- Enforces administrator CRUD execution and sync across storage ports.

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Tier 1 (Unit) | Tier 2 (Boundary) | Tier 3 (Cross-Role) | Tier 4 (E2E) |
|---|---------|-------------|:-------------:|:-----------------:|:-------------------:|:------------:|
| 1 | Patient Authentication | Code / Token Login | ✓ | ✓ | ✓ | ✓ |
| 2 | Role Boundary Isolation | 0 Financial/Admin in DOM | ✓ | ✓ | ✓ | ✓ |
| 3 | Scoped Query Security | Single Booking Scoping | ✓ | ✓ | ✓ | ✓ |
| 4 | Anti-Tampering Guards | URL / Module Redirects | ✓ | ✓ | ✓ | ✓ |
| 5 | Admin Booking CRUD | Search, Filter, Archive | ✓ | ✓ | ✓ | ✓ |
| 6 | Storage Port Sync | Supabase & Dexie Sync | ✓ | ✓ | ✓ | ✓ |

## Test Architecture
- Test File: `tests/presentation/RoleBoundaryIsolation.test.tsx`
- Runner: `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx`
- Verification standard: Happy-DOM emulation, sequential execution (`fileParallelism: false`), 0 console errors, 100% assertions pass.
