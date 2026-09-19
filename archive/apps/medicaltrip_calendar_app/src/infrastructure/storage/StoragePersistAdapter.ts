import {
  IStoragePersistAdapter,
  StorageQuotaInfo,
} from '../../application/ports/IStoragePersistAdapter';

export class StoragePersistAdapter implements IStoragePersistAdapter {
  /**
   * Requests persistent storage mode from the browser (e.g. navigator.storage.persist()).
   * Protects client-side data from being automatically evicted by browser storage management.
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (
      typeof globalThis.navigator !== 'undefined' &&
      globalThis.navigator.storage &&
      typeof globalThis.navigator.storage.persist === 'function'
    ) {
      try {
        const isPersisted = await globalThis.navigator.storage.persist();
        return Boolean(isPersisted);
      } catch (err) {
        console.warn('[StoragePersistAdapter]: Failed to request persistence:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Checks whether the current storage origin is marked as persistent.
   */
  async isStoragePersisted(): Promise<boolean> {
    if (
      typeof globalThis.navigator !== 'undefined' &&
      globalThis.navigator.storage &&
      typeof globalThis.navigator.storage.persisted === 'function'
    ) {
      try {
        const persisted = await globalThis.navigator.storage.persisted();
        return Boolean(persisted);
      } catch (err) {
        console.warn('[StoragePersistAdapter]: Failed to check persistence status:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Estimates storage quota and usage in bytes.
   */
  async getStorageQuota(): Promise<StorageQuotaInfo> {
    if (
      typeof globalThis.navigator !== 'undefined' &&
      globalThis.navigator.storage &&
      typeof globalThis.navigator.storage.estimate === 'function'
    ) {
      try {
        const estimate = await globalThis.navigator.storage.estimate();
        const usedBytes = estimate.usage || 0;
        const totalBytes = estimate.quota || 0;
        const quotaPct = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

        return {
          usedBytes,
          totalBytes,
          quotaPct: Math.round(quotaPct * 100) / 100,
        };
      } catch (err) {
        console.warn('[StoragePersistAdapter]: Failed to estimate storage quota:', err);
      }
    }

    return {
      usedBytes: 0,
      totalBytes: 0,
      quotaPct: 0,
    };
  }

  /**
   * Prevents Safari / WebKit 7-day storage evictions by establishing persistent storage
   * and maintaining active storage touches.
   */
  async preventWebKitEviction(): Promise<boolean> {
    const persisted = await this.requestPersistentStorage();
    if (typeof globalThis.localStorage !== 'undefined') {
      try {
        globalThis.localStorage.setItem(
          'mt_storage_heartbeat',
          JSON.stringify({ lastTouch: new Date().toISOString(), persisted })
        );
      } catch {
        // Ignore localStorage quota / access errors
      }
    }
    return persisted;
  }
}

// Global default singleton
export const storagePersistAdapter = new StoragePersistAdapter();
