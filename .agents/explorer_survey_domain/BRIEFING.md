# BRIEFING — 2026-08-23T15:35:00Z

## Mission
Discover and exhaustively document all domain entities, business rules, real-world drive archetypes, financial calculation rules, territorial invariants, and operational patterns for the Medical Trip Calendar & Settlement App.

## 🔒 My Identity
- Archetype: Specification Miner / Domain & Specifications Mining Explorer
- Roles: Teamwork specialist, Domain expert
- Working directory: /Users/miyo123/projects/medicaltrip/.agents/explorer_survey_domain
- Original parent: 14c099cc-4f18-40e0-b392-8d08775687a5
- Milestone: Phase 1 - Domain & Specifications Mining Exploration

## 🔒 Key Constraints
- Read-only on source code and production assets; output only to `.agents/explorer_survey_domain/`
- Zero hallucination: all domain facts and entities backed by empirical evidence in `data/`, `methodology/`, or codebase
- Comply with PHI privacy rules (ENT-PAX-XXXX identifiers)
- Full precision on financial rules (BigInt integer cents, Martin Fowler Money Pattern)
- Exact enumeration of the 4 real-world Drive archetypes (`RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Eduard CES`, `RVA077 Rumai 12d`)

## Current Parent
- Conversation ID: 14c099cc-4f18-40e0-b392-8d08775687a5
- Updated: 2026-08-23T15:35:00Z

## Task Summary
- **What to explore**: Domain entities (`ENT-PAX`, `RVA`, `CTZ`, `DRV`, `GUIA`, `CLINIC`/`LAB`, `HOTEL`), 4 real-world archetypes, financial settlement rules (BigInt cents, formula), domain invariants (`OperativeTerritory`).
- **Success criteria**: Comprehensive, highly structured `survey_domain.md` and standard 5-component `handoff.md`.
- **Interface contracts**: Domain contracts, types, BigInt money math, event categories.
- **Code layout**: Input files in `data/`, `methodology/`, `apps/`, output in `.agents/explorer_survey_domain/`.

## Key Decisions Made
- Fully mined primary Google Drive spreadsheets (`RVA171-4_5`, `RVA282-5_6`, `RVA341-1`, `RVA077-5`), `Liquidacion_acompanamiento_presencial.xlsx`, and `Liquidacion_transporte.xlsx`.
- Documented exact BigInt tariffs ($15.500/h guianza, $15.500 prep allowance, $8k/$25k/$35k/$45k meal subsidies, $110k-$173.7k airport transfers, $25k night surcharge).
- Defined fail-fast geospatial invariant for `OperativeTerritory` rejecting `MOCOA` and other non-operative zones.

## Artifact Index
- `.agents/explorer_survey_domain/DISPATCH.md` — Initial dispatch message.
- `.agents/explorer_survey_domain/BRIEFING.md` — Agent briefing & memory.
- `.agents/explorer_survey_domain/progress.md` — Heartbeat and step tracking.
- `.agents/explorer_survey_domain/survey_domain.md` — Complete domain specification catalog.
- `.agents/explorer_survey_domain/handoff.md` — 5-component handoff report.
