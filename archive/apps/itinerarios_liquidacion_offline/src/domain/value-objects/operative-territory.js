import { GeospatialInvariantViolationError } from '../errors/domain-error.js';

/**
 * Canonical Operative Corridors for Medical Trip Colombia S.A.S.
 */
export const VALID_OPERATIVE_CORRIDORS = Object.freeze([
  'MEDELLIN',
  'RIONEGRO',
  'POBLADO',
  'LAURELES',
  'ROBLEDO',
  'CIUDAD_DEL_RIO',
  'ENVIGADO',
  'SABANETA',
  'BELLO',
  'ITAGUI',
  'MANIZALES',
  'PEREIRA'
]);

/**
 * Forbidden Non-Operative Jurisdictions (Strict Fail-Fast Invariants).
 */
export const FORBIDDEN_NON_OPERATIVE_ZONES = Object.freeze([
  'MOCOA',
  'LETICIA',
  'AMAZONAS',
  'ARAUCA',
  'GUAVIARE',
  'TUMACO',
  'MITU',
  'INIRIDA',
  'PUERTO_CARRENO'
]);

/**
 * Geospatial bounding boxes for valid operative corridors (WGS84 Lat/Lng).
 */
const OPERATIVE_GEO_BOUNDS = [
  // Valle de Aburrá & Oriente Antioqueño (Medellín, Rionegro JMC, Envigado, Sabaneta, Bello, Itagüí)
  {
    name: 'ANTIOQUIA_CENTRAL_CORRIDOR',
    minLat: 5.90,
    maxLat: 6.50,
    minLng: -75.80,
    maxLng: -75.30
  },
  // Manizales (Caldas)
  {
    name: 'MANIZALES_CORRIDOR',
    minLat: 4.95,
    maxLat: 5.20,
    minLng: -75.60,
    maxLng: -75.40
  },
  // Pereira (Risaralda)
  {
    name: 'PEREIRA_CORRIDOR',
    minLat: 4.70,
    maxLat: 4.95,
    minLng: -75.80,
    maxLng: -75.60
  }
];

/**
 * Immutable OperativeTerritory Value Object.
 * Enforces strict geo-fenced boundaries and deterministically rejects non-operative zones.
 */
export class OperativeTerritory {
  /** @type {string} */
  #zoneName;
  /** @type {{ lat: number, lng: number } | null} */
  #coordinates;

  /**
   * @param {string | { zoneName?: string, name?: string, lat?: number, lng?: number }} zoneOrCoords
   */
  constructor(zoneOrCoords) {
    if (!zoneOrCoords) {
      throw new GeospatialInvariantViolationError('NULL', '[Violación de Invariante Geoespacial] Zona no operativa: Indefinida o nula.');
    }

    let rawZone = '';
    let coords = null;

    if (typeof zoneOrCoords === 'string') {
      rawZone = zoneOrCoords;
    } else if (typeof zoneOrCoords === 'object') {
      rawZone = zoneOrCoords.zoneName || zoneOrCoords.name || '';
      if (typeof zoneOrCoords.lat === 'number' && typeof zoneOrCoords.lng === 'number') {
        coords = { lat: Number(zoneOrCoords.lat), lng: Number(zoneOrCoords.lng) };
      }
    }

    const normalizedZone = OperativeTerritory.normalizeZoneName(rawZone);

    // If explicit zone name provided, assert it
    if (normalizedZone) {
      OperativeTerritory.assertOperative(normalizedZone);
      this.#zoneName = normalizedZone;
    } else if (coords) {
      // Deduce zone or validate from coordinates
      if (!OperativeTerritory.isWithinCorridor(coords.lat, coords.lng)) {
        throw new GeospatialInvariantViolationError(
          `(${coords.lat}, ${coords.lng})`,
          `[Violación de Invariante Geoespacial] Zona no operativa: Coordenadas fuera de corredor (${coords.lat}, ${coords.lng})`
        );
      }
      this.#zoneName = OperativeTerritory.resolveZoneFromCoordinates(coords.lat, coords.lng);
    } else {
      throw new GeospatialInvariantViolationError(
        'UNKNOWN',
        '[Violación de Invariante Geoespacial] Zona no operativa: No se proporcionó nombre de zona ni coordenadas válidas.'
      );
    }

    // If coordinates were also provided along with zone name, ensure they match the corridor
    if (coords) {
      if (!OperativeTerritory.isWithinCorridor(coords.lat, coords.lng)) {
        throw new GeospatialInvariantViolationError(
          `${this.#zoneName} (${coords.lat}, ${coords.lng})`,
          `[Violación de Invariante Geoespacial] Zona no operativa: Coordenadas (${coords.lat}, ${coords.lng}) fuera de corredor operativo.`
        );
      }
      this.#coordinates = coords;
    } else {
      this.#coordinates = null;
    }

    Object.freeze(this);
  }

  /** @returns {string} */
  get zoneName() {
    return this.#zoneName;
  }

  /** @returns {{ lat: number, lng: number } | null} */
  get coordinates() {
    return this.#coordinates;
  }

  /**
   * Normalizes zone names to uppercase alphanumeric format.
   * @param {string} rawName
   * @returns {string}
   */
  static normalizeZoneName(rawName) {
    if (!rawName || typeof rawName !== 'string') return '';
    return rawName
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[\s\-_]+/g, '_');
  }

  /**
   * Fail-fast assertion for operative zone name.
   * Throws GeospatialInvariantViolationError if zone is forbidden or not in valid corridors.
   * @param {string} zoneName
   * @returns {boolean} Returns true if operative
   */
  static assertOperative(zoneName) {
    const norm = OperativeTerritory.normalizeZoneName(zoneName);

    // 1. Check forbidden list first (fail-fast)
    for (const forbidden of FORBIDDEN_NON_OPERATIVE_ZONES) {
      if (norm === forbidden || norm.includes(forbidden) || forbidden.includes(norm)) {
        throw new GeospatialInvariantViolationError(
          zoneName,
          `[Violación de Invariante Geoespacial] Zona no operativa: ${zoneName}`
        );
      }
    }

    // 2. Check if it matches any valid operative corridor
    const isValid = VALID_OPERATIVE_CORRIDORS.some(
      (valid) => norm === valid || norm.startsWith(valid) || norm.includes(valid)
    );

    if (!isValid) {
      throw new GeospatialInvariantViolationError(
        zoneName,
        `[Violación de Invariante Geoespacial] Zona no operativa: ${zoneName}`
      );
    }

    return true;
  }

  /**
   * Validates whether a latitude/longitude pair falls within an operative medical corridor.
   * @param {number} lat
   * @param {number} lng
   * @returns {boolean}
   */
  static isWithinCorridor(lat, lng) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) return false;

    // Fail-fast on specific forbidden coordinate centroids (e.g. Mocoa centroid 1.15, -76.65)
    if (Math.abs(parsedLat - 1.15) < 0.5 && Math.abs(parsedLng - (-76.65)) < 0.5) {
      return false; // Mocoa Putumayo
    }
    if (Math.abs(parsedLat - (-4.21)) < 0.5 && Math.abs(parsedLng - (-69.94)) < 0.5) {
      return false; // Leticia Amazonas
    }

    return OPERATIVE_GEO_BOUNDS.some(
      (bound) =>
        parsedLat >= bound.minLat &&
        parsedLat <= bound.maxLat &&
        parsedLng >= bound.minLng &&
        parsedLng <= bound.maxLng
    );
  }

  /**
   * Resolves the primary operative zone name from coordinates.
   * @param {number} lat
   * @param {number} lng
   * @returns {string}
   */
  static resolveZoneFromCoordinates(lat, lng) {
    if (!OperativeTerritory.isWithinCorridor(lat, lng)) {
      throw new GeospatialInvariantViolationError(
        `(${lat}, ${lng})`,
        `[Violación de Invariante Geoespacial] Zona no operativa: Coordenadas (${lat}, ${lng})`
      );
    }

    // Rionegro airport area vs Medellín Valley
    if (lat >= 6.10 && lat <= 6.25 && lng >= -75.48 && lng <= -75.35) {
      return 'RIONEGRO';
    }
    if (lat >= 4.95 && lat <= 5.20 && lng >= -75.60 && lng <= -75.40) {
      return 'MANIZALES';
    }
    if (lat >= 4.70 && lat <= 4.95 && lng >= -75.80 && lng <= -75.60) {
      return 'PEREIRA';
    }
    return 'MEDELLIN';
  }

  /**
   * Validates any zone name, coordinates, or object representation.
   * @param {string | { lat: number, lng: number, zoneName?: string }} zoneOrCoords
   * @returns {boolean}
   */
  static validate(zoneOrCoords) {
    try {
      new OperativeTerritory(zoneOrCoords);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @returns {string}
   */
  toString() {
    return `OperativeTerritory(${this.#zoneName})`;
  }

  /**
   * @returns {{ zoneName: string, coordinates: { lat: number, lng: number } | null }}
   */
  toJSON() {
    return {
      zoneName: this.#zoneName,
      coordinates: this.#coordinates
    };
  }
}
