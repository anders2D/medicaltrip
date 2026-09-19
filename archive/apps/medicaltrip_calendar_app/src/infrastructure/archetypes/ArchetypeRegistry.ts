import { ArchetypeBundle, createRva171CatiaArchetype } from './rva171_catia_data';
import { createRva282GeorgeArchetype } from './rva282_george_data';
import { createRva341EduardArchetype } from './rva341_eduard_data';
import { createRva077RumaiArchetype } from './rva077_rumai_data';

export interface ArchetypeMetadata {
  id: string;
  code: string;
  name: string;
  description: string;
  country: string;
  language: string;
  paxCount: number;
  hotel: string;
  primaryClinics: string[];
  durationDays: number;
  advanceCOP: number;
  advanceCents: bigint;
  badgeColor: string;
}

export const ARCHETYPE_METADATA_MAP: Record<string, ArchetypeMetadata> = {
  rva171: {
    id: 'rva171',
    code: 'RVA171-4',
    name: 'Catia Rodrigues (Grupo Familiar 5 Pax)',
    description: 'Cirugía Oftalmológica Clofán, Ecografías CIMA, Urología Pediátrica y Flota Uber XL',
    country: 'Curazao',
    language: 'Papiamento',
    paxCount: 5,
    hotel: 'Hotel Inntu Laureles',
    primaryClinics: ['Clínica Clofán Ciudad del Río', 'CIMA Ayudas Diagnósticas (Cra 44)'],
    durationDays: 5,
    advanceCOP: 2098100,
    advanceCents: 209810000n,
    badgeColor: 'sky',
  },
  rva282: {
    id: 'rva282',
    code: 'RVA282-5',
    name: 'George Hernandez (Chequeo Cardio & Uro)',
    description: 'Chequeo Cardiovascular Cardio VID, Urología CES Oviedo, 32 días en Ed. Park 42',
    country: 'Curazao',
    language: 'Papiamento / Inglés',
    paxCount: 2,
    hotel: 'Airbnb Ed. Park 42 Poblado',
    primaryClinics: ['Clínica CES Sede Oviedo Piso 6', 'Clínica Cardio VID Robledo'],
    durationDays: 5,
    advanceCOP: 1200000,
    advanceCents: 120000000n,
    badgeColor: 'indigo',
  },
  rva341: {
    id: 'rva341',
    code: 'RVA341-1',
    name: 'Eduard Hogenboom (Bilingüe Inglés / CES)',
    description: 'Cirugía Urológica CES Oviedo y Toma de Muestras Domiciliaria en Hab. 1004 Hotel Inntu',
    country: 'Curazao',
    language: 'Inglés / Neerlandés',
    paxCount: 2,
    hotel: 'Hotel Inntu Laureles',
    primaryClinics: ['CES Sede Oviedo', 'Hotel Inntu Laureles Hab. 1004'],
    durationDays: 5,
    advanceCOP: 950000,
    advanceCents: 95000000n,
    badgeColor: 'teal',
  },
  rva077: {
    id: 'rva077',
    code: 'RVA077-2',
    name: 'Alejandra Rumai (Cirugía & Post-Op 12 Días)',
    description: 'Cirugía de 12 Días en HPTU, Hernán Ocazionez, Novelty Suites y Villa Anita',
    country: 'Curazao',
    language: 'Papiamento / Español',
    paxCount: 2,
    hotel: 'Novelty Suites El Poblado',
    primaryClinics: ['Hospital Pablo Tobón Uribe (HPTU)', 'Hernán Ocazionez', 'Clínica Bolivariana'],
    durationDays: 12,
    advanceCOP: 3500000,
    advanceCents: 350000000n,
    badgeColor: 'rose',
  },
};

export const ARCHETYPE_METADATA_LIST: ArchetypeMetadata[] = Object.values(ARCHETYPE_METADATA_MAP);

export function getArchetypeMetadata(idOrCode: string): ArchetypeMetadata | undefined {
  const normalized = idOrCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, meta] of Object.entries(ARCHETYPE_METADATA_MAP)) {
    if (
      key === normalized ||
      meta.id.toLowerCase() === normalized ||
      meta.code.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized
    ) {
      return meta;
    }
  }
  return undefined;
}

export function loadArchetypeBundle(idOrCode: string): ArchetypeBundle {
  const normalized = idOrCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('171')) {
    return createRva171CatiaArchetype();
  }
  if (normalized.includes('282')) {
    return createRva282GeorgeArchetype();
  }
  if (normalized.includes('341')) {
    return createRva341EduardArchetype();
  }
  if (normalized.includes('077') || normalized.includes('77')) {
    return createRva077RumaiArchetype();
  }
  // Default fallback to RVA171
  return createRva171CatiaArchetype();
}
