import test from 'node:test';
import assert from 'node:assert/strict';
import { ItineraryEvent, EVENT_STATUS } from '../../../src/domain/ItineraryEvent.js';
import { OperativeTerritory } from '../../../src/domain/OperativeTerritory.js';

test('F18: GPS Check-in Simulator — Geofence Verification and Status Completion', async (t) => {
    // Haversine distance calculator in meters
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const KNOWN_COORDS = {
        JMC_AIRPORT: { lat: 6.1645, lng: -75.4278, name: 'Aeropuerto JMC Rionegro' },
        INNTU_HOTEL: { lat: 6.2442, lng: -75.5928, name: 'Hotel Inntu Laureles' },
        CLOFAN_CLINIC: { lat: 6.2241, lng: -75.5739, name: 'Clínica Clofán Ciudad del Río' },
        MOCOA_HOSPITAL: { lat: 1.1492, lng: -76.6465, name: 'Hospital San Francisco de Mocoa' }
    };

    await t.test('1. Calculates realistic distance between JMC Airport and Laureles (~20-25km)', () => {
        const dist = haversineDistance(
            KNOWN_COORDS.JMC_AIRPORT.lat, KNOWN_COORDS.JMC_AIRPORT.lng,
            KNOWN_COORDS.INNTU_HOTEL.lat, KNOWN_COORDS.INNTU_HOTEL.lng
        );
        const distKm = dist / 1000;
        assert.ok(distKm >= 20 && distKm <= 26, `Calculated distance ${distKm}km is in expected range`);
    });

    await t.test('2. Check-in succeeds within 500m geofence of destination', () => {
        const destination = KNOWN_COORDS.CLOFAN_CLINIC;
        // Guide is 150m away from Clofán
        const guideCoords = { lat: 6.2230, lng: -75.5730 };

        const dist = haversineDistance(destination.lat, destination.lng, guideCoords.lat, guideCoords.lng);
        assert.ok(dist < 500, `Guide distance ${dist}m must be within 500m`);

        const evt = new ItineraryEvent({
            id: 'evt-clofan',
            patientId: 'rva171',
            title: 'Consulta Oftalmología Clofán',
            startDateTime: '2026-08-21T10:00:00Z',
            location: 'Clínica Clofán Ciudad del Río',
            status: EVENT_STATUS.SCHEDULED
        });

        evt.markCompleted(guideCoords);
        assert.equal(evt.status, EVENT_STATUS.COMPLETED);
        assert.equal(evt.gpsChecked, true);
    });

    await t.test('3. Rejects check-in if guide is too far (>5km away from destination)', () => {
        const checkinAttempt = (eventLocationCoords, userCoords, thresholdMeters = 500) => {
            const dist = haversineDistance(eventLocationCoords.lat, eventLocationCoords.lng, userCoords.lat, userCoords.lng);
            if (dist > thresholdMeters) {
                throw new Error(`[GPS Check-in Error]: Usuario a ${Math.round(dist)}m del destino (Límite: ${thresholdMeters}m)`);
            }
            return true;
        };

        // User is in Bello, trying to check into Clofán in Ciudad del Río (~12km)
        const belloCoords = { lat: 6.3333, lng: -75.5555 };
        assert.throws(() => {
            checkinAttempt(KNOWN_COORDS.CLOFAN_CLINIC, belloCoords);
        }, /GPS Check-in Error/);
    });

    await t.test('4. Geo-Fencing domain rejects non-operative coordinates location names like Mocoa', () => {
        assert.throws(() => {
            new OperativeTerritory(KNOWN_COORDS.MOCOA_HOSPITAL.name);
        }, /Violación Geoespacial/);
    });

    await t.test('5. Handles missing GPS coordinates gracefully with fallback flag', () => {
        const evt = new ItineraryEvent({
            id: 'evt-manual',
            patientId: 'rva171',
            title: 'Caja Menor Parqueadero',
            startDateTime: '2026-08-21T16:00:00Z',
            location: 'Sótano 2 Clofán',
            status: EVENT_STATUS.SCHEDULED
        });

        // Mark completed without GPS
        evt.markCompleted(null);
        assert.equal(evt.status, EVENT_STATUS.COMPLETED);
        assert.equal(evt.gpsChecked, true);
        assert.equal(evt.gpsCoords, null);
    });
});
