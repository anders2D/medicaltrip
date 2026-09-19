import { DomainError } from '../errors/domain-error.js';

/**
 * Abstract Port: IActorEventBusPort
 * Concurrency contract for inter-actor message passing and event dispatching across Web Workers.
 */
export class IActorEventBusPort {
  /**
   * Publishes an event to all subscribers and worker channels.
   * @param {import('../value-objects/actor-event.js').ActorEvent} _event
   * @returns {Promise<void>}
   */
  async publish(_event) {
    throw new DomainError('[IActorEventBusPort] publish no ha sido implementado en el adaptador.');
  }

  /**
   * Subscribes to events of a specific type or wildcard '*'.
   * @param {string} _eventType
   * @param {(event: import('../value-objects/actor-event.js').ActorEvent) => Promise<void> | void} _handler
   * @returns {() => void} Unsubscribe function
   */
  subscribe(_eventType, _handler) {
    throw new DomainError('[IActorEventBusPort] subscribe no ha sido implementado en el adaptador.');
  }

  /**
   * Sends a targeted message to a specific actor worker.
   * @param {string} _targetActorId
   * @param {Record<string, any>} _message
   * @returns {Promise<void>}
   */
  async sendActorMessage(_targetActorId, _message) {
    throw new DomainError('[IActorEventBusPort] sendActorMessage no ha sido implementado en el adaptador.');
  }

  /**
   * Registers a worker channel for a designated actor.
   * @param {string} _actorId
   * @param {any} _channel
   */
  registerActor(_actorId, _channel) {
    throw new DomainError('[IActorEventBusPort] registerActor no ha sido implementado en el adaptador.');
  }
}
