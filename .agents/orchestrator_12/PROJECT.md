# Project: Medical Trip Colombia — UI/UX Modernization & Strict Role Isolation

## Architecture
- **Framework**: React 18, TypeScript, Tailwind CSS, Vite
- **Domain Layer**: Clean / Hexagonal Architecture (`src/core/domain/`, `src/features/*/domain/`)
- **State & Context**:
  - `AuthContext`: Strict Role-Based Access Control (`ADMIN`, `COMPANION`, `PATIENT`). Zero role toggling in session.
  - `AppContext`: Master Caribbean archetypes state (`rva171`, `rva282`, `rva341`, `rva077`), reactive switching, storage synchronization.
- **Routing & Views**:
  - `ADMIN`: `<MainAppLayout />` with Admin Cockpit Switcher, desktop/mobile module navigation (`settlement`, `users`, `plan`, `passengers`).
  - `COMPANION`: Dedicated `<CompanionModeView />` (Consola Operativa en Terreno). Mobile-first, 48px touch targets, shift tracking ($15.500 COP/h + $15.500 COP prep), lunch subsidy tiers, 1-tap petty cash OCR, today's agenda, digital sign-off.
  - `PATIENT`: Dedicated `<PatientPortalView />` (`/portal-paciente`). Strict isolation with 0 financial or administrative elements in DOM.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Purge "Control de Roles Operativos" | Remove hero card (lines 98-179) and `switchRole` from `UsersView.tsx` | M1 | Survey 1 |
| F02 | Operational Staff Directory | Pure staff directory in `UsersView.tsx` with Carolina, Yenny, Ramón, Dra. Acosta, duty badges and WhatsApp links | M1 | Survey 1 |
| F03 | Purge "Ver como Acompañante" Toggle | Remove `btn-switch-role` from `ArchetypeSwitcherBar.tsx`, retain role badge and Logout | M1 | Survey 1 |
| F04 | Dedicated 3-Way Role Routing | In `App.tsx`, route `ADMIN` -> `MainAppLayout`, `COMPANION` -> `CompanionModeView`, `PATIENT` -> `PatientPortalView` | M1 | Survey 1 |
| F05 | CompanionModeView (Window 7) | Create mobile-first Consola en Terreno (48px targets, shift timer, meal tiers, 1-tap OCR, digital sign-off) | M1 | Survey 1, 2 |
| F06 | Anti-Tampering Routing Guards | Non-admin users cannot access `MainAppLayout` modules | M1 | Survey 1 |
| F07 | Visible Cockpit Switcher on Desktop | Remove `md:hidden` from `patient-dropdown-trigger` in `ArchetypeSwitcherBar.tsx` | M2 | Survey 2 |
| F08 | Persistent Status Pill | Render `[🇨🇼 Catia Cortázar · RVA171 \| CIMA · 3 Pax ▾]` in header | M2 | Survey 2 |
| F09 | Keyboard Shortcuts [1]-[4] | Switch between Catia, George, Eduard, Alejandra reactively without page reloads | M2 | Survey 2 |
| F10 | New Patient Trigger [+ Nuevo Paciente] | Quick action button in Cockpit Switcher dropdown | M2 | Survey 2 |
| F11 | Hotel Status in Switcher | Render destination hotel and stay information in switcher dropdown | M2 | Survey 2 |
| F12 | Settlement Explicit Surplus Wording | Update status label to "Saldo a Favor de Medical Trip" in `SettlementView.tsx` | M3 | Survey 2 |
| F13 | Settlement Bento Grid & 1-Tap Hub | Responsive Bento Grid layout with 1-tap petty cash presets and OCR trigger | M3 | Survey 2 |
| F14 | Plan Dual Clinical Timeline | Timeline showing clinical visits alongside recovery schedule in `PlanView.tsx` | M3 | Survey 2 |
| F15 | Hospital Triage Emergency Contacts | Emergency call / WhatsApp triggers for 24/7 hotline and hospital triage | M3 | Survey 2 |
| F16 | Passenger Airline Flight Badges | Display flight badges (e.g. ✈️ ZF-104 Z-Fly) in `PassengersView.tsx` | M3 | Survey 2 |
| F17 | Family Dossier & Masked PHI | Verified normalized `ENT-PAX-XXXX` and SHA-256 passport hash in `PassengersView.tsx` | M3 | Survey 2 |
| F18 | WhatsApp Onboarding Links | 1-click self-management onboarding link generator | M3 | Survey 2 |
| F19 | Patient Portal Tranquil Experience | Verified daily schedule, assigned guide, digital satisfaction signature | M3 | Survey 2 |
| F20 | Negative Role-Switching Test Suite | Assert 0 role-switching controls in DOM for all roles in `RoleBoundaryIsolation.test.tsx` | M4 | Survey 3 |
| F21 | Refactor AuthAndLogin Test | Update test expecting `btn-switch-role` into negative assertion | M4 | Survey 3 |
| F22 | Full Vitest Suite 100% Pass | Maintain 100% passing status across all test files | M4 | Survey 3 |
| F23 | TypeScript & Vite Build Clean | `tsc --noEmit` 0 errors, `vite build` 0 errors | M4 | Survey 3 |
| F24 | Vite Base Path SPA Fix | Set `base: '/'` in `vite.config.ts` for clean SPA subpath refresh | M4 | Survey 3 |
| F25 | Production Vercel Deployment | Deploy with Vercel CLI, verify live HTTP 200 on root and `/portal-paciente` | M5 | Survey 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Strict Role Isolation & Dedicated Routing (R2) | F01, F02, F03, F04, F05, F06 | none | DONE |
| 2 | Admin Cockpit Switcher & Status Pill (R1) | F07, F08, F09, F10, F11 | M1 | DONE |
| 3 | Minimalist Modernization Across Windows 2, 4, 5 (R3) | F12, F13, F14, F15, F16, F17, F18, F19 | M2 | DONE |
| 4 | Test Suite Hardening & Security Boundaries (R4) | F20, F21, F22, F23, F24 | M3 | IN_PROGRESS |
| 5 | Production Deployment & Live Certification (R4) | F25 | M4 | PLANNED |

## Interface Contracts
### `src/features/companion-mode/presentation/CompanionModeView.tsx`
```typescript
export const CompanionModeView: React.FC = () => {
  // Consola Operativa en Terreno:
  // - High contrast 48px touch targets
  // - Shift timer with $15.500/h + $15.500 prep allowance
  // - Lunch subsidy tiers ($0, $8k, $25k, $35k, $45k COP)
  // - 1-tap petty cash OCR modal trigger
  // - Today's patient agenda
  // - Digital sign-off with SHA-256 seal derivation
  // - Clean user badge & Logout button
  // - Zero administrative controls in DOM
};
```

### `src/App.tsx` AuthenticatedApp 3-Way Role Routing
```typescript
// Enforce dedicated routing based on user.role
if (isPatient || user?.role === 'PATIENT' || isPatientPortalRoute) {
  return <PatientPortalView />;
}
if (isCompanion || user?.role === 'COMPANION') {
  return <CompanionModeView />;
}
return <MainAppLayout />; // ADMIN only
```

### `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`
```typescript
// Status Pill: [🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]
// Trigger button visible on all viewports (zero md:hidden restriction)
// Zero role switching buttons (btn-switch-role completely deleted)
```

## Code Layout
- `src/features/companion-mode/presentation/CompanionModeView.tsx` (New component for Window 7)
- `src/features/directory/presentation/UsersView.tsx` (Window 3 - Pure staff directory)
- `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (Window 1 - Status Pill & Cockpit Switcher)
- `src/App.tsx` (Application root - Strict RBAC routing)
- `src/features/settlement/presentation/SettlementView.tsx` (Window 2 - Bento Grid & Surplus Ledger)
- `src/features/medical-plan/presentation/PlanView.tsx` (Window 4 - Dual Clinical Timeline & Emergency Contacts)
- `src/features/directory/presentation/PassengersView.tsx` (Window 5 - Flight Badges & Family Dossier)
- `src/features/patient-portal/presentation/PatientPortalView.tsx` (Window 6 - Patient Board)
- `tests/presentation/RoleBoundaryIsolation.test.tsx` (Security & Role Boundary Suite)
- `tests/presentation/AuthAndLogin.test.tsx` (Authentication & Negative Role Switch Suite)
