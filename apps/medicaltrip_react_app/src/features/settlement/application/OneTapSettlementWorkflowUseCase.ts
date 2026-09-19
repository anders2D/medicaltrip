/**
 * Medical Trip Colombia S.A.S. - OneTapSettlementWorkflowUseCase
 * Flow 5: 1-Tap Settlement Reconciliation, Biometric Digital Signature, SHA-256 Ledger Chaining & PDF Export.
 *
 * Atomically executes in one pipeline:
 * 1. Deterministic Ledger Reconciliation with exact BigInt cents arithmetic.
 * 2. Digital Sign-off with Dexie blob storage persistence, immutable Sha256LedgerChain block sealing, and CQRS event dispatch.
 * 3. Audit PDF Statement & JSON generation with embedded biometric signature and cryptographic seal.
 */

import { IStoragePort } from '@/core/ports';
import { IExportPort } from '../domain/IExportPort';
import { IBlobStoragePort } from '@/core/ports';
import { PatientBooking } from '@/core/domain';
import { SettlementLedger, CashAdvance } from '../domain/SettlementLedger';
import { ItineraryEvent } from '@/features/itinerary';
import { InvalidBookingError } from '@/core/domain';
import { Sha256LedgerChain } from '../infrastructure/Sha256LedgerChain';
import { JsonPdfExportAdapter } from '../infrastructure/JsonPdfExportAdapter';

export type SignatoryRole = 'PATIENT' | 'GUIDE' | 'AUDITOR' | 'COORDINATOR';

export interface OneTapSettlementWorkflowDTO {
  bookingId: string;
  signatoryRole: 'PATIENT' | 'GUIDE' | 'AUDITOR' | 'COORDINATOR';
  signatureBase64Png: string;
  date?: string;
  dayNumber?: number;
  clientMetadata?: {
    signerName?: string;
    notes?: string;
    userAgent?: string;
    ipAddress?: string;
    additionalAdvances?: CashAdvance[];
    eventId?: string;
  };
}

export interface OneTapSettlementWorkflowResult {
  readonly ledger: SettlementLedger;
  readonly signatureBlobId: string;
  readonly sha256Seal: string;
  readonly pdfBlob: Blob;
  readonly pdfFilename: string;
  readonly booking: PatientBooking;
  readonly events: ItineraryEvent[];
  readonly jsonExport: string;
}

export class OneTapSettlementWorkflowUseCase {
  private readonly exportAdapter: IExportPort;

  constructor(
    private readonly storagePort: IStoragePort,
    exportPort?: IExportPort,
    private readonly blobStoragePort?: IBlobStoragePort
  ) {
    this.exportAdapter = exportPort || new JsonPdfExportAdapter();
  }

  public async execute(
    dto: OneTapSettlementWorkflowDTO
  ): Promise<OneTapSettlementWorkflowResult> {
    const booking = await this.storagePort.getBooking(dto.bookingId);
    if (!booking) {
      throw new InvalidBookingError(`Booking not found for settlement: ${dto.bookingId}`);
    }

    // 1. Retrieve all related operational items for reconciliation
    const expenses = await this.storagePort.getExpensesByBooking(dto.bookingId);
    const shifts = await this.storagePort.getShiftsByBooking(dto.bookingId);
    const transfers = await this.storagePort.getTransfersByBooking(dto.bookingId);
    const existingSettlement = await this.storagePort.getSettlement(dto.bookingId);

    // Merge advances deterministically
    const advancesMap = new Map<string, CashAdvance>();
    if (existingSettlement) {
      for (const adv of existingSettlement.advances) {
        advancesMap.set(adv.id, adv);
      }
    }
    if (dto.clientMetadata?.additionalAdvances) {
      for (const adv of dto.clientMetadata.additionalAdvances) {
        advancesMap.set(adv.id, adv);
      }
    }
    const advances = Array.from(advancesMap.values());

    // 2. BigInt exact arithmetic reconciliation pre-calculation (Liquidación Diaria)
    const preliminaryLedger = SettlementLedger.calculate({
      bookingId: dto.bookingId,
      date: dto.date,
      dayNumber: dto.dayNumber,
      settlementType: 'DAILY',
      expenses,
      shifts,
      transfers,
      advances,
    });

    // 3. Persist Digital Signature Blob
    const signatureBlobId = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const blobPort = this.blobStoragePort || this.storagePort;
    if (blobPort && typeof blobPort.saveBlob === 'function') {
      await blobPort.saveBlob(
        signatureBlobId,
        dto.bookingId,
        'image/png',
        'SIGNATURE',
        dto.signatureBase64Png
      );
    }

    // 4. Build Immutable SHA-256 Ledger Chain & Cryptographic Seal
    const chain = new Sha256LedgerChain();
    const totalDebits = preliminaryLedger.totalExpenses
      .add(preliminaryLedger.totalGuideFees)
      .add(preliminaryLedger.totalFleetTaxis);

    chain.addBlock({
      bookingId: dto.bookingId,
      patientId: booking.patientId || booking.code,
      totalExpenses: preliminaryLedger.totalExpenses.toJSON(),
      totalGuideFees: preliminaryLedger.totalGuideFees.toJSON(),
      totalFleetTaxis: preliminaryLedger.totalFleetTaxis.toJSON(),
      totalDebits: totalDebits.toJSON(),
      totalAdvances: preliminaryLedger.totalAdvances.toJSON(),
      netBalance: preliminaryLedger.netBalance.toJSON(),
      signatoryRole: dto.signatoryRole,
      signerName: dto.clientMetadata?.signerName || booking.patientFullName,
      signatureBlobId,
      timestamp: Date.now(),
    });

    const sealCertificate = chain.signLedgerSeal(
      booking.patientId || booking.code,
      dto.signatureBase64Png,
      Date.now()
    );
    const sha256Seal = sealCertificate.sealHash;

    // 5. Finalize and Save Reconciled & Sealed Settlement Ledger (Liquidación Diaria)
    const sealedLedger = SettlementLedger.calculate({
      bookingId: dto.bookingId,
      date: dto.date,
      dayNumber: dto.dayNumber,
      settlementType: 'DAILY',
      expenses,
      shifts,
      transfers,
      advances,
      sha256Seal,
    });
    await this.storagePort.saveSettlement(sealedLedger);

    // If attached to a specific milestone event, update event signature
    if (dto.clientMetadata?.eventId) {
      const event = await this.storagePort.getEventById(dto.clientMetadata.eventId);
      if (event) {
        const updatedEvent = event.attachSignature(signatureBlobId);
        await this.storagePort.saveEvent(updatedEvent);
      }
    }

    // 7. Compile Print-Ready Audit PDF & JSON Statement
    const events = await this.storagePort.getEventsByBooking(dto.bookingId);
    const pdfBlob = await this.exportAdapter.exportSettlementPdf(
      booking,
      sealedLedger,
      events,
      dto.signatureBase64Png
    );
    const jsonExport = await this.exportAdapter.exportLedgerJson(sealedLedger);

    // Save exported PDF blob to blob storage if supported
    const pdfExportId = `pdf-${dto.bookingId}-${Date.now()}`;
    if (blobPort && typeof blobPort.saveBlob === 'function') {
      await blobPort.saveBlob(
        pdfExportId,
        dto.bookingId,
        'application/pdf',
        'EXPORT_PDF',
        pdfBlob
      );
    }

    // 6. Record CQRS Domain Events into stream
    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: dto.bookingId,
      type: 'ITINERARY_SIGNED_OFF',
      payload: {
        signatureId: signatureBlobId,
        signatureBlobId,
        signerRole: dto.signatoryRole,
        signerName: dto.clientMetadata?.signerName || booking.patientFullName,
        sha256Seal,
        settlementType: 'DAILY',
        date: dto.date,
        dayNumber: dto.dayNumber,
        eventId: dto.clientMetadata?.eventId,
      },
      timestamp: Date.now(),
    });

    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: dto.bookingId,
      type: 'SETTLEMENT_RECONCILED',
      payload: {
        settlementType: 'DAILY',
        date: dto.date,
        dayNumber: dto.dayNumber,
        totalExpenses: sealedLedger.totalExpenses.toJSON(),
        totalGuideFees: sealedLedger.totalGuideFees.toJSON(),
        totalFleetTaxis: sealedLedger.totalFleetTaxis.toJSON(),
        totalAdvances: sealedLedger.totalAdvances.toJSON(),
        netBalance: sealedLedger.netBalance.toJSON(),
        sha256Seal,
      },
      timestamp: Date.now(),
    });

    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: dto.bookingId,
      type: 'SETTLEMENT_PDF_EXPORTED',
      payload: {
        bookingId: dto.bookingId,
        netBalance: sealedLedger.netBalance.toJSON(),
        sha256Seal,
        signatureBlobId,
      },
      timestamp: Date.now(),
    });

    const cleanPatientName = booking.firstName.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfFilename = `Liquidacion_${booking.code}_${cleanPatientName}_${Date.now()}.html`;

    return {
      ledger: sealedLedger,
      signatureBlobId,
      sha256Seal,
      pdfBlob,
      pdfFilename,
      booking,
      events,
      jsonExport,
    };
  }
}
