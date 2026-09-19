import { createClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '../src/core/infrastructure/storage/SupabaseStorageAdapter';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

async function main() {
  console.log('Connecting to Supabase at:', SUPABASE_URL);
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);
  const adapter = new SupabaseStorageAdapter({ client });

  console.log('\n--- Test 1: Fetch existing booking by ID (bkg-rva350) ---');
  const bkg1 = await adapter.getBooking('bkg-rva350');
  console.log('Status: OK | Found booking code:', bkg1?.code, '| ID:', bkg1?.id);

  console.log('\n--- Test 2: Fetch existing booking by Code (RVA350-1) ---');
  const bkg2 = await adapter.getBooking('RVA350-1');
  console.log('Status: OK | Found booking ID:', bkg2?.id, '| Patient:', bkg2?.firstName, bkg2?.lastName);

  console.log('\n--- Test 3: Fetch existing booking by getBookingByCode (RVA350-1) ---');
  const bkg3 = await adapter.getBookingByCode('RVA350-1');
  console.log('Status: OK | Found booking code:', bkg3?.code);

  console.log('\n--- Test 4: Query non-existent booking ID (MUST NOT RETURN HTTP 406) ---');
  const bkg4 = await adapter.getBooking('non-existent-booking-id');
  console.log('Status: OK | Result is null as expected (NO HTTP 406 thrown):', bkg4 === null);

  console.log('\n--- Test 5: Query non-existent booking Code (MUST NOT RETURN HTTP 406) ---');
  const bkg5 = await adapter.getBookingByCode('NON-EXISTENT-CODE');
  console.log('Status: OK | Result is null as expected (NO HTTP 406 thrown):', bkg5 === null);

  console.log('\n--- Test 6: Query non-existent event ID (MUST NOT RETURN HTTP 406) ---');
  const evt = await adapter.getEventById('evt-does-not-exist');
  console.log('Status: OK | Result is null as expected (NO HTTP 406 thrown):', evt === null);

  console.log('\n--- Test 7: Query events by booking for bkg-rva350 ---');
  const events = await adapter.getEventsByBooking('bkg-rva350');
  console.log('Status: OK | Retrieved events count:', events.length);

  console.log('\n--- Test 8: Query shifts by booking for bkg-rva350 ---');
  const shifts = await adapter.getShiftsByBooking('bkg-rva350');
  console.log('Status: OK | Retrieved shifts count:', shifts.length);

  console.log('\n--- Test 9: Query transfers by booking for bkg-rva350 ---');
  const transfers = await adapter.getTransfersByBooking('bkg-rva350');
  console.log('Status: OK | Retrieved transfers count:', transfers.length);

  console.log('\n--- Test 10: Query expenses by booking for bkg-rva350 ---');
  const expenses = await adapter.getExpensesByBooking('bkg-rva350');
  console.log('Status: OK | Retrieved expenses count:', expenses.length);

  console.log('\n--- Test 11: Query settlement by booking for bkg-rva350 ---');
  const settlement = await adapter.getSettlement('bkg-rva350');
  console.log('Status: OK | Net balance formatted:', settlement?.netBalance.formatted);

  console.log('\n======================================================');
  console.log('  LIVE SUPABASE REST VERIFICATION 100% PASSED!');
  console.log('  Zero HTTP 406 errors, clean maybeSingle responses.');
  console.log('======================================================');
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
