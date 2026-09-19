/**
 * Medical Trip Colombia S.A.S. - In-Memory Storage Adapter
 * Pure in-memory reference implementation of IStoragePort and IBlobStoragePort for unit testing & rapid execution.
 */

import { IStoragePort, DomainEventRecord, StorageHealthInfo } from '../../../core/ports/IStoragePort';
import { IBlobStoragePort, BlobMetadata } from '../../../core/ports/IBlobStoragePort';
import { PatientBooking } from '../../../core/domain/entities/PatientBooking';
import { ItineraryEvent } from '@/features/itinerary';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense } from '@/features/settlement';
import { SettlementLedger } from '@/features/settlement';

interface StoredBlob {
  id: string;
  bookingId: string;
  mimeType: string;
  category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF';
  data: Blob | ArrayBuffer | string;
  createdAt: string;
}

export class InMemoryStorageAdapter implements IStoragePort, IBlobStoragePort {
  private readonly bookings = new Map<string, PatientBooking>();
  private readonly events = new Map<string, ItineraryEvent>();
  private readonly shifts = new Map<string, CompanionShift>();
  private readonly transfers = new Map<string, DriverTransfer>();
  private readonly expenses = new Map<string, ReceiptExpense>();
  private readonly settlements = new Map<string, SettlementLedger>();
  private readonly blobs = new Map<string, StoredBlob>();
  private readonly eventStream: DomainEventRecord[] = [];

  // ==========================================
  // Bookings
  // ==========================================
  public async saveBooking(booking: PatientBooking): Promise<void> {
    this.bookings.set(booking.id, booking);
    // Also index by code for lookup convenience
    this.bookings.set(booking.code, booking);
  }

  public async getBooking(bookingIdOrCode: string): Promise<PatientBooking | null> {
    return this.bookings.get(bookingIdOrCode) || null;
  }

  public async getAllBookings(): Promise<PatientBooking[]> {
    // Unique list by id
    const unique = new Map<string, PatientBooking>();
    for (const b of this.bookings.values()) {
      unique.set(b.id, b);
    }
    return Array.from(unique.values());
  }

  public async deleteBooking(bookingId: string): Promise<void> {
    const existing = this.bookings.get(bookingId);
    const ids = new Set<string>([bookingId]);
    if (existing) {
      ids.add(existing.id);
      ids.add(existing.code);
      this.bookings.delete(existing.id);
      this.bookings.delete(existing.code);
    } else {
      this.bookings.delete(bookingId);
    }

    for (const id of ids) {
      for (const [key, evt] of this.events.entries()) {
        if (evt.bookingId === id) this.events.delete(key);
      }
      for (const [key, shift] of this.shifts.entries()) {
        if (shift.bookingId === id) this.shifts.delete(key);
      }
      for (const [key, trf] of this.transfers.entries()) {
        if (trf.bookingId === id) this.transfers.delete(key);
      }
      for (const [key, exp] of this.expenses.entries()) {
        if (exp.bookingId === id) this.expenses.delete(key);
      }
      for (const [key, set] of this.settlements.entries()) {
        if (set.bookingId === id) this.settlements.delete(key);
      }
    }
  }

  // ==========================================
  // Events
  // ==========================================
  public async saveEvent(event: ItineraryEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  public async getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]> {
    const list: ItineraryEvent[] = [];
    for (const event of this.events.values()) {
      if (event.bookingId === bookingId) {
        list.push(event);
      }
    }
    return list.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }

  public async getEventById(eventId: string): Promise<ItineraryEvent | null> {
    return this.events.get(eventId) || null;
  }

  public async deleteEvent(eventId: string): Promise<void> {
    this.events.delete(eventId);
  }

  // ==========================================
  // Shifts & Logistics
  // ==========================================
  public async saveShift(shift: CompanionShift): Promise<void> {
    this.shifts.set(shift.id, shift);
  }

  public async getShiftsByBooking(bookingId: string): Promise<CompanionShift[]> {
    const list: CompanionShift[] = [];
    for (const shift of this.shifts.values()) {
      if (shift.bookingId === bookingId) {
        list.push(shift);
      }
    }
    return list;
  }

  public async deleteShift(shiftId: string): Promise<void> {
    this.shifts.delete(shiftId);
  }

  public async saveTransfer(transfer: DriverTransfer): Promise<void> {
    this.transfers.set(transfer.id, transfer);
  }

  public async getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]> {
    const list: DriverTransfer[] = [];
    for (const trf of this.transfers.values()) {
      if (trf.bookingId === bookingId) {
        list.push(trf);
      }
    }
    return list;
  }

  public async deleteTransfer(transferId: string): Promise<void> {
    this.transfers.delete(transferId);
  }

  // ==========================================
  // Expenses & Settlements
  // ==========================================
  public async saveExpense(expense: ReceiptExpense): Promise<void> {
    this.expenses.set(expense.id, expense);
  }

  public async getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]> {
    const list: ReceiptExpense[] = [];
    for (const exp of this.expenses.values()) {
      if (exp.bookingId === bookingId) {
        list.push(exp);
      }
    }
    return list;
  }

  public async deleteExpense(expenseId: string): Promise<void> {
    this.expenses.delete(expenseId);
  }

  public async saveSettlement(settlement: SettlementLedger): Promise<void> {
    this.settlements.set(settlement.bookingId, settlement);
  }

  public async getSettlement(bookingId: string): Promise<SettlementLedger | null> {
    return this.settlements.get(bookingId) || null;
  }

  // ==========================================
  // Single-Writer CQRS Event Stream
  // ==========================================
  public async appendEventLog(entry: DomainEventRecord): Promise<void> {
    this.eventStream.push(entry);
  }

  public async getEventStream(bookingId: string): Promise<DomainEventRecord[]> {
    return this.eventStream.filter(e => e.bookingId === bookingId);
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
    this.blobs.set(id, {
      id,
      bookingId,
      mimeType,
      category,
      data,
      createdAt: new Date().toISOString(),
    });
    return id;
  }

  public async getBlob(id: string): Promise<Blob | null> {
    const record = this.blobs.get(id);
    if (!record) return null;
    if (record.data instanceof Blob) {
      return record.data;
    }
    if (typeof record.data === 'string') {
      return new Blob([record.data], { type: record.mimeType });
    }
    return new Blob([record.data], { type: record.mimeType });
  }

  public async getBlobDataUrl(id: string): Promise<string | null> {
    const record = this.blobs.get(id);
    if (!record) return null;
    if (typeof record.data === 'string') {
      if (record.data.startsWith('data:')) return record.data;
      return `data:${record.mimeType};base64,${record.data}`;
    }
    const blob = await this.getBlob(id);
    if (!blob) return null;
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public async deleteBlob(id: string): Promise<void> {
    this.blobs.delete(id);
  }

  public async listBlobs(bookingId?: string): Promise<BlobMetadata[]> {
    const all = Array.from(this.blobs.values());
    const filtered = bookingId ? all.filter(b => b.bookingId === bookingId) : all;
    return filtered.map(b => ({
      id: b.id,
      bookingId: b.bookingId,
      mimeType: b.mimeType,
      category: b.category,
      createdAt: b.createdAt,
    }));
  }

  // ==========================================
  // Maintenance & Diagnostics
  // ==========================================
  public async clearAll(): Promise<void> {
    this.bookings.clear();
    this.events.clear();
    this.shifts.clear();
    this.transfers.clear();
    this.expenses.clear();
    this.settlements.clear();
    this.blobs.clear();
    this.eventStream.length = 0;
  }

  public async getHealthInfo(): Promise<StorageHealthInfo> {
    return {
      driver: 'memory',
      isConnected: true,
    };
  }
}
