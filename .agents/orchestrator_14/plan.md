# Plan: Administrator Workflow & CRUD Validation Campaign

## Objective
Execute an exhaustive, end-to-end agile CRUD testing and validation campaign for the entire Administrator operational workflow in `apps/medicaltrip_react_app`, backed directly by Supabase Cloud REST API with deterministic BigInt math and zero runtime errors.

## Execution Phases

### Phase 0: Survey & Scope Mapping
- Dispatch 3 parallel Explorers:
  - Explorer 1: Codebase architecture, use cases, domain entities, and storage ports in `apps/medicaltrip_react_app` for all 5 domains (`bookings`, `events`, `shifts`, `transfers`, `expenses`/`settlements`).
  - Explorer 2: Supabase Cloud REST API integration, endpoints, schema structures, credentials, and network error handling.
  - Explorer 3: Existing testing infrastructure (Vitest, CDP harnesses like `scripts/visual_qa_audit.mjs` or `run_autonomous_qa.mjs`, scripts, fixtures).
- Aggregate explorer findings into `PROJECT.md` Feature Inventory & Architecture.

### Phase 1: Test Infrastructure & Dual Track Initiation
- Spawn E2E Testing Track Orchestrator to establish test runner, fixtures, and Category-Partition/BVA test cases across Tiers 1-4.
- Verify preview server (`http://localhost:3000`) and Supabase REST API reachability.

### Phase 2: Domain-by-Domain CRUD Lifecycles
- Sub-milestone M1: Bookings & Passengers CRUD (`bookings`)
- Sub-milestone M2: Clinical Itinerary & Events CRUD (`events`)
- Sub-milestone M3: Companion Shifts CRUD (`shifts`)
- Sub-milestone M4: Fleet & Logistics Transfers CRUD (`transfers`)
- Sub-milestone M5: Petty Cash & Deterministic Settlements CRUD (`expenses`, `settlements`)
Each milestone follows the iteration loop: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate check.

### Phase 3: Automated Chromium CDP Click Harness & Visual Certification (M6)
- Comprehensive interactive browser execution across all 4 admin tabs and modals.
- Intercept 100% network traffic to verify 0 HTTP 4xx/5xx against Supabase.
- Intercept browser logs: verify 0 `console.error` and 0 unhandled exceptions.
- Screenshot captures across all state transitions.
- Heuristic review compliant with Nielsen 10 heuristics.

### Phase 4: Production Build Verification & Final Handoff
- Worker runs `npm run build` (`tsc -b && vite build`) and full test suite.
- Reviewer, Challenger, and Auditor final verification.
- Synthesize comprehensive final handoff report.
