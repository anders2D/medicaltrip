# E2E Test Infra: Medical Trip Colombia

## Test Philosophy
- Opaque-box, requirement-driven, and formal mathematical invariance testing.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing + LTL Model Checking & CDP Automation.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | Minimalist Standards Rule | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Cognitive Load Invariants Rule | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | UI/UX Critic Auditor Agent | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | Generative UI Architect Agent | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 5 | UI/UX Autonomous Guardian Skill Upgrade | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 6 | The Purge (Borders, Shadows, Badges) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Typographic Unification & Mono Alignment | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 8 | <= 2 Click Workflows & Cognitive Reduction | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 9 | Micro-Interactions & Optimistic Resilience | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 10 | Vitest 100% Pass Rate Certification | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 11 | WCAG 2.2 AAA & APCA Contrast | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 12 | Chromium CDP Runtime Certification & BigInt Invariance | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test runner: Vitest (`apps/medicaltrip_react_app/package.json`), Node test runner (`apps/itinerarios_liquidacion_offline`), and Chromium CDP harnesses (`.agents/skills/`).
- Pass/Fail Semantics: 100% test pass rate across 101 test files (904 tests), 0 TypeScript compilation errors, 0 runtime exceptions, 0 console errors, exact BigInt ledger delta (0.00 COP), and UI/UX heuristic score >= 98/100.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | End-to-End Caribbean Patient Onboarding (Curazao / Papiamento) | F6, F7, F8, F9, F10, F12 | High |
| 2 | Smart Itinerary Generation & Fast Preset Expense Ingestion | F6, F7, F8, F9, F10, F12 | High |
| 3 | Interactive Calendar Snapping & Responsive Viewport Stress | F6, F7, F8, F10, F11, F12 | High |
| 4 | 1-Tap Touch Settlement, Retina Canvas Signature & SHA-256 Seal | F7, F8, F9, F10, F12 | High |
| 5 | Dual-Timezone Tracking, Multilingual PDF Statement Generation & Undo | F6, F7, F8, F9, F10, F11, F12 | High |

## Coverage Thresholds
- Tier 1: >= 5 tests per feature (60 tests)
- Tier 2: >= 5 tests per feature (60 tests)
- Tier 3: Pairwise coverage of all major feature interactions
- Tier 4: >= 5 realistic application scenarios (covered by the 904 Vitest tests + CDP test harness)
