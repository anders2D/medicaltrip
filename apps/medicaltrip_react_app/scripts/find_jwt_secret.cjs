const { Client } = require("pg");

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
  console.log("Connected to Supabase PostgreSQL!");

  // List all schemas and tables
  const res = await client.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('auth', 'vault', 'storage', 'supabase_functions')
    ORDER BY table_schema, table_name;
  `);
  console.log("Tables in system schemas:", res.rows);

  await client.end();
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
