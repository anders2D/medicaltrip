# DISPATCH — Explorer Survey 2 (Admin God Switcher & 7 Windows Minimalist UI)

## Context & Objectives
You are Explorer 2 investigating the Medical Trip Colombia S.A.S. application (`apps/medicaltrip_react_app`).
Your assigned working directory is:
`/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_2`

You MUST read `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (specifically the section "## 2026-09-14T16:49:34Z") before starting your analysis.

## Investigation Scope
Focus on Requirement 1 (Admin is God) and Requirement 3 (Minimalist UI - Alternativa 10 across 7 Windows):
1. Cockpit Switcher:
   - In `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (or new header cockpit component):
   - Eliminate `md:hidden` restriction so the 1-click passenger selector is visible on all screen sizes.
   - Support effortless switching between active Caribbean cases: `Catia RVA171`, `George RVA282`, `Eduard RVA341`, `Alejandra RVA077`, and creating new reservations `[+ Nuevo Paciente]`.
   - Persistent Status Pill: `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
   - Keyboard shortcuts `[1]`-`[4]`, hotel status.
   - Immediate view updates across `settlement`, `plan`, `passengers` without page reloads.
2. 7 Windows UI (Alternativa 10) status and gaps:
   - Window 1 (Header/Switcher): Status Pill + Instant Dropdown Cockpit.
   - Window 2 (Settlement): Responsive Bento Grid with explicit surplus ledger wording ("Saldo a Favor de Medical Trip"), 1-tap disbursement modal, BigInt deterministic calculations.
   - Window 3 (Users/Directorio): Pure operational staff directory with duty badges, WhatsApp links, zero role switches.
   - Window 4 (Plan): Dual clinical timeline with hospital triage emergency contacts.
   - Window 5 (Pasajeros): Family dossier with masked PHI, flight badges, 1-click WhatsApp onboarding links.
   - Window 6 (Portal Paciente): Stress-free patient board with daily schedule, assigned guide, digital satisfaction signature.
   - Window 7 (Consola Terreno): High-contrast mobile view with 48px touch targets, shift timer with lunch subsidy tiers, 1-tap petty cash OCR.

## Deliverable
Write your findings and actionable implementation plan in:
`/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_2/handoff.md`
Also update `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_2/progress.md`.
Send a message back to orchestrator when completed.

## 2026-09-14T16:59:47Z
You are Explorer 2 investigating Medical Trip Colombia S.A.S. application (`apps/medicaltrip_react_app`).
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/explorer_survey_2
Read /Users/miyo123/projects/medicaltrip/.agents/explorer_survey_2/DISPATCH.md and /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md.
Investigate:
1. Admin is God (R1): 1-click Cockpit Switcher visible on all screen sizes (eliminate `md:hidden`), persistent Status Pill `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`, keyboard shortcuts [1]-[4], hotel status, immediate view updates (`settlement`, `plan`, `passengers`) without page reloads.
2. Minimalist UI (Alternativa 10) status across the 7 Windows:
   - Window 1: Header / Cockpit Switcher
   - Window 2: Settlement Bento Grid, 'Saldo a Favor de Medical Trip', 1-tap disbursement modal, BigInt calculations
   - Window 3: Directorio staff directory
   - Window 4: Plan dual clinical timeline + triage emergency contacts
   - Window 5: Pasajeros family dossier, masked PHI, flight badges, WhatsApp onboarding links
   - Window 6: Portal Paciente stress-free board, daily schedule, assigned guide, digital satisfaction signature
   - Window 7: Consola Terreno (CompanionModeView) 48px touch targets, shift timer with lunch subsidy tiers, 1-tap petty cash OCR
Write your detailed report to `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_2/handoff.md` and update `progress.md`. Send a message when finished.

