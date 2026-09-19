import test from 'node:test';
import assert from 'node:assert/strict';
import { EventDetailDrawer } from '../../../src/ui/EventDetailDrawer.js';
import { ItineraryEvent } from '../../../src/domain/ItineraryEvent.js';

test('F14: Event Detail Drawer — Form Binding, Edit/Create Modes, and Input Validation', async (t) => {
    await t.test('1. Renders in Create Mode when event is null', () => {
        const html = EventDetailDrawer.render(null, 'rva171');
        assert.ok(html.includes('Nueva Actividad de Itinerario'));
        assert.ok(html.includes('Crear Actividad'));
        assert.ok(!html.includes('btnDeleteEvent'));
        assert.ok(html.includes('id="drawerTitle"'));
        assert.ok(html.includes('id="drawerLocation"'));
    });

    await t.test('2. Renders in Edit Mode when existing event is provided', () => {
        const existingEvent = new ItineraryEvent({
            id: 'evt-edit-1',
            patientId: 'rva171',
            title: 'Consulta Cardiología',
            category: 'CLINICAL_CONSULTATION',
            startDateTime: '2026-08-21T09:00:00Z',
            endDateTime: '2026-08-21T10:30:00Z',
            location: 'Clínica CES Sede Oviedo',
            assignedRole: '[GUIA] Yenny',
            costType: 'HONORARIO_GUIA',
            costUnits: 23250,
            hours: 1.5,
            notes: 'Paciente hipertenso'
        });

        const html = EventDetailDrawer.render(existingEvent, 'rva171');
        assert.ok(html.includes('Editar Actividad'));
        assert.ok(html.includes('Guardar Cambios'));
        assert.ok(html.includes('btnDeleteEvent'));
        assert.ok(html.includes('value="Consulta Cardiología"'));
        assert.ok(html.includes('value="Clínica CES Sede Oviedo"'));
        assert.ok(html.includes('Paciente hipertenso'));
    });

    await t.test('3. Binds all 6 category dropdown options', () => {
        const html = EventDetailDrawer.render(null, 'rva171');
        assert.ok(html.includes('value="FLIGHT_TRANSPORT"'));
        assert.ok(html.includes('value="CLINICAL_CONSULTATION"'));
        assert.ok(html.includes('value="LAB_DIAGNOSTICS"'));
        assert.ok(html.includes('value="SURGERY_PROCEDURE"'));
        assert.ok(html.includes('value="PHARMACY_EXPENSE"'));
        assert.ok(html.includes('value="HOTEL_RECOVERY"'));
    });

    await t.test('4. Binds cost types and assigned operational roles', () => {
        const html = EventDetailDrawer.render(null, 'rva171');
        assert.ok(html.includes('value="INCLUIDO"'));
        assert.ok(html.includes('value="TRANSPORTE"'));
        assert.ok(html.includes('value="HONORARIO_GUIA"'));
        assert.ok(html.includes('value="CAJA_MENOR"'));
        assert.ok(html.includes('value="FARMACIA"'));

        assert.ok(html.includes('[GUIA] Yenny'));
        assert.ok(html.includes('[DRV] Ramón'));
        assert.ok(html.includes('[DRV] Andrés'));
        assert.ok(html.includes('[COORD] Carolina'));
    });

    await t.test('5. Contains geo-fencing warning text for field operators', () => {
        const html = EventDetailDrawer.render(null, 'rva171');
        assert.ok(html.includes('Invariante: Zonas permitidas'));
    });
});
