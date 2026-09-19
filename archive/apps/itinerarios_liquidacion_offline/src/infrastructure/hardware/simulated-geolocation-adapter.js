import { IGeolocationPort } from '../../domain/ports/geolocation-port.js';
import { LocationCoordinate } from '../../domain/value-objects/location-coordinate.js';
import { DomainError } from '../../domain/errors/domain-error.js';

/**
 * Catalog of canonical medical and operational coordinates in Medellín and Rionegro.
 */
export const KNOWN_OPERATIONAL_LOCATIONS = Object.freeze({
  CLINICA_EL_ROSARIO_TESORO: {
    lat: 6.2088,
    lng: -75.5678,
    name: 'Clínica El Rosario - Sede El Tesoro',
    address: 'Cra 20 # 2Sur-185, El Poblado, Medellín',
    geofenceRadiusMeters: 200
  },
  CLINICA_CLOFAN: {
    lat: 6.2206,
    lng: -75.5714,
    name: 'Clínica Clofán (Oftalmología)',
    address: 'Cra 48 # 19A-40, Ciudad del Río, Medellín',
    geofenceRadiusMeters: 150
  },
  CLINICA_CARDIO_VID: {
    lat: 6.2754,
    lng: -75.5684,
    name: 'Clínica Cardio VID',
    address: 'Calle 78B # 75-86, Robledo, Medellín',
    geofenceRadiusMeters: 250
  },
  CLINICA_CES_ROBLEDO: {
    lat: 6.2731,
    lng: -75.5892,
    name: 'Clínica CES Robledo',
    address: 'Calle 58 # 67-07, Robledo, Medellín',
    geofenceRadiusMeters: 200
  },
  HOSPITAL_PABLO_TOBON_URIBE: {
    lat: 6.275819,
    lng: -75.589833,
    name: 'Hospital Pablo Tobón Uribe (HPTU)',
    address: 'Calle 78B # 69-240, Robledo, Medellín',
    geofenceRadiusMeters: 300
  },
  CLINICA_MEDELLIN_POBLADO: {
    lat: 6.2085,
    lng: -75.5712,
    name: 'Clínica Medellín del Poblado',
    address: 'Calle 7 # 39-290, El Poblado, Medellín',
    geofenceRadiusMeters: 150
  },
  AEROPUERTO_JMC_RIONEGRO: {
    lat: 6.1645,
    lng: -75.4278,
    name: 'Aeropuerto Internacional José María Córdova',
    address: 'Rionegro, Antioquia',
    geofenceRadiusMeters: 500
  },
  HOTEL_POBLADO_PLAZA: {
    lat: 6.2045,
    lng: -75.5732,
    name: 'Hotel Poblado Plaza',
    address: 'Cra 43A # 4 Sur-75, El Poblado, Medellín',
    geofenceRadiusMeters: 100
  },
  HOTEL_DIEZ_POBLADO: {
    lat: 6.2089,
    lng: -75.5662,
    name: 'Hotel Diez Categoría Colombia',
    address: 'Calle 10A # 34-11, El Poblado, Medellín',
    geofenceRadiusMeters: 100
  }
});

/**
 * Simulated Geolocation Hardware Adapter (Tier 2/3 Hardware Gateway).
 * Implements IGeolocationPort with real navigator.geolocation support,
 * customizable field GPS simulation overrides, route replay, and Haversine geofence calculations.
 */
export class SimulatedGeolocationAdapter extends IGeolocationPort {
  /**
   * @param {object} [options]
   * @param {LocationCoordinate | { lat: number, lng: number, name?: string }} [options.initialLocation]
   * @param {boolean} [options.preferHardwareGps=false]
   */
  constructor(options = {}) {
    super();
    this.preferHardwareGps = Boolean(options.preferHardwareGps);

    // Default simulation position: Hotel Poblado Plaza, Medellín
    const init = options.initialLocation || KNOWN_OPERATIONAL_LOCATIONS.HOTEL_POBLADO_PLAZA;
    this._currentLocation = init instanceof LocationCoordinate ? init : new LocationCoordinate(init);

    this._watchers = new Map();
    this._nextWatcherId = 1;
    this._hardwareWatchId = null;
  }

  /**
   * Returns dictionary of canonical known medical/travel coordinates.
   */
  getKnownLocations() {
    return KNOWN_OPERATIONAL_LOCATIONS;
  }

  /**
   * Overrides current simulated location manually.
   * Notifies all active watchPosition listeners.
   * @param {LocationCoordinate | { lat: number, lng: number, name?: string, address?: string, geofenceRadiusMeters?: number }} coord
   */
  setSimulatedLocation(coord) {
    if (!coord) {
      throw new DomainError('[GPS Adapter] Coordenada inválida para simulación.');
    }
    this._currentLocation = coord instanceof LocationCoordinate ? coord : new LocationCoordinate(coord);
    this._notifyWatchers(this._currentLocation);
  }

  /**
   * Gets current location coordinate value object.
   * @returns {LocationCoordinate}
   */
  getSimulatedLocation() {
    return this._currentLocation;
  }

  /**
   * Reads current GPS location from hardware / simulator.
   * @returns {Promise<LocationCoordinate>}
   */
  async getCurrentPosition() {
    if (this.preferHardwareGps && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        const hardwareCoord = new LocationCoordinate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'Hardware GPS Reading',
          geofenceRadiusMeters: Math.max(50, Math.round(pos.coords.accuracy || 50))
        });
        this._currentLocation = hardwareCoord;
        return hardwareCoord;
      } catch {
        // Fallback to simulated location if hardware GPS unavailable or denied
      }
    }

    return this._currentLocation;
  }

  /**
   * Watches GPS coordinate changes.
   * @param {(coord: LocationCoordinate) => void} callback
   * @returns {() => void} Stop watching function
   */
  watchPosition(callback) {
    if (typeof callback !== 'function') {
      throw new DomainError('[GPS Adapter] callback debe ser una función.');
    }

    const id = this._nextWatcherId++;
    this._watchers.set(id, callback);

    // Initial trigger with current location
    callback(this._currentLocation);

    // Hardware GPS watching if enabled
    if (this.preferHardwareGps && typeof navigator !== 'undefined' && navigator.geolocation && !this._hardwareWatchId) {
      this._hardwareWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coord = new LocationCoordinate({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Hardware GPS Live Watch'
          });
          this._currentLocation = coord;
          this._notifyWatchers(coord);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }

    return () => {
      this._watchers.delete(id);
      if (this._watchers.size === 0 && this._hardwareWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this._hardwareWatchId);
        this._hardwareWatchId = null;
      }
    };
  }

  /**
   * Computes Haversine distance between two coordinates in meters.
   * @param {LocationCoordinate | { lat: number, lng: number }} from
   * @param {LocationCoordinate | { lat: number, lng: number }} to
   * @returns {number} Distance in meters
   */
  calculateDistance(from, to) {
    const p1 = from instanceof LocationCoordinate ? from : new LocationCoordinate(from);
    return p1.distanceTo(to);
  }

  /**
   * Verifies if target coordinate falls within center's geofence radius.
   * @param {LocationCoordinate | { lat: number, lng: number }} targetCoord
   * @param {LocationCoordinate | { lat: number, lng: number, geofenceRadiusMeters?: number }} centerCoord
   * @param {number} [overrideRadiusMeters]
   * @returns {boolean}
   */
  isWithinGeofence(targetCoord, centerCoord, overrideRadiusMeters) {
    const center = centerCoord instanceof LocationCoordinate ? centerCoord : new LocationCoordinate(centerCoord);
    const radius = overrideRadiusMeters !== undefined ? overrideRadiusMeters : center.geofenceRadiusMeters;
    const distance = center.distanceTo(targetCoord);
    return distance <= radius;
  }

  /**
   * Simulates moving along an itinerary route (e.g. Airport -> Hotel -> Clinic).
   * @param {Array<LocationCoordinate | { lat: number, lng: number, name?: string }>} waypoints
   * @param {number} [stepIntervalMs=500]
   * @param {(stepCoord: LocationCoordinate, stepIndex: number) => void} [onStep]
   * @returns {Promise<void>}
   */
  async simulateRoute(waypoints = [], stepIntervalMs = 500, onStep = null) {
    if (!Array.isArray(waypoints) || waypoints.length === 0) return;

    for (let i = 0; i < waypoints.length; i++) {
      const wp = waypoints[i];
      this.setSimulatedLocation(wp);
      if (typeof onStep === 'function') {
        onStep(this._currentLocation, i);
      }
      if (stepIntervalMs > 0 && i < waypoints.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, stepIntervalMs));
      }
    }
  }

  /**
   * @private
   */
  _notifyWatchers(coord) {
    for (const callback of this._watchers.values()) {
      try {
        callback(coord);
      } catch {
        // Suppress watcher errors
      }
    }
  }
}
