/**
 * Actors Subsystem Barrel Export
 * Medical Trip Colombia S.A.S. — Milestone 4 Decentralized Actor Model
 * 
 * Exports all Web Worker actors, CRDT synchronization primitives, and
 * the ActorMeshController coordinator.
 * 0 external framework dependencies.
 */

// CRDT State Synchronization Primitives
export {
  CRDTPNCounter,
  CRDTLWWElementSet,
  CRDTObservedRemoveSet,
  CRDTActorState
} from './crdt-state-sync.js';

// Decentralized Field & Financial Actors
export { DriverActor } from './workers/driver-actor.worker.js';
export { GuideActor } from './workers/guide-actor.worker.js';
export { NurseActor } from './workers/nurse-actor.worker.js';
export { FinancialAuditorActor, GENESIS_HASH } from './workers/financial-auditor.worker.js';

// Actor Mesh Controller & Messaging
export {
  ActorMeshController,
  SimulatedMessageChannel,
  SimulatedMessagePort,
  createChannel
} from './actor-mesh-controller.js';
