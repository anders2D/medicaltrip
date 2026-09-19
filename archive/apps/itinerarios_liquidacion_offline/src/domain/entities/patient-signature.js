import { DomainError } from '../errors/domain-error.js';

/**
 * PatientSignature Entity.
 * Represents a legally binding digital signature captured in field from patient/companion.
 */
export class PatientSignature {
  /** @type {string} */
  #id;
  /** @type {string} */
  #itineraryItemId;
  /** @type {string} */
  #patientUuid;
  /** @type {string} */
  #signedAt;
  /** @type {string} */
  #signerName;
  /** @type {string} */
  #blobId;
  /** @type {'svg' | 'png'} */
  #format;

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.itineraryItemId
   * @param {string} params.patientUuid
   * @param {string} [params.signedAt]
   * @param {string} params.signerName
   * @param {string} params.blobId
   * @param {'svg' | 'png'} [params.format='svg']
   */
  constructor({
    id,
    itineraryItemId,
    patientUuid,
    signedAt,
    signerName,
    blobId,
    format = 'svg'
  } = {}) {
    if (!id || typeof id !== 'string') {
      throw new DomainError('[Firma Inválida] id es obligatorio.');
    }
    if (!itineraryItemId || typeof itineraryItemId !== 'string') {
      throw new DomainError('[Firma Inválida] itineraryItemId es obligatorio.');
    }
    if (!patientUuid || typeof patientUuid !== 'string') {
      throw new DomainError('[Firma Inválida] patientUuid es obligatorio.');
    }
    if (!signerName || typeof signerName !== 'string' || !signerName.trim()) {
      throw new DomainError('[Firma Inválida] signerName es obligatorio.');
    }
    if (!blobId || typeof blobId !== 'string') {
      throw new DomainError('[Firma Inválida] blobId es obligatorio.');
    }

    const normFormat = String(format).toLowerCase();
    if (normFormat !== 'svg' && normFormat !== 'png') {
      throw new DomainError(`[Firma Inválida] Formato no soportado: '${format}'. Soportados: 'svg', 'png'`);
    }

    this.#id = id;
    this.#itineraryItemId = itineraryItemId;
    this.#patientUuid = patientUuid;
    this.#signedAt = signedAt || new Date().toISOString();
    this.#signerName = signerName.trim();
    this.#blobId = blobId;
    this.#format = /** @type {'svg' | 'png'} */ (normFormat);

    Object.freeze(this);
  }

  get id() {
    return this.#id;
  }

  get itineraryItemId() {
    return this.#itineraryItemId;
  }

  get patientUuid() {
    return this.#patientUuid;
  }

  get signedAt() {
    return this.#signedAt;
  }

  get signerName() {
    return this.#signerName;
  }

  get blobId() {
    return this.#blobId;
  }

  get format() {
    return this.#format;
  }

  isSvg() {
    return this.#format === 'svg';
  }

  isPng() {
    return this.#format === 'png';
  }

  toJSON() {
    return {
      id: this.#id,
      itineraryItemId: this.#itineraryItemId,
      patientUuid: this.#patientUuid,
      signedAt: this.#signedAt,
      signerName: this.#signerName,
      blobId: this.#blobId,
      format: this.#format
    };
  }
}
