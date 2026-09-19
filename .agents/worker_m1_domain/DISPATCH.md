## 2026-08-23T15:34:21Z
You are Worker 1 for Milestone 1: Domain Core, Hexagonal Ports & Deterministic Financial Engine.
Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/worker_m1_domain`.
The target app directory is `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`.
The master project blueprint is at `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/PROJECT.md`.
The original request is at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.
Survey specifications are at `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_domain/survey_domain.md` and `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_techstack/survey_techstack.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
- `apps/medicaltrip_calendar_app/package.json`
- `apps/medicaltrip_calendar_app/tsconfig.json`
- `apps/medicaltrip_calendar_app/vite.config.ts`
- `apps/medicaltrip_calendar_app/tailwind.config.js`
- `apps/medicaltrip_calendar_app/postcss.config.js`
- `apps/medicaltrip_calendar_app/index.html`
- `apps/medicaltrip_calendar_app/src/domain/**/*`
- `apps/medicaltrip_calendar_app/src/application/**/*`
- `apps/medicaltrip_calendar_app/tests/unit/domain/**/*`
- `apps/medicaltrip_calendar_app/tests/unit/application/**/*`

Your task:
1. Initialize the project dependencies and configuration (Vite, React 19/18, TypeScript, Tailwind CSS, Lucide React, Vitest). Make sure `npm install` or `pnpm install` succeeds and builds cleanly.
2. Implement the Pure Domain Layer (0 external dependencies):
   - `Money`: BigInt integer cents value object with zero IEEE-754 float rounding, immutable arithmetic (`add`, `subtract`, `multiply`, `split`), currency conversion, formatting COP/USD, invariant checks.
   - `OperativeTerritory`: Fail-fast invariant domain entity. Allowed corridors: `MEDELLIN`, `RIONEGRO`, `ENVIGADO`, `SABANETA`, `ITAGUI`, `BELLO`, `MANIZALES`, `PEREIRA`, `BOGOTA`. Non-operative zones like `MOCOA`, `LETICIA`, `TUMACO` must throw `NonOperativeTerritoryError` immediately.
   - `Coordinates` & Distance: Haversine distance calculator.
   - Entities: `Patient` (`ENT-PAX`), `Booking` (`RVA`, `CTZ`), `Driver` (`DRV`, fixed rates, vehicle types: Aeroturex Sedan, Uber XL Van), `Guide` (`GUIA`, $15.500/h shift, $15.500 prep allowance, tiered meal subsidies $8k, $25k, $35k, $45k), `Provider` (`CLINIC`, `LAB` - HPTU, Cardio VID, Clofán, CIMA, CES Oviedo, Echavarría lab), `Hotel` (`HOTEL` - Inntu Laureles, Park 42 Poblado, Novelty Suites, Villa Anita), `ItineraryMilestone` (status: `PROGRAMADO`, `EN_CAMINO`, `EN_SITIO`, `COMPLETADO`; category: `FLIGHT`, `CLINICAL`, `LAB`, `PHARMACY`, `HOTEL`), `FinancialTransaction` (type: `OUT_OF_POCKET`, `GUIDE_FEE`, `FLEET_TAXI`, `CASH_ADVANCE`).
   - `MedicalItinerary` Aggregate: Manages milestones, calculates deterministic balance sheet (Out-of-Pocket + Companion Fees + Fleet Taxis - Cash Advances = Net Balance), enforces invariants.
   - `DomainErrors`: Structured custom error classes.
3. Implement Application Layer:
   - Abstract Ports (TypeScript interfaces): `IItineraryRepository`, `ILedgerRepository`, `IActorSwarmBus`, `IReceiptOCRService`, `ISignatureStorageService`, `IStoragePersistAdapter`.
   - Use Cases: `ScheduleMilestoneUseCase`, `RescheduleMilestoneUseCase`, `CalculateSettlementUseCase`, `ProcessReceiptOCRUseCase`, `SignOffItineraryUseCase`, `LoadArchetypeUseCase`.
4. Implement rigorous Unit Tests in `tests/unit/domain/` and `tests/unit/application/` covering all invariants, edge cases, BigInt arithmetic, Mocoa rejection, guide rate rules, and use cases.
5. Run the test suite (`npm run test` or `npx vitest run`), verify 100% tests pass, document all commands and output in `/Users/miyo123/projects/medicaltrip/.agents/worker_m1_domain/handoff.md`.
6. Message back the orchestrator when complete.
