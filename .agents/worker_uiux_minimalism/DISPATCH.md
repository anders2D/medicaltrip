# DISPATCH — worker_uiux_minimalism

## 2026-08-24T05:24:00Z
You are a senior UI/UX Engineer and Frontend Architect implementing a 100% minimalist consumer-grade overhaul for Medical Trip Colombia S.A.S.

Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/worker_uiux_minimalism`.
Read the authoritative request at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.
Read the UI/UX survey handoff at `/Users/miyo123/projects/medicaltrip/.agents/survey_explorer_ui/handoff.md`.
Read the operational flows handoff at `/Users/miyo123/projects/medicaltrip/.agents/survey_explorer_flows/handoff.md`.
Read the QA spec handoff at `/Users/miyo123/projects/medicaltrip/.agents/survey_spec_miner_qa/handoff.md`.
The target app is at `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your mission:
1. Apply the complete minimalist design token architecture from `survey_explorer_ui/handoff.md` to `apps/medicaltrip_react_app/src/index.css` and `tailwind.config.js`.
2. Overhaul all UI components to eliminate visual noise, heavy drop shadows, and redundant borders in favor of crisp 1px hairline borders (`border-zinc-200` / `border-zinc-300`), Google Calendar / Linear / Notion standard:
   - `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`: High-density patient selector with `[1-4]` shortcut badges, active pulse dot, and zero-latency switching.
   - `src/presentation/components/calendar/CalendarHeader.tsx` & `CalendarContainer.tsx`: Google Calendar minimalist header, `< Hoy [T] >` nav pill, view switcher tabs (`Mes [M]`, `Semana [W]`, `Día [D]`, `Agenda [A]`), primary CTA `+ Nuevo Evento [C]`.
   - `src/presentation/components/calendar/MonthView.tsx`, `WeekView.tsx`, `DayView.tsx`, `AgendaView.tsx`: 7-column clean grid with 1px hairline dividers, 06:00-22:00 timeline canvas, `font-mono text-zinc-500 tabular-nums` for hour gutters, crimson live time marker, and 15-minute slot snapping with `GhostDropIndicator.tsx`.
   - `src/presentation/components/calendar/EventCard.tsx`: Notion-grade high-density chips with semantic border accents (Sky Blue, Indigo, Teal, Emerald, Amber, Rose, Zinc) and `tabular-nums` timestamps.
   - `src/presentation/components/drawer/EventDetailDrawer.tsx` & `EventForm.tsx`: Desktop 480px slide-over / Mobile swipe-to-dismiss bottom sheet, auto-calculating companion fees, verified clinic selectors, and fail-fast `OperativeTerritory` validation.
   - `src/presentation/components/settlement/DockedSettlementBar.tsx`: Fixed live formula dock (`Flota + Guía + Farmacia - Anticipos = Saldo Neto`), 5 fast expense pills (`☕ Café $15k`, `💊 Farmacia $185k`, `🍽️ Almuerzo $25k`, `🛣️ Peaje $18k`, `🚕 Taxi $90k`), and 1-tap settlement button.
   - `src/presentation/components/settlement/DigitalSignaturePad.tsx`: Retina HTML5 Canvas signature pad, SHA-256 seal, confetti celebration, and instant PDF download.
   - `src/presentation/components/modals/NewPatientModal.tsx` & `SmartItineraryModal.tsx`: Clean dialogs with clear hierarchy, WCAG 2.2 AAA contrast, and fast keyboard navigation.
   - `src/presentation/components/navigation/MobileBottomNav.tsx` & `FloatingActionButton.tsx`: Ergonomic touch navigation and >=44x44px touch targets.
3. Verify that all 74 Vitest test suites (588 tests) pass with 100% PASS rate.
4. Verify that TypeScript typecheck (`tsc --noEmit`) and production build (`tsc -b && vite build`) succeed with 0 errors.
5. Write your complete handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_uiux_minimalism/handoff.md`.
6. When finished, send a message to parent with summary and file path.
