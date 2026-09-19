import { DomainError } from '../errors/domain-error.js';

/**
 * Abstract Port: IOCRPort
 * Hardware gateway for receipt camera capture and OCR text parsing.
 */
export class IOCRPort {
  /**
   * Processes an image blob/base64 and extracts financial receipt metadata.
   * @param {Blob | Uint8Array | string} _imageBlobOrBase64
   * @returns {Promise<{
   *   totalAmount: import('../value-objects/money.js').Money,
   *   category: 'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'MEDICAL_LAB' | 'OTHER',
   *   establishmentName: string,
   *   date: string,
   *   rawText: string,
   *   confidence: number
   * }>}
   */
  async parseReceipt(_imageBlobOrBase64) {
    throw new DomainError('[IOCRPort] parseReceipt no ha sido implementado en el adaptador.');
  }
}
