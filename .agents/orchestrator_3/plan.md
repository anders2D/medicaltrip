# Plan: Autonomous E2E Testing & Formal Flow Verification Framework

## Phase 0: Discovery & Survey
- [x] Create orchestrator environment (`DISPATCH.md`, `BRIEFING.md`, `plan.md`, `progress.md`).
- [ ] Dispatch 3 parallel Explorers / Spec Miners to survey existing code, project setup, whitepapers, and dependencies.
- [ ] Synthesize findings and write master `PROJECT.md` with full Feature Inventory, Architecture, and Interface Contracts.

## Phase 1: Dual Track Execution
- **Track A: Core Architecture & Implementation**
  - Milestone 1: Poly-Modal Hybrid Architecture & Context Routing (LLM reasoning, MBT state machine, Stagehand-style DOM trimming, Playwright MCP protocol, VLM visual fallback).
  - Milestone 2: Formal Process Modeling (Petri Nets / BPMN 2.0 to WPTSPN) & LTL/CTL Temporal Assertion Engine.
  - Milestone 3: Low-Level CDP Hardware Emulation (WebSocket CDP multi-touch Pinch/Pan gestures, 3G network/CPU throttle profiles, focus trap overrides).
  - Milestone 4: Resilient Self-Healing & SSIM Visual Regression Engine (Vectorial memory, VLM locator recovery, SSIM/pHash mask diffing, synthetic PII/PHI-safe data generator).
- **Track B: E2E Testing Track**
  - Test infrastructure harness & runner setup (`TEST_INFRA.md`).
  - Tier 1-4 Test Suites (Tier 1: Feature Coverage, Tier 2: Boundary/Corner, Tier 3: Cross-Feature Interactions, Tier 4: Real-World Medical Trip E2E journeys).
  - Publish `TEST_READY.md`.

## Phase 2: Master Integration & Verification
- Milestone 5: Complete Master Test Runner & CI/CD Sandbox executing full medical trip journey lifecycle.
- Phase 1 E2E Gate: 100% pass on Tiers 1-4.
- Phase 2 Coverage Hardening: Tier 5 White-box adversarial testing with Challenger → Worker → Reviewer loop.
- Forensic Integrity Audit (`teamwork_preview_auditor`).

## Phase 3: Final Synthesis & Handoff
- Final Review and Gate verification.
- Write `handoff.md`.
- Report back to Sentinel.
