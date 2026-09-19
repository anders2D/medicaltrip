/**
 * Medical Trip Colombia S.A.S. - LWWElementSet (Last-Write-Wins Element Set)
 * State-based Conflict-Free Replicated Data Type (CvRDT) with deterministic Add-Bias.
 * Enables concurrent offline updates across mobile field devices with monotonic convergence.
 */

function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalStringify(val);
  });
  return '{' + pairs.join(',') + '}';
}

export interface LWWSerializedState<T> {
  addSet: Array<{ element: T; timestamp: number }>;
  removeSet: Array<{ element: T; timestamp: number }>;
}

export class LWWElementSet<T = unknown> {
  // Map of canonical string key -> { element: T, timestamp: number }
  private addMap: Map<string, { element: T; timestamp: number }> = new Map();
  private removeMap: Map<string, { element: T; timestamp: number }> = new Map();

  constructor(initialState?: LWWSerializedState<T>) {
    if (initialState) {
      for (const item of initialState.addSet || []) {
        const key = this.serializeKey(item.element);
        this.addMap.set(key, { element: item.element, timestamp: item.timestamp });
      }
      for (const item of initialState.removeSet || []) {
        const key = this.serializeKey(item.element);
        this.removeMap.set(key, { element: item.element, timestamp: item.timestamp });
      }
    }
  }

  private serializeKey(element: T): string {
    if (element === null || typeof element !== 'object') {
      return String(element);
    }
    return canonicalStringify(element);
  }

  /**
   * Adds an element to the set with a specified or current timestamp.
   */
  public add(element: T, timestamp: number = Date.now()): void {
    const key = this.serializeKey(element);
    const existing = this.addMap.get(key);
    if (!existing || timestamp > existing.timestamp) {
      this.addMap.set(key, { element, timestamp });
    }
  }

  /**
   * Removes an element from the set with a specified or current timestamp.
   */
  public remove(element: T, timestamp: number = Date.now()): void {
    const key = this.serializeKey(element);
    const existing = this.removeMap.get(key);
    if (!existing || timestamp > existing.timestamp) {
      this.removeMap.set(key, { element, timestamp });
    }
  }

  /**
   * Checks if an element is currently in the set using Add-Bias.
   * An element is in the set iff:
   * 1. It is present in the Add Set.
   * 2. It is either not present in the Remove Set, OR its Add timestamp >= its Remove timestamp.
   */
  public has(element: T): boolean {
    const key = this.serializeKey(element);
    const addEntry = this.addMap.get(key);
    if (!addEntry) {
      return false;
    }

    const removeEntry = this.removeMap.get(key);
    if (!removeEntry) {
      return true;
    }

    // Add-bias tie breaker: if timestamps are identical, ADD wins
    return addEntry.timestamp >= removeEntry.timestamp;
  }

  /**
   * Returns all active elements currently belonging to the set.
   */
  public elements(): T[] {
    const result: T[] = [];
    for (const [key, addEntry] of this.addMap.entries()) {
      const removeEntry = this.removeMap.get(key);
      if (!removeEntry || addEntry.timestamp >= removeEntry.timestamp) {
        result.push(addEntry.element);
      }
    }
    return result;
  }

  /**
   * Returns the count of active elements in the set.
   */
  public size(): number {
    return this.elements().length;
  }

  /**
   * Monotonically merges this set with another replica, taking the max timestamp for every entry.
   * Returns a brand-new converged LWWElementSet instance.
   */
  public merge(other: LWWElementSet<T>): LWWElementSet<T> {
    const merged = new LWWElementSet<T>();

    // Merge Add Sets
    for (const [key, entry] of this.addMap.entries()) {
      merged.addMap.set(key, { ...entry });
    }
    for (const [key, entry] of other.addMap.entries()) {
      const existing = merged.addMap.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        merged.addMap.set(key, { ...entry });
      }
    }

    // Merge Remove Sets
    for (const [key, entry] of this.removeMap.entries()) {
      merged.removeMap.set(key, { ...entry });
    }
    for (const [key, entry] of other.removeMap.entries()) {
      const existing = merged.removeMap.get(key);
      if (!existing || entry.timestamp > existing.timestamp) {
        merged.removeMap.set(key, { ...entry });
      }
    }

    return merged;
  }

  /**
   * Serializes current state to plain object for network/storage transport.
   */
  public getState(): LWWSerializedState<T> {
    return {
      addSet: Array.from(this.addMap.values()),
      removeSet: Array.from(this.removeMap.values()),
    };
  }

  public toJSON(): string {
    return JSON.stringify(this.getState());
  }

  public static fromJSON<T>(json: string): LWWElementSet<T> {
    const parsed = JSON.parse(json) as LWWSerializedState<T>;
    return new LWWElementSet<T>(parsed);
  }
}
