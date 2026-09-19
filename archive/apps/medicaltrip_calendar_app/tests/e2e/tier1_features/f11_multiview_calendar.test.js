import test from 'node:test';
import assert from 'node:assert/strict';
import { MonthView } from '../../../src/ui/MonthView.js';
import { WeekView } from '../../../src/ui/WeekView.js';
import { DayView } from '../../../src/ui/DayView.js';
import { AgendaView } from '../../../src/ui/AgendaView.js';
import { CalendarHeader } from '../../../src/ui/CalendarHeader.js';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';

test('F11: Multi-View Calendar Engine — Month, Week, Day, and Agenda View Renderers', async (t) => {
    const events = DriveDatasetAdapter.getInitialEvents().filter(e => e.patientId === 'rva171');
    const sampleDate = new Date(events[0].startDateTime);

    await t.test('1. MonthView renders complete month grid and event chips', () => {
        const html = MonthView.render(sampleDate, events);
        assert.ok(html.includes('month-grid'));
        assert.ok(html.includes('month-header-row'));
        assert.ok(html.includes('Dom') && html.includes('Lun') && html.includes('Sáb'));
        assert.ok(html.includes('data-date='));
        assert.ok(html.includes('data-event-id="evt-171-1"'));
    });

    await t.test('2. WeekView renders 7-day columns and 06:00 to 21:00 timegrid', () => {
        const html = WeekView.render(sampleDate, events);
        assert.ok(html.includes('week-grid-container'));
        assert.ok(html.includes('timegrid-header'));
        assert.ok(html.includes('timegrid-body'));
        assert.ok(html.includes('6:00') && html.includes('12:00') && html.includes('21:00'));
        assert.ok(html.includes('day-column'));
    });

    await t.test('3. DayView renders single-day cards with provider, role, and cost itemization', () => {
        const dayWithEvents = new Date(events[0].startDateTime);
        const html = DayView.render(dayWithEvents, events);
        assert.ok(html.includes('agenda-container'));
        assert.ok(html.includes('agenda-card'));
        assert.ok(html.includes('COMPLETADO') || html.includes('Consulta') || html.includes('Traslado'));
        assert.ok(html.includes('data-event-id='));
    });

    await t.test('4. AgendaView groups multi-day itinerary chronologically with date badges', () => {
        const html = AgendaView.render(events);
        assert.ok(html.includes('agenda-container'));
        assert.ok(html.includes('agenda-day-group'));
        assert.ok(html.includes('agenda-date-badge'));
        assert.ok(html.includes('Cronograma Maestro'));
    });

    await t.test('5. CalendarHeader renders brand logo, date title, and 4 view switcher buttons', () => {
        const headerDate = new Date('2026-08-20T12:00:00Z');
        const html = CalendarHeader.render(headerDate, 'month');
        assert.ok(html.includes('Medical Trip Itinerarios'));
        assert.ok(html.includes('Agosto 2026'));
        assert.ok(html.includes('data-view="month"') && html.includes('active'));
        assert.ok(html.includes('data-view="week"'));
        assert.ok(html.includes('data-view="day"'));
        assert.ok(html.includes('data-view="agenda"'));
        assert.ok(html.includes('btnNewEvent'));
    });

    await t.test('6. Views handle empty event list gracefully without throwing', () => {
        assert.doesNotThrow(() => MonthView.render(sampleDate, []));
        assert.doesNotThrow(() => WeekView.render(sampleDate, []));
        assert.doesNotThrow(() => DayView.render(sampleDate, []));
        assert.doesNotThrow(() => AgendaView.render([]));

        const emptyDayHtml = DayView.render(sampleDate, []);
        assert.ok(emptyDayHtml.includes('No hay eventos programados para este día'));
    });
});
