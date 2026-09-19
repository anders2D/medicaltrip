/**
 * Medical Trip Colombia S.A.S. - Financial Auditor Actor [FIN]
 * Asynchronous Web Worker Actor for independent balance sheet audit,
 * pure TypeScript SHA-256 ledger block creation, tamper detection proof, and digital signature sealing.
 */

import { ActorMessage } from '../domain/IActorEventBusPort';
import { Money } from '@/core/domain';
import {
  Sha256LedgerChain,
  LedgerBlock,
  LedgerVerificationResult,
  LedgerSealCertificate,
} from '@/features/settlement';

export interface AuditSettlementRequest {
  bookingId: string;
  fleetTaxisCents: string | number | bigint;
  guideFeesCents: string | number | bigint;
  expensesCents: string | number | bigint;
  advancesCents: string | number | bigint;
  expectedNetBalanceCents?: string | number | bigint;
}

export interface AuditSettlementResult {
  bookingId: string;
  totalDebitsCents: string;
  totalCreditsCents: string;
  netBalanceCents: string;
  status: 'SETTLED' | 'DEFICIT_PAYABLE' | 'SURPLUS_MEDICAL_TRIP';
  formattedDebits: string;
  formattedCredits: string;
  formattedNetBalance: string;
  isArithmeticValid: boolean;
  discrepancyCents: string;
  auditPassed: boolean;
}

export interface CreateBlockRequest {
  transactionType: 'TRANSFER_RECORDED' | 'GUIDE_SHIFT_LOGGED' | 'EXPENSE_SETTLED' | 'ADVANCE_RECORDED' | 'ITINERARY_SEALED';
  bookingId: string;
  amountCents: string | number | bigint;
  details: Record<string, unknown>;
  timestamp?: number;
}

export interface VerifyChainRequest {
  blocks: LedgerBlock[];
}

export interface SignSealRequest {
  patientId: string;
  signatureDataUrl: string;
  timestamp?: number;
}

export type FinancialAuditorPayload =
  | { action: 'AUDIT_SETTLEMENT'; data: AuditSettlementRequest }
  | { action: 'CREATE_LEDGER_BLOCK'; data: CreateBlockRequest }
  | { action: 'VERIFY_LEDGER_CHAIN'; data: VerifyChainRequest }
  | { action: 'SIGN_LEDGER_SEAL'; data: SignSealRequest };

export type FinancialAuditorResult =
  | { action: 'AUDIT_SETTLEMENT'; success: boolean; result?: AuditSettlementResult; error?: string }
  | { action: 'CREATE_LEDGER_BLOCK'; success: boolean; result?: LedgerBlock; error?: string }
  | { action: 'VERIFY_LEDGER_CHAIN'; success: boolean; result?: LedgerVerificationResult; error?: string }
  | { action: 'SIGN_LEDGER_SEAL'; success: boolean; result?: LedgerSealCertificate; error?: string };

// Internal ledger instance for the financial actor
const actorLedger = new Sha256LedgerChain<unknown>();

/**
 * Audits settlement transactions using exact BigInt integer cents.
 */
export function auditSettlement(req: AuditSettlementRequest): AuditSettlementResult {
  const fleet = Money.fromCents(req.fleetTaxisCents);
  const guide = Money.fromCents(req.guideFeesCents);
  const expense = Money.fromCents(req.expensesCents);
  const advance = Money.fromCents(req.advancesCents);

  const totalDebits = fleet.add(guide).add(expense);
  const totalCredits = advance;
  const netBalance = totalDebits.subtract(totalCredits);

  let status: AuditSettlementResult['status'] = 'SETTLED';
  if (netBalance.cents > 0n) {
    status = 'DEFICIT_PAYABLE';
  } else if (netBalance.cents < 0n) {
    status = 'SURPLUS_MEDICAL_TRIP';
  }

  let isArithmeticValid = true;
  let discrepancy = 0n;

  if (req.expectedNetBalanceCents !== undefined) {
    const expected = Money.fromCents(req.expectedNetBalanceCents);
    discrepancy = netBalance.cents - expected.cents;
    isArithmeticValid = discrepancy === 0n;
  }

  return {
    bookingId: req.bookingId,
    totalDebitsCents: totalDebits.cents.toString(),
    totalCreditsCents: totalCredits.cents.toString(),
    netBalanceCents: netBalance.cents.toString(),
    status,
    formattedDebits: totalDebits.formatCOP(),
    formattedCredits: totalCredits.formatCOP(),
    formattedNetBalance: netBalance.formatCOP(),
    isArithmeticValid,
    discrepancyCents: discrepancy.toString(),
    auditPassed: isArithmeticValid,
  };
}

/**
 * Creates and appends a new transaction block to the cryptographic chain.
 */
export function createLedgerBlock(req: CreateBlockRequest): LedgerBlock {
  const amountStr = typeof req.amountCents === 'bigint' ? req.amountCents.toString() : String(req.amountCents);
  const blockPayload = {
    transactionType: req.transactionType,
    bookingId: req.bookingId,
    amountCents: amountStr,
    details: req.details,
  };
  return actorLedger.addBlock(blockPayload, req.timestamp || Date.now());
}

/**
 * Verifies a given chain of blocks with tamper detection.
 */
export function verifyLedgerChain(req: VerifyChainRequest): LedgerVerificationResult {
  const chainInstance = new Sha256LedgerChain();
  return chainInstance.verifyChain(req.blocks);
}

/**
 * Signs and seals the latest ledger head with a patient/guide signature digest.
 */
export function signLedgerSeal(req: SignSealRequest): LedgerSealCertificate {
  return actorLedger.signLedgerSeal(req.patientId, req.signatureDataUrl, req.timestamp || Date.now());
}

/**
 * Message Handler for Financial Auditor Actor.
 */
export function handleFinancialAuditorMessage(
  message: ActorMessage<FinancialAuditorPayload>
): ActorMessage<FinancialAuditorResult> {
  if (!message || (message as any).type === 'CONNECT_CHANNEL') {
    return {
      id: message?.id || 'SYS_INIT',
      sender: 'FIN_ACTOR',
      recipient: message?.sender || 'MAIN_UI',
      type: 'CHANNEL_CONNECTED',
      payload: { action: 'CONNECT_CHANNEL' as any, success: true, result: null as any },
      timestamp: Date.now(),
    };
  }

  const payload = message.payload;
  if (!payload || !payload.action) {
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'FIN_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'FINANCIAL_ERROR',
      payload: { action: 'UNKNOWN' as any, success: false, error: 'Invalid payload' },
      timestamp: Date.now(),
    };
  }

  try {
    switch (payload.action) {
      case 'AUDIT_SETTLEMENT': {
        const result = auditSettlement(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'FIN_ACTOR',
          recipient: message.sender,
          type: 'SETTLEMENT_AUDITED',
          payload: { action: 'AUDIT_SETTLEMENT', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'CREATE_LEDGER_BLOCK': {
        const result = createLedgerBlock(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'FIN_ACTOR',
          recipient: message.sender,
          type: 'LEDGER_BLOCK_CREATED',
          payload: { action: 'CREATE_LEDGER_BLOCK', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'VERIFY_LEDGER_CHAIN': {
        const result = verifyLedgerChain(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'FIN_ACTOR',
          recipient: message.sender,
          type: result.valid ? 'LEDGER_CHAIN_VERIFIED' : 'TAMPER_DETECTED',
          payload: { action: 'VERIFY_LEDGER_CHAIN', success: result.valid, result },
          timestamp: Date.now(),
        };
      }

      case 'SIGN_LEDGER_SEAL': {
        const result = signLedgerSeal(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'FIN_ACTOR',
          recipient: message.sender,
          type: 'LEDGER_SEALED',
          payload: { action: 'SIGN_LEDGER_SEAL', success: true, result },
          timestamp: Date.now(),
        };
      }

      default:
        throw new Error(`Unknown Financial Auditor action: ${(payload as any).action}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Financial Auditor error';
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'FIN_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'FINANCIAL_ERROR',
      payload: { action: payload?.action || 'UNKNOWN' as any, success: false, error: errorMsg },
      timestamp: Date.now(),
    };
  }
}

// Web Worker Event Listener Attachment
if (
  typeof self !== 'undefined' &&
  typeof (self as any).postMessage === 'function' &&
  typeof window === 'undefined'
) {
  self.onmessage = (event: MessageEvent<ActorMessage<FinancialAuditorPayload>>) => {
    const response = handleFinancialAuditorMessage(event.data);
    if (response) {
      (self as any).postMessage(response);
    }
  };
}
