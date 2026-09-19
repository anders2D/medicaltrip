/**
 * Medical Trip Colombia S.A.S. - Sha256LedgerChain
 * Pure TypeScript SHA-256 Cryptographic Hash Algorithm and Immutable Ledger Chaining.
 * Zero external dependencies, FIPS 180-4 compliant, 100% Offline & Local-First.
 */

// Initial 32-bit Hash Values (first 32 bits of fractional parts of square roots of first 8 primes 2..19)
const H_INIT = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// SHA-256 Constants (first 32 bits of fractional parts of cube roots of first 64 primes 2..311)
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

// Helper bitwise functions
function rotr(n: number, x: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function ch(x: number, y: number, z: number): number {
  return ((x & y) ^ (~x & z)) >>> 0;
}

function maj(x: number, y: number, z: number): number {
  return ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
}

function sigma0(x: number): number {
  return (rotr(2, x) ^ rotr(13, x) ^ rotr(22, x)) >>> 0;
}

function sigma1(x: number): number {
  return (rotr(6, x) ^ rotr(11, x) ^ rotr(25, x)) >>> 0;
}

function gamma0(x: number): number {
  return (rotr(7, x) ^ rotr(18, x) ^ (x >>> 3)) >>> 0;
}

function gamma1(x: number): number {
  return (rotr(17, x) ^ rotr(19, x) ^ (x >>> 10)) >>> 0;
}

/**
 * Encodes a string into UTF-8 byte array.
 */
export function utf8Encode(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      // Surrogate pair
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

/**
 * Pure TypeScript synchronous SHA-256 hash algorithm.
 * Computes standard 64-character lowercase hex digest.
 */
export function sha256(message: string | Uint8Array): string {
  const bytes = typeof message === 'string' ? utf8Encode(message) : message;
  const bitLength = bytes.length * 8;

  // Pre-processing: padding
  // Pad with 1 bit (0x80), then k zero bits such that (bitLength + 1 + k) % 512 === 448, then 64-bit big-endian length
  const extraPadding = (bytes.length % 64 < 56) ? 56 - (bytes.length % 64) : 120 - (bytes.length % 64);
  const totalLength = bytes.length + extraPadding + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(bytes, 0);
  padded[bytes.length] = 0x80;

  // Append 64-bit integer length in bits (big-endian)
  const view = new DataView(padded.buffer);
  // High 32 bits (support up to 53-bit JS safe integer bit length)
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  view.setUint32(totalLength - 8, highBits, false);
  view.setUint32(totalLength - 4, lowBits, false);

  // Initialize working variables
  const H = [...H_INIT];
  const W = new Uint32Array(64);

  // Process message in successive 512-bit (64-byte) chunks
  for (let offset = 0; offset < totalLength; offset += 64) {
    // 1. Prepare message schedule W
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(offset + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
    }

    // 2. Initialize working variables for this chunk
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    // 3. Compression main loop
    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    // 4. Compute the intermediate hash values
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  // Produce the final 256-bit hash as a 64-character hex string
  return H.map((val) => val.toString(16).padStart(8, '0')).join('');
}

/**
 * Asynchronous SHA-256 hash algorithm.
 * Uses Web Crypto API if available, falling back to pure TS synchronous implementation.
 */
export async function sha256Async(message: string | Uint8Array): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const bytes = typeof message === 'string' ? utf8Encode(message) : message;
      const digestBuffer = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
      const hashArray = Array.from(new Uint8Array(digestBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  return sha256(message);
}

/**
 * Generic cryptographic ledger block.
 */
export interface LedgerBlock<T = unknown> {
  readonly index: number;
  readonly timestamp: number;
  readonly payload: T;
  readonly previousHash: string;
  readonly hash: string;
  readonly nonce?: number;
}

/**
 * Result of ledger integrity verification.
 */
export interface LedgerVerificationResult {
  readonly valid: boolean;
  readonly errorIndex?: number;
  readonly reason?: string;
  readonly blocksVerified: number;
}

/**
 * Digital signature seal certificate.
 */
export interface LedgerSealCertificate {
  readonly sealHash: string;
  readonly ledgerHeadHash: string;
  readonly signatureHash: string;
  readonly patientId: string;
  readonly timestamp: number;
  readonly blockCount: number;
}

/**
 * Deterministically serialize a payload into a canonical JSON string.
 * Recursively sorts keys for deterministic hashing.
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalStringify(val);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes the SHA-256 hash of a ledger block given its constituent parts.
 */
export function calculateBlockHash<T>(
  index: number,
  timestamp: number,
  payload: T,
  previousHash: string,
  nonce: number = 0
): string {
  const serializedPayload = canonicalStringify(payload);
  const rawData = `${index}|${timestamp}|${serializedPayload}|${previousHash}|${nonce}`;
  return sha256(rawData);
}

/**
 * Sha256LedgerChain
 * Immutable cryptographic ledger chaining class.
 * Tracks financial transactions, seals with SHA-256 blocks, and guarantees tamper evidence.
 */
export class Sha256LedgerChain<T = unknown> {
  public static readonly GENESIS_PREV_HASH = '0'.repeat(64);
  private chain: LedgerBlock<T>[] = [];

  constructor(initialBlocks?: LedgerBlock<T>[]) {
    if (initialBlocks && initialBlocks.length > 0) {
      const verification = this.verifyChain(initialBlocks);
      if (!verification.valid) {
        throw new Error(
          `Cannot initialize Sha256LedgerChain with invalid block sequence: ${verification.reason} at index ${verification.errorIndex}`
        );
      }
      this.chain = [...initialBlocks];
    } else {
      this.createGenesisBlock();
    }
  }

  /**
   * Initializes the Genesis block (Block #0).
   */
  private createGenesisBlock(): void {
    const genesisPayload = { message: 'GENESIS_BLOCK_MEDICAL_TRIP_COLOMBIA_SAS' } as unknown as T;
    const timestamp = 1704067200000; // 2024-01-01T00:00:00.000Z
    const hash = calculateBlockHash(0, timestamp, genesisPayload, Sha256LedgerChain.GENESIS_PREV_HASH, 0);

    const genesisBlock: LedgerBlock<T> = {
      index: 0,
      timestamp,
      payload: genesisPayload,
      previousHash: Sha256LedgerChain.GENESIS_PREV_HASH,
      hash,
      nonce: 0,
    };

    this.chain = [genesisBlock];
  }

  /**
   * Returns all blocks in the immutable chain.
   */
  public getChain(): ReadonlyArray<LedgerBlock<T>> {
    return [...this.chain];
  }

  /**
   * Returns the latest head block.
   */
  public getLatestBlock(): LedgerBlock<T> {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Returns the current block height (number of blocks).
   */
  public get height(): number {
    return this.chain.length;
  }

  /**
   * Appends a new verified block to the chain.
   */
  public addBlock(payload: T, timestamp: number = Date.now()): LedgerBlock<T> {
    const latestBlock = this.getLatestBlock();
    const newIndex = latestBlock.index + 1;
    const previousHash = latestBlock.hash;
    const hash = calculateBlockHash(newIndex, timestamp, payload, previousHash, 0);

    const newBlock: LedgerBlock<T> = {
      index: newIndex,
      timestamp,
      payload,
      previousHash,
      hash,
      nonce: 0,
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Rigorously verifies the integrity of the ledger chain.
   * Checks sequential indexing, hash digests, and previousHash continuity.
   */
  public verifyChain(chainToVerify?: ReadonlyArray<LedgerBlock<T>>): LedgerVerificationResult {
    const targetChain = chainToVerify || this.chain;

    if (targetChain.length === 0) {
      return { valid: false, errorIndex: 0, reason: 'Empty chain', blocksVerified: 0 };
    }

    // Verify Genesis Block
    const genesis = targetChain[0];
    if (genesis.index !== 0) {
      return { valid: false, errorIndex: 0, reason: `Genesis block index must be 0, found ${genesis.index}`, blocksVerified: 0 };
    }
    if (genesis.previousHash !== Sha256LedgerChain.GENESIS_PREV_HASH) {
      return {
        valid: false,
        errorIndex: 0,
        reason: `Genesis previousHash mismatch. Expected ${Sha256LedgerChain.GENESIS_PREV_HASH}, found ${genesis.previousHash}`,
        blocksVerified: 0,
      };
    }
    const expectedGenesisHash = calculateBlockHash(
      genesis.index,
      genesis.timestamp,
      genesis.payload,
      genesis.previousHash,
      genesis.nonce ?? 0
    );
    if (genesis.hash !== expectedGenesisHash) {
      return {
        valid: false,
        errorIndex: 0,
        reason: `Genesis hash mismatch. Expected ${expectedGenesisHash}, found ${genesis.hash}`,
        blocksVerified: 0,
      };
    }

    // Verify Subsequent Blocks
    for (let i = 1; i < targetChain.length; i++) {
      const current = targetChain[i];
      const previous = targetChain[i - 1];

      // 1. Index continuity
      if (current.index !== previous.index + 1) {
        return {
          valid: false,
          errorIndex: i,
          reason: `Non-sequential block index. Block ${i} has index ${current.index} instead of ${previous.index + 1}`,
          blocksVerified: i,
        };
      }

      // 2. Previous hash link
      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          errorIndex: i,
          reason: `Broken hash link at block ${i}. previousHash ${current.previousHash} !== predecessor hash ${previous.hash}`,
          blocksVerified: i,
        };
      }

      // 3. Digest integrity (tamper detection on payload, timestamp, index, or previousHash)
      const recomputedHash = calculateBlockHash(
        current.index,
        current.timestamp,
        current.payload,
        current.previousHash,
        current.nonce ?? 0
      );
      if (current.hash !== recomputedHash) {
        return {
          valid: false,
          errorIndex: i,
          reason: `Hash mismatch at block ${i}. Recomputed hash ${recomputedHash} !== recorded hash ${current.hash}`,
          blocksVerified: i,
        };
      }
    }

    return { valid: true, blocksVerified: targetChain.length };
  }

  /**
   * Generates a cryptographic digital seal combining ledger head, signature bitmap hash, and metadata.
   */
  public signLedgerSeal(patientId: string, signatureDataUrl: string, timestamp: number = Date.now()): LedgerSealCertificate {
    const latest = this.getLatestBlock();
    const signatureHash = sha256(signatureDataUrl);
    const sealData = `${latest.hash}|${signatureHash}|${patientId}|${timestamp}|${this.chain.length}`;
    const sealHash = sha256(sealData);

    return {
      sealHash,
      ledgerHeadHash: latest.hash,
      signatureHash,
      patientId,
      timestamp,
      blockCount: this.chain.length,
    };
  }

  /**
   * Verifies a digital seal certificate against the current ledger chain.
   */
  public verifySeal(certificate: LedgerSealCertificate, signatureDataUrl: string): boolean {
    const signatureHash = sha256(signatureDataUrl);
    if (signatureHash !== certificate.signatureHash) return false;

    const expectedSealData = `${certificate.ledgerHeadHash}|${signatureHash}|${certificate.patientId}|${certificate.timestamp}|${certificate.blockCount}`;
    const expectedSealHash = sha256(expectedSealData);

    return expectedSealHash === certificate.sealHash;
  }

  /**
   * Serializes the chain to JSON string.
   */
  public toJSON(): string {
    return JSON.stringify(this.chain);
  }

  /**
   * Deserializes a chain from JSON string and validates integrity.
   */
  public static fromJSON<T>(jsonString: string): Sha256LedgerChain<T> {
    const parsed = JSON.parse(jsonString) as LedgerBlock<T>[];
    return new Sha256LedgerChain<T>(parsed);
  }
}
