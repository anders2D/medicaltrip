/**
 * Medical Trip Colombia S.A.S. — Application Layer Barrel Export.
 * Deterministic Financial Settlement, Single-Writer CQRS Event Stream, and Command/Query Handlers.
 */

// Settlement Engine & CQRS Hash Chain
export {
  SettlementCalculator,
  SETTLEMENT_RATE_CONSTANTS,
  OVERDRAFT_STATUSES
} from './settlement/settlement-calculator.js';

export {
  LedgerHashChain,
  GENESIS_PREVIOUS_HASH,
  DEFAULT_AUTHORIZED_WRITERS
} from './settlement/ledger-hash-chain.js';

// Application Commands
export { TransitionItineraryStatusCommand } from './commands/transition-itinerary-status.js';
export { RecordExpenseCommand } from './commands/record-expense-command.js';
export { CaptureSignatureCommand } from './commands/capture-signature-command.js';

// Application Queries
export { GetItineraryQuery } from './queries/get-itinerary-query.js';
export { GetSettlementBalanceQuery } from './queries/get-settlement-balance-query.js';
export { GetAuditReportQuery } from './queries/get-audit-report-query.js';
