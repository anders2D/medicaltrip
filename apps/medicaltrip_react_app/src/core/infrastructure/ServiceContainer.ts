/**
 * Medical Trip Colombia S.A.S. - ServiceContainer Composition Root (R2)
 * Decouples presentation components and application use cases from concrete database drivers.
 * Central Dependency Injection Registry & Factory for Hexagonal Ports and Adapters.
 */

if (typeof process !== 'undefined' && process.env) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
if (typeof window !== 'undefined' && (window as any).happyDOM?.settings?.fetch) {
  (window as any).happyDOM.settings.fetch.disableStrictSSL = true;
}

import { IStoragePort } from '../ports/IStoragePort';
import { IBlobStoragePort } from '../ports/IBlobStoragePort';
import { IStoragePersistPort } from '../ports/IStoragePersistPort';
import { DexieStorageAdapter } from './storage/DexieStorageAdapter';
import { createClient } from '@supabase/supabase-js';
import { InMemoryStorageAdapter } from './storage/InMemoryStorageAdapter';
import { SupabaseStorageAdapter } from './storage/SupabaseStorageAdapter';
import { WebKitPersistAdapter } from './storage/WebKitPersistAdapter';
import type { IPatientInvitationRepository } from '../../domain/ports/IPatientInvitationRepository';
import type { IExportPort } from '../../domain/ports/IExportPort';
import type { IOCRPort } from '../../domain/ports/IOCRPort';
import { LocalStoragePatientInvitationAdapter } from '../../infrastructure/storage/LocalStoragePatientInvitationAdapter';
import { SupabasePatientInvitationAdapter } from '../../infrastructure/storage/SupabasePatientInvitationAdapter';
import { JsonPdfExportAdapter } from '../../infrastructure/export/JsonPdfExportAdapter';
import { SimulatedReceiptOCRAdapter } from '../../infrastructure/ocr/SimulatedReceiptOCRAdapter';

export type StorageDriverType = 'dexie' | 'memory' | 'supabase';

export interface ServiceContainerConfig {
  driver?: StorageDriverType;
  dbName?: string;
  storagePort?: IStoragePort;
  invitationRepository?: IPatientInvitationRepository;
  exportPort?: IExportPort;
  ocrPort?: IOCRPort;
  persistPort?: IStoragePersistPort;
}

export class ServiceContainer {
  private static resolveDefaultDriver(): StorageDriverType {
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
      return 'dexie';
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORAGE_DRIVER) {
      const envDriver = import.meta.env.VITE_STORAGE_DRIVER as StorageDriverType;
      if (envDriver === 'supabase' || envDriver === 'memory' || envDriver === 'dexie') {
        return envDriver;
      }
    }
    return 'supabase';
  }

  private static driver: StorageDriverType = ServiceContainer.resolveDefaultDriver();
  private static defaultDbName: string = 'MedicalTripDB_UI';

  private static storageInstance: IStoragePort | null = null;
  private static invitationRepositoryInstance: IPatientInvitationRepository | null = null;
  private static exportPortInstance: IExportPort | null = null;
  private static ocrPortInstance: IOCRPort | null = null;
  private static persistPortInstance: IStoragePersistPort | null = null;

  // ==========================================
  // Storage Driver Selection & Storage Port
  // ==========================================
  public static getDriver(): StorageDriverType {
    return this.driver;
  }

  public static setDriver(driver: StorageDriverType): void {
    if (this.driver !== driver) {
      this.driver = driver;
      this.storageInstance = null;
      this.invitationRepositoryInstance = null;
    }
  }

  public static getStoragePort(dbName?: string): IStoragePort {
    if (!this.storageInstance) {
      const name = dbName || this.defaultDbName;
      switch (this.driver) {
        case 'dexie':
          this.storageInstance = new DexieStorageAdapter(name);
          break;
        case 'memory':
          this.storageInstance = new InMemoryStorageAdapter();
          break;
        case 'supabase': {
          if (typeof process !== 'undefined' && process.env) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          }
          if (typeof window !== 'undefined' && (window as any).happyDOM?.settings?.fetch) {
            (window as any).happyDOM.settings.fetch.disableStrictSSL = true;
          }
          const defaultCloudUrl = 'https://pxmobokcqhsixfvdsrwj.supabase.co';
          const supabaseUrl =
            (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || defaultCloudUrl;
          const supabaseKey =
            (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
            'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';
          if (supabaseUrl && supabaseKey) {
            try {
              const client = createClient(supabaseUrl, supabaseKey, {
                auth: { persistSession: false, autoRefreshToken: false },
              });
              this.storageInstance = new SupabaseStorageAdapter({ client });
            } catch {
              this.storageInstance = new SupabaseStorageAdapter();
            }
          } else {
            this.storageInstance = new SupabaseStorageAdapter();
          }
          break;
        }
        default:
          this.storageInstance = new DexieStorageAdapter(name);
          break;
      }
    }
    return this.storageInstance;
  }

  public static setStoragePort(port: IStoragePort | null): void {
    this.storageInstance = port;
  }

  public static getBlobStoragePort(): IBlobStoragePort {
    return this.getStoragePort();
  }

  // ==========================================
  // Auxiliary Output Ports
  // ==========================================
  public static getInvitationRepository(): IPatientInvitationRepository {
    if (!this.invitationRepositoryInstance) {
      if (this.driver === 'supabase') {
        if (typeof process !== 'undefined' && process.env) {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        if (typeof window !== 'undefined' && (window as any).happyDOM?.settings?.fetch) {
          (window as any).happyDOM.settings.fetch.disableStrictSSL = true;
        }
        const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
        const supabaseKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';
        let client: any = null;
        if (supabaseUrl && supabaseKey) {
          try {
            client = createClient(supabaseUrl, supabaseKey, {
              auth: { persistSession: false, autoRefreshToken: false },
            });
          } catch {
            client = null;
          }
        }
        this.invitationRepositoryInstance = new SupabasePatientInvitationAdapter(client);
      } else {
        this.invitationRepositoryInstance = new LocalStoragePatientInvitationAdapter();
      }
    }
    return this.invitationRepositoryInstance;
  }

  public static setInvitationRepository(repo: IPatientInvitationRepository | null): void {
    this.invitationRepositoryInstance = repo;
  }

  public static getExportPort(): IExportPort {
    if (!this.exportPortInstance) {
      this.exportPortInstance = new JsonPdfExportAdapter();
    }
    return this.exportPortInstance;
  }

  public static setExportPort(port: IExportPort | null): void {
    this.exportPortInstance = port;
  }

  public static getOCRPort(): IOCRPort {
    if (!this.ocrPortInstance) {
      this.ocrPortInstance = new SimulatedReceiptOCRAdapter();
    }
    return this.ocrPortInstance;
  }

  public static setOCRPort(port: IOCRPort | null): void {
    this.ocrPortInstance = port;
  }

  public static getPersistPort(): IStoragePersistPort {
    if (!this.persistPortInstance) {
      this.persistPortInstance = new WebKitPersistAdapter();
    }
    return this.persistPortInstance;
  }

  public static setPersistPort(port: IStoragePersistPort | null): void {
    this.persistPortInstance = port;
  }

  // ==========================================
  // Lifecycle & Maintenance
  // ==========================================
  public static configure(config: ServiceContainerConfig): void {
    if (config.driver) {
      ServiceContainer.setDriver(config.driver);
    }
    if (config.dbName) {
      ServiceContainer.defaultDbName = config.dbName;
    }
    if (config.storagePort !== undefined) {
      ServiceContainer.setStoragePort(config.storagePort);
    }
    if (config.invitationRepository !== undefined) {
      ServiceContainer.setInvitationRepository(config.invitationRepository);
    }
    if (config.exportPort !== undefined) {
      ServiceContainer.setExportPort(config.exportPort);
    }
    if (config.ocrPort !== undefined) {
      ServiceContainer.setOCRPort(config.ocrPort);
    }
    if (config.persistPort !== undefined) {
      ServiceContainer.setPersistPort(config.persistPort);
    }
  }

  public static reset(): void {
    this.driver = ServiceContainer.resolveDefaultDriver();
    this.defaultDbName = 'MedicalTripDB_UI';
    this.storageInstance = null;
    this.invitationRepositoryInstance = null;
    this.exportPortInstance = null;
    this.ocrPortInstance = null;
    this.persistPortInstance = null;
  }
}

