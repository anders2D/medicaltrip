# Handoff Report: Explorer M4-2 — Milestone 4 (Negative Role-Switching Test Suite & AuthAndLogin Refactoring — Features F20, F21)

**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m4_2`  
**Date & Timestamp**: 2026-09-14T16:22:30-05:00  
**Target Application**: `apps/medicaltrip_react_app`  
**Author**: Explorer M4-2 (Teamwork Explorer Archetype)  

---

## 1. Observation

### 1.1 Codebase & File Inspection
We conducted a comprehensive inspection of the production source files and presentation test suites:

1. **`apps/medicaltrip_react_app/src/features/directory/presentation/UsersView.tsx`** (237 lines):
   - Lines 1-5: Declares strict compliance with Radical Functional Minimalism and Zero Role Conmutation:
     ```typescript
     /**
      * Medical Trip Colombia S.A.S. - UsersView (Directorio Operativo de Personal)
      * Directorio puro de personal en terreno, logística y coordinación médica.
      * Cumple con Alternativa 10 (Minimalismo Funcional Radical) y Cero Conmutación de Roles.
      */
     ```
   - Lines 109-131: Clean header with title `"Directorio Operativo de Personal"` and `"4 Colaboradores Activos"`.
   - Lines 133-216: Pure staff directory rendering 4 collaborators (`Carolina Cortázar`, `Yenny Roberto`, `Ramón Rosero`, `Dra. Jenny Paola Acosta`) with duty status badges, location, assigned case, WhatsApp direct trigger links, and operational responsibilities.
   - Lines 219-234: Session footer with clean Logout button (`onClick={logout}`).
   - **Verbatim Absence**: Zero occurrences of `"CONTROL DE ROLES OPERATIVOS"`, `switchRole`, or `btn-switch-role`.

2. **`apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`** (448 lines):
   - Lines 140-192: `patient-dropdown-trigger` rendered on ALL viewports with zero `md:hidden` restriction, displaying the persistent Status Pill `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
   - Lines 195-233: Renders `btn-header-new-patient` and `btn-header-send-link` if `isAdmin`, or `btn-header-companion-turn` if Companion.
   - Lines 407-430: User profile badge `user-role-badge` showing `Admin` (with `ShieldCheck`) or `Guía` (with `UserCheck`).
   - Lines 432-442: Dedicated `btn-logout` button.
   - **Verbatim Absence**: Zero occurrences of `btn-switch-role` or text `"Ver como Acompañante"` / `"Ver como Admin"`.

3. **`apps/medicaltrip_react_app/src/App.tsx`** (307 lines):
   - Lines 55-80: Anti-tampering guards in `MainAppLayout`:
     ```typescript
     if (user?.role === 'PATIENT') {
       return (
         <div data-testid="patient-tamper-guard" className="p-8 text-center text-sm text-zinc-500">
           Redirigiendo a su portal de paciente...
         </div>
       );
     }
     if (user?.role === 'COMPANION') {
       return (
         <div data-testid="companion-tamper-guard" className="p-8 text-center text-sm text-zinc-500">
           Redirigiendo a consola en terreno...
         </div>
       );
     }
     ```
   - Lines 183-233: `AuthenticatedApp` strictly segregates navigation by `user?.role`:
     ```typescript
     // 1. DEDICATED PATIENT PORTAL ROUTE (Role: PATIENT)
     if (isPatient || user?.role === 'PATIENT' || isPatientPortalRoute) {
       return <PatientPortalView />;
     }
     // 2. DEDICATED CONSOLA OPERATIVA EN TERRENO (Role: COMPANION)
     if (isCompanion || user?.role === 'COMPANION') {
       return <CompanionModeView />;
     }
     // 3. ADMIN MANAGEMENT COCKPIT (Role: ADMIN)
     return <MainAppLayout />;
     ```

4. **`apps/medicaltrip_react_app/tests/presentation/AuthAndLogin.test.tsx`** (177 lines):
   - Git log diff reveals that legacy commit `a0b03f099f250269a8dab60fa159cfa40bae0248` previously contained an anti-pattern test:
     ```typescript
     // LEGACY (OBSOLETE):
     it('should allow switching roles dynamically via 1-click switcher in header', async () => {
       render(<App />);
       const demoBtn = screen.getByRole('button', { name: /entrar con credenciales demo/i });
       fireEvent.click(demoBtn);
       await waitFor(() => {
         expect(screen.getByTestId('btn-header-new-patient')).toBeTruthy();
         expect(screen.getByTestId('btn-switch-role').textContent).toMatch(/ver como acompañante/i);
       });
       // Switch to Companion
       fireEvent.click(screen.getByTestId('btn-switch-role'));
       ...
     ```
   - In the current working tree (lines 114-164), this test has been converted into:
     ```typescript
     it('should strictly enforce role boundary with zero role-switching controls in DOM and dedicated routing', async () => {
       ...
       // STRICT NEGATIVE ASSERTION: btn-switch-role must NEVER exist in DOM for Admin
       expect(screen.queryByTestId('btn-switch-role')).toBeNull();
       expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
       expect(screen.queryByText(/ver como admin/i)).toBeNull();
       ...
       // STRICT NEGATIVE ASSERTION: btn-switch-role is also completely absent for Companion
       expect(screen.queryByTestId('btn-switch-role')).toBeNull();
       expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
       expect(screen.queryByText(/ver como admin/i)).toBeNull();
     });
     ```
   - Running `npx vitest run tests/presentation/AuthAndLogin.test.tsx` passes with 8/8 tests passing (1655ms).

5. **`apps/medicaltrip_react_app/tests/presentation/RoleBoundaryIsolation.test.tsx`** (910 lines, 25 tests):
   - Current structure contains 5 describe blocks:
     - `1. Complete Absence of All 22 Financial and Administrative Elements in Patient Portal DOM` (lines 145-332)
     - `2. Scoped Patient Queries (Single Booking Scoping & Cross-Patient Isolation)` (lines 335-464)
     - `3. Anti-Tampering URL / Navigation Guards Redirecting Patients` (lines 467-592)
     - `4. Administrator Full CRUD Execution & Storage Port Synchronization` (lines 595-812)
     - `5. PHI Minimization Verification (ENT-PAX-XXXX, passportHash, Zero Plaintext Passports)` (lines 815-909)
   - Running `npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx` passes with 25/25 tests passing (275ms).
   - Full Vitest suite run (`npm test`) empirical result: **128 test files passed (128/128), 1,217 tests passed (1217/1217)** with 0 failures in 133.72s.
   - **Critical Gap Identified**: While `RoleBoundaryIsolation.test.tsx` exhaustively tests the 22 financial/administrative items for the Patient portal, it **completely lacks** explicit tests for Feature F20 ("Negative Role-Switching Test Suite — Assert 0 role-switching controls in DOM for all roles in `RoleBoundaryIsolation.test.tsx`"). Specifically:
     - No test asserts `queryByTestId('btn-switch-role') === null` across `ADMIN`, `COMPANION`, and `PATIENT` in this suite.
     - No test directly renders `UsersView` to verify the absence of `"CONTROL DE ROLES OPERATIVOS"` and `switchRole`.
     - No test directly renders `ArchetypeSwitcherBar` to verify zero role-switching controls across roles.
     - No test verifies session isolation and anti-tampering guards between Admin, Companion, and Patient in this file.

---

## 2. Logic Chain

1. **Premise 1 (M4 Scope & PROJECT.md Contracts)**:
   Feature F20 mandates: *"Assert 0 role-switching controls in DOM for all roles in `RoleBoundaryIsolation.test.tsx`"*.
   Feature F21 mandates: *"Update test expecting `btn-switch-role` into negative assertion in `AuthAndLogin.test.tsx`"*.

2. **Premise 2 (Production State Verification)**:
   In `UsersView.tsx` and `ArchetypeSwitcherBar.tsx`, all role-switching UI elements (`btn-switch-role`, "Ver como Acompañante", "Control de Roles Operativos") have been deleted in Milestone 1. The application now implements 3-way strictly segregated routing in `App.tsx`:
   - `ADMIN` -> `MainAppLayout` (ModuleNav, Cockpit Switcher, full CRUD)
   - `COMPANION` -> `CompanionModeView` (Shift tracking, petty cash OCR, patient agenda, sign-off)
   - `PATIENT` -> `PatientPortalView` (`/portal-paciente`, 0 administrative or financial tools)

3. **Premise 3 (AuthAndLogin Status & Hardening)**:
   The legacy test in `AuthAndLogin.test.tsx` that previously clicked `btn-switch-role` has already been rewritten into a negative assertion verifying nullity of `btn-switch-role` for Admin and Companion. However, it can be further hardened with:
   - DOM HTML pattern checks (`expect(container.innerHTML).not.toContain('btn-switch-role')`).
   - A dedicated 9th test verifying patient login via `/portal-paciente` and ensuring that `btn-switch-role` is also completely null during patient portal sessions.

4. **Premise 4 (RoleBoundaryIsolation Gap Remediation)**:
   `RoleBoundaryIsolation.test.tsx` is designated by `PROJECT.md` and `ORIGINAL_REQUEST.md` as the authoritative security, isolation, and role boundary test suite. The absence of explicit negative tests for `btn-switch-role`, `switchRole`, and `"CONTROL DE ROLES OPERATIVOS"` in this authoritative suite represents an unfulfilled contract for Feature F20.

5. **Conclusion**:
   To satisfy Milestone 4 (F20 and F21) with 100% rigor:
   - Add a dedicated Section 6 to `tests/presentation/RoleBoundaryIsolation.test.tsx` containing 6 exhaustive test cases (`M4-NEG-01` to `M4-NEG-06`).
   - Finalize `tests/presentation/AuthAndLogin.test.tsx` with airtight negative assertions and 3-way authentication lifecycle coverage.

---

## 3. Caveats

1. **Browser Navigation in Headless Vitest**:
   Testing URL changes (e.g. `window.history.replaceState` and `/portal-paciente`) requires triggering custom `PopStateEvent` or checking `window.location.pathname` within `waitFor` blocks because jsdom does not perform full browser routing transitions automatically.
2. **Read-Only Explorer Discipline**:
   As an Explorer agent, no source code or test files were directly mutated in this investigation. All findings and code implementations are provided as concrete, drop-in blueprints in this report for the implementer / test writer agent.
3. **Supabase Live E2E Mocking**:
   In unit/presentation test environments, Supabase storage operations fall back cleanly or are handled via `ServiceContainer.setDriver('memory')` or `'dexie'`. Mocking canvas/confetti is maintained for deterministic execution.

---

## 4. Conclusion & Actionable Blueprints

### 4.1 Feature F20 Blueprint: Add Section 6 to `RoleBoundaryIsolation.test.tsx`

The following test block must be appended inside `describe('Milestone M4: Role Boundary Isolation & Dual-Portal Security Suite', () => { ... })` in `apps/medicaltrip_react_app/tests/presentation/RoleBoundaryIsolation.test.tsx`:

```typescript
  // =========================================================================
  // 6. NEGATIVE ROLE-SWITCHING & ZERO ROLE BLEED ACROSS ALL 3 ROLES (FEATURE F20)
  // =========================================================================
  describe('6. Negative Role-Switching & Zero Role Bleed Across All 3 Roles (Feature F20)', () => {
    // Helper to render full App with Admin session
    const renderAdminApp = () => {
      window.__TEST_AS_PATIENT__ = false;
      window.__TEST_SHOW_LOGIN__ = false;
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(ADMIN_USER_PRESET));
      window.history.replaceState({}, '', '/');
      return render(<App />);
    };

    // Helper to render full App with Companion session
    const renderCompanionApp = () => {
      window.__TEST_AS_PATIENT__ = false;
      window.__TEST_SHOW_LOGIN__ = false;
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(COMPANION_USER_PRESET));
      window.history.replaceState({}, '', '/');
      return render(<App />);
    };

    it('M4-NEG-01: strictly verifies that btn-switch-role and role-switching text are completely absent in ADMIN view', async () => {
      const { container } = renderAdminApp();

      await waitFor(() => {
        expect(screen.getByTestId('desktop-module-nav')).toBeTruthy();
      });

      const domHtml = container.innerHTML;

      // 1. Data-testid query: btn-switch-role MUST be completely null
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();

      // 2. Text queries: Zero role conmutation or toggle labels
      expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
      expect(screen.queryByText(/ver como admin/i)).toBeNull();
      expect(screen.queryByText(/conmutar rol/i)).toBeNull();
      expect(screen.queryByText(/cambiar rol/i)).toBeNull();

      // 3. String inspection on serialized DOM
      expect(domHtml).not.toContain('btn-switch-role');

      // 4. Role badge reflects Admin identity with clean Logout button
      const roleBadge = screen.getByTestId('user-role-badge');
      expect(roleBadge.textContent).toMatch(/admin/i);
      expect(screen.getByTestId('btn-logout')).toBeTruthy();

      // 5. Cockpit switcher status pill exists but contains zero role toggles
      expect(screen.getByTestId('patient-dropdown-trigger')).toBeTruthy();
    });

    it('M4-NEG-02: strictly verifies that btn-switch-role and administrative controls are completely absent in COMPANION view', async () => {
      const { container } = renderCompanionApp();

      await waitFor(() => {
        expect(screen.getByTestId('companion-mode-root')).toBeTruthy();
      });

      const domHtml = container.innerHTML;

      // 1. btn-switch-role must be completely null
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();

      // 2. Zero role toggle buttons or texts
      expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
      expect(screen.queryByText(/ver como admin/i)).toBeNull();
      expect(screen.queryByText(/conmutar rol/i)).toBeNull();
      expect(domHtml).not.toContain('btn-switch-role');

      // 3. Role badge reflects Guía / Acompañante
      const roleBadge = screen.getByTestId('user-role-badge');
      expect(roleBadge.textContent).toMatch(/guía/i);
      expect(screen.getByTestId('btn-logout')).toBeTruthy();

      // 4. Zero administrative controls in Companion console
      expect(screen.queryByTestId('desktop-module-nav')).toBeNull();
      expect(screen.queryByTestId('btn-header-new-patient')).toBeNull();
      expect(screen.queryByTestId('module-tab-settlement')).toBeNull();
    });

    it('M4-NEG-03: strictly verifies that btn-switch-role and switchRole are completely absent in PATIENT view', async () => {
      const { container } = renderPatientPortal();

      await waitFor(() => {
        expect(screen.getByTestId('patient-portal-root')).toBeTruthy();
      });

      const domHtml = container.innerHTML;

      // 1. btn-switch-role must be completely null
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();

      // 2. Text queries
      expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
      expect(screen.queryByText(/ver como admin/i)).toBeNull();
      expect(screen.queryByText(/conmutar rol/i)).toBeNull();
      expect(screen.queryByText(/control de roles operativos/i)).toBeNull();
      expect(domHtml).not.toContain('btn-switch-role');
      expect(domHtml).not.toContain('switchRole');
    });

    it('M4-NEG-04: verifies that UsersView component directly mounted contains zero CONTROL DE ROLES OPERATIVOS or switchRole', () => {
      const { container } = render(
        <AuthProvider>
          <AppProvider>
            <LanguageProvider initialLanguage="es">
              <UsersView />
            </LanguageProvider>
          </AppProvider>
        </AuthProvider>
      );

      const domHtml = container.innerHTML;

      // 1. Hero card "CONTROL DE ROLES OPERATIVOS" must be purged
      expect(domHtml).not.toContain('CONTROL DE ROLES OPERATIVOS');
      expect(domHtml).not.toContain('Conmutar entre la perspectiva global de Administrador');
      expect(domHtml).not.toContain('switchRole');
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();

      // 2. Renders pure Operational Staff Directory
      expect(screen.getByText('Directorio Operativo de Personal')).toBeTruthy();
      expect(screen.getByText('4 Colaboradores Activos')).toBeTruthy();
      expect(screen.getByText('Carolina Cortázar')).toBeTruthy();
      expect(screen.getByText('Yenny Roberto')).toBeTruthy();
      expect(screen.getByText('Ramón Rosero')).toBeTruthy();
      expect(screen.getByText('Dra. Jenny Paola Acosta')).toBeTruthy();
      expect(screen.getByText('Cerrar Sesión')).toBeTruthy();
    });

    it('M4-NEG-05: verifies that ArchetypeSwitcherBar directly mounted contains zero btn-switch-role across roles', () => {
      // 1. As Admin
      const { container: adminContainer, unmount } = render(
        <AuthProvider initialAuthenticated={true}>
          <AppProvider>
            <ArchetypeSwitcherBar />
          </AppProvider>
        </AuthProvider>
      );

      expect(screen.queryByTestId('btn-switch-role')).toBeNull();
      expect(screen.queryByText(/ver como/i)).toBeNull();
      expect(adminContainer.innerHTML).not.toContain('btn-switch-role');
      expect(screen.getByTestId('btn-header-new-patient')).toBeTruthy();
      expect(screen.getByTestId('user-role-badge').textContent).toMatch(/admin/i);
      unmount();

      // 2. As Companion
      window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(COMPANION_USER_PRESET));
      const { container: compContainer } = render(
        <AuthProvider initialAuthenticated={true}>
          <AppProvider>
            <ArchetypeSwitcherBar />
          </AppProvider>
        </AuthProvider>
      );

      expect(screen.queryByTestId('btn-switch-role')).toBeNull();
      expect(screen.queryByText(/ver como/i)).toBeNull();
      expect(compContainer.innerHTML).not.toContain('btn-switch-role');
      expect(screen.queryByTestId('btn-header-new-patient')).toBeNull();
      expect(screen.getByTestId('btn-header-companion-turn')).toBeTruthy();
      expect(screen.getByTestId('user-role-badge').textContent).toMatch(/guía/i);
    });

    it('M4-NEG-06: verifies session isolation — logging out clears session and prevents cross-role privilege leakage', async () => {
      const { container } = renderAdminApp();

      await waitFor(() => {
        expect(screen.getByTestId('btn-logout')).toBeTruthy();
      });

      // Admin session is present in localStorage
      expect(window.localStorage.getItem(ADMIN_STORAGE_KEY)).not.toBeNull();

      // Click Logout
      const logoutBtn = screen.getByTestId('btn-logout');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy();
      });

      // Storage key must be cleared
      expect(window.localStorage.getItem(ADMIN_STORAGE_KEY)).toBeNull();

      // Neither admin modules nor companion consoles are rendered
      expect(screen.queryByTestId('desktop-module-nav')).toBeNull();
      expect(screen.queryByTestId('companion-mode-root')).toBeNull();
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    });
  });
```

*Note on Required Imports for `RoleBoundaryIsolation.test.tsx`*:
Ensure that `UsersView` and `ArchetypeSwitcherBar` are imported at the top of `RoleBoundaryIsolation.test.tsx`:
```typescript
import { UsersView } from '../../src/features/directory/presentation/UsersView';
import { ArchetypeSwitcherBar } from '../../src/presentation/components/switcher/ArchetypeSwitcherBar';
```

---

### 4.2 Feature F21 Blueprint: Complete `AuthAndLogin.test.tsx` Refactoring

The full, hardened file content for `apps/medicaltrip_react_app/tests/presentation/AuthAndLogin.test.tsx`:

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from '../../src/App';

describe('AuthContext & LoginView Tests', () => {
  beforeEach(() => {
    window.__TEST_SHOW_LOGIN__ = true;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    window.__TEST_SHOW_LOGIN__ = false;
  });

  it('should render login screen when user is not authenticated', () => {
    render(<App />);
    expect(screen.getByText('Medical Trip Colombia')).toBeTruthy();
    expect(screen.getByText('Gestión de Itinerarios Clínicos & Liquidación Financiera')).toBeTruthy();
    expect(screen.getByLabelText('Usuario')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy();
    // Negative check on login screen
    expect(screen.queryByTestId('btn-switch-role')).toBeNull();
  });

  it('should show error when entering invalid credentials', async () => {
    render(<App />);
    const userInput = screen.getByLabelText('Usuario');
    const passInput = screen.getByLabelText('Contraseña');
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(userInput, { target: { value: 'wrong_user' } });
    fireEvent.change(passInput, { target: { value: 'wrong_pass' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/credenciales inválidas/i)).toBeTruthy();
    });

    // Still no role switch buttons on error
    expect(screen.queryByTestId('btn-switch-role')).toBeNull();
  });

  it('should login successfully with admin / admin and show main app with logout button', async () => {
    render(<App />);
    const userInput = screen.getByLabelText('Usuario');
    const passInput = screen.getByLabelText('Contraseña');
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(userInput, { target: { value: 'admin' } });
    fireEvent.change(passInput, { target: { value: 'admin' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salir/i })).toBeTruthy();
      expect(screen.getByTestId('btn-header-new-patient')).toBeTruthy();
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    });
  });

  it('should allow 1-click quick demo login button', async () => {
    render(<App />);
    const demoBtn = screen.getByRole('button', { name: /entrar con credenciales demo/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salir/i })).toBeTruthy();
    });
  });

  it('should logout cleanly when clicking Salir', async () => {
    render(<App />);
    const demoBtn = screen.getByRole('button', { name: /entrar con credenciales demo/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salir/i })).toBeTruthy();
    });

    const logoutBtn = screen.getByRole('button', { name: /salir/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy();
    });
  });

  it('should login successfully as Companion (guia / guia) and adapt UI appropriately', async () => {
    render(<App />);

    // Select role companion tab
    const companionTab = screen.getByTestId('role-tab-companion');
    fireEvent.click(companionTab);

    // Verify role description
    expect(screen.getByText(/rol acompañante físico/i)).toBeTruthy();

    const userInput = screen.getByLabelText('Usuario');
    const passInput = screen.getByLabelText('Contraseña');
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(userInput, { target: { value: 'guia' } });
    fireEvent.change(passInput, { target: { value: 'guia' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /salir/i })).toBeTruthy();
      // Companion should NOT see Nuevo Paciente in header
      expect(screen.queryByTestId('btn-header-new-patient')).toBeNull();
      // Companion SHOULD see Planilla de Turno
      expect(screen.getByTestId('btn-header-companion-turn')).toBeTruthy();
      // Role badge should show Guía / Acompañante
      expect(screen.getByTestId('user-role-badge').textContent).toMatch(/guía/i);
      // Negative assertion on role switcher
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    });
  });

  it('should strictly enforce role boundary with zero role-switching controls in DOM and dedicated routing', async () => {
    const { container } = render(<App />);
    // Fast login as admin
    const demoBtn = screen.getByRole('button', { name: /entrar con credenciales demo/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.getByTestId('btn-header-new-patient')).toBeTruthy();
      expect(screen.getByTestId('user-role-badge').textContent).toMatch(/admin/i);
      expect(screen.getByRole('button', { name: /salir/i })).toBeTruthy();
    });

    // Verify Admin view is active (MainAppLayout mounted with desktop nav, companion console NOT mounted)
    expect(screen.getByTestId('desktop-module-nav')).toBeTruthy();
    expect(screen.queryByTestId('companion-mode-root')).toBeNull();

    // STRICT NEGATIVE ASSERTION: btn-switch-role must NEVER exist in DOM for Admin
    expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
    expect(screen.queryByText(/ver como admin/i)).toBeNull();
    expect(container.innerHTML).not.toContain('btn-switch-role');

    // To switch role, user must explicitly logout and re-authenticate via gateway
    const logoutBtn = screen.getByRole('button', { name: /salir/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy();
    });

    // Authenticate as companion via quick demo button
    const demoCompanionBtn = screen.getByTestId('btn-demo-companion');
    fireEvent.click(demoCompanionBtn);

    await waitFor(() => {
      // Dedicated Consola en Terreno (CompanionModeView) is rendered
      expect(screen.getByTestId('companion-mode-root')).toBeTruthy();
      expect(screen.getByTestId('btn-header-companion-turn')).toBeTruthy();
      expect(screen.getByTestId('user-role-badge').textContent).toMatch(/guía/i);
      expect(screen.getByRole('button', { name: /salir/i })).toBeTruthy();
    });

    // Zero administrative controls in Companion session
    expect(screen.queryByTestId('btn-header-new-patient')).toBeNull();
    expect(screen.queryByTestId('desktop-module-nav')).toBeNull();
    expect(screen.queryByTestId('module-tab-settlement')).toBeNull();

    // STRICT NEGATIVE ASSERTION: btn-switch-role is also completely absent for Companion
    expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    expect(screen.queryByText(/ver como acompañante/i)).toBeNull();
    expect(screen.queryByText(/ver como admin/i)).toBeNull();
    expect(container.innerHTML).not.toContain('btn-switch-role');
  });

  it('should allow login directly with quick companion button', async () => {
    render(<App />);
    const demoCompanionBtn = screen.getByTestId('btn-demo-companion');
    fireEvent.click(demoCompanionBtn);

    await waitFor(() => {
      expect(screen.getByTestId('btn-header-companion-turn')).toBeTruthy();
      expect(screen.queryByTestId('btn-header-new-patient')).toBeNull();
      expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    });
  });

  it('should authenticate Patient cleanly via /portal-paciente with zero role switching or admin controls', async () => {
    window.history.replaceState({}, '', '/portal-paciente');
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('patient-login-root')).toBeTruthy();
    });

    // Quick Caribbean demo login
    const demoCatia = screen.getByTestId('btn-demo-catia');
    fireEvent.click(demoCatia);

    const submitBtn = screen.getByTestId('btn-patient-login-submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('patient-portal-root')).toBeTruthy();
    });

    // Zero role switching in patient view
    expect(screen.queryByTestId('btn-switch-role')).toBeNull();
    expect(screen.queryByTestId('desktop-module-nav')).toBeNull();
    expect(container.innerHTML).not.toContain('btn-switch-role');
  });
});
```

---

## 5. Verification Method

To independently verify the findings and validate the refactored test suites:

1. **Targeted Vitest Execution**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npx vitest run tests/presentation/RoleBoundaryIsolation.test.tsx tests/presentation/AuthAndLogin.test.tsx
   ```
   *Expected Result*: All tests pass (31+ tests in `RoleBoundaryIsolation.test.tsx` and 9 tests in `AuthAndLogin.test.tsx`) with 0 failures and 0 warnings.

2. **Full Test Suite Integrity**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npm test
   ```
   *Expected Result*: All 117 test files and >1100 tests pass without regression.

3. **Grep Negative Audit**:
   ```bash
   grep -rn "btn-switch-role" src/
   ```
   *Expected Result*: Exactly 0 matches across `src/`.

4. **Invalidation Conditions**:
   - Any rendering of `btn-switch-role` in `UsersView.tsx`, `ArchetypeSwitcherBar.tsx`, `MainAppLayout.tsx`, `CompanionModeView.tsx`, or `PatientPortalView.tsx`.
   - Any test failure when querying `queryByTestId('btn-switch-role') === null`.
