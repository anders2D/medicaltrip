import test from 'node:test';
import assert from 'node:assert/strict';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { Money } from '../../../src/domain/Money.js';
import { setupMockBrowserEnv } from '../../fixtures/mockBrowserEnv.js';
import { ARCHETYPE_EXPECTATIONS } from '../../fixtures/archetypeFixtures.js';

test('Tier 4: Real-World Application Scenarios — 4 Drive Archetypes Full Journey Simulation', async (t) => {
    let teardown;
    t.beforeEach(() => {
        teardown = setupMockBrowserEnv();
    });
    t.afterEach(() => {
        if (teardown) teardown();
    });

    const allPatients = DriveDatasetAdapter.getPatients();
    const allEvents = DriveDatasetAdapter.getInitialEvents();

    // =========================================================================
    // SCENARIO 1: RVA171 Catia Rodrigues (5 Pax Curacao, Multi-Day Itinerary)
    // =========================================================================
    await t.test('1. [RVA171 Catia x5] Full Journey: Ingestion ➔ Scheduling ➔ Uber XL ➔ Clofán ➔ CIMA ➔ Pharmacy ➔ Settlement ➔ Sign-off', async () => {
        const catia = allPatients.find(p => p.id === 'rva171');
        assert.ok(catia);
        assert.equal(catia.paxCount, 5);
        assert.equal(catia.language, 'Papiamento');
        assert.equal(catia.hotel, 'Hotel Inntu Laureles');

        const catiaEvents = allEvents.filter(e => e.patientId === 'rva171');
        assert.equal(catiaEvents.length, 5);

        // 1. Flight arrival & Uber XL Transfer
        const flightEvt = catiaEvents.find(e => e.id === 'evt-171-1');
        assert.ok(flightEvt);
        assert.equal(flightEvt.cost.units, 160000);
        assert.equal(flightEvt.provider, 'Uber XL / Andrés');
        assert.equal(flightEvt.status, EVENT_STATUS.COMPLETED);

        // 2. Clofán Ophthalmology consultation with Yenny (2.5h)
        const clofanEvt = catiaEvents.find(e => e.id === 'evt-171-2');
        assert.ok(clofanEvt);
        assert.equal(clofanEvt.hours, 2.5);
        assert.equal(clofanEvt.cost.units, 38750);
        assert.equal(clofanEvt.assignedRole, '[GUIA] Yenny');

        // 3. Clofán parking petty cash
        const parkingEvt = catiaEvents.find(e => e.id === 'evt-171-3');
        assert.ok(parkingEvt);
        assert.equal(parkingEvt.cost.units, 12000);

        // 4. CIMA Ayudas Diagnósticas fasting ultrasound (8.0h)
        const cimaEvt = catiaEvents.find(e => e.id === 'evt-171-4');
        assert.ok(cimaEvt);
        assert.equal(cimaEvt.hours, 8.0);
        assert.equal(cimaEvt.cost.units, 124000);
        assert.ok(cimaEvt.notes.includes('Ayuno estricto 8 horas'));

        // 5. Cruz Verde post-op prescriptions
        const pharmacyEvt = catiaEvents.find(e => e.id === 'evt-171-5');
        assert.ok(pharmacyEvt);
        assert.equal(pharmacyEvt.cost.units, 85000);

        // 6. Ingest extra pharmacy ticket from OCR uploader ($65.000)
        const extraTickets = [
            { id: 'tkt-cruz-verde-extra', patientId: 'rva171', amountUnits: 65000 }
        ];

        // 7. Calculate ledger settlement
        const ledger = new SettlementLedger('rva171', catia.advanceTotal);
        const settlement = ledger.calculateFromEvents(catiaEvents, extraTickets);

        assert.equal(settlement.transportTotal.units, 160000);
        assert.equal(settlement.guideHoursTotal, 10.5); // 2.5 + 8.0
        assert.equal(settlement.guideHonoraryTotal.units, 162750); // 38,750 + 124,000
        assert.equal(settlement.outOfPocketTotal.units, 162000); // 12,000 + 85,000 + 65,000
        assert.equal(settlement.totalCuentaCobro.units, 484750);
        assert.equal(settlement.advanceTotal.units, 2098100);
        assert.equal(settlement.netBalance.units, -1613350); // 484,750 - 2,098,100
        assert.equal(settlement.isAgentPayable, false);

        // 8. Patient sign-off
        const signOff = {
            patientId: 'rva171',
            signature: 'data:image/png;base64,mockSignatureCatia',
            finalBalanceCOP: settlement.netBalance.units,
            timestamp: new Date().toISOString()
        };
        assert.equal(signOff.finalBalanceCOP, -1613350);
    });

    // =========================================================================
    // SCENARIO 2: RVA282 George Hernandez (Cardio/Uro, Park 42, Aeroturex)
    // =========================================================================
    await t.test('2. [RVA282 George Cardio] Full Journey: Aeroturex JMC + SIM Claro ➔ CES Oviedo Cardiology ➔ Settlement', async () => {
        const george = allPatients.find(p => p.id === 'rva282');
        assert.ok(george);
        assert.equal(george.code, 'RVA282-5');
        assert.equal(george.hotel, 'Airbnb Ed. Park 42 Poblado');
        assert.equal(george.advanceTotal.units, 1200000);

        const georgeEvents = allEvents.filter(e => e.patientId === 'rva282');
        assert.equal(georgeEvents.length, 2);

        // 1. Aeroturex Sedan arrival with Ramón Rosero
        const aeroturex = georgeEvents.find(e => e.id === 'evt-282-1');
        assert.ok(aeroturex);
        assert.equal(aeroturex.cost.units, 145000);
        assert.equal(aeroturex.assignedRole, '[DRV] Ramón Rosero');

        // 2. CES Oviedo Cardiology Dr. Marcos Yepes (3.0h)
        const cardio = georgeEvents.find(e => e.id === 'evt-282-2');
        assert.ok(cardio);
        assert.equal(cardio.hours, 3.0);
        assert.equal(cardio.cost.units, 46500);

        // 3. Extra pharmacy ticket (Anticoagulant $32.000)
        const tickets = [{ id: 'tkt-cardio-1', patientId: 'rva282', amountUnits: 32000 }];

        const ledger = new SettlementLedger('rva282', george.advanceTotal);
        const settlement = ledger.calculateFromEvents(georgeEvents, tickets);

        assert.equal(settlement.transportTotal.units, 145000);
        assert.equal(settlement.guideHoursTotal, 3.0);
        assert.equal(settlement.guideHonoraryTotal.units, 46500);
        assert.equal(settlement.outOfPocketTotal.units, 32000);
        assert.equal(settlement.totalCuentaCobro.units, 223500);
        assert.equal(settlement.advanceTotal.units, 1200000);
        assert.equal(settlement.netBalance.units, -976500); // 223,500 - 1,200,000
    });

    // =========================================================================
    // SCENARIO 3: RVA341 Eduard Hogenboom (At-Home Fasting Lab + CES Urology)
    // =========================================================================
    await t.test('3. [RVA341 Eduard CES] Full Journey: 05:30 AM Room 1004 Lab Draw ➔ CES Oviedo Urology ➔ Settlement', async () => {
        const eduard = allPatients.find(p => p.id === 'rva341');
        assert.ok(eduard);
        assert.equal(eduard.code, 'RVA341-1');
        assert.equal(eduard.companionName, 'Marcelle Cameron');
        assert.equal(eduard.language, 'Inglés / Neerlandés');

        const eduardEvents = allEvents.filter(e => e.patientId === 'rva341');
        assert.equal(eduardEvents.length, 2);

        // 1. At-home fasting lab draw at Hotel Inntu Room 1004 (Echavarría)
        const labDraw = eduardEvents.find(e => e.id === 'evt-341-1');
        assert.ok(labDraw);
        assert.equal(labDraw.location, 'Hotel Inntu Laureles Hab. 1004');
        assert.equal(labDraw.cost.units, 65000);
        assert.equal(labDraw.provider, 'Laboratorio Echavarría');

        // 2. CES Oviedo Urology consultation (2.5h) with Alejandro
        const uro = eduardEvents.find(e => e.id === 'evt-341-2');
        assert.ok(uro);
        assert.equal(uro.hours, 2.5);
        assert.equal(uro.cost.units, 38750);
        assert.equal(uro.assignedRole, '[GUIA] Alejandro');

        const ledger = new SettlementLedger('rva341', eduard.advanceTotal);
        const settlement = ledger.calculateFromEvents(eduardEvents, []);

        assert.equal(settlement.outOfPocketTotal.units, 65000);
        assert.equal(settlement.guideHonoraryTotal.units, 38750);
        assert.equal(settlement.totalCuentaCobro.units, 103750);
        assert.equal(settlement.advanceTotal.units, 950000);
        assert.equal(settlement.netBalance.units, -846250); // 103,750 - 950,000
    });

    // =========================================================================
    // SCENARIO 4: RVA077 Alejandra Rumai (12-Day Surgical Journey & Multi-Stage Settlement)
    // =========================================================================
    await t.test('4. [RVA077 Rumai 12d] Full Journey: Novelty Suites ➔ Multi-stage Transfers & Post-op Recovery', async () => {
        const rumai = allPatients.find(p => p.id === 'rva077');
        assert.ok(rumai);
        assert.equal(rumai.code, 'RVA077-2');
        assert.equal(rumai.hotel, 'Novelty Suites El Poblado');
        assert.equal(rumai.advanceTotal.units, 3500000);

        // Construct 12-day multi-stage operational itinerary
        const rumaiItinerary = [
            new ItineraryEvent({
                id: 'evt-077-1',
                patientId: 'rva077',
                title: 'Llegada JMC + Traslado Novelty Suites',
                startDateTime: '2026-08-18T14:00:00Z',
                location: 'Aeropuerto JMC ➔ Novelty Suites',
                costType: 'TRANSPORTE',
                costUnits: 145000
            }),
            new ItineraryEvent({
                id: 'evt-077-2',
                patientId: 'rva077',
                title: 'Exámenes Pre-Quirúrgicos & Anestesia',
                startDateTime: '2026-08-19T07:00:00Z',
                location: 'Clínica Clofán',
                costType: 'HONORARIO_GUIA',
                hours: 4.0,
                costUnits: 62000
            }),
            new ItineraryEvent({
                id: 'evt-077-3',
                patientId: 'rva077',
                title: 'Cirugía Mayor & Sala de Recuperación',
                startDateTime: '2026-08-20T06:00:00Z',
                location: 'Clínica Clofán Quirófano 4',
                costType: 'HONORARIO_GUIA',
                hours: 10.0,
                costUnits: 155000
            }),
            new ItineraryEvent({
                id: 'evt-077-4',
                patientId: 'rva077',
                title: 'Drenaje Linfático Post-Op Día 1 a 5 (Domicilio)',
                startDateTime: '2026-08-22T09:00:00Z',
                location: 'Novelty Suites El Poblado',
                costType: 'HONORARIO_GUIA',
                hours: 5.0,
                costUnits: 77500
            }),
            new ItineraryEvent({
                id: 'evt-077-5',
                patientId: 'rva077',
                title: 'Fajas Post-Quirúrgicas & Medicación Fórmulas',
                startDateTime: '2026-08-22T14:00:00Z',
                location: 'Droguería Cruz Verde Poblado',
                costType: 'FARMACIA',
                costUnits: 380000
            }),
            new ItineraryEvent({
                id: 'evt-077-6',
                patientId: 'rva077',
                title: 'Traslado Retorno Salida JMC Curazao',
                startDateTime: '2026-08-30T10:00:00Z',
                location: 'Novelty Suites ➔ Aeropuerto JMC',
                costType: 'TRANSPORTE',
                costUnits: 145000
            })
        ];

        const ledger = new SettlementLedger('rva077', rumai.advanceTotal);
        const settlement = ledger.calculateFromEvents(rumaiItinerary, [{ amountUnits: 120000 }]); // Extra viáticos

        assert.equal(settlement.transportTotal.units, 290000); // 145k + 145k
        assert.equal(settlement.guideHoursTotal, 19.0); // 4 + 10 + 5
        assert.equal(settlement.guideHonoraryTotal.units, 294500); // 62k + 155k + 77.5k
        assert.equal(settlement.outOfPocketTotal.units, 500000); // 380k + 120k
        assert.equal(settlement.totalCuentaCobro.units, 1084500);
        assert.equal(settlement.advanceTotal.units, 3500000);
        assert.equal(settlement.netBalance.units, -2415500); // 1,084,500 - 3,500,000
        assert.equal(settlement.isAgentPayable, false);
    });
});
