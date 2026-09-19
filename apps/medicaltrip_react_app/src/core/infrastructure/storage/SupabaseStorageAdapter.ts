/**
 * Medical Trip Colombia S.A.S. - SupabaseStorageAdapter
 * Hexagonal infrastructure adapter conforming to IStoragePort and IBlobStoragePort
 * for remote Supabase / PostgreSQL cloud persistence.
 *
 * Implements clean decoupled database interactions with optional SupabaseClientStub,
 * supporting offline-first fallback and zero-configuration local development.
 */

import { IStoragePort, DomainEventRecord, StorageHealthInfo } from '../../../core/ports/IStoragePort';
import { IBlobStoragePort, BlobMetadata } from '../../../core/ports/IBlobStoragePort';
import { PatientBooking } from '../../../core/domain/entities/PatientBooking';
import { ItineraryEvent } from '@/features/itinerary';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense } from '@/features/settlement';
import { SettlementLedger, CashAdvance } from '@/features/settlement';
import { Money } from '../../../core/domain/value-objects/Money';
import { OperativeTerritory } from '../../../core/domain/value-objects/OperativeTerritory';
import { InMemoryStorageAdapter } from './InMemoryStorageAdapter';

export interface SupabaseClientStub {
  from: (table: string) => any;
  storage?: {
    from: (bucket: string) => {
      upload: (path: string, file: any, options?: any) => Promise<any>;
      download: (path: string) => Promise<any>;
      remove: (paths: string[]) => Promise<any>;
      getPublicUrl?: (path: string) => { data: { publicUrl: string } };
    };
  };
}

export interface SupabaseStorageAdapterOptions {
  client?: SupabaseClientStub | null;
  bucketName?: string;
  schema?: string;
}

export class SupabaseStorageAdapter implements IStoragePort, IBlobStoragePort {
  private readonly client: SupabaseClientStub | null;
  private readonly bucketName: string;
  private readonly fallback: InMemoryStorageAdapter;

  constructor(options: SupabaseStorageAdapterOptions = {}) {
    this.client = options.client || null;
    this.bucketName = options.bucketName || 'medicaltrip-blobs';
    this.fallback = new InMemoryStorageAdapter();
  }

  // ==========================================
  // 1. Patient Bookings
  // ==========================================
  public async saveBooking(booking: PatientBooking): Promise<void> {
    await this.fallback.saveBooking(booking);

    if (!this.client) {
      return;
    }

    const payload = {
      id: booking.id,
      code: booking.code,
      patient_id: booking.patientId,
      first_name: booking.firstName,
      last_name: booking.lastName,
      passport_hash: booking.passportHash,
      country: booking.country,
      language: booking.language,
      phone: booking.phone,
      email: booking.email,
      companion_names: [...booking.companionNames],
      pax_count: booking.paxCount,
      arrival_date: booking.arrivalDate,
      departure_date: booking.departureDate,
      arrival_airline: booking.arrivalAirline,
      arrival_flight: booking.arrivalFlight,
      hotel_id: booking.hotelId,
      hotel_name: booking.hotelName,
      status: booking.status,
      notes: booking.notes,
      passengers: booking.passengers ? JSON.parse(JSON.stringify(booking.passengers)) : undefined,
      flight_legs: booking.flightLegs ? JSON.parse(JSON.stringify(booking.flightLegs)) : undefined,
      treatment_phase: booking.treatmentPhase,
      hotel_nights: booking.hotelNights,
      hotel_nightly_rate_cents: booking.hotelNightlyRateCents?.toString(),
      hotel_total_quoted_cents: booking.hotelTotalQuotedCents?.toString(),
      hotel_agency_deposit_cents: booking.hotelAgencyDepositCents?.toString(),
      hotel_direct_pay_cents: booking.hotelDirectPayCents?.toString(),
      requires_hotel_reservation: booking.requiresHotelReservation,
      hotel_voucher_file_name: booking.hotelVoucherFileName,
      hotel_voucher_file_url: booking.hotelVoucherFileUrl,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('bookings').upsert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice saving booking ${booking.id}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception saving booking ${booking.id}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async getBooking(bookingIdOrCode: string): Promise<PatientBooking | null> {
    if (!this.client) {
      return this.fallback.getBooking(bookingIdOrCode);
    }

    try {
      const sanitized = bookingIdOrCode.trim();

      // Primary query: look up by ID or Code with maybeSingle to avoid PostgREST HTTP 406 (PGRST116)
      const orQuery = this.client
        .from('bookings')
        .select('*')
        .or(`id.eq.${sanitized},code.eq.${sanitized}`);

      let res = typeof orQuery.maybeSingle === 'function'
        ? await orQuery.maybeSingle()
        : await orQuery.limit(1).then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));

      let data = res.data;
      let error = res.error;

      // Fallback query: explicit lookup by id
      if (!data) {
        const idQuery = this.client.from('bookings').select('*').eq('id', sanitized);
        const idRes = typeof idQuery.maybeSingle === 'function'
          ? await idQuery.maybeSingle()
          : await idQuery.limit(1).then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));
        data = idRes.data;
        error = idRes.error;
      }

      // Fallback query: explicit lookup by code
      if (!data) {
        const codeQuery = this.client.from('bookings').select('*').eq('code', sanitized);
        const codeRes = typeof codeQuery.maybeSingle === 'function'
          ? await codeQuery.maybeSingle()
          : await codeQuery.limit(1).then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));
        data = codeRes.data;
        error = codeRes.error;
      }

      if (error || !data) {
        return this.fallback.getBooking(bookingIdOrCode);
      }

      return new PatientBooking({
        id: data.id,
        code: data.code,
        patientId: data.patient_id,
        firstName: data.first_name,
        lastName: data.last_name,
        passportHash: data.passport_hash || '',
        country: data.country,
        language: data.language,
        phone: data.phone,
        email: data.email,
        companionNames: data.companion_names || [],
        paxCount: data.pax_count,
        arrivalDate: data.arrival_date,
        departureDate: data.departure_date,
        arrivalAirline: data.arrival_airline || '',
        arrivalFlight: data.arrival_flight || '',
        hotelId: data.hotel_id || '',
        hotelName: data.hotel_name || '',
        status: data.status,
        notes: data.notes,
        passengers: data.passengers,
        flightLegs: data.flight_legs,
        treatmentPhase: data.treatment_phase,
        hotelNights: data.hotel_nights,
        hotelNightlyRateCents: data.hotel_nightly_rate_cents ? BigInt(data.hotel_nightly_rate_cents) : undefined,
        hotelTotalQuotedCents: data.hotel_total_quoted_cents ? BigInt(data.hotel_total_quoted_cents) : undefined,
        hotelAgencyDepositCents: data.hotel_agency_deposit_cents ? BigInt(data.hotel_agency_deposit_cents) : undefined,
        hotelDirectPayCents: data.hotel_direct_pay_cents ? BigInt(data.hotel_direct_pay_cents) : undefined,
        requiresHotelReservation: data.requires_hotel_reservation,
        hotelVoucherFileName: data.hotel_voucher_file_name,
        hotelVoucherFileUrl: data.hotel_voucher_file_url,
      });
    } catch {
      return this.fallback.getBooking(bookingIdOrCode);
    }
  }

  public async getBookingByCode(code: string): Promise<PatientBooking | null> {
    return this.getBooking(code);
  }

  public async getAllBookings(): Promise<PatientBooking[]> {
    if (!this.client) {
      return this.fallback.getAllBookings();
    }

    try {
      const { data, error } = await this.client.from('bookings').select('*');
      if (error || !data || data.length === 0) {
        return this.fallback.getAllBookings();
      }

      const cloudBookings = data.map(
        (d: any) =>
          new PatientBooking({
            id: d.id,
            code: d.code,
            patientId: d.patient_id,
            firstName: d.first_name,
            lastName: d.last_name,
            passportHash: d.passport_hash || '',
            country: d.country,
            language: d.language,
            phone: d.phone,
            email: d.email,
            companionNames: d.companion_names || [],
            paxCount: d.pax_count,
            arrivalDate: d.arrival_date,
            departureDate: d.departure_date,
            arrivalAirline: d.arrival_airline || '',
            arrivalFlight: d.arrival_flight || '',
            hotelId: d.hotel_id || '',
            hotelName: d.hotel_name || '',
            status: d.status,
            notes: d.notes,
            passengers: d.passengers,
            flightLegs: d.flight_legs,
            treatmentPhase: d.treatment_phase,
            hotelNights: d.hotel_nights,
            hotelNightlyRateCents: d.hotel_nightly_rate_cents ? BigInt(d.hotel_nightly_rate_cents) : undefined,
            hotelTotalQuotedCents: d.hotel_total_quoted_cents ? BigInt(d.hotel_total_quoted_cents) : undefined,
            hotelAgencyDepositCents: d.hotel_agency_deposit_cents ? BigInt(d.hotel_agency_deposit_cents) : undefined,
            hotelDirectPayCents: d.hotel_direct_pay_cents ? BigInt(d.hotel_direct_pay_cents) : undefined,
            requiresHotelReservation: d.requires_hotel_reservation,
            hotelVoucherFileName: d.hotel_voucher_file_name,
            hotelVoucherFileUrl: d.hotel_voucher_file_url,
          })
      );

      const fallbackBookings = await this.fallback.getAllBookings();
      const mergedMap = new Map<string, PatientBooking>();
      for (const b of cloudBookings) {
        mergedMap.set(b.id, b);
      }
      for (const b of fallbackBookings) {
        if (!mergedMap.has(b.id)) {
          mergedMap.set(b.id, b);
        }
      }
      return Array.from(mergedMap.values());
    } catch {
      return this.fallback.getAllBookings();
    }
  }

  private async resolveBookingIds(bookingIdOrCode: string): Promise<string[]> {
    const ids = new Set<string>([bookingIdOrCode]);
    if (this.client) {
      try {
        const { data } = await this.client
          .from('bookings')
          .select('id, code')
          .or(`id.eq.${bookingIdOrCode},code.eq.${bookingIdOrCode}`);
        if (data && Array.isArray(data)) {
          for (const item of data) {
            if (item.id) ids.add(item.id);
            if (item.code) ids.add(item.code);
          }
        }
      } catch {
        // Fallback to initial ID
      }
    }
    return Array.from(ids);
  }

  public async deleteBooking(bookingId: string): Promise<void> {
    const ids = await this.resolveBookingIds(bookingId);
    for (const id of ids) {
      await this.fallback.deleteBooking(id);
    }
    if (!this.client) {
      return;
    }
    try {
      await Promise.allSettled([
        this.client.from('bookings').delete().in('id', ids),
        this.client.from('bookings').delete().in('code', ids),
        this.client.from('events').delete().in('booking_id', ids),
        this.client.from('shifts').delete().in('booking_id', ids),
        this.client.from('transfers').delete().in('booking_id', ids),
        this.client.from('expenses').delete().in('booking_id', ids),
        this.client.from('settlements').delete().in('booking_id', ids),
        this.client.from('event_stream').delete().in('booking_id', ids),
      ]);
    } catch {
      // Handled gracefully
    }
  }

  // ==========================================
  // 2. Itinerary & Clinical Events
  // ==========================================
  public async saveEvent(event: ItineraryEvent): Promise<void> {
    await this.fallback.saveEvent(event);
    if (!this.client) {
      return;
    }

    const payload = {
      id: event.id,
      booking_id: event.bookingId,
      day_number: event.dayNumber,
      title: event.title,
      category: event.category,
      start_date_time: event.startDateTime,
      end_date_time: event.endDateTime,
      location_address: event.location.address,
      location_zone: event.location.zone,
      coordinates_lat: event.coordinates?.lat,
      coordinates_lng: event.coordinates?.lng,
      provider_id: event.providerId,
      provider_name: event.providerName,
      assigned_driver_id: event.assignedDriverId,
      assigned_guide_id: event.assignedGuideId,
      assigned_nurse_id: event.assignedNurseId,
      financial_type: event.financialType,
      cost_cents: event.cost.cents.toString(),
      cost_currency: event.cost.currency,
      guide_hours: event.guideHours,
      status: event.status,
      requires_gps_check_in: event.requiresGpsCheckIn,
      requires_signature: event.requiresSignature,
      requires_receipt: event.requiresReceipt,
      gps_checked: event.gpsChecked,
      signature_uuid: event.signatureUuid,
      receipt_uuid: event.receiptUuid,
      notes: event.notes,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('events').upsert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice saving event ${event.id}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception saving event ${event.id}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async saveEventsBatch(events: ItineraryEvent[]): Promise<void> {
    for (const event of events) {
      await this.saveEvent(event);
    }
  }

  public async getEventsByBooking(bookingId: string): Promise<ItineraryEvent[]> {
    if (!this.client) {
      return this.fallback.getEventsByBooking(bookingId);
    }

    try {
      const ids = await this.resolveBookingIds(bookingId);
      const { data, error } = await this.client
        .from('events')
        .select('*')
        .in('booking_id', ids)
        .order?.('start_date_time', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.fallback.getEventsByBooking(bookingId);
      }

      return data.map((r: any) => this.deserializeEvent(r));
    } catch {
      return this.fallback.getEventsByBooking(bookingId);
    }
  }

  public async getEventById(eventId: string): Promise<ItineraryEvent | null> {
    if (!this.client) {
      return this.fallback.getEventById(eventId);
    }

    try {
      const query = this.client.from('events').select('*').eq('id', eventId);
      const res = typeof query.maybeSingle === 'function'
        ? await query.maybeSingle()
        : await query.limit(1).then((r: any) => ({ data: r.data?.[0] ?? null, error: r.error }));

      if (res.error || !res.data) {
        return this.fallback.getEventById(eventId);
      }

      return this.deserializeEvent(res.data);
    } catch {
      return this.fallback.getEventById(eventId);
    }
  }

  public async deleteEvent(eventId: string): Promise<void> {
    await this.fallback.deleteEvent(eventId);
    if (!this.client) {
      return;
    }
    try {
      await this.client.from('events').delete().eq('id', eventId);
    } catch {
      // Handled gracefully
    }
  }

  private deserializeEvent(r: any): ItineraryEvent {
    const coords =
      r.coordinates_lat !== undefined && r.coordinates_lng !== undefined
        ? { lat: r.coordinates_lat, lng: r.coordinates_lng }
        : undefined;
    const location = OperativeTerritory.fromPreset(r.location_zone, r.location_address, coords);
    const cost = Money.fromCents(BigInt(r.cost_cents || '0'), r.cost_currency || 'COP');

    return new ItineraryEvent({
      id: r.id,
      bookingId: r.booking_id,
      dayNumber: r.day_number,
      title: r.title,
      category: r.category,
      startDateTime: r.start_date_time,
      endDateTime: r.end_date_time,
      location,
      coordinates: coords,
      providerId: r.provider_id,
      providerName: r.provider_name,
      assignedDriverId: r.assigned_driver_id,
      assignedGuideId: r.assigned_guide_id,
      assignedNurseId: r.assigned_nurse_id,
      financialType: r.financial_type,
      cost,
      guideHours: r.guide_hours !== undefined ? Number(r.guide_hours) : r.guideHours,
      status: r.status,
      requiresGpsCheckIn: r.requires_gps_check_in,
      requiresSignature: r.requires_signature,
      requiresReceipt: r.requires_receipt,
      gpsChecked: r.gps_checked,
      signatureUuid: r.signature_uuid,
      receiptUuid: r.receipt_uuid,
      notes: r.notes || '',
    });
  }

  // ==========================================
  // 3. Companion Shifts
  // ==========================================
  public async saveShift(shift: CompanionShift): Promise<void> {
    await this.fallback.saveShift(shift);
    if (!this.client) {
      return;
    }

    const payload = {
      id: shift.id,
      booking_id: shift.bookingId,
      guide_id: shift.guideId,
      guide_name: shift.guideName,
      day_number: shift.dayNumber,
      date: shift.date,
      hours_logged: shift.hoursLogged,
      hourly_rate_cents: shift.hourlyRate.cents.toString(),
      hourly_rate_currency: shift.hourlyRate.currency,
      prep_allowance_cents: shift.prepAllowance.cents.toString(),
      prep_allowance_currency: shift.prepAllowance.currency,
      meal_subsidy_tier: shift.mealSubsidyTier,
      meal_subsidy_cents: shift.mealSubsidyAmount.cents.toString(),
      meal_subsidy_currency: shift.mealSubsidyAmount.currency,
      notes: shift.notes,
      status: shift.status,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('shifts').upsert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice saving shift ${shift.id}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception saving shift ${shift.id}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async getShiftsByBooking(bookingId: string): Promise<CompanionShift[]> {
    if (!this.client) {
      return this.fallback.getShiftsByBooking(bookingId);
    }

    try {
      const ids = await this.resolveBookingIds(bookingId);
      const { data, error } = await this.client
        .from('shifts')
        .select('*')
        .in('booking_id', ids);

      if (error || !data || data.length === 0) {
        return this.fallback.getShiftsByBooking(bookingId);
      }

      return data.map(
        (r: any) =>
          new CompanionShift({
            id: r.id,
            bookingId: r.booking_id,
            guideId: r.guide_id,
            guideName: r.guide_name,
            dayNumber: r.day_number,
            date: r.date,
            hoursLogged: r.hours_logged,
            hourlyRate: Money.fromCents(BigInt(r.hourly_rate_cents || '0'), r.hourly_rate_currency || 'COP'),
            prepAllowance: Money.fromCents(BigInt(r.prep_allowance_cents || '0'), r.prep_allowance_currency || 'COP'),
            mealSubsidyTier: r.meal_subsidy_tier,
            mealSubsidyAmount: Money.fromCents(BigInt(r.meal_subsidy_cents || '0'), r.meal_subsidy_currency || 'COP'),
            notes: r.notes,
            status: r.status,
          })
      );
    } catch {
      return this.fallback.getShiftsByBooking(bookingId);
    }
  }

  public async deleteShift(shiftId: string): Promise<void> {
    await this.fallback.deleteShift(shiftId);
    if (!this.client) {
      return;
    }
    try {
      await this.client.from('shifts').delete().eq('id', shiftId);
    } catch {
      // Handled gracefully
    }
  }

  // ==========================================
  // 4. Logistics & Transfers
  // ==========================================
  public async saveTransfer(transfer: DriverTransfer): Promise<void> {
    await this.fallback.saveTransfer(transfer);
    if (!this.client) {
      return;
    }

    const payload = {
      id: transfer.id,
      booking_id: transfer.bookingId,
      driver_id: transfer.driverId,
      driver_name: transfer.driverName,
      vehicle_type: transfer.vehicleType,
      route_type: transfer.routeType,
      origin_address: transfer.origin.address,
      origin_zone: transfer.origin.zone,
      destination_address: transfer.destination.address,
      destination_zone: transfer.destination.zone,
      scheduled_time: transfer.scheduledTime,
      base_rate_cents: transfer.baseRate?.cents ? transfer.baseRate.cents.toString() : '0',
      base_rate_currency: transfer.baseRate?.currency || 'COP',
      night_surcharge_cents: transfer.nightSurcharge?.cents ? transfer.nightSurcharge.cents.toString() : '0',
      night_surcharge_currency: transfer.nightSurcharge?.currency || 'COP',
      waiting_time_fee_cents: transfer.waitingTimeFee?.cents ? transfer.waitingTimeFee.cents.toString() : '0',
      waiting_time_fee_currency: transfer.waitingTimeFee?.currency || 'COP',
      parking_fee_cents: transfer.parkingFee?.cents ? transfer.parkingFee.cents.toString() : '0',
      parking_fee_currency: transfer.parkingFee?.currency || 'COP',
      status: transfer.status,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('transfers').upsert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice saving transfer ${transfer.id}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception saving transfer ${transfer.id}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async getTransfersByBooking(bookingId: string): Promise<DriverTransfer[]> {
    if (!this.client) {
      return this.fallback.getTransfersByBooking(bookingId);
    }

    try {
      const ids = await this.resolveBookingIds(bookingId);
      const { data, error } = await this.client
        .from('transfers')
        .select('*')
        .in('booking_id', ids)
        .order?.('scheduled_time', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.fallback.getTransfersByBooking(bookingId);
      }

      return data.map(
        (r: any) =>
          new DriverTransfer({
            id: r.id,
            bookingId: r.booking_id,
            driverId: r.driver_id,
            driverName: r.driver_name,
            vehicleType: r.vehicle_type,
            routeType: r.route_type,
            origin: OperativeTerritory.fromPreset(r.origin_zone, r.origin_address),
            destination: OperativeTerritory.fromPreset(r.destination_zone, r.destination_address),
            scheduledTime: r.scheduled_time,
            baseRate: Money.fromCents(BigInt(r.base_rate_cents || '0'), r.base_rate_currency || 'COP'),
            nightSurcharge: Money.fromCents(BigInt(r.night_surcharge_cents || '0'), r.night_surcharge_currency || 'COP'),
            waitingTimeFee: Money.fromCents(BigInt(r.waiting_time_fee_cents || '0'), r.waiting_time_fee_currency || 'COP'),
            parkingFee: Money.fromCents(BigInt(r.parking_fee_cents || '0'), r.parking_fee_currency || 'COP'),
            status: r.status,
          })
      );
    } catch {
      return this.fallback.getTransfersByBooking(bookingId);
    }
  }

  public async deleteTransfer(transferId: string): Promise<void> {
    await this.fallback.deleteTransfer(transferId);
    if (!this.client) {
      return;
    }
    try {
      await this.client.from('transfers').delete().eq('id', transferId);
    } catch {
      // Handled gracefully
    }
  }

  // ==========================================
  // 5. Expenses & Digital Receipts
  // ==========================================
  public async saveExpense(expense: ReceiptExpense): Promise<void> {
    await this.fallback.saveExpense(expense);
    if (!this.client) {
      return;
    }

    const payload = {
      id: expense.id,
      booking_id: expense.bookingId,
      event_id: expense.eventId,
      category: expense.category,
      description: expense.description,
      amount_cents: expense.amount.cents.toString(),
      amount_currency: expense.amount.currency,
      vendor_name: expense.vendorName,
      vendor_tax_id: expense.vendorTaxId,
      receipt_blob_uuid: expense.receiptBlobUuid,
      date: expense.date,
      audited: expense.audited,
      status: expense.status,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('expenses').upsert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice saving expense ${expense.id}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception saving expense ${expense.id}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async getExpensesByBooking(bookingId: string): Promise<ReceiptExpense[]> {
    if (!this.client) {
      return this.fallback.getExpensesByBooking(bookingId);
    }

    try {
      const ids = await this.resolveBookingIds(bookingId);
      const { data, error } = await this.client
        .from('expenses')
        .select('*')
        .in('booking_id', ids);

      if (error || !data || data.length === 0) {
        return this.fallback.getExpensesByBooking(bookingId);
      }

      return data.map(
        (r: any) =>
          new ReceiptExpense({
            id: r.id,
            bookingId: r.booking_id,
            eventId: r.event_id,
            category: r.category,
            description: r.description,
            amount: Money.fromCents(BigInt(r.amount_cents || '0'), r.amount_currency || 'COP'),
            vendorName: r.vendor_name,
            vendorTaxId: r.vendor_tax_id,
            receiptBlobUuid: r.receipt_blob_uuid,
            date: r.date,
            audited: r.audited,
            status: r.status,
          })
      );
    } catch {
      return this.fallback.getExpensesByBooking(bookingId);
    }
  }

  public async deleteExpense(expenseId: string): Promise<void> {
    await this.fallback.deleteExpense(expenseId);
    if (!this.client) {
      return;
    }
    try {
      await this.client.from('expenses').delete().eq('id', expenseId);
    } catch {
      // Handled gracefully
    }
  }

  // ==========================================
  // 6. Settlement Ledgers
  // ==========================================
  public async saveSettlement(settlement: SettlementLedger): Promise<void> {
    await this.fallback.saveSettlement(settlement);
    if (!this.client) {
      return;
    }

    const payload = {
      booking_id: settlement.bookingId,
      total_expenses_cents: settlement.totalExpenses.cents.toString(),
      total_expenses_currency: settlement.totalExpenses.currency,
      total_guide_fees_cents: settlement.totalGuideFees.cents.toString(),
      total_guide_fees_currency: settlement.totalGuideFees.currency,
      total_fleet_taxis_cents: settlement.totalFleetTaxis.cents.toString(),
      total_fleet_taxis_currency: settlement.totalFleetTaxis.currency,
      total_advances_cents: settlement.totalAdvances.cents.toString(),
      total_advances_currency: settlement.totalAdvances.currency,
      net_balance_cents: settlement.netBalance.cents.toString(),
      net_balance_currency: settlement.netBalance.currency,
      advances: settlement.advances.map(a => ({
        id: a.id,
        date: a.date,
        amountCents: a.amount.cents.toString(),
        currency: a.amount.currency,
        description: a.description,
      })),
      last_updated: settlement.lastUpdated,
      sha256_seal: settlement.sha256Seal,
      settlement_type: settlement.settlementType,
      date: settlement.date,
      day_number: settlement.dayNumber,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('settlements').upsert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice saving settlement for ${settlement.bookingId}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception saving settlement for ${settlement.bookingId}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async getSettlement(bookingId: string): Promise<SettlementLedger | null> {
    if (!this.client) {
      return this.fallback.getSettlement(bookingId);
    }

    try {
      const ids = await this.resolveBookingIds(bookingId);
      const { data: rows, error } = await this.client
        .from('settlements')
        .select('*')
        .in('booking_id', ids)
        .limit?.(1);

      const row = rows && rows[0];
      if (error || !row) {
        return this.fallback.getSettlement(bookingId);
      }

      const [expenses, shifts, transfers] = await Promise.all([
        this.getExpensesByBooking(bookingId),
        this.getShiftsByBooking(bookingId),
        this.getTransfersByBooking(bookingId),
      ]);

      const advances: CashAdvance[] = (row.advances || []).map((a: any) => ({
        id: a.id,
        date: a.date,
        amount: Money.fromCents(BigInt(a.amountCents || '0'), a.currency || 'COP'),
        description: a.description,
      }));

      return SettlementLedger.calculate({
        bookingId: row.booking_id,
        date: row.date || undefined,
        dayNumber: row.day_number || undefined,
        settlementType: 'DAILY',
        expenses,
        shifts,
        transfers,
        advances,
        sha256Seal: row.sha256_seal || undefined,
      });
    } catch {
      return this.fallback.getSettlement(bookingId);
    }
  }

  // ==========================================
  // 7. CQRS Event Stream
  // ==========================================
  public async appendEventLog(entry: DomainEventRecord): Promise<void> {
    await this.fallback.appendEventLog(entry);
    if (!this.client) {
      return;
    }

    const payload = {
      id: entry.id,
      booking_id: entry.bookingId,
      type: entry.type,
      payload: JSON.stringify(entry.payload),
      timestamp: entry.timestamp,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.client.from('event_stream').insert(payload);
      if (error) {
        console.warn(`[SupabaseStorageAdapter] Cloud sync notice appending event log ${entry.id}: ${error.message || JSON.stringify(error)}. Data preserved in local fallback.`);
      }
    } catch (err: any) {
      console.warn(`[SupabaseStorageAdapter] Network exception appending event log ${entry.id}: ${err?.message || err}. Data preserved in local fallback.`);
    }
  }

  public async getEventStream(bookingId: string): Promise<DomainEventRecord[]> {
    if (!this.client) {
      return this.fallback.getEventStream(bookingId);
    }

    try {
      const ids = await this.resolveBookingIds(bookingId);
      const { data, error } = await this.client
        .from('event_stream')
        .select('*')
        .in('booking_id', ids)
        .order?.('timestamp', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.fallback.getEventStream(bookingId);
      }

      return data.map((r: any) => ({
        id: r.id,
        bookingId: r.booking_id,
        type: r.type,
        payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
        timestamp: r.timestamp,
      }));
    } catch {
      return this.fallback.getEventStream(bookingId);
    }
  }

  // ==========================================
  // 8. Blobs (IBlobStoragePort)
  // ==========================================
  public async saveBlob(
    id: string,
    bookingId: string,
    mimeType: string,
    category: 'RECEIPT' | 'SIGNATURE' | 'EXPORT_PDF',
    data: Blob | ArrayBuffer | string
  ): Promise<string> {
    await this.fallback.saveBlob(id, bookingId, mimeType, category, data);
    if (!this.client?.storage) {
      return id;
    }

    try {
      const path = `${bookingId}/${category.toLowerCase()}/${id}`;
      const fileData = typeof data === 'string' ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : data;

      const { error } = await this.client.storage
        .from(this.bucketName)
        .upload(path, fileData, { contentType: mimeType, upsert: true });

      if (error) {
        console.warn(`[SupabaseStorageAdapter] Blob upload notice: ${error.message || error}. Handled locally.`);
      }
    } catch (err) {
      console.warn(`[SupabaseStorageAdapter] Blob upload error:`, err, `. Handled locally.`);
    }

    return id;
  }

  public async getBlob(id: string): Promise<Blob | null> {
    if (!this.client?.storage) {
      return this.fallback.getBlob(id);
    }

    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .download(id);

      if (error || !data) {
        return this.fallback.getBlob(id);
      }

      return data;
    } catch {
      return this.fallback.getBlob(id);
    }
  }

  public async getBlobDataUrl(id: string): Promise<string | null> {
    return this.fallback.getBlobDataUrl(id);
  }

  public async deleteBlob(id: string): Promise<void> {
    await this.fallback.deleteBlob(id);
    if (this.client?.storage) {
      try {
        await this.client.storage.from(this.bucketName).remove([id]);
      } catch {
        // Safe ignore
      }
    }
  }

  public async listBlobs(bookingId?: string): Promise<BlobMetadata[]> {
    return this.fallback.listBlobs(bookingId);
  }

  // ==========================================
  // 9. Maintenance & Diagnostics
  // ==========================================
  public async clearAll(): Promise<void> {
    await this.fallback.clearAll();
    if (this.client) {
      try {
        const PRESERVED_IDS = ['bkg-rva350'];
        const PRESERVED_CODES = ['RVA350-1'];
        const ALL_PRESERVED = [...PRESERVED_IDS, ...PRESERVED_CODES];
        const preservedIdFilter = `(${PRESERVED_IDS.map((id) => `"${id}"`).join(',')})`;
        const preservedFilter = `(${ALL_PRESERVED.map((id) => `"${id}"`).join(',')})`;

        await Promise.allSettled([
          this.client.from('events').delete().not('booking_id', 'in', preservedFilter),
          this.client.from('shifts').delete().not('booking_id', 'in', preservedFilter),
          this.client.from('transfers').delete().not('booking_id', 'in', preservedFilter),
          this.client.from('expenses').delete().not('booking_id', 'in', preservedFilter),
          this.client.from('settlements').delete().not('booking_id', 'in', preservedFilter),
          this.client.from('event_stream').delete().not('booking_id', 'in', preservedFilter),
        ]);
        await this.client.from('bookings').delete().not('id', 'in', preservedIdFilter);
      } catch {
        // Handled gracefully
      }
    }
  }

  public async getHealthInfo(): Promise<StorageHealthInfo> {
    return {
      driver: 'supabase',
      isConnected: this.client !== null,
    };
  }
}
