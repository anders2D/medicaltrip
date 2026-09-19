/**
 * Medical Trip Colombia S.A.S. - ActorPool
 * Multi-Agent Swarm Concurrency Manager implementing IActorEventBusPort.
 * Manages Web Worker lifecycles, point-to-point MessageChannel mesh topology,
 * CRDT state sync (PNCounter, LWWElementSet), and seamless Node.js/Vitest test fallback.
 */

import { ActorMessage, ActorRole, IActorEventBusPort } from '../domain/IActorEventBusPort';
import { handleDriverMessage, DriverPayload } from './driverActor.worker';
import { handleGuideMessage, GuidePayload } from './guideActor.worker';
import { handleNurseMessage, NursePayload } from './nurseActor.worker';
import { handleFinancialAuditorMessage, FinancialAuditorPayload } from './financialAuditorActor.worker';
import { PNCounter } from '@/core/infrastructure';
import { LWWElementSet } from '@/core/infrastructure';

export type ActorStatusType = 'IDLE' | 'BUSY' | 'READY' | 'ERROR';

export interface ActorNodeStatus {
  role: ActorRole;
  status: ActorStatusType;
  messagesProcessed: number;
  lastActiveTimestamp: number;
  lastError?: string;
}

export interface SwarmStatusInfo {
  actors: Record<ActorRole, ActorNodeStatus>;
  isMeshConnected: boolean;
  totalMessagesRouted: number;
  crdtPNCounterValue: number;
  crdtLWWSetSize: number;
  isWorkerEnvironment: boolean;
}

type MessageSubscriptionHandler = (message: ActorMessage<any>) => void;

export class ActorPool implements IActorEventBusPort {
  private static instance: ActorPool | null = null;

  private workers: Partial<Record<ActorRole, Worker>> = {};
  private subscriptions: Map<string, Set<MessageSubscriptionHandler>> = new Map();
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timeout: any }> = new Map();

  private actorStatuses: Record<ActorRole, ActorNodeStatus> = {
    MAIN_UI: { role: 'MAIN_UI', status: 'READY', messagesProcessed: 0, lastActiveTimestamp: Date.now() },
    DRV_ACTOR: { role: 'DRV_ACTOR', status: 'READY', messagesProcessed: 0, lastActiveTimestamp: Date.now() },
    GUIA_ACTOR: { role: 'GUIA_ACTOR', status: 'READY', messagesProcessed: 0, lastActiveTimestamp: Date.now() },
    NURSE_ACTOR: { role: 'NURSE_ACTOR', status: 'READY', messagesProcessed: 0, lastActiveTimestamp: Date.now() },
    FIN_ACTOR: { role: 'FIN_ACTOR', status: 'READY', messagesProcessed: 0, lastActiveTimestamp: Date.now() },
    BROADCAST: { role: 'BROADCAST', status: 'READY', messagesProcessed: 0, lastActiveTimestamp: Date.now() },
  };

  private isWorkerSupported: boolean = false;
  private totalMessagesRouted: number = 0;

  // CRDT State Synchronization Engine
  public readonly pnCounter: PNCounter;
  public readonly lwwSet: LWWElementSet<string>;

  constructor() {
    this.pnCounter = new PNCounter('MAIN_UI');
    this.lwwSet = new LWWElementSet<string>();

    this.isWorkerSupported = typeof window !== 'undefined' && typeof Worker !== 'undefined';
    this.initializeMesh();
  }

  public static getInstance(): ActorPool {
    if (!ActorPool.instance) {
      ActorPool.instance = new ActorPool();
    }
    return ActorPool.instance;
  }

  /**
   * Initializes Web Worker instances and MessageChannel point-to-point connections if available.
   */
  private initializeMesh(): void {
    if (!this.isWorkerSupported) {
      // In Node / Vitest test runners: Use direct synchronous/asynchronous execution engine
      return;
    }

    try {
      // Initialize browser Web Workers
      const drvWorker = new Worker(new URL('./driverActor.worker.ts', import.meta.url), { type: 'module' });
      const guiaWorker = new Worker(new URL('./guideActor.worker.ts', import.meta.url), { type: 'module' });
      const nurseWorker = new Worker(new URL('./nurseActor.worker.ts', import.meta.url), { type: 'module' });
      const finWorker = new Worker(new URL('./financialAuditorActor.worker.ts', import.meta.url), { type: 'module' });

      this.workers.DRV_ACTOR = drvWorker;
      this.workers.GUIA_ACTOR = guiaWorker;
      this.workers.NURSE_ACTOR = nurseWorker;
      this.workers.FIN_ACTOR = finWorker;

      // Attach message listeners
      Object.entries(this.workers).forEach(([role, worker]) => {
        if (worker) {
          worker.onmessage = (event: MessageEvent<ActorMessage>) => {
            this.handleWorkerIncomingMessage(event.data);
          };
          worker.onerror = (err) => {
            console.error(`Worker error in ${role}:`, err);
            this.actorStatuses[role as ActorRole].status = 'ERROR';
            this.actorStatuses[role as ActorRole].lastError = err.message || 'Worker error';
          };
        }
      });

      // Setup Point-to-Point MessageChannels between workers
      this.setupPointToPointChannels();
    } catch (e) {
      // Fallback gracefully to direct execution if worker initialization throws
      console.warn('Web Worker initialization fallback to direct execution:', e);
      this.isWorkerSupported = false;
    }
  }

  /**
   * Creates point-to-point MessageChannels between pairs of actors.
   */
  private setupPointToPointChannels(): void {
    if (typeof MessageChannel === 'undefined') return;

    const connectPair = (roleA: ActorRole, roleB: ActorRole) => {
      const workerA = this.workers[roleA];
      const workerB = this.workers[roleB];
      if (!workerA || !workerB) return;

      try {
        const channel = new MessageChannel();
        workerA.postMessage({ type: 'CONNECT_CHANNEL', peer: roleB }, [channel.port1]);
        workerB.postMessage({ type: 'CONNECT_CHANNEL', peer: roleA }, [channel.port2]);
      } catch {
        // Safe ignore
      }
    };

    connectPair('DRV_ACTOR', 'GUIA_ACTOR');
    connectPair('DRV_ACTOR', 'NURSE_ACTOR');
    connectPair('DRV_ACTOR', 'FIN_ACTOR');
    connectPair('GUIA_ACTOR', 'FIN_ACTOR');
    connectPair('NURSE_ACTOR', 'FIN_ACTOR');
  }

  /**
   * Internal message dispatcher when receiving response from Web Worker.
   */
  private handleWorkerIncomingMessage(message: ActorMessage): void {
    this.totalMessagesRouted++;
    this.pnCounter.increment(1);

    const senderStatus = this.actorStatuses[message.sender];
    if (senderStatus) {
      senderStatus.messagesProcessed++;
      senderStatus.lastActiveTimestamp = Date.now();
      senderStatus.status = 'READY';
    }

    // Check if matching a pending request
    if (message.id && message.id.startsWith('RESP_')) {
      const originalId = message.id.replace('RESP_', '');
      const pending = this.pendingRequests.get(originalId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(originalId);
        pending.resolve(message.payload);
      }
    }

    // Trigger registered subscribers
    this.notifySubscribers(message);
  }

  /**
   * Publishes an actor message into the swarm event bus.
   */
  public async publish<T>(message: ActorMessage<T>): Promise<void> {
    this.totalMessagesRouted++;
    this.pnCounter.increment(1);
    this.lwwSet.add(`MSG_${message.id}_${message.type}`, message.timestamp);

    const senderStatus = this.actorStatuses[message.sender];
    if (senderStatus) {
      senderStatus.messagesProcessed++;
      senderStatus.lastActiveTimestamp = Date.now();
    }

    const recipientStatus = this.actorStatuses[message.recipient];
    if (recipientStatus) {
      recipientStatus.status = 'BUSY';
    }

    this.notifySubscribers(message);

    if (this.isWorkerSupported && this.workers[message.recipient]) {
      this.workers[message.recipient]!.postMessage(message);
    } else {
      // Direct execution mode for Node / Vitest and local actors
      const response = await this.executeDirectly(message);
      if (response) {
        const targetStatus = this.actorStatuses[response.sender];
        if (targetStatus) {
          targetStatus.messagesProcessed++;
          targetStatus.lastActiveTimestamp = Date.now();
          targetStatus.status = 'READY';
        }
        this.notifySubscribers(response);
      }
    }
  }

  /**
   * Broadcasts a message to all actors and subscribers.
   */
  public async broadcast<T>(type: string, payload: T): Promise<void> {
    const broadcastMsg: ActorMessage<T> = {
      id: `BC_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: 'MAIN_UI',
      recipient: 'BROADCAST',
      type,
      payload,
      timestamp: Date.now(),
    };

    this.totalMessagesRouted++;
    this.pnCounter.increment(1);

    if (this.isWorkerSupported) {
      Object.values(this.workers).forEach((worker) => {
        if (worker) worker.postMessage(broadcastMsg);
      });
    }

    this.notifySubscribers(broadcastMsg);
  }

  /**
   * Subscribes a handler to messages destined for a specific recipient or type.
   */
  public subscribe<T>(
    recipient: ActorRole,
    messageType: string,
    handler: (message: ActorMessage<T>) => void
  ): () => void {
    const subscriptionKey = `${recipient}:${messageType}`;
    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }

    const handlersSet = this.subscriptions.get(subscriptionKey)!;
    const genericHandler = handler as MessageSubscriptionHandler;
    handlersSet.add(genericHandler);

    return () => {
      handlersSet.delete(genericHandler);
      if (handlersSet.size === 0) {
        this.subscriptions.delete(subscriptionKey);
      }
    };
  }

  private notifySubscribers(message: ActorMessage): void {
    const exactKey = `${message.recipient}:${message.type}`;
    const broadcastKey = `BROADCAST:${message.type}`;
    const wildcardKey = `${message.recipient}:*`;
    const allBroadcastKey = `BROADCAST:*`;

    const triggerKeys = [exactKey, broadcastKey, wildcardKey, allBroadcastKey];

    triggerKeys.forEach((k) => {
      const set = this.subscriptions.get(k);
      if (set) {
        set.forEach((fn) => {
          try {
            fn(message);
          } catch (e) {
            console.error(`Error in actor subscriber handler for key ${k}:`, e);
          }
        });
      }
    });
  }

  /**
   * Dispatches a typed task to a specific actor and awaits the structured response.
   */
  public async dispatchTask<TPayload = unknown, TResult = unknown>(
    targetActor: ActorRole,
    action: string,
    data: TPayload,
    timeoutMs: number = 8000
  ): Promise<TResult> {
    const taskId = `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const msg: ActorMessage<any> = {
      id: taskId,
      sender: 'MAIN_UI',
      recipient: targetActor,
      type: `${targetActor}_TASK_${action}`,
      payload: { action, data },
      timestamp: Date.now(),
    };

    if (!this.isWorkerSupported || !this.workers[targetActor]) {
      // Direct synchronous / asynchronous execution
      this.totalMessagesRouted++;
      this.pnCounter.increment(1);
      this.lwwSet.add(`MSG_${msg.id}_${msg.type}`, msg.timestamp);

      const senderStatus = this.actorStatuses[msg.sender];
      if (senderStatus) {
        senderStatus.messagesProcessed++;
        senderStatus.lastActiveTimestamp = Date.now();
      }

      const resp = await this.executeDirectly(msg);
      if (resp) {
        const targetStatus = this.actorStatuses[resp.sender];
        if (targetStatus) {
          targetStatus.messagesProcessed++;
          targetStatus.lastActiveTimestamp = Date.now();
          targetStatus.status = 'READY';
        }
      }

      if (resp && resp.payload) {
        const payload = resp.payload as any;
        if (payload.success === false && payload.error) {
          throw new Error(payload.error);
        }
        return (payload.result !== undefined ? payload.result : payload) as TResult;
      }
      throw new Error(`No response received from direct actor execution: ${targetActor}`);
    }

    // Web Worker async promise resolution
    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(taskId);
        reject(new Error(`Actor task timeout for ${targetActor}.${action} after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(taskId, {
        resolve: (payload: any) => {
          if (payload.success === false && payload.error) {
            reject(new Error(payload.error));
          } else {
            resolve(payload.result !== undefined ? payload.result : payload);
          }
        },
        reject,
        timeout,
      });

      this.publish(msg);
    });
  }

  /**
   * Direct execution fallback for Node/Vitest tests and non-worker environments.
   */
  private async executeDirectly(message: ActorMessage<any>): Promise<ActorMessage<any> | null> {
    switch (message.recipient) {
      case 'DRV_ACTOR':
        return handleDriverMessage(message as ActorMessage<DriverPayload>);

      case 'GUIA_ACTOR':
        return handleGuideMessage(message as ActorMessage<GuidePayload>);

      case 'NURSE_ACTOR':
        return handleNurseMessage(message as ActorMessage<NursePayload>);

      case 'FIN_ACTOR':
        return handleFinancialAuditorMessage(message as ActorMessage<FinancialAuditorPayload>);

      case 'MAIN_UI':
      case 'BROADCAST':
      default:
        return null;
    }
  }

  /**
   * Returns live diagnostic status of the actor swarm.
   */
  public getStatus(): SwarmStatusInfo {
    return {
      actors: { ...this.actorStatuses },
      isMeshConnected: true,
      totalMessagesRouted: this.totalMessagesRouted,
      crdtPNCounterValue: this.pnCounter.value(),
      crdtLWWSetSize: this.lwwSet.size(),
      isWorkerEnvironment: this.isWorkerSupported,
    };
  }

  /**
   * Resets all metrics and subscriptions (useful for unit testing).
   */
  public reset(): void {
    this.subscriptions.clear();
    this.pendingRequests.clear();
    this.totalMessagesRouted = 0;
  }
}
