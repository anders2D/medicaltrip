import { DomainError } from '../../domain/errors/domain-error.js';
import { PatientSignature } from '../../domain/entities/patient-signature.js';

/**
 * Command Handler: CaptureSignatureCommand
 * Captures, verifies, and persists patient digital signatures in field.
 * Stores binary/vector SVG/PNG representation in IndexedDB and updates relational references.
 */
export class CaptureSignatureCommand {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort} */
  #storagePort;
  /** @type {import('../../domain/ports/blob-storage-port.js').IBlobStoragePort | null} */
  #blobStoragePort;
  /** @type {import('../settlement/ledger-hash-chain.js').LedgerHashChain | null} */
  #ledgerHashChain;

  /**
   * @param {object} params
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} params.storagePort
   * @param {import('../../domain/ports/blob-storage-port.js').IBlobStoragePort} [params.blobStoragePort=null]
   * @param {import('../settlement/ledger-hash-chain.js').LedgerHashChain} [params.ledgerHashChain=null]
   */
  constructor({
    storagePort,
    blobStoragePort = null,
    ledgerHashChain = null
  } = {}) {
    if (!storagePort) {
      throw new DomainError('[CaptureSignatureCommand] storagePort es obligatorio.');
    }
    this.#storagePort = storagePort;
    this.#blobStoragePort = blobStoragePort;
    this.#ledgerHashChain = ledgerHashChain;
  }

  /**
   * Executes digital signature capture.
   * @param {object} params
   * @param {string} [params.id]
   * @param {string} params.itineraryItemId
   * @param {string} params.patientUuid
   * @param {string} [params.reservationCode]
   * @param {string} params.signerName
   * @param {string | Blob | Uint8Array} params.signatureData - Vector SVG string or image data
   * @param {'svg' | 'png'} [params.format='svg']
   * @param {string} [params.actorId='ACT-GUIA']
   * @param {string} [params.actorRole='FIELD_ACTOR']
   * @param {string} [params.timestamp]
   * @returns {Promise<{
   *   success: boolean,
   *   signature: PatientSignature,
   *   blobId: string,
   *   itineraryItemId: string
   * }>}
   */
  async execute({
    id,
    itineraryItemId,
    patientUuid,
    reservationCode = null,
    signerName,
    signatureData,
    format = 'svg',
    actorId = 'ACT-GUIA',
    actorRole = 'FIELD_ACTOR',
    timestamp = null
  }) {
    if (!itineraryItemId) {
      throw new DomainError('[CaptureSignatureCommand] itineraryItemId es obligatorio.');
    }
    if (!patientUuid) {
      throw new DomainError('[CaptureSignatureCommand] patientUuid es obligatorio.');
    }
    if (!signerName || !signerName.trim()) {
      throw new DomainError('[CaptureSignatureCommand] signerName es obligatorio.');
    }
    if (!signatureData) {
      throw new DomainError('[CaptureSignatureCommand] signatureData es obligatorio.');
    }

    const sigId = id || `SIG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const blobId = `BLOB-SIG-${sigId}`;
    const signedAt = timestamp || new Date().toISOString();
    const mimeType = format === 'png' ? 'image/png' : 'image/svg+xml';

    // Store signature binary blob in Dexie/Blob storage
    if (this.#blobStoragePort && typeof this.#blobStoragePort.saveBlob === 'function') {
      await this.#blobStoragePort.saveBlob(blobId, mimeType, signatureData);
    }

    // Create PatientSignature entity
    const signatureEntity = new PatientSignature({
      id: sigId,
      itineraryItemId,
      patientUuid,
      signedAt,
      signerName,
      blobId,
      format
    });

    // Save signature to relational storage
    await this.#storagePort.saveSignature(signatureEntity);

    // Update associated ItineraryItem if present
    const item = await this.#storagePort.getItinerary(itineraryItemId);
    if (item) {
      item.attachSignature(blobId);
      await this.#storagePort.saveItinerary(item, reservationCode);
    }

    // Log CQRS event if ledger hash chain is configured
    if (this.#ledgerHashChain) {
      try {
        await this.#ledgerHashChain.appendEvent({
          actorId,
          actorRole,
          eventType: 'SIGNATURE_CAPTURED',
          payload: {
            signatureId: signatureEntity.id,
            itineraryItemId,
            patientUuid,
            signerName: signatureEntity.signerName,
            blobId,
            format,
            signedAt
          },
          timestamp: signedAt
        });
      } catch (err) {
        if (!err.message.includes('Single-Writer Violation')) {
          throw err;
        }
      }
    }

    return {
      success: true,
      signature: signatureEntity,
      blobId,
      itineraryItemId
    };
  }
}
