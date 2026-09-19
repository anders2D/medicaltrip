# 🏛️ Antigravity Governance Core (R1) — Comprehensive Specification & Discovery Report

**Author**: `survey_explorer_1` (Governance Spec Miner)  
**Date**: 2026-08-24T22:58:00-05:00  
**Scope**: `.agents/` Governance Infrastructure (Rules, Agents, Skills, Runtime Scripts)  
**Target Milestone**: Radical Functional Minimalism Governance Core (Requirement R1)

---

## 1. Executive Summary & Architecture Blueprint

To achieve the architecture of **Radical Functional Minimalism** (Dieter Rams, Linear, Notion, Apple HIG) and eliminate all cognitive friction and developer telemetry, the Antigravity Governance Core in `.agents/` must codify, enforce, and automate strict invariant checks across the entire development lifecycle.

The governance core operates across three integrated tiers:
1. **Workspace Rules (`.agents/rules/`)**: Static guidelines and mathematical constraints loaded automatically by Antigravity across all turns.
2. **Specialized Subagents (`.agents/agents/`)**: Dual-persona division of labor between an adversarial inspector (`uiux_critic_auditor`) and a headless refactoring builder (`generative_ui_architect`).
3. **Autonomous Skill & Runtime Harness (`.agents/skills/uiux-autonomous-guardian/`)**: Low-level Chrome DevTools Protocol (CDP) inspector executing in-browser pruned Accessibility Object Model (AOM < 2,000 tokens), Set-of-Marks (SoM) visual coordinate grounding, dynamic SSIM visual regression with semantic masking, and a 0-4 Nielsen severity gate.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     ANTIGRAVITY REUSABLE GOVERNANCE CORE ARCHITECTURE (R1)                      │
├──────────────────────────────────┬──────────────────────────────────┬────────────────────────────┤
│ 1. WORKSPACE RULES               │ 2. SPECIALIZED SUBAGENTS         │ 3. SKILL & HARNESS         │
│ • uiux_minimalist_standards.md   │ • uiux_critic_auditor            │ • uiux-autonomous-guardian │
│   (Tailwind allow-list, mono,    │   (Adversarial Critic,           │   (SKILL.md)               │
│    tabular-nums, DOM flattening) │    Nielsen 0-4 gate >= 2 blocks) │ • audit_uiux_heuristics.mjs│
│ • cognitive_load_invariants.md   │ • generative_ui_architect        │   (AOM <2k tokens, SoM,    │
│   (Hick-Hyman <=5, modal depth=1,│   (Headless builder,             │    dynamic SSIM masking,   │
│    optimistic undo Ctrl+Z)       │    allow-list generative UI)     │    WCAG 2.2 AAA contrast)  │
└──────────────────────────────────┴──────────────────────────────────┴────────────────────────────┘
```

---

## 2. Existing Governance Infrastructure State & Gap Analysis

An exhaustive inspection of the `.agents/` directory revealed the following baseline state:

| Component Path | Current State | Deficiencies / Gaps | Action Required |
|---|---|---|---|
| `.agents/rules/uiux_design_standards.md` | Exists (21 lines) | General Nielsen summary; lacks strict Tailwind allow-lists, monotonic scale tokens, shadow bans, and DOM flattening invariants. | Retain as general reference or complement with minimalist standards. |
| `.agents/rules/uiux_minimalist_standards.md` | **MISSING** | Complete absence of codification for Radical Functional Minimalism, Tailwind class allow-lists, and tabular numbers. | **CREATE NEW RULE FILE** with full invariant specifications. |
| `.agents/rules/cognitive_load_invariants.md` | **MISSING** | Complete absence of mathematical bounds for Hick-Hyman Law (<= 5 actions), modal depth limit = 1, and mandatory toast undo. | **CREATE NEW RULE FILE** with strict cognitive constraints. |
| `.agents/agents/uiux_critic_auditor/` | **MISSING** | No dedicated subagent directory, `agent.md`, or `agent.yaml` contract. | **CREATE DIRECTORY & CONTRACTS** (`agent.md` + `agent.yaml`). |
| `.agents/agents/generative_ui_architect/` | **MISSING** | No dedicated subagent directory, `agent.md`, or `agent.yaml` contract. | **CREATE DIRECTORY & CONTRACTS** (`agent.md` + `agent.yaml`). |
| `.agents/skills/uiux-autonomous-guardian/SKILL.md` | Exists (76 lines) | Mentions 5 pillars conceptually, but lacks deterministic execution procedures, schema definitions, and CLI arguments. | **UPDATE & EXPAND** with complete operational workflow. |
| `.agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs` | Exists (216 lines) | Hardcoded old artifact path, no AOM pruning (<2k tokens), no SoM bounding box tagging, no SSIM comparison, no 0-4 severity exit gate. | **REFACTOR COMPLETELY** with 6 modular CDP auditing engines. |

---

## 3. Exhaustive Target Specifications & Contracts

### 3.1 Specification: `.agents/rules/uiux_minimalist_standards.md`
- **Target Path**: `/Users/miyo123/projects/medicaltrip/.agents/rules/uiux_minimalist_standards.md`
- **Scope**: Loaded globally on all UI/UX styling and markup tasks.
- **Contract & Rules**:
  1. **Strict Tailwind Allow-List**:
     - Light mode backgrounds: `bg-white`, `bg-zinc-50`, `bg-zinc-100`, `bg-zinc-200/50`.
     - Dark mode backgrounds: `bg-zinc-900`, `bg-zinc-950`, `bg-zinc-800`.
     - Text colors: `text-zinc-950`, `text-zinc-900`, `text-zinc-700`, `text-zinc-600`, `text-zinc-500`, `text-zinc-400`, `text-white`.
     - Single-Hue Functional Accents: `emerald-600` (positive/settled/active), `rose-600` (destructive/negative), `indigo-600` (clinical pathway), `amber-600` (attention/warning), `sky-600` (flight/logistics).
     - **PROHIBITION**: Zero artificial neon AI gradients (`from-fuchsia-500`, `bg-gradient-to-r`, `via-purple-500`, glowing outer rings).
  2. **Hairline 1px Borders Over Heavy Drop Shadows**:
     - **PROHIBITION**: `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`.
     - **ALLOWED**: 1px subtle hairline borders (`border-zinc-200/60`, `dark:border-zinc-800/60`, `ring-1 ring-zinc-200/50`) and ultra-low elevation cards (`shadow-xs` / `shadow-subtle` blur <= 2px, opacity <= 0.04).
  3. **Mandatory Monospace & Tabular Numerals**:
     - All financial numbers, delta calculations, timestamps, dates, flight codes (`AV9344`), patient IDs (`ENT-PAX-0042`), and currency amounts must strictly include:
       ```css
       tabular-nums font-mono
       ```
  4. **Monotonic Typographic Scale**:
     - Interface is constrained to 4 discrete font sizes:
       * `text-xs` (12px): Metadata badges, keyboard shortcuts, captions, helper hints.
       * `text-sm` (14px): Body copy, table cells, form labels, input values, button text.
       * `text-base` (16px): Card titles, modal headers, subsection headers, hero KPIs.
       * `text-xl` / `text-lg` (20px/18px): Page-level views, grand total balance title.
  5. **DOM Flattening & Hierarchy Invariant**:
     - Element nesting depth <= 6 levels from root container.
     - Eliminate superfluous intermediate wrapper `<div>` elements; apply flex/grid directly on semantic parent tags.
  6. **Kinetic Tactile Feedback**:
     - Interactive elements must provide micro-kinetic feedback: `active:scale-[0.98] transition-transform duration-150` or `active:scale-95`.

---

### 3.2 Specification: `.agents/rules/cognitive_load_invariants.md`
- **Target Path**: `/Users/miyo123/projects/medicaltrip/.agents/rules/cognitive_load_invariants.md`
- **Scope**: Loaded globally on all interaction, UX, flow, and component architecture tasks.
- **Contract & Rules**:
  1. **Hick-Hyman Law Mathematical Action Ceiling**:
     - Invariant: Maximum 5 primary action targets visible simultaneously per viewport (<= 5).
     - Primary button hierarchy: At most ONE solid primary button (`bg-zinc-900 text-white`) per active section; secondary actions must be outlined or ghost.
  2. **Modal Nesting Depth Invariant (Depth = 1)**:
     - Invariant: Modal depth <= 1.
     - Absolute prohibition against modal-on-modal stacking.
     - Secondary interactions must use context slide-over drawers (`<Drawer>`), accordions, or inline editing.
  3. **Optimistic State UI & Universal Undo (`Ctrl+Z`)**:
     - Invariant: Mutations must reflect in UI state instantaneously (<16ms) without blocking on network promises.
     - A non-blocking toast notification must display the mutation outcome with a 1-click **"Deshacer"** (Undo) button.
     - The application must support keyboard shortcut `Ctrl+Z` / `Cmd+Z` to revert the optimistic mutation.
  4. **Nielsen Heuristic #6 (Recognition over Recall)**:
     - 1-Click Speed Presets: Standard operations must be preconfigured into 1-tap buttons (`☕ Café $15k`, `💊 Farmacia $185k`, `🍽️ Almuerzo $25k`, `🚕 Taxi $90k`, `🚗 Traslado $90k`).
     - Prefilled dropdowns and instant archetype switcher pills (`[1-4]`).
     - Dual-Timezone Display: Real-time dual display of `COT (Medellín, UTC-5)` and `AST (Caribe, UTC-4)` on all arrival/itinerary cards.
  5. **Fitts' Law & Touch Ergonomics (WCAG 2.2 AAA)**:
     - Touch targets on mobile viewports (< 768px) must have minimum bounding box >= 44 x 44px.
     - Mobile navigation must use a thumb-accessible docked bottom navigation bar.

---

### 3.3 Specification: `.agents/agents/uiux_critic_auditor/`
- **Target Paths**:
  - `/Users/miyo123/projects/medicaltrip/.agents/agents/uiux_critic_auditor/agent.md`
  - `/Users/miyo123/projects/medicaltrip/.agents/agents/uiux_critic_auditor/agent.yaml`
- **Role**: Adversarial Senior UI/UX Critic & Usability Inspector.
- **Nielsen Severity Rating Matrix**:
  * **Level 0 (Informational)**: Polish ideas, minor animation easing adjustment.
  * **Level 1 (Cosmetic)**: 1-2px padding mismatch, font weight inconsistency without usability impact.
  * **Level 2 (Minor Friction)**: Suboptimal recognition, confusing shortcut label, touch target <44px on secondary item.
  * **Level 3 (Major Usability Defect)**: Hick-Hyman violation (>5 primary buttons), stacked modal dialogs, missing undo on destructive mutation, contrast ratio < 4.5:1.
  * **Level 4 (Usability Catastrophe)**: Uncaught runtime exception, blocked workflow, invisible text (< 3:1 contrast), inability to dismiss modal.
- **PR Gate Enforcement Policy**:
  - **BLOCK**: Any defect with Severity >= 2 triggers an automatic rejection and blocks PR/release.
- **YAML Contract Definition (`agent.yaml`)**:
```yaml
name: uiux_critic_auditor
version: 1.0.0
type: auditor
description: Adversarial UI/UX heuristic critic enforcing Nielsen H1-H10, WCAG 2.2 AAA, and zero-friction cognitive invariants.
rules:
  - .agents/rules/uiux_minimalist_standards.md
  - .agents/rules/cognitive_load_invariants.md
  - .agents/rules/uiux_design_standards.md
capabilities:
  - cdp_accessibility_inspection
  - nielsen_heuristic_evaluation
  - wcag_aaa_contrast_verification
  - cognitive_load_action_counting
  - structural_ssim_regression_check
gate_policy:
  min_score: 95
  max_tolerated_severity: 1
  block_on_severity_gte: 2
tools:
  - run_command
  - view_file
  - grep_search
```

---

### 3.4 Specification: `.agents/agents/generative_ui_architect/`
- **Target Paths**:
  - `/Users/miyo123/projects/medicaltrip/.agents/agents/generative_ui_architect/agent.md`
  - `/Users/miyo123/projects/medicaltrip/.agents/agents/generative_ui_architect/agent.yaml`
- **Role**: Headless Primitive & Generative UI Refactoring Architect.
- **Mission**: Construct, refactor, and generate declarative React UI components and layouts adhering to Radical Functional Minimalism, strict Design System allow-lists, and DOM flattening.
- **Key Responsibilities**:
  1. Enforce Design System Allow-List: `Button`, `Input`, `Select`, `Modal`, `Drawer`, `Card`, `Badge`, `Toast`, `TactileSignaturePad`, `DockedBalanceBar`.
  2. Implement DOM flattening (strip nested containers, enforce max depth <= 6).
  3. Ensure all numbers and currency amounts use `tabular-nums font-mono`.
  4. Integrate optimistic UI mutations with non-blocking toasts and `Ctrl+Z` undo handlers.
  5. Enforce dual-timezone headers and keyboard accelerators (`[N]`, `[I]`, `[C]`, `[T]`, `[1-4]`, `[Esc]`).
- **YAML Contract Definition (`agent.yaml`)**:
```yaml
name: generative_ui_architect
version: 1.0.0
type: builder
description: Headless primitive and generative UI architect constructing zero-friction minimalist React/Tailwind interfaces.
rules:
  - .agents/rules/uiux_minimalist_standards.md
  - .agents/rules/cognitive_load_invariants.md
  - .agents/rules/hexagonal_architecture_standards.md
allow_list:
  components:
    - Button
    - Input
    - Select
    - Modal
    - Drawer
    - Card
    - Badge
    - Toast
    - TactileSignaturePad
    - DockedBalanceBar
  colors:
    - zinc-50
    - zinc-100
    - zinc-200
    - zinc-300
    - zinc-400
    - zinc-500
    - zinc-600
    - zinc-700
    - zinc-800
    - zinc-900
    - zinc-950
    - white
    - emerald-600
    - rose-600
    - indigo-600
    - amber-600
tools:
  - replace_file_content
  - write_to_file
  - view_file
  - run_command
```

---

### 3.5 Specification: `.agents/skills/uiux-autonomous-guardian/` & `scripts/audit_uiux_heuristics.mjs`
- **Target Paths**:
  - `/Users/miyo123/projects/medicaltrip/.agents/skills/uiux-autonomous-guardian/SKILL.md`
  - `/Users/miyo123/projects/medicaltrip/.agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs`
- **Core Upgrades Required**:
  1. **Dynamic Configuration**: CLI flags & environment variables (`--url`, `--port`, `--artifact-dir`, `--chrome-path`) replacing hardcoded legacy paths.
  2. **In-Browser Pruned AOM Extractor**:
     - CDP `Accessibility.getFullAXTree` or in-browser semantic walker.
     - Prunes non-semantic intermediate `<div>`s, hidden nodes, and empty wrappers.
     - Generates compact AOM JSON snapshot under **2,000 tokens**.
  3. **Set-of-Marks (SoM) Visual Coordinate Grounding**:
     - Scans all interactive elements (`button`, `input`, `select`, `a[href]`, `canvas`, `[role="button"]`).
     - Injects temporary numbered badge overlays (`[1]`, `[2]`, `[3]`... `[N]`).
     - Captures SoM annotated screenshot (`som_annotated_preview.png`).
     - Exports precise centroid grounding dictionary:
       ```json
       { "id": 1, "tag": "button", "role": "button", "label": "Nuevo Paciente [N]", "rect": { "x": 120, "y": 45, "width": 140, "height": 38 } }
       ```
  4. **Dynamic SSIM Visual Regression with Semantic Masking**:
     - Compares baseline viewport screenshot with current screenshot.
     - Dynamically applies black bounding box masks over volatile regions (e.g. elements with `data-volatile="true"`, dynamic timestamps, clock seconds, SHA-256 seal) to eliminate false positive diffs.
     - Calculates SSIM score; asserts SSIM >= 0.98.
  5. **Automated 10 Nielsen Heuristics Suite**:
     - H1 (Visibility): Offline badge, live balance bar, sync state.
     - H2 (Real World Match): Clinical & logistic terms (`JMC Rionegro`, `Curazao`, `Papiamento`, `COP`).
     - H3 (Control & Freedom): `[Esc]` key handler, cancel buttons, toast undo (`Ctrl+Z`).
     - H4 (Consistency & Standards): Zinc/slate palette allow-list, `tabular-nums font-mono` on all numbers, zero neon gradients.
     - H5 (Error Prevention): Real-time validation attributes, disabled invalid actions.
     - H6 (Recognition over Recall): >= 4 fast expense presets, patient switcher pills (`[1-4]`), dual-timezone display.
     - H7 (Flexibility & Shortcuts): Visible shortcuts (`[N]`, `[I]`, `[C]`, `[T]`, `[1-4]`, `[Ctrl+Z]`).
     - H8 (Minimalism & Cognitive Load): Hick-Hyman <= 5 primary actions, modal depth <= 1, zero `shadow-xl`/`shadow-2xl`.
     - H9 (Error Recovery): Clear human-readable error banners.
     - H10 (Help & Documentation): Contextual tooltips and shortcut legends.
  6. **WCAG 2.2 AAA Contrast & Touch Target Engine**:
     - Calculates precise relative luminance for all text elements: L = 0.2126R + 0.7152G + 0.0722B.
     - Asserts Contrast Ratio >= 7:1 (normal text) and >= 4.5:1 (large text).
     - Asserts mobile touch target bounding box >= 44 x 44px.
  7. **Automated Severity Gate (Exit Code 1 on Severity >= 2)**:
     - Generates structured JSON report `uiux_heuristic_audit_log.json`.
     - Exits with non-zero code if any defect with severity >= 2 is detected.

---

## 4. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Rule / Styling | Strict Tailwind Allow-List | Constrains palette to neutral zincs and single-hue semantic accents; bans neon gradients. | Tailwind class strings | Validated class tokens | Flagged as Severity 1 or 2 defect if prohibited class present | `.agents/rules/uiux_design_standards.md`, `ORIGINAL_REQUEST.md` |
| 2 | Rule / Styling | Hairline Borders Over Shadows | Replaces heavy box-shadows (`shadow-xl`, `shadow-2xl`) with 1px zinc hairline borders. | CSS box-shadow properties | 1px border tokens (`border-zinc-200/60`) | Flagged as defect if `shadow-xl` or `shadow-2xl` used | `ORIGINAL_REQUEST.md` R1 |
| 3 | Rule / Typography | Mandatory Tabular Monospace | Enforces `tabular-nums font-mono` for all currency, balances, timestamps, and codes. | HTML/JSX elements with numerical data | Clean non-jitter rendering | Flagged as Severity 2 defect if numeric data lacks `tabular-nums` | `ORIGINAL_REQUEST.md` R1, `investigacion_gestion_total_uiux_ai_agentes.md` |
| 4 | Rule / Typography | Monotonic Typographic Scale | Restricts interface typography to exactly 4 sizes: 12px, 14px, 16px, 20px. | Font size classes | Clean typographic hierarchy | Flagged if arbitrary oversized classes are used | `ORIGINAL_REQUEST.md` R2 Phase 2 |
| 5 | Rule / Cognitive | Hick-Hyman Action Ceiling (<= 5) | Mathematically restricts primary action targets per view to <= 5 to minimize decision latency. | Viewport interactive elements | Count of primary actions (<= 5) | Flagged as Severity 3 defect if primary actions exceed 5 | `ORIGINAL_REQUEST.md` R1, Hick-Hyman Law |
| 6 | Rule / Cognitive | Modal Nesting Limit (Depth <= 1) | Prohibits modal-on-modal stacking, requiring slide-over drawers or inline editing instead. | Active DOM dialog stack | Dialog depth count (<= 1) | Flagged as Severity 3 defect if multiple modals stacked | `ORIGINAL_REQUEST.md` R1 |
| 7 | Rule / Cognitive | Optimistic UI & Toast Undo | Mandates instantaneous state update with non-blocking toast and `Ctrl+Z` undo handler. | User mutation action | Instant state + undo toast | Flagged as Severity 3 defect if mutation blocks UI or lacks undo | `ORIGINAL_REQUEST.md` R1/R2, `AGENTS.md` |
| 8 | Rule / Cognitive | Dual-Timezone Awareness | Displays simultaneous timestamps for `COT (Medellín)` and `AST (Caribe)`. | Itinerary events & flight arrival | Dual timezone chips | Flagged if timezone conversion is ambiguous | `ORIGINAL_REQUEST.md` 2026-08-24 Caribbean reqs |
| 9 | Rule / WCAG | WCAG 2.2 AAA Touch Targets | Enforces minimum 44 x 44px touch targets on mobile viewports. | Interactive bounding boxes | Pass/Fail compliance | Flagged as Severity 2/3 defect if touch target < 44px on mobile | WCAG 2.2 AAA, `ORIGINAL_REQUEST.md` R3 |
| 10 | Rule / WCAG | WCAG 2.2 AAA Contrast Ratios | Enforces >= 7:1 contrast ratio for normal text and >= 4.5:1 for large text. | Foreground/Background colors | Luminance contrast score | Flagged as Severity 3/4 defect if contrast < 4.5:1 | WCAG 2.2 AAA, `audit_uiux_heuristics.mjs` |
| 11 | Agent / Audit | Adversarial Critic Subagent | Dedicated `uiux_critic_auditor` running Nielsen 0-4 severity rating matrix. | Code diffs, screenshots, AOM | Structured audit report | Blocks merge/PR if severity >= 2 defects exist | `ORIGINAL_REQUEST.md` R1, `.agents/agents/` schema |
| 12 | Agent / Builder | Generative UI Architect Subagent | Dedicated `generative_ui_architect` constructing allow-listed headless primitives. | Feature specs & requirements | Refactored React TSX code | Rejects generation of non-allow-listed components | `ORIGINAL_REQUEST.md` R1, `.agents/agents/` schema |
| 13 | Skill / Perception | In-Browser Pruned AOM Extractor | Extracts semantic Accessibility Object Model snapshot compressed to < 2,000 tokens. | CDP Accessibility / DOM | Pruned AOM JSON string | Falls back to filtered semantic walker if CDP AX fails | `investigacion_gestion_total_uiux_ai_agentes.md`, `SKILL.md` |
| 14 | Skill / Vision | Set-of-Marks (SoM) Grounding | Injects numbered visual tags `[1..N]` and maps exact centroid coordinates for interactive elements. | Interactive DOM elements | Annotated screenshot + coordinate map | Handles off-screen / clipped elements gracefully | `investigacion_gestion_total_uiux_ai_agentes.md`, OmniParser |
| 15 | Skill / Visual QA | Dynamic SSIM Regression & Masking | Compares baseline and current screenshots while masking volatile dynamic regions. | Baseline PNG, Current PNG, Mask regions | SSIM score (>= 0.98) | Fails if structural layout shifted beyond tolerance | `investigacion_gestion_total_uiux_ai_agentes.md`, `SKILL.md` |

---

## 5. Edge Cases & Observed Behavior Matrix

| # | Feature | Input / Condition | Observed / Documented Behavior |
|---|---------|-------------------|--------------------------------|
| 1 | Tabular Monospace | Dynamic net balance with negative values (`-$245.000 COP`) | Formatted with `tabular-nums font-mono text-rose-600` with fixed character widths, preventing digit jitter. |
| 2 | Hick-Hyman Action Limit | Mobile view with header buttons + calendar view buttons + bottom navigation | Bottom navigation is categorized as navigation bar; header action cluster must have <= 5 primary buttons. |
| 3 | Modal Depth Invariant | User clicks "Nuevo Paciente" from inside "Editar Itinerario" modal | Prohibited from opening modal #2; must open a context slide-over drawer or inline form panel. |
| 4 | Optimistic Undo (`Ctrl+Z`) | User logs fast expense (`☕ Café $15k`), then closes browser tab within 2 seconds | Optimistic state persisted immediately to IndexedDB/Dexie before network sync; undo token valid during session. |
| 5 | Touch Target on Small Screen | Mobile viewport (390x844) with compact calendar day cells (32px) | Calendar day cells must use minimum bounding padding/hit area >= 44 x 44px via `after:absolute after:-inset-1.5`. |
| 6 | Dynamic SSIM Masking | Screenshot taken while live clock seconds or SHA-256 seal hash changes | Masking engine identifies `[data-volatile="true"]` or timestamp selectors and blacks out bounding box before SSIM diff. |
| 7 | Pruned AOM Token Guard | Deep React component tree with 1,500 nested `<div>`s | AOM walker ignores non-ARIA generic containers and collapses empty nodes, keeping JSON snapshot under 1,800 tokens. |
| 8 | SoM Overlay on Sticky Bar | Fixed docked balance bar at bottom of screen during scroll | Overlay badges compute `getBoundingClientRect()` relative to viewport, maintaining 1:1 alignment with interactive targets. |
| 9 | Dual-Timezone Transition | Flight arrival scheduled across midnight in COT vs AST (23:30 COT = 00:30 AST) | Dual chip explicitly renders date difference (`23:30 COT (Hoy) / 00:30 AST (+1 Día)`) to prevent scheduling errors. |
| 10 | Adversarial PR Block Gate | PR introduces a button with `shadow-2xl` and missing keyboard shortcut | Auditor assigns Severity 2; gate triggers `FAIL` and returns exit code 1 to orchestration pipeline. |

---

## 6. Implementation Readiness & Handoff Summary

All specifications, contracts, and requirements for the Antigravity Governance Core (R1) are fully mapped and ready for immediate implementation by subsequent workers:
1. **Rule Files to Create**:
   - `.agents/rules/uiux_minimalist_standards.md`
   - `.agents/rules/cognitive_load_invariants.md`
2. **Subagent Directories & Files to Create**:
   - `.agents/agents/uiux_critic_auditor/agent.md` & `agent.yaml`
   - `.agents/agents/generative_ui_architect/agent.md` & `agent.yaml`
3. **Skill & Script Upgrades to Apply**:
   - `.agents/skills/uiux-autonomous-guardian/SKILL.md` (Update with full 5-phase procedure)
   - `.agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs` (Refactor with pruned AOM, SoM coordinate grounding, dynamic SSIM masking, and severity exit gate).
