# Handoff Report — Explorer 1: Dual-Portal Architecture, Auth & Role Isolation

**Date**: 2026-09-12T19:12:30Z  
**Author**: Explorer 1 (`teamwork_preview_explorer`)  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_survey_1`  
**Target Repository**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Focus**: Auth, Routing, Session Isolation & Boundary Guardrails  

---

## 1. Observation

### 1.1 Existing Authentication Infrastructure (`src/core/auth/`)
- **File**: `src/core/auth/AuthContext.tsx`
  - Lines 20–28:
    ```typescript
    export type UserRole = 'ADMIN' | 'COMPANION';

    export interface User {
      username: string;
      name: string;
      role: UserRole;
      roleLabel: string;
      email?: string;
    }
    ```
  - Lines 30–44: Two presets exist: `ADMIN_USER_PRESET` (Carolina Cortázar, username `'admin'`) and `COMPANION_USER_PRESET` (Yenny Roberto, username `'acompanante'`). No preset or definition exists for `PATIENT`.
  - Lines 46–59: `AuthContextType` exposes:
    ```typescript
    export interface AuthContextType {
      user: User | null;
      isAuthenticated: boolean;
      isAdmin: boolean;
      isCompanion: boolean;
      currentRole: UserRole;
      login: (username: string, password: string) => boolean;
      loginAsDemoAdmin: () => void;
      loginAsDemoCompanion: () => void;
      switchRole: (role: UserRole) => void;
      logout: () => void;
      error: string | null;
      clearError: () => void;
    }
    ```
  - Lines 61–63: `const STORAGE_KEY = 'medicaltrip_auth_session';`
  - Lines 81–96: In test environments (`process.env.NODE_ENV === 'test'`), `AuthContext` automatically boots with `ADMIN_USER_PRESET` unless `window.__TEST_SHOW_LOGIN__ === true` or `'medicaltrip_logged_out' === 'true'`. This is a critical design contract that enables all existing Vitest suites to run authenticated without manual login.
  - Lines 126–145: `login()` only evaluates `'admin'` vs `'guia'` / `'acompanante'` / `'yenny'`. Invalid credentials output: `"Credenciales inválidas. Administrador: admin / admin • Acompañante Físico: guia / guia"`.
- **File**: `src/core/auth/LoginView.tsx`
  - Lines 11–248: A standalone card with two role tabs: `data-testid="role-tab-admin"` and `data-testid="role-tab-companion"`. Quick demo buttons: `admin / admin` and `guia / guia` (`data-testid="btn-demo-companion"`). There is zero patient login interface or reservation code intake.
- **File**: `src/presentation/state/AuthContext.tsx` & `src/presentation/components/auth/LoginView.tsx`:
  - Pure re-export barrier files pointing to `src/core/auth/`.

### 1.2 Existing Routing & Navigation Setup (`src/App.tsx`)
- **File**: `src/App.tsx`
  - Lines 164–177: Routing is handled via lightweight window URL parameters and React state rather than `react-router-dom`:
    ```typescript
    const urlState = typeof window !== 'undefined' && window.location
      ? new URLSearchParams(window.location.search)
      : null;

    const [isSelfRegistration, setIsSelfRegistration] = useState<boolean>(() => {
      if (!urlState) return false;
      return (
        urlState.get('autogestion') === 'true' ||
        urlState.get('registro') === 'true' ||
        !!urlState.get('token') ||
        !!urlState.get('invitation')
      );
    });
    ```
  - Lines 179–201: If `isSelfRegistration` is true, it renders `<PatientSelfRegistrationView />`.
  - Lines 148–162: If not self-registration, wraps with `<AuthProvider>` and renders `<AuthenticatedApp />`. If `!isAuthenticated`, renders `<LoginView />`. If `isAuthenticated`, renders `<MainAppLayout />`.
  - Lines 55–84: `MainAppLayout` always mounts:
    - `<ArchetypeSwitcherBar />` (contains patient switcher dropdown, `+ Nuevo Paciente` modal trigger, `Enviar Link` modal trigger, role switcher `btn-switch-role`, logout `btn-logout`).
    - `<ModuleNav />` (4 tabs: `settlement`, `users`, `plan`, `passengers`).
    - Active module views (`SettlementView`, `UsersView`, `PlanView`, `PassengersView`).
    - Operational modals (`ReceiptOcrModal`, `DigitalSignaturePad`, `NewPatientModal`, `SendPatientInvitationModal`, `CompanionTurnSheetModal`, `SwarmDiagnosticsModal`, `WelcomeOrientationModal`).

### 1.3 Architectural Boundary Guardrail (`tests/architecture_boundaries.test.ts`)
- **File**: `tests/architecture_boundaries.test.ts`
  - Lines 8–17:
    ```typescript
    const FEATURES = [
      'settlement',
      'itinerary',
      'medical-plan',
      'logistics-fleet',
      'companion-shifts',
      'onboarding',
      'directory',
      'swarm',
    ];
    ```
  - Check 1 (lines 67–125): No cross-feature deep imports. Every feature must only be imported through its public `index.ts`. All 8 features possess a public `index.ts`.
  - Check 2 (lines 127–167): Storage Port Inversion. UI (`presentation/`, `ui/`, `App.tsx`) and Use Cases (`application/`, `use-cases/`) must NOT import concrete database classes (`dexie`, `DexieStorageAdapter`, `@supabase/supabase-js`, `SupabaseStorageAdapter`). They must consume `IStoragePort` via props or `ServiceContainer.getStoragePort()`.
  - Check 3 (lines 169–215): Domain Purity. Domain files cannot import external frameworks (`react`, `lucide-react`, `dexie`, `supabase`, `canvas-confetti`, `tailwindcss`).
  - Check 4 (lines 217–231): `IStoragePort.ts` must contain 0 references to concrete DB drivers (`dexie`, `indexeddb`, `supabase`).
  - Execution Result: `tests/architecture_boundaries.test.ts` passes 100% (5/5 tests in 23ms).

### 1.4 Compilation & Test Baseline
- Command: `npm run typecheck` (`tsc --noEmit`)
  - Result: Code 0, 0 errors.
- Command: `npm run build` (`tsc -b && vite build`)
  - Result: Code 0, built in 3.69s (1777 modules transformed, bundles created in `dist/`).
- Command: `npm test` (`vitest run`)
  - Result: 110 of 112 test files passed (979 of 987 tests passed). The only 8 failures occurred exclusively in `tests/e2e/SupabaseLiveE2E.test.ts` (5 tests) and `tests/adversarial/Milestone2StorageSwappabilityAdversarial.test.ts` (3 tests) due to `unable to get local issuer certificate` when Node.js fetch connects to remote cloud Supabase (`https://pxmobokcqhsixfvdsrwj.supabase.co`) without local CA injection.

---

## 2. Logic Chain

```
[Observation: AuthContext only recognizes ADMIN & COMPANION, with single key medicaltrip_auth_session]
                                   │
                                   ▼
[Deduction 1: Role Type & Presets Extension]
Must extend UserRole to include 'PATIENT'.
Must define PATIENT_USER_PRESET with bookingId ('bkg-rva171'), bookingCode ('RVA171-4'), patientId ('ENT-PAX-0171').
AuthContext must expose isPatient: boolean, loginAsPatient(), loginAsDemoPatient().
Preserve existing test-mode automatic admin login unless window.__TEST_SHOW_LOGIN__ or window.__TEST_AS_PATIENT__ is specified.
                                   │
                                   ▼
[Observation: LoginView is tailored exclusively for Admin/Companion with credentials admin/guia]
                                   │
                                   ▼
[Deduction 2: Patient Authentication Decoupling]
Patients do not use passwords; they authenticate via Reservation Code (e.g., 'RVA171-4') or Invitation Token (e.g., 'INV-CUR-901').
Must implement a dedicated, decoupled `PatientLoginView` accessible via `/portal-paciente` or `?portal=paciente`.
Admin login (`LoginView`) remains 100% decoupled, with an unobtrusive footer referral: "¿Eres paciente? Consulta tu viaje aquí".
                                   │
                                   ▼
[Observation: App.tsx routes via URLSearchParams and window.location.pathname; MainAppLayout exposes all admin tools]
                                   │
                                   ▼
[Deduction 3: Dual-Portal Routing & Route Guards]
When URL path is `/portal-paciente` or user role is `PATIENT`:
- Route Guard 1 (Unauthenticated): Render `PatientLoginView`.
- Route Guard 2 (Authenticated as PATIENT): Render `PatientPortalLayout` with patient-centric views only.
- Route Guard 3 (Anti-Tampering): If role is `PATIENT` and user attempts to access `/` or set activeModule='settlement', guard intercepts and redirects back to `/portal-paciente`.
- Route Guard 4 (Admin in Patient URL): Admin accessing `/portal-paciente` gets a "Modo Vista Previa" or quick return banner to Admin Portal.
                                   │
                                   ▼
[Observation: Single localStorage key causes session leakage if Admin & Patient share state]
                                   │
                                   ▼
[Deduction 4: Isolated Session Persistence & Scoped State Queries]
Store patient session in dedicated key: `medicaltrip_patient_session`.
Store admin session in `medicaltrip_auth_session` (or `medicaltrip_admin_session`).
In Patient mode:
- Locking: activeBooking is locked to user.bookingCode / user.bookingId. ArchetypeSwitcherBar is completely hidden.
- Data Scoping: AppContext/PatientContext queries filter events, shifts, and transfers exclusively for that patient.
- Financial Zero-Footprint: settlement is null, expenses is empty array, cash advances / hourly companion rates ($15.500 COP) / fleet profit margins are completely omitted from DOM.
                                   │
                                   ▼
[Observation: architecture_boundaries.test.ts strictly forbids concrete DB imports in UI and cross-feature deep imports]
                                   │
                                   ▼
[Deduction 5: Architecture & Hexagonal Compliance]
PatientPortalLayout and PatientLoginView must consume IStoragePort through ServiceContainer.getStoragePort() or props.
No direct imports of Dexie or Supabase SDK.
Any shared domain entities (e.g. PatientBooking, ItineraryEvent) must be imported through public barrels (`@/core/domain`, `@/features/itinerary`, etc.).
                                   │
                                   ▼
[Deduction 6: Blueprint for tests/presentation/RoleBoundaryIsolation.test.tsx]
Must test:
1. Zero financial / administrative DOM artifacts in Patient Portal.
2. Patient data containment (preventing access to other patients' records).
3. Session persistence isolation (independent localStorage keys, clean logouts).
4. Administrator CRUD completeness & PHI minimization (normalized IDs, masked passports).
```

---

## 3. Caveats

1. **Remote Cloud Supabase TLS Certificate in Test Runner**:
   - In the current macOS execution environment, Node.js `fetch` against `https://pxmobokcqhsixfvdsrwj.supabase.co` produces `unable to get local issuer certificate` during `tests/e2e/SupabaseLiveE2E.test.ts`. This is an environment CA trust issue for outbound Node TLS connections, not a defect in the React application code.
   - For offline test runs, `DexieStorageAdapter` and in-memory mock adapters function with 100% test pass rate.
2. **Client-Side Routing Paradigm**:
   - The application does not use `react-router-dom` (by architectural design, keeping bundle lightweight and offline-first). Routing between `/` and `/portal-paciente` relies on `window.location.pathname`, `window.location.search`, and HTML5 History API (`window.history.pushState`). Tests must set `window.location` or mock `pathname`/`search` accordingly.
3. **Backwards Compatibility Invariant**:
   - Any modification to `AuthContext.tsx` must maintain the default test behavior where `process.env.NODE_ENV === 'test'` starts authenticated as `ADMIN_USER_PRESET` unless explicitly overridden (e.g., via `window.__TEST_SHOW_LOGIN__ = true` or `window.__TEST_AS_PATIENT__ = true`). Altering this default would break up to 70+ existing presentation and adversarial tests.

---

## 4. Conclusion & Technical Blueprint

### 4.1 `src/core/auth/AuthContext.tsx` Evolution Contract

```typescript
// 1. Role Definition
export type UserRole = 'ADMIN' | 'COMPANION' | 'PATIENT';

// 2. User Contract with Patient Scoping
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

// 3. Archetype Presets
export const ADMIN_USER_PRESET: User = {
  username: 'admin',
  name: 'Carolina Cortázar',
  role: 'ADMIN',
  roleLabel: 'Administrador',
  email: 'carolina.cortazar@medicaltrip.co',
};

export const COMPANION_USER_PRESET: User = {
  username: 'acompanante',
  name: 'Yenny Roberto',
  role: 'COMPANION',
  roleLabel: 'Acompañante Físico',
  email: 'yenny.roberto@medicaltrip.co',
};

export const PATIENT_USER_PRESET: User = {
  username: 'paciente_catia',
  name: 'Catia Rodrigues',
  role: 'PATIENT',
  roleLabel: 'Paciente',
  email: 'catia.rodrigues@patient.medicaltrip.co',
  bookingId: 'bkg-rva171',
  bookingCode: 'RVA171-4',
  patientId: 'ENT-PAX-0171',
};

// 4. AuthContext Interface
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

// 5. Dual Storage Keys for Session Isolation
export const ADMIN_STORAGE_KEY = 'medicaltrip_auth_session';
export const PATIENT_STORAGE_KEY = 'medicaltrip_patient_session';
export const ACTIVE_PORTAL_KEY = 'medicaltrip_active_portal'; // 'admin' | 'patient'
```

### 4.2 Dedicated Patient Authentication Flow (`PatientLoginView.tsx`)
- **Location**: `src/presentation/components/patient-portal/PatientLoginView.tsx` (re-exported via `src/presentation/components/auth/PatientLoginView.tsx`)
- **Key Elements**:
  - `data-testid="patient-login-card"`
  - `data-testid="input-patient-code"` (Accepts `RVA171-4`, `RVA-171`, `rva282`, `bkg-rva171`, `INV-CUR-901`)
  - `data-testid="btn-patient-login-submit"`
  - `data-testid="btn-demo-patient"` (1-click quick demo login for QA/testing)
  - `data-testid="link-to-admin-login"` (Navigates to `/`)
  - Zero password field required.
  - Zero administrative/companion options or telemetry visible.

### 4.3 Patient Portal UI Layout (`PatientPortalLayout.tsx`)
- **Location**: `src/presentation/components/patient-portal/PatientPortalLayout.tsx`
- **Guaranteed Isolation (DOM Assertions)**:
  - Total absence of:
    - `data-testid="desktop-module-nav"` & `data-testid="mobile-module-nav"`
    - `data-testid="docked-settlement-bar"`
    - `data-testid="module-tab-settlement"` & `data-testid="module-tab-users"`
    - `data-testid="patient-dropdown-trigger"`
    - `data-testid="btn-header-new-patient"` & `data-testid="btn-header-send-link"`
    - `data-testid="btn-switch-role"`
    - Words: `"Liquidación"`, `"Honorarios"`, `"Anticipos"`, `"Caja Menor"`, `"15.500 COP"`, `"Saldo Neto"`, `"Margen"`, `"Desembolsos"`.
  - Presence of Patient-Centric Features:
    - Patient Hero Card: Titular name, nationality flag, arrival date, normalized ID `ENT-PAX-XXXX`.
    - Clinical Pathway: Chronological view of confirmed medical consultations (Clofán, Cardio VID, CIMA) with doctor, clinic address, and preparation instructions.
    - Airport & Logistics Card: Flight number, arrival time, assigned driver (Ramón Rosero), vehicle details, emergency WhatsApp coordinator button.
    - Hotel Accommodation Card: Hotel name (e.g., Inntu Laureles, Park 42), address, check-in date.
    - Companion Care Card: Assigned bilingual companion (Yenny Roberto) with languages spoken and status — strictly without hourly compensation figures.
    - Service Satisfaction & Digital Signature: Sign-off for received healthcare logistics without financial ledger tables.

### 4.4 Dual-Portal Route Guards (`src/App.tsx`)
```typescript
export const App: React.FC = () => {
  // 1. Detect URL state and path
  const urlParams = typeof window !== 'undefined' && window.location
    ? new URLSearchParams(window.location.search)
    : null;
  const currentPath = typeof window !== 'undefined' && window.location
    ? window.location.pathname
    : '/';

  const isPatientPortalRoute = currentPath.startsWith('/portal-paciente') || urlParams?.get('portal') === 'paciente';
  const isSelfRegistration = urlParams?.get('autogestion') === 'true' || urlParams?.get('registro') === 'true';

  if (isSelfRegistration) {
    return <PatientSelfRegistrationView ... />;
  }

  return (
    <AuthProvider>
      <AppProvider>
        {isPatientPortalRoute ? (
          <PatientPortalRoot />
        ) : (
          <AdminPortalRoot />
        )}
      </AppProvider>
    </AuthProvider>
  );
};
```
- **Inside `AdminPortalRoot`**:
  - Guard: If `user?.role === 'PATIENT'`, redirect immediately to `/portal-paciente`.
  - If `!isAuthenticated`, render `<LoginView />`.
  - If authenticated as `ADMIN` or `COMPANION`, render `<MainAppLayout />`.
- **Inside `PatientPortalRoot`**:
  - If `!isAuthenticated` or `user?.role !== 'PATIENT'`, render `<PatientLoginView />`.
  - If `user?.role === 'PATIENT'`, render `<PatientPortalLayout />`.
  - If `user?.role === 'ADMIN'`, render `<PatientPortalLayout previewMode={true} />` with an exit preview button.

### 4.5 Security & Isolation Test Specification (`tests/presentation/RoleBoundaryIsolation.test.tsx`)
This suite must be structured as follows:

```typescript
describe('RoleBoundaryIsolation & Security Guardrails Suite', () => {
  // Test Suite 1: Patient Portal UI Isolation & Zero Financial Footprint
  describe('1. Patient Portal Visual & DOM Role Isolation', () => {
    it('TC-ISO-01: should render Patient Portal without any administrative navigation, settlement bar, or financial metrics', async () => {
      // Login as patient
      // Assert absence of docked-settlement-bar, module-tab-settlement, module-tab-users, patient-dropdown-trigger
      // Assert absence of financial terminology: 'Liquidación', 'Honorarios', 'Anticipos', '15.500 COP'
    });

    it('TC-ISO-02: should render patient-centric clinical, flight, hotel, and companion care cards', async () => {
      // Assert presence of flight tracker, clinic appointment cards, hotel address, companion info without rates
    });
  });

  // Test Suite 2: State Scoping & Cross-Patient Leakage Prevention
  describe('2. State Scoping & Access Control Guardrails', () => {
    it('TC-ISO-03: should lock queries to the authenticated patient booking and prevent switching to other archetypes', async () => {
      // Verify activeBooking is pinned to RVA171-4; switching to RVA282 is blocked
    });

    it('TC-ISO-04: should strictly guard and redirect administrative routes when accessed from patient session', async () => {
      // Simulate patient attempting to access admin route or setting activeModule='settlement'
      // Guard redirects to /portal-paciente
    });
  });

  // Test Suite 3: Session Persistence Decoupling
  describe('3. Session Storage Isolation & Independent Logout', () => {
    it('TC-ISO-05: should maintain separate localStorage keys for patient and admin sessions without cross-contamination', async () => {
      // Verify medicaltrip_patient_session vs medicaltrip_auth_session
    });

    it('TC-ISO-06: should logout cleanly from Patient Portal without leaving leaked credentials', async () => {
      // Logout in patient portal returns to PatientLoginView, not Admin dashboard
    });
  });

  // Test Suite 4: Administrator CRUD Completeness & PHI Minimization
  describe('4. Administrator CRUD & Data Minimization Guardrails', () => {
    it('TC-ISO-07: should allow Administrator full CRUD operations syncing with storage port', async () => {
      // Admin creates booking, updates event, settles expense, verifies persistence
    });

    it('TC-ISO-08: should enforce PHI data minimization in operational views using normalized IDs and masked passports', async () => {
      // Verify ENT-PAX-XXXX and masked hashes instead of raw passport numbers
    });
  });
});
```

---

## 5. Verification Method

To independently verify these findings and ensure zero regressions when implementing:

1. **Verify Architectural Boundaries**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npx vitest run tests/architecture_boundaries.test.ts
   ```
   *Expected Output*: 5 passed tests (0 cross-feature deep imports, 0 direct DB imports in UI/use-cases).

2. **Verify TypeScript Compilation**:
   ```bash
   npm run typecheck
   ```
   *Expected Output*: Exit code 0, 0 errors.

3. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected Output*: Exit code 0, Vite build completes in <= 4s.

4. **Verify Existing Authentication Tests**:
   ```bash
   npx vitest run tests/presentation/AuthAndLogin.test.tsx
   ```
   *Expected Output*: 8 passed tests.

5. **Verify New Role Boundary Isolation Test Suite** (once implemented):
   ```bash
   npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx
   ```
   *Expected Output*: 8+ passing tests verifying role isolation, zero financial leaks in patient portal, and full admin CRUD.

6. **Invalidation Conditions**:
   - If any new component imports `DexieStorageAdapter` or `@supabase/supabase-js` directly into `src/presentation/` or `src/features/`, `tests/architecture_boundaries.test.ts` will fail immediately.
   - If `AuthContext.tsx` removes the default authenticated admin behavior in test mode (`process.env.NODE_ENV === 'test'`), dozens of existing tests will fail.
   - If the patient portal renders any element matching `docked-settlement-bar` or text containing `"Honorarios"`, `RoleBoundaryIsolation.test.tsx` will fail.
