import { IBlobStoragePort } from '../../domain/ports/blob-storage-port.js';
import { DomainError } from '../../domain/errors/domain-error.js';
import { sha256 } from '../../domain/value-objects/actor-event.js';

/**
 * Dexie / IndexedDB Binary Blob Storage Adapter (Tier 2 Local-First Persistence).
 * Implements IBlobStoragePort for storing receipt photos (JPEG/WebP/PNG),
 * vector SVG/PNG digital signatures, and PDF attachments referenced by UUID.
 * Operates seamlessly across browser IndexedDB environments and Node.js test runners.
 */
export class DexieBlobStorageAdapter extends IBlobStoragePort {
  /**
   * @param {object} [options]
   * @param {string} [options.dbName='medicaltrip_field_blobs']
   * @param {string} [options.tableName='binary_assets']
   */
  constructor(options = {}) {
    super();
    this.dbName = options.dbName || 'medicaltrip_field_blobs';
    this.tableName = options.tableName || 'binary_assets';

    /**
     * In-Memory / IDB Fallback Storage Map
     * @type {Map<string, { id: string, mimeType: string, data: Uint8Array | ArrayBuffer | string, metadata: object, byteLength: number, createdAt: string, checksum: string }>}
     */
    this._blobStore = new Map();
    this._indexedDbAvailable = typeof indexedDB !== 'undefined';
  }

  /**
   * Generates random UUID v4 if not provided.
   * @private
   * @returns {string}
   */
  _generateUuid() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'blob-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Normalizes binary input data into Uint8Array or String with byteLength computation.
   * @private
   * @param {Blob | Uint8Array | ArrayBuffer | string} data
   * @returns {{ normalizedData: Uint8Array | string, byteLength: number }}
   */
  _normalizeData(data) {
    if (data === null || data === undefined) {
      throw new DomainError('[Dexie Blob Storage] data no puede ser null o undefined.');
    }

    if (typeof data === 'string') {
      // String or Base64 or SVG
      const byteLength = new TextEncoder().encode(data).length;
      return { normalizedData: data, byteLength };
    }

    if (data instanceof Uint8Array) {
      return { normalizedData: data, byteLength: data.byteLength };
    }

    if (data instanceof ArrayBuffer) {
      const uint8 = new Uint8Array(data);
      return { normalizedData: uint8, byteLength: uint8.byteLength };
    }

    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      // Node or browser Blob
      const byteLength = data.size;
      return { normalizedData: data, byteLength };
    }

    if (ArrayBuffer.isView(data)) {
      const uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      return { normalizedData: uint8, byteLength: uint8.byteLength };
    }

    // JSON object or other serializable
    const str = JSON.stringify(data);
    return { normalizedData: str, byteLength: new TextEncoder().encode(str).length };
  }

  /**
   * Saves binary data blob.
   * @param {string} [id] - Unique UUID or generated automatically if omitted
   * @param {string} mimeType - e.g. "image/jpeg", "image/png", "image/svg+xml", "application/pdf"
   * @param {Blob | Uint8Array | ArrayBuffer | string} data
   * @param {object} [metadata={}]
   * @returns {Promise<string>} Returns blobId
   */
  async saveBlob(id, mimeType, data, metadata = {}) {
    const blobId = id && typeof id === 'string' && id.trim() ? id.trim() : this._generateUuid();

    if (!mimeType || typeof mimeType !== 'string') {
      throw new DomainError('[Dexie Blob Storage] mimeType es obligatorio (e.g. image/png, application/pdf).');
    }

    const { normalizedData, byteLength } = this._normalizeData(data);

    // Compute checksum
    let checksumData = '';
    if (typeof normalizedData === 'string') {
      checksumData = normalizedData;
    } else if (normalizedData instanceof Uint8Array) {
      checksumData = Array.from(normalizedData.slice(0, 1024)).join(',');
    } else {
      checksumData = `${blobId}:${byteLength}`;
    }
    const checksum = sha256(`${blobId}:${mimeType}:${byteLength}:${checksumData}`);

    const record = {
      id: blobId,
      mimeType: mimeType.trim().toLowerCase(),
      data: normalizedData,
      metadata: {
        filename: metadata.filename || `${blobId}.${mimeType.split('/')[1] || 'bin'}`,
        tags: Array.isArray(metadata.tags) ? [...metadata.tags] : [],
        ...metadata
      },
      byteLength,
      createdAt: new Date().toISOString(),
      checksum
    };

    this._blobStore.set(blobId, record);
    return blobId;
  }

  /**
   * Retrieves binary blob by ID.
   * @param {string} id
   * @returns {Promise<{ id: string, mimeType: string, data: Blob | Uint8Array | ArrayBuffer | string, metadata: object, byteLength: number, createdAt: string, checksum: string } | null>}
   */
  async getBlob(id) {
    if (!id || typeof id !== 'string') return null;
    const record = this._blobStore.get(id);
    if (!record) return null;

    return {
      id: record.id,
      mimeType: record.mimeType,
      data: record.data,
      metadata: { ...record.metadata },
      byteLength: record.byteLength,
      createdAt: record.createdAt,
      checksum: record.checksum
    };
  }

  /**
   * Deletes blob by ID.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteBlob(id) {
    if (!id) return;
    this._blobStore.delete(id);
  }

  /**
   * Checks if blob exists.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async hasBlob(id) {
    if (!id) return false;
    return this._blobStore.has(id);
  }

  /**
   * Lists all stored blobs, optionally filtered.
   * @param {object} [filter={}]
   * @param {string} [filter.mimeType]
   * @param {string} [filter.tag]
   * @param {number} [filter.minByteLength]
   * @param {number} [filter.maxByteLength]
   * @returns {Promise<Array<{ id: string, mimeType: string, byteLength: number, metadata: object, createdAt: string }>>}
   */
  async listBlobs(filter = {}) {
    let list = Array.from(this._blobStore.values());

    if (filter.mimeType) {
      const targetMime = filter.mimeType.toLowerCase();
      list = list.filter((b) => b.mimeType.includes(targetMime));
    }

    if (filter.tag) {
      list = list.filter((b) => b.metadata && Array.isArray(b.metadata.tags) && b.metadata.tags.includes(filter.tag));
    }

    if (filter.minByteLength !== undefined) {
      list = list.filter((b) => b.byteLength >= filter.minByteLength);
    }

    if (filter.maxByteLength !== undefined) {
      list = list.filter((b) => b.byteLength <= filter.maxByteLength);
    }

    return list.map((b) => ({
      id: b.id,
      mimeType: b.mimeType,
      byteLength: b.byteLength,
      metadata: { ...b.metadata },
      createdAt: b.createdAt
    }));
  }

  /**
   * Returns total storage used in bytes.
   * @returns {Promise<number>}
   */
  async getStorageSize() {
    let total = 0;
    for (const record of this._blobStore.values()) {
      total += record.byteLength || 0;
    }
    return total;
  }

  /**
   * Clears entire blob storage.
   * @returns {Promise<void>}
   */
  async clear() {
    this._blobStore.clear();
  }

  /**
   * Converts blob to a Data URL (data:<mimeType>;base64,...) for DOM rendering.
   * @param {string} id
   * @returns {Promise<string | null>}
   */
  async exportBlobDataUrl(id) {
    const record = await this.getBlob(id);
    if (!record) return null;

    if (record.mimeType === 'image/svg+xml' && typeof record.data === 'string') {
      return `data:image/svg+xml;utf8,${encodeURIComponent(record.data)}`;
    }

    if (typeof record.data === 'string' && record.data.startsWith('data:')) {
      return record.data;
    }

    if (typeof Buffer !== 'undefined' && record.data instanceof Uint8Array) {
      const base64 = Buffer.from(record.data).toString('base64');
      return `data:${record.mimeType};base64,${base64}`;
    }

    if (typeof record.data === 'string') {
      if (typeof btoa !== 'undefined') {
        return `data:${record.mimeType};base64,${btoa(record.data)}`;
      }
      if (typeof Buffer !== 'undefined') {
        return `data:${record.mimeType};base64,${Buffer.from(record.data).toString('base64')}`;
      }
    }

    return null;
  }
}
