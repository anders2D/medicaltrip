# BRIEFING — 2026-08-23T04:54:15Z

## Mission
Investigate, discover, and document the complete UI/UX, Master-Detail Split-View Layout, and interactive microinteraction specifications for the standalone 100% Offline PWA (`apps/itinerarios_liquidacion_offline`) for Medical Trip Colombia S.A.S.

## 🔒 My Identity
- Archetype: Survey Spec Miner
- Roles: UI/UX Specification Miner, Interactive Flow Designer, Verifiability & Accessibility Specialist
- Working directory: /Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1
- Original parent: 2b250ea1-fa35-4e8a-acb4-2b5dc5303699
- Milestone: Phase 0 / Feature R5 & UI Testing Specification

## 🔒 Key Constraints
- Read `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` first (Completed).
- Strict adherence to empirical evidence from 4 years of operational data (304 chats, 193 Drive cases, 2 Excel sheets).
- Zero float rounding errors: All UI monetary calculations in BigInt integer cents.
- Standalone 100% offline-ready UI/UX (IndexedDB Dexie for binaries, SQLite OPFS/PGlite for structured CQRS).
- High visual density, tactile touch targets >= 48px, sunlight readability, WCAG 2.1 AAA contrast.
- Do NOT implement production code — produce exhaustive, verifiable specifications and test hooks.

## Current Parent
- Conversation ID: 2b250ea1-fa35-4e8a-acb4-2b5dc5303699
- Updated: 2026-08-23T04:54:15Z

## Task Summary
- **What to build/specify**: Master-Detail Split-View Layout (R5), Left Pane Itinerary Timeline, GPS Check-in simulator, Receipt OCR modal, Digital Signature canvas, Right Pane Settlement Balance Bar & Financial Intelligence, 4-Archetype Switcher, and UI Testing & Verifiability Specification.
- **Status**: COMPLETE. Detailed specification written to `analysis.md` and 5-component report in `handoff.md`.
- **Interface contracts**: Master-Detail UI Layout Contract, CQRS Event UI Dispatch Contract, Dexie Binary Asset Store Contract, Simulation Test API Contract (`window.MedicalTripFieldApp`).
- **Code layout**: `apps/itinerarios_liquidacion_offline/`

## Key Decisions Made
- Layout: CSS Grid / Flex master-detail split (60/40 desktop/tablet landscape, collapsible bottom drawer / top-tabs on mobile portrait).
- Touch Targets: Min 48x48px on all tactile interactive controls.
- Palette: High-contrast Slate/Indigo/Emerald/Amber dark & light mode with anti-glare sunlight field contrast (WCAG AAA).
- Financial Balance: Integer cents BigInt ledger with multi-segment proportional SVG/CSS bar and 0 float variance.
- Archetypes: Full 4-case matrix (`RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Hogenboom CES`, `RVA077 Rumai Cirugía 12d`).
- Exposed Automation API: `window.MedicalTripFieldApp` with comprehensive programmatic test methods.

## Artifact Index
- `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/DISPATCH.md` — Agent dispatch log
- `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/BRIEFING.md` — Working memory and context index
- `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/progress.md` — Liveness and step tracking
- `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/analysis.md` — Exhaustive UI/UX & Interactive Flow Specification
- `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_1/handoff.md` — 5-Component Handoff Report
