import { describe, it, expect } from 'vitest';
import {
  ARCHETYPE_METADATA_LIST,
  getArchetypeMetadata,
  loadArchetypeBundle,
} from '../../../src/infrastructure/archetypes/ArchetypeRegistry';

describe('ArchetypeRegistry & 4 Real-World Drive Archetypes', () => {
  it('registers all 4 canonical archetypes with complete metadata', () => {
    expect(ARCHETYPE_METADATA_LIST).toHaveLength(4);
    const codes = ARCHETYPE_METADATA_LIST.map((m) => m.code);
    expect(codes).toContain('RVA171-4');
    expect(codes).toContain('RVA282-5');
    expect(codes).toContain('RVA341-1');
    expect(codes).toContain('RVA077-2');
  });

  it('correctly fetches metadata by ID or code', () => {
    const meta171 = getArchetypeMetadata('rva171');
    expect(meta171).toBeDefined();
    expect(meta171?.paxCount).toBe(5);
    expect(meta171?.hotel).toBe('Hotel Inntu Laureles');
    expect(meta171?.advanceCents).toBe(209810000n);

    const meta282 = getArchetypeMetadata('RVA282-5');
    expect(meta282).toBeDefined();
    expect(meta282?.country).toBe('Curazao');

    const meta341 = getArchetypeMetadata('rva341');
    expect(meta341).toBeDefined();
    expect(meta341?.advanceCOP).toBe(950000);

    const meta077 = getArchetypeMetadata('rva077');
    expect(meta077).toBeDefined();
    expect(meta077?.durationDays).toBe(12);
  });

  it('hydrates RVA171 Catia bundle with full fidelity (5 Pax, Advances, Clofán, CIMA)', () => {
    const bundle = loadArchetypeBundle('rva171');
    expect(bundle.patient.fullName).toBe('Catia Rodrigues');
    expect(bundle.patient.companionNames).toHaveLength(4);
    expect(bundle.booking.paxCount).toBe(5);
    expect(bundle.booking.hotelName).toBe('Hotel Inntu Laureles');

    const balance = bundle.itinerary.calculateBalanceSheet();
    expect(balance.totalCashAdvances.amountInCents).toBe(209810000n); // $2.098.100 COP
    expect(bundle.itinerary.milestones.length).toBeGreaterThanOrEqual(5);

    const clofanMilestone = bundle.itinerary.milestones.find((m) =>
      m.location.rawName.includes('Clofán')
    );
    expect(clofanMilestone).toBeDefined();
    expect(clofanMilestone?.category).toBe('CLINICAL');
  });

  it('hydrates RVA282 George bundle with Cardio VID, Colasistencia, eSIM, and Aeroturex', () => {
    const bundle = loadArchetypeBundle('rva282');
    expect(bundle.patient.fullName).toBe('George Hernandez');
    expect(bundle.booking.hotelName).toBe('Airbnb Ed. Park 42 Poblado');

    const balance = bundle.itinerary.calculateBalanceSheet();
    expect(balance.totalCashAdvances.amountInCents).toBe(120000000n); // $1.200.000 COP

    const aeroMilestone = bundle.itinerary.milestones.find((m) =>
      m.providerName?.includes('Aeroturex')
    );
    expect(aeroMilestone).toBeDefined();
  });

  it('hydrates RVA341 Eduard bundle with 05:30 AM fasting home lab draw in Room 1004 Inntu', () => {
    const bundle = loadArchetypeBundle('rva341');
    expect(bundle.patient.fullName).toBe('Eduard Hogenboom');
    expect(bundle.patient.companionNames).toContain('Marcelle Cameron');

    const labMilestone = bundle.itinerary.milestones.find((m) =>
      m.location.rawName.includes('1004')
    );
    expect(labMilestone).toBeDefined();
    expect(labMilestone?.category).toBe('LAB');
    expect(labMilestone?.assignedNurseId).toBe('NURSE-01');
    expect(labMilestone?.cost.amountInCents).toBe(9735000n); // $97.350 COP
  });

  it('hydrates RVA077 Rumai bundle with 12-day journey, HPTU, and Hernán Ocazionez', () => {
    const bundle = loadArchetypeBundle('rva077');
    expect(bundle.patient.fullName).toBe('Alejandra Rumai');
    expect(bundle.booking.hotelName).toBe('Novelty Suites El Poblado');

    const balance = bundle.itinerary.calculateBalanceSheet();
    expect(balance.totalCashAdvances.amountInCents).toBe(350000000n); // $3.500.000 COP

    const ocazionezMilestone = bundle.itinerary.milestones.find((m) =>
      m.providerName?.includes('Hernán Ocazionez')
    );
    expect(ocazionezMilestone).toBeDefined();
    expect(ocazionezMilestone?.cost.amountInCents).toBe(17075500n); // $170.755 COP
  });
});
