# Plan: International Caribbean Patient Experience & Operational Certification

## Objectives
1. Multilingual Caribbean Patient Experience (Papiamento / Dutch / English / Spanish) across patient profile badges, itinerary view, patient card, and PDF export.
2. Airport Arrival & Logistics handoff flow (JMC Rionegro -> Hotel, flight tracking card, 1-click driver check-in, welcome kit).
3. Bilingual Companion Turn Management & Financial Accounting (hourly shifts $15.500 COP/h, prep allowance $15.500 COP, tiered meal allowances, digital sign-off with SHA-256 seal).
4. 100% Vitest test pass rate and automated Chromium CDP runtime certification (run_autonomous_qa.mjs).

## Phases & Milestones
- **Phase 0: Comprehensive Survey**
  - Explorer 1: Multilingual / Papiamento / Dutch / English / Spanish localization & badges architecture.
  - Explorer 2: Airport Arrival Logistics & Driver handoff architecture.
  - Explorer 3: Companion Shift Calculator, Meal Allowances, Sign-off & Vitest/CDP QA architecture.
  - Formulate PROJECT.md Feature Inventory & Interface Contracts.
- **Milestone 1: Multilingual Caribbean Patient Experience (Papiamento/Dutch/English/Spanish)**
  - Implement language selection, translation dictionary/hooks, nationality badges (CW, AW, BQ), localized itinerary events and PDF templates.
  - Gate: Reviewers + Challenger + Auditor -> Pass.
- **Milestone 2: JMC Airport Arrival & Logistics Flow**
  - Implement flight tracking card (JMC Rionegro -> Hotel), driver check-in action, welcome kit orientation preview.
  - Gate: Reviewers + Challenger + Auditor -> Pass.
- **Milestone 3: Bilingual Companion Turn Management & Financial Accounting**
  - Implement Companion Shift Calculator ($15.500/h, $15.500 prep), Tiered Meal Allowances ($8k, $25k, $35k, $45k), live ledger integration, touch canvas sign-off & SHA-256 seal.
  - Gate: Reviewers + Challenger + Auditor -> Pass.
- **Milestone 4: Vitest Test Suite & Chromium CDP Autonomous QA Certification**
  - 100% Vitest test suite pass (77+ test files).
  - Autonomous Chromium CDP QA harness certification (run_autonomous_qa.mjs): 0 runtime exceptions, 0 console errors, BigInt exact cents ledger arithmetic delta = 0.00 COP, multi-viewport retina screenshots.
  - Gate: Reviewers + Challenger + Auditor -> Final Pass.
