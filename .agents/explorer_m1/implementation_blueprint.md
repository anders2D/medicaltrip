# 📐 Milestone 1 Implementation Blueprint: Toolchain, PWA & Hexagonal DDD Core
## Medical Trip Colombia S.A.S. — Standalone React 19 + TypeScript PWA
**Target Path**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Milestone**: M1 (Toolchain, PWA & Hexagonal DDD Core)  
**Agent**: Explorer M1  
**Timestamp**: 2026-08-23T16:24:00Z  
**Compliance Standards**: Hexagonal Architecture (Ports & Adapters) · Pure DDD (0 Framework Dependencies) · Martin Fowler Money Pattern (`BigInt` Integer Cents) · Fail-Fast Geospatial Boundaries (`OperativeTerritory`) · Strict TypeScript (`strict: true`) · PWA Offline Cache-First Service Worker

---

## 📑 1. Architectural System Overview

Milestone 1 establishes the foundational engineering bedrock for the **Medical Trip Colombia S.A.S. Field Operations Web Application**:
1. **Modern Standalone Toolchain**: Vite 5, React 19 / 18.3+ compatibility, TypeScript 5.5+ in strict mode (`strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`), Tailwind CSS 3.4 with zinc/slate tokens, PostCSS, Lucide icons, and Vitest test runner.
2. **PWA Standalone & 100% Offline Capability**: Complete `manifest.json` and a robust Cache-First Service Worker (`public/sw.js`) ensuring seamless offline loading and execution.
3. **Pure Domain Layer (`src/domain/`)**: Completely isolated with **0 external framework dependencies** (no React, no Vite, no Dexie imports).
   - `Money` Value Object: Exact `BigInt` integer cents arithmetic ($1.00 COP = 100 centavos, $1.00 USD = 100 cents), zero IEEE-754 floating-point rounding errors, remainder-preserving `.split(n)`.
   - `OperativeTerritory` Value Object: Fail-fast domain invariant that immediately throws `NonOperativeTerritoryError` if non-operative zones (e.g. `MOCOA`, `LETICIA`, `TUMACO`, `ARAUCA`, `GUAVIARE`, `CHOCO`) are passed.
   - `EventCategory` & `EventStatus`: Strictly typed lifecycle enumerations with finite state machine transition validation.
   - Core Entities: `PatientBooking`, `ItineraryEvent`, `CompanionShift`, `DriverTransfer`, `ReceiptExpense`, and `SettlementLedger`.
   - Domain Errors: Hierarchical domain exceptions rooted at `DomainError`.
   - Abstract Ports: `IStoragePort`, `IBlobStoragePort`, `IActorEventBusPort`, `IOCRPort`, `IExportPort`, and `IStoragePersistPort`.

---

## 📂 2. Milestone 1 File Manifest

```
apps/medicaltrip_react_app/
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── public/
│   ├── manifest.json
│   └── sw.js
└── src/
    ├── index.css
    ├── domain/
    │   ├── index.ts
    │   ├── errors/
    │   │   ├── DomainError.ts
    │   │   └── NonOperativeTerritoryError.ts
    │   ├── value-objects/
    │   │   ├── Money.ts
    │   │   ├── OperativeTerritory.ts
    │   │   ├── EventCategory.ts
    │   │   └── EventStatus.ts
    │   ├── entities/
    │   │   ├── PatientBooking.ts
    │   │   ├── ItineraryEvent.ts
    │   │   ├── CompanionShift.ts
    │   │   ├── DriverTransfer.ts
    │   │   ├── ReceiptExpense.ts
    │   │   └── SettlementLedger.ts
    │   └── ports/
    │       ├── IStoragePort.ts
    │       ├── IBlobStoragePort.ts
    │       ├── IActorEventBusPort.ts
    │       ├── IOCRPort.ts
    │       ├── IExportPort.ts
    │       └── IStoragePersistPort.ts
    └── (M1 Unit Tests in tests/domain/)
        ├── Money.test.ts
        ├── OperativeTerritory.test.ts
        └── SettlementLedger.test.ts
```

---

## 🛠️ 3. Toolchain & Configuration Files Specification

### 3.1 `package.json`
**File**: `apps/medicaltrip_react_app/package.json`

```json
{
  "name": "medicaltrip-react-app",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "dexie": "^4.0.8",
    "lucide-react": "^0.439.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "fake-indexeddb": "^6.2.5",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.3",
    "vitest": "^2.0.5"
  }
}
```

---

### 3.2 `tsconfig.json`
**File**: `apps/medicaltrip_react_app/tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

---

### 3.3 `tsconfig.app.json`
**File**: `apps/medicaltrip_react_app/tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@domain/*": ["src/domain/*"],
      "@application/*": ["src/application/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@presentation/*": ["src/presentation/*"]
    }
  },
  "include": ["src", "tests", "vite.config.ts"]
}
```

---

### 3.4 `tsconfig.node.json`
**File**: `apps/medicaltrip_react_app/tsconfig.node.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts", "tailwind.config.js", "postcss.config.js"]
}
```

---

### 3.5 `vite.config.ts`
**File**: `apps/medicaltrip_react_app/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
});
```

---

### 3.6 `tailwind.config.js`
**File**: `apps/medicaltrip_react_app/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        category: {
          flight: '#0284c7', // Sky-600
          clinical: '#4f46e5', // Indigo-600
          lab: '#0d9488', // Teal-600
          pharmacy: '#10b981', // Emerald-500
          pocket: '#d97706', // Amber-600
          hotel: '#475569', // Slate-600
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        drawer: '-4px 0 24px -4px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
};
```

---

### 3.7 `postcss.config.js`
**File**: `apps/medicaltrip_react_app/postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### 3.8 `index.html`
**File**: `apps/medicaltrip_react_app/index.html`

```html
<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-50">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="description" content="Gestión de Itinerarios Médicos en Terreno y Liquidación Financiera Automática - Medical Trip Colombia S.A.S." />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="MedicalTrip" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <link rel="manifest" href="/manifest.json" />
    <title>Medical Trip Colombia — Itinerarios & Liquidación en Terreno</title>
  </head>
  <body class="h-full antialiased text-slate-900 bg-slate-50 selection:bg-indigo-500 selection:text-white">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('✅ ServiceWorker registered with scope:', reg.scope))
            .catch((err) => console.warn('⚠️ ServiceWorker registration failed:', err));
        });
      }
    </script>
  </body>
</html>
```

---

### 3.9 `public/manifest.json`
**File**: `apps/medicaltrip_react_app/public/manifest.json`

```json
{
  "name": "Medical Trip Colombia - Itinerarios & Liquidación",
  "short_name": "MedicalTrip",
  "description": "Gestión de Itinerarios Médicos en Terreno y Liquidación Financiera 100% Offline",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#f8fafc",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

### 3.10 `public/sw.js` (PWA Cache-First Service Worker)
**File**: `apps/medicaltrip_react_app/public/sw.js`

```javascript
const CACHE_NAME = 'medicaltrip-static-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ [SW] Precaching core assets');
      return cache.addAll(STATIC_PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-First strategy for application assets and fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache immediately, optionally fetch in background to refresh
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {
          // Offline fallback silently
        });
        return cachedResponse;
      }

      // Network fallback and cache on demand
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback for HTML navigation
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
```

---

### 3.11 `src/index.css`
**File**: `apps/medicaltrip_react_app/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Slate & Zinc Tokens (High sunlight readability) */
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-subtle: #f1f5f9;
  --bg-surface-muted: #e2e8f0;

  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  --border-strong: #94a3b8;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Category Color Tokens */
  --cat-flight-bg: rgba(2, 132, 199, 0.10);
  --cat-flight-border: #0284c7;
  --cat-flight-text: #0369a1;

  --cat-clinical-bg: rgba(79, 70, 229, 0.10);
  --cat-clinical-border: #4f46e5;
  --cat-clinical-text: #4338ca;

  --cat-lab-bg: rgba(13, 148, 136, 0.10);
  --cat-lab-border: #0d9488;
  --cat-lab-text: #0f766e;

  --cat-pharmacy-bg: rgba(16, 185, 129, 0.10);
  --cat-pharmacy-border: #10b981;
  --cat-pharmacy-text: #047857;

  --cat-pocket-bg: rgba(217, 119, 6, 0.10);
  --cat-pocket-border: #d97706;
  --cat-pocket-text: #b45309;

  --cat-hotel-bg: rgba(100, 116, 139, 0.12);
  --cat-hotel-border: #475569;
  --cat-hotel-text: #334155;
}

/* Custom Scrollbar for Time Columns and Drawers */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Tabular numbers for arithmetic and timestamps */
.tabular-nums {
  font-variant-numeric: tabular-nums lining-nums;
}

/* Touch & Interaction Optimizations */
button, input, select, textarea {
  touch-action: manipulation;
}
```

---

## 💎 4. Domain Layer: Errors Hierarchy

### 4.1 `DomainError.ts`
**File**: `apps/medicaltrip_react_app/src/domain/errors/DomainError.ts`

```typescript
export abstract class DomainError extends Error {
  public readonly timestamp: string;

  constructor(message: string, public readonly code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidMoneyAmountError extends DomainError {
  constructor(message: string = 'Invalid monetary amount specified') {
    super(message, 'INVALID_MONEY_AMOUNT');
  }
}

export class CurrencyMismatchError extends DomainError {
  constructor(sourceCurrency: string, targetCurrency: string) {
    super(`Cannot perform arithmetic between incompatible currencies: ${sourceCurrency} and ${targetCurrency}`, 'CURRENCY_MISMATCH');
  }
}

export class InvalidEventTransitionError extends DomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(`Illegal milestone state transition from ${fromStatus} to ${toStatus}`, 'INVALID_EVENT_TRANSITION');
  }
}

export class InvalidBookingError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_BOOKING');
  }
}

export class EventNotFoundError extends DomainError {
  constructor(eventId: string) {
    super(`Itinerary event with ID '${eventId}' was not found in the domain repository`, 'EVENT_NOT_FOUND');
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message, 'INVARIANT_VIOLATION');
  }
}
```

---

### 4.2 `NonOperativeTerritoryError.ts`
**File**: `apps/medicaltrip_react_app/src/domain/errors/NonOperativeTerritoryError.ts`

```typescript
import { DomainError } from './DomainError';

export class NonOperativeTerritoryError extends DomainError {
  constructor(public readonly inputLocation: string, public readonly reason: string) {
    super(
      `OperativeTerritory violation: Location '${inputLocation}' is outside authorized medical corridors. Reason: ${reason}`,
      'NON_OPERATIVE_TERRITORY'
    );
  }
}
```

---

## 💎 5. Domain Layer: Value Objects

### 5.1 `Money.ts` (Martin Fowler Pattern in Native `BigInt` Cents)
**File**: `apps/medicaltrip_react_app/src/domain/value-objects/Money.ts`

```typescript
import { InvalidMoneyAmountError, CurrencyMismatchError } from '../errors/DomainError';

export type CurrencyCode = 'COP' | 'USD';

export class Money {
  public readonly cents: bigint;
  public readonly currency: CurrencyCode;

  private constructor(cents: bigint, currency: CurrencyCode = 'COP') {
    this.cents = cents;
    this.currency = currency;
    Object.freeze(this);
  }

  public static fromCents(cents: bigint | number | string, currency: CurrencyCode = 'COP'): Money {
    try {
      const bigintCents = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(Number(cents)));
      return new Money(bigintCents, currency);
    } catch {
      throw new InvalidMoneyAmountError(`Invalid cents representation: ${cents}`);
    }
  }

  public static fromAmount(amount: number | string | bigint, currency: CurrencyCode = 'COP'): Money {
    if (typeof amount === 'bigint') {
      return new Money(amount * 100n, currency);
    }
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    if (isNaN(num) || !isFinite(num)) {
      throw new InvalidMoneyAmountError(`Cannot parse monetary amount: ${amount}`);
    }
    const roundedCents = BigInt(Math.round(num * 100));
    return new Money(roundedCents, currency);
  }

  public static zero(currency: CurrencyCode = 'COP'): Money {
    return new Money(0n, currency);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  public multiply(factor: number | bigint): Money {
    if (typeof factor === 'bigint') {
      return new Money(this.cents * factor, this.currency);
    }
    if (isNaN(factor) || !isFinite(factor)) {
      throw new InvalidMoneyAmountError(`Multiplication factor is invalid: ${factor}`);
    }
    // High-precision scaled integer arithmetic (10^6 scale)
    const scale = 1_000_000n;
    const factorScaled = BigInt(Math.round(factor * 1_000_000));
    const resultCents = (this.cents * factorScaled + (scale / 2n)) / scale;
    return new Money(resultCents, this.currency);
  }

  public split(parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new InvalidMoneyAmountError(`Split parts must be a positive integer. Received: ${parts}`);
    }
    const n = BigInt(parts);
    const quotient = this.cents / n;
    const remainder = this.cents % n;

    const result: Money[] = [];
    for (let i = 0; i < parts; i++) {
      const extraCent = BigInt(i) < (remainder >= 0n ? remainder : -remainder) ? (this.cents >= 0n ? 1n : -1n) : 0n;
      result.push(new Money(quotient + extraCent, this.currency));
    }
    return result;
  }

  public convert(exchangeRateCOPPerUSD: number, targetCurrency: CurrencyCode): Money {
    if (this.currency === targetCurrency) return this;
    if (exchangeRateCOPPerUSD <= 0) {
      throw new InvalidMoneyAmountError(`Exchange rate must be positive: ${exchangeRateCOPPerUSD}`);
    }

    if (this.currency === 'USD' && targetCurrency === 'COP') {
      return this.multiply(exchangeRateCOPPerUSD).withCurrency('COP');
    } else {
      const inverse = 1 / exchangeRateCOPPerUSD;
      return this.multiply(inverse).withCurrency('USD');
    }
  }

  public withCurrency(currency: CurrencyCode): Money {
    return new Money(this.cents, currency);
  }

  public equals(other: Money): boolean {
    return this.currency === other.currency && this.cents === other.cents;
  }

  public isZero(): boolean {
    return this.cents === 0n;
  }

  public isPositive(): boolean {
    return this.cents > 0n;
  }

  public isNegative(): boolean {
    return this.cents < 0n;
  }

  public toAmountNumber(): number {
    return Number(this.cents) / 100;
  }

  public formatCOP(): string {
    const amount = Number(this.cents) / 100;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  public format(): string {
    const amount = Number(this.cents) / 100;
    if (this.currency === 'COP') {
      return this.formatCOP();
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  public toJSON(): { cents: string; currency: CurrencyCode; formatted: string } {
    return {
      cents: this.cents.toString(),
      currency: this.currency,
      formatted: this.format(),
    };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}
```

---

### 5.2 `OperativeTerritory.ts` (Fail-Fast Geospatial Invariant)
**File**: `apps/medicaltrip_react_app/src/domain/value-objects/OperativeTerritory.ts`

```typescript
import { NonOperativeTerritoryError } from '../errors/NonOperativeTerritoryError';

export type OperativeZone =
  | 'MEDELLIN_CENTRO'
  | 'POBLADO'
  | 'LAURELES'
  | 'BELEN'
  | 'ROBLEDO'
  | 'CIUDAD_DEL_RIO'
  | 'ENVIGADO'
  | 'SABANETA'
  | 'ITAGUI'
  | 'BELLO'
  | 'RIONEGRO_AEROPUERTO'
  | 'MANIZALES'
  | 'PEREIRA'
  | 'BOGOTA';

export interface GeoCoordinates {
  readonly lat: number;
  readonly lng: number;
}

export class OperativeTerritory {
  public readonly zone: OperativeZone;
  public readonly address: string;
  public readonly coordinates?: GeoCoordinates;

  private static readonly FORBIDDEN_KEYWORDS = [
    'MOCOA',
    'PUTUMAYO',
    'LETICIA',
    'AMAZONAS',
    'TUMACO',
    'NARINO',
    'ARAUCA',
    'GUAVIARE',
    'MITU',
    'VAUPES',
    'INIRIDA',
    'GUAINIA',
    'PUERTO CARRENO',
    'PUERTO CARREÑO',
    'VICHADA',
    'CHOCO',
    'CHOCÓ',
    'LA GUAJIRA RURAL',
    'CAQUETA',
    'CAQUETÁ'
  ];

  private static readonly AUTHORIZED_CORRIDORS: Record<OperativeZone, { keywords: string[]; defaultCoords: GeoCoordinates }> = {
    POBLADO: {
      keywords: ['POBLADO', 'OVIEDO', 'SANTA FE', 'SANTA FÉ', 'PARK 42', 'NOVELTY', 'MILLA DE ORO', 'PROVENZA', 'MANILA', 'ASTORGA', 'DIEZ', 'POBLADO PLAZA', 'CLOFAN', 'CLOFÁN'],
      defaultCoords: { lat: 6.2087, lng: -75.5684 }
    },
    LAURELES: {
      keywords: ['LAURELES', 'INNTU', 'SEGUNDO PARQUE', 'ESTADIO', 'CUB', 'BOLIVARIANA', 'TRANSVERSAL 39'],
      defaultCoords: { lat: 6.2425, lng: -75.5925 }
    },
    CIUDAD_DEL_RIO: {
      keywords: ['CIUDAD DEL RIO', 'CIUDAD DEL RÍO', 'TORRE MEDICA CIUDAD DEL RIO', 'CLOFAN', 'CLOFÁN', 'CIMA'],
      defaultCoords: { lat: 6.2235, lng: -75.5746 }
    },
    ROBLEDO: {
      keywords: ['ROBLEDO', 'HPTU', 'PABLO TOBON', 'PABLO TOBÓN', 'CARDIO VID', 'CARDIOVID'],
      defaultCoords: { lat: 6.2758, lng: -75.5894 }
    },
    MEDELLIN_CENTRO: {
      keywords: ['CENTRO', 'PRADO CENTRO', 'CES PRADO', 'LA CANDELARIA', 'CLINICA MEDELLIN'],
      defaultCoords: { lat: 6.2518, lng: -75.5636 }
    },
    BELEN: {
      keywords: ['BELEN', 'BELÉN', 'CLINICA LAS AMERICAS', 'LAS AMÉRICAS'],
      defaultCoords: { lat: 6.2205, lng: -75.6015 }
    },
    ENVIGADO: {
      keywords: ['ENVIGADO', 'VILLA ANITA', 'EL PORTAL', 'LOMA DEL CHOCHO', 'POLICLINICA ENVIGADO'],
      defaultCoords: { lat: 6.1685, lng: -75.5815 }
    },
    SABANETA: {
      keywords: ['SABANETA', 'MAYORCA', 'CASAS DE RECUPERACION'],
      defaultCoords: { lat: 6.1515, lng: -75.6155 }
    },
    ITAGUI: {
      keywords: ['ITAGUI', 'ITAGÜÍ'],
      defaultCoords: { lat: 6.1725, lng: -75.6095 }
    },
    BELLO: {
      keywords: ['BELLO', 'CLINICA DEL NORTE'],
      defaultCoords: { lat: 6.3335, lng: -75.5585 }
    },
    RIONEGRO_AEROPUERTO: {
      keywords: ['RIONEGRO', 'JMC', 'JOSE MARIA CORDOVA', 'JOSÉ MARÍA CÓRDOVA', 'AEROPUERTO', 'LLANOGRANDE', 'MDE'],
      defaultCoords: { lat: 6.1645, lng: -75.4267 }
    },
    MANIZALES: {
      keywords: ['MANIZALES', 'CALDAS', 'ONCOLOGOS DEL OCCIDENTE'],
      defaultCoords: { lat: 5.0689, lng: -75.5174 }
    },
    PEREIRA: {
      keywords: ['PEREIRA', 'RISARALDA', 'CLINICA COMFAMILIAR'],
      defaultCoords: { lat: 4.8133, lng: -75.6961 }
    },
    BOGOTA: {
      keywords: ['BOGOTA', 'BOGOTÁ', 'EL DORADO', 'BOG', 'TEQUENDAMA'],
      defaultCoords: { lat: 4.7110, lng: -74.0721 }
    }
  };

  private constructor(zone: OperativeZone, address: string, coordinates?: GeoCoordinates) {
    this.zone = zone;
    this.address = address.trim();
    this.coordinates = coordinates || OperativeTerritory.AUTHORIZED_CORRIDORS[zone].defaultCoords;
    Object.freeze(this);
  }

  public static fromString(input: string, coordinates?: GeoCoordinates): OperativeTerritory {
    if (!input || input.trim().length === 0) {
      throw new NonOperativeTerritoryError(input || '(vacío)', 'La ubicación no puede estar vacía');
    }

    const normalized = input.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Fail-fast invariant check for forbidden conflict zones
    for (const forbidden of OperativeTerritory.FORBIDDEN_KEYWORDS) {
      const normForbidden = forbidden.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normForbidden)) {
        throw new NonOperativeTerritoryError(
          input,
          `Zona prohibida no autorizada para operaciones médicas: '${forbidden}'. Invariante de seguridad Medical Trip.`
        );
      }
    }

    // Match against authorized corridors
    for (const [zoneKey, zoneData] of Object.entries(OperativeTerritory.AUTHORIZED_CORRIDORS) as [OperativeZone, typeof OperativeTerritory.AUTHORIZED_CORRIDORS[OperativeZone]][]) {
      for (const kw of zoneData.keywords) {
        const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(normKw)) {
          return new OperativeTerritory(zoneKey, input, coordinates);
        }
      }
    }

    // Generic fallback for medical facilities or hotels within Medellín
    if (normalized.includes('CLINICA') || normalized.includes('HOSPITAL') || normalized.includes('HOTEL') || normalized.includes('LABORATORIO') || normalized.includes('CONSULTORIO') || normalized.includes('MEDELLIN') || normalized.includes('MEDELLÍN')) {
      return new OperativeTerritory('MEDELLIN_CENTRO', input, coordinates);
    }

    throw new NonOperativeTerritoryError(
      input,
      `No se pudo vincular la dirección a ningún corredor operativo autorizado (Medellín, Valle de Aburrá, Rionegro JMC, Manizales, Pereira, Bogotá)`
    );
  }

  public static fromPreset(zone: OperativeZone, address: string, coordinates?: GeoCoordinates): OperativeTerritory {
    return new OperativeTerritory(zone, address, coordinates);
  }

  public toJSON(): { zone: OperativeZone; address: string; coordinates?: GeoCoordinates } {
    return {
      zone: this.zone,
      address: this.address,
      coordinates: this.coordinates,
    };
  }
}
```

---

### 5.3 `EventCategory.ts`
**File**: `apps/medicaltrip_react_app/src/domain/value-objects/EventCategory.ts`

```typescript
export type EventCategoryType = 'FLIGHT' | 'CLINICAL' | 'LAB' | 'PHARMACY' | 'HOTEL' | 'TRANSFER';

export interface EventCategoryMetadata {
  readonly code: EventCategoryType;
  readonly label: string;
  readonly badgeColor: string;
  readonly iconName: string;
  readonly description: string;
}

export class EventCategory {
  public static readonly FLIGHT: EventCategoryMetadata = {
    code: 'FLIGHT',
    label: 'Vuelo / Llegada',
    badgeColor: 'sky',
    iconName: 'Plane',
    description: 'Vuelos internacionales de llegada, conexión o retorno',
  };

  public static readonly CLINICAL: EventCategoryMetadata = {
    code: 'CLINICAL',
    label: 'Cita Clínica / Quirúrgica',
    badgeColor: 'indigo',
    iconName: 'Stethoscope',
    description: 'Consultas con especialistas, valoraciones y procedimientos',
  };

  public static readonly LAB: EventCategoryMetadata = {
    code: 'LAB',
    label: 'Laboratorio / Diagnóstico',
    badgeColor: 'teal',
    iconName: 'Activity',
    description: 'Toma de muestras, ecografías, resonancias y rayos X',
  };

  public static readonly PHARMACY: EventCategoryMetadata = {
    code: 'PHARMACY',
    label: 'Farmacia / Caja Menor',
    badgeColor: 'emerald',
    iconName: 'Pill',
    description: 'Compras de medicamentos postquirúrgicos y gastos menores',
  };

  public static readonly HOTEL: EventCategoryMetadata = {
    code: 'HOTEL',
    label: 'Hotel / Recuperación',
    badgeColor: 'slate',
    iconName: 'Building',
    description: 'Alojamiento, check-in, check-out y visitas domiciliarias',
  };

  public static readonly TRANSFER: EventCategoryMetadata = {
    code: 'TRANSFER',
    label: 'Traslado Ejecutivo',
    badgeColor: 'amber',
    iconName: 'Car',
    description: 'Rutas y traslados de flota Aeroturex o Uber XL',
  };

  public static getMetadata(category: EventCategoryType): EventCategoryMetadata {
    switch (category) {
      case 'FLIGHT': return EventCategory.FLIGHT;
      case 'CLINICAL': return EventCategory.CLINICAL;
      case 'LAB': return EventCategory.LAB;
      case 'PHARMACY': return EventCategory.PHARMACY;
      case 'HOTEL': return EventCategory.HOTEL;
      case 'TRANSFER': return EventCategory.TRANSFER;
    }
  }

  public static isValid(category: string): category is EventCategoryType {
    return ['FLIGHT', 'CLINICAL', 'LAB', 'PHARMACY', 'HOTEL', 'TRANSFER'].includes(category);
  }
}
```

---

### 5.4 `EventStatus.ts`
**File**: `apps/medicaltrip_react_app/src/domain/value-objects/EventStatus.ts`

```typescript
import { InvalidEventTransitionError } from '../errors/DomainError';

export type EventStatusType = 'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO';

export class EventStatus {
  private static readonly VALID_TRANSITIONS: Record<EventStatusType, EventStatusType[]> = {
    PROGRAMADO: ['EN_CAMINO', 'EN_SITIO', 'CANCELADO'],
    EN_CAMINO: ['EN_SITIO', 'CANCELADO'],
    EN_SITIO: ['COMPLETADO', 'CANCELADO'],
    COMPLETADO: [], // Terminal state
    CANCELADO: ['PROGRAMADO'], // Reopening permitted
  };

  public static canTransition(current: EventStatusType, next: EventStatusType): boolean {
    if (current === next) return true;
    return EventStatus.VALID_TRANSITIONS[current]?.includes(next) ?? false;
  }

  public static assertTransition(current: EventStatusType, next: EventStatusType): void {
    if (!EventStatus.canTransition(current, next)) {
      throw new InvalidEventTransitionError(current, next);
    }
  }

  public static getStatusLabel(status: EventStatusType): string {
    switch (status) {
      case 'PROGRAMADO': return 'Programado';
      case 'EN_CAMINO': return 'En Camino';
      case 'EN_SITIO': return 'En Sitio';
      case 'COMPLETADO': return 'Completado';
      case 'CANCELADO': return 'Cancelado';
    }
  }
}
```

---

## 📦 6. Domain Layer: Entities & Aggregates

### 6.1 `PatientBooking.ts`
**File**: `apps/medicaltrip_react_app/src/domain/entities/PatientBooking.ts`

```typescript
import { InvalidBookingError } from '../errors/DomainError';

export class PatientBooking {
  public readonly id: string;
  public readonly code: string;
  public readonly patientId: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly passportHash: string;
  public readonly country: string;
  public readonly language: string;
  public readonly phone: string;
  public readonly email: string;
  public readonly companionNames: string[];
  public readonly paxCount: number;
  public readonly arrivalDate: string; // ISO-8601 UTC
  public readonly departureDate: string; // ISO-8601 UTC
  public readonly arrivalAirline: string;
  public readonly arrivalFlight: string;
  public readonly hotelId: string;
  public readonly hotelName: string;
  public readonly status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  public readonly notes: string;

  constructor(params: {
    id: string;
    code: string;
    patientId: string;
    firstName: string;
    lastName: string;
    passportHash: string;
    country: string;
    language: string;
    phone: string;
    email: string;
    companionNames?: string[];
    paxCount: number;
    arrivalDate: string;
    departureDate: string;
    arrivalAirline: string;
    arrivalFlight: string;
    hotelId: string;
    hotelName: string;
    status?: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
    notes?: string;
  }) {
    if (!params.id || !params.code) {
      throw new InvalidBookingError('Booking must have valid id and code');
    }
    if (params.paxCount <= 0 || params.paxCount > 20) {
      throw new InvalidBookingError(`paxCount must be between 1 and 20. Received: ${params.paxCount}`);
    }
    if (new Date(params.departureDate) < new Date(params.arrivalDate)) {
      throw new InvalidBookingError(`Departure date (${params.departureDate}) cannot precede arrival date (${params.arrivalDate})`);
    }

    this.id = params.id;
    this.code = params.code;
    this.patientId = params.patientId;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.passportHash = params.passportHash;
    this.country = params.country;
    this.language = params.language;
    this.phone = params.phone;
    this.email = params.email;
    this.companionNames = params.companionNames || [];
    this.paxCount = params.paxCount;
    this.arrivalDate = params.arrivalDate;
    this.departureDate = params.departureDate;
    this.arrivalAirline = params.arrivalAirline;
    this.arrivalFlight = params.arrivalFlight;
    this.hotelId = params.hotelId;
    this.hotelName = params.hotelName;
    this.status = params.status || 'PROGRAMADO';
    this.notes = params.notes || '';
    Object.freeze(this);
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  public get totalTravelers(): number {
    return 1 + this.companionNames.length;
  }
}
```

---

### 6.2 `ItineraryEvent.ts`
**File**: `apps/medicaltrip_react_app/src/domain/entities/ItineraryEvent.ts`

```typescript
import { Money } from '../value-objects/Money';
import { OperativeTerritory, GeoCoordinates } from '../value-objects/OperativeTerritory';
import { EventCategoryType } from '../value-objects/EventCategory';
import { EventStatus, EventStatusType } from '../value-objects/EventStatus';
import { InvariantViolationError } from '../errors/DomainError';

export type FinancialExpenseType = 'OUT_OF_POCKET' | 'GUIDE_FEE' | 'FLEET_TAXI' | 'COMMERCIAL_COMMISSION' | 'NONE';

export class ItineraryEvent {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly dayNumber: number;
  public readonly title: string;
  public readonly category: EventCategoryType;
  public readonly startDateTime: string; // ISO-8601 UTC
  public readonly endDateTime: string;   // ISO-8601 UTC
  public readonly location: OperativeTerritory;
  public readonly coordinates?: GeoCoordinates;
  public readonly providerId?: string;
  public readonly providerName?: string;
  public readonly assignedDriverId?: string;
  public readonly assignedGuideId?: string;
  public readonly assignedNurseId?: string;
  public readonly financialType: FinancialExpenseType;
  public readonly cost: Money;
  public readonly guideHours?: number;
  public readonly status: EventStatusType;
  public readonly requiresGpsCheckIn: boolean;
  public readonly requiresSignature: boolean;
  public readonly requiresReceipt: boolean;
  public readonly gpsChecked: boolean;
  public readonly signatureUuid?: string;
  public readonly receiptUuid?: string;
  public readonly notes: string;

  constructor(params: {
    id: string;
    bookingId: string;
    dayNumber: number;
    title: string;
    category: EventCategoryType;
    startDateTime: string;
    endDateTime: string;
    location: OperativeTerritory;
    coordinates?: GeoCoordinates;
    providerId?: string;
    providerName?: string;
    assignedDriverId?: string;
    assignedGuideId?: string;
    assignedNurseId?: string;
    financialType?: FinancialExpenseType;
    cost?: Money;
    guideHours?: number;
    status?: EventStatusType;
    requiresGpsCheckIn?: boolean;
    requiresSignature?: boolean;
    requiresReceipt?: boolean;
    gpsChecked?: boolean;
    signatureUuid?: string;
    receiptUuid?: string;
    notes?: string;
  }) {
    if (new Date(params.endDateTime) < new Date(params.startDateTime)) {
      throw new InvariantViolationError(`Event end time (${params.endDateTime}) cannot precede start time (${params.startDateTime})`);
    }

    this.id = params.id;
    this.bookingId = params.bookingId;
    this.dayNumber = params.dayNumber;
    this.title = params.title.trim();
    this.category = params.category;
    this.startDateTime = params.startDateTime;
    this.endDateTime = params.endDateTime;
    this.location = params.location;
    this.coordinates = params.coordinates || params.location.coordinates;
    this.providerId = params.providerId;
    this.providerName = params.providerName;
    this.assignedDriverId = params.assignedDriverId;
    this.assignedGuideId = params.assignedGuideId;
    this.assignedNurseId = params.assignedNurseId;
    this.financialType = params.financialType || 'NONE';
    this.cost = params.cost || Money.zero();
    this.guideHours = params.guideHours;
    this.status = params.status || 'PROGRAMADO';
    this.requiresGpsCheckIn = params.requiresGpsCheckIn || false;
    this.requiresSignature = params.requiresSignature || false;
    this.requiresReceipt = params.requiresReceipt || false;
    this.gpsChecked = params.gpsChecked || false;
    this.signatureUuid = params.signatureUuid;
    this.receiptUuid = params.receiptUuid;
    this.notes = params.notes || '';
    Object.freeze(this);
  }

  public get durationMinutes(): number {
    const diffMs = new Date(this.endDateTime).getTime() - new Date(this.startDateTime).getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  }

  public reschedule(newStartDateTime: string, newEndDateTime: string): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      startDateTime: newStartDateTime,
      endDateTime: newEndDateTime,
    });
  }

  public transitionStatus(nextStatus: EventStatusType): ItineraryEvent {
    EventStatus.assertTransition(this.status, nextStatus);
    return new ItineraryEvent({
      ...this,
      status: nextStatus,
    });
  }

  public checkInGps(): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      gpsChecked: true,
      status: this.status === 'PROGRAMADO' || this.status === 'EN_CAMINO' ? 'EN_SITIO' : this.status,
    });
  }

  public attachReceipt(receiptUuid: string): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      receiptUuid,
    });
  }

  public attachSignature(signatureUuid: string): ItineraryEvent {
    return new ItineraryEvent({
      ...this,
      signatureUuid,
      status: 'COMPLETADO',
    });
  }
}
```

---

### 6.3 `CompanionShift.ts`
**File**: `apps/medicaltrip_react_app/src/domain/entities/CompanionShift.ts`

```typescript
import { Money } from '../value-objects/Money';

export type MealSubsidyTier = 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

export class CompanionShift {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly guideId: string;
  public readonly guideName: string;
  public readonly dayNumber: number;
  public readonly date: string;
  public readonly hoursLogged: number;
  public readonly hourlyRate: Money;
  public readonly prepAllowance: Money;
  public readonly mealSubsidyTier: MealSubsidyTier;
  public readonly mealSubsidyAmount: Money;
  public readonly notes: string;
  public readonly status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';

  // Standard Medical Trip guide rates in COP
  public static readonly DEFAULT_HOURLY_RATE_COP = Money.fromAmount(15500, 'COP');
  public static readonly DEFAULT_PREP_ALLOWANCE_COP = Money.fromAmount(15500, 'COP');

  constructor(params: {
    id: string;
    bookingId: string;
    guideId: string;
    guideName: string;
    dayNumber: number;
    date: string;
    hoursLogged: number;
    hourlyRate?: Money;
    prepAllowance?: Money;
    mealSubsidyTier?: MealSubsidyTier;
    mealSubsidyAmount?: Money;
    notes?: string;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  }) {
    this.id = params.id;
    this.bookingId = params.bookingId;
    this.guideId = params.guideId;
    this.guideName = params.guideName;
    this.dayNumber = params.dayNumber;
    this.date = params.date;
    this.hoursLogged = Math.max(0, params.hoursLogged);
    this.hourlyRate = params.hourlyRate || CompanionShift.DEFAULT_HOURLY_RATE_COP;
    this.prepAllowance = params.prepAllowance || CompanionShift.DEFAULT_PREP_ALLOWANCE_COP;

    const subsidy = params.mealSubsidyTier
      ? { tier: params.mealSubsidyTier, amount: params.mealSubsidyAmount || CompanionShift.resolveMealSubsidyAmount(params.mealSubsidyTier) }
      : CompanionShift.resolveMealSubsidyTier(this.hoursLogged);

    this.mealSubsidyTier = subsidy.tier;
    this.mealSubsidyAmount = subsidy.amount;
    this.notes = params.notes || '';
    this.status = params.status || 'SCHEDULED';
    Object.freeze(this);
  }

  public calculateTotalFee(): Money {
    const hourlySubtotal = this.hourlyRate.multiply(this.hoursLogged);
    return hourlySubtotal.add(this.prepAllowance).add(this.mealSubsidyAmount);
  }

  public static resolveMealSubsidyTier(hours: number): { tier: MealSubsidyTier; amount: Money } {
    if (hours < 3) {
      return { tier: 'TIER_0', amount: Money.zero() };
    } else if (hours < 5) {
      return { tier: 'TIER_1', amount: Money.fromAmount(8000, 'COP') };
    } else if (hours < 8) {
      return { tier: 'TIER_2', amount: Money.fromAmount(25000, 'COP') };
    } else if (hours < 12) {
      return { tier: 'TIER_3', amount: Money.fromAmount(35000, 'COP') };
    } else {
      return { tier: 'TIER_4', amount: Money.fromAmount(45000, 'COP') };
    }
  }

  public static resolveMealSubsidyAmount(tier: MealSubsidyTier): Money {
    switch (tier) {
      case 'TIER_0': return Money.zero();
      case 'TIER_1': return Money.fromAmount(8000, 'COP');
      case 'TIER_2': return Money.fromAmount(25000, 'COP');
      case 'TIER_3': return Money.fromAmount(35000, 'COP');
      case 'TIER_4': return Money.fromAmount(45000, 'COP');
    }
  }
}
```

---

### 6.4 `DriverTransfer.ts`
**File**: `apps/medicaltrip_react_app/src/domain/entities/DriverTransfer.ts`

```typescript
import { Money } from '../value-objects/Money';
import { OperativeTerritory } from '../value-objects/OperativeTerritory';

export type VehicleClass = 'SEDAN' | 'VAN_XL' | 'DUSTER';
export type RouteClass = 'AIRPORT_ARRIVAL' | 'AIRPORT_DEPARTURE' | 'INTRA_CITY_SHORT' | 'INTRA_CITY_LONG' | 'OUT_OF_TOWN';

export class DriverTransfer {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly driverId: string;
  public readonly driverName: string;
  public readonly vehicleType: VehicleClass;
  public readonly routeType: RouteClass;
  public readonly origin: OperativeTerritory;
  public readonly destination: OperativeTerritory;
  public readonly scheduledTime: string;
  public readonly baseRate: Money;
  public readonly nightSurcharge: Money;
  public readonly waitingTimeFee: Money;
  public readonly parkingFee: Money;
  public readonly status: 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

  constructor(params: {
    id: string;
    bookingId: string;
    driverId: string;
    driverName: string;
    vehicleType?: VehicleClass;
    routeType: RouteClass;
    origin: OperativeTerritory;
    destination: OperativeTerritory;
    scheduledTime: string;
    baseRate: Money;
    nightSurcharge?: Money;
    waitingTimeFee?: Money;
    parkingFee?: Money;
    status?: 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  }) {
    this.id = params.id;
    this.bookingId = params.bookingId;
    this.driverId = params.driverId;
    this.driverName = params.driverName;
    this.vehicleType = params.vehicleType || 'SEDAN';
    this.routeType = params.routeType;
    this.origin = params.origin;
    this.destination = params.destination;
    this.scheduledTime = params.scheduledTime;
    this.baseRate = params.baseRate;
    this.nightSurcharge = params.nightSurcharge || Money.zero();
    this.waitingTimeFee = params.waitingTimeFee || Money.zero();
    this.parkingFee = params.parkingFee || Money.zero();
    this.status = params.status || 'CONFIRMED';
    Object.freeze(this);
  }

  public calculateTotalCost(): Money {
    return this.baseRate
      .add(this.nightSurcharge)
      .add(this.waitingTimeFee)
      .add(this.parkingFee);
  }
}
```

---

### 6.5 `ReceiptExpense.ts`
**File**: `apps/medicaltrip_react_app/src/domain/entities/ReceiptExpense.ts`

```typescript
import { Money } from '../value-objects/Money';

export type ExpenseCategory =
  | 'PHARMACY'
  | 'MEDICAL_LAB'
  | 'PARKING'
  | 'MEAL_SUBSIDY'
  | 'SIM_CARD'
  | 'TOLL'
  | 'OTHER';

export class ReceiptExpense {
  public readonly id: string;
  public readonly bookingId: string;
  public readonly eventId?: string;
  public readonly category: ExpenseCategory;
  public readonly description: string;
  public readonly amount: Money;
  public readonly vendorName?: string;
  public readonly vendorTaxId?: string;
  public readonly receiptBlobUuid?: string;
  public readonly date: string;
  public readonly audited: boolean;
  public readonly status: 'PENDING' | 'APPROVED' | 'REJECTED';

  constructor(params: {
    id: string;
    bookingId: string;
    eventId?: string;
    category: ExpenseCategory;
    description: string;
    amount: Money;
    vendorName?: string;
    vendorTaxId?: string;
    receiptBlobUuid?: string;
    date: string;
    audited?: boolean;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }) {
    this.id = params.id;
    this.bookingId = params.bookingId;
    this.eventId = params.eventId;
    this.category = params.category;
    this.description = params.description.trim();
    this.amount = params.amount;
    this.vendorName = params.vendorName;
    this.vendorTaxId = params.vendorTaxId;
    this.receiptBlobUuid = params.receiptBlobUuid;
    this.date = params.date;
    this.audited = params.audited || false;
    this.status = params.status || 'APPROVED';
    Object.freeze(this);
  }

  public markAudited(): ReceiptExpense {
    return new ReceiptExpense({
      ...this,
      audited: true,
    });
  }
}
```

---

### 6.6 `SettlementLedger.ts` (Deterministic Aggregate Root)
**File**: `apps/medicaltrip_react_app/src/domain/entities/SettlementLedger.ts`

```typescript
import { Money } from '../value-objects/Money';
import { ReceiptExpense } from './ReceiptExpense';
import { CompanionShift } from './CompanionShift';
import { DriverTransfer } from './DriverTransfer';

export interface CashAdvance {
  readonly id: string;
  readonly date: string;
  readonly amount: Money;
  readonly description: string;
}

export class SettlementLedger {
  public readonly bookingId: string;
  public readonly totalExpenses: Money;
  public readonly totalGuideFees: Money;
  public readonly totalFleetTaxis: Money;
  public readonly totalAdvances: Money;
  public readonly netBalance: Money;
  public readonly advances: CashAdvance[];
  public readonly lastUpdated: string;
  public readonly sha256Seal?: string;

  private constructor(params: {
    bookingId: string;
    totalExpenses: Money;
    totalGuideFees: Money;
    totalFleetTaxis: Money;
    totalAdvances: Money;
    netBalance: Money;
    advances: CashAdvance[];
    lastUpdated: string;
    sha256Seal?: string;
  }) {
    this.bookingId = params.bookingId;
    this.totalExpenses = params.totalExpenses;
    this.totalGuideFees = params.totalGuideFees;
    this.totalFleetTaxis = params.totalFleetTaxis;
    this.totalAdvances = params.totalAdvances;
    this.netBalance = params.netBalance;
    this.advances = params.advances;
    this.lastUpdated = params.lastUpdated;
    this.sha256Seal = params.sha256Seal;
    Object.freeze(this);
  }

  public static createEmpty(bookingId: string): SettlementLedger {
    return new SettlementLedger({
      bookingId,
      totalExpenses: Money.zero(),
      totalGuideFees: Money.zero(),
      totalFleetTaxis: Money.zero(),
      totalAdvances: Money.zero(),
      netBalance: Money.zero(),
      advances: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  public static calculate(params: {
    bookingId: string;
    expenses: ReceiptExpense[];
    shifts: CompanionShift[];
    transfers: DriverTransfer[];
    advances: CashAdvance[];
    sha256Seal?: string;
  }): SettlementLedger {
    let totalExpenses = Money.zero();
    for (const exp of params.expenses) {
      if (exp.status === 'APPROVED') {
        totalExpenses = totalExpenses.add(exp.amount);
      }
    }

    let totalGuideFees = Money.zero();
    for (const shift of params.shifts) {
      totalGuideFees = totalGuideFees.add(shift.calculateTotalFee());
    }

    let totalFleetTaxis = Money.zero();
    for (const transfer of params.transfers) {
      if (transfer.status !== 'CANCELLED') {
        totalFleetTaxis = totalFleetTaxis.add(transfer.calculateTotalCost());
      }
    }

    let totalAdvances = Money.zero();
    for (const adv of params.advances) {
      totalAdvances = totalAdvances.add(adv.amount);
    }

    // Deterministic Master Formula:
    // Saldo Neto = (Gastos + Honorarios Guía + Flota) - Anticipos
    const totalDebits = totalExpenses.add(totalGuideFees).add(totalFleetTaxis);
    const netBalance = totalDebits.subtract(totalAdvances);

    return new SettlementLedger({
      bookingId: params.bookingId,
      totalExpenses,
      totalGuideFees,
      totalFleetTaxis,
      totalAdvances,
      netBalance,
      advances: params.advances,
      lastUpdated: new Date().toISOString(),
      sha256Seal: params.sha256Seal,
    });
  }

  public isSettled(): boolean {
    return this.netBalance.isZero();
  }

  public isPatientCredit(): boolean {
    return this.netBalance.isNegative(); // Medical Trip owes refund to patient
  }

  public isPatientDebt(): boolean {
    return this.netBalance.isPositive(); // Patient owes additional funds
  }
}
```

---

## 🔌 7. Domain Layer: Abstract Ports

### 7.1 `IStoragePort.ts`
**File**: `apps/medicaltrip_react_app/src/domain/ports/IStoragePort.ts`

```typescript
import { PatientBooking } from '../entities/PatientBooking';
import { ItineraryEvent } from '../entities/ItineraryEvent';
import { CompanionShift } from '../entities/CompanionShift';
import { DriverTransfer } from '../entities/DriverTransfer';
import { ReceiptExpense } from '../entities/ReceiptExpense';
import { SettlementLedger } from '../entities/SettlementLedger';

export interface DomainEventRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly type: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

export interface IStoragePort {
  // Bookings
  saveBooking(booking: PatientBooking): Promise<void>;
  getBooking(bookingId: string): Promise<PatientBooking | null>;
  getAllBookings(): Promise<PatientBooking[]>;

  // Events
  saveEvent(event: ItineraryEvent): Promise<void>;
  getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]>;
  getEventById(eventId: string): Promise<ItineraryEvent | null>;
  deleteEvent(eventId: string): Promise<void>;

  // Shifts & Logistics
  saveShift(shift: CompanionShift): Promise<void>;
  getShiftsByBooking(bookingId: string): Promise<CompanionShift[]>;
  saveTransfer(transfer: DriverTransfer): Promise<void>;
  getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]>;

  // Expenses & Settlements
  saveExpense(expense: ReceiptExpense): Promise<void>;
  getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]>;
  saveSettlement(settlement: SettlementLedger): Promise<void>;
  getSettlement(bookingId: string): Promise<SettlementLedger | null>;

  // Single-Writer CQRS Event Stream
  appendEventLog(entry: DomainEventRecord): Promise<void>;
  getEventStream(bookingId: string): Promise<DomainEventRecord[]>;

  // Maintenance
  clearAll(): Promise<void>;
}
```

---

### 7.2 `IBlobStoragePort.ts`
**File**: `apps/medicaltrip_react_app/src/domain/ports/IBlobStoragePort.ts`

```typescript
export interface BlobMetadata {
  readonly id: string;
  readonly bookingId: string;
  readonly mimeType: string;
  readonly category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF';
  readonly createdAt: string;
}

export interface IBlobStoragePort {
  saveBlob(id: string, bookingId: string, mimeType: string, category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF', data: Blob | ArrayBuffer | string): Promise<string>;
  getBlob(id: string): Promise<Blob | null>;
  getBlobDataUrl(id: string): Promise<string | null>;
  deleteBlob(id: string): Promise<void>;
}
```

---

### 7.3 `IActorEventBusPort.ts`
**File**: `apps/medicaltrip_react_app/src/domain/ports/IActorEventBusPort.ts`

```typescript
export type ActorRole = 'MAIN_UI' | 'DRV_ACTOR' | 'GUIA_ACTOR' | 'NURSE_ACTOR' | 'FIN_ACTOR' | 'BROADCAST';

export interface ActorMessage<T = unknown> {
  readonly id: string;
  readonly sender: ActorRole;
  readonly recipient: ActorRole;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
}

export interface IActorEventBusPort {
  publish<T>(message: ActorMessage<T>): Promise<void>;
  subscribe<T>(recipient: ActorRole, messageType: string, handler: (message: ActorMessage<T>) => void): () => void;
  broadcast<T>(type: string, payload: T): Promise<void>;
}
```

---

### 7.4 `IOCRPort.ts`
**File**: `apps/medicaltrip_react_app/src/domain/ports/IOCRPort.ts`

```typescript
import { Money } from '../value-objects/Money';

export interface OCRParsedItem {
  readonly description: string;
  readonly amount: Money;
  readonly quantity?: number;
}

export interface OCRResult {
  readonly vendorName?: string;
  readonly vendorTaxId?: string;
  readonly totalAmount: Money;
  readonly date?: string;
  readonly items: OCRParsedItem[];
  readonly rawText: string;
  readonly confidence: number;
}

export interface IOCRPort {
  recognizeReceipt(imageBlobOrDataUrl: Blob | string): Promise<OCRResult>;
}
```

---

### 7.5 `IExportPort.ts`
**File**: `apps/medicaltrip_react_app/src/domain/ports/IExportPort.ts`

```typescript
import { PatientBooking } from '../entities/PatientBooking';
import { SettlementLedger } from '../entities/SettlementLedger';
import { ItineraryEvent } from '../entities/ItineraryEvent';

export interface IExportPort {
  exportSettlementPdf(booking: PatientBooking, ledger: SettlementLedger, events: ItineraryEvent[]): Promise<Blob>;
  exportLedgerJson(ledger: SettlementLedger): Promise<string>;
}
```

---

### 7.6 `IStoragePersistPort.ts`
**File**: `apps/medicaltrip_react_app/src/domain/ports/IStoragePersistPort.ts`

```typescript
export interface StorageEstimate {
  readonly quotaBytes?: number;
  readonly usageBytes?: number;
  readonly percentageUsed?: number;
}

export interface IStoragePersistPort {
  requestPersistence(): Promise<boolean>;
  isPersisted(): Promise<boolean>;
  getStorageEstimate(): Promise<StorageEstimate>;
  touchHeartbeat(): Promise<void>;
}
```

---

### 7.7 `src/domain/index.ts` (Domain Barrel Export)
**File**: `apps/medicaltrip_react_app/src/domain/index.ts`

```typescript
// Errors
export * from './errors/DomainError';
export * from './errors/NonOperativeTerritoryError';

// Value Objects
export * from './value-objects/Money';
export * from './value-objects/OperativeTerritory';
export * from './value-objects/EventCategory';
export * from './value-objects/EventStatus';

// Entities & Aggregates
export * from './entities/PatientBooking';
export * from './entities/ItineraryEvent';
export * from './entities/CompanionShift';
export * from './entities/DriverTransfer';
export * from './entities/ReceiptExpense';
export * from './entities/SettlementLedger';

// Ports
export * from './ports/IStoragePort';
export * from './ports/IBlobStoragePort';
export * from './ports/IActorEventBusPort';
export * from './ports/IOCRPort';
export * from './ports/IExportPort';
export * from './ports/IStoragePersistPort';
```

---

## 🧪 8. Milestone 1 Unit Tests Blueprint

### 8.1 `Money.test.ts`
**File**: `apps/medicaltrip_react_app/tests/domain/Money.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Money } from '../../src/domain/value-objects/Money';
import { CurrencyMismatchError, InvalidMoneyAmountError } from '../../src/domain/errors/DomainError';

describe('Money Value Object (BigInt Integer Cents)', () => {
  it('should create Money from integer cents', () => {
    const money = Money.fromCents(1550000n, 'COP');
    expect(money.cents).toBe(1550000n);
    expect(money.currency).toBe('COP');
    expect(money.toAmountNumber()).toBe(15500);
  });

  it('should parse floating amounts into exact integer cents with half-up rounding', () => {
    const money = Money.fromAmount(15.555, 'USD');
    expect(money.cents).toBe(1556n);
    expect(money.format()).toBe('$15.56');
  });

  it('should eliminate IEEE-754 floating point drift', () => {
    const m1 = Money.fromAmount(0.1, 'USD');
    const m2 = Money.fromAmount(0.2, 'USD');
    const sum = m1.add(m2);
    expect(sum.cents).toBe(30n);
    expect(sum.toAmountNumber()).toBe(0.3);
  });

  it('should execute exact subtraction and multiplications', () => {
    const base = Money.fromAmount(15500, 'COP');
    const multiplied = base.multiply(3.5);
    expect(multiplied.cents).toBe(5425000n);
    expect(multiplied.toAmountNumber()).toBe(54250);
  });

  it('should partition split parts with zero penny loss remainder distribution', () => {
    const total = Money.fromCents(100n, 'USD'); // $1.00
    const parts = total.split(3);
    expect(parts.length).toBe(3);
    expect(parts[0].cents).toBe(34n);
    expect(parts[1].cents).toBe(33n);
    expect(parts[2].cents).toBe(33n);

    const reSum = parts.reduce((acc, curr) => acc.add(curr), Money.zero('USD'));
    expect(reSum.cents).toBe(100n);
  });

  it('should throw CurrencyMismatchError when adding COP and USD', () => {
    const cop = Money.fromAmount(10000, 'COP');
    const usd = Money.fromAmount(10, 'USD');
    expect(() => cop.add(usd)).toThrow(CurrencyMismatchError);
  });

  it('should throw InvalidMoneyAmountError for invalid inputs', () => {
    expect(() => Money.fromAmount('invalid', 'COP')).toThrow(InvalidMoneyAmountError);
  });
});
```

---

### 8.2 `OperativeTerritory.test.ts`
**File**: `apps/medicaltrip_react_app/tests/domain/OperativeTerritory.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { OperativeTerritory } from '../../src/domain/value-objects/OperativeTerritory';
import { NonOperativeTerritoryError } from '../../src/domain/errors/NonOperativeTerritoryError';

describe('OperativeTerritory Fail-Fast Invariant', () => {
  it('should successfully resolve authorized clinics and hotels in Medellín and Rionegro', () => {
    const t1 = OperativeTerritory.fromString('Clínica Clofán Ciudad del Río');
    expect(t1.zone).toBe('CIUDAD_DEL_RIO');

    const t2 = OperativeTerritory.fromString('Hotel Inntu Laureles Transversal 39');
    expect(t2.zone).toBe('LAURELES');

    const t3 = OperativeTerritory.fromString('Hospital Pablo Tobón Uribe Robledo');
    expect(t3.zone).toBe('ROBLEDO');

    const t4 = OperativeTerritory.fromString('Aeropuerto JMC Rionegro');
    expect(t4.zone).toBe('RIONEGRO_AEROPUERTO');
  });

  it('should fail-fast on prohibited zone MOCOA (Putumayo)', () => {
    expect(() => OperativeTerritory.fromString('Consultorio Mocoa Putumayo')).toThrow(NonOperativeTerritoryError);
    expect(() => OperativeTerritory.fromString('Mocoa Duván Medical')).toThrow(NonOperativeTerritoryError);
  });

  it('should fail-fast on prohibited zone LETICIA / AMAZONAS', () => {
    expect(() => OperativeTerritory.fromString('Hospital Regional de Leticia Amazonas')).toThrow(NonOperativeTerritoryError);
  });

  it('should fail-fast on prohibited zone TUMACO / NARIÑO', () => {
    expect(() => OperativeTerritory.fromString('Centro de Salud Tumaco')).toThrow(NonOperativeTerritoryError);
  });

  it('should fail-fast on empty or completely unrecognized non-operative location', () => {
    expect(() => OperativeTerritory.fromString('')).toThrow(NonOperativeTerritoryError);
    expect(() => OperativeTerritory.fromString('Desierto de la Tatacoa')).toThrow(NonOperativeTerritoryError);
  });
});
```

---

### 8.3 `SettlementLedger.test.ts`
**File**: `apps/medicaltrip_react_app/tests/domain/SettlementLedger.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { SettlementLedger } from '../../src/domain/entities/SettlementLedger';
import { Money } from '../../src/domain/value-objects/Money';
import { ReceiptExpense } from '../../src/domain/entities/ReceiptExpense';
import { CompanionShift } from '../../src/domain/entities/CompanionShift';
import { DriverTransfer } from '../../src/domain/entities/DriverTransfer';
import { OperativeTerritory } from '../../src/domain/value-objects/OperativeTerritory';

describe('SettlementLedger Deterministic Arithmetic', () => {
  it('should calculate exact net balance: (Expenses + Guides + Transfers) - Advances', () => {
    const origin = OperativeTerritory.fromString('Aeropuerto JMC');
    const dest = OperativeTerritory.fromString('Hotel Inntu Laureles');

    // 1. Advance: $1.000.000 COP
    const advances = [{
      id: 'adv-1',
      date: '2026-08-20T10:00:00Z',
      amount: Money.fromAmount(1000000, 'COP'),
      description: 'Anticipo inicial'
    }];

    // 2. Transfer: $160.000 COP
    const transfer = new DriverTransfer({
      id: 'trf-1',
      bookingId: 'RVA171',
      driverId: 'DRV-01',
      driverName: 'Ramón Rosero',
      routeType: 'AIRPORT_ARRIVAL',
      origin,
      destination: dest,
      scheduledTime: '2026-08-20T10:00:00Z',
      baseRate: Money.fromAmount(160000, 'COP'),
    });

    // 3. Shift: 4 hours = (4 * 15.5k) + 15.5k prep + 8k Tier 1 meal = 62k + 15.5k + 8k = 85.5k COP
    const shift = new CompanionShift({
      id: 'shf-1',
      bookingId: 'RVA171',
      guideId: 'GUIA-01',
      guideName: 'Yenny Roberto',
      dayNumber: 1,
      date: '2026-08-20',
      hoursLogged: 4,
    });

    // 4. Pharmacy expense: $85.000 COP
    const expense = new ReceiptExpense({
      id: 'exp-1',
      bookingId: 'RVA171',
      category: 'PHARMACY',
      description: 'Gotas oftálmicas Cruz Verde',
      amount: Money.fromAmount(85000, 'COP'),
      date: '2026-08-20T15:00:00Z',
    });

    const ledger = SettlementLedger.calculate({
      bookingId: 'RVA171',
      expenses: [expense],
      shifts: [shift],
      transfers: [transfer],
      advances,
    });

    // Total Debits: 85.000 + 85.500 + 160.000 = 330.500 COP
    // Advances: 1.000.000 COP
    // Net Balance: 330.500 - 1.000.000 = -669.500 COP (Patient Credit Balance)
    expect(ledger.totalExpenses.toAmountNumber()).toBe(85000);
    expect(ledger.totalGuideFees.toAmountNumber()).toBe(85500);
    expect(ledger.totalFleetTaxis.toAmountNumber()).toBe(160000);
    expect(ledger.totalAdvances.toAmountNumber()).toBe(1000000);
    expect(ledger.netBalance.toAmountNumber()).toBe(-669500);
    expect(ledger.isPatientCredit()).toBe(true);
  });
});
```

---

## 🚀 9. Step-by-Step Implementation Instructions for Implementer Agent

1. **Scaffold Directory Structure**:
   Create directory `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app` with its internal folders (`public/`, `src/domain/errors/`, `src/domain/value-objects/`, `src/domain/entities/`, `src/domain/ports/`, `tests/domain/`).

2. **Deploy Toolchain & Config Files**:
   - Write `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`.
   - Write `public/manifest.json` and `public/sw.js`.
   - Write `src/index.css`.

3. **Deploy Domain Errors & Value Objects**:
   - Write `src/domain/errors/DomainError.ts`.
   - Write `src/domain/errors/NonOperativeTerritoryError.ts`.
   - Write `src/domain/value-objects/Money.ts`.
   - Write `src/domain/value-objects/OperativeTerritory.ts`.
   - Write `src/domain/value-objects/EventCategory.ts`.
   - Write `src/domain/value-objects/EventStatus.ts`.

4. **Deploy Domain Entities**:
   - Write `src/domain/entities/PatientBooking.ts`.
   - Write `src/domain/entities/ItineraryEvent.ts`.
   - Write `src/domain/entities/CompanionShift.ts`.
   - Write `src/domain/entities/DriverTransfer.ts`.
   - Write `src/domain/entities/ReceiptExpense.ts`.
   - Write `src/domain/entities/SettlementLedger.ts`.

5. **Deploy Domain Ports & Barrel Export**:
   - Write `src/domain/ports/IStoragePort.ts`.
   - Write `src/domain/ports/IBlobStoragePort.ts`.
   - Write `src/domain/ports/IActorEventBusPort.ts`.
   - Write `src/domain/ports/IOCRPort.ts`.
   - Write `src/domain/ports/IExportPort.ts`.
   - Write `src/domain/ports/IStoragePersistPort.ts`.
   - Write `src/domain/index.ts`.

6. **Deploy Unit Tests & Verify**:
   - Write `tests/domain/Money.test.ts`.
   - Write `tests/domain/OperativeTerritory.test.ts`.
   - Write `tests/domain/SettlementLedger.test.ts`.
   - Run `npm install` (or verify package lock), `npm run typecheck`, and `npx vitest run tests/domain`.
   - Verify 0 type errors and 100% test pass rate.
