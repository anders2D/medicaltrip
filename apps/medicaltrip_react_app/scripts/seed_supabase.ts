import { createClient } from '@supabase/supabase-js';
import { SupabaseStorageAdapter } from '../src/core/infrastructure/storage/SupabaseStorageAdapter';
import { LoadArchetypeUseCase } from '../src/application/use-cases/LoadArchetypeUseCase';
import { ARCHETYPES_DATA } from '../src/core/infrastructure/data/archetypes.data';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pxmobokcqhsixfvdsrwj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_secret_Up-XfEGRRe-j5oRFjArR5g_i39FU7Q-';

async function seed() {
  console.log(`Connecting to Supabase at: ${SUPABASE_URL}...`);
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);
  const storage = new SupabaseStorageAdapter({ client });
  const loadUseCase = new LoadArchetypeUseCase(storage);

  const archetypeKeys = ['rva171', 'rva282', 'rva341', 'rva077', 'rva350'];
  console.log(`Seeding ${archetypeKeys.length} operational Caribbean archetypes into Supabase...`);

  for (const key of archetypeKeys) {
    console.log(`-> Seeding archetype: ${key}...`);
    const bundle = await loadUseCase.execute({ archetypeKey: key });
    console.log(`   [OK] Booking: ${bundle.booking.code} (${bundle.booking.patientFullName}), Events: ${bundle.events.length}, Shifts: ${bundle.shifts.length}, Transfers: ${bundle.transfers.length}`);
  }

  // Verify counts in Supabase
  const { data: bookings } = await client.from('bookings').select('id, code, first_name, last_name');
  const { data: events } = await client.from('events').select('id');
  const { data: shifts } = await client.from('shifts').select('id');
  const { data: transfers } = await client.from('transfers').select('id');
  const { data: expenses } = await client.from('expenses').select('id');
  const { data: settlements } = await client.from('settlements').select('booking_id, net_balance_cents');

  console.log('\n--- SUPABASE CLOUD DATABASE SEED CONFIRMATION ---');
  console.log(`Total Bookings persisted in Supabase: ${bookings?.length}`);
  console.log(`Total Events persisted in Supabase:   ${events?.length}`);
  console.log(`Total Shifts persisted in Supabase:   ${shifts?.length}`);
  console.log(`Total Transfers in Supabase:          ${transfers?.length}`);
  console.log(`Total Expenses in Supabase:           ${expenses?.length}`);
  console.log(`Total Settlements in Supabase:        ${settlements?.length}`);
  console.log('-------------------------------------------------');
  console.log('Bookings in Supabase:', bookings);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
