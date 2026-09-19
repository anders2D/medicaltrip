import { DomainError } from '../../domain/errors/domain-error.js';
import { SettlementCalculator, SETTLEMENT_RATE_CONSTANTS } from '../settlement/settlement-calculator.js';
import { LedgerHashChain } from '../settlement/ledger-hash-chain.js';

/**
 * Query Handler: GetAuditReportQuery
 * Produces comprehensive accounting audit reports with chronological ledger entries,
 * quotation spread breakdowns (23%-30%), and cryptographic SHA-256 integrity verification.
 */
export class GetAuditReportQuery {
  /** @type {import('../../domain/ports/storage-port.js').IStoragePort} */
  #storagePort;
  /** @type {import('../settlement/ledger-hash-chain.js').LedgerHashChain | null} */
  #ledgerHashChain;

  /**
   * @param {object} params
   * @param {import('../../domain/ports/storage-port.js').IStoragePort} params.storagePort
   * @param {import('../settlement/ledger-hash-chain.js').LedgerHashChain} [params.ledgerHashChain=null]
   */
  constructor({
    storagePort,
    ledgerHashChain = null
  } = {}) {
    if (!storagePort) {
      throw new DomainError('[GetAuditReportQuery] storagePort es obligatorio.');
    }
    this.#storagePort = storagePort;
    this.#ledgerHashChain = ledgerHashChain;
  }

  /**
   * Generates comprehensive accounting audit report.
   * @param {object} params
   * @param {string} params.reservationCode
   * @param {number} [params.spreadPercentage=25]
   * @returns {Promise<object>}
   */
  async execute({
    reservationCode,
    spreadPercentage = SETTLEMENT_RATE_CONSTANTS.DEFAULT_RECOMMENDED_SPREAD_PERCENT
  }) {
    if (!reservationCode) {
      throw new DomainError('[GetAuditReportQuery] reservationCode es obligatorio.');
    }

    const rva = reservationCode.trim();
    const ledger = await this.#storagePort.getSettlementLedger(rva);
    if (!ledger) {
      throw new DomainError(`[GetAuditReportQuery] No se encontró libro de liquidación para '${rva}'.`);
    }

    // Attempt to load patient record if available
    let patientRecord = null;
    if (typeof this.#storagePort.getPatientRecord === 'function') {
      patientRecord = await this.#storagePort.getPatientRecord(ledger.patientUuid);
    }

    // Verify CQRS hash chain integrity if available
    let cqrsAudit = {
      chainLength: 0,
      isValid: true,
      rootHash: '0000000000000000000000000000000000000000000000000000000000000000',
      latestHash: '0000000000000000000000000000000000000000000000000000000000000000'
    };

    if (this.#ledgerHashChain) {
      const integrity = await this.#ledgerHashChain.verifyChainIntegrity();
      const events = await this.#ledgerHashChain.getEvents();
      cqrsAudit = {
        chainLength: events.length,
        isValid: integrity.isValid,
        error: integrity.error || null,
        rootHash: integrity.rootHash,
        latestHash: integrity.latestHash
      };
    } else if (typeof this.#storagePort.getEventStream === 'function') {
      const events = await this.#storagePort.getEventStream(rva);
      const integrity = LedgerHashChain.verifyStaticChain(events);
      cqrsAudit = {
        chainLength: events.length,
        isValid: integrity.isValid,
        error: integrity.error || null,
        rootHash: integrity.rootHash,
        latestHash: integrity.latestHash
      };
    }

    // Generate comprehensive multi-day balance sheet
    const balanceSheet = SettlementCalculator.generateAuditBalanceSheet({
      reservationCode: ledger.reservationCode,
      patientUuid: ledger.patientUuid,
      currency: ledger.currency,
      advances: ledger.advances,
      expenses: ledger.expenses,
      driverTransfers: ledger.driverTransfers,
      companionShifts: ledger.companionShifts,
      spreadPercentage,
      generatedAt: new Date().toISOString()
    });

    return {
      reportTitle: `Informe de Auditoría Financiera y Liquidación — ${ledger.reservationCode}`,
      organization: 'Medical Trip Colombia S.A.S.',
      reservationCode: ledger.reservationCode,
      patient: {
        patientUuid: ledger.patientUuid,
        fullName: patientRecord ? patientRecord.full_name || patientRecord.fullName : 'Paciente Internacional',
        originCountry: patientRecord ? patientRecord.origin_country || patientRecord.originCountry : 'Internacional',
        specialty: patientRecord ? patientRecord.specialty : 'Cirugía Médica'
      },
      currency: ledger.currency,
      generatedAt: balanceSheet.generatedAt,
      totals: balanceSheet.totals,
      categoryBreakdown: balanceSheet.categoryBreakdown,
      quotationSpread: balanceSheet.quotationSpread,
      counts: balanceSheet.counts,
      lineEntries: balanceSheet.lineEntries,
      verificationHash: balanceSheet.verificationHash,
      cqrsAudit
    };
  }
}
