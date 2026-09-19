# DISPATCH — Explorer M2-2: Keyboard Shortcuts & Reactivity Subsystem

**Role**: teamwork_preview_explorer (Interaction & Keyboard Shortcuts Designer)  
**Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Assigned Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2`  
**Application Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Authoritative Documents**:
- `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (MUST READ FIRST)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md`
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/GATE_STATUS.md`

## Objectives
1. **Analyze Keyboard Shortcuts `[1]`-`[4]` Requirement**:
   - Inspect archetype loading in `src/presentation/context/AppContext.tsx` and `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`.
   - Design a global `useKeyboardShortcuts` hook or listener:
     * Key `1` -> Switch to Catia Cortázar (`RVA171`)
     * Key `2` -> Switch to George Maduro (`RVA172`)
     * Key `3` -> Switch to Sharella Willems (`RVA173`)
     * Key `4` -> Switch to Xiomara Tromp (`RVA174`)
     * Safety check: Suppress shortcut when active element is `INPUT`, `TEXTAREA`, `SELECT`, or `isContentEditable`.
   - Design visual shortcut indicators `[1]`, `[2]`, `[3]`, `[4]` inside the dropdown item pills.
2. **Deliverables**:
   - Write comprehensive architectural design, hook design, and recommended code changes to `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2/handoff.md`.
   - Update your `progress.md` and notify parent orchestrator.

## 2026-09-14T19:28:53Z
You are Explorer M2-2 investigating Milestone 2 (Admin Cockpit Switcher & Status Pill — R1) for Medical Trip Colombia S.A.S.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2
Read /Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2/DISPATCH.md, /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md, /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md, and /Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/GATE_STATUS.md.

Investigate:
1. Keyboard Shortcuts `[1]`-`[4]`: design global listener for instant switching between the 4 archetypes (Catia [1], George [2], Sharella [3], Xiomara [4]) without opening dropdown.
2. Safety guards to ignore shortcuts when user is typing in form inputs/textarea.
3. Visual shortcut badges inside the dropdown list.
Write your findings and code blueprints to /Users/miyo123/projects/medicaltrip/.agents/explorer_m2_2/handoff.md and send a message when done.
