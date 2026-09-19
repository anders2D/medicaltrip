# Forensic Analysis: Testing Harnesses, Vitest Infrastructure & CDP Runtime Verification

**Project**: Medical Trip Colombia S.A.S.  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Agent**: Explorer Survey 3  
**Date**: 2026-09-19  
**Target Architecture**: Hexagonal Architecture, Deterministic BigInt Cents Math, Supabase Cloud REST API, Chromium DevTools Protocol (CDP)

---

## Executive Summary

An exhaustive investigation was conducted across the Medical Trip Colombia workspace to audit the existing test suites, headless Chromium CDP automation harnesses, preview server readiness on port 3000, error interception capabilities, and test fixtures.

### Key Empirical Findings:
1. **NPM Scripts & Build Integrity**:
   - `npm run typecheck` (`tsc --noEmit`): **0 errors**.
   - `npm run build` (`tsc -b && vite build`): **Passes cleanly in 3.41s**, creating all 11 production chunks in `dist/` with chunk splitting for `@supabase/supabase-js`, `dexie`, `react`, and `lucide-react`.
   - `npm test` (`vitest run`): Executes cleanly and passes 100% of currently active test files (`tests/unit/SupabaseStorageAdapter_resilience.test.ts`, 6 passing tests in 1.14s).
   - **Critical Git Repository Finding**: 99 legacy test files (21,042 lines of code) are currently unstaged deletions in the working tree (`git diff --stat apps/medicaltrip_react_app/tests`), preserved safely in git `HEAD`.
2. **Preview Server on Port 3000**:
   - `apps/medicaltrip_react_app/vite.config.ts` explicitly configures both `server.port: 3000` and `preview.port: 3000` with `host: true` and `allowedHosts: true`.
   - Port 3000 is currently unallocated and immediately ready to be bound.
   - Built assets in `dist/index.html` use `base: '/'` absolute root references, fully compatible with SPA route serving.
3. **Chromium CDP Tooling Landscape**:
   - macOS Chrome binary verified at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (Google Chrome 153.0.8010.48).
   - Node.js runtime is **v26.7.0**, providing native global `WebSocket` and `fetch` without third-party dependencies.
   - Four distinct CDP/automation assets exist:
     * `scripts/audit_e2e_click_harness.mjs` (1,006 lines): The most advanced harness in the repo, featuring CDP domain activation (`Page`, `DOM`, `Runtime`, `Network`), Canvas signature dispatch via `Input.dispatchMouseEvent`, Supabase REST API request interception, and bidirectional database validation.
     * `scripts/visual_qa_audit.mjs` (292 lines): Multi-viewport visual regression and screenshot capture tool.
     * `.agents/skills/autonomous-qa-evaluator/scripts/run_autonomous_qa.mjs` (369 lines): Formal MBT and Linear Temporal Logic (LTL) trajectory verifier.
     * `.agents/skills/patient-creator/scripts/create_patient.ts` (217 lines): Programmatic fixture generator that connects directly to Supabase Cloud to provision bookings, events, shifts, transfers, expenses, and settlements.
4. **Supabase Cloud REST API Connectivity**:
   - Endpoint: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`.
   - Tested live with secret key `sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-`: Returned HTTP 200 immediately across all 6 core tables (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`).
   - `SupabaseStorageAdapter` verified with zero HTTP 406 (`PGRST116`) errors via `maybeSingle()` queries.
5. **CRUD Lifecycle & Fixture Gaps for Requirement R1 (2026-09-19T15:37:50Z)**:
   - While `SupabaseStorageAdapter` provides complete CRUD methods (`saveBooking`, `deleteBooking`, `saveEvent`, `deleteEvent`, `saveShift`, `deleteShift`, `saveTransfer`, `deleteTransfer`, `saveExpense`, `deleteExpense`), the React application layer (`AppContext.tsx` and UI views) lacks delete actions for shifts, transfers, and expenses.
   - Recommendations are provided below for both E2E CDP click verification and direct Supabase REST integration tests.

---

## 1. Vitest Test Setup & NPM Scripts in `apps/medicaltrip_react_app`

### 1.1 `package.json` Scripts & Dependencies
File: `apps/medicaltrip_react_app/package.json`

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Key dependencies:
- Core: `react: ^18.3.1`, `react-dom: ^18.3.1`, `dexie: ^4.0.8`, `@supabase/supabase-js: ^2.116.0`
- Dev/Test: `vitest: ^2.0.5` (running Vitest v2.1.9), `typescript: ^5.5.4`, `vite: ^5.4.3`, `happy-dom: ^20.11.6`, `fake-indexeddb: ^6.2.5`, `@testing-library/react: ^16.3.2`

### 1.2 `vite.config.ts` Configuration
File: `apps/medicaltrip_react_app/vite.config.ts` (lines 1-48)
- Path aliases:
  ```ts
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@features': path.resolve(__dirname, './src/features'),
    '@core': path.resolve(__dirname, './src/core'),
    '@domain': path.resolve(__dirname, './src/domain'),
    '@application': path.resolve(__dirname, './src/application'),
    '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
    '@presentation': path.resolve(__dirname, './src/presentation'),
  }
  ```
- Vitest configuration status:
  - Line 1 contains `/// <reference types="vitest" />`.
  - Noticeably, there is **no explicit `test: { ... }` block** inside `vite.config.ts`. Vitest runs with its default configuration:
    - Root: current directory (`apps/medicaltrip_react_app`)
    - Environment: `node` (unless overridden with `@vitest-environment happy-dom` or similar docblock)
    - File matching pattern: `**/*.{test,spec}.?(c|m)[jt]s?(x)`
    - Watch mode disabled by default under `vitest run`

### 1.3 Disk State vs Git HEAD Test Suites
An empirical comparison between disk and git reveals an important state:
- **Active on Disk**: `tests/unit/SupabaseStorageAdapter_resilience.test.ts` (228 lines, 6 tests).
- **Execution of `npm test`**:
  ```
   ✓ tests/unit/SupabaseStorageAdapter_resilience.test.ts (6)
     ✓ SupabaseStorageAdapter Resilience & HTTP 406 Elimination (6)
   Test Files  1 passed (1)
        Tests  6 passed (6)
     Duration  1.14s
  ```
- **Git Status**: 99 test files are marked as deleted in the working directory (`git diff --stat apps/medicaltrip_react_app/tests`). These 99 files in git HEAD cover:
  - `tests/adversarial/` (22 test files): Stress tests for financial math, responsive layouts, CRDT race conditions, companion turn sheets.
  - `tests/application/` (13 test files): Unit tests for all use cases (`CreateEventUseCase`, `CreatePatientBookingUseCase`, `ReconcileSettlementUseCase`, `SettleExpenseUseCase`, etc.).
  - `tests/domain/` (10 test files): Invariant checks on `Money`, `SettlementLedger`, `CompanionShift`, `DriverTransfer`, `PatientBooking`.
  - `tests/infrastructure/` (10 test files): `CRDT`, `DexieStorageAdapter`, `Sha256LedgerChain`, `LocalizedPdfExport`.
  - `tests/presentation/` (19 test files): React Testing Library suites for UI components (`SettlementBar`, `NewPatientModal`, `EventDrawer`, `RoleBoundaryIsolation`, etc.).
  - `tests/tier1/` to `tests/tier4/` (15 test files): Tiered integration suites.

### 1.4 Compilation & Production Build Verification
- **Typecheck**: `npm run typecheck` (`tsc --noEmit`) completes with **0 errors**.
- **Production Build**: `npm run build` (`tsc -b && vite build`) completes in **3.41s**, emitting:
  - `dist/index.html` (2.41 kB)
  - `dist/assets/index-D66mAIE-.js` (642.82 kB)
  - `dist/assets/index-B2N8YpzD.css` (68.75 kB)
  - `dist/assets/vendor-supabase-D_t8kiev.js` (223.81 kB)
  - `dist/assets/vendor-react-Cre2rhBu.js` (133.97 kB)
  - `dist/assets/vendor-dexie-CFrudMJs.js` (96.37 kB)
  - `dist/assets/vendor-icons-C2QIiYCZ.js` (42.30 kB)
  - Dedicated Web Worker bundles: `financialAuditorActor.worker`, `nurseActor.worker`, `driverActor.worker`, `guideActor.worker`.

---

## 2. Inventory and Analysis of Existing CDP Scripts & Skills

| Asset Path | Lines | Primary Purpose | CDP Port | Target URL / Port | Key Features |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `scripts/audit_e2e_click_harness.mjs` | 1,006 | Exhaustive interactive click simulation across all 4 archetypes | 9222 | `http://localhost:3000` | Full Network & Runtime interception, Canvas signature via `Input.dispatchMouseEvent`, Supabase REST assertion |
| `scripts/visual_qa_audit.mjs` | 292 | Visual QA & Multi-viewport screenshot generation | 9444 | Spawns `vite preview --port 4173` | Emulation (Desktop 1440x900 & Mobile 390x844), modal opening, drawer opening |
| `.agents/skills/autonomous-qa-evaluator/scripts/run_autonomous_qa.mjs` | 369 | Formal MBT & LTL invariant verification | 9222 | `http://localhost:3000/apps/.../dist/` *(needs update)* | LTL Trajectory Verifier, 3G network throttling emulation, SHA-256 validation |
| `.agents/skills/patient-creator/scripts/create_patient.ts` | 217 | Programmatic Supabase Cloud fixture generator | N/A | Direct Supabase REST API | Uses `CreatePatientBookingUseCase`, `GenerateSmartItineraryUseCase`, `ReconcileSettlementUseCase` |
| `apps/medicaltrip_react_app/scripts/verify_storage_adapter.ts` | 66 | Smoke test for `SupabaseStorageAdapter` | N/A | Direct Supabase REST API | Tests `getBooking`, `getEventsByBooking`, `getSettlement`, verifies zero HTTP 406 |
| `apps/medicaltrip_react_app/scripts/clean_supabase_data.cjs` | 90 | Data cleanup script via PostgreSQL pooler | N/A | `aws-0-us-west-2.pooler.supabase.com:6543` | Truncates operational tables while preserving system user logins |
| `apps/medicaltrip_react_app/scripts/seed_rva350_only.ts` | 62 | Clean seed for patient Natalie Rumai (`RVA350-1`) | N/A | Direct Supabase REST API | Purges operational tables and loads `rva350` archetype |

### Detailed Evaluation of Skills:
- **`autonomous-qa-evaluator`**: Codified in `.agents/skills/autonomous-qa-evaluator/SKILL.md`. Defines the 5-axis QA protocol (Semantic accessibility inspection, BigInt determinism, live CDP runtime audit, super-journeys, multi-viewport self-healing).
- **`patient-creator`**: Codified in `.agents/skills/patient-creator/SKILL.md`. Provides zero-friction creation of individual patient cases with automated code generation (`RVA-xxx`), itinerary generation presets (`OPHTHALMOLOGY_3D`, `CARDIOLOGY_5D`, etc.), and ledger balancing in BigInt cents.

---

## 3. Port 3000 Preview Server Configuration & Readiness

### 3.1 Vite Server & Preview Configuration
In `apps/medicaltrip_react_app/vite.config.ts`:
```ts
server: {
  port: 3000,
  host: true,
  allowedHosts: true,
},
preview: {
  port: 3000,
  host: true,
  allowedHosts: true,
},
```
- Both `npm run dev` and `npm run preview` bind to port 3000 by default.
- Setting `host: true` binds to `0.0.0.0`, allowing connections via `localhost`, `127.0.0.1`, or local network IP.
- `allowedHosts: true` allows any Host header, eliminating DNS rebinding blocks during automated CDP test execution.

### 3.2 Production Assets Readiness
- The `dist/` directory exists and has been built from the latest codebase.
- File integrity:
  - `dist/index.html` references `/assets/index-D66mAIE-.js` and `/assets/index-B2N8YpzD.css`.
  - ServiceWorker registration logic is embedded to register `/sw.js`.
- Port readiness check:
  - Tested with `lsof -i :3000`: Port 3000 is currently free.
  - Starting the preview server requires running `npx vite preview --port 3000 --strictPort` in `apps/medicaltrip_react_app`.

### 3.3 SPA Routing & Base URL Behavior
- In `vite.config.ts`, line 7 specifies `base: '/'`.
- Vite's built-in preview server serves `dist/index.html` for any unmatched route (e.g. `/portal-paciente` or `/?token=INV-2026-DEMO`), ensuring client-side React Router / App state routes do not return HTTP 404.

---

## 4. Headless Chromium CDP Execution with Full Error Interception

### 4.1 System Environment
- **OS**: macOS (Darwin arm64)
- **Chrome Binary**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Node.js**: `v26.7.0` (with native `WebSocket` and `fetch`)

### 4.2 Browser Launch Arguments
To guarantee headless execution without background interference or credential prompts:
```js
const chromeArgs = [
  '--headless=new',
  '--disable-gpu',
  `--remote-debugging-port=${CDP_PORT}`, // 9222
  '--no-first-run',
  '--no-default-browser-check',
  '--ignore-certificate-errors',
  `--user-agent=MedicalTripAutomation/1.0 (Macintosh; Intel Mac OS X 10_15_7)`,
  `--user-data-dir=/tmp/chrome_audit_${Date.now()}`,
  'about:blank',
];
```

### 4.3 WebSocket Connection Architecture
In Node.js v26:
```js
// 1. Create page target via HTTP PUT
const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(BASE_URL)}`, { method: 'PUT' });
const target = await res.json();

// 2. Connect via native WebSocket
const ws = new WebSocket(target.webSocketDebuggerUrl);

// 3. Message dispatcher & promise-based send helper
let msgId = 1;
const callbacks = new Map();

ws.onmessage = (evt) => {
  const msg = JSON.parse(evt.data);
  if (msg.id != null && callbacks.has(msg.id)) {
    const resolve = callbacks.get(msg.id);
    callbacks.delete(msg.id);
    resolve(msg);
  } else if (msg.method != null) {
    handleCdpEvent(msg.method, msg.params);
  }
};

const cdpSend = (method, params = {}) => {
  const id = msgId++;
  return new Promise((resolve) => {
    callbacks.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
};
```

### 4.4 CDP Domains to Activate
```js
await cdpSend('Page.enable');
await cdpSend('DOM.enable');
await cdpSend('Runtime.enable');
await cdpSend('Network.enable', { maxPostDataSize: 65536 });
await cdpSend('Page.setLifecycleEventsEnabled', { enabled: true });
```

### 4.5 Full Error & Network Interception Specification

#### A. Console Errors & Warnings Interception
```js
if (method === 'Runtime.consoleAPICalled') {
  const text = params.args.map(a => a.value ?? a.description ?? `[${a.type}]`).join(' ');
  if (params.type === 'error') {
    consoleErrors.push({
      text,
      stack: params.stackTrace,
      timestamp: params.timestamp,
    });
  } else if (params.type === 'warning') {
    consoleWarnings.push({ text, timestamp: params.timestamp });
  }
}
```

#### B. Uncaught Runtime Exceptions Interception
```js
if (method === 'Runtime.exceptionThrown') {
  const desc = params.exceptionDetails.exception?.description || params.exceptionDetails.text;
  unhandledExceptions.push({
    description: desc,
    url: params.exceptionDetails.url,
    line: params.exceptionDetails.lineNumber,
    column: params.exceptionDetails.columnNumber,
    stackTrace: params.exceptionDetails.stackTrace,
  });
}
```

#### C. JavaScript Dialog Auto-Handling (Modals, Alerts, Confirms)
```js
if (method === 'Page.javascriptDialogOpening') {
  await cdpSend('Page.handleJavaScriptDialog', { accept: true });
}
```

#### D. Supabase REST API Request & Response Interception
```js
const inFlightRequests = new Map();

if (method === 'Network.requestWillBeSent') {
  if (params.request.url.includes('/rest/v1/')) {
    inFlightRequests.set(params.requestId, {
      id: params.requestId,
      url: params.request.url,
      method: params.request.method,
      headers: params.request.headers,
      postData: params.request.postData,
      timestamp: params.wallTime,
    });
  }
} else if (method === 'Network.responseReceived') {
  if (inFlightRequests.has(params.requestId)) {
    const req = inFlightRequests.get(params.requestId);
    const entry = {
      ...req,
      status: params.response.status,
      statusText: params.response.statusText,
      headers: params.response.headers,
    };
    supabaseHttpLogs.push(entry);
    inFlightRequests.delete(params.requestId);

    if (params.response.status >= 400) {
      httpFailures.push(entry);
    }
  }
} else if (method === 'Network.loadingFailed') {
  if (inFlightRequests.has(params.requestId)) {
    const req = inFlightRequests.get(params.requestId);
    httpFailures.push({ ...req, status: 0, errorText: params.errorText });
    inFlightRequests.delete(params.requestId);
  }
}
```

#### E. Retina HTML5 Canvas Signature Simulation
To test the touch signature pad without physical touch devices:
```js
// 1. Dispatch native mouse events through CDP Input domain
await cdpSend('Input.dispatchMouseEvent', {
  type: 'mousePressed',
  x: canvasRect.x0,
  y: canvasRect.y0,
  button: 'left',
  buttons: 1,
  clickCount: 1,
});
await cdpSend('Input.dispatchMouseEvent', {
  type: 'mouseMoved',
  x: canvasRect.x1,
  y: canvasRect.y1,
  buttons: 1,
});
await cdpSend('Input.dispatchMouseEvent', {
  type: 'mouseReleased',
  x: canvasRect.x1,
  y: canvasRect.y1,
  button: 'left',
  buttons: 0,
});

// 2. Direct 2D context stroke fallback inside browser
await evaluate(`
  (() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(120, 60);
      ctx.stroke();
    }
  })()
`);
```

---

## 5. Test Fixtures, Utilities, and Necessary Expansions

### 5.1 Existing Assets
1. **Domain Entities & Value Objects**:
   - `Money.ts` (BigInt cents math, scale 10^6 integer multipliers, formatters).
   - `SettlementLedger.ts` (SHA-256 seal derivation, BigInt net balance reconciliation).
   - `PatientBooking.ts`, `ItineraryEvent.ts`, `CompanionShift.ts`, `DriverTransfer.ts`, `ReceiptExpense.ts`.
2. **Infrastructure Storage Adapters**:
   - `SupabaseStorageAdapter.ts`: Implements all CRUD methods for all 5 domains.
   - `DexieStorageAdapter.ts`: Local-first IndexedDB adapter.
   - `InMemoryStorageAdapter.ts`: In-memory storage for unit testing.
3. **Seeding & Fixture Scripts**:
   - `src/core/infrastructure/data/archetypes.data.ts`: Predefined Caribbean archetypes (`rva171`, `rva282`, `rva341`, `rva077`, `rva350`).
   - `.agents/skills/patient-creator/scripts/create_patient.ts`: Complete patient generator.
   - `.agents/skills/patient-creator/examples/sample_patients.json`: Patient configuration fixtures.
   - `apps/medicaltrip_react_app/scripts/seed_rva350_only.ts`: Focused test patient seeder.
   - `apps/medicaltrip_react_app/scripts/clean_supabase_data.cjs`: Truncates operational tables while preserving users.

### 5.2 CRUD Capabilities Matrix (Storage vs AppContext vs UI)

| Domain | Operation | Storage Port (`SupabaseStorageAdapter`) | State Layer (`AppContext.tsx`) | UI Trigger | Status & Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Bookings** | Create | `saveBooking()` | `createPatientBooking()` | `NewPatientModal`, `PatientSelfRegistration` | Full UI & Storage support |
| | Read | `getBooking()`, `getAllBookings()` | `archetypesList`, `activeBooking` | Cockpit Switcher Pill, `PassengersView` | Full UI & Storage support |
| | Update | `saveBooking()` (upsert) | `saveBooking()` | `PassengersView` (notes/hotel) | Full UI & Storage support |
| | Delete/Archive | `deleteBooking()` | Via `storagePort.deleteBooking()` | `handleArchive` in `PassengersView` | Full UI & Storage support |
| **Events** | Create | `saveEvent()`, `saveEventsBatch()` | `addEvent()` | `SmartItineraryModal`, preset generator | Full UI & Storage support |
| | Read | `getEventsByBooking()`, `getEventById()` | `events` state array | Calendar Views, `PlanView`, Agenda | Full UI & Storage support |
| | Update | `saveEvent()` | `updateEvent()`, `rescheduleEvent()` | `EventDetailDrawer`, drag-and-drop | Full UI & Storage support |
| | Delete | `deleteEvent()` | `deleteEvent()` | `EventDetailDrawer` (delete button) | Full UI & Storage support |
| **Shifts** | Create | `saveShift()` | `logCompanionShift()` | `CompanionModeView` | Supported |
| | Read | `getShiftsByBooking()` | `shifts` state array | `SettlementView`, `CompanionModeView` | Supported |
| | Update | `saveShift()` | `updateCompanionShift()` | +/- 0.5h stepper buttons in `SettlementView` | Supported |
| | Delete | `deleteShift()` | ❌ *Missing in AppContext* | ❌ *No UI delete button* | Storage adapter only |
| **Transfers** | Create | `saveTransfer()` | ❌ *Generated in batch only* | `GenerateSmartItineraryUseCase` | Batch creation only |
| | Read | `getTransfersByBooking()` | `transfers` state array | `SettlementView`, `PlanView` | Supported |
| | Update | `saveTransfer()` | `performDriverCheckIn()` | Driver check-in trigger | Check-in only |
| | Delete | `deleteTransfer()` | ❌ *Missing in AppContext* | ❌ *No UI delete button* | Storage adapter only |
| **Expenses** | Create | `saveExpense()` | `settleExpense()`, `logFastExpense()` | 1-Tap preset expense buttons | Supported |
| | Read | `getExpensesByBooking()` | `expenses` state array | `SettlementView` breakdown | Supported |
| | Update | `saveExpense()` | ❌ *Only append supported* | ❌ *No in-situ amount edit* | Storage adapter only |
| | Delete | `deleteExpense()` | ❌ *Missing in AppContext* | ❌ *No UI delete button* | Storage adapter only |
| **Settlements** | Reconcile | `saveSettlement()` | `recalculateSettlement()` | Automatic on state changes | Deterministic BigInt math |
| | Sign & Seal | `saveSettlement()` | `executeOneTapSettlementWorkflow()` | Signature Canvas modal | SHA-256 seal generation |

### 5.3 Concrete Recommendations for Campaign 2026-09-19T15:37:50Z

1. **Dedicated CRUD Test Suite for Direct Supabase Cloud REST API**:
   - Create an automated test runner script (e.g. `scripts/verify_admin_crud_supabase.ts` or a new Vitest suite `tests/e2e/AdminSupabaseCRUD.test.ts`) that executes the complete lifecycle directly against Supabase Cloud:
     * **Bookings**: Create booking -> Read from Supabase -> Update hotel/notes -> Delete booking -> Verify row removed.
     * **Events**: Create clinical event -> Read from Supabase -> Reschedule start/end time -> Delete event -> Verify row removed.
     * **Shifts**: Create shift -> Read from Supabase -> Update hours logged (+0.5h) -> Delete shift -> Verify row removed.
     * **Transfers**: Create transfer -> Read from Supabase -> Update check-in status -> Delete transfer -> Verify row removed.
     * **Expenses**: Create expense -> Read from Supabase -> Update expense amount -> Delete expense -> Verify row removed.
     * **Settlement**: Recalculate settlement -> Assert BigInt cents arithmetic -> Verify `sha256_seal` in Supabase table.
2. **Unified Preview + CDP Execution Harness**:
   - Update `scripts/audit_e2e_click_harness.mjs` or add an orchestration wrapper:
     * Check if port 3000 is open. If not, spawn `npx vite preview --port 3000 --strictPort` automatically.
     * Spawn Google Chrome with `--headless=new` on port 9222.
     * Run all Admin interactive journeys (Cockpit switching, fast expenses, shift adjustments, event rescheduling, archive booking, digital signature).
     * Assert 0 `console.error`, 0 unhandled exceptions, and 100% HTTP 200/201/204 on Supabase requests.
     * Terminate both processes cleanly in `finally`.
3. **Test Suite Hygiene & Git Alignment**:
   - The team should be informed that 99 test files are uncommitted deletions in git working tree.
   - For CI/CD, restoring necessary test files or consolidating them into modern feature-first hexagonal test suites will ensure long-term regression prevention.
