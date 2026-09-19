/**
 * Medical Trip Colombia S.A.S. - Standalone Supabase Cloud All Domains CRUD Diagnostic Runner
 * Sequentially tests and certifies all 5 operational admin domains against live Supabase Cloud REST API:
 *   Domain 1: Bookings & Passengers
 *   Domain 2: Clinical Itinerary Events
 *   Domain 3: Companion Shifts
 *   Domain 4: Fleet Transfers
 *   Domain 5: Petty Cash Expenses & Deterministic Settlements (BigInt Math + SHA-256 Seal)
 *
 * Can be executed via:
 *   ./node_modules/.bin/vite-node scripts/verify_supabase_all_domains_crud.ts
 *   or: npx tsx --tsconfig ./tsconfig.app.json scripts/verify_supabase_all_domains_crud.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '../src/core/infrastructure/storage/SupabaseStorageAdapter';
import { CreatePatientBookingUseCase } from '../src/features/onboarding/application/CreatePatientBookingUseCase';
import { GenerateSmartItineraryUseCase } from '../src/features/itinerary/application/GenerateSmartItineraryUseCase';
import { RescheduleEventUseCase } from '../src/features/itinerary/application/RescheduleEventUseCase';
import { PatientBooking } from '../src/core/domain/entities/PatientBooking';
import { ItineraryEvent } from '../src/features/itinerary/domain/ItineraryEvent';
import { CompanionShift } from '../src/features/companion-shifts/domain/CompanionShift';
import { DriverTransfer } from '../src/features/logistics-fleet/domain/DriverTransfer';
import { PerformDriverCheckInUseCase } from '../src/features/logistics-fleet/application/PerformDriverCheckInUseCase';
import { ReceiptExpense } from '../src/features/settlement/domain/ReceiptExpense';
import { SettlementLedger, CashAdvance } from '../src/features/settlement/domain/SettlementLedger';
import { Money } from '../src/core/domain/value-objects/Money';
import { OperativeTerritory } from '../src/core/domain/value-objects/OperativeTerritory';
import { Sha256LedgerChain, calculateBlockHash, sha256 } from '../src/features/settlement/infrastructure/Sha256LedgerChain';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('================================================================================');
  console.log('   MEDICAL TRIP COLOMBIA — ALL 5 DOMAINS SUPABASE CLOUD CRUD DIAGNOSTIC RUNNER');
  console.log(`   Endpoint: ${SUPABASE_URL}/rest/v1`);
  console.log('================================================================================\n');

  const client: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adapter = new SupabaseStorageAdapter({ client });

  const runTimestamp = Date.now();
  const testCode = `RVA-ALL-M1-${runTimestamp}`;
  let createdBookingId = '';

  const testShiftId = `shf-all-${runTimestamp}`;
  const testTransferId = `trf-all-${runTimestamp}`;
  const testEventId = `evt-all-arr-${runTimestamp}`;
  const testExpCafeId = `exp-all-cafe-${runTimestamp}`;
  const testExpFarmaciaId = `exp-all-pharm-${runTimestamp}`;
  const testExpCustomId = `exp-all-custom-${runTimestamp}`;

  try {
    // --------------------------------------------------------------------------
    // DOMAIN 1: BOOKINGS & PASSENGERS CRUD
    // --------------------------------------------------------------------------
    console.log('>>> [DOMAIN 1: BOOKINGS & PASSENGERS]');
    console.log('    1.1 CREATE: Provisioning patient booking via CreatePatientBookingUseCase...');
    const createBookingUseCase = new CreatePatientBookingUseCase(adapter);
    const bookingResult = await createBookingUseCase.execute({
      code: testCode,
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
      notes: 'Diagnostic verification run across all 5 domains',
      requiresHotelReservation: true,
    });

    createdBookingId = bookingResult.booking.id;
    assert(bookingResult.booking.code === testCode, 'Booking code matches');
    assert(bookingResult.booking.paxCount === 2, 'Pax count is 2');
    console.log(`    ✓ Booking created: ID=${createdBookingId}, Code=${testCode}`);

    // Direct Cloud Verification
    const { data: dbBooking } = await client.from('bookings').select('*').eq('id', createdBookingId).single();
    assert(dbBooking.code === testCode && dbBooking.first_name === 'Eleanor', 'Supabase Cloud matches created booking');
    console.log('    ✓ Supabase Cloud REST verified row in "bookings"');

    console.log('    1.2 READ: Fetching by ID, code, and alias (HTTP 406 guarded)...');
    const readById = await adapter.getBooking(createdBookingId);
    const readByCode = await adapter.getBooking(testCode);
    const readByAlias = await adapter.getBookingByCode(testCode);
    assert(readById !== null && readByCode !== null && readByAlias !== null, 'Booking read queries succeed');
    assert(readById?.arrivalAirline === 'Arajet', 'Airline is Arajet');

    // Negative query safety (maybeSingle HTTP 406 check)
    const missing = await adapter.getBooking('non-existent-booking-id-' + runTimestamp);
    assert(missing === null, 'Missing booking returns null without HTTP 406');
    console.log('    ✓ Read queries and negative 406 guard passed');

    console.log('    1.3 UPDATE: Updating hotel quotes (BigInt cents), notes, and status...');
    const updatedBooking = new PatientBooking({
      ...readById!,
      notes: 'OPERATIONAL NOTE UPDATED: Verified VIP Arrival.',
      hotelNights: 10,
      hotelNightlyRateCents: 35000000n, // $350.000 COP
      hotelTotalQuotedCents: 350000000n, // $3.500.000 COP
      arrivalFlight: 'Arajet DM-101-CONFIRMED',
      status: 'EN_CURSO',
    });
    await adapter.saveBooking(updatedBooking);

    const reReadBooking = await adapter.getBooking(testCode);
    assert(reReadBooking?.hotelNightlyRateCents === 35000000n, 'BigInt rate cents preserved');
    assert(reReadBooking?.status === 'EN_CURSO', 'Status updated to EN_CURSO');
    console.log('    ✓ Booking update verified with exact BigInt cents');

    // --------------------------------------------------------------------------
    // DOMAIN 2: CLINICAL ITINERARY EVENTS CRUD
    // --------------------------------------------------------------------------
    console.log('\n>>> [DOMAIN 2: CLINICAL ITINERARY EVENTS]');
    console.log('    2.1 CREATE: Generating OPHTHALMOLOGY_3D smart preset...');
    const itineraryUseCase = new GenerateSmartItineraryUseCase(adapter);
    const itineraryResult = await itineraryUseCase.execute({
      bookingCode: testCode,
      presetType: 'OPHTHALMOLOGY_3D',
      baseDate: new Date('2026-11-10T10:00:00.000Z'),
    });
    assert(itineraryResult.events.length === 7, 'Generated 7 itinerary events');
    console.log(`    ✓ Smart itinerary generated ${itineraryResult.events.length} events`);

    const { data: dbEvents } = await client.from('events').select('*').eq('booking_id', testCode).order('start_date_time');
    assert(dbEvents?.length === 7, 'Supabase Cloud contains 7 events');
    const surgeryEvt = dbEvents!.find((e) => e.provider_id === 'CLINIC-CLOFAN' && e.category === 'CLINICAL');
    const pharmacyEvt = dbEvents!.find((e) => e.category === 'PHARMACY');
    assert(!!surgeryEvt && !!pharmacyEvt, 'Surgery and Pharmacy events present in Supabase Cloud');
    console.log('    ✓ Events persisted in Supabase Cloud "events" table');

    console.log('    2.2 READ: Validating chronological ordering & single event lookup...');
    const allEvents = await adapter.getEventsByBooking(testCode);
    for (let i = 0; i < allEvents.length - 1; i++) {
      const t1 = new Date(allEvents[i].startDateTime).getTime();
      const t2 = new Date(allEvents[i + 1].startDateTime).getTime();
      assert(t2 >= t1, `Monotonic chronology violated at event index ${i}`);
    }
    const singleEvt = await adapter.getEventById(surgeryEvt.id);
    assert(singleEvt !== null && singleEvt.providerId === 'CLINIC-CLOFAN', 'Single event lookup matches');
    console.log('    ✓ Chronological monotonicity and single event lookup verified');

    console.log('    2.3 UPDATE: Rescheduling surgical event & logging CQRS audit trail...');
    const rescheduleUseCase = new RescheduleEventUseCase(adapter);
    const newStart = '2026-11-11T14:00:00.000Z';
    const newEnd = '2026-11-11T17:30:00.000Z';
    const rescheduled = await rescheduleUseCase.execute({
      eventId: surgeryEvt.id,
      newStartDateTime: newStart,
      newEndDateTime: newEnd,
      newStatus: 'EN_SITIO',
      reason: 'Ajuste de quirófano en Clofán',
    });
    assert(rescheduled.status === 'EN_SITIO' && rescheduled.startDateTime === newStart, 'Rescheduled fields match');

    const { data: eventLogs } = await client.from('event_stream').select('*').eq('booking_id', testCode).eq('type', 'EVENT_RESCHEDULED');
    assert(eventLogs && eventLogs.length >= 1, 'EVENT_RESCHEDULED logged in event_stream');
    console.log('    ✓ Reschedule applied and CQRS audit log verified');

    console.log('    2.4 DELETE: Removing non-critical pharmacy event...');
    await adapter.deleteEvent(pharmacyEvt.id);
    const remainingEvts = await adapter.getEventsByBooking(testCode);
    assert(remainingEvts.length === 6, 'Event count decreased to 6');
    console.log('    ✓ Event deleted cleanly from Supabase Cloud');

    // --------------------------------------------------------------------------
    // DOMAIN 3: COMPANION SHIFTS CRUD
    // --------------------------------------------------------------------------
    console.log('\n>>> [DOMAIN 3: COMPANION SHIFTS]');
    console.log('    3.1 CREATE: Provisioning bilingual companion shift ($15.500/h + prep + TIER_2 meal)...');
    const initialShift = new CompanionShift({
      id: testShiftId,
      bookingId: testCode,
      guideId: 'GUIA-01',
      guideName: 'Yenny Roberto',
      dayNumber: 1,
      date: '2026-11-10',
      hoursLogged: 6,
      hourlyRate: Money.fromAmount(15500, 'COP'),
      prepAllowance: Money.fromAmount(15500, 'COP'),
      mealSubsidyTier: 'TIER_2',
      mealSubsidyAmount: Money.fromAmount(25000, 'COP'),
      notes: 'Acompañamiento clínico Clofán',
      status: 'SCHEDULED',
    });

    // 6 * 15500 = 93000; + 15500 + 25000 = 133500 COP (13350000 cents)
    const initialFee = initialShift.calculateTotalFee();
    assert(initialFee.cents === 13350000n, 'Initial shift fee is 13350000n cents ($133.500 COP)');
    await adapter.saveShift(initialShift);
    console.log(`    ✓ Shift saved: Fee=${initialFee.format()} (${initialFee.cents} cents)`);

    console.log('    3.2 READ: Querying shifts from Supabase Cloud...');
    const shifts = await adapter.getShiftsByBooking(testCode);
    const retrievedShift = shifts.find((s) => s.id === testShiftId);
    assert(!!retrievedShift && retrievedShift.hoursLogged === 6, 'Shift retrieved from Supabase');
    console.log('    ✓ Shift retrieved and calculations validated');

    console.log('    3.3 UPDATE: Incrementing hours (+0.5h to 6.5h) & deriving SHA-256 seal...');
    const sigSvg = '<svg viewBox="0 0 100 50"><line x1="0" y1="25" x2="100" y2="25"/></svg>';
    const sigHash = sha256(sigSvg);
    const updatedFeeCents = 14125000n; // 6.5 * 15500 + 15500 + 25000 = 141250 COP
    const sealPayload = {
      bookingCode: testCode,
      guideId: 'GUIA-01',
      hoursLogged: 6.5,
      totalShiftFeeCents: updatedFeeCents.toString(),
      signatureHash: sigHash,
    };
    const shiftSeal = calculateBlockHash(1, Date.now(), sealPayload, '0'.repeat(64), 0);

    const updatedShift = new CompanionShift({
      ...retrievedShift!,
      hoursLogged: 6.5,
      notes: `Turno firmado [SHA-256 SEAL: ${shiftSeal}]`,
      status: 'APPROVED',
    });
    assert(updatedShift.calculateTotalFee().cents === updatedFeeCents, 'Updated fee is 14125000n cents');
    await adapter.saveShift(updatedShift);

    const { data: dbShift } = await client.from('shifts').select('*').eq('id', testShiftId).single();
    assert(Number(dbShift.hours_logged) === 6.5 && dbShift.status === 'APPROVED', 'Shift updated in Cloud');
    console.log(`    ✓ Shift updated with seal: ${shiftSeal.substring(0, 16)}...`);

    console.log('    3.4 DELETE: Deleting shift from Supabase Cloud...');
    await adapter.deleteShift(testShiftId);
    const { data: deletedShiftRows } = await client.from('shifts').select('*').eq('id', testShiftId);
    assert(!deletedShiftRows || deletedShiftRows.length === 0, 'Shift removed from Supabase Cloud');
    console.log('    ✓ Shift deleted cleanly');

    // --------------------------------------------------------------------------
    // DOMAIN 4: FLEET TRANSFERS CRUD
    // --------------------------------------------------------------------------
    console.log('\n>>> [DOMAIN 4: FLEET TRANSFERS]');
    console.log('    4.1 CREATE: Provisioning Aeroturex transfer (JMC -> Hotel 1616)...');
    const transfer = new DriverTransfer({
      id: testTransferId,
      bookingId: testCode,
      driverId: 'DRV-01',
      driverName: 'Ramón Rosero',
      vehicleType: 'SEDAN',
      routeType: 'AIRPORT_ARRIVAL',
      origin: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'Aeropuerto JMC'),
      destination: OperativeTerritory.fromPreset('POBLADO', 'HOTEL 1616 Poblado'),
      scheduledTime: '2026-11-10T15:00:00.000Z',
      baseRate: Money.fromAmount(145000, 'COP'),
      status: 'CONFIRMED',
    });
    assert(transfer.calculateTotalCost().cents === 14500000n, 'Transfer base rate is 14500000n cents');
    await adapter.saveTransfer(transfer);
    console.log(`    ✓ Transfer saved: Base Rate=${transfer.baseRate.format()}`);

    console.log('    4.2 READ: Reading transfer from Supabase Cloud...');
    const transfers = await adapter.getTransfersByBooking(testCode);
    const retrievedTrf = transfers.find((t) => t.id === testTransferId);
    assert(!!retrievedTrf && retrievedTrf.driverName === 'Ramón Rosero', 'Transfer read matches');
    console.log('    ✓ Transfer verified');

    console.log('    4.3 UPDATE: Executing terminal driver check-in use case...');
    await adapter.saveEvent(
      new ItineraryEvent({
        id: testEventId,
        bookingId: testCode,
        dayNumber: 1,
        title: 'Traslado JMC Aeroturex',
        category: 'TRANSFER',
        startDateTime: '2026-11-10T15:00:00.000Z',
        endDateTime: '2026-11-10T16:15:00.000Z',
        location: OperativeTerritory.fromPreset('RIONEGRO_AEROPUERTO', 'Aeropuerto JMC'),
        assignedDriverId: 'DRV-01',
        status: 'PROGRAMADO',
        requiresGpsCheckIn: true,
        cost: Money.fromAmount(145000, 'COP'),
        financialType: 'FLEET_TAXI',
      })
    );

    const checkInUseCase = new PerformDriverCheckInUseCase(adapter);
    const checkInRes = await checkInUseCase.execute({
      bookingId: testCode,
      transferId: testTransferId,
      eventId: testEventId,
      targetTransferStatus: 'IN_TRANSIT',
      targetEventStatus: 'EN_SITIO',
      gpsCoordinates: { lat: 6.1645, lng: -75.4231 },
      driverNotes: 'Pasajero a bordo en Aeropuerto JMC',
    });
    assert(checkInRes.success && checkInRes.transfer.status === 'IN_TRANSIT', 'Driver check-in succeeded');
    const { data: dbTrf } = await client.from('transfers').select('*').eq('id', testTransferId).single();
    assert(dbTrf.status === 'IN_TRANSIT', 'Transfer status IN_TRANSIT in Supabase Cloud');
    console.log('    ✓ Transfer check-in updated in Cloud with GPS coordinates');

    console.log('    4.4 DELETE: Deleting transfer from Supabase Cloud...');
    await adapter.deleteTransfer(testTransferId);
    const { data: deletedTrfRows } = await client.from('transfers').select('*').eq('id', testTransferId);
    assert(!deletedTrfRows || deletedTrfRows.length === 0, 'Transfer removed from Supabase Cloud');
    console.log('    ✓ Transfer deleted cleanly');

    // --------------------------------------------------------------------------
    // DOMAIN 5: EXPENSES & DETERMINISTIC SETTLEMENTS CRUD
    // --------------------------------------------------------------------------
    console.log('\n>>> [DOMAIN 5: EXPENSES & DETERMINISTIC SETTLEMENTS]');
    console.log('    5.1 CREATE: Saving 1-Tap expenses and custom audited receipts...');
    const expCafe = new ReceiptExpense({
      id: testExpCafeId,
      bookingId: testCode,
      category: 'MEAL_SUBSIDY',
      description: 'Café Juan Valdez',
      amount: Money.fromAmount(15000, 'COP'), // 1500000n cents
      date: '2026-11-10',
      status: 'APPROVED',
    });
    const expPharm = new ReceiptExpense({
      id: testExpFarmaciaId,
      bookingId: testCode,
      category: 'PHARMACY',
      description: 'Farmacia Clofán (Gotas)',
      amount: Money.fromAmount(185000, 'COP'), // 18500000n cents
      date: '2026-11-10',
      status: 'APPROVED',
    });
    const expCustom = new ReceiptExpense({
      id: testExpCustomId,
      bookingId: testCode,
      category: 'MEDICAL_LAB',
      description: 'Lab Echavarría Exámenes',
      amount: Money.fromAmount(125000, 'COP'), // 12500000n cents
      vendorName: 'Laboratorio Echavarría',
      vendorTaxId: 'NIT 890.123.456-1',
      date: '2026-11-10',
      audited: true,
      status: 'APPROVED',
    });

    await adapter.saveExpense(expCafe);
    await adapter.saveExpense(expPharm);
    await adapter.saveExpense(expCustom);

    const { data: dbExpenses } = await client.from('expenses').select('*').eq('booking_id', testCode);
    assert(dbExpenses && dbExpenses.length >= 3, 'Expenses saved in Supabase Cloud');
    console.log('    ✓ 3 expenses persisted in Supabase Cloud "expenses" table');

    console.log('    5.2 READ: Reading expenses & validating BigInt sums...');
    const allExpenses = await adapter.getExpensesByBooking(testCode);
    const totalExpCents = allExpenses.reduce((sum, e) => sum + e.amount.cents, 0n);
    console.log(`    Total expenses accumulated: ${allExpenses.length} receipts | ${Money.fromCents(totalExpCents, 'COP').format()} (${totalExpCents} cents)`);
    assert(totalExpCents > 0n, 'Expenses sum greater than zero');

    console.log('    5.3 UPDATE: Updating receipt amount with zero-drift BigInt delta...');
    const updatedPharm = new ReceiptExpense({
      ...expPharm,
      amount: Money.fromAmount(210000, 'COP'), // +$25.000 COP
      description: 'Farmacia Clofán (Ajuste)',
    });
    await adapter.saveExpense(updatedPharm);
    const { data: updatedPharmRow } = await client.from('expenses').select('*').eq('id', testExpFarmaciaId).single();
    assert(updatedPharmRow.amount_cents === '21000000', 'Updated cents match 21000000');
    console.log('    ✓ Receipt amount updated in Supabase Cloud');

    console.log('    5.4 DELETE: Soft-rejecting café expense & hard-deleting custom receipt...');
    const rejectedCafe = new ReceiptExpense({
      ...expCafe,
      status: 'REJECTED',
    });
    await adapter.saveExpense(rejectedCafe);
    await adapter.deleteExpense(testExpCustomId);
    const { data: deletedCustomRows } = await client.from('expenses').select('*').eq('id', testExpCustomId);
    assert(!deletedCustomRows || deletedCustomRows.length === 0, 'Custom expense deleted');
    console.log('    ✓ Soft-reject and hard-delete completed');

    console.log('    5.5 SETTLEMENT: Calculating deterministic balance with advances & SHA-256 seal...');
    const activeExpenses = await adapter.getExpensesByBooking(testCode);
    const activeShifts = await adapter.getShiftsByBooking(testCode);
    const activeTransfers = await adapter.getTransfersByBooking(testCode);
    const advances: CashAdvance[] = [
      {
        id: `adv-1-${runTimestamp}`,
        date: '2026-11-10',
        amount: Money.fromAmount(500000, 'COP'), // $500.000 COP
        description: 'Abono Inicial Tarjeta',
      },
    ];

    const chain = new Sha256LedgerChain();
    chain.addBlock({ action: 'RECONCILE', bookingCode: testCode });
    const fakeSigUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const sealCert = chain.signLedgerSeal('PAX-ALL-M1', fakeSigUrl);

    const ledger = SettlementLedger.calculate({
      bookingId: testCode,
      expenses: activeExpenses,
      shifts: activeShifts,
      transfers: activeTransfers,
      advances,
      sha256Seal: sealCert.sealHash,
    });

    console.log(`    Total Debits:   ${ledger.totalExpenses.add(ledger.totalGuideFees).add(ledger.totalFleetTaxis).format()}`);
    console.log(`    Total Advances: ${ledger.totalAdvances.format()}`);
    console.log(`    Net Balance:    ${ledger.netBalance.format()} (${ledger.netBalance.cents} cents)`);
    console.log(`    SHA-256 Seal:   ${ledger.sha256Seal}`);

    await adapter.saveSettlement(ledger);
    const retrievedLedger = await adapter.getSettlement(testCode);
    assert(retrievedLedger !== null, 'Settlement retrieved from Supabase Cloud');
    assert(retrievedLedger?.netBalance.cents === ledger.netBalance.cents, 'BigInt Net balance exact match');
    assert(retrievedLedger?.sha256Seal === sealCert.sealHash, 'SHA-256 seal verified');
    console.log('    ✓ Deterministic settlement persisted and verified in Supabase Cloud');

    // --------------------------------------------------------------------------
    // CASCADING DELETION TEARDOWN
    // --------------------------------------------------------------------------
    console.log('\n>>> [TEARDOWN & CASCADING DELETION]');
    console.log(`    Executing cascading delete on booking ${createdBookingId}...`);
    await adapter.deleteBooking(createdBookingId);

    const ids = [createdBookingId, testCode];
    const [bkgCheck, evtsCheck, expCheck, setCheck] = await Promise.all([
      client.from('bookings').select('id').in('id', ids),
      client.from('events').select('id').in('booking_id', ids),
      client.from('expenses').select('id').in('booking_id', ids),
      client.from('settlements').select('booking_id').in('booking_id', ids),
    ]);

    assert(!bkgCheck.data || bkgCheck.data.length === 0, 'No bookings remain');
    assert(!evtsCheck.data || evtsCheck.data.length === 0, 'No events remain');
    assert(!expCheck.data || expCheck.data.length === 0, 'No expenses remain');
    assert(!setCheck.data || setCheck.data.length === 0, 'No settlements remain');
    console.log('    ✓ All child records cleanly purged from Supabase Cloud');

    console.log('\n================================================================================');
    console.log('  ALL 5 CORE DOMAINS 100% CERTIFIED AGAINST LIVE SUPABASE CLOUD REST API!');
    console.log('================================================================================');
  } finally {
    // Failsafe cleanup in case of unexpected errors
    const ids = [createdBookingId, testCode, testShiftId, testTransferId, testEventId].filter(Boolean);
    await Promise.allSettled([
      client.from('bookings').delete().in('id', ids),
      client.from('bookings').delete().in('code', ids),
      client.from('events').delete().in('booking_id', ids),
      client.from('events').delete().in('id', ids),
      client.from('shifts').delete().in('booking_id', ids),
      client.from('shifts').delete().in('id', ids),
      client.from('transfers').delete().in('booking_id', ids),
      client.from('transfers').delete().in('id', ids),
      client.from('expenses').delete().in('booking_id', ids),
      client.from('expenses').delete().in('id', ids),
      client.from('settlements').delete().in('booking_id', ids),
      client.from('event_stream').delete().in('booking_id', ids),
    ]);
  }
}

main().catch((err) => {
  console.error('\n❌ DIAGNOSTIC RUNNER FAILED:', err);
  process.exit(1);
});
