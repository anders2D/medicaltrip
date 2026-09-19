## 2026-09-14T23:53:04Z

You are Worker M4-R2 implementing Milestone 4 Iteration 2 (Remediation: Prohibited Styling Excision & Supabase Adversarial Timeout Hardening) for Medical Trip Colombia S.A.S.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/worker_m4_r2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Authoritative files to read before starting:
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- /Users/miyo123/projects/medicaltrip/.agents/auditor_m4_1/handoff.md (FULL AUDIT EVIDENCE REPORT — INTEGRITY VIOLATION)
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_r2_1/handoff.md (Drop-in shadow excision blueprints)
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_r2_3/handoff.md (Vitest config and timeout blueprints)

Write Ownership:
You exclusively own:
- `apps/medicaltrip_react_app/src/features/onboarding/presentation/SendPatientInvitationModal.tsx`
- `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx`
- `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionModeView.tsx`
- `apps/medicaltrip_react_app/src/presentation/components/modules/ModuleNav.tsx`
- `apps/medicaltrip_react_app/src/features/itinerary/presentation/DayView.tsx`
- `apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`
- `apps/medicaltrip_react_app/src/features/settlement/presentation/ReceiptOcrModal.tsx`
- `apps/medicaltrip_react_app/vite.config.ts`
- `apps/medicaltrip_react_app/tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`

Implement:
1. Prohibited Styling Excision (Strict Alternativa 10 & Minimalist Standard Compliance):
   - In `apps/medicaltrip_react_app/src/features/onboarding/presentation/SendPatientInvitationModal.tsx` (line 163): Replace `shadow-2xl` with `shadow-sm border border-zinc-200/80`.
   - In `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionTurnSheetModal.tsx` (line 1429): Replace `shadow-2xl` with `shadow-sm border border-zinc-200/80`.
   - In `apps/medicaltrip_react_app/src/features/companion-shifts/presentation/CompanionModeView.tsx`: Replace `shadow-xl` (line 424) with `shadow-sm border border-emerald-600/80`; replace `shadow-md` (line 358) with `shadow-xs`; replace `shadow-inner` (line 753) with `border border-zinc-700/80 shadow-xs`.
   - In `apps/medicaltrip_react_app/src/presentation/components/modules/ModuleNav.tsx`: Remove `shadow-inner` (line 65); replace `shadow-lg` (line 96) with `shadow-xs border-t border-zinc-200/80`.
   - In `apps/medicaltrip_react_app/src/features/itinerary/presentation/DayView.tsx` (line 778): Replace `shadow-lg` with `shadow-sm border-t border-zinc-200/80`.
   - In `apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (line 241): Replace `shadow-md` with `shadow-sm`.
   - In `apps/medicaltrip_react_app/src/features/settlement/presentation/ReceiptOcrModal.tsx` (line 335): Replace `shadow-inner` with `border border-zinc-200/80 shadow-xs`.

2. Supabase Latency & Vitest Timeout Hardening:
   - In `apps/medicaltrip_react_app/vite.config.ts`: In the `test` block, configure `testTimeout: 45000`, `hookTimeout: 30000`, `teardownTimeout: 30000`.
   - In `apps/medicaltrip_react_app/tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`:
     * Line 287 (`CHAL-SWAP-02 [supabase]`): Update explicit per-test timeout from `45000` to `90000` (or `120000`).
     * Lines 420 and 505: Ensure adequate timeout headroom (`60000` ms).

3. Comprehensive Verification (Run all commands in `apps/medicaltrip_react_app`):
   - `npm run typecheck` (`tsc --noEmit`)
   - `npx tsc -b`
   - `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx tests/presentation/AuthAndLogin.test.tsx`
   - `npx vitest run tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts`
   - `npm test` (Full sequential test suite: all 130 test files must pass with 100% pass rate)
   - `npm run build` (`tsc -b && vite build`)

Write your full handoff report to:
/Users/miyo123/projects/medicaltrip/.agents/worker_m4_r2/handoff.md
Send a message when finished.
