import { DomainError } from '../errors/domain-error.js';

/**
 * Immutable Geolocation Coordinate Value Object with Haversine distance calculation and Geofence checks.
 */
export class LocationCoordinate {
  /** @type {number} */
  #lat;
  /** @type {number} */
  #lng;
  /** @type {string} */
  #name;
  /** @type {string} */
  #address;
  /** @type {number} */
  #geofenceRadiusMeters;

  /**
   * @param {object} params
   * @param {number} params.lat - Latitude (-90 to 90)
   * @param {number} params.lng - Longitude (-180 to 180)
   * @param {string} [params.name=''] - Name of clinic, hotel, airport, or POI
   * @param {string} [params.address=''] - Physical street address
   * @param {number} [params.geofenceRadiusMeters=150] - Geofence radius in meters for GPS check-in
   */
  constructor({ lat, lng, name = '', address = '', geofenceRadiusMeters = 150 } = {}) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      throw new DomainError(`[Coordenada Inválida] Latitud inválida: '${lat}'. Debe estar entre -90 y 90.`);
    }

    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      throw new DomainError(`[Coordenada Inválida] Longitud inválida: '${lng}'. Debe estar entre -180 y 180.`);
    }

    const parsedRadius = Number(geofenceRadiusMeters);
    if (isNaN(parsedRadius) || parsedRadius <= 0) {
      throw new DomainError(`[Geofence Inválido] Radio de geocerca inválido: '${geofenceRadiusMeters}'. Debe ser positivo.`);
    }

    this.#lat = parsedLat;
    this.#lng = parsedLng;
    this.#name = String(name || '').trim();
    this.#address = String(address || '').trim();
    this.#geofenceRadiusMeters = parsedRadius;

    Object.freeze(this);
  }

  /** @returns {number} */
  get lat() {
    return this.#lat;
  }

  /** @returns {number} */
  get lng() {
    return this.#lng;
  }

  /** @returns {string} */
  get name() {
    return this.#name;
  }

  /** @returns {string} */
  get address() {
    return this.#address;
  }

  /** @returns {number} */
  get geofenceRadiusMeters() {
    return this.#geofenceRadiusMeters;
  }

  /**
   * Calculates Haversine great-circle distance to another coordinate in meters.
   * @param {LocationCoordinate | { lat: number, lng: number }} otherCoord
   * @returns {number} Distance in meters
   */
  distanceTo(otherCoord) {
    if (!otherCoord || typeof otherCoord.lat !== 'number' || typeof otherCoord.lng !== 'number') {
      throw new DomainError(`[Coordenada Inválida] Coordenada de destino inválida para cálculo de distancia.`);
    }

    const R = 6371000; // Earth mean radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const lat1 = toRad(this.#lat);
    const lon1 = toRad(this.#lng);
    const lat2 = toRad(otherCoord.lat);
    const lon2 = toRad(otherCoord.lng);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Checks if another coordinate is within this location's geofence radius.
   * @param {LocationCoordinate | { lat: number, lng: number }} otherCoord
   * @param {number} [customRadiusMeters]
   * @returns {boolean}
   */
  isWithinGeofence(otherCoord, customRadiusMeters) {
    const radius = customRadiusMeters !== undefined ? Number(customRadiusMeters) : this.#geofenceRadiusMeters;
    const dist = this.distanceTo(otherCoord);
    return dist <= radius;
  }

  /**
   * Checks equality with another coordinate.
   * @param {LocationCoordinate} other
   * @returns {boolean}
   */
  equals(other) {
    if (!other || !(other instanceof LocationCoordinate)) return false;
    return (
      Math.abs(this.#lat - other.lat) < 1e-7 &&
      Math.abs(this.#lng - other.lng) < 1e-7 &&
      this.#name === other.name
    );
  }

  /**
   * @returns {{ lat: number, lng: number, name: string, address: string, geofenceRadiusMeters: number }}
   */
  toJSON() {
    return {
      lat: this.#lat,
      lng: this.#lng,
      name: this.#name,
      address: this.#address,
      geofenceRadiusMeters: this.#geofenceRadiusMeters
    };
  }

  /**
   * @returns {string}
   */
  toString() {
    return `${this.#name ? this.#name + ' ' : ''}(${this.#lat.toFixed(6)}, ${this.#lng.toFixed(6)})`;
  }
}
