import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '@/core/infrastructure/storage/SupabaseStorageAdapter';
import { CreatePatientBookingUseCase } from '@/features/onboarding';
import { GenerateSmartItineraryUseCase, RescheduleEventUseCase } from '@/features/itinerary';
import { PatientBooking } from '@/core/domain/entities/PatientBooking';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

describe('Domain 1 & Domain 2: Bookings & Clinical Events CRUD (Supabase Cloud REST API)', { timeout: 30000 }, () => {
  let client: SupabaseClient;
  let adapter: SupabaseStorageAdapter;

  const TEST_CODE = `RVA-M1-${Date.now()}`;
  let createdBookingId = '';

  beforeAll(async () => {
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    adapter = new SupabaseStorageAdapter({ client });
  }, 15000);

  afterAll(async () => {
    // Teardown: ensure complete cascading cleanup of test records in Supabase Cloud
    if (createdBookingId || TEST_CODE) {
      const ids = [createdBookingId, TEST_CODE].filter(Boolean);
      await Promise.allSettled([
        client.from('bookings').delete().in('id', ids),
        client.from('bookings').delete().in('code', ids),
        client.from('events').delete().in('booking_id', ids),
        client.from('shifts').delete().in('booking_id', ids),
        client.from('transfers').delete().in('booking_id', ids),
        client.from('expenses').delete().in('booking_id', ids),
        client.from('settlements').delete().in('booking_id', ids),
        client.from('event_stream').delete().in('booking_id', ids),
      ]);
    }
  }, 15000);

  // ==========================================
  // DOMAIN 1: BOOKINGS CRUD LIFECYCLE
  // ==========================================
  describe('Domain 1: Bookings & Passengers CRUD Lifecycle', () => {
    it('1.1 CREATE: provisions a new patient booking with companions, flights, and hotel in Supabase Cloud', async () => {
      const createUseCase = new CreatePatientBookingUseCase(adapter);
      const result = await createUseCase.execute({
        code: TEST_CODE,
        firstName: 'Eleanor',
        lastName: 'Vanderbilt',
        country: 'Curazao',
        language: 'Papiamento / Holandés',
        paxCount: 2,
        companionNames: ['Marcus Vanderbilt'],
        arrivalDate: '2026-11-10T14:30:00.000Z',
        departureDate: '2026-11-20T18:00:00.000Z',
        hotel: 'HOTEL 1616 Poblado',
        hotelName: 'HOTEL 1616 Poblado',
        airline: 'Arajet',
        flightNumber: 'DM-101',
        notes: 'Test booking for Domain 1 CRUD verification against Supabase Cloud',
        requiresHotelReservation: true,
      });

      expect(result.booking).toBeDefined();
      expect(result.booking.code).toBe(TEST_CODE);
      expect(result.booking.paxCount).toBe(2);
      expect(result.booking.status).toBe('PROGRAMADO');
      expect(result.settlement).toBeDefined();

      createdBookingId = result.booking.id;

      // Direct Supabase Cloud REST verification
      const { data, error, status } = await client
        .from('bookings')
        .select('*')
        .eq('id', createdBookingId)
        .maybeSingle();

      expect(error).toBeNull();
      expect(status).toBe(200);
      expect(data).not.toBeNull();
      expect(data.id).toBe(createdBookingId);
      expect(data.code).toBe(TEST_CODE);
      expect(data.first_name).toBe('Eleanor');
      expect(data.last_name).toBe('Vanderbilt');
      expect(data.pax_count).toBe(2);
      expect(data.companion_names).toContain('Marcus Vanderbilt');
      expect(data.hotel_name).toBe('HOTEL 1616 Poblado');
      expect(data.requires_hotel_reservation).toBe(true);

      // Verify side effects: empty settlement initialized and BOOKING_CREATED in event_stream
      const { data: settlementData } = await client
        .from('settlements')
        .select('*')
        .eq('booking_id', TEST_CODE)
        .maybeSingle();
      expect(settlementData).not.toBeNull();
      expect(settlementData.total_expenses_cents).toBe('0');
    });

    it('1.2 READ: fetches booking by ID, code, and alias without throwing HTTP 406 on non-existent records', async () => {
      // Lookup by ID
      const byId = await adapter.getBooking(createdBookingId);
      expect(byId).not.toBeNull();
      expect(byId!.code).toBe(TEST_CODE);
      expect(byId!.firstName).toBe('Eleanor');
      expect(byId!.arrivalAirline).toBe('Arajet');
      expect(byId!.arrivalFlight).toBe('DM-101');
      expect(byId!.passengers.length).toBe(2);

      // Lookup by Code
      const byCode = await adapter.getBooking(TEST_CODE);
      expect(byCode).not.toBeNull();
      expect(byCode!.id).toBe(createdBookingId);

      // Lookup by getBookingByCode alias
      const byAlias = await adapter.getBookingByCode(TEST_CODE);
      expect(byAlias).not.toBeNull();
      expect(byAlias!.code).toBe(TEST_CODE);

      // Negative read verification (must return null, NEVER throw HTTP 406 / PGRST116)
      const nonExistentId = await adapter.getBooking(`bkg-missing-${Date.now()}`);
      expect(nonExistentId).toBeNull();

      const nonExistentCode = await adapter.getBookingByCode(`RVA-MISSING-${Date.now()}`);
      expect(nonExistentCode).toBeNull();
    });

    it('1.3 UPDATE: modifies operational notes, hotel quotes (BigInt cents), and status to EN_CURSO', async () => {
      const existing = await adapter.getBooking(createdBookingId);
      expect(existing).not.toBeNull();

      const updated = new PatientBooking({
        ...existing!,
        notes: 'OPERATIONAL NOTE UPDATED: Patient requires wheelchair assistance upon arrival.',
        hotelNights: 10,
        hotelNightlyRateCents: 35000000n, // $350.000 COP
        hotelTotalQuotedCents: 350000000n, // $3.500.000 COP
        arrivalFlight: 'Arajet DM-101-UPDATED',
        status: 'EN_CURSO',
      });

      await adapter.saveBooking(updated);

      // Re-read via storagePort
      const reRead = await adapter.getBooking(TEST_CODE);
      expect(reRead!.notes).toContain('wheelchair assistance');
      expect(reRead!.hotelNights).toBe(10);
      expect(reRead!.hotelNightlyRateCents).toBe(35000000n);
      expect(reRead!.hotelTotalQuotedCents).toBe(350000000n);
      expect(reRead!.arrivalFlight).toBe('Arajet DM-101-UPDATED');
      expect(reRead!.status).toBe('EN_CURSO');

      // Direct Supabase Cloud REST verification
      const { data: dbData } = await client
        .from('bookings')
        .select('*')
        .eq('id', createdBookingId)
        .single();

      expect(dbData.notes).toContain('wheelchair assistance');
      expect(dbData.hotel_nights).toBe(10);
      expect(dbData.hotel_nightly_rate_cents).toBe('35000000');
      expect(dbData.hotel_total_quoted_cents).toBe('350000000');
      expect(dbData.arrival_flight).toBe('Arajet DM-101-UPDATED');
      expect(dbData.status).toBe('EN_CURSO');
    });
  });

  // ==========================================
  // DOMAIN 2: CLINICAL ITINERARY EVENTS CRUD
  // ==========================================
  describe('Domain 2: Clinical Itinerary Events CRUD Lifecycle', () => {
    let surgicalEventId = '';
    let pharmacyEventId = '';

    it('2.1 CREATE: generates smart clinical itinerary preset OPHTHALMOLOGY_3D and persists in Supabase Cloud', async () => {
      const itineraryUseCase = new GenerateSmartItineraryUseCase(adapter);
      const itineraryResult = await itineraryUseCase.execute({
        bookingCode: TEST_CODE,
        presetType: 'OPHTHALMOLOGY_3D',
        baseDate: new Date('2026-11-10T10:00:00.000Z'),
      });

      expect(itineraryResult.events.length).toBe(7);
      expect(itineraryResult.shifts.length).toBe(2);
      expect(itineraryResult.transfers.length).toBe(2);
      expect(itineraryResult.expenses.length).toBe(2);

      // Direct Supabase Cloud query for events
      const { data: eventsData, error } = await client
        .from('events')
        .select('*')
        .eq('booking_id', TEST_CODE)
        .order('start_date_time', { ascending: true });

      expect(error).toBeNull();
      expect(eventsData).toHaveLength(7);

      // Assert Fasting Lab event at 05:30 AM
      const fastingLab = eventsData!.find((e) => e.category === 'LAB');
      expect(fastingLab).toBeDefined();
      expect(fastingLab.start_date_time).toContain('05:30:00');

      // Assert Clofán surgery event
      const surgery = eventsData!.find((e) => e.id.includes('d2-surg') || (e.provider_id === 'CLINIC-CLOFAN' && e.cost_cents === '5425000'));
      expect(surgery).toBeDefined();
      expect(surgery!.cost_cents).toBe('5425000');
      surgicalEventId = surgery!.id;

      // Assert Pharmacy event
      const pharmacy = eventsData!.find((e) => e.category === 'PHARMACY');
      expect(pharmacy).toBeDefined();
      pharmacyEventId = pharmacy.id;
    });

    it('2.2 READ: retrieves events by booking asserting monotonic chronology and single event lookup', async () => {
      const events = await adapter.getEventsByBooking(TEST_CODE);
      expect(events.length).toBe(7);

      // Strict Chronological Invariant: Ti <= Ti+1
      for (let i = 0; i < events.length - 1; i++) {
        const tCurrent = new Date(events[i].startDateTime).getTime();
        const tNext = new Date(events[i + 1].startDateTime).getTime();
        expect(tNext).toBeGreaterThanOrEqual(tCurrent);
      }

      // Non-inverted event duration: end >= start
      for (const evt of events) {
        expect(new Date(evt.endDateTime).getTime()).toBeGreaterThanOrEqual(new Date(evt.startDateTime).getTime());
        expect(evt.durationMinutes).toBeGreaterThan(0);
      }

      // Single event lookup
      const single = await adapter.getEventById(surgicalEventId);
      expect(single).not.toBeNull();
      expect(single!.providerId).toBe('CLINIC-CLOFAN');
      expect(single!.category).toBe('CLINICAL');

      // Negative read verification
      const missingEvent = await adapter.getEventById(`evt-missing-${Date.now()}`);
      expect(missingEvent).toBeNull();
    });

    it('2.3 UPDATE: reschedules surgery event, shifts timestamps, sets status to EN_SITIO, and appends CQRS log', async () => {
      const rescheduleUseCase = new RescheduleEventUseCase(adapter);
      const newStart = '2026-11-11T14:00:00.000Z';
      const newEnd = '2026-11-11T17:30:00.000Z';

      const rescheduled = await rescheduleUseCase.execute({
        eventId: surgicalEventId,
        newStartDateTime: newStart,
        newEndDateTime: newEnd,
        newStatus: 'EN_SITIO',
        reason: 'Cirugía reprogramada por disponibilidad de quirófano en Clofán.',
      });

      expect(rescheduled.id).toBe(surgicalEventId);
      expect(rescheduled.startDateTime).toBe(newStart);
      expect(rescheduled.endDateTime).toBe(newEnd);
      expect(rescheduled.status).toBe('EN_SITIO');

      // Direct Supabase Cloud REST verification
      const { data: cloudEvent } = await client
        .from('events')
        .select('*')
        .eq('id', surgicalEventId)
        .single();

      expect(cloudEvent.start_date_time).toBe(newStart);
      expect(cloudEvent.end_date_time).toBe(newEnd);
      expect(cloudEvent.status).toBe('EN_SITIO');

      // Verify CQRS event stream log
      const { data: eventLogs } = await client
        .from('event_stream')
        .select('*')
        .eq('booking_id', TEST_CODE)
        .eq('type', 'EVENT_RESCHEDULED');

      expect(eventLogs).not.toBeNull();
      expect(eventLogs!.length).toBeGreaterThanOrEqual(1);
    });

    it('2.4 DELETE: deletes non-critical pharmacy event leaving sibling events intact', async () => {
      await adapter.deleteEvent(pharmacyEventId);

      // Direct Supabase query: deleted event must return 0 rows
      const { data: deletedRows } = await client
        .from('events')
        .select('*')
        .eq('id', pharmacyEventId);

      expect(deletedRows).toHaveLength(0);

      // Sibling events count decreases from 7 to 6
      const remainingEvents = await adapter.getEventsByBooking(TEST_CODE);
      expect(remainingEvents.length).toBe(6);
      expect(remainingEvents.some((e) => e.id === pharmacyEventId)).toBe(false);

      // Negative read verification
      const deletedEvent = await adapter.getEventById(pharmacyEventId);
      expect(deletedEvent).toBeNull();
    });
  });

  // ==========================================
  // DOMAIN 1: CASCADING DELETE INTEGRITY
  // ==========================================
  describe('Domain 1: Cascading Deletion Integrity', () => {
    it('1.4 DELETE: deleteBooking cascades across all relational tables leaving 0 orphan records in Supabase Cloud', async () => {
      // Ensure records exist before deletion
      const beforeEvents = await adapter.getEventsByBooking(TEST_CODE);
      expect(beforeEvents.length).toBeGreaterThan(0);

      // Execute cascading delete
      await adapter.deleteBooking(createdBookingId);

      // Verify across all tables directly in Supabase Cloud
      const ids = [createdBookingId, TEST_CODE];

      const [bookingsRes, eventsRes, shiftsRes, transfersRes, expensesRes, settlementsRes, streamRes] = await Promise.all([
        client.from('bookings').select('id').in('id', ids),
        client.from('events').select('id').in('booking_id', ids),
        client.from('shifts').select('id').in('booking_id', ids),
        client.from('transfers').select('id').in('booking_id', ids),
        client.from('expenses').select('id').in('booking_id', ids),
        client.from('settlements').select('booking_id').in('booking_id', ids),
        client.from('event_stream').select('id').in('booking_id', ids),
      ]);

      expect(bookingsRes.data).toHaveLength(0);
      expect(eventsRes.data).toHaveLength(0);
      expect(shiftsRes.data).toHaveLength(0);
      expect(transfersRes.data).toHaveLength(0);
      expect(expensesRes.data).toHaveLength(0);
      expect(settlementsRes.data).toHaveLength(0);
      expect(streamRes.data).toHaveLength(0);

      // Verify storagePort queries return null / empty
      const afterBooking = await adapter.getBooking(TEST_CODE);
      expect(afterBooking).toBeNull();

      const afterEvents = await adapter.getEventsByBooking(TEST_CODE);
      expect(afterEvents).toHaveLength(0);
    });
  });
});
