import { describe, it, expect } from 'vitest';
import { OperativeTerritory } from '../../../src/domain/values/OperativeTerritory';
import { Coordinates } from '../../../src/domain/values/Coordinates';
import { NonOperativeTerritoryError } from '../../../src/domain/errors/DomainErrors';

describe('OperativeTerritory — Fail-Fast Geo-Fencing Domain Invariant', () => {
  describe('Approved Operational Corridors', () => {
    it('accepts authorized medical locations in Medellín', () => {
      const t1 = new OperativeTerritory('Clínica Clofán Ciudad del Río');
      expect(t1.name).toBe('Clínica Clofán Ciudad del Río');
      expect(t1.canonicalCorridor).toBe('MEDELLIN');

      const t2 = new OperativeTerritory('Hotel Inntu Laureles');
      expect(t2.name).toBe('Hotel Inntu Laureles');
      expect(t2.canonicalCorridor).toBe('MEDELLIN');

      const t3 = new OperativeTerritory('Hospital Pablo Tobón Uribe Robledo');
      expect(t3.name).toBe('Hospital Pablo Tobón Uribe Robledo');
      expect(t3.canonicalCorridor).toBe('MEDELLIN');

      const t4 = new OperativeTerritory('Edificio Park 42 Poblado');
      expect(t4.name).toBe('Edificio Park 42 Poblado');
      expect(t4.canonicalCorridor).toBe('MEDELLIN');
    });

    it('accepts Rionegro JMC airport corridor', () => {
      const t = new OperativeTerritory('Aeropuerto Internacional JMC Rionegro');
      expect(t.canonicalCorridor).toBe('RIONEGRO');
    });

    it('accepts metropolitan south and regional medical corridors (Envigado, Sabaneta, Manizales, Pereira, Bogotá)', () => {
      expect(new OperativeTerritory('Villa Anita Envigado').canonicalCorridor).toBe('ENVIGADO');
      expect(new OperativeTerritory('Casa de Recuperación Sabaneta').canonicalCorridor).toBe('SABANETA');
      expect(new OperativeTerritory('Sede Médica Manizales').canonicalCorridor).toBe('MANIZALES');
      expect(new OperativeTerritory('Clínica Pereira').canonicalCorridor).toBe('PEREIRA');
      expect(new OperativeTerritory('Aeropuerto El Dorado Bogotá').canonicalCorridor).toBe('BOGOTA');
    });
  });

  describe('Prohibited Non-Operative Zones (Fail-Fast Invariant Violation)', () => {
    it('fails fast on MOCOA (Putumayo) with NonOperativeTerritoryError', () => {
      expect(() => {
        new OperativeTerritory('Hospital San Francisco de Mocoa');
      }).toThrow(NonOperativeTerritoryError);

      expect(() => {
        new OperativeTerritory('Mocoa Duván Medical Center');
      }).toThrow(NonOperativeTerritoryError);
    });

    it('fails fast on LETICIA and AMAZONAS', () => {
      expect(() => {
        new OperativeTerritory('Hotel Decameron Leticia Amazonas');
      }).toThrow(NonOperativeTerritoryError);
    });

    it('fails fast on other prohibited non-operative territories (Tumaco, Arauca, Guaviare, Mitú, Inírida, Chocó)', () => {
      expect(() => new OperativeTerritory('Tumaco Nariño')).toThrow(NonOperativeTerritoryError);
      expect(() => new OperativeTerritory('Hospital San Vicente Arauca')).toThrow(NonOperativeTerritoryError);
      expect(() => new OperativeTerritory('San José del Guaviare')).toThrow(NonOperativeTerritoryError);
      expect(() => new OperativeTerritory('Mitú Vaupés')).toThrow(NonOperativeTerritoryError);
      expect(() => new OperativeTerritory('Puerto Inírida Guainía')).toThrow(NonOperativeTerritoryError);
      expect(() => new OperativeTerritory('Quibdó Chocó')).toThrow(NonOperativeTerritoryError);
    });
  });

  describe('Geospatial Coordinate Bounding Box Validation', () => {
    it('accepts coordinates within Medellín / Rionegro central corridor', () => {
      // JMC Airport: lat 6.1645, lng -75.4267
      const jmcCoords = new Coordinates(6.1645, -75.4267);
      const territory = new OperativeTerritory({
        name: 'Aeropuerto JMC',
        coordinates: jmcCoords,
      });
      expect(territory.coordinates?.latitude).toBe(6.1645);
      expect(territory.coordinates?.longitude).toBe(-75.4267);
    });

    it('fails fast when coordinates belong to Mocoa (lat 1.15, lng -76.65)', () => {
      const mocoaCoords = new Coordinates(1.15, -76.65);
      expect(() => {
        new OperativeTerritory({
          name: 'Punto Geoespacial',
          coordinates: mocoaCoords,
        });
      }).toThrow(NonOperativeTerritoryError);
    });
  });
});
