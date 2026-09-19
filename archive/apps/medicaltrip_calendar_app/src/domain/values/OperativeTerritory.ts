import { NonOperativeTerritoryError } from '../errors/DomainErrors';
import { Coordinates } from './Coordinates';

export const ALLOWED_CANONICAL_CORRIDORS = Object.freeze([
  'MEDELLIN',
  'RIONEGRO',
  'ENVIGADO',
  'SABANETA',
  'ITAGUI',
  'BELLO',
  'MANIZALES',
  'PEREIRA',
  'BOGOTA',
]);

export const CORRIDOR_MAP: Record<string, string> = {
  // RIONEGRO corridor
  RIONEGRO: 'RIONEGRO',
  JMC: 'RIONEGRO',
  LLANOGRANDE: 'RIONEGRO',

  // ENVIGADO corridor
  ENVIGADO: 'ENVIGADO',
  VILLA_ANITA: 'ENVIGADO',

  // SABANETA
  SABANETA: 'SABANETA',

  // ITAGUI
  ITAGUI: 'ITAGUI',

  // BELLO
  BELLO: 'BELLO',

  // MANIZALES
  MANIZALES: 'MANIZALES',

  // PEREIRA
  PEREIRA: 'PEREIRA',

  // BOGOTA
  BOGOTA: 'BOGOTA',
  EL_DORADO: 'BOGOTA',

  // MEDELLIN and subsectors
  CIUDAD_DEL_RIO: 'MEDELLIN',
  PRADO_CENTRO: 'MEDELLIN',
  TORRE_MEDICA: 'MEDELLIN',
  CARDIO_VID: 'MEDELLIN',
  CARDIOVID: 'MEDELLIN',
  CRUZ_VERDE: 'MEDELLIN',
  SANTA_FE: 'MEDELLIN',
  POBLADO: 'MEDELLIN',
  LAURELES: 'MEDELLIN',
  ROBLEDO: 'MEDELLIN',
  OVIEDO: 'MEDELLIN',
  CIMA: 'MEDELLIN',
  CLOFAN: 'MEDELLIN',
  HPTU: 'MEDELLIN',
  ECHAVARRIA: 'MEDELLIN',
  PASTEUR: 'MEDELLIN',
  LOCATEL: 'MEDELLIN',
  OCAZIONEZ: 'MEDELLIN',
  BOLIVARIANA: 'MEDELLIN',
  NOVELTY: 'MEDELLIN',
  INNTU: 'MEDELLIN',
  PARK_42: 'MEDELLIN',
  PARK42: 'MEDELLIN',
  TESORO: 'MEDELLIN',
  PRADO: 'MEDELLIN',
  BELEN: 'MEDELLIN',
  ESTADIO: 'MEDELLIN',
  MEDELLIN: 'MEDELLIN',
};

export const VALID_OPERATIVE_CORRIDORS = Object.freeze(Object.keys(CORRIDOR_MAP));

export const FORBIDDEN_NON_OPERATIVE_ZONES = Object.freeze([
  'MOCOA',
  'LETICIA',
  'AMAZONAS',
  'TUMACO',
  'NARINO',
  'ARAUCA',
  'GUAVIARE',
  'MITU',
  'VAUPES',
  'INIRIDA',
  'GUAINIA',
  'PUERTO_CARRENO',
  'VICHADA',
  'CHOCO',
  'LA_GUAJIRA',
  'PUTUMAYO'
]);

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  name: string;
}

export const OPERATIVE_BOUNDING_BOXES: readonly BoundingBox[] = Object.freeze([
  { name: 'ANTIOQUIA_CENTRAL', minLat: 5.90, maxLat: 6.50, minLng: -75.80, maxLng: -75.30 },
  { name: 'MANIZALES_CALDAS', minLat: 4.95, maxLat: 5.20, minLng: -75.60, maxLng: -75.40 },
  { name: 'PEREIRA_RISARALDA', minLat: 4.70, maxLat: 4.95, minLng: -75.80, maxLng: -75.60 },
  { name: 'BOGOTA_DC', minLat: 4.45, maxLat: 4.85, minLng: -74.25, maxLng: -73.95 },
]);

/**
 * OperativeTerritory Value Object
 * Enforces fail-fast domain invariants rejecting any address, name or coordinates outside
 * authorized Medical Trip Colombia operational corridors.
 */
export class OperativeTerritory {
  readonly rawName: string;
  readonly normalizedName: string;
  readonly canonicalCorridor: string;
  readonly coordinates: Coordinates | null;

  constructor(
    locationOrDescriptor: string | { name: string; coordinates?: { latitude: number; longitude: number } | Coordinates }
  ) {
    const raw = typeof locationOrDescriptor === 'string' ? locationOrDescriptor : locationOrDescriptor.name;
    const normalized = OperativeTerritory.normalizeName(raw);

    // 1. Fail-fast check against strictly forbidden zones
    OperativeTerritory.assertNotForbidden(normalized, raw);

    // 2. Validate against approved corridors (if non-empty)
    const matchedCorridor = OperativeTerritory.resolveCorridor(normalized);
    if (!matchedCorridor && normalized.length > 0) {
      throw new NonOperativeTerritoryError(
        raw,
        `[Zona No Autorizada]: '${raw}' no coincide con los corredores aprobados (Medellín, Rionegro, Envigado, Sabaneta, Itagüí, Bello, Manizales, Pereira, Bogotá).`
      );
    }

    this.rawName = raw.trim() || 'Medellín (Ubicación General)';
    this.normalizedName = normalized;
    this.canonicalCorridor = matchedCorridor || 'MEDELLIN';

    // 3. Validate coordinates if provided
    let coords: Coordinates | null = null;
    if (typeof locationOrDescriptor === 'object' && locationOrDescriptor.coordinates) {
      const rawCoords = locationOrDescriptor.coordinates;
      coords = rawCoords instanceof Coordinates
        ? rawCoords
        : new Coordinates(rawCoords.latitude, rawCoords.longitude);

      OperativeTerritory.assertCoordinatesInCorridor(coords, raw);
    }
    this.coordinates = coords;

    Object.freeze(this);
  }

  static fromCoordinates(coords: Coordinates, name = 'Punto GPS'): OperativeTerritory {
    return new OperativeTerritory({ name, coordinates: coords });
  }

  get name(): string {
    return this.rawName;
  }

  static normalizeName(name: string): string {
    return String(name || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  static assertNotForbidden(normalized: string, original: string): void {
    for (const forbidden of FORBIDDEN_NON_OPERATIVE_ZONES) {
      if (normalized.includes(forbidden)) {
        throw new NonOperativeTerritoryError(
          original,
          `[Violación Geoespacial]: La ubicación '${original}' está en una zona no operativa prohibida (${forbidden}). Operación denegada de forma inmediata.`
        );
      }
    }
  }

  static resolveCorridor(normalized: string): string | null {
    for (const [key, canonical] of Object.entries(CORRIDOR_MAP)) {
      if (normalized.includes(key)) {
        return canonical;
      }
    }
    // Default fallback if generic medical, hotel, pharmacy or transport keywords in Medellín
    if (
      normalized.includes('CLINICA') ||
      normalized.includes('HOSPITAL') ||
      normalized.includes('HOTEL') ||
      normalized.includes('AEROPUERTO') ||
      normalized.includes('CONSULTORIO') ||
      normalized.includes('LABORATORIO') ||
      normalized.includes('FARMACIA') ||
      normalized.includes('DROGUERIA') ||
      normalized.includes('DIAGNOSTICO') ||
      normalized.includes('QUIRURG') ||
      normalized.includes('APARTAMENTO') ||
      normalized.includes('TRASLADO') ||
      normalized.includes('SOTANO') ||
      normalized.includes('PARQUEADERO')
    ) {
      return 'MEDELLIN';
    }
    return null;
  }

  static assertCoordinatesInCorridor(coords: Coordinates, locationName: string): void {
    const isInAnyBox = OPERATIVE_BOUNDING_BOXES.some(
      (box) =>
        coords.latitude >= box.minLat &&
        coords.latitude <= box.maxLat &&
        coords.longitude >= box.minLng &&
        coords.longitude <= box.maxLng
    );

    if (!isInAnyBox) {
      throw new NonOperativeTerritoryError(
        locationName,
        `[Violación Bounding Box Geoespacial]: Las coordenadas (${coords.latitude}, ${coords.longitude}) para '${locationName}' están fuera de los corredores habilitados.`
      );
    }
  }

  toJSON(): { rawName: string; canonicalCorridor: string; coordinates: { latitude: number; longitude: number } | null } {
    return {
      rawName: this.rawName,
      canonicalCorridor: this.canonicalCorridor,
      coordinates: this.coordinates ? this.coordinates.toJSON() : null,
    };
  }
}
