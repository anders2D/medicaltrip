const { Client } = require("pg");

const client = new Client({
  host: "aws-0-us-west-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.pxmobokcqhsixfvdsrwj",
  password: "4!vG#uqcVd-M.7G",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function cleanDataKeepUsers() {
  await client.connect();
  console.log("Conectado a PostgreSQL de Supabase...");

  // 1. Asegurar tabla de usuarios
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      role_label TEXT NOT NULL,
      email TEXT,
      password_hash TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
  `);

  // 2. Preservar / actualizar usuarios de inicio de sesión
  await client.query(`
    INSERT INTO public.users (id, username, name, role, role_label, email)
    VALUES
      ('usr-admin-001', 'admin', 'Carolina Cortázar', 'ADMIN', 'Administrador', 'carolina.cortazar@medicaltrip.co'),
      ('usr-guide-001', 'acompanante', 'Yenny Roberto', 'COMPANION', 'Acompañante Físico', 'yenny.roberto@medicaltrip.co'),
      ('usr-guide-002', 'guia', 'Yenny Roberto', 'COMPANION', 'Acompañante Físico', 'yenny.roberto@medicaltrip.co'),
      ('usr-pax-171', 'paciente_catia', 'Catia Rodrigues', 'PATIENT', 'Paciente Internacional', 'catia.rodrigues@patient.medicaltrip.co'),
      ('usr-pax-282', 'paciente_george', 'George Hernandez', 'PATIENT', 'Paciente Internacional', 'george.hernandez@patient.medicaltrip.co'),
      ('usr-pax-341', 'paciente_eduard', 'Eduard Hogenboom', 'PATIENT', 'Paciente Internacional', 'eduard.hogenboom@patient.medicaltrip.co'),
      ('usr-pax-077', 'paciente_alejandra', 'Alejandra Rumai', 'PATIENT', 'Paciente Internacional', 'alejandra.rumai@patient.medicaltrip.co')
    ON CONFLICT (username) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      role_label = EXCLUDED.role_label,
      email = EXCLUDED.email;
  `);

  // 3. Truncar tablas operacionales
  const tables = [
    'bookings',
    'events',
    'shifts',
    'transfers',
    'expenses',
    'settlements',
    'event_stream',
    'blobs',
    'patient_invitations'
  ];

  for (const table of tables) {
    await client.query(`TRUNCATE TABLE public.${table} CASCADE;`);
    console.log(`✓ Tabla limpiada: public.${table}`);
  }

  // 4. Limpiar objetos binarios de Storage si existieran
  try {
    await client.query(`DELETE FROM storage.objects;`);
    console.log(`✓ Storage buckets limpiados`);
  } catch (e) {
    // Ignorar si no aplica
  }

  // 5. Verificación final de conteos
  console.log("\n--- CONTEO FINAL EN BASE DE DATOS SUPABASE ---");
  for (const table of [...tables, 'users']) {
    const res = await client.query(`SELECT count(*) FROM public.${table}`);
    console.log(`• public.${table}: ${res.rows[0].count} filas`);
  }

  await client.end();
}

cleanDataKeepUsers().catch(err => {
  console.error("Error al limpiar datos:", err);
  process.exit(1);
});
