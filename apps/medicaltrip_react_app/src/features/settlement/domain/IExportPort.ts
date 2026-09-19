import { PatientBooking } from '@/core/domain';
import { SettlementLedger } from './SettlementLedger';
import { ItineraryEvent } from '@/features/itinerary';

export interface IExportPort {
  exportSettlementPdf(
    booking: PatientBooking,
    ledger: SettlementLedger,
    events: ItineraryEvent[],
    signatureDataUrl?: string,
    lang?: string
  ): Promise<Blob>;
  exportLedgerJson(ledger: SettlementLedger): Promise<string>;
}

