/**
 * Test Fixtures: 4 Real-World Google Drive Operational Archetypes
 * Authoritative ground truth derived from Medical Trip Colombia operational data.
 */

export const ARCHETYPE_IDS = {
    RVA171: 'rva171',
    RVA282: 'rva282',
    RVA341: 'rva341',
    RVA077: 'rva077'
};

export const ARCHETYPE_EXPECTATIONS = {
    rva171: {
        code: 'RVA171-4',
        name: 'Catia Rodrigues (Grupo Familiar 5 Pax)',
        country: 'Curazao',
        paxCount: 5,
        language: 'Papiamento',
        hotel: 'Hotel Inntu Laureles',
        advanceCOP: 2098100,
        advanceCents: 209810000n,
        expectedEventCount: 5,
        primaryClinics: ['Clínica Clofán Ciudad del Río', 'CIMA Ayudas Diagnósticas (Cra 44)'],
        primaryTransport: 'Uber XL / Andrés'
    },
    rva282: {
        code: 'RVA282-5',
        name: 'George Hernandez (Chequeo Cardio & Uro)',
        country: 'Curazao',
        paxCount: 2,
        language: 'Papiamento',
        hotel: 'Airbnb Ed. Park 42 Poblado',
        advanceCOP: 1200000,
        advanceCents: 120000000n,
        expectedEventCount: 2,
        primaryClinics: ['Clínica CES Sede Oviedo Piso 6'],
        primaryTransport: 'Aeroturex Sedán'
    },
    rva341: {
        code: 'RVA341-1',
        name: 'Eduard Hogenboom (Bilingüe Inglés / CES)',
        country: 'Curazao',
        paxCount: 2,
        language: 'Inglés / Neerlandés',
        hotel: 'Hotel Inntu Laureles',
        advanceCOP: 950000,
        advanceCents: 95000000n,
        expectedEventCount: 2,
        primaryClinics: ['CES Sede Oviedo', 'Hotel Inntu Laureles Hab. 1004'],
        primaryTransport: 'Lab Domicilio'
    },
    rva077: {
        code: 'RVA077-2',
        name: 'Alejandra Rumai (Cirugía & Post-Op 12 Días)',
        country: 'Curazao',
        paxCount: 2,
        language: 'Papiamento',
        hotel: 'Novelty Suites El Poblado',
        advanceCOP: 3500000,
        advanceCents: 350000000n,
        expectedDurationDays: 12,
        primaryHotel: 'Novelty Suites El Poblado'
    }
};
