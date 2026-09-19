/**
 * [DRV] Driver Actor Web Worker
 * Medical Trip Colombia S.A.S. — Milestone 4 Actor Model
 * 
 * Specialized field actor representing private chauffeurs & transport logistics:
 * e.g., Ramón Rosero / Aeroturex Kia Sonet NLX666.
 * 
 * Handles transfers, origin/destination check-ins, toll submissions, and direct
 * point-to-point communication with the Financial Auditor and Guide actors.
 * 0 external framework dependencies.
 */

import { OperativeTerritory } from '../../domain/value-objects/operative-territory.js';
import { LocationCoordinate } from '../../domain/value-objects/location-coordinate.js';
import { ActorEvent } from '../../domain/value-objects/actor-event.js';
import { CRDTActorState } from '../crdt-state-sync.js';

function validateTerritory(location) {
  if (!location) return;
  if (typeof location === 'string') {
    new OperativeTerritory(location);
  } else if (typeof location === 'object') {
    if (location.lat !== undefined && location.lng !== undefined) {
      new OperativeTerritory({ lat: Number(location.lat), lng: Number(location.lng) });
    } else if (location.zoneName) {
      new OperativeTerritory(location.zoneName);
    }
  }
}

export class DriverActor {
  /** @type {string} */
  actorId;
  /** @type {string} */
  actorRole;
  /** @type {string} */
  driverName;
  /** @type {string} */
  vehicle;
  /** @type {string} */
  status;
  /** @type {object|null} */
  activeTransfer;
  /** @type {object|null} */
  currentLocation;
  /** @type {Array<object>} */
  completedTransfers;
  /** @type {Array<object>} */
  submittedTolls;
  /** @type {CRDTActorState} */
  crdtState;
  /** @type {any|null} */
  finPort;
  /** @type {any|null} */
  guidePort;
  /** @type {any|null} */
  mainPort;
  /** @type {Array<Function>} */
  #listeners;

  /**
   * @param {object} [config]
   */
  constructor(config = {}) {
    this.actorId = config.actorId || 'ACTOR-DRV-RAMON';
    this.actorRole = 'DRIVER';
    this.driverName = config.driverName || 'Ramón Rosero';
    this.vehicle = config.vehicle || 'Aeroturex Kia Sonet NLX666';
    this.status = 'IDLE'; // IDLE | EN_CAMINO | EN_ORIGEN | EN_TRANSITO_DESTINO | COMPLETADO
    this.activeTransfer = null;
    this.currentLocation = config.initialLocation || { lat: 6.2088, lng: -75.5678, name: 'Medellín' };
    this.completedTransfers = [];
    this.submittedTolls = [];
    this.crdtState = new CRDTActorState();
    this.finPort = null;
    this.guidePort = null;
    this.mainPort = null;
    this.#listeners = [];
  }

  /**
   * Initializes point-to-point MessagePorts.
   * @param {object} ports
   */
  initPorts(ports = {}) {
    if (ports.finPort) {
      this.finPort = ports.finPort;
      this.finPort.onmessage = (e) => this.#handleFinMessage(e.data);
    }
    if (ports.guidePort) {
      this.guidePort = ports.guidePort;
      this.guidePort.onmessage = (e) => this.#handleGuideMessage(e.data);
    }
    if (ports.mainPort) {
      this.mainPort = ports.mainPort;
    }
  }

  /**
   * Registers a local event/state listener.
   * @param {Function} callback
   * @returns {() => void}
   */
  subscribe(callback) {
    this.#listeners.push(callback);
    return () => {
      this.#listeners = this.#listeners.filter((cb) => cb !== callback);
    };
  }

  #emit(eventObj) {
    for (const cb of this.#listeners) {
      try {
        cb(eventObj);
      } catch (err) {
        console.error('[DriverActor] Listener error:', err);
      }
    }
    if (this.mainPort && typeof this.mainPort.postMessage === 'function') {
      try {
        this.mainPort.postMessage(eventObj);
      } catch {
        // Port transfer fallback
      }
    }
  }

  #handleFinMessage(msg) {
    if (!msg) return;
    if (msg.type === 'EXPENSE_APPROVED' || msg.action === 'EXPENSE_APPROVED' || msg.status === 'APPROVED') {
      const { expenseId, amountInCents } = msg.payload || msg.data || msg;
      if (amountInCents) {
        this.crdtState.addExpenseCents(this.actorId, BigInt(amountInCents));
      }
      this.#emit({
        type: 'TOLL_APPROVED',
        actorId: this.actorId,
        expenseId,
        amountInCents
      });
    }
  }

  #handleGuideMessage(msg) {
    if (!msg) return;
    this.#emit({
      type: 'GUIDE_COORDINATION_RECEIVED',
      actorId: this.actorId,
      fromGuide: msg
    });
  }

  /**
   * Dispatches command to actor and returns response.
   * @param {object} command
   * @param {any[]} [transferPorts]
   * @returns {Promise<object>|object}
   */
  async receive(command = {}, transferPorts = []) {
    const action = command.action || command.type;
    const payload = command.payload || {};
    const timestamp = command.timestamp || new Date().toISOString();
    const correlationId = command.correlationId || `corr-${Date.now()}`;

    switch (action) {
      case 'INIT_PORTS': {
        const ports = command.ports || {};
        if (transferPorts && transferPorts.length > 0) {
          if (transferPorts[0]) ports.finPort = transferPorts[0];
          if (transferPorts[1]) ports.guidePort = transferPorts[1];
        }
        this.initPorts(ports);
        return {
          success: true,
          ack: true,
          action: 'INIT_PORTS',
          actorId: this.actorId,
          correlationId
        };
      }

      case 'START_TRANSFER': {
        const { transferId, origin, destination, patientName, patientUuid, estimatedDistanceMeters } = payload;
        if (!transferId) throw new Error('[DriverActor] transferId es obligatorio para START_TRANSFER.');

        // Enforce operative territory fail-fast invariant
        if (origin) {
          validateTerritory(origin);
        }
        if (destination) {
          validateTerritory(destination);
        }

        this.status = 'EN_CAMINO';
        this.activeTransfer = {
          transferId,
          origin,
          destination,
          patientName: patientName || 'Paciente VIP',
          patientUuid: patientUuid || 'ENT-PAX-UNKNOWN',
          startTime: timestamp,
          estimatedDistanceMeters: estimatedDistanceMeters || 15000,
          stops: []
        };

        this.crdtState.updateStopStatus(transferId, 'EN_CAMINO', this.actorId, timestamp);

        const event = new ActorEvent({
          eventId: `EVT-DRV-START-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'START_TRANSFER',
          aggregateId: transferId,
          payload: { ...this.activeTransfer },
          timestamp
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'START_TRANSFER',
          status: this.status,
          event: event.toJSON(),
          crdtState: this.crdtState.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          activeTransfer: this.activeTransfer,
          correlationId
        };
      }

      case 'ARRIVE_ORIGIN': {
        const { transferId, coords } = payload;
        if (!this.activeTransfer && !transferId) {
          throw new Error('[DriverActor] No hay un traslado activo para registrar ARRIVE_ORIGIN.');
        }

        if (coords) {
          validateTerritory(coords);
          this.currentLocation = coords;
          this.crdtState.updateActorLocation(this.actorId, coords, timestamp);
        }

        this.status = 'EN_ORIGEN';
        if (this.activeTransfer) {
          this.activeTransfer.arrivedOriginTime = timestamp;
          this.crdtState.updateStopStatus(this.activeTransfer.transferId, 'EN_ORIGEN', this.actorId, timestamp);
        }

        const event = new ActorEvent({
          eventId: `EVT-DRV-ARR-ORIG-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'ARRIVE_ORIGIN',
          aggregateId: this.activeTransfer?.transferId || transferId || 'TRF-ACTIVE',
          payload: { status: this.status, coords, timestamp },
          timestamp
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'ARRIVE_ORIGIN',
          status: this.status,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          correlationId
        };
      }

      case 'PASSENGER_PICKED_UP': {
        const { transferId, passengerName, patientUuid } = payload;
        this.status = 'EN_TRANSITO_DESTINO';

        if (this.activeTransfer) {
          this.activeTransfer.passengerPickedUpTime = timestamp;
          this.activeTransfer.passengerName = passengerName || this.activeTransfer.patientName;
          this.activeTransfer.patientUuid = patientUuid || this.activeTransfer.patientUuid;
          this.crdtState.updateStopStatus(this.activeTransfer.transferId, 'EN_TRANSITO_DESTINO', this.actorId, timestamp);
        }

        // Direct coordination to Guide if connected
        if (this.guidePort && typeof this.guidePort.postMessage === 'function') {
          try {
            this.guidePort.postMessage({
              type: 'PASSENGER_BOARDED_NOTIFICATION',
              transferId: this.activeTransfer?.transferId || transferId,
              patientUuid: this.activeTransfer?.patientUuid,
              passengerName: this.activeTransfer?.passengerName,
              timestamp
            });
          } catch {
            // Port message handling
          }
        }

        const event = new ActorEvent({
          eventId: `EVT-DRV-PAX-UP-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'PASSENGER_PICKED_UP',
          aggregateId: this.activeTransfer?.transferId || transferId || 'TRF-ACTIVE',
          payload: { status: this.status, timestamp },
          timestamp
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'PASSENGER_PICKED_UP',
          status: this.status,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          correlationId
        };
      }

      case 'ARRIVE_DESTINATION': {
        const { transferId, coords, finalOdometerKm } = payload;
        if (coords) {
          validateTerritory(coords);
          this.currentLocation = coords;
          this.crdtState.updateActorLocation(this.actorId, coords, timestamp);
        }

        this.status = 'COMPLETADO';
        if (this.activeTransfer) {
          this.activeTransfer.arrivedDestinationTime = timestamp;
          this.activeTransfer.finalOdometerKm = finalOdometerKm;
          this.completedTransfers.push({ ...this.activeTransfer });
          this.crdtState.updateStopStatus(this.activeTransfer.transferId, 'COMPLETADO', this.actorId, timestamp);
          this.activeTransfer = null;
        }

        const event = new ActorEvent({
          eventId: `EVT-DRV-COMP-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'ARRIVE_DESTINATION',
          aggregateId: transferId || 'TRF-ACTIVE',
          payload: { status: 'COMPLETADO', coords, timestamp },
          timestamp
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'ARRIVE_DESTINATION',
          status: this.status,
          event: event.toJSON(),
          crdtState: this.crdtState.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          completedCount: this.completedTransfers.length,
          correlationId
        };
      }

      case 'SUBMIT_TOLL_EXPENSE': {
        const {
          expenseId,
          transferId,
          tollBoothName,
          amountInCents,
          amount,
          currency = 'COP',
          receiptBlobId,
          receiptChecksum
        } = payload;

        const cents = amountInCents !== undefined
          ? BigInt(amountInCents)
          : BigInt(Math.round(Number(amount || 0) * 100));

        if (cents <= 0n) {
          throw new Error('[DriverActor] Monto de peaje debe ser mayor a 0 centavos.');
        }

        const expId = expenseId || `EXP-TOLL-${Date.now()}`;
        const proposal = {
          expenseId: expId,
          itineraryItemId: transferId || this.activeTransfer?.transferId || 'TRF-GENERAL',
          category: 'TAXI',
          description: `Peaje ${tollBoothName || 'Autopista'} - ${this.vehicle}`,
          amountInCents: cents.toString(),
          currency,
          receiptBlobId: receiptBlobId || `receipt-toll-${expId}`,
          receiptChecksum: receiptChecksum || 'sha256-receipt-placeholder',
          actorId: this.actorId,
          actorRole: this.actorRole,
          timestamp
        };

        this.submittedTolls.push(proposal);

        let auditorResponse = null;

        // Send direct proposal to Financial Auditor if port is active and wait for audit result
        if (this.finPort && typeof this.finPort.postMessage === 'function') {
          auditorResponse = await new Promise((resolve) => {
            const originalOnMessage = this.finPort.onmessage;
            this.finPort.onmessage = (e) => {
              if (originalOnMessage) originalOnMessage(e);
              resolve(e.data);
            };
            try {
              this.finPort.postMessage({
                type: 'PROPOSE_EXPENSE',
                action: 'PROPOSE_EXPENSE',
                payload: proposal,
                correlationId
              });
            } catch (e) {
              console.warn('[DriverActor] Error posting to finPort:', e);
              resolve(null);
            }
          });

          if (auditorResponse && (auditorResponse.status === 'APPROVED' || auditorResponse.success)) {
            this.crdtState.addExpenseCents(this.actorId, cents);
          }
        }

        this.#emit({
          type: 'EXPENSE_PROPOSED',
          actorId: this.actorId,
          action: 'SUBMIT_TOLL_EXPENSE',
          proposal,
          auditorResponse,
          correlationId
        });

        return {
          success: true,
          ack: true,
          expenseId: expId,
          amountInCents: cents.toString(),
          proposal,
          auditorResponse,
          correlationId
        };
      }

      case 'UPDATE_GPS_POSITION': {
        const { lat, lng, name, heading, speed } = payload;
        validateTerritory({ lat, lng, zoneName: name });
        this.currentLocation = { lat, lng, name: name || 'En Ruta', heading, speed, timestamp };
        this.crdtState.updateActorLocation(this.actorId, this.currentLocation, timestamp);

        this.#emit({
          type: 'GPS_UPDATED',
          actorId: this.actorId,
          location: this.currentLocation,
          correlationId
        });

        return {
          success: true,
          location: this.currentLocation,
          correlationId
        };
      }

      case 'GET_STATUS': {
        return {
          success: true,
          actorId: this.actorId,
          actorRole: this.actorRole,
          driverName: this.driverName,
          vehicle: this.vehicle,
          status: this.status,
          activeTransfer: this.activeTransfer,
          currentLocation: this.currentLocation,
          completedTransfersCount: this.completedTransfers.length,
          tollsSubmittedCount: this.submittedTolls.length,
          crdtState: this.crdtState.getSnapshot(),
          correlationId
        };
      }

      default:
        return {
          success: false,
          error: `[DriverActor] Acción desconocida: '${action}'`,
          correlationId
        };
    }
  }
}

// Web Worker Execution Environment hook
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
  const driverWorkerInstance = new DriverActor();
  self.onmessage = async (event) => {
    try {
      const res = await driverWorkerInstance.receive(event.data, event.ports);
      if (res) {
        self.postMessage(res);
      }
    } catch (err) {
      self.postMessage({
        success: false,
        error: err.message,
        correlationId: event.data?.correlationId
      });
    }
  };
}
