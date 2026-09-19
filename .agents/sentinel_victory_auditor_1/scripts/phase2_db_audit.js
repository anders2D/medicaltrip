const { execSync } = require('child_process');
const path = require('path');

const dbPath = path.resolve('data/medicaltrip_master.db');

function query(sql) {
  return execSync(`sqlite3 "${dbPath}" "${sql}"`, { encoding: 'utf-8' }).trim();
}

console.log('=== FORENSIC DATABASE INTEGRITY AUDIT ===');
console.log('Database Path:', dbPath);

// Integrity checks
const integrity = query('PRAGMA integrity_check;');
console.log('PRAGMA integrity_check:', integrity);

const fkCheck = query('PRAGMA foreign_keys = ON; PRAGMA foreign_key_check;');
console.log('PRAGMA foreign_key_check:', fkCheck === '' ? '0 violations (CLEAN)' : fkCheck);

// Table schemas and row counts
const tables = ['pacientes', 'cotizaciones_ctz', 'reservas_rva', 'traslados_logistica', 'empleados', 'proveedores', 'plantillas_comunicacion', 'ocel_events', 'ocel_event_objects'];

console.log('\n--- Table Counts & Schema Verification ---');
tables.forEach(tbl => {
  const count = query(`SELECT count(*) FROM ${tbl};`);
  console.log(`Table ${tbl.padEnd(25)}: ${count.padStart(6)} rows`);
});

console.log('\n--- Empleados Table Dump ---');
const empDump = query('SELECT id, uuid, nombre, rol, telefono, identificador_chat FROM empleados;');
console.log(empDump);

console.log('\n--- Proveedores Table Dump ---');
const provDump = query('SELECT id, uuid, tipo, nombre, contacto_telefono, ciudad FROM proveedores;');
console.log(provDump);

console.log('\n--- Foreign Key Orphan Checks ---');
const orphanRva = query('SELECT count(*) FROM reservas_rva WHERE paciente_uuid NOT IN (SELECT uuid FROM pacientes);');
console.log('Orphan reservas_rva -> pacientes:', orphanRva);

const orphanCtz = query('SELECT count(*) FROM cotizaciones_ctz WHERE paciente_uuid NOT IN (SELECT uuid FROM pacientes);');
console.log('Orphan cotizaciones_ctz -> pacientes:', orphanCtz);

const orphanOcelObj = query('SELECT count(*) FROM ocel_event_objects WHERE event_id NOT IN (SELECT event_id FROM ocel_events);');
console.log('Orphan ocel_event_objects -> ocel_events:', orphanOcelObj);

console.log('\n--- PHI Protection Verification (ENT-PAX-XXXX) ---');
const nonPaxCount = query("SELECT count(*) FROM pacientes WHERE uuid NOT LIKE 'ENT-PAX-%';");
console.log('Pacientes with non ENT-PAX-XXXX uuid:', nonPaxCount);

const samplePax = query('SELECT uuid, nombre_completo, pais_origen, idioma_principal, primer_contacto FROM pacientes LIMIT 5;');
console.log('Sample Pacientes:\n', samplePax);

console.log('\n--- Bot / Placeholder Scan in DB ---');
const botEmp = query("SELECT count(*) FROM empleados WHERE lower(nombre) LIKE '%bot%' OR lower(rol) LIKE '%bot%';");
const botProv = query("SELECT count(*) FROM proveedores WHERE lower(nombre) LIKE '%bot%' OR lower(tipo) LIKE '%bot%';");
const botPac = query("SELECT count(*) FROM pacientes WHERE lower(uuid) LIKE '%bot%';");
console.log(`Bot references found: empleados=${botEmp}, proveedores=${botProv}, pacientes=${botPac}`);
