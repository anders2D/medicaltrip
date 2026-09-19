/**
 * Medical Trip Colombia S.A.S. - Dexie IndexedDB Storage Adapter
 * Implements IStoragePort and IBlobStoragePort using Dexie.js v4 with 7 structured relational tables + CQRS event stream.
 */

import Dexie, { type EntityTable, type DexieOptions } from 'dexie';
import { IStoragePort, DomainEventRecord, StorageHealthInfo } from '../../../core/ports/IStoragePort';
import { IBlobStoragePort, BlobMetadata } from '../../../core/ports/IBlobStoragePort';
import { PatientBooking, PassengerRecord } from '../../../core/domain/entities/PatientBooking';
import { ItineraryEvent, FinancialExpenseType } from '@/features/itinerary';
import { CompanionShift, MealSubsidyTier } from '@/features/companion-shifts';
import { DriverTransfer, VehicleClass, RouteClass } from '@/features/logistics-fleet';
import { ReceiptExpense, ExpenseCategory } from '@/features/settlement';
import { SettlementLedger, CashAdvance } from '@/features/settlement';
import { Money, CurrencyCode } from '../../../core/domain/value-objects/Money';
import { OperativeTerritory, OperativeZone } from '../../../core/domain/value-objects/OperativeTerritory';
import { EventCategoryType } from '@/features/itinerary';
import { EventStatusType } from '@/features/itinerary';

export interface SerializedBooking {
  id: string;
  code: string;
  patientId: string;
  firstName: string;
  lastName: string;
  passportHash: string;
  country: string;
  language: string;
  phone: string;
  email: string;
  companionNames: string[];
  paxCount: number;
  arrivalDate: string;
  departureDate: string;
  arrivalAirline: string;
  arrivalFlight: string;
  hotelId: string;
  hotelName: string;
  status: 'PROGRAMADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  notes: string;
  passengers?: PassengerRecord[];
  requiresHotelReservation?: boolean;
  hotelVoucherFileName?: string;
  hotelVoucherFileUrl?: string;
}

export interface SerializedEvent {
  id: string;
  bookingId: string;
  dayNumber: number;
  title: string;
  category: EventCategoryType;
  startDateTime: string;
  endDateTime: string;
  locationAddress: string;
  locationZone: OperativeZone;
  coordinatesLat?: number;
  coordinatesLng?: number;
  providerId?: string;
  providerName?: string;
  assignedDriverId?: string;
  assignedGuideId?: string;
  assignedNurseId?: string;
  financialType: FinancialExpenseType;
  costCents: string;
  costCurrency: CurrencyCode;
  guideHours?: number;
  status: EventStatusType;
  requiresGpsCheckIn: boolean;
  requiresSignature: boolean;
  requiresReceipt: boolean;
  gpsChecked: boolean;
  signatureUuid?: string;
  receiptUuid?: string;
  notes: string;
}

export interface SerializedShift {
  id: string;
  bookingId: string;
  guideId: string;
  guideName: string;
  dayNumber: number;
  date: string;
  hoursLogged: number;
  hourlyRateCents: string;
  hourlyRateCurrency: CurrencyCode;
  prepAllowanceCents: string;
  prepAllowanceCurrency: CurrencyCode;
  mealSubsidyTier: MealSubsidyTier;
  mealSubsidyCents: string;
  mealSubsidyCurrency: CurrencyCode;
  notes: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
}

export interface SerializedTransfer {
  id: string;
  bookingId: string;
  driverId: string;
  driverName: string;
  vehicleType: VehicleClass;
  routeType: RouteClass;
  originAddress: string;
  originZone: OperativeZone;
  destinationAddress: string;
  destinationZone: OperativeZone;
  scheduledTime: string;
  baseRateCents: string;
  baseRateCurrency: CurrencyCode;
  nightSurchargeCents: string;
  nightSurchargeCurrency: CurrencyCode;
  waitingTimeFeeCents: string;
  waitingTimeFeeCurrency: CurrencyCode;
  parkingFeeCents: string;
  parkingFeeCurrency: CurrencyCode;
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
}

export interface SerializedExpense {
  id: string;
  bookingId: string;
  eventId?: string;
  category: ExpenseCategory;
  description: string;
  amountCents: string;
  amountCurrency: CurrencyCode;
  vendorName?: string;
  vendorTaxId?: string;
  receiptBlobUuid?: string;
  date: string;
  audited: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SerializedSettlement {
  bookingId: string;
  totalExpensesCents: string;
  totalExpensesCurrency: CurrencyCode;
  totalGuideFeesCents: string;
  totalGuideFeesCurrency: CurrencyCode;
  totalFleetTaxisCents: string;
  totalFleetTaxisCurrency: CurrencyCode;
  totalAdvancesCents: string;
  totalAdvancesCurrency: CurrencyCode;
  netBalanceCents: string;
  netBalanceCurrency: CurrencyCode;
  advances: Array<{ id: string; date: string; amountCents: string; currency: CurrencyCode; description: string }>;
  lastUpdated: string;
  sha256Seal?: string;
  settlementType?: 'DAILY';
  date?: string;
  dayNumber?: number;
}

export interface SerializedBlob {
  id: string;
  bookingId: string;
  mimeType: string;
  category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF';
  data: string; // Base64 or serialized string
  createdAt: string;
}

export interface SerializedDomainEventRecord {
  id: string;
  bookingId: string;
  type: string;
  payload: string; // JSON string
  timestamp: number;
}

export class MedicalTripDexieDB extends Dexie {
  bookings!: EntityTable<SerializedBooking, 'id'>;
  events!: EntityTable<SerializedEvent, 'id'>;
  shifts!: EntityTable<SerializedShift, 'id'>;
  transfers!: EntityTable<SerializedTransfer, 'id'>;
  expenses!: EntityTable<SerializedExpense, 'id'>;
  settlements!: EntityTable<SerializedSettlement, 'bookingId'>;
  blobs!: EntityTable<SerializedBlob, 'id'>;
  event_stream!: EntityTable<SerializedDomainEventRecord, 'id'>;

  constructor(dbName: string = 'MedicalTripDB', options?: DexieOptions) {
    super(dbName, options);
    this.version(1).stores({
      bookings: 'id, code, patientId, arrivalDate, departureDate, status',
      events: 'id, bookingId, dayNumber, category, status, startDateTime, endDateTime, assignedDriverId, assignedGuideId, assignedNurseId',
      shifts: 'id, bookingId, guideId, dayNumber, date, status',
      transfers: 'id, bookingId, driverId, routeType, scheduledTime, status',
      expenses: 'id, bookingId, eventId, category, date, audited, status',
      settlements: 'bookingId, lastUpdated',
      blobs: 'id, bookingId, mimeType, category, createdAt',
      event_stream: 'id, bookingId, type, timestamp',
    });
  }
}

export class DexieStorageAdapter implements IStoragePort, IBlobStoragePort {
  private readonly db: MedicalTripDexieDB;

  constructor(dbName: string = 'MedicalTripDB', customDB?: MedicalTripDexieDB) {
    this.db = customDB || new MedicalTripDexieDB(dbName);
  }

  // ==========================================
  // Bookings
  // ==========================================
  public async saveBooking(booking: PatientBooking): Promise<void> {
    const serialized: SerializedBooking = {
      id: booking.id,
      code: booking.code,
      patientId: booking.patientId,
      firstName: booking.firstName,
      lastName: booking.lastName,
      passportHash: booking.passportHash,
      country: booking.country,
      language: booking.language,
      phone: booking.phone,
      email: booking.email,
      companionNames: [...booking.companionNames],
      paxCount: booking.paxCount,
      arrivalDate: booking.arrivalDate,
      departureDate: booking.departureDate,
      arrivalAirline: booking.arrivalAirline,
      arrivalFlight: booking.arrivalFlight,
      hotelId: booking.hotelId,
      hotelName: booking.hotelName,
      status: booking.status,
      notes: booking.notes,
      passengers: booking.passengers ? JSON.parse(JSON.stringify(booking.passengers)) : undefined,
      requiresHotelReservation: booking.requiresHotelReservation,
      hotelVoucherFileName: booking.hotelVoucherFileName,
      hotelVoucherFileUrl: booking.hotelVoucherFileUrl,
    };
    await this.db.bookings.put(serialized);
  }

  public async getBooking(bookingIdOrCode: string): Promise<PatientBooking | null> {
    let row = await this.db.bookings.get(bookingIdOrCode);
    if (!row) {
      row = await this.db.bookings.where('code').equals(bookingIdOrCode).first();
    }
    if (!row) return null;
    return new PatientBooking(row);
  }

  public async getAllBookings(): Promise<PatientBooking[]> {
    const rows = await this.db.bookings.toArray();
    return rows.map(r => new PatientBooking(r));
  }

  public async deleteBooking(bookingId: string): Promise<void> {
    let booking = await this.db.bookings.get(bookingId);
    if (!booking) {
      booking = await this.db.bookings.where('code').equals(bookingId).first();
    }
    const ids = new Set<string>([bookingId]);
    if (booking) {
      ids.add(booking.id);
      ids.add(booking.code);
    }
    const idList = Array.from(ids);

    await this.db.transaction('rw', [
      this.db.bookings,
      this.db.events,
      this.db.shifts,
      this.db.transfers,
      this.db.expenses,
      this.db.settlements,
      this.db.blobs,
      this.db.event_stream,
    ], async () => {
      for (const id of idList) {
        await this.db.bookings.delete(id);
        await this.db.bookings.where('code').equals(id).delete();
        await this.db.events.where('bookingId').equals(id).delete();
        await this.db.shifts.where('bookingId').equals(id).delete();
        await this.db.transfers.where('bookingId').equals(id).delete();
        await this.db.expenses.where('bookingId').equals(id).delete();
        await this.db.settlements.where('bookingId').equals(id).delete();
        await this.db.blobs.where('bookingId').equals(id).delete();
        await this.db.event_stream.where('bookingId').equals(id).delete();
      }
    });
  }

  // ==========================================
  // Events
  // ==========================================
  public async saveEvent(event: ItineraryEvent): Promise<void> {
    const serialized: SerializedEvent = {
      id: event.id,
      bookingId: event.bookingId,
      dayNumber: event.dayNumber,
      title: event.title,
      category: event.category,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      locationAddress: event.location.address,
      locationZone: event.location.zone,
      coordinatesLat: event.coordinates?.lat,
      coordinatesLng: event.coordinates?.lng,
      providerId: event.providerId,
      providerName: event.providerName,
      assignedDriverId: event.assignedDriverId,
      assignedGuideId: event.assignedGuideId,
      assignedNurseId: event.assignedNurseId,
      financialType: event.financialType,
      costCents: event.cost.cents.toString(),
      costCurrency: event.cost.currency,
      guideHours: event.guideHours,
      status: event.status,
      requiresGpsCheckIn: event.requiresGpsCheckIn,
      requiresSignature: event.requiresSignature,
      requiresReceipt: event.requiresReceipt,
      gpsChecked: event.gpsChecked,
      signatureUuid: event.signatureUuid,
      receiptUuid: event.receiptUuid,
      notes: event.notes,
    };
    await this.db.events.put(serialized);
  }

  public async getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]> {
    const rows = await this.db.events.where('bookingId').equals(bookingId).toArray();
    return rows
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .map(r => this.deserializeEvent(r));
  }

  public async getEventById(eventId: string): Promise<ItineraryEvent | null> {
    const row = await this.db.events.get(eventId);
    if (!row) return null;
    return this.deserializeEvent(row);
  }

  public async deleteEvent(eventId: string): Promise<void> {
    await this.db.events.delete(eventId);
  }

  private deserializeEvent(row: SerializedEvent): ItineraryEvent {
    const coords = (row.coordinatesLat !== undefined && row.coordinatesLng !== undefined)
      ? { lat: row.coordinatesLat, lng: row.coordinatesLng }
      : undefined;
    const location = OperativeTerritory.fromPreset(row.locationZone, row.locationAddress, coords);
    const cost = Money.fromCents(BigInt(row.costCents || '0'), row.costCurrency || 'COP');

    return new ItineraryEvent({
      id: row.id,
      bookingId: row.bookingId,
      dayNumber: row.dayNumber,
      title: row.title,
      category: row.category,
      startDateTime: row.startDateTime,
      endDateTime: row.endDateTime,
      location,
      coordinates: coords,
      providerId: row.providerId,
      providerName: row.providerName,
      assignedDriverId: row.assignedDriverId,
      assignedGuideId: row.assignedGuideId,
      assignedNurseId: row.assignedNurseId,
      financialType: row.financialType,
      cost,
      guideHours: row.guideHours,
      status: row.status,
      requiresGpsCheckIn: row.requiresGpsCheckIn,
      requiresSignature: row.requiresSignature,
      requiresReceipt: row.requiresReceipt,
      gpsChecked: row.gpsChecked,
      signatureUuid: row.signatureUuid,
      receiptUuid: row.receiptUuid,
      notes: row.notes,
    });
  }

  // ==========================================
  // Shifts & Logistics
  // ==========================================
  public async saveShift(shift: CompanionShift): Promise<void> {
    const serialized: SerializedShift = {
      id: shift.id,
      bookingId: shift.bookingId,
      guideId: shift.guideId,
      guideName: shift.guideName,
      dayNumber: shift.dayNumber,
      date: shift.date,
      hoursLogged: shift.hoursLogged,
      hourlyRateCents: shift.hourlyRate.cents.toString(),
      hourlyRateCurrency: shift.hourlyRate.currency,
      prepAllowanceCents: shift.prepAllowance.cents.toString(),
      prepAllowanceCurrency: shift.prepAllowance.currency,
      mealSubsidyTier: shift.mealSubsidyTier,
      mealSubsidyCents: shift.mealSubsidyAmount.cents.toString(),
      mealSubsidyCurrency: shift.mealSubsidyAmount.currency,
      notes: shift.notes,
      status: shift.status,
    };
    await this.db.shifts.put(serialized);
  }

  public async getShiftsByBooking(bookingId: string): Promise<CompanionShift[]> {
    const rows = await this.db.shifts.where('bookingId').equals(bookingId).toArray();
    return rows.map(r => new CompanionShift({
      id: r.id,
      bookingId: r.bookingId,
      guideId: r.guideId,
      guideName: r.guideName,
      dayNumber: r.dayNumber,
      date: r.date,
      hoursLogged: r.hoursLogged,
      hourlyRate: Money.fromCents(BigInt(r.hourlyRateCents || '0'), r.hourlyRateCurrency || 'COP'),
      prepAllowance: Money.fromCents(BigInt(r.prepAllowanceCents || '0'), r.prepAllowanceCurrency || 'COP'),
      mealSubsidyTier: r.mealSubsidyTier,
      mealSubsidyAmount: Money.fromCents(BigInt(r.mealSubsidyCents || '0'), r.mealSubsidyCurrency || 'COP'),
      notes: r.notes,
      status: r.status,
    }));
  }

  public async deleteShift(shiftId: string): Promise<void> {
    await this.db.shifts.delete(shiftId);
  }

  public async saveTransfer(transfer: DriverTransfer): Promise<void> {
    const serialized: SerializedTransfer = {
      id: transfer.id,
      bookingId: transfer.bookingId,
      driverId: transfer.driverId,
      driverName: transfer.driverName,
      vehicleType: transfer.vehicleType,
      routeType: transfer.routeType,
      originAddress: transfer.origin.address,
      originZone: transfer.origin.zone,
      destinationAddress: transfer.destination.address,
      destinationZone: transfer.destination.zone,
      scheduledTime: transfer.scheduledTime,
      baseRateCents: transfer.baseRate.cents.toString(),
      baseRateCurrency: transfer.baseRate.currency,
      nightSurchargeCents: transfer.nightSurcharge.cents.toString(),
      nightSurchargeCurrency: transfer.nightSurcharge.currency,
      waitingTimeFeeCents: transfer.waitingTimeFee.cents.toString(),
      waitingTimeFeeCurrency: transfer.waitingTimeFee.currency,
      parkingFeeCents: transfer.parkingFee.cents.toString(),
      parkingFeeCurrency: transfer.parkingFee.currency,
      status: transfer.status,
    };
    await this.db.transfers.put(serialized);
  }

  public async getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]> {
    const rows = await this.db.transfers.where('bookingId').equals(bookingId).toArray();
    return rows.map(r => new DriverTransfer({
      id: r.id,
      bookingId: r.bookingId,
      driverId: r.driverId,
      driverName: r.driverName,
      vehicleType: r.vehicleType,
      routeType: r.routeType,
      origin: OperativeTerritory.fromPreset(r.originZone, r.originAddress),
      destination: OperativeTerritory.fromPreset(r.destinationZone, r.destinationAddress),
      scheduledTime: r.scheduledTime,
      baseRate: Money.fromCents(BigInt(r.baseRateCents || '0'), r.baseRateCurrency || 'COP'),
      nightSurcharge: Money.fromCents(BigInt(r.nightSurchargeCents || '0'), r.nightSurchargeCurrency || 'COP'),
      waitingTimeFee: Money.fromCents(BigInt(r.waitingTimeFeeCents || '0'), r.waitingTimeFeeCurrency || 'COP'),
      parkingFee: Money.fromCents(BigInt(r.parkingFeeCents || '0'), r.parkingFeeCurrency || 'COP'),
      status: r.status,
    }));
  }

  public async deleteTransfer(transferId: string): Promise<void> {
    await this.db.transfers.delete(transferId);
  }

  // ==========================================
  // Expenses & Settlements
  // ==========================================
  public async saveExpense(expense: ReceiptExpense): Promise<void> {
    const serialized: SerializedExpense = {
      id: expense.id,
      bookingId: expense.bookingId,
      eventId: expense.eventId,
      category: expense.category,
      description: expense.description,
      amountCents: expense.amount.cents.toString(),
      amountCurrency: expense.amount.currency,
      vendorName: expense.vendorName,
      vendorTaxId: expense.vendorTaxId,
      receiptBlobUuid: expense.receiptBlobUuid,
      date: expense.date,
      audited: expense.audited,
      status: expense.status,
    };
    await this.db.expenses.put(serialized);
  }

  public async getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]> {
    const rows = await this.db.expenses.where('bookingId').equals(bookingId).toArray();
    return rows.map(r => new ReceiptExpense({
      id: r.id,
      bookingId: r.bookingId,
      eventId: r.eventId,
      category: r.category,
      description: r.description,
      amount: Money.fromCents(BigInt(r.amountCents || '0'), r.amountCurrency || 'COP'),
      vendorName: r.vendorName,
      vendorTaxId: r.vendorTaxId,
      receiptBlobUuid: r.receiptBlobUuid,
      date: r.date,
      audited: r.audited,
      status: r.status,
    }));
  }

  public async deleteExpense(expenseId: string): Promise<void> {
    await this.db.expenses.delete(expenseId);
  }

  public async saveSettlement(settlement: SettlementLedger): Promise<void> {
    const serialized: SerializedSettlement = {
      bookingId: settlement.bookingId,
      totalExpensesCents: settlement.totalExpenses.cents.toString(),
      totalExpensesCurrency: settlement.totalExpenses.currency,
      totalGuideFeesCents: settlement.totalGuideFees.cents.toString(),
      totalGuideFeesCurrency: settlement.totalGuideFees.currency,
      totalFleetTaxisCents: settlement.totalFleetTaxis.cents.toString(),
      totalFleetTaxisCurrency: settlement.totalFleetTaxis.currency,
      totalAdvancesCents: settlement.totalAdvances.cents.toString(),
      totalAdvancesCurrency: settlement.totalAdvances.currency,
      netBalanceCents: settlement.netBalance.cents.toString(),
      netBalanceCurrency: settlement.netBalance.currency,
      advances: settlement.advances.map(a => ({
        id: a.id,
        date: a.date,
        amountCents: a.amount.cents.toString(),
        currency: a.amount.currency,
        description: a.description,
      })),
      lastUpdated: settlement.lastUpdated,
      sha256Seal: settlement.sha256Seal,
      settlementType: 'DAILY',
      date: settlement.date,
      dayNumber: settlement.dayNumber,
    };
    await this.db.settlements.put(serialized);
  }

  public async getSettlement(bookingId: string): Promise<SettlementLedger | null> {
    const row = await this.db.settlements.get(bookingId);
    if (!row) return null;

    const expenses = await this.getExpensesByBooking(bookingId);
    const shifts = await this.getShiftsByBooking(bookingId);
    const transfers = await this.getTransfersByBooking(bookingId);
    const advances: CashAdvance[] = row.advances.map(a => ({
      id: a.id,
      date: a.date,
      amount: Money.fromCents(BigInt(a.amountCents || '0'), a.currency || 'COP'),
      description: a.description,
    }));

    return SettlementLedger.calculate({
      bookingId: row.bookingId,
      date: row.date,
      dayNumber: row.dayNumber,
      settlementType: 'DAILY',
      expenses,
      shifts,
      transfers,
      advances,
      sha256Seal: row.sha256Seal,
    });
  }

  // ==========================================
  // Single-Writer CQRS Event Stream
  // ==========================================
  public async appendEventLog(entry: DomainEventRecord): Promise<void> {
    await this.db.event_stream.put({
      id: entry.id,
      bookingId: entry.bookingId,
      type: entry.type,
      payload: JSON.stringify(entry.payload),
      timestamp: entry.timestamp,
    });
  }

  public async getEventStream(bookingId: string): Promise<DomainEventRecord[]> {
    const rows = await this.db.event_stream.where('bookingId').equals(bookingId).toArray();
    return rows
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(r => ({
        id: r.id,
        bookingId: r.bookingId,
        type: r.type,
        payload: JSON.parse(r.payload),
        timestamp: r.timestamp,
      }));
  }

  // ==========================================
  // Blobs (IBlobStoragePort)
  // ==========================================
  public async saveBlob(
    id: string,
    bookingId: string,
    mimeType: string,
    category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF',
    data: Blob | ArrayBuffer | string
  ): Promise<string> {
    let serializedData: string;
    if (typeof data === 'string') {
      serializedData = data;
    } else if (data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      serializedData = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
    } else {
      // Blob
      const buffer = await data.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      serializedData = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
    }

    await this.db.blobs.put({
      id,
      bookingId,
      mimeType,
      category,
      data: serializedData,
      createdAt: new Date().toISOString(),
    });
    return id;
  }

  public async getBlob(id: string): Promise<Blob | null> {
    const row = await this.db.blobs.get(id);
    if (!row) return null;
    const dataStr = row.data;
    if (dataStr.startsWith('data:')) {
      const base64Data = dataStr.split(',')[1];
      const binary = typeof atob === 'function' ? atob(base64Data) : Buffer.from(base64Data, 'base64').toString('binary');
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new Blob([bytes], { type: row.mimeType });
    } else {
      try {
        const binary = typeof atob === 'function' ? atob(dataStr) : Buffer.from(dataStr, 'base64').toString('binary');
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: row.mimeType });
      } catch {
        return new Blob([dataStr], { type: row.mimeType });
      }
    }
  }

  public async getBlobDataUrl(id: string): Promise<string | null> {
    const row = await this.db.blobs.get(id);
    if (!row) return null;
    if (row.data.startsWith('data:')) return row.data;
    return `data:${row.mimeType};base64,${row.data}`;
  }

  public async deleteBlob(id: string): Promise<void> {
    await this.db.blobs.delete(id);
  }

  public async listBlobs(bookingId?: string): Promise<BlobMetadata[]> {
    const rows = bookingId
      ? await this.db.blobs.where('bookingId').equals(bookingId).toArray()
      : await this.db.blobs.toArray();
    return rows.map(r => ({
      id: r.id,
      bookingId: r.bookingId,
      mimeType: r.mimeType,
      category: r.category,
      createdAt: r.createdAt,
    }));
  }

  // ==========================================
  // Maintenance & Diagnostics
  // ==========================================
  public async clearAll(): Promise<void> {
    await this.db.bookings.clear();
    await this.db.events.clear();
    await this.db.shifts.clear();
    await this.db.transfers.clear();
    await this.db.expenses.clear();
    await this.db.settlements.clear();
    await this.db.blobs.clear();
    await this.db.event_stream.clear();
  }

  public async getHealthInfo(): Promise<StorageHealthInfo> {
    return {
      driver: 'dexie',
      isConnected: this.db.isOpen(),
    };
  }
}
