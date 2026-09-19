import { createClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '../src/core/infrastructure/storage/SupabaseStorageAdapter';
import { LoadArchetypeUseCase } from '../src/application/use-cases/LoadArchetypeUseCase';
import { ARCHETYPES_DATA } from '../src/core/infrastructure/data/archetypes.data';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

async function seedRva350Only() {
  console.log(`Connecting to Supabase Cloud Database at: ${SUPABASE_URL}...`);
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('1. Purging all previous patient records and preserving only clean state...');
  await client.from('event_stream').delete().neq('id', 'preserve_none');
  await client.from('settlements').delete().neq('booking_id', 'preserve_none');
  await client.from('expenses').delete().neq('id', 'preserve_none');
  await client.from('transfers').delete().neq('id', 'preserve_none');
  await client.from('shifts').delete().neq('id', 'preserve_none');
  await client.from('events').delete().neq('id', 'preserve_none');
  await client.from('patient_invitations').delete().neq('id', 'preserve_none');
  await client.from('bookings').delete().neq('id', 'preserve_none');

  console.log('2. Seeding RVA-350 (Natalie Monica Bito e/v Rumai & Alci Amundaray Rumai)...');
  const storage = new SupabaseStorageAdapter({ client });
  const loadUseCase = new LoadArchetypeUseCase(storage);

  const bundle = await loadUseCase.execute({ archetypeKey: 'rva350' });
  console.log(`   [SUCCESS] Booking: ${bundle.booking.code} (${bundle.booking.patientFullName})`);
  console.log(`   [SUCCESS] Events count:    ${bundle.events.length}`);
  console.log(`   [SUCCESS] Shifts count:    ${bundle.shifts.length}`);
  console.log(`   [SUCCESS] Transfers count: ${bundle.transfers.length}`);
  console.log(`   [SUCCESS] Expenses count:  ${bundle.expenses.length}`);
  console.log(`   [SUCCESS] Advances count:  ${bundle.settlement.advances.length}`);
  console.log(`   [SUCCESS] Net Balance:     $${bundle.settlement.netBalance.formatted}`);

  // Query verification from cloud
  const { data: bookings } = await client.from('bookings').select('id, code, first_name, last_name, hotel_name, pax_count');
  const { data: events } = await client.from('events').select('id, title');
  const { data: shifts } = await client.from('shifts').select('id, guide_name, hours_logged');
  const { data: transfers } = await client.from('transfers').select('id, driver_name, base_rate_cents');
  const { data: expenses } = await client.from('expenses').select('id, description, amount_cents');
  const { data: settlements } = await client.from('settlements').select('booking_id, net_balance_cents, sha256_seal');

  console.log('\n======================================================');
  console.log('  SUPABASE CLOUD DATABASE VERIFICATION (RVA-350 ONLY)');
  console.log('======================================================');
  console.log(`Total Bookings in Cloud:    ${bookings?.length}`);
  console.log(`Total Events in Cloud:      ${events?.length}`);
  console.log(`Total Shifts in Cloud:      ${shifts?.length}`);
  console.log(`Total Transfers in Cloud:   ${transfers?.length}`);
  console.log(`Total Expenses in Cloud:    ${expenses?.length}`);
  console.log(`Total Settlements in Cloud: ${settlements?.length}`);
  console.log('Active Cloud Bookings:', bookings);
  console.log('Active Settlement Summary:', settlements);
  console.log('======================================================');
}

seedRva350Only().catch((err) => {
  console.error('Error seeding RVA-350 to Supabase:', err);
  process.exit(1);
});
