import { IItineraryRepository } from '../../application/ports/IItineraryRepository';
import { ILedgerRepository } from '../../application/ports/ILedgerRepository';
import { MedicalItinerary, BalanceSheet } from '../../domain/aggregates/MedicalItinerary';
import { Booking, BookingStatus } from '../../domain/entities/Booking';
import {
  ItineraryMilestone,
  MilestoneCategory,
  MilestoneFinancialType,
  MilestoneStatus,
} from '../../domain/entities/ItineraryMilestone';
import {
  FinancialTransaction,
  TransactionType,
} from '../../domain/entities/FinancialTransaction';
import { Money, CurrencyCode } from '../../domain/values/Money';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';
import {
  DexieMedicalTripDB,
  StoredItineraryRecord,
  StoredMilestoneRecord,
  StoredTransactionRecord,
  StoredBinaryBlobRecord,
  getMedicalTripDB,
} from './DexieMedicalTripDB';

export class DexieItineraryRepository implements IItineraryRepository, ILedgerRepository {
  private readonly db: DexieMedicalTripDB;

  constructor(db?: DexieMedicalTripDB) {
    this.db = db || getMedicalTripDB();
  }

  // =========================================================================
  // IItineraryRepository Implementation
  // =========================================================================

  /**
   * Loads a MedicalItinerary aggregate by its booking ID.
   */
  async getById(id: string): Promise<MedicalItinerary | null> {
    const itineraryRecord = await this.db.itineraries.get(id);
    if (!itineraryRecord) {
      return null;
    }
    return this.hydrateAggregate(itineraryRecord);
  }

  /**
   * Loads a MedicalItinerary aggregate by its booking code (e.g. "RVA171-4").
   */
  async getByBookingCode(code: string): Promise<MedicalItinerary | null> {
    const itineraryRecord = await this.db.itineraries
      .where('code')
      .equals(code)
      .first();

    if (!itineraryRecord) {
      return null;
    }
    return this.hydrateAggregate(itineraryRecord);
  }

  /**
   * Saves a MedicalItinerary aggregate atomically to IndexedDB.
   * Persists booking metadata, milestones, and transactions.
   */
  async save(itinerary: MedicalItinerary): Promise<void> {
    const booking = itinerary.booking;
    const now = new Date().toISOString();

    const itineraryRecord: StoredItineraryRecord = {
      id: booking.id,
      code: booking.code,
      patientId: booking.patientId,
      paxCount: booking.paxCount,
      arrivalDate: booking.arrivalDate.toISOString(),
      departureDate: booking.departureDate.toISOString(),
      arrivalAirline: booking.arrivalAirline,
      arrivalFlight: booking.arrivalFlight,
      hotelId: booking.hotelId,
      hotelName: booking.hotelName,
      status: booking.status,
      checkMigIn: booking.checkMigIn,
      checkMigOut: booking.checkMigOut,
      notes: booking.notes,
      defaultCurrency: itinerary.defaultCurrency,
      createdAt: now,
      updatedAt: now,
    };

    const milestoneRecords: StoredMilestoneRecord[] = itinerary.milestones.map((m) => ({
      id: m.id,
      reservaId: m.reservaId,
      dayNumber: m.dayNumber,
      title: m.title,
      category: m.category,
      startDateTime: m.startDateTime.toISOString(),
      endDateTime: m.endDateTime.toISOString(),
      location: m.location.rawName,
      canonicalCorridor: m.location.canonicalCorridor,
      coordinates: m.coordinates ? m.coordinates.toJSON() : undefined,
      providerId: m.providerId,
      providerName: m.providerName,
      assignedDriverId: m.assignedDriverId,
      assignedGuideId: m.assignedGuideId,
      assignedNurseId: m.assignedNurseId,
      financialType: m.financialType,
      costCents: m.cost.amountInCents.toString(),
      currency: m.cost.currency,
      guideHours: m.guideHours,
      status: m.status,
      notes: m.notes,
      requiresGpsCheckIn: m.requiresGpsCheckIn,
      requiresSignature: m.requiresSignature,
      requiresReceipt: m.requiresReceipt,
      gpsChecked: m.gpsChecked,
      gpsCheckInTime: m.gpsCheckInTime ? m.gpsCheckInTime.toISOString() : undefined,
      signatureUuid: m.signatureUuid,
      receiptUuid: m.receiptUuid,
    }));

    const transactionRecords: StoredTransactionRecord[] = itinerary.transactions.map((t) => ({
      id: t.id,
      reservaId: t.reservaId,
      milestoneId: t.milestoneId,
      timestamp: t.timestamp.toISOString(),
      type: t.type,
      amountCents: t.amount.amountInCents.toString(),
      currency: t.amount.currency,
      description: t.description,
      receiptUuid: t.receiptUuid,
      audited: t.audited,
      auditedBy: t.auditedBy,
    }));

    // Atomically persist to Dexie
    await this.db.transaction('rw', [this.db.itineraries, this.db.milestones, this.db.transactions], async () => {
      // 1. Put itinerary record
      await this.db.itineraries.put(itineraryRecord);

      // 2. Sync milestones (remove milestones for this booking code no longer in aggregate)
      const existingMilestones = await this.db.milestones.where('reservaId').equals(booking.code).toArray();
      const currentMilestoneIds = new Set(milestoneRecords.map((m) => m.id));
      const milestonesToDelete = existingMilestones
        .filter((m) => !currentMilestoneIds.has(m.id))
        .map((m) => m.id);

      if (milestonesToDelete.length > 0) {
        await this.db.milestones.bulkDelete(milestonesToDelete);
      }
      if (milestoneRecords.length > 0) {
        await this.db.milestones.bulkPut(milestoneRecords);
      }

      // 3. Sync transactions
      const existingTransactions = await this.db.transactions.where('reservaId').equals(booking.code).toArray();
      const currentTxIds = new Set(transactionRecords.map((t) => t.id));
      const txsToDelete = existingTransactions
        .filter((t) => !currentTxIds.has(t.id))
        .map((t) => t.id);

      if (txsToDelete.length > 0) {
        await this.db.transactions.bulkDelete(txsToDelete);
      }
      if (transactionRecords.length > 0) {
        await this.db.transactions.bulkPut(transactionRecords);
      }
    });
  }

  /**
   * Lists all MedicalItinerary aggregates stored in the database.
   */
  async list(): Promise<MedicalItinerary[]> {
    const itineraryRecords = await this.db.itineraries.toArray();
    const aggregates: MedicalItinerary[] = [];
    for (const record of itineraryRecords) {
      const agg = await this.hydrateAggregate(record);
      aggregates.push(agg);
    }
    return aggregates;
  }

  /**
   * Deletes an itinerary and its cascading milestones and transactions.
   */
  async delete(id: string): Promise<void> {
    const itinerary = await this.db.itineraries.get(id);
    if (!itinerary) return;

    await this.db.transaction('rw', [this.db.itineraries, this.db.milestones, this.db.transactions], async () => {
      await this.db.itineraries.delete(id);
      await this.db.milestones.where('reservaId').equals(itinerary.code).delete();
      await this.db.transactions.where('reservaId').equals(itinerary.code).delete();
    });
  }

  // =========================================================================
  // ILedgerRepository Implementation
  // =========================================================================

  /**
   * Retrieves all financial transactions for a booking reservation code.
   */
  async getTransactions(reservaId: string): Promise<FinancialTransaction[]> {
    const records = await this.db.transactions.where('reservaId').equals(reservaId).toArray();
    return records.map((r) => this.hydrateTransaction(r));
  }

  /**
   * Appends an immutable financial transaction directly to the ledger.
   */
  async appendTransaction(tx: FinancialTransaction): Promise<void> {
    const record: StoredTransactionRecord = {
      id: tx.id,
      reservaId: tx.reservaId,
      milestoneId: tx.milestoneId,
      timestamp: tx.timestamp.toISOString(),
      type: tx.type,
      amountCents: tx.amount.amountInCents.toString(),
      currency: tx.amount.currency,
      description: tx.description,
      receiptUuid: tx.receiptUuid,
      audited: tx.audited,
      auditedBy: tx.auditedBy,
    };
    await this.db.transactions.put(record);
  }

  /**
   * Computes and returns the BalanceSheet for a reservation code.
   */
  async getBalanceSheet(reservaId: string): Promise<BalanceSheet | null> {
    const itinerary = await this.getByBookingCode(reservaId);
    if (itinerary) {
      return itinerary.calculateBalanceSheet();
    }

    // Fallback: calculate directly from standalone transactions if itinerary not registered
    const txRecords = await this.db.transactions.where('reservaId').equals(reservaId).toArray();
    if (txRecords.length === 0) {
      return null;
    }

    const txs = txRecords.map((r) => this.hydrateTransaction(r));
    const currency: CurrencyCode = (txRecords[0].currency as CurrencyCode) || 'COP';

    let totalOutOfPocket = Money.zero(currency);
    let totalCompanionFees = Money.zero(currency);
    let totalFleetTaxis = Money.zero(currency);
    let totalCashAdvances = Money.zero(currency);

    for (const tx of txs) {
      switch (tx.type) {
        case 'OUT_OF_POCKET':
          totalOutOfPocket = totalOutOfPocket.add(tx.amount);
          break;
        case 'GUIDE_FEE':
          totalCompanionFees = totalCompanionFees.add(tx.amount);
          break;
        case 'FLEET_TAXI':
          totalFleetTaxis = totalFleetTaxis.add(tx.amount);
          break;
        case 'CASH_ADVANCE':
          totalCashAdvances = totalCashAdvances.add(tx.amount);
          break;
      }
    }

    const totalExpenses = totalOutOfPocket.add(totalCompanionFees).add(totalFleetTaxis);
    const netBalance = totalExpenses.subtract(totalCashAdvances);

    return {
      reservaId,
      currency,
      totalOutOfPocket,
      totalCompanionFees,
      totalFleetTaxis,
      totalExpenses,
      totalCashAdvances,
      netBalance,
      isPatientOwing: netBalance.isPositive(),
      isRefundDue: netBalance.isNegative(),
      transactionCount: txs.length,
      milestoneCount: 0,
    };
  }

  // =========================================================================
  // Binary Blobs Persistence Helpers
  // =========================================================================

  async saveBlob(blob: StoredBinaryBlobRecord): Promise<void> {
    await this.db.binaryBlobs.put(blob);
  }

  async getBlob(id: string): Promise<StoredBinaryBlobRecord | null> {
    const record = await this.db.binaryBlobs.get(id);
    return record || null;
  }

  async getBlobsByRelatedId(relatedId: string): Promise<StoredBinaryBlobRecord[]> {
    return this.db.binaryBlobs.where('relatedId').equals(relatedId).toArray();
  }

  async deleteBlob(id: string): Promise<void> {
    await this.db.binaryBlobs.delete(id);
  }

  // =========================================================================
  // Hydration Helpers
  // =========================================================================

  private async hydrateAggregate(record: StoredItineraryRecord): Promise<MedicalItinerary> {
    const booking = new Booking({
      id: record.id,
      code: record.code,
      patientId: record.patientId,
      paxCount: record.paxCount,
      arrivalDate: record.arrivalDate,
      departureDate: record.departureDate,
      arrivalAirline: record.arrivalAirline,
      arrivalFlight: record.arrivalFlight,
      hotelId: record.hotelId,
      hotelName: record.hotelName,
      status: record.status as BookingStatus,
      checkMigIn: record.checkMigIn,
      checkMigOut: record.checkMigOut,
      notes: record.notes,
    });

    const [milestoneRecords, txRecords] = await Promise.all([
      this.db.milestones.where('reservaId').equals(record.code).toArray(),
      this.db.transactions.where('reservaId').equals(record.code).toArray(),
    ]);

    const milestones = milestoneRecords.map((m) => this.hydrateMilestone(m));
    const transactions = txRecords.map((t) => this.hydrateTransaction(t));

    return new MedicalItinerary({
      booking,
      milestones,
      transactions,
      defaultCurrency: record.defaultCurrency,
    });
  }

  private hydrateMilestone(r: StoredMilestoneRecord): ItineraryMilestone {
    return new ItineraryMilestone({
      id: r.id,
      reservaId: r.reservaId,
      dayNumber: r.dayNumber,
      title: r.title,
      category: r.category as MilestoneCategory,
      startDateTime: r.startDateTime,
      endDateTime: r.endDateTime,
      location: new OperativeTerritory(r.location),
      coordinates: r.coordinates
        ? new Coordinates(r.coordinates.latitude, r.coordinates.longitude)
        : undefined,
      providerId: r.providerId,
      providerName: r.providerName,
      assignedDriverId: r.assignedDriverId,
      assignedGuideId: r.assignedGuideId,
      assignedNurseId: r.assignedNurseId,
      financialType: r.financialType as MilestoneFinancialType,
      cost: Money.fromCents(BigInt(r.costCents || '0'), r.currency || 'COP'),
      guideHours: r.guideHours,
      status: r.status as MilestoneStatus,
      notes: r.notes,
      requiresGpsCheckIn: r.requiresGpsCheckIn,
      requiresSignature: r.requiresSignature,
      requiresReceipt: r.requiresReceipt,
      gpsChecked: r.gpsChecked,
      gpsCheckInTime: r.gpsCheckInTime,
      signatureUuid: r.signatureUuid,
      receiptUuid: r.receiptUuid,
    });
  }

  private hydrateTransaction(r: StoredTransactionRecord): FinancialTransaction {
    return new FinancialTransaction({
      id: r.id,
      reservaId: r.reservaId,
      milestoneId: r.milestoneId,
      timestamp: r.timestamp,
      type: r.type as TransactionType,
      amount: Money.fromCents(BigInt(r.amountCents || '0'), r.currency || 'COP'),
      description: r.description,
      receiptUuid: r.receiptUuid,
      audited: r.audited,
      auditedBy: r.auditedBy,
    });
  }
}
