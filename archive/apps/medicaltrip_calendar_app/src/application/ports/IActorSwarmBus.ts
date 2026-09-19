export type AgentRole = 'DRV' | 'GUIA' | 'NURSE' | 'FIN' | 'COORD';

export interface SwarmMessage<T = unknown> {
  id: string;
  sender: AgentRole;
  recipient?: AgentRole | 'BROADCAST';
  topic: string;
  payload: T;
  timestamp: string;
}

export type MessageHandler<T = unknown> = (msg: SwarmMessage<T>) => void | Promise<void>;

export interface IActorSwarmBus {
  postMessageToAgent<T = unknown>(agentRole: AgentRole, message: SwarmMessage<T>): Promise<void>;
  broadcast<T = unknown>(message: SwarmMessage<T>): Promise<void>;
  subscribe<T = unknown>(agentRole: AgentRole | 'BROADCAST', handler: MessageHandler<T>): () => void;
}
