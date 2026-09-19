import { DomainError } from '../errors/domain-error.js';

/**
 * Abstract Port: IBlobStoragePort
 * Secondary persistence contract for binary assets (receipt photos, signature blobs, PDFs) via IndexedDB/Dexie.
 */
export class IBlobStoragePort {
  /**
   * Saves binary data blob.
   * @param {string} _id - Unique UUID for the blob
   * @param {string} _mimeType - e.g. "image/jpeg", "image/png", "image/svg+xml", "application/pdf"
   * @param {Blob | Uint8Array | ArrayBuffer | string} _data
   * @returns {Promise<string>} Returns blobId
   */
  async saveBlob(_id, _mimeType, _data) {
    throw new DomainError('[IBlobStoragePort] saveBlob no ha sido implementado en el adaptador.');
  }

  /**
   * Retrieves binary blob by ID.
   * @param {string} _id
   * @returns {Promise<{ id: string, mimeType: string, data: Blob | Uint8Array | string, createdAt: string } | null>}
   */
  async getBlob(_id) {
    throw new DomainError('[IBlobStoragePort] getBlob no ha sido implementado en el adaptador.');
  }

  /**
   * Deletes blob by ID.
   * @param {string} _id
   * @returns {Promise<void>}
   */
  async deleteBlob(_id) {
    throw new DomainError('[IBlobStoragePort] deleteBlob no ha sido implementado en el adaptador.');
  }

  /**
   * Checks if blob exists.
   * @param {string} _id
   * @returns {Promise<boolean>}
   */
  async hasBlob(_id) {
    throw new DomainError('[IBlobStoragePort] hasBlob no ha sido implementado en el adaptador.');
  }
}
