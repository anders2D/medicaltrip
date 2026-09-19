/**
 * Medical Trip Colombia S.A.S. - ExportSettlementPDFUseCase
 * Query / Export Use Case for compiling an itemized, print-ready PDF settlement statement with receipt thumbnails.
 */

import { IStoragePort } from '@/core/ports';
import { IExportPort } from '../domain/IExportPort';
import { IBlobStoragePort } from '@/core/ports';
import { PatientBooking } from '@/core/domain';
import { SettlementLedger } from '../domain/SettlementLedger';
import { ItineraryEvent } from '@/features/itinerary';
import { InvalidBookingError } from '@/core/domain';

export interface ExportSettlementPDFCommand {
  bookingId: string;
  includeReceipts?: boolean;
  signatureDataUrl?: string;
  languageCode?: string;
}

export interface ExportSettlementPDFResult {
  readonly pdfBlob: Blob;
  readonly jsonExport: string;
  readonly booking: PatientBooking;
  readonly ledger: SettlementLedger;
  readonly events: ItineraryEvent[];
}

export class ExportSettlementPDFUseCase {
  constructor(
    private readonly storagePort: IStoragePort,
    private readonly exportPort: IExportPort,
    private readonly blobStoragePort?: IBlobStoragePort
  ) {}

  public async execute(command: ExportSettlementPDFCommand): Promise<ExportSettlementPDFResult> {
    const booking = await this.storagePort.getBooking(command.bookingId);
    if (!booking) {
      throw new InvalidBookingError(`Booking not found: ${command.bookingId}`);
    }

    const events = await this.storagePort.getEventsByBooking(command.bookingId);
    let ledger = await this.storagePort.getSettlement(command.bookingId);

    if (!ledger) {
      const expenses = await this.storagePort.getExpensesByBooking(command.bookingId);
      const shifts = await this.storagePort.getShiftsByBooking(command.bookingId);
      const transfers = await this.storagePort.getTransfersByBooking(command.bookingId);
      ledger = SettlementLedger.calculate({
        bookingId: command.bookingId,
        expenses,
        shifts,
        transfers,
        advances: [],
      });
      await this.storagePort.saveSettlement(ledger);
    }

    const pdfBlob = await this.exportPort.exportSettlementPdf(
      booking,
      ledger,
      events,
      command.signatureDataUrl,
      command.languageCode
    );
    const jsonExport = await this.exportPort.exportLedgerJson(ledger);

    if (this.blobStoragePort) {
      const exportId = `pdf-${command.bookingId}-${Date.now()}`;
      await this.blobStoragePort.saveBlob(
        exportId,
        command.bookingId,
        'application/pdf',
        'EXPORT_PDF',
        pdfBlob
      );
    }

    await this.storagePort.appendEventLog({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId: command.bookingId,
      type: 'SETTLEMENT_PDF_EXPORTED',
      payload: {
        bookingId: command.bookingId,
        netBalance: ledger.netBalance.toJSON(),
      },
      timestamp: Date.now(),
    });

    return {
      pdfBlob,
      jsonExport,
      booking,
      ledger,
      events,
    };
  }
}
