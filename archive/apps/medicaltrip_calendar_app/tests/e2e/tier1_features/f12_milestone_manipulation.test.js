import test from 'node:test';
import assert from 'node:assert/strict';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';

test('F12: Direct Milestone Manipulation — Rescheduling, Duration Resizing, and Status Changes', async (t) => {
    function createSampleEvent() {
        return new ItineraryEvent({
            id: 'evt-manipulate-1',
            patientId: 'rva171',
            title: 'Consulta Oftalmológica',
            category: 'CLINICAL_CONSULTATION',
            startDateTime: '2026-08-21T09:00:00Z',
            endDateTime: '2026-08-21T10:30:00Z', // 90 mins
            location: 'Clínica Clofán',
            provider: 'Clófán',
            assignedRole: '[GUIA] Yenny',
            costType: 'HONORARIO_GUIA',
            hours: 1.5,
            costUnits: 23250
        });
    }

    await t.test('1. Reschedule updates start time and shifts end time preserving 90-min duration', () => {
        const evt = createSampleEvent();
        assert.equal(evt.durationMinutes, 90);

        evt.reschedule('2026-08-21T14:00:00Z');
        assert.equal(evt.startDateTime.toISOString(), '2026-08-21T14:00:00.000Z');
        assert.equal(evt.endDateTime.toISOString(), '2026-08-21T15:30:00.000Z');
        assert.equal(evt.durationMinutes, 90);
    });

    await t.test('2. Resizing milestone duration with explicit start and end times', () => {
        const evt = createSampleEvent();
        evt.reschedule('2026-08-21T09:00:00Z', '2026-08-21T12:00:00Z'); // Extended to 180 mins
        assert.equal(evt.durationMinutes, 180);
    });

    await t.test('3. 15-Minute snap quantization utility', () => {
        const snapTo15Minutes = (date) => {
            const ms = 1000 * 60 * 15;
            return new Date(Math.round(date.getTime() / ms) * ms);
        };

        const d1 = new Date('2026-08-21T09:07:00Z');
        const snapped1 = snapTo15Minutes(d1);
        assert.equal(snapped1.toISOString(), '2026-08-21T09:00:00.000Z');

        const d2 = new Date('2026-08-21T09:09:00Z');
        const snapped2 = snapTo15Minutes(d2);
        assert.equal(snapped2.toISOString(), '2026-08-21T09:15:00.000Z');
    });

    await t.test('4. Sequential status transitions in field operations', () => {
        const evt = createSampleEvent();
        assert.equal(evt.status, EVENT_STATUS.SCHEDULED);

        evt.status = EVENT_STATUS.IN_TRANSIT;
        assert.equal(evt.status, 'IN_TRANSIT');

        evt.status = EVENT_STATUS.ON_SITE;
        assert.equal(evt.status, 'ON_SITE');

        evt.markCompleted({ lat: 6.212, lng: -75.571 });
        assert.equal(evt.status, EVENT_STATUS.COMPLETED);
        assert.equal(evt.gpsChecked, true);
    });

    await t.test('5. Modifying operational notes and assigned personnel', () => {
        const evt = createSampleEvent();
        evt.notes = 'Paciente requiere traductor en Papiamento para explicar consentimiento informado.';
        evt.assignedRole = '[GUIA] Alejandro';
        evt.assignedAgentName = 'Alejandro Bilingüe';

        assert.equal(evt.assignedRole, '[GUIA] Alejandro');
        assert.ok(evt.notes.includes('Papiamento'));
    });
});
