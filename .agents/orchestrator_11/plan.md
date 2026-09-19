# Project Plan: Dual-Portal Architecture & Role Isolation

## Objective
Implement a strict Dual-Portal architecture in `apps/medicaltrip_react_app` with isolated UI and auth flows for Administrator and Patient, PHI minimization, storage port persistence (Supabase + Dexie), comprehensive CRUD, role boundary isolation tests (`tests/presentation/RoleBoundaryIsolation.test.tsx`), and 100% test pass rate across all existing 987 tests.

## Phase 0: Survey & Scope Discovery (Current)
- Dispatch 3 Explorers in parallel:
  - **Explorer 1**: AuthContext, Session Management, Route Guards, Architecture Boundaries.
  - **Explorer 2**: Patient Portal UI (`/portal-paciente`), Itinerary Presentation, Clinical/Logistics Views, Total UI Isolation.
  - **Explorer 3**: Administrator Workspace CRUD, PHI Minimization (`ENT-PAX-XXXX`), Invitation Tokens, Storage Ports (`SupabaseStorageAdapter`, `DexieStorageAdapter`).
- Merge findings into `PROJECT.md § Feature Inventory` and define interface contracts.

## Phase 1: Test Track & Guardrail Specification
- Establish `TEST_INFRA.md`.
- Dispatch Test Writer / E2E Track to construct `tests/presentation/RoleBoundaryIsolation.test.tsx` covering:
  - Zero financial/admin DOM elements in Patient Portal.
  - Scoped patient queries (preventing cross-booking access).
  - Admin CRUD execution and sync with active storage ports.

## Phase 2: Implementation Milestones
- **Milestone 1 (Auth & Routing Core)**:
  - Refactor `AuthContext` to natively support `ADMIN` and `PATIENT` roles.
  - Implement token/reservation-code authentication for patients and credentials/archetypes for admins.
  - Enforce strict route guards and redirection.
- **Milestone 2 (Patient Portal UI & Isolation)**:
  - Build/refactor `/portal-paciente` view with patient itinerary (clinical appointments, flights, hotel, coordinator WhatsApp, companions, satisfaction signature).
  - Enforce 100% absence of docked settlement bar, ledger figures, rates, margins, and swarm diagnostics.
- **Milestone 3 (Administrator Workspace CRUD & PHI Minimization)**:
  - Complete 100% CRUD for Bookings/Patients, Clinical & Logistics Itineraries, Field Settlements (BigInt math).
  - Implement PHI minimization (`ENT-PAX-XXXX`, masked passport numbers).
  - 1-click self-registration tokens and personalized onboarding invitation links.
- **Milestone 4 (Storage Sync & System Integration)**:
  - Verify persistence across `DexieStorageAdapter` and `SupabaseStorageAdapter`.
  - Validate all 112 existing test suites (987 tests) pass without regressions.
  - Pass `npm run typecheck` and `npm run build`.

## Phase 3: Adversarial Review & Forensic Audit
- Dispatch Reviewers for role boundary and hexagonal architecture compliance.
- Dispatch Challengers for empirical stress testing and boundary penetration attempts.
- Dispatch Forensic Auditor (`teamwork_preview_auditor`) for integrity certification.

## Phase 4: Final Verification & Sentinel Handoff
- Verify all gate criteria pass.
- Write `handoff.md`.
- Notify caller / sentinel.
