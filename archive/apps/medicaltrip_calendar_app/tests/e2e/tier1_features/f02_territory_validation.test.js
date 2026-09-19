import test from 'node:test';
import assert from 'node:assert/strict';
import { OperativeTerritory } from '../../../src/domain/OperativeTerritory.js';

test('F02: OperativeTerritory — Geo-Fencing Fail-Fast Validation', async (t) => {
    await t.test('1. Authorizes valid medical corridor locations in Antioquia', () => {
        const validSpots = [
            'Clínica Clofán Ciudad del Río',
            'Hotel Inntu Laureles',
            'Aeropuerto JMC Rionegro',
            'CIMA Ayudas Diagnósticas Poblado',
            'Clínica CES Sede Oviedo',
            'Hospital Pablo Tobón Uribe Robledo',
            'Envigado Centro Médico',
            'Sabaneta Mayorca'
        ];

        for (const spot of validSpots) {
            const territory = new OperativeTerritory(spot);
            assert.equal(territory.name, spot);
        }
    });

    await t.test('2. Gracefully handles null / undefined / empty string with default territory', () => {
        const tEmpty = new OperativeTerritory('');
        assert.equal(tEmpty.name, 'Medellín (Ubicación General)');

        const tNull = new OperativeTerritory(null);
        assert.equal(tNull.name, 'Medellín (Ubicación General)');

        const tUndef = new OperativeTerritory(undefined);
        assert.equal(tUndef.name, 'Medellín (Ubicación General)');
    });

    await t.test('3. Rejects Mocoa and Putumayo with DomainError', () => {
        assert.throws(() => {
            new OperativeTerritory('Hospital San Francisco de Mocoa');
        }, /Violación Geoespacial/);

        assert.throws(() => {
            new OperativeTerritory('Putumayo Centro de Salud');
        }, /Violación Geoespacial/);
    });

    await t.test('4. Rejects Leticia and Amazonas with DomainError', () => {
        assert.throws(() => {
            new OperativeTerritory('Leticia Amazonas Aeropuerto');
        }, /Violación Geoespacial/);

        assert.throws(() => {
            new OperativeTerritory('Amazonas Selva Lodge');
        }, /Violación Geoespacial/);
    });

    await t.test('5. Rejects Arauca and Guaviare with DomainError', () => {
        assert.throws(() => {
            new OperativeTerritory('Arauca Hospital San Vicente');
        }, /Violación Geoespacial/);

        assert.throws(() => {
            new OperativeTerritory('San José del Guaviare');
        }, /Violación Geoespacial/);
    });

    await t.test('6. Invariant enforces uppercase case-insensitivity on forbidden zones', () => {
        assert.throws(() => {
            new OperativeTerritory('clinica regional mocoa sur');
        }, /Violación Geoespacial/);

        assert.throws(() => {
            new OperativeTerritory('hotel leticia plaza');
        }, /Violación Geoespacial/);
    });
});
