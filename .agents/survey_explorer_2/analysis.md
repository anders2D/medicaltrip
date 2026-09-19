# 🏗️ Architectural Blueprint: Standalone Local-First Offline PWA
## Sistema Autónomo de Gestión de Itinerarios Médicos en Terreno y Liquidación Financiera Automática
### Medical Trip Colombia S.A.S. — `apps/itinerarios_liquidacion_offline`

---

- **Arquitecto / Autor**: `survey_explorer_2` (Offline Architecture & Actor Concurrency)
- **Fecha**: 2026-08-23
- **Estado**: Aprobado para Implementación (Phase 1)
- **Ubicación del Módulo**: `apps/itinerarios_liquidacion_offline`
- **Garantías Clave**: 100% Offline, Cero Errores IEEE 754 (BigInt Integer-Cents), Arquitectura Hexagonal Pura (0 Frameworks en Dominio), Modelo de Actores Descentralizado en Web Workers (60 FPS UI Thread).

---

## 1. 🌟 Resumen Ejecutivo y Visión Arquitectural

El presente documento define la especificación técnica completa y el diseño arquitectónico de nivel de producción para la aplicación web progresiva independiente (**Standalone Local-First Offline PWA**) de Medical Trip Colombia S.A.S., alojada en `apps/itinerarios_liquidacion_offline`.

La aplicación está diseñada para operar en condiciones de terreno extremo en Colombia (clínicas de alta complejidad, aeropuertos internacionales, vehículos en tránsito en cañones urbanos o zonas de sombra celular en el Oriente Antioqueño), garantizando una disponibilidad operativa del **100% sin conexión a Internet**.

```
+----------------------------------------------------------------------------------------------------+
|                                     LOCAL-FIRST STANDALONE PWA                                     |
|                                                                                                    |
|   +--------------------------+       MessageChannel       +------------------------------------+   |
|   |   Main Thread UI (60fps) | <========================> | Actor Worker Pool (Web Workers)    |   |
|   |  - Master-Detail Split   |                            |  - [DRV] Ramón Rosero (Transit)    |   |
|   |  - GPS Check-in Canvas   |                            |  - [GUIA] Yenny (Shifts & Trans)   |   |
|   |  - Signature & OCR Modal |                            |  - [NURSE] Anita (Vitals & Meds)   |   |
|   |  - Real-time Balance Bar |                            |  - [FIN] Jenny (Single-Writer CQRS)|   |
|   +--------------------------+                            +------------------------------------+   |
|                 |                                                           |                      |
|                 v                                                           v                      |
|   +--------------------------------------------------------------------------------------------+   |
|   |                             HEXAGONAL APPLICATION & DOMAIN CORE                            |   |
|   |   Entities (ItineraryItem, SettlementLedger, ActorEvent) | Value Objects (Money, Territory)|   |
|   +--------------------------------------------------------------------------------------------+   |
|                                               |                                                    |
|                                               v                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   |                             MULTI-TIER LOCAL PERSISTENCE SUBSYSTEM                         |   |
|   |  [Tier 1: SQLite OPFS / wa-sqlite] <---> [Tier 2: Dexie.js IDB Blobs] <---> [Tier 3: SW & |   |
|   |  Relational DB & CQRS Events             Receipts, Signatures, PDFs         StoragePersist]|   |
|   +--------------------------------------------------------------------------------------------+   |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. 🏛️ Arquitectura Hexagonal (Ports & Adapters) y Domain-Driven Design (DDD)

### 2.1 Aislamiento Radical del Dominio (Pure TypeScript Core)

El núcleo de dominio (`domain/`) tiene **cero dependencias de infraestructura o librerías de terceros** (sin imports de React, Vue, Dexie, SQLite, Node, o DOM). Todo el estado se manipula a través de funciones puras, entidades inmutables y Value Objects que validan invariantes de negocio de forma fail-fast.

```
apps/itinerarios_liquidacion_offline/src/
├── domain/                         # Pure TypeScript (Zero Framework Dependencies)
│   ├── entities/                   # Aggregate Roots & Pure Entities
│   │   ├── ItineraryItem.ts        # Hito operativo de terreno
│   │   ├── SettlementLedger.ts     # Libro mayor de liquidación financiera
│   │   ├── DigitalSignature.ts     # Firma digital del paciente
│   │   ├── ReceiptExpense.ts       # Gasto / Comprobante de caja menor
│   │   └── ActorEntity.ts          # Perfil de agente operativo
│   ├── value-objects/              # Immutable Self-Validating Value Objects
│   │   ├── Money.ts                # BigInt en centavos enteros (0 Float Errors)
│   │   ├── OperativeTerritory.ts   # Fail-fast geocercas autorizadas vs Mocoa
│   │   ├── ActorEvent.ts           # Evento inmutable de actor
│   │   ├── GeoCoordinates.ts       # Coordenadas GPS y cálculo de distancia
│   │   ├── TimeSlot.ts             # Ventana horaria ISO-8601 América/Bogotá
│   │   └── TariffRate.ts           # Tarifas de acompañamiento y transporte
│   ├── events/                     # Domain Events
│   │   ├── ItineraryStatusChanged.ts
│   │   ├── ActorCheckInEmitted.ts
│   │   ├── ReceiptAttached.ts
│   │   └── LedgerEventAppended.ts
│   └── errors/                     # Typed Domain Invariant Errors
│       ├── NonOperativeTerritoryError.ts
│       ├── IncompatibleCurrencyError.ts
│       ├── InvalidStatusTransitionError.ts
│       └── LedgerImbalanceError.ts
├── ports/                          # Abstract TypeScript Interfaces (Hexagonal Ports)
│   ├── StoragePort.ts              # Persistencia estructurada y CQRS
│   ├── BlobStoragePort.ts          # Persistencia binaria de imágenes/PDFs
│   ├── ActorEventBusPort.ts        # Bus de mensajería inter-actor
│   ├── GeolocationPort.ts          # Captura y validación de GPS
│   ├── OCRPort.ts                  # Procesamiento de recibos
│   ├── SignaturePort.ts            # Captura de trazos vectoriales
│   └── ClockPort.ts                # Generador temporal determinista
└── application/                    # Use Cases & Orchestrators
    ├── usecases/
    │   ├── CreateItineraryItemUseCase.ts
    │   ├── TransitionItineraryStatusUseCase.ts
    │   ├── RecordActorCheckInUseCase.ts
    │   ├── SubmitReceiptExpenseUseCase.ts
    │   ├── SettleLedgerBalanceUseCase.ts
    │   └── GenerateAuditBalanceSheetUseCase.ts
    └── dtos/                       # Data Transfer Objects
```

---

### 2.2 Value Objects Principales

#### A. `Money` (BigInt Integer-Cents & Exact Fractional Arithmetic)
Elimina al 100% las aberraciones de redondeo de punto flotante de JavaScript (`0.1 + 0.2 !== 0.3`). Todos los montos se almacenan como `bigint` en centavos enteros.

```typescript
// domain/value-objects/Money.ts
export type CurrencyCode = 'COP' | 'USD';

export class Money {
  private readonly _cents: bigint;
  private readonly _currency: CurrencyCode;

  private constructor(cents: bigint, currency: CurrencyCode) {
    this._cents = cents;
    this._currency = currency;
    Object.freeze(this);
  }

  public static fromCents(cents: bigint | number, currency: CurrencyCode = 'COP'): Money {
    const safeCents = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(cents));
    return new Money(safeCents, currency);
  }

  public static fromUnits(units: number, currency: CurrencyCode = 'COP'): Money {
    // Escala x100 para centavos enteros exactos
    const cents = BigInt(Math.round(units * 100));
    return new Money(cents, currency);
  }

  public static zero(currency: CurrencyCode = 'COP'): Money {
    return new Money(0n, currency);
  }

  public get cents(): bigint {
    return this._cents;
  }

  public get units(): number {
    return Number(this._cents) / 100;
  }

  public get currency(): CurrencyCode {
    return this._currency;
  }

  public add(other: Money): Money {
    this.assertCompatibleCurrency(other);
    return new Money(this._cents + other.cents, this._currency);
  }

  public subtract(other: Money): Money {
    this.assertCompatibleCurrency(other);
    return new Money(this._cents - other.cents, this._currency);
  }

  public multiply(factor: number | bigint): Money {
    if (typeof factor === 'bigint') {
      return new Money(this._cents * factor, this._currency);
    }
    // Escalamiento con base 10,000 para precisión de 4 decimales
    const scale = 10000n;
    const scaledFactor = BigInt(Math.round(factor * 10000));
    const newCents = (this._cents * scaledFactor) / scale;
    return new Money(newCents, this._currency);
  }

  public split(parts: number): Money[] {
    if (parts <= 0) throw new Error('Parts must be positive integer');
    const n = BigInt(parts);
    const quotient = this._cents / n;
    const remainder = this._cents % n;
    const result: Money[] = [];

    for (let i = 0; i < parts; i++) {
      // Distribuye los centavos de residuo de forma equitativa
      const extra = BigInt(i) < remainder ? 1n : 0n;
      result.push(new Money(quotient + extra, this._currency));
    }
    return result;
  }

  public convert(trmRateInUnits: number, targetCurrency: CurrencyCode): Money {
    if (this._currency === targetCurrency) return this;
    if (this._currency === 'USD' && targetCurrency === 'COP') {
      // USD -> COP: USD cents * TRM units
      const copCents = this._cents * BigInt(Math.round(trmRateInUnits));
      return new Money(copCents, 'COP');
    }
    if (this._currency === 'COP' && targetCurrency === 'USD') {
      // COP -> USD: COP cents / TRM units
      const trmScaled = BigInt(Math.round(trmRateInUnits * 100));
      const usdCents = (this._cents * 100n) / trmScaled;
      return new Money(usdCents, 'USD');
    }
    throw new Error(`Unsupported conversion: ${this._currency} to ${targetCurrency}`);
  }

  public isPositive(): boolean { return this._cents > 0n; }
  public isZero(): boolean { return this._cents === 0n; }
  public isNegative(): boolean { return this._cents < 0n; }

  public format(): string {
    const val = this.units;
    if (this._currency === 'COP') {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }).format(val);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val);
  }

  private assertCompatibleCurrency(other: Money): void {
    if (this._currency !== other.currency) {
      throw new Error(`Incompatible currency operation: ${this._currency} vs ${other.currency}`);
    }
  }
}
```

---

#### B. `OperativeTerritory` (Fail-Fast Geospatial Boundaries)
Garantiza que la operación se restrinja estrictamente al corredor autorizado de Medical Trip Colombia S.A.S. e interrumpe de inmediato cualquier intento de programar hitos en ubicaciones prohibidas o fuera de corredor (ej. Mocoa, Leticia, Arauca).

```typescript
// domain/value-objects/OperativeTerritory.ts
import { NonOperativeTerritoryError } from '../errors/NonOperativeTerritoryError';

export class OperativeTerritory {
  public static readonly ALLOWED_CORRIDORS = [
    'MEDELLIN', 'POBLADO', 'LAURELES', 'ROBLEDO', 'CIUDAD_DEL_RIO',
    'ENVIGADO', 'SABANETA', 'BELLO', 'ITAGUI', 'ESTADIO', 'CENTRO',
    'RIONEGRO', 'AEROPUERTO_JMC', 'GUARNE', 'MARINILLA', 'LA_CEJA',
    'EL_RETIRO', 'GUATAPE', 'SANTA_FE_DE_ANTIOQUIA', 'BOGOTA', 'AEROPUERTO_BOG'
  ] as const;

  public static readonly FORBIDDEN_ZONES = [
    'MOCOA', 'LETICIA', 'PUERTO_ASIS', 'ARAUCA', 'TUMACO',
    'MITU', 'SAN_JOSE_DEL_GUAVIARE', 'INIRIDA', 'AMAZONAS', 'VICHADA'
  ] as const;

  private readonly _name: string;
  private readonly _corridorKey: string;

  public constructor(locationName: string) {
    const raw = String(locationName || '').trim();
    if (!raw) {
      throw new NonOperativeTerritoryError('Location name cannot be empty.');
    }

    const normalized = raw.toUpperCase().replace(/\s+/g, '_');

    // 1. Fail-fast en zonas prohibidas
    for (const forbidden of OperativeTerritory.FORBIDDEN_ZONES) {
      if (normalized.includes(forbidden)) {
        throw new NonOperativeTerritoryError(
          `[FAIL-FAST] La ubicación '${raw}' pertenece a una zona no operativa (${forbidden}). Operación rechazada.`
        );
      }
    }

    // 2. Validación de pertenencia al corredor habilitado
    const match = OperativeTerritory.ALLOWED_CORRIDORS.find(c => normalized.includes(c)) ||
      (normalized.includes('CLINICA') || normalized.includes('HOTEL') || normalized.includes('HOSPITAL') ? 'MEDELLIN' : null);

    if (!match) {
      throw new NonOperativeTerritoryError(
        `[FAIL-FAST] Ubicación no reconocida en el corredor médico: '${raw}'.`
      );
    }

    this._name = raw;
    this._corridorKey = match;
    Object.freeze(this);
  }

  public get name(): string { return this._name; }
  public get corridorKey(): string { return this._corridorKey; }
}
```

---

### 2.3 Entidades y Aggregate Roots

#### Aggregate Root: `ItineraryItem`
Representa una tarea o hito programado para un paciente y un actor en terreno.

```typescript
// domain/entities/ItineraryItem.ts
export type ItineraryStatus = 'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO';
export type ActorRole = 'DRV' | 'GUIA' | 'NURSE' | 'COORD' | 'MED' | 'FIN';
export type ItineraryCategory = 'TRANSFER' | 'CLINICAL_APPOINTMENT' | 'LAB_WORK' | 'POSTOP_CARE' | 'FLIGHT_ARRIVAL' | 'FLIGHT_DEPARTURE' | 'COMPANION_SHIFT' | 'PHARMACY_PURCHASE';

export interface ItineraryItemProps {
  id: string;
  reservaId: string;
  title: string;
  category: ItineraryCategory;
  territory: OperativeTerritory;
  assignedRole: ActorRole;
  assignedActorId: string;
  scheduledTime: string; // ISO-8601 America/Bogota
  estimatedDurationMinutes: number;
  status: ItineraryStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  notes?: string;
  receiptExpenseIds: string[];
  signatureId?: string;
  checkInLat?: number;
  checkInLng?: number;
}

export class ItineraryItem {
  private _props: ItineraryItemProps;

  constructor(props: ItineraryItemProps) {
    this._props = { ...props, receiptExpenseIds: [...props.receiptExpenseIds] };
  }

  public transitionStatus(nextStatus: ItineraryStatus, timestamp: string = new Date().toISOString()): void {
    const validTransitions: Record<ItineraryStatus, ItineraryStatus[]> = {
      'PROGRAMADO': ['EN_CAMINO', 'CANCELADO'],
      'EN_CAMINO': ['EN_SITIO', 'CANCELADO'],
      'EN_SITIO': ['COMPLETADO', 'CANCELADO'],
      'COMPLETADO': [],
      'CANCELADO': []
    };

    const allowed = validTransitions[this._props.status];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition from ${this._props.status} to ${nextStatus}`);
    }

    this._props.status = nextStatus;
    if (nextStatus === 'EN_CAMINO' || nextStatus === 'EN_SITIO') {
      if (!this._props.actualStartTime) this._props.actualStartTime = timestamp;
    }
    if (nextStatus === 'COMPLETADO') {
      this._props.actualEndTime = timestamp;
    }
  }

  public recordCheckIn(lat: number, lng: number): void {
    this._props.checkInLat = lat;
    this._props.checkInLng = lng;
  }

  public attachReceipt(receiptId: string): void {
    if (!this._props.receiptExpenseIds.includes(receiptId)) {
      this._props.receiptExpenseIds.push(receiptId);
    }
  }

  public attachSignature(signatureId: string): void {
    this._props.signatureId = signatureId;
  }

  public toJSON(): ItineraryItemProps {
    return { ...this._props };
  }
}
```

---

### 2.4 Abstract Ports Specification (Hexagonal Interfaces)

```typescript
// ports/StoragePort.ts
export interface StoragePort {
  init(): Promise<void>;
  saveItineraryItem(item: ItineraryItemProps): Promise<void>;
  getItineraryItemsByReserva(reservaId: string): Promise<ItineraryItemProps[]>;
  getAllReservas(): Promise<string[]>;
  
  // Single-Writer CQRS Event Stream
  appendLedgerEvent(event: LedgerEventDTO): Promise<void>;
  getLedgerEvents(reservaId: string): Promise<LedgerEventDTO[]>;
  
  // Projections
  saveExpense(expense: ReceiptExpenseDTO): Promise<void>;
  getExpenses(reservaId: string): Promise<ReceiptExpenseDTO[]>;
}

// ports/BlobStoragePort.ts
export interface BlobStoragePort {
  init(): Promise<void>;
  saveBlob(id: string, blob: Blob | ArrayBuffer, mimeType: string, metadata?: Record<string, string>): Promise<string>;
  getBlob(id: string): Promise<Blob | null>;
  deleteBlob(id: string): Promise<void>;
  hasBlob(id: string): Promise<boolean>;
}

// ports/ActorEventBusPort.ts
export interface ActorEventBusPort {
  publish(event: ActorEvent): void;
  subscribe(eventType: string, handler: (event: ActorEvent) => void): () => void;
  sendDirect(targetActorId: string, message: unknown): void;
}

// ports/GeolocationPort.ts
export interface GeolocationPort {
  getCurrentCoordinates(): Promise<{ latitude: number; longitude: number; accuracy: number }>;
  isWithinCorridor(latitude: number, longitude: number, corridor: string): boolean;
}

// ports/OCRPort.ts
export interface OCRPort {
  extractReceiptData(imageBlob: Blob): Promise<{
    amountCents: bigint;
    currency: CurrencyCode;
    vendor: string;
    concept: string;
    taxId?: string;
    confidence: number;
  }>;
}

// ports/SignaturePort.ts
export interface SignaturePort {
  captureSvgStroke(strokePoints: Array<{ x: number; y: number; time: number }>): {
    svgData: string;
    pointHash: string;
    strokeCount: number;
  };
}
```

---

## 3. 💾 Subsistema de Almacenamiento Local Multicapa (100% Offline)

El subsistema de persistencia implementa 3 capas complementarias con tolerancia a fallos radical:

```
+-----------------------------------------------------------------------------------------------+
|                               MULTI-TIER STORAGE ARCHITECTURE                                 |
|                                                                                               |
|  [Tier 1: Relational SQLite / CQRS Store]                                                     |
|  Engine: SQLite3 compiled to WASM (wa-sqlite / sql.js) backed by OPFS / IndexedDB VFS.       |
|  Responsibility: Tablas 3NF, eventos CQRS ordenados, agregaciones e integridad referencial.   |
|                                                                                               |
|  [Tier 2: IndexedDB Blob Store via Dexie.js]                                                  |
|  Engine: Dexie.js (IndexedDB wrapper de alto rendimiento).                                    |
|  Responsibility: Fotos de comprobantes de taxi/farmacia (WebP/JPEG), firmas vectoriales SVG,  |
|                  PDFs de Check-Mig y pólizas. Referenciados por UUID en Tier 1.               |
|                                                                                               |
|  [Tier 3: Storage Persistence API & Service Worker A2HS Cache]                                |
|  Protocols: navigator.storage.persist() + CacheStorage API.                                   |
|  Responsibility: Inmunidad ante la política de auto-evicción de 7 días de WebKit/Safari en iOS.|
+-----------------------------------------------------------------------------------------------+
```

### 3.1 Tier 1: Embedded Relational SQLite & CQRS Event Store

```sql
-- DDL para el Motor Relacional SQLite Local en Navegador
CREATE TABLE IF NOT EXISTS itinerarios (
    id TEXT PRIMARY KEY,
    reserva_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    territory TEXT NOT NULL,
    assigned_role TEXT NOT NULL,
    assigned_actor_id TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL,
    actual_start_time TEXT,
    actual_end_time TEXT,
    notes TEXT,
    signature_id TEXT,
    check_in_lat REAL,
    check_in_lng REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ledger_events (
    id TEXT PRIMARY KEY,
    sequence_number INTEGER NOT NULL,
    reserva_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    event_type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    spread_bps INTEGER DEFAULT 3000, -- 30.00%
    payload_json TEXT NOT NULL,
    hash_prev TEXT NOT NULL,
    hash_current TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gastos_tickets (
    id TEXT PRIMARY KEY,
    reserva_id TEXT NOT NULL,
    itinerary_item_id TEXT,
    category TEXT NOT NULL,
    concept TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    vendor TEXT,
    blob_ref_id TEXT,
    registered_by_actor_id TEXT NOT NULL,
    audit_status TEXT DEFAULT 'SUBMITTED',
    timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_itinerarios_reserva ON itinerarios(reserva_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reserva_seq ON ledger_events(reserva_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_gastos_reserva ON gastos_tickets(reserva_id);
```

### 3.2 Tier 2: Dexie.js para Archivos Binarios y Blobs

```typescript
// infrastructure/storage/DexieBlobStorageAdapter.ts
import Dexie, { Table } from 'dexie';
import { BlobStoragePort } from '../../ports/BlobStoragePort';

interface BlobRecord {
  id: string;
  reservaId?: string;
  mimeType: string;
  blobData: Blob;
  sizeBytes: number;
  createdAt: string;
}

class MedicalTripBlobDB extends Dexie {
  public blobs!: Table<BlobRecord, string>;

  constructor() {
    super('MedicalTripBlobDB');
    this.version(1).stores({
      blobs: 'id, reservaId, mimeType, createdAt'
    });
  }
}

export class DexieBlobStorageAdapter implements BlobStoragePort {
  private db: MedicalTripBlobDB;

  constructor() {
    this.db = new MedicalTripBlobDB();
  }

  public async init(): Promise<void> {
    await this.db.open();
  }

  public async saveBlob(id: string, blob: Blob | ArrayBuffer, mimeType: string, metadata?: Record<string, string>): Promise<string> {
    const rawBlob = blob instanceof Blob ? blob : new Blob([blob], { type: mimeType });
    await this.db.blobs.put({
      id,
      reservaId: metadata?.reservaId,
      mimeType,
      blobData: rawBlob,
      sizeBytes: rawBlob.size,
      createdAt: new Date().toISOString()
    });
    return id;
  }

  public async getBlob(id: string): Promise<Blob | null> {
    const rec = await this.db.blobs.get(id);
    return rec ? rec.blobData : null;
  }

  public async deleteBlob(id: string): Promise<void> {
    await this.db.blobs.delete(id);
  }

  public async hasBlob(id: string): Promise<boolean> {
    const count = await this.db.blobs.where('id').equals(id).count();
    return count > 0;
  }
}
```

### 3.3 Tier 3: Protección Anti-Evicción WebKit (Safari 7-Day Rule)

En Safari (iOS/iPadOS), el almacenamiento web no persistente se purga automáticamente tras 7 días de inactividad. Se implementa el protocolo de protección en 3 pasos:

1. **Invocación de `navigator.storage.persist()`**: Solicita al motor de navegación clasificar el origen como `persisted: true` (almacenamiento duradero).
2. **PWA Standalone A2HS (Add to Home Screen)**: Las PWAs instaladas en la pantalla de inicio de iOS están exentas de la purga automática de ITP (Intelligent Tracking Prevention).
3. **Monitoreo de Cuota (`navigator.storage.estimate()`)**: Renderiza en el HUD del sistema el porcentaje de cuota utilizado y el estado de blindaje.

```typescript
// infrastructure/storage/StorageManager.ts
export class StorageManager {
  public static async ensurePersistence(): Promise<{ isPersisted: boolean; quotaMB: string; usageMB: string }> {
    let isPersisted = false;
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        isPersisted = await navigator.storage.persist();
        console.log(`🛡️ [Storage Manager]: Persistencia Anti-Evicción: ${isPersisted ? 'BLINDADO' : 'ESTÁNDAR'}`);
      } catch (err) {
        console.warn('Error al solicitar storage.persist():', err);
      }
    }

    let quotaMB = '0.00';
    let usageMB = '0.00';
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quotaMB = ((est.quota || 0) / (1024 * 1024)).toFixed(2);
        usageMB = ((est.usage || 0) / (1024 * 1024)).toFixed(2);
      } catch (err) {
        // Ignore fallback
      }
    }

    return { isPersisted, quotaMB, usageMB };
  }
}
```

---

## 4. 💰 Liquidación Financiera Determinista y Single-Writer CQRS

### 4.1 Arquitectura Single-Writer CQRS Event Ledger

Para evitar condiciones de carrera (*race conditions*) y desbalances contables cuando múltiples actores en terreno registran gastos en paralelo, la escritura en el libro mayor financiero se canaliza a través de un **Single-Writer Ledger Engine** (gobernado por el `FinancialAuditorActorWorker`).

```
[DRV Worker]  ---> ProposeExpenseCommand ('TAXI_RIDE')      ---+
[GUIA Worker] ---> ProposeExpenseCommand ('PHARMACY_FEE')    ---|---> [Command FIFO Queue]
[NURSE Worker]---> ProposeExpenseCommand ('SUPPLIES')        ---|            |
                                                                             v
                                                               [Financial Auditor Single-Writer]
                                                                - Valida Invariantes BigInt
                                                                - Valida Duplicados / OCR
                                                                - Asigna SequenceNumber Monotónico
                                                                - Genera SHA-256 Hash Chain
                                                                - Escribe en `ledger_events` Table
                                                                             |
                                                                             v
                                                               [CQRS Read Projections]
                                                                - SettlementBalanceProjection
                                                                - ProviderPayableProjection
                                                                - Automated Audit Balance Sheet
```

### 4.2 Modelo Criptográfico de Encadenamiento de Eventos (Hash Chaining)

Cada evento registrado incluye el hash criptográfico del evento anterior (`hashPrev`) y el hash propio calculado (`hashCurrent`), garantizando trazabilidad e inmutabilidad contable a prueba de alteraciones:

$$\text{hashCurrent} = \text{SHA256}(\text{sequenceNumber} \parallel \text{reservaId} \parallel \text{eventType} \parallel \text{amountCents} \parallel \text{hashPrev} \parallel \text{timestamp})$$

### 4.3 Fórmulas Matemáticas de Liquidación en BigInt

1. **Honorarios de Acompañamiento Bilingüe**:
   $$\text{HonorariosCents} = \frac{\text{TarifaHoraCents} \times \text{MinutosEjecutados}}{60n}$$

2. **Cálculo de Margen Comercial (Spread 30%)**:
   $$\text{PrecioClienteCents} = \frac{\text{CostoProveedorCents} \times 10000n}{10000n - \text{MargenBps}}$$
   *Ejemplo: Para un costo de transporte de \$100.000 COP con margen del 30% (3000 bps):*
   $$\text{PrecioClienteCents} = \frac{10000000n \times 10000n}{7000n} = 14285714n \text{ centavos } (\$142.857 \text{ COP})$$

3. **Balance de Liquidación al Cierre**:
   $$\text{SaldoGuiaNeto} = \sum \text{HonorariosTurnos} + \sum \text{ViaticosAprobados} - \sum \text{AnticiposRecibidos}$$

---

## 5. 👥 Modelo de Actores Descentralizado y Concurrencia en Web Workers

### 5.1 Los 4 Actores Operativos en Web Workers Dedicados

Cada rol del equipo de Medical Trip se ejecuta de forma asíncrona dentro de su propio Web Worker, aislando el cálculo y la simulación de la interfaz gráfica principal:

| Actor | Nombre Canónico | Archivo Worker | Responsabilidades Asíncronas |
|---|---|---|---|
| **`[DRV]`** | Conductor Ramón Rosero | `driver.worker.ts` | Simulación GPS de trayectos, cálculo de tiempos estimados de llegada (ETA), cómputo de tarifas de traslado y gastos de peaje/combustible. |
| **`[GUIA]`** | Guía Bilingüe Yenny | `guide.worker.ts` | Monitoreo de turnos de acompañamiento, cronómetro de horas presenciales, traducción de términos clínicos y registro de compras de farmacia. |
| **`[NURSE]`** | Enfermera Villa Anita | `nurse.worker.ts` | Verificación de cronograma de medicamentos postoperatorios (Enoxaparina, analgésicos), registro de signos vitales y control de curaciones. |
| **`[FIN]`** | Auditora Dra. Jenny Acosta | `financial.worker.ts` | Escritor único (Single-Writer) del libro mayor, validación de integridad BigInt, auditoría de recibos OCR y generación del balance general. |

### 5.2 Malla Peer-to-Peer `MessageChannel`

Los actores se comunican entre sí mediante puertos directos de `MessageChannel`, eliminando cuellos de botella en el hilo principal:

```
                    +---------------------------+
                    |      Main UI Thread       |
                    | (Gestures, Canvas, 60fps) |
                    +---------------------------+
                       /          |          \
           PortMainUI /           |           \ PortMainUI
                     /            |            \
     +-----------------+          |          +-----------------+
     | [DRV] Worker    |          |          | [GUIA] Worker   |
     +-----------------+          |          +-----------------+
           \                      |                      /
            \  Direct Port (DRV<->FIN)                  / Direct Port (GUIA<->FIN)
             \                    |                    /
              \                   v                   /
               +-------------------------------------+
               |       [FIN] Financial Worker        |
               |         Single-Writer CQRS          |
               +-------------------------------------+
                                  ^
                                  | Direct Port (NURSE<->FIN)
               +-------------------------------------+
               |          [NURSE] Worker             |
               +-------------------------------------+
```

### 5.3 Sincronización de Estado sin Conflictos (CRDTs & Vector Clocks)

Para permitir que el Conductor, la Guía y la Enfermera actualicen estados de tareas concurrentemente en terreno sin conexión, el sistema utiliza un **LWW-Element-Set (Last-Write-Wins Element Set)** con marcas de tiempo lógicas (*Vector Clocks*). Cuando dos actualizaciones colisionan sobre el mismo hito de itinerario, el estado se resuelve determinísticamente mediante la tupla:

$$\text{Resolución} = \max(\text{TimestampISO}, \text{ActorPriorityScore})$$

Donde $\text{ActorPriorityScore}$ otorga prelación al rol responsable primario según la matriz RACI (ej. `[DRV]` tiene prioridad sobre el estado de traslados; `[MED]` tiene prioridad sobre el alta clínica).

---

## 6. 📁 Mapeo de los 4 Arquetipos Reales de Google Drive

La PWA incluye precargados los 4 arquetipos empíricos extraídos de la operación real:

### 1. `RVA171 Catia x5` (Multi-Pax Cosmetic / Dental & Companion Itinerary)
- **Paciente Principal**: Catia Rodrigues (Curazao 🇨🇼, 5 Pax acompañantes).
- **Caso Operativo**: Grupo familiar para procedimientos estéticos y odontológicos. Múltiples traslados simultáneos en vanes ejecutivas de Aeroturex, acompañamiento bilingüe intensivo de 6.5h diarias por Yenny y gestión de viáticos en efectivo.
- **Validación Financiera**: Cuentas de cobro por \$2.564.892 COP vs Anticipos de \$2.098.100 COP = Saldo neto a favor de la Guía de **+\$466.792 COP**.

### 2. `RVA282 George Cardio` (Chequeo Cardiovascular Integral Cardio VID & Wingo)
- **Paciente**: George Hernandez (Curazao 🇨🇼).
- **Caso Operativo**: Llegada en vuelo Wingo 7449 a Rionegro (JMC Puerta 2). Traslado al Edificio Park 42 (El Poblado). Chequeo ejecutivo cardiovascular en Clínica Cardio VID (ecocardiograma, prueba de esfuerzo).
- **Validación Financiera**: Moneda dual USD/COP con TRM liquidada a \$4.150 COP.

### 3. `RVA341 Hogenboom CES` (Specialized Clinical Consultation & Lab Work)
- **Paciente**: Hogenboom (Aruba 🇦🇼).
- **Caso Operativo**: Valoración médica con Dr. Marcos Yepes, toma de exámenes de laboratorio de alta complejidad en ayunas en HPTU y traslado inter-hospitalario.
- **Validación Financiera**: Spread del 30% aplicado sobre tarifa particular vs convenio institucional.

### 4. `RVA077 Rumai Cirugía 12d` (Extended Surgical Recovery & Villa Anita Nursing)
- **Paciente**: Rumai (Surinam 🇸🇷, Estadía de 12 días).
- **Caso Operativo**: Cirugía de contorno corporal, traslado en ambulancia/vehículo asistencial a Villa Anita Recovery House, cuidados de enfermería postoperatoria 24/7 (Enoxaparina 40mg, drenajes) y emisión de certificado *Fit-to-Fly*.
- **Validación Financiera**: Liquidación combinada de honorarios de enfermería por turnos de 12h + estancia post-quirúrgica.

---

## 7. 🗂️ Estructura Completa de Archivos del Proyecto

```
apps/itinerarios_liquidacion_offline/
├── index.html                           # Main PWA Entrypoint & Split-View Layout
├── package.json                         # Dependencies & Scripts (Vite, TypeScript, Dexie, Vitest)
├── tsconfig.json                        # Strict TypeScript Configuration
├── vite.config.ts                       # Fast Bundler & Worker Config
├── manifest.webmanifest                 # PWA Manifest (A2HS Standalone Support)
├── sw.js                                # Offline-First Service Worker (Cache-First App Shell)
├── public/
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   └── wasm/
│       └── wa-sqlite.wasm               # SQLite WASM Engine
├── src/
│   ├── main.ts                          # Bootstrap, Persistence Check & Actor Swarm Init
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── ItineraryItem.ts
│   │   │   ├── SettlementLedger.ts
│   │   │   ├── DigitalSignature.ts
│   │   │   ├── ReceiptExpense.ts
│   │   │   └── ActorEntity.ts
│   │   ├── value-objects/
│   │   │   ├── Money.ts
│   │   │   ├── OperativeTerritory.ts
│   │   │   ├── ActorEvent.ts
│   │   │   ├── GeoCoordinates.ts
│   │   │   └── TimeSlot.ts
│   │   ├── events/
│   │   │   ├── ItineraryStatusChanged.ts
│   │   │   ├── ActorCheckInEmitted.ts
│   │   │   ├── ReceiptAttached.ts
│   │   │   └── LedgerEventAppended.ts
│   │   └── errors/
│   │       ├── NonOperativeTerritoryError.ts
│   │       ├── IncompatibleCurrencyError.ts
│   │       └── InvalidStatusTransitionError.ts
│   ├── ports/
│   │   ├── StoragePort.ts
│   │   ├── BlobStoragePort.ts
│   │   ├── ActorEventBusPort.ts
│   │   ├── GeolocationPort.ts
│   │   ├── OCRPort.ts
│   │   └── SignaturePort.ts
│   ├── application/
│   │   ├── usecases/
│   │   │   ├── CreateItineraryItemUseCase.ts
│   │   │   ├── TransitionItineraryStatusUseCase.ts
│   │   │   ├── RecordActorCheckInUseCase.ts
│   │   │   ├── SubmitReceiptExpenseUseCase.ts
│   │   │   ├── SettleLedgerBalanceUseCase.ts
│   │   │   └── GenerateAuditBalanceSheetUseCase.ts
│   │   └── services/
│   │       ├── CRDTSyncService.ts
│   │       └── SingleWriterLedgerService.ts
│   ├── infrastructure/
│   │   ├── storage/
│   │   │   ├── SQLiteStorageAdapter.ts
│   │   │   ├── DexieBlobStorageAdapter.ts
│   │   │   └── StorageManager.ts
│   │   ├── actors/
│   │   │   ├── ActorMeshCoordinator.ts
│   │   │   ├── DriverActorWorker.ts
│   │   │   ├── GuideActorWorker.ts
│   │   │   ├── NurseActorWorker.ts
│   │   │   └── FinancialAuditorActorWorker.ts
│   │   ├── hardware/
│   │   │   ├── BrowserGeolocationAdapter.ts
│   │   │   ├── SimulatedOCRAdapter.ts
│   │   │   └── CanvasSignatureAdapter.ts
│   │   └── seed/
│   │       ├── ArchetypesDataSeed.ts
│   │       └── SeedLoader.ts
│   ├── ui/
│   │   ├── styles/
│   │   │   ├── main.css
│   │   │   ├── split-view.css
│   │   │   ├── itinerary-timeline.css
│   │   │   ├── settlement-panel.css
│   │   │   └── modals.css
│   │   └── components/
│   │       ├── ArchetypeSwitcherComponent.ts
│   │       ├── ItineraryTimelineComponent.ts
│   │       ├── SettlementBalanceBarComponent.ts
│   │       ├── GPSCheckInModalComponent.ts
│   │       ├── SignatureCanvasModalComponent.ts
│   │       ├── ReceiptOCRModalComponent.ts
│   │       └── ActorMeshStatusComponent.ts
│   └── workers/
│       ├── driver.worker.ts
│       ├── guide.worker.ts
│       ├── nurse.worker.ts
│       └── financial.worker.ts
└── tests/
    ├── unit/
    │   ├── domain/
    │   │   ├── Money.test.ts
    │   │   ├── OperativeTerritory.test.ts
    │   │   └── ItineraryItem.test.ts
    │   └── application/
    │       └── SettleLedgerBalance.test.ts
    ├── integration/
    │   ├── SQLiteStorageAdapter.test.ts
    │   ├── DexieBlobStorageAdapter.test.ts
    │   └── ActorMeshChannel.test.ts
    └── e2e/
        ├── ArchetypesSimulation.test.ts
        └── OfflineStoragePersistence.test.ts
```

---

## 8. 🛡️ Protocolo de Verificación y Criterios de Aceptación

1. **Invariantes de Dominio**:
   - `OperativeTerritory` rechaza `Mocoa`, `Leticia`, `Arauca` arrojando `NonOperativeTerritoryError` en <1ms.
   - `Money` ejecuta sumas, multiplicaciones con factor fraccionario y divisiones con residuo exacto con 0 centavos perdidos.
2. **Persistencia 100% Offline**:
   - La aplicación inicializa, inserta hitos, captura firmas digitales, almacena recibos binarios y computa balances con la red completamente desactivada (`navigator.onLine = false`).
   - `navigator.storage.persist()` reporta `isPersisted: true`.
3. **Concurrencia de Actores y 60 FPS**:
   - Los 4 Web Workers procesan eventos concurrentes mediante `MessageChannel` con 0 bloqueo en el hilo principal de la UI.
   - El hilo principal mantiene 60 FPS estables durante la manipulación de canvas y gestos.
4. **Fidelidad de Arquetipos**:
   - El selector de 4 arquetipos intercambia al instante entre `RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Hogenboom CES` y `RVA077 Rumai Cirugía 12d` recalculando en tiempo real las cuentas de cobro y saldos netos.
