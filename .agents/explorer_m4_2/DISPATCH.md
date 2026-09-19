# Dispatch: Explorer M4-2 (Negative Role-Switching Test Suite & AuthAndLogin Refactoring — Features F20, F21)

## Objective
Investigate and blueprint the negative role boundary test assertions and authentication test suite refactoring for `apps/medicaltrip_react_app`.

## Authority & Inputs
- `ORIGINAL_REQUEST.md`: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- `PROJECT.md`: /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md
- Files to inspect:
  * `apps/medicaltrip_react_app/tests/presentation/RoleBoundaryIsolation.test.tsx`
  * `apps/medicaltrip_react_app/tests/presentation/AuthAndLogin.test.tsx`
  * `apps/medicaltrip_react_app/src/features/directory/presentation/UsersView.tsx`
  * `apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`

## Investigation Scope
1. Inspect `tests/presentation/RoleBoundaryIsolation.test.tsx`:
   - Enforce rigorous negative assertions verifying that `btn-switch-role`, `switchRole`, and "Control de Roles Operativos" are completely absent from the DOM across all three roles (`ADMIN`, `COMPANION`, `PATIENT`).
   - Check coverage for companion anti-tamper guards and patient financial isolation.
2. Inspect `tests/presentation/AuthAndLogin.test.tsx`:
   - Audit any legacy test cases that previously clicked or asserted presence of `btn-switch-role`.
   - Blueprint the update to assert `queryByTestId('btn-switch-role')` is strictly `null` while verifying that authentication, login/logout, and role-based initial landing routes function authentically.
3. Formulate exact test code blueprints to achieve 100% clean test passes with 0 regressions.

## Deliverables
- Write full findings and code blueprints to `handoff.md` in your working directory.
- Send a completion message when done.
