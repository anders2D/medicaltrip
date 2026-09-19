# DISPATCH — Worker M2: Implementation of Admin Cockpit Switcher & Status Pill (R1)

**Role**: teamwork_preview_worker (Implementer & QA Specialist)  
**Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Assigned Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/worker_m2`  
**Application Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Authoritative Documents**:
- `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (MUST READ FIRST)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md`
- `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_1/handoff.md`
- `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2/handoff.md`
- `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_3/handoff.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks & Exclusive Write Ownership
You have exclusive write ownership over:
- `src/presentation/hooks/useKeyboardShortcuts.ts` (New file)
- `src/presentation/hooks/index.ts` (Export new hook)
- `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (Refactor)
- `src/App.tsx` (Add key to SettlementView)
- `tests/presentation/useKeyboardShortcuts.test.tsx` (New unit test file)
- `tests/presentation/AdminCockpitSwitcher.test.tsx` (New presentation test file)

### Step 1: Implement `src/presentation/hooks/useKeyboardShortcuts.ts`
Implement the reusable hook following the blueprint in `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2/handoff.md`:
- Positional mapping of keys `1` to `4` (`archetypesList[key - 1]`) with fallback to canonical IDs (`rva171`, `rva282`, `rva341`, `rva077`).
- 7-layer safety shield:
  * `isTypingContext(e)` checking `INPUT`, `TEXTAREA`, `SELECT`, `isContentEditable`, ARIA roles `textbox`, `searchbox`, `combobox`, and `.closest()` ancestor.
  * `isModalDialogOpen()` checking `[role="dialog"]`, `[aria-modal="true"]`, `dialog[open]`.
  * Modifiers guard: ignore if `ctrlKey`, `metaKey`, or `altKey` is pressed (preserves browser tab navigation).
  * IME guard: ignore if `e.isComposing` or `keyCode === 229`.
  * RBAC guard: `enabled` parameter (passed as `isAdmin`).
- Export from `src/presentation/hooks/index.ts`.

### Step 2: Refactor `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`
Implement following the blueprints in `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_1/handoff.md`:
- Remove `md:hidden` from `data-testid="patient-dropdown-trigger"`.
- Implement persistent Status Pill:
  `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`
  * Flag: `activeArchetype?.countryFlag || '🇨🇼'`
  * Name: `activeArchetype?.patientName`
  * Reservation code badge: `activeArchetype?.code?.split('-')[0] || 'RVA171'`
  * Clinic: `resolvePrimaryClinic(activeArchetype?.id, activeBooking?.notes)`
  * Pax count: `${activeArchetype?.paxCount || 3} Pax`
  * Animated `ChevronDown` caret.
- Implement lodging status resolver `resolveLodgingStatus(archetypeId, hotelName)`.
- Dropdown popup:
  * Replace `shadow-2xl` with compliant `shadow-md border border-zinc-200/80 ring-1 ring-zinc-950/5` (Minimalist Standards).
  * Header with "Pacientes en Terreno", `Atajos [1-4]`, and prominent `[+ Nuevo Paciente]` and `[Enviar Link]` buttons.
  * Active lodging banner (`Hotel Inntu · Hab 302 (5 Pax)`).
  * Archetype cards with lodging detail and semantic `<kbd>[{shortcutNum}]</kbd>` keycaps with `aria-keyshortcuts`.
- Integrate `useKeyboardShortcuts({ enabled: isAdmin, onSwitchArchetype: switchArchetype, archetypesList })`.

### Step 3: Enhance `src/App.tsx`
In `src/App.tsx` line 105, render `<SettlementView key={activeBooking?.id || activeArchetypeId} />` to guarantee clean state synchronization.

### Step 4: Add Test Suites
- Create `tests/presentation/useKeyboardShortcuts.test.tsx` based on Explorer M2-2 blueprint.
- Create `tests/presentation/AdminCockpitSwitcher.test.tsx` based on Explorer M2-3 blueprint.

### Step 5: Verify
In `apps/medicaltrip_react_app`:
1. `npm run typecheck`
2. `npx vitest run tests/presentation/useKeyboardShortcuts.test.tsx tests/presentation/AdminCockpitSwitcher.test.tsx tests/presentation/ArchetypeSwitcher.test.tsx`
3. `npm test` (full regression pass)
4. `npm run build`

### Step 6: Output
Write full report to `/Users/miyo123/projects/medicaltrip/.agents/worker_m2/handoff.md` and send message to orchestrator.

## 2026-09-14T19:46:15Z
You are Worker M2 implementing Milestone 2 (Admin Cockpit Switcher & Status Pill — R1) for Medical Trip Colombia S.A.S.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/worker_m2
Read /Users/miyo123/projects/medicaltrip/.agents/worker_m2/DISPATCH.md, /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md, /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md, /Users/miyo123/projects/medicaltrip/.agents/explorer_m2_1/handoff.md, /Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2/handoff.md, and /Users/miyo123/projects/medicaltrip/.agents/explorer_m2_3/handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement:
1. `src/presentation/hooks/useKeyboardShortcuts.ts` with 7-layer safety shield and export via `src/presentation/hooks/index.ts`.
2. Refactor `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` to remove `md:hidden`, render persistent Status Pill `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`, add lodging indicators, minimalist popup, semantic `<kbd>` badges, and wire `useKeyboardShortcuts`.
3. In `src/App.tsx`, add `key={activeBooking?.id || activeArchetypeId}` to `<SettlementView />`.
4. Create test files: `tests/presentation/useKeyboardShortcuts.test.tsx` and `tests/presentation/AdminCockpitSwitcher.test.tsx`.
5. Run in `apps/medicaltrip_react_app`: `npm run typecheck`, `npx vitest run tests/presentation/useKeyboardShortcuts.test.tsx tests/presentation/AdminCockpitSwitcher.test.tsx tests/presentation/ArchetypeSwitcher.test.tsx`, `npm test`, and `npm run build`.

Write your full report to /Users/miyo123/projects/medicaltrip/.agents/worker_m2/handoff.md and send a message when finished.
