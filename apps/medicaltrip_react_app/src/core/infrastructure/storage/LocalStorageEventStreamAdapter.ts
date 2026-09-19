/**
 * Medical Trip Colombia S.A.S. - LocalStorage Event Stream Adapter
 * Append-only mutation log and vector clock sequence manager in LocalStorage for instantaneous disaster recovery.
 */

import { DomainEventRecord } from '../../../core/ports/IStoragePort';

export class LocalStorageEventStreamAdapter {
  private static readonly STORAGE_PREFIX = 'mt_events_';
  private static readonly VECTOR_CLOCK_KEY = 'mt_vector_clock';
  private memoryFallback = new Map<string, string>();

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return this.memoryFallback.get(key) || null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.set(key, value);
  }

  private removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback
    }
    this.memoryFallback.delete(key);
  }

  public append(entry: DomainEventRecord): void {
    const key = `${LocalStorageEventStreamAdapter.STORAGE_PREFIX}${entry.bookingId}`;
    const existingRaw = this.getItem(key);
    const existing: DomainEventRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.push(entry);
    this.setItem(key, JSON.stringify(existing));

    // Update global vector clock
    this.incrementVectorClock(entry.bookingId);
  }

  public getEvents(bookingId: string): DomainEventRecord[] {
    const key = `${LocalStorageEventStreamAdapter.STORAGE_PREFIX}${bookingId}`;
    const existingRaw = this.getItem(key);
    if (!existingRaw) return [];
    try {
      return JSON.parse(existingRaw);
    } catch {
      return [];
    }
  }

  public getVectorClock(bookingId: string): number {
    const clockRaw = this.getItem(LocalStorageEventStreamAdapter.VECTOR_CLOCK_KEY);
    if (!clockRaw) return 0;
    try {
      const clocks = JSON.parse(clockRaw);
      return clocks[bookingId] || 0;
    } catch {
      return 0;
    }
  }

  private incrementVectorClock(bookingId: string): void {
    const clockRaw = this.getItem(LocalStorageEventStreamAdapter.VECTOR_CLOCK_KEY);
    const clocks: Record<string, number> = clockRaw ? JSON.parse(clockRaw) : {};
    clocks[bookingId] = (clocks[bookingId] || 0) + 1;
    this.setItem(LocalStorageEventStreamAdapter.VECTOR_CLOCK_KEY, JSON.stringify(clocks));
  }

  public clear(bookingId?: string): void {
    if (bookingId) {
      this.removeItem(`${LocalStorageEventStreamAdapter.STORAGE_PREFIX}${bookingId}`);
    } else {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const keysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && (k.startsWith(LocalStorageEventStreamAdapter.STORAGE_PREFIX) || k === LocalStorageEventStreamAdapter.VECTOR_CLOCK_KEY)) {
              keysToRemove.push(k);
            }
          }
          for (const k of keysToRemove) {
            window.localStorage.removeItem(k);
          }
        }
      } catch {
        // Fallback
      }
      this.memoryFallback.clear();
    }
  }
}
