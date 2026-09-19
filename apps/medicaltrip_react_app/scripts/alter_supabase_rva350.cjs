const { Client } = require("pg");

const client = new Client({
  host: "aws-0-us-west-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.pxmobokcqhsixfvdsrwj",
  password: "4!vG#uqcVd-M.7G",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

const ddl = `
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_legs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS treatment_phase TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_nights INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_nightly_rate_cents TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_total_quoted_cents TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_agency_deposit_cents TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel_direct_pay_cents TEXT;

GRANT ALL ON TABLE bookings TO anon, authenticated, service_role;
`;

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL!");
  await client.query(ddl);
  console.log("Added RVA350 hotel splitting and flight legs columns successfully!");
  await client.end();
}

run().catch(e => {
  console.error("Migration error:", e);
  process.exit(1);
});
