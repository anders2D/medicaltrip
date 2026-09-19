# Dispatch for Explorer Survey 2 (Patient Portal UI & Total Isolation)

- Working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_2
- Original request file: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md
- Target codebase: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

## Assignment
Investigate the codebase for:
1. Existing patient-facing components, itinerary views, medical plans, logistics, companion views, and onboarding in `src/features/`.
2. All administrative/financial/diagnostic elements currently present in the UI (docked settlement bar, balance formulas, ledger figures, rates, margins, swarm diagnostic tools) that MUST BE 100% EXCLUDED from the Patient Portal.
3. Architecture and specifications for the dedicated `/portal-paciente` view:
   - Patient itinerary with clinical appointments
   - Flights (arrival/departure tracking)
   - Assigned hotel details
   - Direct coordinator WhatsApp contact button
   - Companion management details
   - Service satisfaction signature (Canvas / touch)
4. UI component layout and styling adhering to the Radical Functional Minimalism standards (`.agents/rules/uiux_minimalist_standards.md`).

Deliver a structured handoff report at `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_2/handoff.md`.

## 2026-09-12T19:08:32Z
You are Explorer 2 for the Dual-Portal Architecture & Role Isolation project.
Your identity: teamwork_preview_explorer
Your working directory: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_2
Your DISPATCH file: /Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_2/DISPATCH.md
Read the authoritative user request at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically the latest section ## 2026-09-12T19:07:00Z).
The project target repository is: /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

Your focus: Patient Portal UI, Total Isolation & Patient Ergonomics.
1. Inspect existing patient-facing components, itinerary views (`src/features/itinerary/`), medical plans (`src/features/medical-plan/`), logistics (`src/features/logistics-fleet/`), companion shifts (`src/features/companion-shifts/`), and onboarding (`src/features/onboarding/`).
2. Inspect what components are currently rendered in the main app (e.g., docked settlement bar, ledger, expenses, diagnostics, rates, margins, swarm pills).
3. Determine the design and structure for the dedicated `/portal-paciente` view:
   - Patient itinerary with clinical appointments
   - Flights (arrival/departure tracking)
   - Assigned hotel details
   - Direct coordinator WhatsApp contact button
   - Companion management details
   - Service satisfaction digital signature (Canvas / touch)
4. Enforce TOTAL UI ISOLATION: catalog every administrative, financial, diagnostic, or developer element that must be completely absent from the DOM when in Patient mode.
5. Review adherence to Radical Functional Minimalism rules (`.agents/rules/uiux_minimalist_standards.md`).

Produce a detailed handoff report in:
`/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_2/handoff.md`.
When finished, send a completion message to parent.
