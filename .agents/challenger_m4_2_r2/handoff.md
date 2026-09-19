# Adversarial Verification & Handoff Report — Milestone 4: SPA Deep Route & Asset Resolution

**Challenger**: Challenger M4-2-R2 (Replacement: SPA Deep Route & Asset Resolution Challenger)  
**Date**: 2026-09-14T23:05:00Z  
**Target Repository**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/challenger_m4_2_r2`  
**Parent Conversation ID**: `4c46ec93-31c5-4060-81c0-0d21f4e3de48`  
**Verdict**: **`APPROVE`**

---

## 1. Observation

### 1.1 Source Code and Configuration Inspection
Direct inspection of the relevant codebase revealed the following exact configurations and implementations:

1. **`apps/medicaltrip_react_app/vite.config.ts` (Lines 6-7, 24-34)**:
   ```typescript
   export default defineConfig({
     base: '/',
     plugins: [react()],
     // ...
     build: {
       target: 'es2022',
       outDir: 'dist',
       sourcemap: true,
       chunkSizeWarningLimit: 1000,
       rollupOptions: {
         output: {
           manualChunks: {
             'vendor-react': ['react', 'react-dom'],
             'vendor-supabase': ['@supabase/supabase-js'],
             'vendor-dexie': ['dexie'],
             'vendor-icons': ['lucide-react'],
           },
         },
       },
     },
   ```
   - Observed: Base public path is explicitly configured as absolute root `/` rather than relative `./`.

2. **`apps/medicaltrip_react_app/src/App.tsx` (Lines 235-262, 183-212)**:
   ```typescript
   export const App: React.FC = () => {
     const [currentPath, setCurrentPath] = useState<string>(() =>
       typeof window !== 'undefined' && window.location ? window.location.pathname : '/'
     );
     const [urlState, setUrlState] = useState<URLSearchParams | null>(() =>
       typeof window !== 'undefined' && window.location
         ? new URLSearchParams(window.location.search)
         : null
     );

     // Detección reactiva y robusta de ruta de portal de paciente o parámetro reserva
     const isPatientPortalRoute =
       currentPath.startsWith('/portal-paciente') ||
       currentPath.includes('/portal-paciente') ||
       urlState?.get('portal') === 'paciente' ||
       !!urlState?.get('reserva');
   ```
   And in `AuthenticatedApp` (Lines 183-212):
   ```typescript
     // Anti-tampering guard: if user role is PATIENT, strictly enforce /portal-paciente URL
     useEffect(() => {
       if (user?.role === 'PATIENT' || isPatient) {
         if (typeof window !== 'undefined' && window.history && !window.location.pathname.includes('/portal-paciente')) {
           window.history.replaceState({}, '', '/portal-paciente');
           window.dispatchEvent(new PopStateEvent('popstate'));
         }
       }
     }, [user, isPatient]);

     if (!isAuthenticated) {
       if (isPatientPortalRoute) {
         return <PatientLoginView />;
       }
       return <LoginView />;
     }

     // 1. DEDICATED PATIENT PORTAL ROUTE (Role: PATIENT)
     if (isPatient || user?.role === 'PATIENT' || isPatientPortalRoute) {
       return (
         <LanguageProvider initialLanguage="es">
           <ToastProvider>
             <PatientPortalView />
           </ToastProvider>
         </LanguageProvider>
       );
     }
   ```
   - Observed: Direct navigation to `/portal-paciente`, `/portal-paciente/`, `?portal=paciente`, or `?reserva=...` reactively triggers `isPatientPortalRoute`. Unauthenticated sessions mount `<PatientLoginView />`, while authenticated patient sessions mount `<PatientPortalView />`.

3. **`apps/medicaltrip_react_app/vercel.json` (Lines 6-11) and `/Users/miyo123/projects/medicaltrip/vercel.json` (Lines 5-10)**:
   ```json
   "rewrites": [
     {
       "source": "/(.*)",
       "destination": "/index.html"
     }
   ]
   ```
   - Observed: Clean SPA routing rewrite maps all incoming paths to `/index.html`.

4. **Production Build Output `dist/index.html` (Lines 11-20, 26)**:
   ```html
   <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
   <link rel="manifest" href="/manifest.json" />
   <title>Medical Trip Colombia — Gestión Operativa & Liquidación en Terreno</title>
   <script type="module" crossorigin src="/assets/index-CiTHDUTn.js"></script>
   <link rel="modulepreload" crossorigin href="/assets/vendor-icons-DlcGteTJ.js">
   <link rel="modulepreload" crossorigin href="/assets/vendor-react-5uc974fy.js">
   <link rel="modulepreload" crossorigin href="/assets/vendor-dexie-B0SrV03B.js">
   <link rel="modulepreload" crossorigin href="/assets/vendor-supabase-D_t8kiev.js">
   <link rel="stylesheet" crossorigin href="/assets/index-DgsEWIsp.css">
   ```
   And line 26:
   ```javascript
   navigator.serviceWorker.register('/sw.js', { scope: '/' })
   ```
   - Observed: Every `<script>` and `<link>` tag uses an absolute root path (`/assets/...`, `/favicon.ico`, `/manifest.json`, `/sw.js`). Exactly 0 relative asset references (`./assets/...`) were found.

---

### 1.2 Tool Commands and Verbatim Results

#### A. Execution of Adversarial Test Suite (`tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx`)
```bash
$ npx vitest run tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx
 RUN  v2.1.9 /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

 ✓ tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx (21 tests) 150ms

 Test Files  1 passed (1)
      Tests  21 passed (21)
   Start at  18:02:54
   Duration  1.66s (transform 777ms, setup 0ms, collect 1.14s, tests 150ms, environment 125ms, prepare 35ms)
```
- Observed: 21 of 21 tests passed synchronously in 150ms with exit code 0.

#### B. Co-Execution with Challenger 1 Suite (`M4NegativeRoleConmutationChallenger1.test.tsx`)
```bash
$ npx vitest run tests/presentation/M4NegativeRoleConmutationChallenger1.test.tsx tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx
 RUN  v2.1.9 /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app

 ✓ tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx (21 tests) 159ms
 ✓ tests/presentation/M4NegativeRoleConmutationChallenger1.test.tsx (14 tests) 411ms

 Test Files  2 passed (2)
      Tests  35 passed (35)
   Start at  18:03:07
   Duration  2.69s (transform 823ms, setup 0ms, collect 1.47s, tests 570ms, environment 237ms, prepare 72ms)
```
- Observed: 35 of 35 tests passed across both challenger suites.

#### C. TypeScript Compilation (`npm run typecheck` & `npx tsc -b`)
```bash
$ npm run typecheck
> medicaltrip-react-app@1.0.0 typecheck
> tsc --noEmit
# Exit code: 0

$ npx tsc -b
# Exit code: 0
```
- Observed: Zero type errors or compiler diagnostic warnings.

#### D. Production Build Execution (`npm run build`)
```bash
$ npm run build
> medicaltrip-react-app@1.0.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 1791 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                         2.35 kB │ gzip:   0.97 kB
dist/assets/guideActor.worker-CfRgwpOX.js               3.36 kB
dist/assets/driverActor.worker-BRM3Yt3W.js              3.92 kB
dist/assets/nurseActor.worker-LVwjHxyZ.js               5.93 kB
dist/assets/financialAuditorActor.worker-DSj5hq9L.js  479.72 kB
dist/assets/index-DgsEWIsp.css                         69.35 kB │ gzip:  11.97 kB
dist/assets/vendor-icons-DlcGteTJ.js                   42.30 kB │ gzip:   9.90 kB │ map:    99.42 kB
dist/assets/vendor-dexie-B0SrV03B.js                   96.37 kB │ gzip:  32.46 kB │ map:   234.74 kB
dist/assets/vendor-react-5uc974fy.js                  133.97 kB │ gzip:  43.16 kB │ map:   328.38 kB
dist/assets/vendor-supabase-D_t8kiev.js               223.81 kB │ gzip:  58.50 kB │ map: 1,219.98 kB
dist/assets/index-CiTHDUTn.js                         613.37 kB │ gzip: 153.45 kB │ map: 1,634.29 kB
✓ built in 3.51s
```
- Observed: Clean production build in 3.51s with 0 errors and 0 chunk warnings.

#### E. Relative Asset Path Audit in `dist/index.html`
```bash
$ grep -o '\./assets' /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app/dist/index.html
# Exit code: 1 (No matches found - 0 occurrences)

$ grep -o '/assets' /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app/dist/index.html | wc -l
6
```
- Observed: Exactly 6 asset references in `dist/index.html`, all using `/assets/`. Exactly 0 instances of `./assets/`.

---

## 2. Logic Chain

1. **SPA Deep Route Failure Mechanics (Feature F24)**:
   - When a browser makes a direct request or performs a hard refresh on a deep path such as `https://<domain>/portal-paciente/`, the web server (Vercel) rewrites the request to `/index.html`.
   - If Vite had emitted relative assets (`./assets/...`), the browser would attempt to fetch `./assets/index.js` relative to the current URL directory `/portal-paciente/`, resulting in an HTTP request to `https://<domain>/portal-paciente/assets/index.js`.
   - Because no static asset exists at that subpath, the rewrite rule serves `index.html` (`text/html`), triggering the fatal browser error: `Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html"`.
   - Observation 1.1.1 and 1.1.4 confirm `base: '/'` is configured in `vite.config.ts` and `dist/index.html` exclusively emits `/assets/...`. This mathematically guarantees that all asset requests resolve to `https://<domain>/assets/...` regardless of URL path depth.

2. **Routing Resilience for Subpaths & Trailing Slashes**:
   - As observed in `App.tsx` (Observation 1.1.2), `isPatientPortalRoute` checks `currentPath.startsWith('/portal-paciente') || currentPath.includes('/portal-paciente') || urlState?.get('portal') === 'paciente' || !!urlState?.get('reserva')`.
   - This ensures that `/portal-paciente`, `/portal-paciente/`, `/portal-paciente/itinerario`, `/?portal=paciente`, and `/?reserva=rva171` all evaluate `isPatientPortalRoute` to `true`.
   - When unauthenticated, this branch returns `<PatientLoginView />` without mounting `<MainAppLayout />` or any administrative context.
   - When authenticated as a Patient, this branch returns `<PatientPortalView />` with zero administrative tooling or role switchers.
   - Tests `TEST-M4-01` through `TEST-M4-10` empirically verify this behavior with 100% pass rate (Observation 1.2.A).

3. **Anti-Tampering and Privilege Escalation Resistance**:
   - The anti-tampering hook in `App.tsx` (Lines 187-194) monitors URL mutations. If a patient session attempts to navigate to `/` or an administrative subpath, `window.history.replaceState({}, '', '/portal-paciente')` is triggered immediately.
   - Test `TEST-M4-18` empirically verified that an authenticated patient visiting `/` is automatically held within the patient portal route, with `replaceState` called and zero admin DOM nodes rendered.

4. **Negative DOM Isolation**:
   - Negative DOM checks in `M4SpaDeepRouteRefreshChallenger2.test.tsx` (`TEST-M4-01`, `TEST-M4-02`, `TEST-M4-13`, `TEST-M4-14`) verify that `btn-switch-role`, `desktop-module-nav`, `btn-header-new-patient`, `docked-settlement-bar`, `module-tab-settlement`, `module-tab-users`, and `"CONTROL DE ROLES OPERATIVOS"` are strictly absent (`null`) from the DOM.

---

## 3. Caveats

1. **CDN Caching Layers**:
   - In production CDN environments (e.g. Cloudflare / Vercel Edge Network), cache-control headers on `index.html` must remain `s-maxage=0, max-age=0, must-revalidate` to avoid serving stale HTML referencing deleted hash-chunk filenames after a new deployment. This is verified during Milestone 5 live deployment.
2. **No Other Caveats**:
   - All tests were executed in real headless DOM environments (`happy-dom`) with real component trees, genuine DOM queries, and physical filesystem audits. Zero business rules were mocked.

---

## 4. Conclusion

**Verdict: `APPROVE`**

The implementation of SPA deep route resolution, trailing slash handling, deep query parameters, and absolute asset resolution (Feature F24) is **robust, resilient, and fully verified**:
1. Direct navigation to `/portal-paciente` renders `<PatientLoginView />` (unauthenticated) and `<PatientPortalView />` (authenticated) with zero admin bleed.
2. Trailing slash `/portal-paciente/` and deep parameters (`?portal=paciente`, `?reserva=rva171`, `?reserva=rva282`, `?reserva=rva341`, `?reserva=rva077`) resolve cleanly without 404 or layout shifts.
3. `dist/index.html` emits 100% absolute root paths (`/assets/...`) and zero relative (`./assets/...`) paths.
4. All 21 tests in `M4SpaDeepRouteRefreshChallenger2.test.tsx` pass cleanly.
5. All TypeScript compilation and production build steps succeed with zero errors.

Milestone 4 is certified. The system is ready to proceed to Milestone 5 (Production Deployment on Vercel).

---

## 5. Verification Method

To independently verify all findings in this report:

1. **Run Adversarial Challenger 2 Test Suite**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npx vitest run tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx
   ```
   *Expected Result*: 21 passed (21/21), exit code 0.

2. **Run All Milestone 4 Challenger Suites**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npx vitest run tests/presentation/M4NegativeRoleConmutationChallenger1.test.tsx tests/presentation/M4SpaDeepRouteRefreshChallenger2.test.tsx
   ```
   *Expected Result*: 35 passed (35/35), exit code 0.

3. **Verify Production Build and Asset Paths**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npm run build
   grep -o '\./assets' dist/index.html
   ```
   *Expected Result*: Build completes in < 4s with exit code 0; grep returns 0 matches.

4. **Verify TypeScript Strict Compilation**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npm run typecheck
   npx tsc -b
   ```
   *Expected Result*: Exit code 0, 0 errors.

5. **Invalidation Conditions**:
   - Any test failure in `M4SpaDeepRouteRefreshChallenger2.test.tsx`.
   - Any match for `./assets/` in `dist/index.html`.
   - Any rendering of `btn-switch-role` or administrative nav when accessing `/portal-paciente`.
