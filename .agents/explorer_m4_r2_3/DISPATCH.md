# Dispatch: Explorer M4-R2-3 (Remediation: Global Vitest Test & Hook Timeout Hardening)

## Objective
Investigate and formulate the configuration hardening blueprint in `vite.config.ts` (or `vitest.config.ts`) and test infrastructure to guarantee that the full test suite (`npm test`) executes reliably with a 100% pass rate.

## Authority & Full Audit Evidence
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- `auditor_m4_1/handoff.md`: /Users/miyo123/projects/medicaltrip/.agents/auditor_m4_1/handoff.md (FULL AUDIT EVIDENCE REPORT — INTEGRITY VIOLATION)

## Specific Audit Evidence to Remediate
- Auditor M4 reported that during the full regression pass (`npm test`), which runs 128 test files sequentially over 30+ minutes, network calls and event loop load cause test timeouts.
- In `apps/medicaltrip_react_app/vite.config.ts`:
  ```typescript
  test: {
    globals: true,
    environment: 'happy-dom',
    fileParallelism: false,
    testTimeout: 15000,
  }
  ```
  The default `testTimeout: 15000` (15s) and default `hookTimeout: 10000` are tight when sequential tests accumulate memory or run remote network calls.

## Investigation Tasks
1. Inspect `vite.config.ts` test configuration.
2. Evaluate setting `testTimeout: 30000` (30s) or `60000` (60s) globally, and setting `hookTimeout: 30000`.
3. Check `package.json` scripts (`"test": "vitest run"`).
4. Formulate the exact configuration blueprint to guarantee that all 128+ files and 1,224+ tests complete with 100% pass rate.

## Deliverables
- Write full findings and configuration blueprints to `handoff.md` in your working directory.
- Send a completion message when done.

## 2026-09-14T23:04:47Z
<USER_REQUEST>
You are Explorer M4-R2-3 for Milestone 4 Iteration 2 (Remediation: Global Vitest Test & Hook Timeout Hardening).
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_r2_3

Authoritative files to read before starting:
- /Users/miyo123/projects/medicaltrip/.agents/explorer_m4_r2_3/DISPATCH.md
- /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- /Users/miyo123/projects/medicaltrip/.agents/auditor_m4_1/handoff.md (FULL AUDIT EVIDENCE REPORT — INTEGRITY VIOLATION)

Investigate:
1. Inspect `apps/medicaltrip_react_app/vite.config.ts`:
   - Inspect the `test` block (lines 38-46).
   - Evaluate increasing default `testTimeout` from `15000` to `30000` or `45000` ms, and configuring `hookTimeout: 30000` to give sequential test execution adequate headroom.
2. Verify that running `npx vitest run tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts` completes cleanly.
3. Formulate exact configuration blueprints for Worker M4-R2 to guarantee that the full test suite (`npm test`) achieves 100% pass rate.

Write your findings and configuration blueprints to:
/Users/miyo123/projects/medicaltrip/.agents/explorer_m4_r2_3/handoff.md
Send a message when finished.
</USER_REQUEST>
