# BRIEFING — 2026-09-19T11:49:06-05:00

## Mission
Implement AppContext CRUD methods wiring, UI state sync, Dexie cascading delete, and companion modal expense fix with 100% test coverage and build passing.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/miyo123/projects/medicaltrip/.agents/worker_m2_o14
- Original parent: 8e9b40c2-a310-41a8-8c5c-e33d82fa5a24
- Milestone: Milestone 2 (AppContext CRUD Methods Wiring & UI State Sync)

## 🔒 Key Constraints
- Exclusive Write Ownership:
  - apps/medicaltrip_react_app/src/presentation/state/AppContext.tsx
  - apps/medicaltrip_react_app/src/features/directory/presentation/PassengersView.tsx
  - apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx
  - apps/medicaltrip_react_app/src/core/infrastructure/storage/DexieStorageAdapter.ts
  - apps/medicaltrip_react_app/tests/unit/AppContext_CRUD_StateSync.test.tsx
- No cheating, no dummy/facade implementations, genuine BigInt recalculations and rollback logic.
- 100% pass on npm test, npm run typecheck, npm run build.

## Current Parent
- Conversation ID: 8e9b40c2-a310-41a8-8c5c-e33d82fa5a24
- Updated: 2026-09-19T11:49:06-05:00

## Task Summary
- **What to build**: AppContext CRUD methods (`deleteShift`, `deleteTransfer`, `deleteExpense`, `deleteBooking`, `archiveBooking`, `saveTransfer`, `updateExpense`, plus optimistic `deleteEvent` and `saveCompanionShift`), PassengersView update, CompanionTurnSheetModal ghost expense fix, Dexie cascading delete, unit tests in AppContext_CRUD_StateSync.test.tsx.
- **Success criteria**: Tests pass, typecheck passes, build passes, clean state sync & error rollback.

## Change Tracker
- **Files modified**: None yet
- **Build status**: Pending
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- None
