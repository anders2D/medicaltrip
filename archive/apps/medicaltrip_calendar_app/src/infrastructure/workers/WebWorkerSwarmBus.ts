import {
  AgentRole,
  IActorSwarmBus,
  MessageHandler,
  SwarmMessage,
} from '../../application/ports/IActorSwarmBus';
import { processDriverAction } from './driverWorker';
import { processGuideAction } from './guideWorker';
import { processNurseAction } from './nurseWorker';
import { processFinancialAction, buildHashChain, verifyHashChain, sha256Sync, AuditBlock } from './financialAuditorWorker';

// ============================================================================
// CRDT Implementations: LWW-Element-Set & PN-Counter
// ============================================================================

export interface LWWEntry<T> {
  element: T;
  timestamp: number; // epoch ms
}

/**
 * Conflict-Free Replicated Data Type: Last-Write-Wins Element Set (LWW-Element-Set)
 * Implements deterministic bias where add wins on timestamp ties (add-bias).
 */
export class LWWElementSet<T = any> {
  private readonly addSet: Map<string, LWWEntry<T>> = new Map();
  private readonly removeSet: Map<string, LWWEntry<T>> = new Map();
  private readonly keySelector: (item: T) => string;

  constructor(keySelector: (item: T) => string = (item: any) => item?.id || JSON.stringify(item)) {
    this.keySelector = keySelector;
  }

  /**
   * Adds an element to the set with a given timestamp.
   */
  add(element: T, timestamp: Date | string | number = Date.now()): void {
    const key = this.keySelector(element);
    const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    const existing = this.addSet.get(key);
    if (!existing || ts >= existing.timestamp) {
      this.addSet.set(key, { element, timestamp: ts });
    }
  }

  /**
   * Removes an element from the set with a given timestamp.
   */
  remove(element: T, timestamp: Date | string | number = Date.now()): void {
    const key = this.keySelector(element);
    const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    const existing = this.removeSet.get(key);
    if (!existing || ts >= existing.timestamp) {
      this.removeSet.set(key, { element, timestamp: ts });
    }
  }

  /**
   * Returns true if the element is currently in the set (add timestamp >= remove timestamp).
   */
  has(element: T): boolean {
    const key = this.keySelector(element);
    const addEntry = this.addSet.get(key);
    if (!addEntry) return false;

    const removeEntry = this.removeSet.get(key);
    if (!removeEntry) return true;

    // Add bias: if add timestamp >= remove timestamp, element is present
    return addEntry.timestamp >= removeEntry.timestamp;
  }

  /**
   * Returns all active elements in the set.
   */
  read(): T[] {
    const active: T[] = [];
    for (const [key, addEntry] of this.addSet.entries()) {
      const removeEntry = this.removeSet.get(key);
      if (!removeEntry || addEntry.timestamp >= removeEntry.timestamp) {
        active.push(addEntry.element);
      }
    }
    return active;
  }

  /**
   * Merges state with another LWW-Element-Set.
   */
  merge(other: LWWElementSet<T>): LWWElementSet<T> {
    const merged = new LWWElementSet<T>(this.keySelector);

    // Merge add sets (taking max timestamp)
    for (const [k, v] of this.addSet.entries()) {
      merged.add(v.element, v.timestamp);
    }
    for (const [k, v] of other.addSet.entries()) {
      merged.add(v.element, v.timestamp);
    }

    // Merge remove sets (taking max timestamp)
    for (const [k, v] of this.removeSet.entries()) {
      merged.remove(v.element, v.timestamp);
    }
    for (const [k, v] of other.removeSet.entries()) {
      merged.remove(v.element, v.timestamp);
    }

    return merged;
  }

  toJSON(): { addSet: Array<LWWEntry<T>>; removeSet: Array<LWWEntry<T>> } {
    return {
      addSet: Array.from(this.addSet.values()),
      removeSet: Array.from(this.removeSet.values()),
    };
  }

  static fromJSON<T>(json: { addSet: Array<LWWEntry<T>>; removeSet: Array<LWWEntry<T>> }, keySelector?: (item: T) => string): LWWElementSet<T> {
    const set = new LWWElementSet<T>(keySelector);
    for (const item of json.addSet || []) {
      set.add(item.element, item.timestamp);
    }
    for (const item of json.removeSet || []) {
      set.remove(item.element, item.timestamp);
    }
    return set;
  }
}

/**
 * Conflict-Free Replicated Data Type: Positive-Negative Counter (PN-Counter)
 */
export class PNCounter {
  private readonly pVector: Map<string, number> = new Map();
  private readonly nVector: Map<string, number> = new Map();

  increment(nodeId: string, amount = 1): void {
    const current = this.pVector.get(nodeId) || 0;
    this.pVector.set(nodeId, current + Math.max(0, amount));
  }

  decrement(nodeId: string, amount = 1): void {
    const current = this.nVector.get(nodeId) || 0;
    this.nVector.set(nodeId, current + Math.max(0, amount));
  }

  value(): number {
    let pSum = 0;
    let nSum = 0;
    for (const val of this.pVector.values()) pSum += val;
    for (const val of this.nVector.values()) nSum += val;
    return pSum - nSum;
  }

  merge(other: PNCounter): PNCounter {
    const merged = new PNCounter();

    const allPNodes = new Set([...this.pVector.keys(), ...other.pVector.keys()]);
    for (const node of allPNodes) {
      const v1 = this.pVector.get(node) || 0;
      const v2 = other.pVector.get(node) || 0;
      merged.pVector.set(node, Math.max(v1, v2));
    }

    const allNNodes = new Set([...this.nVector.keys(), ...other.nVector.keys()]);
    for (const node of allNNodes) {
      const v1 = this.nVector.get(node) || 0;
      const v2 = other.nVector.get(node) || 0;
      merged.nVector.set(node, Math.max(v1, v2));
    }

    return merged;
  }

  toJSON(): { pVector: Record<string, number>; nVector: Record<string, number>; value: number } {
    return {
      pVector: Object.fromEntries(this.pVector.entries()),
      nVector: Object.fromEntries(this.nVector.entries()),
      value: this.value(),
    };
  }
}

// ============================================================================
// WebWorkerSwarmBus Implementation
// ============================================================================

export class WebWorkerSwarmBus implements IActorSwarmBus {
  private readonly subscribers: Map<AgentRole | 'BROADCAST', Set<MessageHandler>> = new Map();
  private readonly messageHistory: SwarmMessage[] = [];
  private readonly meshChannels: Map<string, MessageChannel> = new Map();

  constructor() {
    // Initialize subscriber registry
    const roles: Array<AgentRole | 'BROADCAST'> = ['DRV', 'GUIA', 'NURSE', 'FIN', 'COORD', 'BROADCAST'];
    for (const r of roles) {
      this.subscribers.set(r, new Set());
    }
  }

  /**
   * Posts a message to a specific subagent role or invokes inline handler.
   */
  async postMessageToAgent<T = unknown>(agentRole: AgentRole, message: SwarmMessage<T>): Promise<void> {
    this.messageHistory.push(message);

    // 1. Deliver to any registered subscribers on the role channel
    const roleSubs = this.subscribers.get(agentRole) || new Set();
    const deliveryPromises: Promise<void>[] = [];

    for (const handler of roleSubs) {
      try {
        const res = handler(message);
        if (res instanceof Promise) {
          deliveryPromises.push(res);
        }
      } catch (err) {
        console.error(`[WebWorkerSwarmBus]: Error delivering message to ${agentRole}:`, err);
      }
    }

    await Promise.all(deliveryPromises);
  }

  /**
   * Broadcasts a message to all subagents and coordinators in the swarm.
   */
  async broadcast<T = unknown>(message: SwarmMessage<T>): Promise<void> {
    this.messageHistory.push({ ...message, recipient: 'BROADCAST' });

    const allSubs = new Set<MessageHandler>();
    for (const set of this.subscribers.values()) {
      for (const h of set) {
        allSubs.add(h);
      }
    }

    const promises: Promise<void>[] = [];
    for (const handler of allSubs) {
      try {
        const res = handler(message);
        if (res instanceof Promise) {
          promises.push(res);
        }
      } catch (err) {
        console.error('[WebWorkerSwarmBus]: Broadcast delivery error:', err);
      }
    }

    await Promise.all(promises);
  }

  /**
   * Subscribes a listener callback to messages intended for a specific AgentRole or BROADCAST.
   */
  subscribe<T = unknown>(agentRole: AgentRole | 'BROADCAST', handler: MessageHandler<T>): () => void {
    if (!this.subscribers.has(agentRole)) {
      this.subscribers.set(agentRole, new Set());
    }
    const set = this.subscribers.get(agentRole)!;
    set.add(handler as MessageHandler);

    return () => {
      set.delete(handler as MessageHandler);
    };
  }

  /**
   * Creates a dedicated point-to-point MessageChannel mesh link between two agents.
   */
  createPointToPointChannel(agentA: AgentRole, agentB: AgentRole): MessageChannel | null {
    if (typeof globalThis.MessageChannel === 'undefined') {
      return null;
    }

    const key = [agentA, agentB].sort().join('<->');
    if (!this.meshChannels.has(key)) {
      const channel = new globalThis.MessageChannel();
      this.meshChannels.set(key, channel);
    }

    return this.meshChannels.get(key)!;
  }

  /**
   * Executes a synchronous or asynchronous task directly via the subagent logic.
   * Works consistently in both Web Worker and headless Node/Vitest test environments.
   */
  async executeAgentTask<TReq = any, TRes = any>(
    agentRole: AgentRole,
    action: string,
    payload: TReq
  ): Promise<TRes> {
    switch (agentRole) {
      case 'DRV':
        return processDriverAction(action, payload);
      case 'GUIA':
        return processGuideAction(action, payload);
      case 'NURSE':
        return processNurseAction(action, payload);
      case 'FIN':
        return processFinancialAction(action, payload);
      default:
        throw new Error(`[WebWorkerSwarmBus]: Unsupported agent role '${agentRole}' for task execution.`);
    }
  }

  /**
   * Builds an immutable cryptographic SHA-256 hash chain for audit logs.
   */
  buildAuditChain(transactions: any[]): AuditBlock[] {
    return buildHashChain(transactions);
  }

  /**
   * Verifies the cryptographic integrity of an audit ledger hash chain.
   */
  verifyAuditChain(blocks: AuditBlock[]) {
    return verifyHashChain(blocks);
  }

  /**
   * Generates a SHA-256 hash.
   */
  hash(data: string | object): string {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return sha256Sync(payload);
  }

  /**
   * Returns copy of message history.
   */
  getMessageHistory(): readonly SwarmMessage[] {
    return [...this.messageHistory];
  }
}

// Global default singleton instance
export const swarmBus = new WebWorkerSwarmBus();
