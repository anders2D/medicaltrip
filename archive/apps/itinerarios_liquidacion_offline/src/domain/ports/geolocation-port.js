import { DomainError } from '../errors/domain-error.js';

/**
 * Abstract Port: IGeolocationPort
 * Hardware gateway for device GPS position readings and geofencing.
 */
export class IGeolocationPort {
  /**
   * Reads current GPS location from hardware / navigator.geolocation / simulator.
   * @returns {Promise<import('../value-objects/location-coordinate.js').LocationCoordinate>}
   */
  async getCurrentPosition() {
    throw new DomainError('[IGeolocationPort] getCurrentPosition no ha sido implementado en el adaptador.');
  }

  /**
   * Watches GPS coordinate changes.
   * @param {(coord: import('../value-objects/location-coordinate.js').LocationCoordinate) => void} callback
   * @returns {() => void} Stop watching function
   */
  watchPosition(_callback) {
    throw new DomainError('[IGeolocationPort] watchPosition no ha sido implementado en el adaptador.');
  }

  /**
   * Computes Haversine distance between two coordinates in meters.
   * @param {import('../value-objects/location-coordinate.js').LocationCoordinate} _from
   * @param {import('../value-objects/location-coordinate.js').LocationCoordinate} _to
   * @returns {number} Distance in meters
   */
  calculateDistance(_from, _to) {
    throw new DomainError('[IGeolocationPort] calculateDistance no ha sido implementado en el adaptador.');
  }
}
