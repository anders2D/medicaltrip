/**
 * Medical Trip Colombia S.A.S. - WebKit / Browser Anti-Eviction Persistence Adapter
 * Implements IStoragePersistPort to protect offline IndexedDB against Safari/WebKit 7-day eviction.
 */

import { IStoragePersistPort, StorageEstimate } from '../../../core/ports/IStoragePersistPort';

export class WebKitPersistAdapter implements IStoragePersistPort {
  private static readonly HEARTBEAT_KEY = 'mt_storage_heartbeat';

  public async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch (err) {
        console.warn('Storage persist request failed:', err);
        return false;
      }
    }
    return false;
  }

  public async isPersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch (err) {
        console.warn('Storage persisted check failed:', err);
        return false;
      }
    }
    return false;
  }

  public async getStorageEstimate(): Promise<StorageEstimate> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageBytes = estimate.usage || 0;
        const quotaBytes = estimate.quota || 0;
        const percentageUsed = quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0;
        return {
          quotaBytes,
          usageBytes,
          percentageUsed,
        };
      } catch (err) {
        console.warn('Storage estimate failed:', err);
      }
    }
    return {
      quotaBytes: 0,
      usageBytes: 0,
      percentageUsed: 0,
    };
  }

  public async touchHeartbeat(): Promise<void> {
    const timestamp = new Date().toISOString();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(WebKitPersistAdapter.HEARTBEAT_KEY, timestamp);
      }
    } catch {
      // Ignore if localStorage quota exceeded
    }
  }
}
