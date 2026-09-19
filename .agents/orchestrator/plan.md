# Strategic Plan: Medical Trip Colombia S.A.S. — UI/UX Overhaul & Certification

## Objective
Execute an ultra-critical visual audit, debate design alternatives, implement a 100% minimalist consumer-grade UI/UX overhaul (Google Calendar / Linear / Notion standard), and rigorously certify all end-to-end operational flows in `apps/medicaltrip_react_app`.

## Scope & Requirements
- **R1: Ultra-Minimalist UI/UX Overhaul & Clutter Elimination**: Zinc/slate neutral palette, 1px subtle borders, WCAG 2.2 AAA contrast, `tabular-nums`, semantic badge accents.
- **R2: Zero-Friction Itinerary & Patient Scheduling Flows**: 1-click patient switching `[1-4]`, smart clinical itinerary generator `[I]`, tactile drag-and-drop rescheduling with 15-min snapping, slide-over / bottom-sheet event drawer.
- **R3: 1-Tap Financial Settlement & Docked Live Formula Dock**: Docked ledger formula, fast expense presets, 1-tap settlement modal with signature canvas, SHA-256 seal, confetti, and instant PDF download.
- **R4: Dual-Paradigm Desktop & Mobile Ergonomics**: Desktop (>=1024px) 7-column grid with right slide-over (420px); Mobile (<768px) swipeable patient pills, bottom nav bar, bottom-sheet modals, >=44x44px touch targets.
- **R5: Comprehensive Autonomous QA & CDP Certification**: 100% Vitest pass rate (74 test files, >580 tests), 0 TypeScript compilation errors (`vite build`), Autonomous QA Chromium CDP harness (0 runtime exceptions, 0 console errors, BigInt delta=0, retina screenshots).

## Phases
1. **Phase 0: Survey & Critical Audit (Parallel Explorers)**
   - Explorer 1 (UI/UX & Design Tokens): Audit UI, layout, palette, typography, visual noise against Google Calendar / Linear / Notion standards.
   - Explorer 2 (Operational Flows & Interactivity): Audit patient switching, drag & drop, drawer, fast expenses, signature canvas, PDF export.
   - Spec Miner 3 (QA, Vitest & CDP Harness): Audit existing tests, test runner, CDP script (`run_autonomous_qa.mjs`), build scripts.
2. **Phase 1: Synthesis & Project Decomposition**
   - Synthesize findings into `apps/medicaltrip_react_app/PROJECT.md` & Feature Inventory.
   - Decompose into focused milestones (M1: Design System & Minimalist Layout, M2: Interactive Itinerary & Drag-and-Drop, M3: Financial Settlement & PDF Audit Sheet, M4: Mobile Responsive Ergonomics, M5: Comprehensive QA & CDP Certification).
3. **Phase 2: Milestone Iteration & Execution**
   - For each milestone: Explorer (3) -> Worker (1) -> Reviewer (2) -> Challenger (2) -> Forensic Auditor (1) -> Gate Check.
4. **Phase 3: Final Certification & Delivery**
   - Full Vitest suite run, Vite build compilation, Autonomous QA CDP run with retina screenshots, forensic audit sign-off, and final report.
