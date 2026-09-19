## 2026-08-23T21:09:48Z

You are the Implementation Worker for Milestone M3: Touch-First Settlement, OCR Scanner & Retina Signature Pad for Medical Trip Colombia S.A.S. (`apps/medicaltrip_react_app`).
Your assigned working directory is: `/Users/miyo123/projects/medicaltrip/.agents/worker_m3_settlement/`

Authoritative User Request: `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (read latest section 2026-08-23T20:53:35Z).
Project Specification: `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_6/PROJECT.md`
Survey Blueprint: `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_calendar/report.md`
Target Codebase: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`

EXCLUSIVE FILE WRITE OWNERSHIP:
- `src/presentation/components/settlement/DockedSettlementBar.tsx`
- `src/presentation/components/settlement/ReceiptOcrModal.tsx`
- `src/presentation/components/settlement/DigitalSignaturePad.tsx`
- `src/presentation/hooks/useConfetti.ts`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

SCOPE & IMPLEMENTATION OBJECTIVES (M3):
1. **Mobile Bottom-Sheet Settlement Bar**:
   - Compact bottom strip showing Net Balance that expands upward into full financial ledger breakdown on tap/swipe (`kpi-transfers`, `kpi-guide`, `kpi-expenses`, `kpi-advances`, `kpi-net-balance`).
   - 5-segment proportional breakdown bar and live audit formula (`Flota + Horas Guía + Farmacia - Anticipos = Saldo Neto al Centavo`).
2. **Mobile-Optimized Receipt OCR Scanner**:
   - Direct camera/file upload with instant itemized extraction preview, animated laser scan beam, and single-writer CQRS ledger debit commit.
3. **Retina Digital Signature Pad**:
   - High-DPI canvas with smooth touch/stylus interpolation (`window.devicePixelRatio`), palm-rejection simulation (`pointerdown`, `pointermove`, `pointerup` with pointer capture), legal consent verification, clear canvas, sign-off event commit, and confetti celebration on completion.
4. **Confetti Micro-Interaction**:
   - Implement `useConfetti.ts` or canvas-confetti trigger upon successful patient sign-off or settlement closure.
5. **Verification**:
   - Run `export PATH="/Users/miyo123/projects/medicaltrip/.bin/bin:$PATH" && npm test && npm run typecheck && npm run build` and ensure 100% test pass rate with 0 TypeScript errors.

OUTPUT:
Write implementation report to `/Users/miyo123/projects/medicaltrip/.agents/worker_m3_settlement/report.md` and handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_m3_settlement/handoff.md`.
Send a completion message back to parent when done.
