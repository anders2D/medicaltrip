# DISPATCH — Explorer M2-1: Cockpit Switcher & Persistent Status Pill

**Role**: teamwork_preview_explorer (UI Architecture & Status Pill Designer)  
**Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Assigned Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_1`  
**Application Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Authoritative Documents**:
- `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (MUST READ FIRST)
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/PROJECT.md`
- `/Users/miyo123/projects/medicaltrip/.agents/orchestrator_12/GATE_STATUS.md`

## Objectives
1. **Analyze `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`**:
   - Inspect the current patient dropdown trigger button (currently having `md:hidden` or viewport restrictions).
   - Determine how to make the Cockpit Switcher permanently visible on all screen sizes (desktop, tablet, mobile).
   - Design the persistent Status Pill:
     `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`
     * Flag: Caribbean island flag (`🇨🇼`, `🇦🇼`, etc.).
     * Name: Active patient full name or short name.
     * Code: Reservation code (`RVA171`, etc.).
     * Clinic: Assigned clinic (`CIMA`, etc.).
     * Pax Count: Total accompanying passengers (`3 Pax`, etc.).
   - Design lodging/hotel status indicator (e.g. `Hotel Diez · Hab 504`).
2. **Deliverables**:
   - Write comprehensive architectural design, component blueprint, and recommended code changes to `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_1/handoff.md`.
   - Update your `progress.md` and notify parent orchestrator.
