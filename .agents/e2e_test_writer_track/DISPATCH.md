## 2026-08-23T15:34:21Z

You are the E2E Test Suite Creator for the Medical Trip Calendar & Settlement App.
Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/e2e_test_writer_track`.
The target app directory is `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`.
The master project blueprint is at `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/PROJECT.md`.
The test infra specification is at `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/TEST_INFRA.md`.
The original request is at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.

Your write ownership:
- `apps/medicaltrip_calendar_app/tests/e2e/**/*`
- `apps/medicaltrip_calendar_app/tests/fixtures/**/*`
- `apps/medicaltrip_calendar_app/TEST_READY.md`

Your task:
1. Review `PROJECT.md § Feature Inventory` and `TEST_INFRA.md`.
2. Design and create the comprehensive, opaque-box, requirement-driven test suite across all 4 tiers:
   - **Tier 1 (Feature Coverage ≥5 tests per feature)**: Isolated tests verifying all 19 features independently (Money, Territory, PAX, DRV, GUIA, Milestone CRUD, BigInt Settlement, Dexie Storage, Web Workers, Multi-View Calendar, Category Badges, Drawers, Receipt OCR, Signature Canvas, Archetypes).
   - **Tier 2 (Boundary & Corner Cases ≥5 per feature)**: Zero/negative money, max bounds, non-operative territories (Mocoa, Leticia), concurrent milestone overlaps, midnight span scheduling, empty receipts, corrupt signature blobs.
   - **Tier 3 (Cross-Feature Combinations - Pairwise Coverage)**: Rescheduling milestone triggers live settlement balance recalculation; OCR receipt ingestion creates milestone and financial ledger entry; Guide meal subsidy automatically adjusts based on milestone duration; Switch archetype hydrates full itinerary and resets ledger.
   - **Tier 4 (Real-World Application Scenarios)**: End-to-end simulation journeys for the 4 real-world Drive archetypes:
     * `RVA171 Catia x5` (5 pax Curacao, multi-day surgeries, Uber XL, cash advances & positive net balance).
     * `RVA282 George Cardio` (32-day cardiac evaluation, Park 42, Aeroturex, Cardio VID, Colasistencia insurance).
     * `RVA341 Eduard CES` (CES Oviedo urology, 05:30 AM at-home fasting lab draw at Hotel Inntu room 1004).
     * `RVA077 Rumai 12d` (12-day extensive surgery journey, Novelty Suites, 22 vehicle transfers, multi-stage settlement).
3. Ensure all tests have deterministic assertions and clean mocks for browser APIs (IndexedDB, Web Workers, Canvas) when run in Node/jsdom/browser environments.
4. When the test suite is ready, create `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/TEST_READY.md` containing the test runner command, count of test cases per tier, and checklist of covered features.
5. Document your work in `/Users/miyo123/projects/medicaltrip/.agents/e2e_test_writer_track/handoff.md` and message back the orchestrator.
