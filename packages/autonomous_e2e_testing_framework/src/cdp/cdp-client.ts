/**
 * Direct WebSocket JSON-RPC 2.0 Chrome DevTools Protocol (CDP) Client
 * 
 * Provides low-latency, direct WebSocket communication with Chromium instances
 * adhering to Chrome DevTools Protocol specification without WebDriver overhead.
 */

import { EventEmitter } from 'node:events';

export interface CDPRequest<T = any> {
  id: number;
  method: string;
  params?: T;
  sessionId?: string;
}

export interface CDPResponse<T = any> {
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  sessionId?: string;
}

export interface CDPEvent<T = any> {
  method: string;
  params: T;
  sessionId?: string;
}

export interface CDPSessionOptions {
  timeoutMs?: number;
  autoReconnect?: boolean;
}

export interface ICDPClient {
  send<T = any>(method: string, params?: Record<string, any>, sessionId?: string): Promise<T>;
  on(eventName: string, handler: (params: any, sessionId?: string) => void): this;
  off(eventName: string, handler: (params: any, sessionId?: string) => void): this;
  once(eventName: string, handler: (params: any, sessionId?: string) => void): this;
  close(): Promise<void>;
  isConnected(): boolean;
  createSession(targetId: string): Promise<CDPSession>;
}

export interface CDPSession {
  sessionId: string;
  targetId: string;
  send<T = any>(method: string, params?: Record<string, any>): Promise<T>;
  on(eventName: string, handler: (params: any) => void): void;
  off(eventName: string, handler: (params: any) => void): void;
  detach(): Promise<void>;
}

/**
 * Direct CDP WebSocket Client
 */
export class CDPClient extends EventEmitter implements ICDPClient {
  private ws: any = null;
  private messageId: number = 0;
  private pendingRequests: Map<number, { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }> = new Map();
  private wsUrl: string;
  private connected: boolean = false;
  private defaultTimeout: number;
  private sessions: Map<string, CDPSession> = new Map();

  constructor(wsUrl: string, options: CDPSessionOptions = {}) {
    super();
    this.wsUrl = wsUrl;
    this.defaultTimeout = options.timeoutMs ?? 30000;
  }

  /**
   * Connects to the CDP WebSocket endpoint
   */
  public async connect(): Promise<void> {
    if (this.connected && this.ws) return;

    return new Promise((resolve, reject) => {
      try {
        const WebSocketImpl = (globalThis as any).WebSocket;
        if (!WebSocketImpl) {
          throw new Error('WebSocket implementation not found in runtime environment.');
        }

        this.ws = new WebSocketImpl(this.wsUrl);

        const openHandler = () => {
          this.connected = true;
          this.emit('connect');
          resolve();
        };

        const errorHandler = (err: any) => {
          if (!this.connected) {
            reject(new Error(`Failed to connect to CDP at ${this.wsUrl}: ${err?.message || err}`));
          } else {
            this.emit('error', err);
          }
        };

        const closeHandler = () => {
          this.connected = false;
          this.emit('disconnect');
          // Reject all pending requests
          for (const [id, req] of this.pendingRequests.entries()) {
            clearTimeout(req.timer);
            req.reject(new Error(`CDP connection closed before response for request id ${id}`));
          }
          this.pendingRequests.clear();
        };

        const messageHandler = (event: any) => {
          const rawData = typeof event.data === 'string' ? event.data : event.data?.toString('utf-8');
          if (!rawData) return;

          try {
            const message = JSON.parse(rawData);
            this.handleMessage(message);
          } catch (parseErr) {
            this.emit('error', new Error(`Failed to parse CDP message: ${parseErr}`));
          }
        };

        if (typeof this.ws.addEventListener === 'function') {
          this.ws.addEventListener('open', openHandler);
          this.ws.addEventListener('error', errorHandler);
          this.ws.addEventListener('close', closeHandler);
          this.ws.addEventListener('message', messageHandler);
        } else if (typeof this.ws.on === 'function') {
          this.ws.on('open', openHandler);
          this.ws.on('error', errorHandler);
          this.ws.on('close', closeHandler);
          this.ws.on('message', (data: any) => messageHandler({ data }));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Handle incoming parsed CDP JSON-RPC message
   */
  private handleMessage(msg: any): void {
    // 1. Check if it's a response to a pending request
    if (typeof msg.id === 'number') {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.id);

        if (msg.error) {
          pending.reject(new Error(`CDP Error (${msg.error.code}): ${msg.error.message}`));
        } else {
          pending.resolve(msg.result);
        }
      }
      return;
    }

    // 2. It is a CDP Event
    if (msg.method) {
      const eventName = msg.method;
      const params = msg.params || {};
      const sessionId = msg.sessionId;

      this.emit(eventName, params, sessionId);
      this.emit('*', { method: eventName, params, sessionId });

      // If sessionId is present, route to attached session
      if (sessionId && this.sessions.has(sessionId)) {
        const session = this.sessions.get(sessionId)!;
        (session as any)._emitter?.emit(eventName, params);
      }
    }
  }

  /**
   * Send JSON-RPC 2.0 command over CDP
   */
  public async send<T = any>(
    method: string,
    params: Record<string, any> = {},
    sessionId?: string,
    timeoutMs?: number
  ): Promise<T> {
    if (!this.connected || !this.ws) {
      throw new Error(`Cannot send CDP command '${method}': WebSocket is not connected.`);
    }

    const id = ++this.messageId;
    const request: CDPRequest = {
      id,
      method,
      params,
      ...(sessionId ? { sessionId } : {})
    };

    const timeout = timeoutMs ?? this.defaultTimeout;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`CDP command '${method}' (id: ${id}) timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(id, { resolve, reject, timer });

      try {
        const payload = JSON.stringify(request);
        this.ws.send(payload);
      } catch (err) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(err);
      }
    });
  }

  /**
   * Creates a dedicated CDPSession attached to a Target
   */
  public async createSession(targetId: string): Promise<CDPSession> {
    const res = await this.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId,
      flatten: true
    });

    const sessionId = res.sessionId;
    const sessionEmitter = new EventEmitter();

    const session: CDPSession = {
      sessionId,
      targetId,
      send: <T = any>(method: string, params: Record<string, any> = {}) => {
        return this.send<T>(method, params, sessionId);
      },
      on: (event: string, handler: (p: any) => void) => {
        sessionEmitter.on(event, handler);
      },
      off: (event: string, handler: (p: any) => void) => {
        sessionEmitter.off(event, handler);
      },
      detach: async () => {
        await this.send('Target.detachFromTarget', { sessionId });
        this.sessions.delete(sessionId);
        sessionEmitter.removeAllListeners();
      }
    };

    (session as any)._emitter = sessionEmitter;
    this.sessions.set(sessionId, session);
    return session;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async close(): Promise<void> {
    if (this.ws) {
      if (typeof this.ws.close === 'function') {
        this.ws.close();
      }
      this.connected = false;
      this.ws = null;
    }
  }
}

/**
 * In-memory Mock CDP Client for unit testing and offline verification
 */
export class MockCDPClient extends EventEmitter implements ICDPClient {
  public sentCommands: Array<{ method: string; params: any; sessionId?: string }> = [];
  public responses: Map<string, any> = new Map();
  private connected: boolean = true;
  private sessions: Map<string, CDPSession> = new Map();

  public isConnected(): boolean {
    return this.connected;
  }

  public mockResponse(method: string, response: any): void {
    this.responses.set(method, response);
  }

  public async send<T = any>(method: string, params: Record<string, any> = {}, sessionId?: string): Promise<T> {
    if (!this.connected) {
      throw new Error(`Mock CDP client is disconnected`);
    }
    this.sentCommands.push({ method, params, sessionId });

    if (this.responses.has(method)) {
      const resp = this.responses.get(method);
      if (typeof resp === 'function') {
        return resp(params, sessionId);
      }
      return resp;
    }

    // Default responses for standard CDP methods
    if (method === 'Target.attachToTarget') {
      return { sessionId: `mock_session_${Date.now()}` } as any;
    }
    if (method === 'Page.addScriptToEvaluateOnNewDocument') {
      return { identifier: `script_id_${Date.now()}` } as any;
    }
    if (method === 'Runtime.evaluate') {
      return { result: { type: 'undefined' } } as any;
    }

    return {} as T;
  }

  public simulateEvent(method: string, params: any, sessionId?: string): void {
    this.emit(method, params, sessionId);
    this.emit('*', { method, params, sessionId });
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      (session as any)._emitter?.emit(method, params);
    }
  }

  public async createSession(targetId: string): Promise<CDPSession> {
    const sessionId = `session_${targetId}_${Date.now()}`;
    const sessionEmitter = new EventEmitter();
    const session: CDPSession = {
      sessionId,
      targetId,
      send: <T = any>(method: string, params: Record<string, any> = {}) => {
        return this.send<T>(method, params, sessionId);
      },
      on: (event: string, handler: (p: any) => void) => {
        sessionEmitter.on(event, handler);
      },
      off: (event: string, handler: (p: any) => void) => {
        sessionEmitter.off(event, handler);
      },
      detach: async () => {
        this.sessions.delete(sessionId);
      }
    };
    (session as any)._emitter = sessionEmitter;
    this.sessions.set(sessionId, session);
    return session;
  }

  public async close(): Promise<void> {
    this.connected = false;
  }
}
