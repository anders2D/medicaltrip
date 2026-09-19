import { InvariantViolationError } from '../errors/DomainErrors';

/**
 * Coordinates Value Object (WGS-84)
 * Represents a geographical point on earth with Haversine distance calculations.
 */
export class Coordinates {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new InvariantViolationError(`[Coordenadas Inválidas]: Latitud '${latitude}' fuera del rango [-90, 90].`);
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new InvariantViolationError(`[Coordenadas Inválidas]: Longitud '${longitude}' fuera del rango [-180, 180].`);
    }

    this.latitude = latitude;
    this.longitude = longitude;
    Object.freeze(this);
  }

  static fromLatLng(latitude: number, longitude: number): Coordinates {
    return new Coordinates(latitude, longitude);
  }

  /**
   * Calculates the great-circle distance between two points using the Haversine formula.
   * Returns distance in meters.
   */
  distanceTo(other: Coordinates): number {
    const earthRadiusMeters = 6371000; // Mean Earth radius in meters

    const lat1Rad = (this.latitude * Math.PI) / 180;
    const lat2Rad = (other.latitude * Math.PI) / 180;
    const deltaLatRad = ((other.latitude - this.latitude) * Math.PI) / 180;
    const deltaLngRad = ((other.longitude - this.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeters * c;
  }

  /**
   * Returns distance in kilometers.
   */
  distanceInKm(other: Coordinates): number {
    return this.distanceTo(other) / 1000;
  }

  /**
   * Verifies if the point is within a given radius in meters of another point.
   */
  isWithinRadius(other: Coordinates, radiusMeters: number): boolean {
    return this.distanceTo(other) <= radiusMeters;
  }

  equals(other: Coordinates): boolean {
    return (
      Math.abs(this.latitude - other.latitude) < 0.000001 &&
      Math.abs(this.longitude - other.longitude) < 0.000001
    );
  }

  toJSON(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }
}
