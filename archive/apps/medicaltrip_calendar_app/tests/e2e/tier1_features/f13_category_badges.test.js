import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_CATEGORIES, ItineraryEvent } from '../../../src/domain/ItineraryEvent.js';

test('F13: Semantic Category Badge System — Standardized Color Codes and Icons', async (t) => {
    await t.test('1. Validates all 6 category keys and definitions', () => {
        const expectedKeys = [
            'FLIGHT_TRANSPORT',
            'CLINICAL_CONSULTATION',
            'LAB_DIAGNOSTICS',
            'SURGERY_PROCEDURE',
            'PHARMACY_EXPENSE',
            'HOTEL_RECOVERY'
        ];

        for (const key of expectedKeys) {
            assert.ok(EVENT_CATEGORIES[key], `Category ${key} must exist`);
            assert.equal(EVENT_CATEGORIES[key].id, key);
        }
    });

    await t.test('2. FLIGHT_TRANSPORT is assigned sky color and plane icon', () => {
        const cat = EVENT_CATEGORIES.FLIGHT_TRANSPORT;
        assert.equal(cat.color, 'sky');
        assert.equal(cat.icon, 'plane');
        assert.equal(cat.label, 'Vuelo & Traslado');
    });

    await t.test('3. CLINICAL_CONSULTATION and SURGERY_PROCEDURE semantic properties', () => {
        const consult = EVENT_CATEGORIES.CLINICAL_CONSULTATION;
        assert.equal(consult.color, 'indigo');
        assert.equal(consult.icon, 'stethoscope');

        const surgery = EVENT_CATEGORIES.SURGERY_PROCEDURE;
        assert.equal(surgery.color, 'rose');
        assert.equal(surgery.icon, 'hospital');
    });

    await t.test('4. LAB_DIAGNOSTICS and PHARMACY_EXPENSE semantic properties', () => {
        const lab = EVENT_CATEGORIES.LAB_DIAGNOSTICS;
        assert.equal(lab.color, 'teal');
        assert.equal(lab.icon, 'flask');

        const pharmacy = EVENT_CATEGORIES.PHARMACY_EXPENSE;
        assert.equal(pharmacy.color, 'amber');
        assert.equal(pharmacy.icon, 'receipt');
    });

    await t.test('5. Fallback to default category for unknown category ID', () => {
        const evt = new ItineraryEvent({
            id: 'evt-bad-cat',
            patientId: 'rva171',
            title: 'Unknown Cat Event',
            category: 'NON_EXISTENT_CATEGORY',
            startDateTime: '2026-08-21T10:00:00Z',
            location: 'Medellín'
        });

        assert.equal(evt.category, 'CLINICAL_CONSULTATION');
    });
});
