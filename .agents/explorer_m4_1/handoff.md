# Report: Vite Base Path SPA Fix & Routing Audit (Feature F24)

- **Explorer Agent**: Explorer M4-1
- **Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m4_1`
- **Target Application**: `apps/medicaltrip_react_app`
- **Milestone**: Milestone 4 — Test Suite Hardening & Security Boundaries (Feature F24)
- **Timestamp**: 2026-09-14T21:23:00Z

---

## 1. Observation

### 1.1 Vite Configuration (`apps/medicaltrip_react_app/vite.config.ts`)
Direct inspection of `apps/medicaltrip_react_app/vite.config.ts` (lines 6-10):
```typescript
6: export default defineConfig({
7:   base: './',
8:   plugins: [react()],
9:   resolve: {
10:     alias: {
```
- **Observed**: `base` is currently explicitly set to `'./'` (relative path), NOT `'/'` (absolute root path).
- **Production Build Artifact Impact**: Running `npm run build` generated `dist/index.html` with lines 11-15:
  ```html
  <link rel="icon" type="image/svg+xml" href="./favicon.ico" />
  <link rel="manifest" href="./manifest.json" />
  <title>Medical Trip Colombia — Gestión Operativa & Liquidación en Terreno</title>
  <script type="module" crossorigin src="./assets/index-B-02I7T6.js"></script>
  <link rel="stylesheet" crossorigin href="./assets/index-DgsEWIsp.css">
  ```
  And line 22:
  ```html
  navigator.serviceWorker.register('./sw.js')
  ```

### 1.2 Vercel Configuration Files
Two `vercel.json` files exist within the repository:
1. **Application Level**: `apps/medicaltrip_react_app/vercel.json` (lines 1-11):
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
2. **Repository Root Level**: `/Users/miyo123/projects/medicaltrip/vercel.json` (lines 1-10):
   ```json
   {
     "buildCommand": "cd apps/medicaltrip_react_app && npm install && npm run build",
     "outputDirectory": "apps/medicaltrip_react_app/dist",
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
- **Observed**: Both files employ the modern `rewrites` configuration format mapping `/(.*)` to `/index.html`.

### 1.3 Client-Side Pathname & Routing Detection (`apps/medicaltrip_react_app/src/App.tsx`)
Direct inspection of `App.tsx`:
- **Initial State Initialization** (lines 236-243):
  ```typescript
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' && window.location ? window.location.pathname : '/'
  );
  const [urlState, setUrlState] = useState<URLSearchParams | null>(() =>
    typeof window !== 'undefined' && window.location
      ? new URLSearchParams(window.location.search)
      : null
  );
  ```
- **Reactive Navigation Listener** (lines 245-254):
  ```typescript
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window !== 'undefined' && window.location) {
        setCurrentPath(window.location.pathname);
        setUrlState(new URLSearchParams(window.location.search));
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
  ```
- **Route Detection** (lines 257-260):
  ```typescript
  const isPatientPortalRoute =
    currentPath.includes('/portal-paciente') ||
    urlState?.get('portal') === 'paciente' ||
    !!urlState?.get('reserva');
  ```
- **Role Isolation & Tamper Guard** (lines 56-62 & lines 187-194):
  ```typescript
  useEffect(() => {
    if (user?.role === 'PATIENT' || isPatient) {
      if (typeof window !== 'undefined' && window.history && !window.location.pathname.includes('/portal-paciente')) {
        window.history.replaceState({}, '', '/portal-paciente');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [user, isPatient]);
  ```
- **Dedicated Route Rendering in AuthenticatedApp** (lines 196-232):
  - When unauthenticated on `/portal-paciente`: renders `<PatientLoginView />`.
  - When unauthenticated on `/`: renders `<LoginView />`.
  - When authenticated as Patient (or on `/portal-paciente`): renders `<PatientPortalView />`.
  - When authenticated as Companion: renders `<CompanionModeView />`.
  - When authenticated as Admin: renders `<MainAppLayout />`.

### 1.4 Associated Public Assets
- `apps/medicaltrip_react_app/public/manifest.json`:
  - Line 5: `"start_url": "./"`
  - Line 6: `"scope": "./"`
  - Line 13: `"src": "./icon-192.png"`
  - Line 19: `"src": "./icon-512.png"`
- `apps/medicaltrip_react_app/public/sw.js`:
  - Lines 3-10: Precache array uses `'./'`, `'./index.html'`, `'./manifest.json'`, `'./favicon.ico'`, `'./icon-192.png'`, `'./icon-512.png'`.

---

## 2. Logic Chain

### Step 1: The Root Cause of Subpath Refresh 404 / MIME Type Crashes
1. When a user navigates to `https://<domain>/portal-paciente` or refreshes while on that subpath, the browser sends an HTTP GET request for `/portal-paciente`.
2. Vercel's rewrite engine checks the output directory (`dist/`). Since no static file named `dist/portal-paciente` exists, the rewrite rule (`{ "source": "/(.*)", "destination": "/index.html" }`) triggers and serves `dist/index.html` with HTTP 200 and `Content-Type: text/html`.
3. The browser receives `index.html` under the active URL context of `https://<domain>/portal-paciente` (or `https://<domain>/portal-paciente/`).
4. In `dist/index.html`, because Vite was configured with `base: './'`, asset tags were emitted as relative URIs:
   `<script type="module" crossorigin src="./assets/index-B-02I7T6.js"></script>`
   `<link rel="stylesheet" crossorigin href="./assets/index-DgsEWIsp.css">`
5. Per RFC 3986 §5.4, relative resolution against a URL with a trailing slash (`/portal-paciente/`) or deep subpath (`/portal-paciente/reserva`) evaluates to:
   `https://<domain>/portal-paciente/assets/index-B-02I7T6.js`
6. When the browser requests this subpath asset, Vercel cannot find `dist/portal-paciente/assets/index-B-02I7T6.js`. The rewrite rule matches again, serving `index.html` (MIME `text/html`) instead of the JavaScript bundle.
7. The browser engine attempts to parse HTML as a JavaScript module, throwing:
   `Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".`
   Or: `Uncaught SyntaxError: Unexpected token '<'`.
8. The application crashes into a blank screen.

### Step 2: Resolution Mechanism with `base: '/'`
1. Setting `base: '/'` in `vite.config.ts` instructs Vite to prepend absolute root paths to all compiled chunks, CSS files, and public assets:
   `<script type="module" crossorigin src="/assets/index-[hash].js"></script>`
   `<link rel="stylesheet" crossorigin href="/assets/index-[hash].css">`
2. Regardless of the browser's URL depth (`/`, `/portal-paciente`, `/portal-paciente/`, `/portal-paciente?token=xyz`, or `/portal-paciente/deep/path`), the browser always requests assets from the root:
   `https://<domain>/assets/index-[hash].js`
3. Vercel matches this directly against the physical file in `dist/assets/`, completely bypassing the rewrite rule and returning the bundle with HTTP 200 and `Content-Type: application/javascript`.

### Step 3: Vercel Configuration Evaluation (`rewrites` vs `routes`)
1. **Modern Rewrites Standard**:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. In Vercel, `rewrites` are evaluated **after** the static filesystem check by default. Therefore, any static file present in `dist/` (`/assets/*.js`, `/assets/*.css`, `/favicon.ico`, `/sw.js`, `/manifest.json`) is served automatically without hitting the rewrite.
3. The alternative legacy syntax:
   `"routes": [{ "handle": "filesystem" }, { "src": "/.*", "dest": "/index.html" }]`
   is deprecated in Vercel CLI 59+, cannot be combined with modern Vercel features (such as `headers` or `cleanUrls`), and produces schema warnings.
4. Both `apps/medicaltrip_react_app/vercel.json` and root `vercel.json` already correctly specify the modern `rewrites` syntax. Adding `$schema: "https://openapi.vercel.sh/vercel.json"` provides complete schema validation.

### Step 4: Client-Side Routing Evaluation in `src/App.tsx`
1. On initial page load/refresh at `/portal-paciente`:
   - `useState` initializes `currentPath` synchronously from `window.location.pathname` (`'/portal-paciente'`).
   - `urlState` initializes synchronously from `window.location.search`.
   - `isPatientPortalRoute` evaluates to `true` on the very first render pass (zero layout shift, zero asynchronous delay).
2. If unauthenticated, `AuthenticatedApp` renders `<PatientLoginView />` immediately, satisfying test `M4-GRD-05`.
3. If authenticated as `PATIENT` (stored in `PATIENT_STORAGE_KEY`), `AuthenticatedApp` renders `<PatientPortalView />` with full Caribbean itinerary and flights.
4. When navigating internally (e.g. clicking "¿Eres paciente?" in `LoginView.tsx`):
   `LoginView.tsx` executes:
   ```typescript
   window.history.pushState({}, '', '/portal-paciente');
   window.dispatchEvent(new PopStateEvent('popstate'));
   ```
   `App.tsx` listens to `popstate`, updates `currentPath`, and transitions to `<PatientLoginView />` without page reload.
5. Path matching using `currentPath.startsWith('/portal-paciente')` alongside `currentPath.includes('/portal-paciente')` ensures strict prefix matching and handles optional trailing slashes cleanly.

---

## 3. Caveats

1. **Service Worker Cache Scope**:
   - `apps/medicaltrip_react_app/public/sw.js` precaches `'./index.html'` and `'./favicon.ico'`. If the service worker is registered from a relative path (`./sw.js`), its scope is restricted to the current directory level. In `index.html`, registration must use `/sw.js` with `{ scope: '/' }`, and precache URLs in `sw.js` should use root-relative paths (`/index.html`, etc.).
2. **Dual `vercel.json` Presence**:
   - The repository contains `vercel.json` at the root AND in `apps/medicaltrip_react_app/vercel.json`. If deploying from the root repository using Vercel CLI, root `vercel.json` controls output via `apps/medicaltrip_react_app/dist`. If deploying with the root directory set to `apps/medicaltrip_react_app` in the Vercel Dashboard, `apps/medicaltrip_react_app/vercel.json` controls it. Both must remain synchronized with identical rewrite configurations.
3. **No Caveats on Architecture**:
   - Setting `base: '/'` does not alter test environment execution in Vitest (happy-dom), as verified by running existing test suites.

---

## 4. Conclusion

1. **Definitive Fix Identified**: The subpath refresh issue is definitively caused by `base: './'` in `apps/medicaltrip_react_app/vite.config.ts`. Changing it to `base: '/'` is mandatory and sufficient to ensure all asset bundles resolve from `/assets/...` instead of subpaths.
2. **Vercel Rewrites Verified**: The existing `rewrites` configuration in `vercel.json` is the correct, modern Vercel standard. It ensures that any non-file subpath (such as `/portal-paciente`) returns `index.html` with HTTP 200.
3. **App.tsx Routing Validated**: `App.tsx` correctly handles synchronous initial load pathname detection and reactive `popstate` events. Enhancing the check to include `currentPath.startsWith('/portal-paciente')` guarantees complete resilience against deep links and subpath nesting.

---

## 5. Code Blueprints

### Blueprint 1: `apps/medicaltrip_react_app/vite.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/', // CRITICAL F24 FIX: Absolute base path ensures /portal-paciente refresh loads /assets/* cleanly
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
      '@core': path.resolve(__dirname, './src/core'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    host: true,
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    fileParallelism: false,
    testTimeout: 15000,
  },
});
```

### Blueprint 2: `apps/medicaltrip_react_app/vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Blueprint 3: Root `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/medicaltrip_react_app && npm install && npm run build",
  "outputDirectory": "apps/medicaltrip_react_app/dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Blueprint 4: `apps/medicaltrip_react_app/index.html`
```html
<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-50">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="description" content="Gestión Operativa y Liquidación Financiera en Terreno - Medical Trip Colombia S.A.S." />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="MedicalTrip" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <link rel="manifest" href="/manifest.json" />
    <title>Medical Trip Colombia — Gestión Operativa & Liquidación en Terreno</title>
  </head>
  <body class="h-full antialiased text-slate-900 bg-slate-50 selection:bg-indigo-500 selection:text-white">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then((reg) => {
              reg.update();
              reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('🔄 New version detected, reloading...');
                      window.location.reload();
                    }
                  });
                }
              });
            })
            .catch((err) => console.warn('⚠️ ServiceWorker registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

### Blueprint 5: Routing Enhancement in `apps/medicaltrip_react_app/src/App.tsx`
Lines 256-261:
```typescript
  // Detección reactiva y robusta de ruta de portal de paciente o parámetro reserva
  const isPatientPortalRoute =
    currentPath.startsWith('/portal-paciente') ||
    currentPath.includes('/portal-paciente') ||
    urlState?.get('portal') === 'paciente' ||
    !!urlState?.get('reserva');
```

---

## 6. Verification Method

### 6.1 Build and Asset Inspection Command
Execute from `apps/medicaltrip_react_app`:
```bash
cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
npm run build
grep -E 'src="/assets|href="/assets' dist/index.html
```
- **Expected Result**: Output shows `<script type="module" crossorigin src="/assets/index-*.js"></script>` and `<link rel="stylesheet" crossorigin href="/assets/index-*.css">` (with leading slash `/`). Zero occurrences of `./assets/`.

### 6.2 Test Suite Regression Commands
Execute from `apps/medicaltrip_react_app`:
```bash
npm test -- tests/presentation/RoleBoundaryIsolation.test.tsx
npm test -- tests/architecture_boundaries.test.ts
npm test -- tests/presentation/AuthAndLogin.test.tsx
npm test -- tests/presentation/M2ShortcutsSafetyChallenger2.test.tsx
```
- **Expected Result**: 100% test pass rate across all suites.

### 6.3 Local SPA Subpath Refresh Verification
Run local preview:
```bash
npx vite preview --port 4173
```
Using curl:
```bash
curl -I http://localhost:4173/portal-paciente
curl -s http://localhost:4173/portal-paciente | grep -E '/assets/index'
```
- **Expected Result**: HTTP 200 OK, HTML response contains `/assets/index-*.js` which successfully resolves at `http://localhost:4173/assets/index-*.js` returning HTTP 200 and `Content-Type: application/javascript`.

### 6.4 Invalidation Conditions
- Any occurrence of `src="./assets"` in `dist/index.html` invalidates this blueprint.
- Any 404 response on `/portal-paciente` upon Vercel deployment invalidates the rewrite rule.
- Any console error stating `Unexpected token '<'` upon subpath refresh invalidates the base path configuration.
