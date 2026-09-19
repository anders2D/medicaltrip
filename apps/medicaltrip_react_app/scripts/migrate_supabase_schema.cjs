const { Client } = require("pg");

const ddl = `
-- Drop existing tables to recreate clean and unconstrained
DROP TABLE IF EXISTS event_stream CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS blobs CASCADE;
DROP TABLE IF EXISTS patient_invitations CASCADE;

-- 1. Bookings
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  patient_id TEXT,
  first_name TEXT,
  last_name TEXT,
  passport_hash TEXT,
  country TEXT,
  language TEXT,
  phone TEXT,
  email TEXT,
  companion_names JSONB DEFAULT '[]'::jsonb,
  pax_count INTEGER DEFAULT 1,
  arrival_date TEXT,
  departure_date TEXT,
  arrival_airline TEXT,
  arrival_flight TEXT,
  hotel_id TEXT,
  hotel_name TEXT,
  status TEXT,
  notes TEXT,
  passengers JSONB DEFAULT '[]'::jsonb,
  requires_hotel_reservation BOOLEAN DEFAULT false,
  hotel_voucher_file_name TEXT,
  hotel_voucher_file_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bookings_code ON bookings(code);
CREATE INDEX idx_bookings_patient_id ON bookings(patient_id);

-- 2. Events
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  day_number INTEGER,
  title TEXT NOT NULL,
  category TEXT,
  start_date_time TEXT,
  end_date_time TEXT,
  location_address TEXT,
  location_zone TEXT,
  coordinates_lat DOUBLE PRECISION,
  coordinates_lng DOUBLE PRECISION,
  provider_id TEXT,
  provider_name TEXT,
  assigned_driver_id TEXT,
  assigned_guide_id TEXT,
  assigned_nurse_id TEXT,
  financial_type TEXT,
  cost_cents TEXT,
  cost_currency TEXT,
  guide_hours NUMERIC,
  status TEXT,
  requires_gps_check_in BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT false,
  requires_receipt BOOLEAN DEFAULT false,
  gps_checked BOOLEAN DEFAULT false,
  signature_uuid TEXT,
  receipt_uuid TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_events_booking_id ON events(booking_id);

-- 3. Shifts
CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  guide_id TEXT,
  guide_name TEXT,
  day_number INTEGER,
  date TEXT,
  hours_logged NUMERIC,
  hourly_rate_cents TEXT,
  hourly_rate_currency TEXT,
  prep_allowance_cents TEXT,
  prep_allowance_currency TEXT,
  meal_subsidy_tier TEXT,
  meal_subsidy_cents TEXT,
  meal_subsidy_currency TEXT,
  notes TEXT,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_shifts_booking_id ON shifts(booking_id);

-- 4. Transfers
CREATE TABLE transfers (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  vehicle_type TEXT,
  route_type TEXT,
  origin_address TEXT,
  origin_zone TEXT,
  destination_address TEXT,
  destination_zone TEXT,
  scheduled_time TEXT,
  base_rate_cents TEXT,
  base_rate_currency TEXT,
  night_surcharge_cents TEXT,
  night_surcharge_currency TEXT,
  waiting_time_fee_cents TEXT,
  waiting_time_fee_currency TEXT,
  parking_fee_cents TEXT,
  parking_fee_currency TEXT,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transfers_booking_id ON transfers(booking_id);

-- 5. Expenses
CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  event_id TEXT,
  category TEXT,
  description TEXT,
  amount_cents TEXT,
  amount_currency TEXT,
  vendor_name TEXT,
  vendor_tax_id TEXT,
  receipt_blob_uuid TEXT,
  date TEXT,
  audited BOOLEAN DEFAULT false,
  status TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_booking_id ON expenses(booking_id);

-- 6. Settlements
CREATE TABLE settlements (
  booking_id TEXT PRIMARY KEY,
  total_expenses_cents TEXT,
  total_expenses_currency TEXT,
  total_guide_fees_cents TEXT,
  total_guide_fees_currency TEXT,
  total_fleet_taxis_cents TEXT,
  total_fleet_taxis_currency TEXT,
  total_advances_cents TEXT,
  total_advances_currency TEXT,
  net_balance_cents TEXT,
  net_balance_currency TEXT,
  advances JSONB DEFAULT '[]'::jsonb,
  last_updated TEXT,
  sha256_seal TEXT,
  settlement_type TEXT DEFAULT 'DAILY',
  date TEXT,
  day_number INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Event Stream (CQRS)
CREATE TABLE event_stream (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  timestamp BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_event_stream_booking_id ON event_stream(booking_id);

-- 8. Blobs (Receipts, Signatures, PDF Exports)
CREATE TABLE blobs (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  mime_type TEXT,
  category TEXT,
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_blobs_booking_id ON blobs(booking_id);

-- 9. Patient Invitations
CREATE TABLE patient_invitations (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  patient_name TEXT,
  country TEXT,
  language TEXT,
  phone TEXT,
  email TEXT,
  estimated_arrival_date TEXT,
  coordinator_notes TEXT,
  status TEXT,
  created_at TEXT,
  completed_at TEXT,
  completed_booking_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DISABLE ROW LEVEL SECURITY (SIN RLS - 100% LIBRE ACCESO)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_stream DISABLE ROW LEVEL SECURITY;
ALTER TABLE blobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_invitations DISABLE ROW LEVEL SECURITY;

-- GRANT ALL PRIVILEGES TO anon, authenticated, service_role
GRANT ALL ON TABLE bookings TO anon, authenticated, service_role;
GRANT ALL ON TABLE events TO anon, authenticated, service_role;
GRANT ALL ON TABLE shifts TO anon, authenticated, service_role;
GRANT ALL ON TABLE transfers TO anon, authenticated, service_role;
GRANT ALL ON TABLE expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE settlements TO anon, authenticated, service_role;
GRANT ALL ON TABLE event_stream TO anon, authenticated, service_role;
GRANT ALL ON TABLE blobs TO anon, authenticated, service_role;
GRANT ALL ON TABLE patient_invitations TO anon, authenticated, service_role;
`;

const client = new Client({
  host: "aws-0-us-west-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.pxmobokcqhsixfvdsrwj",
  password: "4!vG#uqcVd-M.7G",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL in us-west-2!");
  await client.query(ddl);
  console.log("ALL 9 UNCONSTRAINED TABLES CREATED & RLS DISABLED SUCCESSFULLY!");
  await client.end();
}

run().catch(e => {
  console.error("Migration error:", e);
  process.exit(1);
});
