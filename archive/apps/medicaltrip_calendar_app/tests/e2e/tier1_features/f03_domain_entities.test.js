import test from 'node:test';
import assert from 'node:assert/strict';
import { PatientBooking } from '../../../src/domain/PatientBooking.js';
import { ItineraryEvent, EVENT_CATEGORIES, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { Money } from '../../../src/domain/Money.js';

test('F03: Domain Entities — PatientBooking and ItineraryEvent Models', async (t) => {
    await t.test('1. PatientBooking initializes complete operational profile with Money advance', () => {
        const booking = new PatientBooking({
            id: 'rva171',
            code: 'RVA171-4',
            name: 'Catia Rodrigues (Grupo Familiar 5 Pax)',
            country: 'Curazao',
            paxCount: 5,
            language: 'Papiamento',
            hotel: 'Hotel Inntu Laureles',
            startDate: '2026-08-20',
            endDate: '2026-08-25',
            advanceTotalUnits: 2098100,
            companionName: 'Tatiana, Mariana, María, Lisandra'
        });

        assert.equal(booking.id, 'rva171');
        assert.equal(booking.code, 'RVA171-4');
        assert.equal(booking.paxCount, 5);
        assert.equal(booking.language, 'Papiamento');
        assert.equal(booking.hotel, 'Hotel Inntu Laureles');
        assert.equal(booking.advanceTotal.units, 2098100);
        assert.equal(booking.advanceTotal.cents, 209810000n);
        assert.equal(booking.companionName, 'Tatiana, Mariana, María, Lisandra');
    });

    await t.test('2. PatientBooking fails-fast on non-operative hotel territory', () => {
        assert.throws(() => {
            new PatientBooking({
                id: 'rva_fail',
                code: 'FAIL-01',
                name: 'Invalid Hotel Patient',
                country: 'Curazao',
                hotel: 'Hotel Putumayo Real Mocoa',
                startDate: '2026-08-20',
                endDate: '2026-08-25'
            });
        }, /Violación Geoespacial/);
    });

    await t.test('3. ItineraryEvent enforces mandatory domain invariants (id, patientId, title)', () => {
        assert.throws(() => {
            new ItineraryEvent({ patientId: 'rva171', title: 'Test Event' });
        }, /id es obligatorio/);

        assert.throws(() => {
            new ItineraryEvent({ id: 'evt-1', title: 'Test Event' });
        }, /patientId es obligatorio/);

        assert.throws(() => {
            new ItineraryEvent({ id: 'evt-1', patientId: 'rva171', title: '' });
        }, /title es obligatorio/);
    });

    await t.test('4. ItineraryEvent calculates exact duration and validates category mapping', () => {
        const start = '2026-08-21T08:00:00Z';
        const end = '2026-08-21T10:30:00Z'; // 150 minutes
        const event = new ItineraryEvent({
            id: 'evt-lab',
            patientId: 'rva171',
            title: 'Ecografía CIMA',
            category: 'LAB_DIAGNOSTICS',
            startDateTime: start,
            endDateTime: end,
            location: 'CIMA Ayudas Diagnósticas'
        });

        assert.equal(event.durationMinutes, 150);
        assert.equal(event.category, 'LAB_DIAGNOSTICS');
        assert.equal(EVENT_CATEGORIES[event.category].color, 'teal');
    });

    await t.test('5. ItineraryEvent rescheduling updates start/end time while preserving or overriding duration', () => {
        const event = new ItineraryEvent({
            id: 'evt-resched',
            patientId: 'rva171',
            title: 'Consulta Clofán',
            startDateTime: '2026-08-21T09:00:00Z',
            endDateTime: '2026-08-21T10:00:00Z', // 60 min
            location: 'Clínica Clofán'
        });

        // Reschedule maintaining duration
        event.reschedule('2026-08-21T14:00:00Z');
        assert.equal(event.startDateTime.toISOString(), '2026-08-21T14:00:00.000Z');
        assert.equal(event.endDateTime.toISOString(), '2026-08-21T15:00:00.000Z');
        assert.equal(event.durationMinutes, 60);

        // Reschedule with explicit new end time
        event.reschedule('2026-08-21T16:00:00Z', '2026-08-21T18:30:00Z');
        assert.equal(event.durationMinutes, 150);
    });

    await t.test('6. ItineraryEvent status transitions and GPS check-in completion', () => {
        const event = new ItineraryEvent({
            id: 'evt-gps',
            patientId: 'rva171',
            title: 'Traslado JMC',
            startDateTime: '2026-08-20T10:00:00Z',
            location: 'Aeropuerto JMC ➔ Inntu Laureles',
            status: EVENT_STATUS.SCHEDULED
        });

        assert.equal(event.status, EVENT_STATUS.SCHEDULED);
        assert.equal(event.gpsChecked, false);

        event.markCompleted({ lat: 6.1645, lng: -75.4278 });
        assert.equal(event.status, EVENT_STATUS.COMPLETED);
        assert.equal(event.gpsChecked, true);
        assert.equal(event.gpsCoords.lat, 6.1645);
        assert.equal(event.gpsCoords.lng, -75.4278);
    });
});
