/**
 * Financial Auditor Subagent Worker [FIN]
 * Asynchronously audits ledger events, computes SHA-256 cryptographic hashes for ledger entries,
 * builds hash chains for tamper-evident audit logs, and validates:
 * Net Balance = Out-of-Pocket + Companion Fees + Fleet Taxis - Cash Advances
 */

export interface TransactionSummaryItem {
  id: string;
  type: 'OUT_OF_POCKET' | 'GUIDE_FEE' | 'FLEET_TAXI' | 'CASH_ADVANCE' | string;
  amountUnits: number; // in currency units or cents
  description?: string;
  reservaId?: string;
}

export interface AuditLedgerRequest {
  totalCuentaCobro?: number; // legacy or aggregated expenses
  advanceTotal?: number; // total cash advances
  outOfPocketTotal?: number;
  companionFeesTotal?: number;
  fleetTaxisTotal?: number;
  transactions?: TransactionSummaryItem[];
  currency?: 'COP' | 'USD';
}

export interface AuditLedgerResult {
  audited: boolean;
  totalOutOfPocket: number;
  totalCompanionFees: number;
  totalFleetTaxis: number;
  totalExpenses: number;
  totalAdvances: number;
  netBalance: number;
  status: 'DEFICIT_PAYABLE' | 'SURPLUS_MEDICAL_TRIP' | 'SETTLED';
  isPatientOwing: boolean;
  isRefundDue: boolean;
  currency: 'COP' | 'USD';
  auditedAt: string;
  auditedBy: string;
}

export interface AuditBlock {
  index: number;
  tx: any;
  prevHash: string;
  hash: string;
  timestamp: string;
}

export interface HashChainVerificationResult {
  valid: boolean;
  chainLength: number;
  tamperedIndex?: number;
  error?: string;
}

/**
 * Deterministic SHA-256 hash generator.
 * Works synchronously and asynchronously across Node.js, Web Workers, and standard browsers.
 */
export function sha256Sync(input: string): string {
  // Pure JavaScript SHA-256 implementation to guarantee synchronous execution in Web Workers and Node without async overhead
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = input[lengthProperty] * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < input[lengthProperty]; i++) {
    const charCode = input.charCodeAt(i);
    words[i >> 2] |= charCode << ((3 - (i % 4)) * 8);
  }

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = i >= 16 ? rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3) : 0;
      const s1 = i >= 16 ? rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10) : 0;

      if (i >= 16) {
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const s1Ch = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1Ch + ch + k[i] + w[i]) | 0;

      const s0Maj = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0Maj + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

/**
 * Computes SHA-256 hash for transaction payloads deterministically.
 */
export function computeTransactionHash(
  tx: any,
  prevHash = '0000000000000000000000000000000000000000000000000000000000000000'
): string {
  const payload = JSON.stringify({ ...tx, prevHash });
  return sha256Sync(payload);
}

/**
 * Audits ledger events, computing net balances and deficit/surplus status.
 */
export function auditLedger(request: AuditLedgerRequest): AuditLedgerResult {
  let outOfPocket = request.outOfPocketTotal || 0;
  let companion = request.companionFeesTotal || 0;
  let fleet = request.fleetTaxisTotal || 0;
  let advances = request.advanceTotal || 0;

  if (request.transactions && request.transactions.length > 0) {
    outOfPocket = 0;
    companion = 0;
    fleet = 0;
    advances = 0;

    for (const tx of request.transactions) {
      const amt = tx.amountUnits || 0;
      switch (tx.type) {
        case 'OUT_OF_POCKET':
        case 'PHARMACY':
          outOfPocket += amt;
          break;
        case 'GUIDE_FEE':
        case 'GUIA':
          companion += amt;
          break;
        case 'FLEET_TAXI':
        case 'TRANSPORTE':
        case 'DRV':
          fleet += amt;
          break;
        case 'CASH_ADVANCE':
        case 'ANTICIPO':
          advances += amt;
          break;
      }
    }
  } else if (typeof request.totalCuentaCobro === 'number') {
    // Legacy support for aggregate totals
    const totalExpenses = request.totalCuentaCobro;
    const net = totalExpenses - advances;
    return {
      audited: true,
      totalOutOfPocket: outOfPocket,
      totalCompanionFees: companion,
      totalFleetTaxis: fleet,
      totalExpenses,
      totalAdvances: advances,
      netBalance: net,
      status: net > 0 ? 'DEFICIT_PAYABLE' : net < 0 ? 'SURPLUS_MEDICAL_TRIP' : 'SETTLED',
      isPatientOwing: net > 0,
      isRefundDue: net < 0,
      currency: request.currency || 'COP',
      auditedAt: new Date().toISOString(),
      auditedBy: 'FIN-AUDITOR-AGENT',
    };
  }

  const totalExpenses = outOfPocket + companion + fleet;
  const netBalance = totalExpenses - advances;

  let status: 'DEFICIT_PAYABLE' | 'SURPLUS_MEDICAL_TRIP' | 'SETTLED' = 'SETTLED';
  if (netBalance > 0) {
    status = 'DEFICIT_PAYABLE';
  } else if (netBalance < 0) {
    status = 'SURPLUS_MEDICAL_TRIP';
  }

  return {
    audited: true,
    totalOutOfPocket: outOfPocket,
    totalCompanionFees: companion,
    totalFleetTaxis: fleet,
    totalExpenses,
    totalAdvances: advances,
    netBalance,
    status,
    isPatientOwing: netBalance > 0,
    isRefundDue: netBalance < 0,
    currency: request.currency || 'COP',
    auditedAt: new Date().toISOString(),
    auditedBy: 'FIN-AUDITOR-AGENT',
  };
}

/**
 * Builds a consecutive cryptographic hash chain from a list of transactions.
 */
export function buildHashChain(transactions: any[]): AuditBlock[] {
  const blocks: AuditBlock[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const prevHash = i === 0 ? 'GENESIS_HASH' : blocks[i - 1].hash;
    const hash = computeTransactionHash(tx, prevHash);
    blocks.push({
      index: i,
      tx,
      prevHash,
      hash,
      timestamp: new Date().toISOString(),
    });
  }

  return blocks;
}

/**
 * Verifies the integrity of a cryptographic hash chain.
 */
export function verifyHashChain(blocks: AuditBlock[]): HashChainVerificationResult {
  if (!blocks || blocks.length === 0) {
    return { valid: true, chainLength: 0 };
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const expectedPrev = i === 0 ? 'GENESIS_HASH' : blocks[i - 1].hash;

    if (block.prevHash !== expectedPrev) {
      return {
        valid: false,
        chainLength: blocks.length,
        tamperedIndex: i,
        error: `[Hash Pointer Mismatch at block ${i}]: Expected prevHash '${expectedPrev}', got '${block.prevHash}'`,
      };
    }

    const recomputedHash = computeTransactionHash(block.tx, block.prevHash);
    if (block.hash !== recomputedHash) {
      return {
        valid: false,
        chainLength: blocks.length,
        tamperedIndex: i,
        error: `[Content Tampering Detected at block ${i}]: Recomputed hash '${recomputedHash}' does not match stored block hash '${block.hash}'`,
      };
    }
  }

  return {
    valid: true,
    chainLength: blocks.length,
  };
}

/**
 * Cryptographically seals the ledger with a patient or coordinator signature.
 */
export function signLedgerSeal(
  lastBlockHash: string,
  signatureDataUrl: string,
  signerInfo: { patientId: string; patientName: string; signerRole?: string }
): {
  patientId: string;
  patientName: string;
  signerRole: string;
  signedLedgerHash: string;
  signatureBlobHash: string;
  signedAt: string;
} {
  const signatureBlobHash = sha256Sync(signatureDataUrl);
  return {
    patientId: signerInfo.patientId,
    patientName: signerInfo.patientName,
    signerRole: signerInfo.signerRole || 'PATIENT',
    signedLedgerHash: lastBlockHash,
    signatureBlobHash,
    signedAt: new Date().toISOString(),
  };
}

/**
 * Financial Auditor Subagent Request Dispatcher
 */
export function processFinancialAction(action: string, payload: any): any {
  switch (action) {
    case 'AUDIT_LEDGER':
      return auditLedger(payload);

    case 'COMPUTE_HASH':
      return {
        hash: computeTransactionHash(payload.tx, payload.prevHash),
      };

    case 'BUILD_HASH_CHAIN':
      return {
        blocks: buildHashChain(payload.transactions || []),
      };

    case 'VERIFY_HASH_CHAIN':
      return verifyHashChain(payload.blocks || []);

    case 'SIGN_LEDGER_SEAL':
      return signLedgerSeal(payload.lastBlockHash, payload.signatureDataUrl, payload.signerInfo);

    default:
      throw new Error(`[FinancialAuditorWorker]: Unknown action '${action}'`);
  }
}

// Web Worker message event listener
if (
  typeof self !== 'undefined' &&
  typeof (self as any).addEventListener === 'function' &&
  typeof (self as any).postMessage === 'function'
) {
  (self as any).addEventListener('message', (event: MessageEvent) => {
    const { id, action, payload } = event.data || {};
    try {
      const result = processFinancialAction(action, payload);
      (self as any).postMessage({ id, success: true, result });
    } catch (err: any) {
      (self as any).postMessage({ id, success: false, error: err.message });
    }
  });
}
