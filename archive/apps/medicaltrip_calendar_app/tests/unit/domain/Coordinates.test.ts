import { describe, it, expect } from 'vitest';
import { Coordinates } from '../../../src/domain/values/Coordinates';
import { InvariantViolationError } from '../../../src/domain/errors/DomainErrors';

describe('Coordinates Value Object & Haversine Distance Engine', () => {
  it('instantiates valid WGS-84 coordinates', () => {
    const coords = new Coordinates(6.2088, -75.5678);
    expect(coords.latitude).toBe(6.2088);
    expect(coords.longitude).toBe(-75.5678);
  });

  it('throws InvariantViolationError for out-of-range latitude and longitude', () => {
    expect(() => new Coordinates(95, -75.56)).toThrow(InvariantViolationError);
    expect(() => new Coordinates(-95, -75.56)).toThrow(InvariantViolationError);
    expect(() => new Coordinates(6.20, 185)).toThrow(InvariantViolationError);
    expect(() => new Coordinates(6.20, -185)).toThrow(InvariantViolationError);
  });

  it('accurately calculates Haversine distance between Medellín landmarks', () => {
    // JMC Airport (Rionegro): 6.1645, -75.4267
    // Hotel Inntu Laureles: 6.2442, -75.5960
    const jmc = new Coordinates(6.1645, -75.4267);
    const inntu = new Coordinates(6.2442, -75.5960);

    const distanceMeters = jmc.distanceTo(inntu);
    const distanceKm = jmc.distanceInKm(inntu);

    // Straight-line distance between JMC and Laureles is roughly 20-22 km
    expect(distanceKm).toBeGreaterThan(18);
    expect(distanceKm).toBeLessThan(25);
    expect(distanceMeters).toBeCloseTo(distanceKm * 1000, 0);
  });

  it('determines proximity radius correctly', () => {
    // Clofán Ciudad del Río: 6.2255, -75.5745
    // Near Clofán (approx 100 meters away)
    const clofan = new Coordinates(6.2255, -75.5745);
    const nearby = new Coordinates(6.2260, -75.5745); // ~55m away
    const farAway = new Coordinates(6.2500, -75.5900); // >3km away

    expect(clofan.isWithinRadius(nearby, 200)).toBe(true);
    expect(clofan.isWithinRadius(farAway, 200)).toBe(false);
  });
});
