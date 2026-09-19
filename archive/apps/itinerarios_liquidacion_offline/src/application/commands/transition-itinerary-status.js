import { DomainError, InvalidStateTransitionError } from '../../domain/errors/domain-error.js';
import { ItineraryItem, ITINERARY_STATUSES } from '../../domain/entities/itinerary-item.js';

/**
 * Command Handler: TransitionItineraryStatusCommand
 * Handles FSM transitions (`PROGRAMADO` -> `EN_CAMINO` -> `EN_SITIO` -> `COMPLETADO` / `CANCELADO`)
 * Enforces geospatial GPS geofence checks upon arrival and digital signature guards upon completion.
 */
export class TransitionItineraryStatusCommand {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort} */
  #storagePort;
  /** @type {import('../../domain/ports/blob-storage-port.js').IBlobStoragePort | null} */
  #blobStoragePort;
  /** @type {import('../settlement/ledger-hash-chain.js').LedgerHashChain | null} */
  #ledgerHashChain;
  /** @type {import('../../domain/ports/actor-event-bus-port.js').IActorEventBusPort | null} */
  #actorEventBusPort;

  /**
   * @param {object} params
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} params.storagePort
   * @param {import('../../domain/ports/blob-storage-port.js').IBlobStoragePort} [params.blobStoragePort=null]
   * @param {import('../settlement/ledger-hash-chain.js').LedgerHashChain} [params.ledgerHashChain=null]
   * @param {import('../../domain/ports/actor-event-bus-port.js').IActorEventBusPort} [params.actorEventBusPort=null]
   */
  constructor({
    storagePort,
    blobStoragePort = null,
    ledgerHashChain = null,
    actorEventBusPort = null
  } = {}) {
    if (!storagePort) {
      throw new DomainError('[TransitionItineraryStatusCommand] storagePort es obligatorio.');
    }
    this.#storagePort = storagePort;
    this.#blobStoragePort = blobStoragePort;
    this.#ledgerHashChain = ledgerHashChain;
    this.#actorEventBusPort = actorEventBusPort;
  }

  /**
   * Executes status transition with invariant guard validations.
   * @param {object} params
   * @param {string} params.itineraryItemId
   * @param {string} [params.reservationCode]
   * @param {'PROGRAMADO' | 'EN_CAMINO' | 'EN_SITIO' | 'COMPLETADO' | 'CANCELADO'} params.newStatus
   * @param {string} [params.actorId='ACT-DISPATCHER']
   * @param {string} [params.actorRole='DISPATCHER']
   * @param {{ lat: number, lng: number }} [params.coords]
   * @param {string} [params.signatureBlobId]
   * @param {string} [params.cancellationReason]
   * @param {string} [params.timestamp]
   * @returns {Promise<{
   *   success: boolean,
   *   itineraryItem: ItineraryItem,
   *   previousStatus: string,
   *   newStatus: string,
   *   transitionTimestamp: string
   * }>}
   */
  async execute({
    itineraryItemId,
    reservationCode = null,
    newStatus,
    actorId = 'ACT-DISPATCHER',
    actorRole = 'DISPATCHER',
    coords = null,
    signatureBlobId = null,
    cancellationReason = null,
    timestamp = null
  }) {
    if (!itineraryItemId) {
      throw new DomainError('[TransitionItineraryStatusCommand] itineraryItemId es obligatorio.');
    }
    if (!newStatus) {
      throw new DomainError('[TransitionItineraryStatusCommand] newStatus es obligatorio.');
    }

    const normStatus = String(newStatus).toUpperCase();
    if (!ITINERARY_STATUSES.includes(normStatus)) {
      throw new DomainError(
        `[TransitionItineraryStatusCommand] Estado no válido: '${newStatus}'. Permitidos: ${ITINERARY_STATUSES.join(', ')}`
      );
    }

    // Retrieve item from storage
    const item = await this.#storagePort.getItinerary(itineraryItemId);
    if (!item) {
      throw new DomainError(`[TransitionItineraryStatusCommand] No se encontró el ítem de itinerario '${itineraryItemId}'.`);
    }

    const previousStatus = item.status;
    const transitionTs = timestamp || new Date().toISOString();

    // Guard Checks based on target status
    switch (normStatus) {
      case 'PROGRAMADO':
        item.transitionTo('PROGRAMADO', { timestamp: transitionTs });
        break;

      case 'EN_CAMINO':
        item.startTransit(transitionTs);
        break;

      case 'EN_SITIO': {
        // Enforce GPS Check-in guard if required
        if (item.requiresGpsCheckIn) {
          if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
            throw new DomainError(
              `[Guardia de Check-In GPS] Coordenadas GPS son requeridas para la llegada a '${item.title}'.`
            );
          }
          const isInside = item.location.isWithinGeofence(coords);
          if (!isInside) {
            const dist = Math.round(item.location.distanceTo(coords));
            throw new DomainError(
              `[Guardia de Check-In GPS] El actor está a ${dist}m de la clínica (Radio permitido: ${item.location.geofenceRadiusMeters}m).`
            );
          }
        }
        item.arriveOnSite({ coords, timestamp: transitionTs });
        break;
      }

      case 'COMPLETADO': {
        // Enforce Signature guard if required
        const sigId = signatureBlobId || item.signatureBlobId;
        if (item.requiresSignature && !sigId) {
          throw new DomainError(
            `[Guardia de Firma] Se requiere la firma digital del paciente para completar '${item.title}'.`
          );
        }

        // Optionally verify blob exists in blobStoragePort if provided
        if (sigId && this.#blobStoragePort && typeof this.#blobStoragePort.hasBlob === 'function') {
          const hasBlob = await this.#blobStoragePort.hasBlob(sigId);
          if (!hasBlob) {
            // Check if getBlob returns non-null
            const blob = await this.#blobStoragePort.getBlob(sigId);
            if (!blob) {
              throw new DomainError(
                `[Guardia de Firma] El blob de firma '${sigId}' no existe en el almacenamiento binario.`
              );
            }
          }
        }

        item.complete({ signatureBlobId: sigId, timestamp: transitionTs });
        break;
      }

      case 'CANCELADO':
        item.cancel(cancellationReason || 'Cancelado por el operador.');
        break;

      default:
        throw new InvalidStateTransitionError(previousStatus, newStatus, 'Estado desconocido.');
    }

    // Persist updated entity
    await this.#storagePort.saveItinerary(item, reservationCode);

    // Record CQRS event if ledger hash chain is configured
    if (this.#ledgerHashChain) {
      try {
        await this.#ledgerHashChain.appendEvent({
          actorId,
          actorRole,
          eventType: 'STATUS_TRANSITIONED',
          payload: {
            itineraryItemId: item.id,
            previousStatus,
            newStatus: item.status,
            coords,
            signatureBlobId: item.signatureBlobId,
            timestamp: transitionTs
          },
          timestamp: transitionTs
        });
      } catch (err) {
        // If writer is unauthorized in CQRS single-writer mode, proceed or propagate based on role
        if (!err.message.includes('Single-Writer Violation')) {
          throw err;
        }
      }
    }

    // Publish to actor event bus if configured
    if (this.#actorEventBusPort && typeof this.#actorEventBusPort.publish === 'function') {
      await this.#actorEventBusPort.publish('ITINERARY_STATUS_CHANGED', {
        itineraryItemId: item.id,
        previousStatus,
        newStatus: item.status,
        timestamp: transitionTs
      });
    }

    return {
      success: true,
      itineraryItem: item,
      previousStatus,
      newStatus: item.status,
      transitionTimestamp: transitionTs
    };
  }
}
