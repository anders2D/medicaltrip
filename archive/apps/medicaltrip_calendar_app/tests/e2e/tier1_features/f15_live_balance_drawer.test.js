import test from 'node:test';
import assert from 'node:assert/strict';
import { SettlementBalanceBar } from '../../../src/ui/SettlementBalanceBar.js';
import { SettlementLedger } from '../../../src/domain/SettlementLedger.js';
import { Money } from '../../../src/domain/Money.js';
import { ItineraryEvent } from '../../../src/domain/ItineraryEvent.js';

test('F15: Live Balance Drawer & Visual Bar — Real-Time Settlement Rendering', async (t) => {
    await t.test('1. Renders all 4 financial KPI items (Transport, Guide Hours, Pharmacy, Advances)', () => {
        const advance = Money.fromUnits(2000000, 'COP');
        const ledger = new SettlementLedger('rva171', advance);
        const data = ledger.calculateFromEvents([], []);
        const html = SettlementBalanceBar.render(data);

        assert.ok(html.includes('settlement-dock'));
        assert.ok(html.includes('Flota & Taxis'));
        assert.ok(html.includes('Horas Guía'));
        assert.ok(html.includes('Farmacia & Caja Menor'));
        assert.ok(html.includes('Anticipos Bancolombia'));
    });

    await t.test('2. Renders surplus pill with "A favor Medical Trip" for credit balance', () => {
        const advance = Money.fromUnits(1000000, 'COP');
        const ledger = new SettlementLedger('rva171', advance);
        const events = [
            new ItineraryEvent({
                id: 'e1',
                patientId: 'rva171',
                title: 'Taxi',
                startDateTime: '2026-08-20T10:00:00Z',
                costType: 'TRANSPORTE',
                costUnits: 150000
            })
        ];
        const data = ledger.calculateFromEvents(events, []);
        const html = SettlementBalanceBar.render(data);

        assert.ok(html.includes('balance-pill surplus'));
        assert.ok(html.includes('A favor Medical Trip'));
    });

    await t.test('3. Renders payable pill with "Transferir a Guía" when expenses exceed advances', () => {
        const advance = Money.fromUnits(100000, 'COP');
        const ledger = new SettlementLedger('rva171', advance);
        const events = [
            new ItineraryEvent({
                id: 'e1',
                patientId: 'rva171',
                title: 'Traslado JMC',
                startDateTime: '2026-08-20T10:00:00Z',
                costType: 'TRANSPORTE',
                costUnits: 160000
            })
        ];
        const data = ledger.calculateFromEvents(events, []);
        const html = SettlementBalanceBar.render(data);

        assert.ok(html.includes('balance-pill payable'));
        assert.ok(html.includes('Transferir a Guía'));
    });

    await t.test('4. Includes action buttons for Receipt OCR and Digital Signature modals', () => {
        const advance = Money.zero('COP');
        const ledger = new SettlementLedger('rva171', advance);
        const data = ledger.calculateFromEvents([], []);
        const html = SettlementBalanceBar.render(data);

        assert.ok(html.includes('id="btnUploadReceipt"'));
        assert.ok(html.includes('Ticket OCR'));
        assert.ok(html.includes('id="btnSignOff"'));
        assert.ok(html.includes('Firma Pax'));
    });

    await t.test('5. Displays exact guide hours with precision', () => {
        const advance = Money.zero('COP');
        const ledger = new SettlementLedger('rva171', advance);
        const events = [
            new ItineraryEvent({
                id: 'e1',
                patientId: 'rva171',
                title: 'Guianza CIMA',
                startDateTime: '2026-08-20T10:00:00Z',
                costType: 'HONORARIO_GUIA',
                hours: 8.5,
                costUnits: 131750
            })
        ];
        const data = ledger.calculateFromEvents(events, []);
        const html = SettlementBalanceBar.render(data);

        assert.ok(html.includes('8.5h'));
    });
});
