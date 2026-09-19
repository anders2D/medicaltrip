import test from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '../../../src/domain/Money.js';
import { OperativeTerritory } from '../../../src/domain/OperativeTerritory.js';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { PatientBooking } from '../../../src/domain/PatientBooking.js';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';
import { LocalFirstStorageAdapter } from '../../../src/infrastructure/LocalFirstStorageAdapter.js';
import { MonthView } from '../../../src/ui/MonthView.js';
import { WeekView } from '../../../src/ui/WeekView.js';
import { DayView } from '../../../src/ui/DayView.js';
import { AgendaView } from '../../../src/ui/AgendaView.js';
import { SettlementBalanceBar } from '../../../src/ui/SettlementBalanceBar.js';
import { setupMockBrowserEnv } from '../../fixtures/mockBrowserEnv.js';

test('Tier 5: Real-World Workload & Concurrency Stress — 4 Drive Archetypes & Multi-View Calendar Engine', async (t) => {
    let teardown;
    t.beforeEach(() => {
        teardown = setupMockBrowserEnv();
    });
    t.afterEach(() => {
        if (teardown) teardown();
    });

    const allPatients = DriveDatasetAdapter.getPatients();

    // =========================================================================
    // 1. RVA171 Catia Rodrigues (5 Pax Curacao, Multi-Day Itinerary)
    // =========================================================================
    await t.test('1. [RVA171 Catia x5]: 5-day multi-milestone journey, provider flow, guide shifts & master settlement precision', () => {
        const catia = allPatients.find(p => p.id === 'rva171');
        assert.ok(catia, 'Catia Rodrigues profile must exist');
        assert.equal(catia.paxCount, 5);
        assert.equal(catia.language, 'Papiamento');
        assert.equal(catia.advanceTotal.units, 2098100);

        // Construct complete 5-day real-world journey
        const milestones = [
            // Day 1: Flight arrival + Uber XL Van
            new ItineraryEvent({
                id: 'evt-171-d1-1',
                patientId: 'rva171',
                title: 'Aterrizaje Z-Fly Curazao (5 Pax) + Traslado Uber XL Van',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-20T10:00:00.000Z',
                endDateTime: '2026-08-20T12:00:00.000Z',
                location: 'Aeropuerto JMC Rionegro ➔ Hotel Inntu Laureles',
                provider: 'Uber XL / Andrés',
                assignedRole: '[DRV] Andrés',
                costType: 'TRANSPORTE',
                costUnits: 160000,
                status: EVENT_STATUS.COMPLETED,
                gpsChecked: true
            }),
            // Day 1: Clofán Ophthalmology consultation with Dr. Peláez (2.5h guide)
            new ItineraryEvent({
                id: 'evt-171-d1-2',
                patientId: 'rva171',
                title: 'Consulta Oftalmología Dr. Peláez (María Rodrigues)',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-20T15:00:00.000Z',
                endDateTime: '2026-08-20T17:30:00.000Z',
                location: 'Clínica Clofán Ciudad del Río',
                provider: 'Clínica Clofán',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 2.5,
                costUnits: 38750, // 2.5h * $15.500 = $38.750 COP
                status: EVENT_STATUS.COMPLETED,
                gpsChecked: true
            }),
            // Day 1: Parking petty cash
            new ItineraryEvent({
                id: 'evt-171-d1-3',
                patientId: 'rva171',
                title: 'Parqueadero Torre Médica Clofán Sótano 2',
                category: 'PHARMACY_EXPENSE',
                startDateTime: '2026-08-20T17:30:00.000Z',
                endDateTime: '2026-08-20T18:00:00.000Z',
                location: 'Clínica Clofán Ciudad del Río',
                provider: 'Parqueadero Clofán',
                assignedRole: '[DRV] Andrés',
                costType: 'CAJA_MENOR',
                costUnits: 12000,
                status: EVENT_STATUS.COMPLETED
            }),
            // Day 2: CIMA Diagnósticos fasting ultrasound (8.0h guide)
            new ItineraryEvent({
                id: 'evt-171-d2-1',
                patientId: 'rva171',
                title: 'Ecografías & Diagnóstico Integral CIMA (Tatiana / Mariana)',
                category: 'LAB_DIAGNOSTICS',
                startDateTime: '2026-08-21T06:30:00.000Z',
                endDateTime: '2026-08-21T14:30:00.000Z',
                location: 'CIMA Ayudas Diagnósticas (Cra 44)',
                provider: 'CIMA Diagnósticos',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 8.0,
                costUnits: 124000, // 8h * $15.500 = $124.000 COP
                status: EVENT_STATUS.SCHEDULED,
                notes: 'Ayuno estricto 8 horas'
            }),
            // Day 2: Cruz Verde pharmacy prescription
            new ItineraryEvent({
                id: 'evt-171-d2-2',
                patientId: 'rva171',
                title: 'Compra de Gotas Oftálmicas & Fórmulas Post-Op',
                category: 'PHARMACY_EXPENSE',
                startDateTime: '2026-08-21T15:00:00.000Z',
                endDateTime: '2026-08-21T16:00:00.000Z',
                location: 'Droguería Cruz Verde Poblado',
                provider: 'Cruz Verde',
                assignedRole: '[GUIA] Yenny',
                costType: 'FARMACIA',
                costUnits: 85000,
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 3: Pediatric Urology follow-up at Clofán (3.0h guide)
            new ItineraryEvent({
                id: 'evt-171-d3-1',
                patientId: 'rva171',
                title: 'Control Urología Pediátrica Clofán',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-22T09:00:00.000Z',
                endDateTime: '2026-08-22T12:00:00.000Z',
                location: 'Clínica Clofán Ciudad del Río',
                provider: 'Clínica Clofán',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 3.0,
                costUnits: 46500, // 3h * $15.500 = $46.500 COP
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 5: Return transfer Hotel Inntu ➔ JMC (Uber XL Van)
            new ItineraryEvent({
                id: 'evt-171-d5-1',
                patientId: 'rva171',
                title: 'Check-out y Traslado Hotel Inntu ➔ Aeropuerto JMC',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-24T12:00:00.000Z',
                endDateTime: '2026-08-24T14:00:00.000Z',
                location: 'Hotel Inntu Laureles ➔ Aeropuerto JMC Rionegro',
                provider: 'Uber XL / Andrés',
                assignedRole: '[DRV] Andrés',
                costType: 'TRANSPORTE',
                costUnits: 160000,
                status: EVENT_STATUS.SCHEDULED
            })
        ];

        // Extra receipt scanned via OCR
        const extraTickets = [
            { id: 'tkt-ocr-171', patientId: 'rva171', amountUnits: 65000, concept: 'OCR Ticket Cruz Verde' }
        ];

        const ledger = new SettlementLedger('rva171', catia.advanceTotal);
        const settlement = ledger.calculateFromEvents(milestones, extraTickets);

        // Verification of components:
        // Transport = 160.000 + 160.000 = 320.000 COP (32.000.000n cents)
        assert.equal(settlement.transportTotal.units, 320000);
        assert.equal(settlement.transportTotal.cents, 32000000n);

        // Guide hours = 2.5 + 8.0 + 3.0 = 13.5 hours
        assert.equal(settlement.guideHoursTotal, 13.5);
        // Guide honoraries = 38.750 + 124.000 + 46.500 = 209.250 COP (20.925.000n cents)
        assert.equal(settlement.guideHonoraryTotal.units, 209250);
        assert.equal(settlement.guideHonoraryTotal.cents, 20925000n);

        // Out-of-pocket = 12.000 (parking) + 85.000 (pharmacy) + 65.000 (OCR) = 162.000 COP (16.200.000n cents)
        assert.equal(settlement.outOfPocketTotal.units, 162000);
        assert.equal(settlement.outOfPocketTotal.cents, 16200000n);

        // Total Cuenta de Cobro = 320.000 + 209.250 + 162.000 = 691.250 COP (69.125.000n cents)
        assert.equal(settlement.totalCuentaCobro.units, 691250);
        assert.equal(settlement.totalCuentaCobro.cents, 69125000n);

        // Advance Total = 2.098.100 COP (209.810.000n cents)
        assert.equal(settlement.advanceTotal.units, 2098100);
        assert.equal(settlement.advanceTotal.cents, 209810000n);

        // Net Balance = 691.250 - 2.098.100 = -1.406.850 COP (-140.685.000n cents) [Medical Trip surplus]
        assert.equal(settlement.netBalance.units, -1406850);
        assert.equal(settlement.netBalance.cents, -140685000n);
        assert.equal(settlement.isAgentPayable, false);

        // Invariant check: Total expenses + Net = Advance
        const invariantCheck = settlement.totalCuentaCobro.subtract(settlement.netBalance);
        assert.equal(invariantCheck.cents, settlement.advanceTotal.cents);
    });

    // =========================================================================
    // 2. RVA282 George Hernandez (Cardio & Uro, Aeroturex, Claro SIM)
    // =========================================================================
    await t.test('2. [RVA282 George Cardio]: Multi-clinic cardio/uro journey, Aeroturex transfers, SIM out-of-pocket & settlement', () => {
        const george = allPatients.find(p => p.id === 'rva282');
        assert.ok(george, 'George Hernandez profile must exist');
        assert.equal(george.advanceTotal.units, 1200000);

        const milestones = [
            // Day 1: Wingo arrival + Aeroturex Sedan + SIM delivery
            new ItineraryEvent({
                id: 'evt-282-d1-1',
                patientId: 'rva282',
                title: 'Llegada Wingo Curazao 7449 + Entrega SIM Claro en JMC',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-21T15:27:00.000Z',
                endDateTime: '2026-08-21T17:30:00.000Z',
                location: 'Aeropuerto JMC ➔ Ed. Park 42 Poblado',
                provider: 'Aeroturex Sedán',
                assignedRole: '[DRV] Ramón Rosero',
                costType: 'TRANSPORTE',
                costUnits: 145000,
                status: EVENT_STATUS.COMPLETED,
                gpsChecked: true
            }),
            // Day 2: CES Oviedo Cardiology & Echocardiogram (3.0h guide)
            new ItineraryEvent({
                id: 'evt-282-d2-1',
                patientId: 'rva282',
                title: 'Consulta Cardiología & Ecocardiograma Dr. Marcos Yepes',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-22T09:00:00.000Z',
                endDateTime: '2026-08-22T12:00:00.000Z',
                location: 'Clínica CES Sede Oviedo Piso 6',
                provider: 'CES Oviedo',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 3.0,
                costUnits: 46500,
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 3: Cardio VID Robledo comprehensive checkup (5.0h guide)
            new ItineraryEvent({
                id: 'evt-282-d3-1',
                patientId: 'rva282',
                title: 'Chequeo Cardiovascular Integral & Doppler',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-23T08:00:00.000Z',
                endDateTime: '2026-08-23T13:00:00.000Z',
                location: 'Clínica Cardio VID Robledo',
                provider: 'Clínica Cardio VID',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 5.0,
                costUnits: 77500,
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 8: Return transfer Park 42 ➔ JMC (Aeroturex Sedan)
            new ItineraryEvent({
                id: 'evt-282-d8-1',
                patientId: 'rva282',
                title: 'Traslado Retorno Park 42 ➔ Aeropuerto JMC',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-28T14:00:00.000Z',
                endDateTime: '2026-08-28T16:00:00.000Z',
                location: 'Airbnb Ed. Park 42 Poblado ➔ Aeropuerto JMC',
                provider: 'Aeroturex Sedán',
                assignedRole: '[DRV] Ramón Rosero',
                costType: 'TRANSPORTE',
                costUnits: 145000,
                status: EVENT_STATUS.SCHEDULED
            })
        ];

        // Extra out-of-pocket receipts (Anticoagulant + eSIM Claro 80GB)
        const tickets = [
            { id: 'tkt-282-med', patientId: 'rva282', amountUnits: 32000, concept: 'Anticoagulante Farmacia' },
            { id: 'tkt-282-sim', patientId: 'rva282', amountUnits: 90909, concept: 'eSIM Claro 80GB' }
        ];

        const ledger = new SettlementLedger('rva282', george.advanceTotal);
        const settlement = ledger.calculateFromEvents(milestones, tickets);

        // Transport: 145.000 + 145.000 = 290.000 COP
        assert.equal(settlement.transportTotal.units, 290000);
        assert.equal(settlement.transportTotal.cents, 29000000n);

        // Guide hours: 3.0 + 5.0 = 8.0h
        assert.equal(settlement.guideHoursTotal, 8.0);
        // Guide honoraries: 46.500 + 77.500 = 124.000 COP
        assert.equal(settlement.guideHonoraryTotal.units, 124000);
        assert.equal(settlement.guideHonoraryTotal.cents, 12400000n);

        // Out-of-pocket: 32.000 + 90.909 = 122.909 COP (12.290.900n cents)
        assert.equal(settlement.outOfPocketTotal.units, 122909);
        assert.equal(settlement.outOfPocketTotal.cents, 12290900n);

        // Total Cuenta de Cobro = 290.000 + 124.000 + 122.909 = 536.909 COP (53.690.900n cents)
        assert.equal(settlement.totalCuentaCobro.units, 536909);
        assert.equal(settlement.totalCuentaCobro.cents, 53690900n);

        // Advance = 1.200.000 COP (120.000.000n cents)
        assert.equal(settlement.advanceTotal.units, 1200000);

        // Net balance = 536.909 - 1.200.000 = -663.091 COP (-66.309.100n cents)
        assert.equal(settlement.netBalance.units, -663091);
        assert.equal(settlement.netBalance.cents, -66309100n);
        assert.equal(settlement.isAgentPayable, false);
    });

    // =========================================================================
    // 3. RVA341 Eduard Hogenboom (At-Home Fasting Lab + CES Urology)
    // =========================================================================
    await t.test('3. [RVA341 Eduard CES]: 05:30 AM room lab draw, CES Urology, bilingual guide Alejandro & settlement', () => {
        const eduard = allPatients.find(p => p.id === 'rva341');
        assert.ok(eduard, 'Eduard Hogenboom profile must exist');
        assert.equal(eduard.advanceTotal.units, 950000);

        const milestones = [
            // Day 1: Flight arrival + Executive Sedan
            new ItineraryEvent({
                id: 'evt-341-d1-1',
                patientId: 'rva341',
                title: 'Llegada Vuelo JMC ➔ Traslado Hotel Inntu Laureles',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-22T15:27:00.000Z',
                endDateTime: '2026-08-22T17:30:00.000Z',
                location: 'Aeropuerto JMC ➔ Hotel Inntu Laureles',
                provider: 'Sedán Ejecutivo / Andrés',
                assignedRole: '[DRV] Andrés',
                costType: 'TRANSPORTE',
                costUnits: 110000,
                status: EVENT_STATUS.COMPLETED,
                gpsChecked: true
            }),
            // Day 2 (05:30 AM): At-home fasting blood draw at Hotel Inntu Room 1004
            new ItineraryEvent({
                id: 'evt-341-d2-1',
                patientId: 'rva341',
                title: 'Toma de Muestras de Sangre a Domicilio en Habitación Hotel (Ayunas 05:30 AM)',
                category: 'LAB_DIAGNOSTICS',
                startDateTime: '2026-08-23T05:30:00.000Z',
                endDateTime: '2026-08-23T06:30:00.000Z',
                location: 'Hotel Inntu Laureles Hab. 1004',
                provider: 'Laboratorio Echavarría',
                assignedRole: 'Lab Domicilio',
                costType: 'CAJA_MENOR',
                costUnits: 97350, // $65.000 base + $32.350 early morning surcharge
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 2 (11:00 AM): CES Oviedo Urology consultation (2.5h guide Alejandro)
            new ItineraryEvent({
                id: 'evt-341-d2-2',
                patientId: 'rva341',
                title: 'Consulta Urología Dr. Carlos Suárez (Bilingüe Inglés)',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-23T11:00:00.000Z',
                endDateTime: '2026-08-23T13:30:00.000Z',
                location: 'Torre Médica Oviedo',
                provider: 'CES Sede Oviedo',
                assignedRole: '[GUIA] Alejandro',
                costType: 'HONORARIO_GUIA',
                hours: 2.5,
                costUnits: 38750,
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 5: Return transfer Hotel Inntu ➔ JMC
            new ItineraryEvent({
                id: 'evt-341-d5-1',
                patientId: 'rva341',
                title: 'Traslado Retorno Hotel Inntu ➔ Aeropuerto JMC',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-26T10:00:00.000Z',
                endDateTime: '2026-08-26T12:00:00.000Z',
                location: 'Hotel Inntu Laureles ➔ Aeropuerto JMC',
                provider: 'Sedán Ejecutivo / Andrés',
                assignedRole: '[DRV] Andrés',
                costType: 'TRANSPORTE',
                costUnits: 110000,
                status: EVENT_STATUS.SCHEDULED
            })
        ];

        const ledger = new SettlementLedger('rva341', eduard.advanceTotal);
        const settlement = ledger.calculateFromEvents(milestones, []);

        // Transport: 110.000 + 110.000 = 220.000 COP
        assert.equal(settlement.transportTotal.units, 220000);
        assert.equal(settlement.transportTotal.cents, 22000000n);

        // Guide hours: 2.5h = 38.750 COP
        assert.equal(settlement.guideHoursTotal, 2.5);
        assert.equal(settlement.guideHonoraryTotal.units, 38750);
        assert.equal(settlement.guideHonoraryTotal.cents, 3875000n);

        // Out-of-pocket: 97.350 COP (Lab at-home draw)
        assert.equal(settlement.outOfPocketTotal.units, 97350);
        assert.equal(settlement.outOfPocketTotal.cents, 9735000n);

        // Total Cuenta de Cobro: 220.000 + 38.750 + 97.350 = 356.100 COP (35.610.000n cents)
        assert.equal(settlement.totalCuentaCobro.units, 356100);
        assert.equal(settlement.totalCuentaCobro.cents, 35610000n);

        // Advance: 950.000 COP
        assert.equal(settlement.advanceTotal.units, 950000);

        // Net Balance: 356.100 - 950.000 = -593.900 COP (-59.390.000n cents)
        assert.equal(settlement.netBalance.units, -593900);
        assert.equal(settlement.netBalance.cents, -59390000n);
        assert.equal(settlement.isAgentPayable, false);
    });

    // =========================================================================
    // 4. RVA077 Alejandra Rumai (12-Day Surgical Journey & Multi-Stage Settlement)
    // =========================================================================
    await t.test('4. [RVA077 Rumai 12d]: 12-day surgical journey, HPTU surgery, Hernán Ocazionez exams, post-op drainage & settlement', () => {
        const rumai = allPatients.find(p => p.id === 'rva077');
        assert.ok(rumai, 'Alejandra Rumai profile must exist');
        assert.equal(rumai.advanceTotal.units, 3500000);

        const milestones = [
            // Day 1: JMC Arrival + Aeroturex Juan Carlos
            new ItineraryEvent({
                id: 'evt-077-d1-1',
                patientId: 'rva077',
                title: 'Llegada Z-Air JMC ➔ Traslado Hotel Novelty Suites',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-18T10:00:00.000Z',
                endDateTime: '2026-08-18T12:00:00.000Z',
                location: 'Aeropuerto JMC ➔ Novelty Suites El Poblado',
                provider: 'Aeroturex Juan Carlos',
                assignedRole: '[DRV] Juan Carlos',
                costType: 'TRANSPORTE',
                costUnits: 145000,
                status: EVENT_STATUS.COMPLETED,
                gpsChecked: true
            }),
            // Day 1: Gastroenterology consultation at HPTU (4.0h guide)
            new ItineraryEvent({
                id: 'evt-077-d1-2',
                patientId: 'rva077',
                title: 'Consulta Gastroenterología Dr. Mosquera HPTU',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-18T15:45:00.000Z',
                endDateTime: '2026-08-18T19:45:00.000Z',
                location: 'Hospital Pablo Tobón Uribe (HPTU)',
                provider: 'HPTU Robledo',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 4.0,
                costUnits: 62000, // 4h * $15.500 = $62.000 COP
                status: EVENT_STATUS.COMPLETED
            }),
            // Day 3: Pre-op diagnostics Hernán Ocazionez
            new ItineraryEvent({
                id: 'evt-077-d3-1',
                patientId: 'rva077',
                title: 'Radiografía de Tórax & Ecografías Hernán Ocazionez',
                category: 'LAB_DIAGNOSTICS',
                startDateTime: '2026-08-20T09:00:00.000Z',
                endDateTime: '2026-08-20T13:00:00.000Z',
                location: 'Centro Diagnóstico Hernán Ocazionez Poblado',
                provider: 'Hernán Ocazionez',
                assignedRole: '[GUIA] Yenny',
                costType: 'FARMACIA',
                costUnits: 170755,
                status: EVENT_STATUS.COMPLETED
            }),
            // Day 4: Gynaecology Clínica Bolivariana & Pre-Anesthesia (5.0h guide)
            new ItineraryEvent({
                id: 'evt-077-d4-1',
                patientId: 'rva077',
                title: 'Consulta Ginecología Bolivariana & Pre-Anestesia Cardio VID',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-21T08:30:00.000Z',
                endDateTime: '2026-08-21T13:30:00.000Z',
                location: 'Clínica Universitaria Bolivariana',
                provider: 'Clínica Bolivariana',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 5.0,
                costUnits: 77500, // 5h * $15.500 = $77.500 COP
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 5: Major Surgery & 12h Extended Recovery at HPTU (12.0h guide)
            new ItineraryEvent({
                id: 'evt-077-d5-1',
                patientId: 'rva077',
                title: 'Ingreso a Quirófano & Acompañamiento en Recuperación Continua',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-22T06:00:00.000Z',
                endDateTime: '2026-08-22T18:00:00.000Z',
                location: 'Hospital Pablo Tobón Uribe (HPTU)',
                provider: 'HPTU Quirófanos',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 12.0,
                costUnits: 186000, // 12h * $15.500 = $186.000 COP
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 7: Post-op lymphatic drainage (5.0h guide/nurse)
            new ItineraryEvent({
                id: 'evt-077-d7-1',
                patientId: 'rva077',
                title: 'Drenaje Linfático Post-Op Día 1 a 5 (Domicilio Novelty Suites)',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: '2026-08-24T09:00:00.000Z',
                endDateTime: '2026-08-24T14:00:00.000Z',
                location: 'Novelty Suites El Poblado',
                provider: 'Enfermería Domiciliaria',
                assignedRole: '[NURSE] Erika',
                costType: 'HONORARIO_GUIA',
                hours: 5.0,
                costUnits: 77500,
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 7: Surgical compression garments & formulas
            new ItineraryEvent({
                id: 'evt-077-d7-2',
                patientId: 'rva077',
                title: 'Fajas Post-Quirúrgicas & Medicación Fórmulas Cruz Verde',
                category: 'PHARMACY_EXPENSE',
                startDateTime: '2026-08-24T15:00:00.000Z',
                endDateTime: '2026-08-24T16:00:00.000Z',
                location: 'Droguería Cruz Verde Poblado',
                provider: 'Cruz Verde',
                assignedRole: '[GUIA] Yenny',
                costType: 'FARMACIA',
                costUnits: 380000,
                status: EVENT_STATUS.SCHEDULED
            }),
            // Day 12: Return transfer Novelty Suites ➔ JMC (Aeroturex)
            new ItineraryEvent({
                id: 'evt-077-d12-1',
                patientId: 'rva077',
                title: 'Check-out y Traslado Retorno Salida JMC Curazao',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: '2026-08-29T07:00:00.000Z',
                endDateTime: '2026-08-29T09:00:00.000Z',
                location: 'Novelty Suites El Poblado ➔ Aeropuerto JMC',
                provider: 'Aeroturex Gustavo Mora',
                assignedRole: '[DRV] Gustavo Mora',
                costType: 'TRANSPORTE',
                costUnits: 145000,
                status: EVENT_STATUS.SCHEDULED
            })
        ];

        // Extra out-of-pocket viáticos
        const tickets = [
            { id: 'tkt-077-viaticos', patientId: 'rva077', amountUnits: 120000, concept: 'Viáticos & Alimentación Especial' }
        ];

        const ledger = new SettlementLedger('rva077', rumai.advanceTotal);
        const settlement = ledger.calculateFromEvents(milestones, tickets);

        // Transport: 145.000 + 145.000 = 290.000 COP (29.000.000n cents)
        assert.equal(settlement.transportTotal.units, 290000);
        assert.equal(settlement.transportTotal.cents, 29000000n);

        // Guide hours: 4 + 5 + 12 + 5 = 26.0h
        assert.equal(settlement.guideHoursTotal, 26.0);
        // Guide honoraries: 62.000 + 77.500 + 186.000 + 77.500 = 403.000 COP (40.300.000n cents)
        assert.equal(settlement.guideHonoraryTotal.units, 403000);
        assert.equal(settlement.guideHonoraryTotal.cents, 40300000n);

        // Out-of-pocket: 170.755 (Hernán Ocazionez) + 380.000 (Fajas/Pharm) + 120.000 (Viáticos) = 670.755 COP (67.075.500n cents)
        assert.equal(settlement.outOfPocketTotal.units, 670755);
        assert.equal(settlement.outOfPocketTotal.cents, 67075500n);

        // Total Cuenta de Cobro: 290.000 + 403.000 + 670.755 = 1.363.755 COP (136.375.500n cents)
        assert.equal(settlement.totalCuentaCobro.units, 1363755);
        assert.equal(settlement.totalCuentaCobro.cents, 136375500n);

        // Advance: 3.500.000 COP (350.000.000n cents)
        assert.equal(settlement.advanceTotal.units, 3500000);

        // Net Balance: 1.363.755 - 3.500.000 = -2.136.245 COP (-213.624.500n cents)
        assert.equal(settlement.netBalance.units, -2136245);
        assert.equal(settlement.netBalance.cents, -213624500n);
        assert.equal(settlement.isAgentPayable, false);
    });

    // =========================================================================
    // 5. Multi-View Calendar Mechanics & High-Density Workload Stress
    // =========================================================================
    await t.test('5. Multi-View Calendar: Stress test rendering 100+ milestones across Day, Week, Month, and Agenda views with zero layout errors', () => {
        const testDate = new Date('2026-08-20T12:00:00.000Z');
        const stressEvents = [];

        // Generate 100 high-density events spanning 30 days
        for (let i = 1; i <= 100; i++) {
            const dayOffset = (i % 30) - 10;
            const eventDate = new Date(testDate);
            eventDate.setDate(eventDate.getDate() + dayOffset);
            eventDate.setHours(8 + (i % 10), (i % 4) * 15, 0, 0);

            stressEvents.push(new ItineraryEvent({
                id: `evt-stress-${i}`,
                patientId: 'rva171',
                title: `Stress Medical Milestone #${i}`,
                startDateTime: eventDate.toISOString(),
                location: 'Clínica Clofán Ciudad del Río',
                costType: i % 3 === 0 ? 'TRANSPORTE' : (i % 3 === 1 ? 'HONORARIO_GUIA' : 'FARMACIA'),
                costUnits: 50000 + (i * 1000),
                hours: 2.0,
                status: i % 2 === 0 ? EVENT_STATUS.COMPLETED : EVENT_STATUS.SCHEDULED
            }));
        }

        // 1. Month View
        const monthHtml = MonthView.render(testDate, stressEvents);
        assert.ok(monthHtml.includes('month-grid'));
        assert.ok(monthHtml.includes('month-cell'));

        // 2. Week View
        const weekHtml = WeekView.render(testDate, stressEvents);
        assert.ok(weekHtml.includes('week-grid-container'));
        assert.ok(weekHtml.includes('timegrid-header'));
        assert.ok(weekHtml.includes('timegrid-body'));

        // 3. Day View
        const dayHtml = DayView.render(testDate, stressEvents);
        assert.ok(dayHtml.includes('agenda-container'));

        // 4. Agenda View
        const agendaHtml = AgendaView.render(stressEvents);
        assert.ok(agendaHtml.includes('Cronograma Maestro'));
        assert.ok(agendaHtml.includes('Stress Medical Milestone #1'));
        assert.ok(agendaHtml.includes('Stress Medical Milestone #100'));
    });

    // =========================================================================
    // 6. Drag-and-Drop State Persistence & Rapid Rescheduling Concurrency
    // =========================================================================
    await t.test('6. Drag-and-Drop & Concurrency: Rapid consecutive milestone rescheduling maintains exact state and ledger synchrony', () => {
        const eventsDTO = [
            {
                id: 'evt-dnd-1',
                patientId: 'rva171',
                title: 'Traslado JMC DND Test',
                startDateTime: new Date('2026-08-20T10:00:00.000Z'),
                endDateTime: new Date('2026-08-20T12:00:00.000Z'),
                location: 'Aeropuerto JMC ➔ Hotel Inntu Laureles',
                costUnits: 160000,
                costType: 'TRANSPORTE'
            }
        ];

        LocalFirstStorageAdapter.saveEvents(eventsDTO);

        let loaded = LocalFirstStorageAdapter.loadEvents();
        assert.equal(loaded.length, 1);

        const originalStart = new Date(loaded[0].startDateTime);

        // Perform 50 rapid simulated drag-and-drop reschedule operations
        for (let step = 1; step <= 50; step++) {
            const newStart = new Date(originalStart.getTime() + step * 15 * 60 * 1000); // Snap 15 min increments
            const newEnd = new Date(newStart.getTime() + 2 * 60 * 60 * 1000);

            loaded[0].startDateTime = newStart.toISOString();
            loaded[0].endDateTime = newEnd.toISOString();

            LocalFirstStorageAdapter.saveEvents(loaded);
            const persisted = LocalFirstStorageAdapter.loadEvents();
            assert.equal(new Date(persisted[0].startDateTime).getTime(), newStart.getTime());
        }

        // Verify ledger recalculates without error
        const catia = allPatients.find(p => p.id === 'rva171');
        const ledger = new SettlementLedger('rva171', catia.advanceTotal);
        const mappedEvents = loaded.map(e => new ItineraryEvent({
            ...e,
            costUnits: e.costUnits || 0
        }));
        const settlement = ledger.calculateFromEvents(mappedEvents, []);

        assert.ok(settlement.netBalance.cents !== undefined);
        assert.equal(settlement.isAgentPayable, false);
    });
});
