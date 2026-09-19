export type ActorRole = 'MAIN_UI' | 'DRV_ACTOR' | 'GUIA_ACTOR' | 'NURSE_ACTOR' | 'FIN_ACTOR' | 'BROADCAST';

export interface ActorMessage<T = unknown> {
  readonly id: string;
  readonly sender: ActorRole;
  readonly recipient: ActorRole;
  readonly type: string;
  readonly payload: T;
  readonly timestamp: number;
}

export interface IActorEventBusPort {
  publish<T>(message: ActorMessage<T>): Promise<void>;
  subscribe<T>(recipient: ActorRole, messageType: string, handler: (message: ActorMessage<T>) => void): () => void;
  broadcast<T>(type: string, payload: T): Promise<void>;
}
