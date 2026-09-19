/**
 * Medical Trip Colombia S.A.S. - Swappable Storage Port Contract
 * Core Hexagonal Output Port for persistent and binary operations.
 * Pure strongly-typed contract decoupled from any concrete persistence technology.
 */

import { PatientBooking } from '../domain/entities/PatientBooking';
import { ItineraryEvent } from '@/features/itinerary';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense, SettlementLedger } from '@/features/settlement';
import { IBlobStoragePort, BlobMetadata } from './IBlobStoragePort';

export type { BlobMetadata };

export interface DomainEventRecord {
  readonly id: string;
  readonly bookingId: string;
  readonly type: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

export interface StorageHealthInfo {
  readonly driver: string;
  readonly isConnected: boolean;
  readonly isPersistent?: boolean;
  readonly usageBytes?: number;
  readonly quotaBytes?: number;
}

export interface IStoragePort extends IBlobStoragePort {
  // ==========================================
  // 1. Patient Bookings & Archetypes
  // ==========================================
  saveBooking(booking: PatientBooking): Promise<void>;
  getBooking(bookingIdOrCode: string): Promise<PatientBooking | null>;
  getAllBookings(): Promise<PatientBooking[]>;
  deleteBooking?(bookingId: string): Promise<void>;

  // ==========================================
  // 2. Itinerary & Clinical Events
  // ==========================================
  saveEvent(event: ItineraryEvent): Promise<void>;
  getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]>;
  getEventById(eventId: string): Promise<ItineraryEvent | null>;
  deleteEvent(eventId: string): Promise<void>;
  saveEventsBatch?(events: ItineraryEvent[]): Promise<void>;

  // ==========================================
  // 3. Companion Shifts & Guidance
  // ==========================================
  saveShift(shift: CompanionShift): Promise<void>;
  getShiftsByBooking(bookingId: string): Promise<CompanionShift[]>;
  getShiftById?(shiftId: string): Promise<CompanionShift | null>;
  deleteShift?(shiftId: string): Promise<void>;

  // ==========================================
  // 4. Logistics & Fleet Transfers
  // ==========================================
  saveTransfer(transfer: DriverTransfer): Promise<void>;
  getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]>;
  getTransferById?(transferId: string): Promise<DriverTransfer | null>;
  deleteTransfer?(transferId: string): Promise<void>;

  // ==========================================
  // 5. Receipts, Expenses & Settlement Ledgers
  // ==========================================
  saveExpense(expense: ReceiptExpense): Promise<void>;
  getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]>;
  getExpenseById?(expenseId: string): Promise<ReceiptExpense | null>;
  deleteExpense?(expenseId: string): Promise<void>;
  saveSettlement(settlement: SettlementLedger): Promise<void>;
  getSettlement(bookingId: string): Promise<SettlementLedger | null>;

  // ==========================================
  // 6. Single-Writer CQRS Event Stream
  // ==========================================
  appendEventLog(entry: DomainEventRecord): Promise<void>;
  getEventStream(bookingId: string): Promise<DomainEventRecord[]>;

  // ==========================================
  // 7. Maintenance & Diagnostics
  // ==========================================
  clearAll(): Promise<void>;
  getHealthInfo?(): Promise<StorageHealthInfo>;
}
