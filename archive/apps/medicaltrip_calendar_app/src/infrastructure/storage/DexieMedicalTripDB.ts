import Dexie, { type Table } from 'dexie';

export interface StoredItineraryRecord {
  id: string; // booking id
  code: string; // e.g. "RVA171-4", "CTZ282-3"
  patientId: string;
  paxCount: number;
  arrivalDate: string; // ISO string
  departureDate: string; // ISO string
  arrivalAirline?: string;
  arrivalFlight?: string;
  hotelId?: string;
  hotelName?: string;
  status: string; // 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO'
  checkMigIn: boolean;
  checkMigOut: boolean;
  notes?: string;
  defaultCurrency: 'COP' | 'USD';
  createdAt: string;
  updatedAt: string;
}

export interface StoredMilestoneRecord {
  id: string;
  reservaId: string;
  dayNumber: number;
  title: string;
  category: string; // 'FLIGHT' | 'CLINICAL' | 'LAB' | 'PHARMACY' | 'HOTEL'
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  location: string;
  canonicalCorridor?: string;
  coordinates?: { latitude: number; longitude: number };
  providerId?: string;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  financialType: string; // 'OUT_OF_POCKET' | 'GUIDE_FEE' | 'FLEET_TAXI' | 'INCLUDED' | 'NONE'
  costCents: string; // BigInt stored as string to preserve exact integer cents
  currency: 'COP' | 'USD';
  guideHours: number;
  status: string; // 'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'
  notes?: string;
  requiresGpsCheckIn: boolean;
  requiresSignature: boolean;
  requiresReceipt: boolean;
  gpsChecked: boolean;
  gpsCheckInTime?: string;
  signatureUuid?: string;
  receiptUuid?: string;
}

export interface StoredTransactionRecord {
  id: string;
  reservaId: string;
  milestoneId?: string;
  timestamp: string; // ISO string
  type: string; // 'OUT_OF_POCKET' | 'GUIDE_FEE' | 'FLEET_TAXI' | 'CASH_ADVANCE'
  amountCents: string; // BigInt stored as string
  currency: 'COP' | 'USD';
  description: string;
  receiptUuid?: string;
  audited: boolean;
  auditedBy?: string;
}

export interface StoredBinaryBlobRecord {
  id: string;
  category: 'SIGNATURE' | 'RECEIPT_IMAGE' | 'DOCUMENT' | 'EXPORT_PDF';
  relatedId?: string; // e.g. reservaId, milestoneId, txId
  mimeType: string;
  data: string | ArrayBuffer | Uint8Array; // base64 string or binary buffer
  sizeBytes: number;
  sha256Hash?: string;
  createdAt: string;
}

export interface StoredAuditBlockRecord {
  id: string;
  reservaId: string;
  index: number;
  txId?: string;
  payload: Record<string, unknown> | string;
  prevHash: string;
  hash: string;
  timestamp: string;
  signedBy?: string;
}

export interface StoredSyncStateRecord {
  key: string;
  version: number;
  vectorClock?: Record<string, number>;
  lastSyncedAt: string;
  state: Record<string, unknown>;
}

/**
 * DexieMedicalTripDB
 * Local-First IndexedDB relational & binary asset database using Dexie.js.
 * Implements schema for itineraries, milestones, transactions, binary blobs, audit ledger, and sync state.
 */
export class DexieMedicalTripDB extends Dexie {
  itineraries!: Table<StoredItineraryRecord, string>;
  milestones!: Table<StoredMilestoneRecord, string>;
  transactions!: Table<StoredTransactionRecord, string>;
  binaryBlobs!: Table<StoredBinaryBlobRecord, string>;
  auditLedger!: Table<StoredAuditBlockRecord, string>;
  syncState!: Table<StoredSyncStateRecord, string>;

  constructor(databaseName = 'MedicalTripDB') {
    super(databaseName);

    this.version(1).stores({
      itineraries: 'id, code, patientId, status, arrivalDate, departureDate',
      milestones: 'id, reservaId, category, status, startDateTime, endDateTime, assignedDriverId, assignedGuideId, assignedNurseId',
      transactions: 'id, reservaId, milestoneId, type, timestamp, audited',
      binaryBlobs: 'id, category, relatedId, mimeType, createdAt',
      auditLedger: 'id, reservaId, index, hash, prevHash, timestamp',
      syncState: 'key, lastSyncedAt, version',
    });
  }

  /**
   * Resets all tables in the database (useful for testing and test isolation).
   */
  async clearAllTables(): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.itineraries,
        this.milestones,
        this.transactions,
        this.binaryBlobs,
        this.auditLedger,
        this.syncState,
      ],
      async () => {
        await Promise.all([
          this.itineraries.clear(),
          this.milestones.clear(),
          this.transactions.clear(),
          this.binaryBlobs.clear(),
          this.auditLedger.clear(),
          this.syncState.clear(),
        ]);
      }
    );
  }
}

// Global default singleton instance
let defaultDBInstance: DexieMedicalTripDB | null = null;

export function getMedicalTripDB(dbName = 'MedicalTripDB'): DexieMedicalTripDB {
  if (dbName === 'MedicalTripDB') {
    if (!defaultDBInstance) {
      defaultDBInstance = new DexieMedicalTripDB(dbName);
    }
    return defaultDBInstance;
  }
  return new DexieMedicalTripDB(dbName);
}
