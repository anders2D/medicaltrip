import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '@/core/infrastructure/storage/SupabaseStorageAdapter';
import { PatientBooking } from '@/core/domain/entities/PatientBooking';
import { ItineraryEvent } from '@/features/itinerary';
import { OperativeTerritory } from '@/core/domain/value-objects/OperativeTerritory';
import { Money } from '@/core/domain/value-objects/Money';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

describe('Milestone 1 Challenger: Adversarial Cloud API & CRUD Edge Cases', { timeout: 60000 }, () => {
  let client: SupabaseClient;
  let adapter: SupabaseStorageAdapter;

  const unhandledRejections: any[] = [];
  const rejectionHandler = (reason: any) => {
    unhandledRejections.push(reason);
  };

  const createdTestBookingIds: string[] = [];

  beforeAll(() => {
    if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      process.on('unhandledRejection', rejectionHandler);
    }

    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    adapter = new SupabaseStorageAdapter({ client });
  });

  afterAll(async () => {
    if (typeof process !== 'undefined' && process.removeListener) {
      process.removeListener('unhandledRejection', rejectionHandler);
    }

    // Teardown: Purge any test bookings created during stress tests
    if (createdTestBookingIds.length > 0) {
      await Promise.allSettled(
        createdTestBookingIds.map((id) => adapter.deleteBooking(id))
      );
    }

    // Assert that absolutely 0 unhandled promise rejections occurred during execution
    expect(unhandledRejections).toHaveLength(0);
  }, 20000);

  // =========================================================================
  // 1. MISSING RECORDS QUERY GUARD & PGRST116 (HTTP 406) ELIMINATION
  // =========================================================================
  describe('1. Missing Records Query Guard & PGRST116 (HTTP 406) Elimination', () => {
    it('1.1 Direct PostgREST Verification: .maybeSingle() returns {data: null, error: null, status: 200} for missing rows', async () => {
      const nonExistentId = `missing-id-${Date.now()}`;
      const { data, error, status } = await client
        .from('bookings')
        .select('*')
        .eq('id', nonExistentId)
        .maybeSingle();

      expect(status).toBe(200);
      expect(error).toBeNull();
      expect(data).toBeNull();
    });

    it('1.2 Empirical Proof: Demonstrates that .single() triggers HTTP 406 (PGRST116) whereas maybeSingle avoids it', async () => {
      const nonExistentId = `missing-id-${Date.now()}`;
      
      // Deliberately calling .single() to empirically prove PostgREST HTTP 406 vulnerability
      const singleRes = await client
        .from('bookings')
        .select('*')
        .eq('id', nonExistentId)
        .single();

      expect(singleRes.status).toBe(406);
      expect(singleRes.error).not.toBeNull();
      expect(singleRes.error?.code).toBe('PGRST116');

      // The guarded query in SupabaseStorageAdapter avoids .single()
      const guardedRes = await client
        .from('bookings')
        .select('*')
        .eq('id', nonExistentId)
        .maybeSingle();

      expect(guardedRes.status).toBe(200);
      expect(guardedRes.error).toBeNull();
      expect(guardedRes.data).toBeNull();
    });

    it('1.3 Adapter Negative Lookups across all domains return null or empty array without throwing HTTP 406', async () => {
      const ghostId = `ghost-bkg-${Date.now()}`;

      const booking = await adapter.getBooking(ghostId);
      expect(booking).toBeNull();

      const bookingByCode = await adapter.getBookingByCode(ghostId);
      expect(bookingByCode).toBeNull();

      const event = await adapter.getEventById(`ghost-evt-${Date.now()}`);
      expect(event).toBeNull();

      const events = await adapter.getEventsByBooking(ghostId);
      expect(events).toEqual([]);

      const shifts = await adapter.getShiftsByBooking(ghostId);
      expect(shifts).toEqual([]);

      const transfers = await adapter.getTransfersByBooking(ghostId);
      expect(transfers).toEqual([]);

      const expenses = await adapter.getExpensesByBooking(ghostId);
      expect(expenses).toEqual([]);

      const settlement = await adapter.getSettlement(ghostId);
      expect(settlement).toBeNull();

      const stream = await adapter.getEventStream(ghostId);
      expect(stream).toEqual([]);
    });
  });

  // =========================================================================
  // 2. ADVERSARIAL BOUNDARY & MALFORMED INPUTS
  // =========================================================================
  describe('2. Boundary & Malformed Inputs (Empty Strings, Injections, Special Chars)', () => {
    it('2.1 Handles empty strings and whitespace without throwing or unhandled rejections', async () => {
      const resEmpty = await adapter.getBooking('');
      expect(resEmpty).toBeNull();

      const resWhitespace = await adapter.getBooking('   ');
      expect(resWhitespace).toBeNull();

      const resEmptyCode = await adapter.getBookingByCode('');
      expect(resEmptyCode).toBeNull();
    });

    it('2.2 Resilient to SQL injection patterns and PostgREST filter injection strings', async () => {
      const sqlInjection = "'; DROP TABLE bookings; --";
      const resSql = await adapter.getBooking(sqlInjection);
      expect(resSql).toBeNull();

      const postgrestInjection = "id.eq.fake,code.eq.fake";
      const resPostgrest = await adapter.getBooking(postgrestInjection);
      expect(resPostgrest).toBeNull();

      const orConditionInjection = "fake' OR '1'='1";
      const resOr = await adapter.getBooking(orConditionInjection);
      expect(resOr).toBeNull();
    });

    it('2.3 Resilient to very long string queries (buffer overflow / URL limit resistance)', async () => {
      const excessivelyLongId = 'X'.repeat(2500);
      const resLong = await adapter.getBooking(excessivelyLongId);
      expect(resLong).toBeNull();
    });

    it('2.4 Deleting non-existent entities executes cleanly with zero exceptions', async () => {
      const fakeId = `non-existent-${Date.now()}`;
      await expect(adapter.deleteBooking(fakeId)).resolves.not.toThrow();
      await expect(adapter.deleteEvent(fakeId)).resolves.not.toThrow();
      await expect(adapter.deleteShift(fakeId)).resolves.not.toThrow();
      await expect(adapter.deleteTransfer(fakeId)).resolves.not.toThrow();
      await expect(adapter.deleteExpense(fakeId)).resolves.not.toThrow();
    });
  });

  // =========================================================================
  // 3. CONCURRENCY & RAPID SEQUENTIAL STRESS
  // =========================================================================
  describe('3. Concurrency & Rapid Sequential Stress Testing', () => {
    it('3.1 Executes 20 concurrent queries without socket hangs or unhandled errors', async () => {
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 20; i++) {
        promises.push(adapter.getBooking(`stress-concurrency-${i}-${Date.now()}`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(20);
      results.forEach((res) => expect(res).toBeNull());
    });

    it('3.2 Rapid sequential queries (25 iterations) execute smoothly with zero dropped connections', async () => {
      const totalRuns = 25;
      for (let i = 0; i < totalRuns; i++) {
        const id = i % 2 === 0 ? 'bkg-rva350' : `missing-seq-${i}`;
        const res = await adapter.getBooking(id);
        if (id === 'bkg-rva350') {
          // If bkg-rva350 is present, it returns the booking or fallback
          if (res) {
            expect(res.code).toBeDefined();
          }
        } else {
          expect(res).toBeNull();
        }
      }
    });

    it('3.3 Concurrent writes and atomic cascading deletions across multiple bookings', async () => {
      const count = 3;
      const batchIds: string[] = [];

      // Step A: Concurrent creation of 3 distinct test bookings
      const creationPromises = Array.from({ length: count }).map(async (_, idx) => {
        const bookingId = `chal-stress-${Date.now()}-${idx}`;
        const code = `RVA-STR-${Date.now()}-${idx}`;
        batchIds.push(bookingId);
        createdTestBookingIds.push(bookingId);

        const booking = new PatientBooking({
          id: bookingId,
          code,
          patientId: `pat-${idx}`,
          firstName: `StressFirst${idx}`,
          lastName: `StressLast${idx}`,
          passportHash: `hash-stress-${idx}`,
          country: 'Aruba',
          language: 'Papiamento',
          phone: '+57 300 123 4567',
          email: `stress${idx}@medicaltrip.co`,
          paxCount: 1,
          arrivalDate: new Date().toISOString(),
          departureDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          arrivalAirline: 'Arajet',
          arrivalFlight: 'DM-101',
          hotelId: 'htl-1616',
          hotelName: 'Hotel 1616',
          status: 'PROGRAMADO',
          notes: 'Adversarial concurrency test payload',
        });

        await adapter.saveBooking(booking);

        // Attach an itinerary event to each booking
        const event = new ItineraryEvent({
          id: `evt-${bookingId}`,
          bookingId,
          dayNumber: 1,
          title: `Consultation ${idx}`,
          category: 'CLINICAL',
          financialType: 'NONE',
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 3600000).toISOString(),
          location: OperativeTerritory.fromPreset('POBLADO', 'Cra 43A #1-50'),
          cost: Money.fromCents(15000000n, 'COP'),
          status: 'PROGRAMADO',
        });
        await adapter.saveEvent(event);

        return { bookingId, code };
      });

      const created = await Promise.all(creationPromises);
      expect(created).toHaveLength(count);

      // Verify they exist in Supabase Cloud
      for (const item of created) {
        const fetched = await adapter.getBooking(item.bookingId);
        expect(fetched).not.toBeNull();
        expect(fetched?.code).toBe(item.code);

        const events = await adapter.getEventsByBooking(item.bookingId);
        expect(events.length).toBeGreaterThanOrEqual(1);
      }

      // Step B: Concurrent cascading deletion
      const deletionPromises = created.map((item) => adapter.deleteBooking(item.bookingId));
      await Promise.all(deletionPromises);

      // Verify all deleted from Cloud
      for (const item of created) {
        const afterDelete = await adapter.getBooking(item.bookingId);
        expect(afterDelete).toBeNull();

        const eventsAfterDelete = await adapter.getEventsByBooking(item.bookingId);
        expect(eventsAfterDelete).toEqual([]);
      }
    });
  });

  // =========================================================================
  // 4. UNHANDLED PROMISE REJECTIONS AUDIT
  // =========================================================================
  describe('4. Unhandled Promise Rejections Final Certification', () => {
    it('4.1 Confirms exactly 0 unhandled promise rejections were emitted throughout all tests', () => {
      expect(unhandledRejections).toHaveLength(0);
    });
  });
});
