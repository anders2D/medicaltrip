/**
 * Medical Trip Calendar App — Automated Test Suite
 * Valida Domain Invariants (Money, OperativeTerritory), Settlement Math, Drive Dataset y UI Components
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { Money } from '../src/domain/Money.js';
import { OperativeTerritory } from '../src/domain/OperativeTerritory.js';
import { ItineraryEvent, EVENT_STATUS } from '../src/domain/ItineraryEvent.js';
import { PatientBooking } from '../src/domain/PatientBooking.js';
import { SettlementLedger } from '../src/domain/SettlementLedger.js';
import { DriveDatasetAdapter } from '../src/infrastructure/DriveDatasetAdapter.js';
import { MonthView } from '../src/ui/MonthView.js';
import { WeekView } from '../src/ui/WeekView.js';
import { DayView } from '../src/ui/DayView.js';
import { AgendaView } from '../src/ui/AgendaView.js';
import { SettlementBalanceBar } from '../src/ui/SettlementBalanceBar.js';

test('1. Money Value Object — Deterministic BigInt Cents Arithmetic', async (t) => {
    await t.test('Erradica errores de coma flotante en sumas acumuladas', () => {
        const m1 = Money.fromUnits(0.1, 'COP');
        const m2 = Money.fromUnits(0.2, 'COP');
        const sum = m1.add(m2);
        assert.equal(sum.units, 0.3);
        assert.equal(sum.cents, 30n);
    });

    await t.test('Multiplicación y formateo exacto en moneda local COP', () => {
        const feePerHour = Money.fromUnits(15500, 'COP');
        const total = feePerHour.multiply(3.5);
        assert.equal(total.units, 54250);
        assert.equal(total.cents, 5425000n);
        assert.match(total.format(), /54\.250/);
    });

    await t.test('Rechaza operaciones entre monedas incompatibles', () => {
        const cop = Money.fromUnits(1000, 'COP');
        const usd = Money.fromUnits(10, 'USD');
        assert.throws(() => cop.add(usd), /Incompatibilidad de monedas/);
    });
});

test('2. OperativeTerritory — Geo-Fencing Invariant Validation', async (t) => {
    await t.test('Acepta ubicaciones habilitadas en Antioquia', () => {
        const t1 = new OperativeTerritory('Clínica Clofán Ciudad del Río');
        assert.equal(t1.name, 'Clínica Clofán Ciudad del Río');

        const t2 = new OperativeTerritory('Hotel Inntu Laureles');
        assert.equal(t2.name, 'Hotel Inntu Laureles');
    });

    await t.test('Falla inmediatamente (Fail-Fast) con DomainError en zonas prohibidas como Mocoa', () => {
        assert.throws(() => {
            new OperativeTerritory('Hospital San Francisco de Mocoa');
        }, /Violación Geoespacial/);

        assert.throws(() => {
            new OperativeTerritory('Leticia Amazonas');
        }, /Violación Geoespacial/);
    });
});

test('3. Drive Dataset & Real Operational Archetypes', async (t) => {
    const patients = DriveDatasetAdapter.getPatients();
    assert.equal(patients.length, 4, 'Debe cargar los 4 arquetipos de Google Drive');

    const catia = patients.find(p => p.id === 'rva171');
    assert.equal(catia.name, 'Catia Rodrigues (Grupo Familiar 5 Pax)');
    assert.equal(catia.paxCount, 5);
    assert.equal(catia.advanceTotal.units, 2098100);

    const initialEvents = DriveDatasetAdapter.getInitialEvents();
    assert.ok(initialEvents.length >= 7, 'Debe tener eventos iniciales cargados');
});

test('4. SettlementLedger — Financial Balance Calculation', async (t) => {
    const advance = Money.fromUnits(2098100, 'COP');
    const ledger = new SettlementLedger('rva171', advance);

    const events = [
        new ItineraryEvent({
            id: 'e1',
            patientId: 'rva171',
            title: 'Traslado JMC',
            startDateTime: '2026-08-20T10:00:00Z',
            location: 'Aeropuerto JMC ➔ Inntu Laureles',
            costType: 'TRANSPORTE',
            costUnits: 160000
        }),
        new ItineraryEvent({
            id: 'e2',
            patientId: 'rva171',
            title: 'Guianza CIMA',
            startDateTime: '2026-08-21T08:00:00Z',
            location: 'CIMA Diagnósticos',
            costType: 'HONORARIO_GUIA',
            hours: 8,
            costUnits: 124000
        }),
        new ItineraryEvent({
            id: 'e3',
            patientId: 'rva171',
            title: 'Farmacia Gotas',
            startDateTime: '2026-08-21T15:00:00Z',
            location: 'Cruz Verde Poblado',
            costType: 'FARMACIA',
            costUnits: 85000
        })
    ];

    const result = ledger.calculateFromEvents(events, [{ amountUnits: 65000 }]);

    assert.equal(result.transportTotal.units, 160000);
    assert.equal(result.guideHonoraryTotal.units, 124000);
    assert.equal(result.outOfPocketTotal.units, 150000); // 85k + 65k extra ticket
    assert.equal(result.totalCuentaCobro.units, 434000);
    assert.equal(result.netBalance.units, -1664100); // Anticipos superan gastos -> saldo a favor Medical Trip
    assert.equal(result.isAgentPayable, false);
});

test('5. UI View Renderers — Safe HTML Generation', async (t) => {
    const date = new Date('2026-08-20T12:00:00Z');
    const events = DriveDatasetAdapter.getInitialEvents();

    const monthHtml = MonthView.render(date, events);
    assert.ok(monthHtml.includes('month-grid'), 'MonthView renderiza grilla');

    const weekHtml = WeekView.render(date, events);
    assert.ok(weekHtml.includes('week-grid-container'), 'WeekView renderiza semana');

    const dayHtml = DayView.render(date, events);
    assert.ok(dayHtml.includes('agenda-container'), 'DayView renderiza día');

    const agendaHtml = AgendaView.render(events);
    assert.ok(agendaHtml.includes('Cronograma Maestro'), 'AgendaView renderiza agenda');

    const advance = Money.fromUnits(1000000, 'COP');
    const ledger = new SettlementLedger('rva171', advance);
    const data = ledger.calculateFromEvents(events, []);
    const barHtml = SettlementBalanceBar.render(data);
    assert.ok(barHtml.includes('settlement-dock'), 'SettlementBalanceBar renderiza dock');
});
