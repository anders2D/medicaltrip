import { DomainError } from '../errors/domain-error.js';

/**
 * Deterministic pure JavaScript SHA-256 implementation (0 dependencies).
 * @param {string} str
 * @returns {string} Hexadecimal SHA-256 digest
 */
export function sha256(str) {
  const input = String(str);
  const utf8Bytes = [];

  for (let b = 0; b < input.length; b++) {
    let charCode = input.charCodeAt(b);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      utf8Bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    } else {
      b++;
      charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (input.charCodeAt(b) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    }
  }

  const bitLength = utf8Bytes.length * 8;
  utf8Bytes.push(0x80);
  while ((utf8Bytes.length % 64) !== 56) {
    utf8Bytes.push(0);
  }

  // 64-bit big-endian bit length
  for (let b = 7; b >= 0; b--) {
    utf8Bytes.push(Number((BigInt(bitLength) >> BigInt(b * 8)) & 0xffn));
  }

  const words = [];
  for (let b = 0; b < utf8Bytes.length; b += 4) {
    words.push(
      (utf8Bytes[b] << 24) |
      (utf8Bytes[b + 1] << 16) |
      (utf8Bytes[b + 2] << 8) |
      utf8Bytes[b + 3]
    );
  }

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (let j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      let temp1;
      if (i < 16) {
        temp1 = w[i];
      } else {
        const w15 = w[i - 15];
        const w2 = w[i - 2];
        const s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
        const s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
        w[i] = temp1 = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const sigma0 = ((hash[0] >>> 2) | (hash[0] << 30)) ^ ((hash[0] >>> 13) | (hash[0] << 19)) ^ ((hash[0] >>> 22) | (hash[0] << 10));
      const sigma1 = ((hash[4] >>> 6) | (hash[4] << 26)) ^ ((hash[4] >>> 11) | (hash[4] << 21)) ^ ((hash[4] >>> 25) | (hash[4] << 7));

      const t1 = (hash[7] + sigma1 + ch + k[i] + temp1) | 0;
      const t2 = (sigma0 + maj) | 0;

      hash = [
        (t1 + t2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + t1) | 0,
        hash[4],
        hash[5],
        hash[6]
      ];
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    result += ((hash[i] >>> 0).toString(16)).padStart(8, '0');
  }

  return result;
}

/**
 * Immutable CQRS Actor Event Value Object.
 * Encapsulates deterministic payload hash chaining for auditability.
 */
export class ActorEvent {
  /** @type {string} */
  #eventId;
  /** @type {string} */
  #actorId;
  /** @type {string} */
  #actorRole;
  /** @type {string} */
  #eventType;
  /** @type {string} */
  #aggregateId;
  /** @type {Record<string, any>} */
  #payload;
  /** @type {string} */
  #timestamp;
  /** @type {string} */
  #previousHash;
  /** @type {string} */
  #hash;

  /**
   * @param {object} params
   * @param {string} params.eventId
   * @param {string} params.actorId
   * @param {string} params.actorRole
   * @param {string} params.eventType
   * @param {string} params.aggregateId
   * @param {Record<string, any>} [params.payload={}]
   * @param {string} [params.timestamp]
   * @param {string} [params.previousHash='0000000000000000000000000000000000000000000000000000000000000000']
   * @param {string} [params.hash]
   */
  constructor({
    eventId,
    actorId,
    actorRole,
    eventType,
    aggregateId,
    payload = {},
    timestamp,
    previousHash = '0000000000000000000000000000000000000000000000000000000000000000',
    hash
  } = {}) {
    if (!eventId || typeof eventId !== 'string') {
      throw new DomainError('[ActorEvent Inválido] eventId es obligatorio.');
    }
    if (!actorId || typeof actorId !== 'string') {
      throw new DomainError('[ActorEvent Inválido] actorId es obligatorio.');
    }
    if (!eventType || typeof eventType !== 'string') {
      throw new DomainError('[ActorEvent Inválido] eventType es obligatorio.');
    }
    if (!aggregateId || typeof aggregateId !== 'string') {
      throw new DomainError('[ActorEvent Inválido] aggregateId es obligatorio.');
    }

    this.#eventId = eventId;
    this.#actorId = actorId;
    this.#actorRole = String(actorRole || 'SYSTEM').toUpperCase();
    this.#eventType = eventType;
    this.#aggregateId = aggregateId;
    this.#payload = Object.freeze(JSON.parse(JSON.stringify(payload || {})));
    this.#timestamp = timestamp || new Date().toISOString();
    this.#previousHash = String(previousHash || '0000000000000000000000000000000000000000000000000000000000000000');

    const calculatedHash = this.computeHash();
    if (hash && hash !== calculatedHash) {
      throw new DomainError(
        `[Integridad Comprometida] El hash provisto (${hash}) no coincide con el hash calculado (${calculatedHash}).`
      );
    }

    this.#hash = calculatedHash;
    Object.freeze(this);
  }

  get eventId() {
    return this.#eventId;
  }

  get actorId() {
    return this.#actorId;
  }

  get actorRole() {
    return this.#actorRole;
  }

  get eventType() {
    return this.#eventType;
  }

  get aggregateId() {
    return this.#aggregateId;
  }

  get payload() {
    return this.#payload;
  }

  get timestamp() {
    return this.#timestamp;
  }

  get previousHash() {
    return this.#previousHash;
  }

  get hash() {
    return this.#hash;
  }

  /**
   * Generates deterministic canonical message string for hashing.
   * @returns {string}
   */
  getCanonicalMessage() {
    const sortedPayloadStr = JSON.stringify(this.#payload, Object.keys(this.#payload).sort());
    return `${this.#eventId}|${this.#actorId}|${this.#actorRole}|${this.#eventType}|${this.#aggregateId}|${sortedPayloadStr}|${this.#timestamp}|${this.#previousHash}`;
  }

  /**
   * Computes SHA-256 hash of this event.
   * @returns {string}
   */
  computeHash() {
    return sha256(this.getCanonicalMessage());
  }

  /**
   * Verifies hash integrity against previous hash in chain.
   * @param {string} [expectedPreviousHash]
   * @returns {boolean}
   */
  verifyIntegrity(expectedPreviousHash) {
    if (expectedPreviousHash && this.#previousHash !== expectedPreviousHash) {
      return false;
    }
    return this.#hash === this.computeHash();
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      eventId: this.#eventId,
      actorId: this.#actorId,
      actorRole: this.#actorRole,
      eventType: this.#eventType,
      aggregateId: this.#aggregateId,
      payload: this.#payload,
      timestamp: this.#timestamp,
      previousHash: this.#previousHash,
      hash: this.#hash
    };
  }
}
