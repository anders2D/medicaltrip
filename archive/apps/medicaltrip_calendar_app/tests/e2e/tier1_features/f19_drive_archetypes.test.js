import test from 'node:test';
import assert from 'node:assert/strict';
import { DriveDatasetAdapter } from '../../../src/infrastructure/DriveDatasetAdapter.js';
import { ARCHETYPE_EXPECTATIONS } from '../../fixtures/archetypeFixtures.js';

test('F19: Drive Archetypes Data Loader — High-Fidelity Dataset Integrity', async (t) => {
    const patients = DriveDatasetAdapter.getPatients();
    const initialEvents = DriveDatasetAdapter.getInitialEvents();

    await t.test('1. Loads all 4 real-world operational archetypes', () => {
        assert.equal(patients.length, 4, 'Must load exactly 4 Drive archetypes');
        const ids = patients.map(p => p.id);
        assert.deepEqual(ids.sort(), ['rva077', 'rva171', 'rva282', 'rva341'].sort());
    });

    await t.test('2. RVA171 Catia Rodrigues (5 Pax Curacao) profile fidelity', () => {
        const catia = patients.find(p => p.id === 'rva171');
        const exp = ARCHETYPE_EXPECTATIONS.rva171;
        assert.ok(catia);
        assert.equal(catia.code, exp.code);
        assert.equal(catia.country, exp.country);
        assert.equal(catia.paxCount, exp.paxCount);
        assert.equal(catia.language, exp.language);
        assert.equal(catia.hotel, exp.hotel);
        assert.equal(catia.advanceTotal.units, exp.advanceCOP);
        assert.equal(catia.advanceTotal.cents, exp.advanceCents);
    });

    await t.test('3. RVA282 George Hernandez (Cardio/Uro) profile fidelity', () => {
        const george = patients.find(p => p.id === 'rva282');
        const exp = ARCHETYPE_EXPECTATIONS.rva282;
        assert.ok(george);
        assert.equal(george.code, exp.code);
        assert.equal(george.country, exp.country);
        assert.equal(george.paxCount, exp.paxCount);
        assert.equal(george.hotel, exp.hotel);
        assert.equal(george.advanceTotal.units, exp.advanceCOP);
    });

    await t.test('4. RVA341 Eduard Hogenboom (Bilingual English/CES) profile fidelity', () => {
        const eduard = patients.find(p => p.id === 'rva341');
        const exp = ARCHETYPE_EXPECTATIONS.rva341;
        assert.ok(eduard);
        assert.equal(eduard.code, exp.code);
        assert.equal(eduard.companionName, 'Marcelle Cameron');
        assert.equal(eduard.advanceTotal.units, exp.advanceCOP);
    });

    await t.test('5. RVA077 Alejandra Rumai (12-day extensive surgery journey) profile fidelity', () => {
        const rumai = patients.find(p => p.id === 'rva077');
        const exp = ARCHETYPE_EXPECTATIONS.rva077;
        assert.ok(rumai);
        assert.equal(rumai.code, exp.code);
        assert.equal(rumai.hotel, exp.hotel);
        assert.equal(rumai.advanceTotal.units, exp.advanceCOP);
    });

    await t.test('6. Initial events dataset is populated and references valid patient IDs', () => {
        assert.ok(initialEvents.length >= 7, 'Must have at least 7 operational initial events');
        for (const evt of initialEvents) {
            assert.ok(evt.id, 'Event must have ID');
            assert.ok(evt.title, 'Event must have Title');
            assert.ok(evt.startDateTime instanceof Date, 'startDateTime must be Date');
            assert.ok(evt.endDateTime instanceof Date, 'endDateTime must be Date');
            assert.ok(patients.some(p => p.id === evt.patientId), `Event patientId ${evt.patientId} must match a patient`);
        }
    });
});
