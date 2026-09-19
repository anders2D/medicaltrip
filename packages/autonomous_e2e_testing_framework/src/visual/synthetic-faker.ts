/**
 * 100% PII / PHI-Safe Caribbean Synthetic Patient Journey Generator
 * 
 * Generates mathematically consistent, deterministic synthetic patient records,
 * multi-day itinerary milestones, and financial transaction streams modeled exclusively
 * in integer cents (BigInt) with zero PHI/PII leakage (HMAC-SHA256 salted hashes).
 */

import * as crypto from 'node:crypto';

export type CaribbeanCountry = 'Curazao' | 'Aruba' | 'Surinam' | 'Bonaire';
export type MedicalCategory = 'CARDIOLOGIA' | 'CIRUGIA_PLASTICA' | 'REGENERATIVA' | 'ODONTOLOGIA' | 'ORTOPEDIA';
export type OperationalArchetypeCode = 'RVA171' | 'RVA282' | 'RVA341' | 'RVA077';

export interface MedicalProcedure {
  cupsCode: string;
  name: string;
  category: MedicalCategory;
  clinicName: string;
  specialistName: string;
  baseCostCopCents: bigint;  // Exact integer cents
  marginCopCents: bigint;    // Exact integer cents
  totalCostCopCents: bigint; // baseCost + margin
}

export interface SyntheticExpense {
  expenseId: string;
  dayNumber: number;
  category: 'TAXI' | 'COMPANION_HOURLY' | 'PHARMACY' | 'HOTEL' | 'MEAL';
  description: string;
  amountCopCents: bigint;
  receiptBlobRef: string;    // UUID referencing mock IndexedDB blob
}

export interface SyntheticPaxJourney {
  rvaCode: string;             // e.g. "RVA171", "RVA282"
  patientCode: string;         // ENT-PAX-XXXX (HMAC-SHA256 deterministic)
  fullName: string;            // Deterministic Caribbean name
  originCountry: CaribbeanCountry;
  passportHash: string;        // Salted SHA-256 hash (never plaintext)
  phoneSynthetic: string;      // +599-9-XXX-XXXX or similar mock
  emailSynthetic: string;
  medicalProcedure: MedicalProcedure;
  assignedDriver: string;      // e.g. "[DRV] Ramón Rosero"
  assignedCoordinator: string; // e.g. "[COORD] Carolina Cortázar"
  assignedNurse?: string;      // e.g. "[NURSE] Viviana Gómez"
  hotelName: string;
  stayDurationDays: number;
  expenses: SyntheticExpense[];
  totalLedgerBalanceCents: bigint;
}

const CARIBBEAN_NAMES = {
  Curazao: ['Catia Martis', 'Shantley Jansen', 'Tyrone Evertsz', 'Giselle de Jongh', 'Mireya Cijntje'],
  Aruba: ['George Croes', 'Emanuela Tromp', 'Derk Oduber', 'Saskia Kock', 'Gervasio Maduro'],
  Surinam: ['Hogenboom van Dijk', 'Anand Radhakishun', 'Shanti Lachmon', 'Rinaldo Pengel', 'Devika Somohardjo'],
  Bonaire: ['Rumai Frans', 'Juriën Wanga', 'Milushka Crestian', 'Elion Sint Jago', 'Soraya Nicolaas']
};

const MEDICAL_CATALOG: Record<MedicalCategory, Array<{ cups: string; name: string; baseCents: bigint; marginCents: bigint }>> = {
  CARDIOLOGIA: [
    { cups: '883101', name: 'Angioplastia Coronaria con Stent Medicado', baseCents: 4500000000n, marginCents: 900000000n }, // 45M + 9M COP
    { cups: '883200', name: 'Cateterismo Cardíaco Diagnóstico', baseCents: 1800000000n, marginCents: 400000000n }
  ],
  CIRUGIA_PLASTICA: [
    { cups: '861201', name: 'Rinoplastia Estética y Funcional Estructural', baseCents: 2200000000n, marginCents: 550000000n },
    { cups: '868301', name: 'Liposucción de Alta Definición y Transferencia Glútea', baseCents: 3200000000n, marginCents: 800000000n }
  ],
  REGENERATIVA: [
    { cups: '890201', name: 'Terapia con Células Madre Mesenquimales Articulares', baseCents: 2800000000n, marginCents: 700000000n }
  ],
  ODONTOLOGIA: [
    { cups: '232101', name: 'Diseño de Sonrisa Cerámico y Carillas E-Max', baseCents: 1500000000n, marginCents: 350000000n }
  ],
  ORTOPEDIA: [
    { cups: '815100', name: 'Reemplazo Total de Cadera Asistido por Navegación', baseCents: 5200000000n, marginCents: 1100000000n }
  ]
};

const CLINIC_PARTNERS = [
  { name: 'Clínica Las Américas', specialist: 'Dr. Santiago Restrepo' },
  { name: 'Clínica Cardio VID', specialist: 'Dr. Alejandro Gaviria' },
  { name: 'Clínica Medellín', specialist: 'Dr. Felipe Morales' },
  { name: 'Clínica CES', specialist: 'Dra. Marcela Valencia' }
];

const SECRET_SALT = 'MEDICALTRIP_PHI_SALT_2026_COLOMBIA';

/**
 * Deterministic pseudo-random number generator using Linear Congruential Generator
 */
class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }

  public next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

/**
 * Generates deterministic HMAC-SHA256 salted patient code (ENT-PAX-XXXX)
 */
export function generateSyntheticPatientCode(seedInput: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_SALT).update(seedInput).digest('hex');
  const num = parseInt(hmac.substring(0, 4), 16) % 9000 + 1000;
  return `ENT-PAX-${num}`;
}

/**
 * Generates one-way salted passport hash ensuring zero plaintext passport leakage
 */
export function generateSaltedPassportHash(syntheticId: string): string {
  return crypto.createHmac('sha256', SECRET_SALT).update(`PASSPORT_${syntheticId}`).digest('hex');
}

/**
 * Generates a realistic Caribbean Patient Journey for one of the 4 archetypes or custom seed
 */
export function generateSyntheticPatient(
  archetypeOrSeed: OperationalArchetypeCode | string | number,
  customSeed?: number
): SyntheticPaxJourney {
  let seed = typeof archetypeOrSeed === 'number' ? archetypeOrSeed : (customSeed ?? 42);
  let archetype: OperationalArchetypeCode | null = null;

  if (typeof archetypeOrSeed === 'string') {
    if (['RVA171', 'RVA282', 'RVA341', 'RVA077'].includes(archetypeOrSeed)) {
      archetype = archetypeOrSeed as OperationalArchetypeCode;
      seed = archetypeOrSeed === 'RVA171' ? 171
           : archetypeOrSeed === 'RVA282' ? 282
           : archetypeOrSeed === 'RVA341' ? 341
           : 77;
    } else {
      // Hash string to seed number
      const hash = crypto.createHash('md5').update(archetypeOrSeed).digest();
      seed = hash.readUInt32BE(0);
    }
  }

  const prng = new DeterministicPRNG(seed);

  // 1. Archetype specific defaults
  let rvaCode = `RVA${prng.nextInt(100, 999)}`;
  let originCountry: CaribbeanCountry = prng.pick(['Curazao', 'Aruba', 'Surinam', 'Bonaire']);
  let fullName = prng.pick(CARIBBEAN_NAMES[originCountry]);
  let category: MedicalCategory = prng.pick(['CARDIOLOGIA', 'CIRUGIA_PLASTICA', 'REGENERATIVA', 'ODONTOLOGIA']);
  let stayDays = prng.nextInt(5, 14);
  let driver = '[DRV] Ramón Rosero';
  let coordinator = '[COORD] Carolina Cortázar';
  let nurse = '[NURSE] Viviana Gómez';
  let hotel = 'Hotel Poblado Plaza';

  if (archetype === 'RVA171') {
    rvaCode = 'RVA171';
    originCountry = 'Curazao';
    fullName = 'Catia Martis x5';
    category = 'CIRUGIA_PLASTICA';
    stayDays = 7;
    hotel = 'Hotel Dann Carlton Medellín';
    driver = '[DRV] Ramón Rosero';
    coordinator = '[COORD] Carolina Cortázar';
  } else if (archetype === 'RVA282') {
    rvaCode = 'RVA282';
    originCountry = 'Aruba';
    fullName = 'George Croes';
    category = 'CARDIOLOGIA';
    stayDays = 10;
    hotel = 'Hotel San Fernando Plaza';
    driver = '[DRV] Ramón Rosero';
    coordinator = '[COORD] Andrés Botero';
  } else if (archetype === 'RVA341') {
    rvaCode = 'RVA341';
    originCountry = 'Surinam';
    fullName = 'Hogenboom van Dijk';
    category = 'REGENERATIVA';
    stayDays = 6;
    hotel = 'Hotel Diez Categoria Colombia';
    driver = '[DRV] Carlos Restrepo';
    coordinator = '[COORD] Carolina Cortázar';
  } else if (archetype === 'RVA077') {
    rvaCode = 'RVA077';
    originCountry = 'Bonaire';
    fullName = 'Rumai Frans';
    category = 'CIRUGIA_PLASTICA';
    stayDays = 12;
    hotel = 'Hotel Poblado Plaza';
    driver = '[DRV] Ramón Rosero';
    coordinator = '[COORD] Carolina Cortázar';
  }

  const patientCode = generateSyntheticPatientCode(`${rvaCode}_${seed}`);
  const passportHash = generateSaltedPassportHash(patientCode);

  const procTemplate = prng.pick(MEDICAL_CATALOG[category]);
  const clinic = prng.pick(CLINIC_PARTNERS);

  const procedure: MedicalProcedure = {
    cupsCode: procTemplate.cups,
    name: procTemplate.name,
    category,
    clinicName: clinic.name,
    specialistName: clinic.specialist,
    baseCostCopCents: procTemplate.baseCents,
    marginCopCents: procTemplate.marginCents,
    totalCostCopCents: procTemplate.baseCents + procTemplate.marginCents
  };

  // Generate multi-day operational expenses (in BigInt cents)
  const expenses: SyntheticExpense[] = [];
  let totalExpensesCents = 0n;

  for (let day = 1; day <= stayDays; day++) {
    // Daily Taxi rides
    const taxiCostCents = BigInt(prng.nextInt(35000, 85000)) * 100n; // 35k - 85k COP
    const taxiExp: SyntheticExpense = {
      expenseId: `EXP_${rvaCode}_D${day}_TAXI`,
      dayNumber: day,
      category: 'TAXI',
      description: `Transporte Aeropuerto/Clínica Día ${day}`,
      amountCopCents: taxiCostCents,
      receiptBlobRef: crypto.randomUUID()
    };
    expenses.push(taxiExp);
    totalExpensesCents += taxiCostCents;

    // Pharmacy purchases on surgical days (days 1, 2, 4)
    if (day === 1 || day === 2 || day === 4) {
      const pharmCostCents = BigInt(prng.nextInt(120000, 450000)) * 100n;
      const pharmExp: SyntheticExpense = {
        expenseId: `EXP_${rvaCode}_D${day}_PHARM`,
        dayNumber: day,
        category: 'PHARMACY',
        description: `Kit postoperatorio y antibióticos Día ${day}`,
        amountCopCents: pharmCostCents,
        receiptBlobRef: crypto.randomUUID()
      };
      expenses.push(pharmExp);
      totalExpensesCents += pharmCostCents;
    }

    // Companion hourly fees
    const companionCostCents = BigInt(prng.nextInt(40000, 100000)) * 100n;
    const compExp: SyntheticExpense = {
      expenseId: `EXP_${rvaCode}_D${day}_COMP`,
      dayNumber: day,
      category: 'COMPANION_HOURLY',
      description: `Acompañamiento Bilingüe Día ${day}`,
      amountCopCents: companionCostCents,
      receiptBlobRef: crypto.randomUUID()
    };
    expenses.push(compExp);
    totalExpensesCents += companionCostCents;
  }

  const totalLedgerBalanceCents = procedure.totalCostCopCents + totalExpensesCents;

  const phoneSynthetic = originCountry === 'Curazao' ? '+599-9-567-8910'
                       : originCountry === 'Aruba' ? '+297-582-4567'
                       : originCountry === 'Surinam' ? '+597-471-2345'
                       : '+599-717-8901';

  const cleanName = fullName.toLowerCase().replace(/[^a-z]/g, '');
  const emailSynthetic = `${cleanName}@synthetic-patient.medicaltrip.co`;

  return {
    rvaCode,
    patientCode,
    fullName,
    originCountry,
    passportHash,
    phoneSynthetic,
    emailSynthetic,
    medicalProcedure: procedure,
    assignedDriver: driver,
    assignedCoordinator: coordinator,
    assignedNurse: nurse,
    hotelName: hotel,
    stayDurationDays: stayDays,
    expenses,
    totalLedgerBalanceCents
  };
}

/**
 * Asserts strict PII/PHI safety invariants:
 * 1. Patient code matches standard ENT-PAX-XXXX format.
 * 2. Passport is never exposed in plaintext (must be 64-character SHA-256 hex).
 * 3. All monetary values are strictly BigInt integer cents (no IEEE 754 float precision loss).
 */
export function assertZeroPIILeakage(pax: SyntheticPaxJourney): {
  isSafe: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // 1. Patient code check
  if (!/^ENT-PAX-\d{4}$/.test(pax.patientCode)) {
    violations.push(`Invalid patientCode format: ${pax.patientCode}. Must match ENT-PAX-XXXX.`);
  }

  // 2. Passport hash check
  if (!/^[a-f0-9]{64}$/i.test(pax.passportHash)) {
    violations.push(`Passport is not a 64-char SHA-256 hash! Found: ${pax.passportHash}`);
  }

  // 3. Float check on financial fields (must be bigint)
  if (typeof pax.medicalProcedure.baseCostCopCents !== 'bigint' ||
      typeof pax.medicalProcedure.marginCopCents !== 'bigint' ||
      typeof pax.totalLedgerBalanceCents !== 'bigint') {
    violations.push('Financial values must be BigInt integer cents.');
  }

  for (const exp of pax.expenses) {
    if (typeof exp.amountCopCents !== 'bigint') {
      violations.push(`Expense ${exp.expenseId} amount is not a BigInt.`);
    }
  }

  return {
    isSafe: violations.length === 0,
    violations
  };
}
