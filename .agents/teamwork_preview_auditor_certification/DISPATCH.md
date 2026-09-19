# DISPATCH — Final Forensic Integrity Auditor: Dual-Portal Certification

**Assigned Agent**: `teamwork_preview_auditor_certification`  
**Role**: `teamwork_preview_auditor`  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_auditor_certification`  
**Target Repository**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Timestamp**: 2026-09-12T20:30:00Z  

---

## Mission & Mandatory Checks
Perform the definitive independent forensic integrity audit across `apps/medicaltrip_react_app` following the remediation applied by `teamwork_preview_worker_remediation`:

1. **Hardcoded Cheats Check**:
   - Verify zero hardcoded test shortcuts, dummy bypasses, or fabricated mock returns in production source code (`src/`).
2. **Dummy/Facade Implementation Check**:
   - Verify genuine, feature-complete implementations for `PatientPortalView`, `PatientLoginView`, `PatientItinerarySection`, `PatientFlightSection`, `PatientHotelSection`, `PatientCompanionSection`, `PatientSatisfactionModal`, `PassengersView`, `AuthContext`, and `ServiceContainer`.
3. **PHI Exposure Check**:
   - Verify strict data minimization: all patient identifiers normalized to `ENT-PAX-XXXX`. Passports hashed via SHA-256 (`passportHash`) and masked in UI (`SHA256: ...`). Zero plaintext raw passport numbers in the DOM.
4. **Architectural Leaks & Role Isolation Check**:
   - Verify the 22-item DOM absence matrix in `/portal-paciente`.
   - Verify anti-tampering guards and session key segregation (`medicaltrip_auth_session` vs `medicaltrip_patient_session`).
   - Run `npx vitest run tests/architecture_boundaries.test.ts` (must pass 5/5).
5. **Independent Build & Full Test Suite Execution**:
   - Run `npm run typecheck` (must pass with 0 errors).
   - Run `npm run build` (must pass with 0 errors).
   - Run `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx` (must pass 24/24).
   - Run `npx vitest run tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts` (must pass 20/20).
   - Run `npm test -- --run` (MUST pass 100% across all 117 test files and 1106+ tests with exit code 0).

---

## Deliverables & Verdict
Write your final forensic report to:
`/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_auditor_certification/handoff.md`

Your report MUST include a binary verdict: **CLEAN** or **INTEGRITY VIOLATION**.
When complete, send a message to parent.
