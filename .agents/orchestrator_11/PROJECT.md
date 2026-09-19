# Project: Dual-Portal Architecture & Role Isolation

## Architecture
Medical Trip Colombia S.A.S. — Strict Dual-Portal Architecture with Total UI Isolation, Feature-First Hexagonal boundaries, and Inversion of Control:
- **Core Kernel (`src/core/`)**:
  - `auth`: `AuthContext.tsx`, `LoginView.tsx`. Supports `ADMIN`, `COMPANION`, and `PATIENT` roles with isolated session persistence (`medicaltrip_auth_session` vs `medicaltrip_patient_session`).
  - `ports`: `IStoragePort.ts`, `IBlobStoragePort.ts`, `IPatientInvitationRepository.ts`.
  - `infrastructure`: `ServiceContainer.ts` (Composition Root), `DexieStorageAdapter.ts`, `SupabaseStorageAdapter.ts`.
  - `domain`: Core value objects (`Money`, `OperativeTerritory`), entities (`PatientBooking`).
  - `i18n`: Multilingual support (Spanish, English, Dutch, Papiamento) via `LanguageContext.tsx`.
- **Feature Slices (`src/features/`)**:
  - `patient-portal`: Dedicated vertical slice for `/portal-paciente`. Decoupled `PatientLoginView`, `PatientPortalView` (5 sections: Itinerary, Flights, Hotel, Companion, Satisfaction Signature). 100% DOM exclusion of administrative/financial tools.
  - `settlement`: BigInt cents ledger math, field settlement view, docked settlement bar, fast expense presets, OCR scanner, digital signature pad.
  - `itinerary`: Clinical pathway events, 15-minute drag-and-drop snapping, month/week/day/agenda views, event detail drawer.
  - `logistics-fleet`: Airport arrival tracking (`ArrivalTrackingCard`), driver Ramón Rosero profile, welcome kit, driver check-in action.
  - `companion-shifts`: Hourly turn management ($15.500/h), prep allowance, tiered meal subsidies.
  - `onboarding`: Patient booking creation (`NewPatientModal`), invitation links (`SendPatientInvitationModal`), self-registration wizard (`PatientSelfRegistrationView`).
  - `directory`: Operational staff and patient passengers (`PassengersView`, `UsersView`).
  - `swarm`: Web Worker actor swarm, diagnostics modal, status indicators.
- **Root App Shell (`src/App.tsx`)**:
  - Route separation & anti-tampering guards between `/portal-paciente` and Administrative portal.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Dual-Role AuthContext | Support `ADMIN`, `COMPANION`, and `PATIENT` roles, with `isPatient`, `loginAsPatient`, and `loginAsDemoPatient` | M1 | User Request R3 |
| 2 | Dedicated Session Persistence | Separate localStorage keys: `medicaltrip_auth_session` (admin) and `medicaltrip_patient_session` (patient) with independent logouts | M1 | User Request R3 |
| 3 | Route Guards & Anti-Tampering | Enforce URL guards redirecting patient sessions away from administrative modules (`settlement`, `users`) back to `/portal-paciente` | M1 | User Request R1, R3 |
| 4 | Decoupled Patient Login View | Branded login at `/portal-paciente` accepting reservation codes (`RVA171-4`), invitation tokens, or 1-click Caribbean demo buttons | M2 | User Request R1 |
| 5 | Patient Portal Container | Minimalist, zero-cognitive-friction container with institutional logo, patient badge, dual timezone (`COT`/`AST`), language switcher, coordinator WhatsApp CTA | M2 | User Request R1 |
| 6 | Cost-Free Clinical Itinerary | Day-by-day clinical agenda displaying appointment time, clinic, doctor, and preparation instructions with ZERO costs or financial types in DOM | M2 | User Request R1 |
| 7 | Read-Only Airport Logistics | Flight arrival tracking, assigned driver Ramón Rosero (`Kia Sonet NLX666`), welcome kit, with `DriverCheckInAction` button completely removed from DOM | M2 | User Request R1 |
| 8 | Assigned Hotel & Accommodation | Recovery hotel profile (Inntu / Park 42), address, map link, and room amenities | M2 | User Request R1 |
| 9 | Bilingual Companion Profile | Assigned companion Yenny Roberto, spoken languages, schedule, and direct WhatsApp contact with ZERO rates ($15.5k/h) or meal subsidies in DOM | M2 | User Request R1 |
| 10 | Patient Satisfaction Sign-Off | Touch/stylus Retina HTML5 Canvas signature pad for service conformity, SHA-256 seal, confetti burst, and PDF/printable Certificate of Care with ZERO financial math | M2 | User Request R1 |
| 11 | 22-Item DOM Absence Enforcement | Complete omission from DOM of docked settlement bar, net balance badges, KPI drawer, fast expenses, OCR modal, companion turn sheet, swarm telemetry, etc. | M2 | User Request R1 |
| 12 | Administrator Booking CRUD Enhancements | Add unified text search, status filter (`PROGRAMADO`, `EN_CURSO`, etc.), and archive/delete controls to administrative passenger management | M3 | User Request R2 |
| 13 | Administrator Itinerary & Settlement CRUD | Verify and maintain full CRUD across clinical events (`EventDetailDrawer`), disbursements, cash advances, and BigInt ledger calculations | M3 | User Request R2 |
| 14 | PHI Minimization Standards | Enforce `ENT-PAX-XXXX` identifiers, `passportHash` SHA-256 masking, and exclusion of private medical surveys from general operational views | M3 | User Request R2 |
| 15 | Patient Invitation Repository Decoupling | Decouple `SendPatientInvitationModal` and `PatientSelfRegistrationView` from `LocalStoragePatientInvitationAdapter` to use `ServiceContainer.getInvitationRepository()` | M3 | User Request R2 |
| 16 | Storage Port Inversion & Sync | Ensure all CRUD and invitation operations synchronize across both `DexieStorageAdapter` and `SupabaseStorageAdapter` via `ServiceContainer` | M3 | User Request R2 |
| 17 | Automated Role Boundary Test Suite | Create `tests/presentation/RoleBoundaryIsolation.test.tsx` verifying DOM absence of financial widgets, query scoping, and admin CRUD sync | M4 | User Request R4 |
| 18 | Zero Regressions across 987 Tests | Maintain 100% test pass rate across all 112 existing test suites, with passing `npm run typecheck` and `npm run build` | M4 | User Request R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Auth & Route Guarding | Dual-role `AuthContext`, session persistence decoupling, anti-tampering guards in `App.tsx` | none | DONE |
| M2 | Patient Portal UI & Total Isolation | Autonomous `patient-portal` feature slice (`/portal-paciente`), 5 patient sections, 22-item DOM absence enforcement | M1 | DONE |
| M3 | Admin Workspace CRUD & Storage Sync | Booking search/filter/archive UI, invitation repository inversion (`ServiceContainer`), PHI minimization, storage sync | M1 | DONE |
| M4 | E2E Security Guardrails & Verification | `RoleBoundaryIsolation.test.tsx`, 100% pass across all tests, `typecheck`, and `build` | M1, M2, M3 | DONE |

## Interface Contracts

### `src/core/auth/AuthContext.tsx`
```typescript
export type UserRole = 'ADMIN' | 'COMPANION' | 'PATIENT';

export interface User {
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  email?: string;
  bookingId?: string;      // e.g. 'bkg-rva171' (Required when role === 'PATIENT')
  bookingCode?: string;    // e.g. 'RVA171-4'
  patientId?: string;      // e.g. 'ENT-PAX-0171'
  token?: string;          // e.g. 'INV-DEMO-RVA171'
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCompanion: boolean;
  isPatient: boolean;
  currentRole: UserRole;
  login: (username: string, password: string) => boolean;
  loginAsPatient: (bookingCodeOrToken: string, identifier?: string) => Promise<boolean> | boolean;
  loginAsDemoAdmin: () => void;
  loginAsDemoCompanion: () => void;
  loginAsDemoPatient: (bookingCode?: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}
```

### `src/features/patient-portal/index.ts`
```typescript
export { PatientPortalView } from './presentation/PatientPortalView';
export { PatientLoginView } from './presentation/PatientLoginView';
export { PatientItinerarySection } from './presentation/PatientItinerarySection';
export { PatientFlightSection } from './presentation/PatientFlightSection';
export { PatientHotelSection } from './presentation/PatientHotelSection';
export { PatientCompanionSection } from './presentation/PatientCompanionSection';
export { PatientSatisfactionModal } from './presentation/PatientSatisfactionModal';
```

## Code Layout & Write Boundaries
- **Milestone 1 (Worker M1)**:
  - `src/core/auth/AuthContext.tsx`
  - `src/core/auth/LoginView.tsx`
  - `src/core/auth/index.ts`
  - `src/presentation/state/AuthContext.tsx`
  - `src/App.tsx` (Route guards & session wiring)
- **Milestone 2 (Worker M2)**:
  - `src/features/patient-portal/**` (All files inside new feature slice)
  - `src/App.tsx` (Mounting `/portal-paciente` layout)
- **Milestone 3 (Worker M3)**:
  - `src/features/directory/presentation/PassengersView.tsx` (Search, filter, archive controls)
  - `src/features/onboarding/presentation/SendPatientInvitationModal.tsx`
  - `src/features/onboarding/presentation/PatientSelfRegistrationView.tsx`
  - `src/core/infrastructure/ServiceContainer.ts`
- **Milestone 4 (Test Writer & Reviewers)**:
  - `tests/presentation/RoleBoundaryIsolation.test.tsx`
