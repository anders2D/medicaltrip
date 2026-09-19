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

  try {
    const res1 = await client.query(`SELECT * FROM vault.decrypted_secrets;`);
    console.log("Vault secrets:", res1.rows);
  } catch (e) {
    console.log("No vault.decrypted_secrets:", e.message);
  }

  try {
    const res2 = await client.query(`SHOW "custom.jwt_secret";`);
    console.log("custom.jwt_secret:", res2.rows);
  } catch (e) {
    console.log("No custom.jwt_secret:", e.message);
  }

  try {
    const res3 = await client.query(`SELECT current_setting('app.settings.jwt_secret', true) as jwt_secret;`);
    console.log("app.settings.jwt_secret:", res3.rows);
  } catch (e) {
    console.log("No app.settings.jwt_secret:", e.message);
  }

  await client.end();
}

run().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
