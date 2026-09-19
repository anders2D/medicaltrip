/**
 * Medical Trip Colombia S.A.S. - Driver Actor [DRV]
 * Asynchronous Web Worker Actor for route validation, Haversine geofencing,
 * urban and airport fare calculations, and night surcharges.
 */

import { ActorMessage } from '../domain/IActorEventBusPort';

export interface DriverFareRequest {
  tripType: 'AIRPORT_JMC_MEDELLIN' | 'AIRPORT_JMC_RIONEGRO' | 'URBAN_MEDELLIN' | 'URBAN_WAITING' | 'CUSTOM';
  vehicleType?: 'SEDAN' | 'VAN_XL';
  paxCount?: number;
  waitingHours?: number;
  pickupTime?: string; // HH:mm or ISO
  origin: string;
  destination: string;
  distanceKm?: number;
}

export interface DriverFareResult {
  baseFareCOP: number;
  waitingFareCOP: number;
  nightSurchargeCOP: number;
  totalFareCOP: number;
  distanceKm: number;
  isOperative: boolean;
  notes: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DistanceCalculationRequest {
  originName: string;
  originCoords: Coordinates;
  destinationName: string;
  destinationCoords: Coordinates;
}

export interface DistanceCalculationResult {
  originName: string;
  destinationName: string;
  distanceKm: number;
  estimatedMinutes: number;
  isWithinOperativeZone: boolean;
}

export interface RouteValidationRequest {
  origin: string;
  destination: string;
  coordinates?: Coordinates[];
}

export interface RouteValidationResult {
  isValid: boolean;
  prohibitedZoneDetected?: string;
  reason?: string;
}

export type DriverPayload =
  | { action: 'CALCULATE_FARE'; data: DriverFareRequest }
  | { action: 'CALCULATE_DISTANCE'; data: DistanceCalculationRequest }
  | { action: 'VALIDATE_ROUTE'; data: RouteValidationRequest };

export type DriverResult =
  | { action: 'CALCULATE_FARE'; success: boolean; result?: DriverFareResult; error?: string }
  | { action: 'CALCULATE_DISTANCE'; success: boolean; result?: DistanceCalculationResult; error?: string }
  | { action: 'VALIDATE_ROUTE'; success: boolean; result?: RouteValidationResult; error?: string };

const PROHIBITED_ZONES = [
  'MOCOA',
  'LETICIA',
  'TUMACO',
  'ARAUCA',
  'CHOCO',
  'CHOCÓ',
  'MITU',
  'MITÚ',
  'INIRIDA',
  'INÍRIDA',
  'GUAVIARE',
  'SAN JOSE DEL GUAVIARE',
  'PUTUMAYO',
  'AMAZONAS',
];

/**
 * Validates whether an address or zone name contains prohibited/non-operative territories.
 */
export function isProhibitedTerritory(locationText: string): { isProhibited: boolean; matchedZone?: string } {
  const upper = locationText.toUpperCase();
  for (const zone of PROHIBITED_ZONES) {
    if (upper.includes(zone)) {
      return { isProhibited: true, matchedZone: zone };
    }
  }
  return { isProhibited: false };
}

/**
 * Calculates great-circle distance between two coordinates using Haversine formula (in kilometers).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Determines whether a given time has a night surcharge (21:00 to 06:00).
 */
export function isNightShift(timeStr?: string): boolean {
  if (!timeStr) return false;
  let hours = 12;
  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      hours = d.getHours();
    }
  } else if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    hours = parseInt(parts[0], 10);
  }
  return hours >= 21 || hours < 6;
}

/**
 * Core Fare Calculation Engine for Driver Actor.
 */
export function computeDriverFare(req: DriverFareRequest): DriverFareResult {
  const originCheck = isProhibitedTerritory(req.origin);
  const destCheck = isProhibitedTerritory(req.destination);

  if (originCheck.isProhibited || destCheck.isProhibited) {
    const zone = originCheck.matchedZone || destCheck.matchedZone;
    throw new Error(`Zona Prohibida: Operación de transporte restringida en ${zone}`);
  }

  let baseFareCOP = 0;
  const isVan = req.vehicleType === 'VAN_XL' || (req.paxCount && req.paxCount > 4);

  switch (req.tripType) {
    case 'AIRPORT_JMC_MEDELLIN':
      baseFareCOP = isVan ? 160_000 : 145_000;
      break;
    case 'AIRPORT_JMC_RIONEGRO':
      baseFareCOP = isVan ? 85_000 : 65_000;
      break;
    case 'URBAN_MEDELLIN':
      baseFareCOP = isVan ? 60_000 : 45_000;
      break;
    case 'URBAN_WAITING':
      baseFareCOP = 0;
      break;
    case 'CUSTOM':
    default:
      baseFareCOP = req.distanceKm ? Math.max(35_000, Math.round(req.distanceKm * 3_500)) : 45_000;
      break;
  }

  const waitingHours = req.waitingHours || 0;
  const waitingFareCOP = waitingHours * 25_000;

  const hasNightSurcharge = isNightShift(req.pickupTime);
  const nightSurchargeCOP = hasNightSurcharge ? 15_000 : 0;

  const totalFareCOP = baseFareCOP + waitingFareCOP + nightSurchargeCOP;

  return {
    baseFareCOP,
    waitingFareCOP,
    nightSurchargeCOP,
    totalFareCOP,
    distanceKm: req.distanceKm || (req.tripType === 'AIRPORT_JMC_MEDELLIN' ? 24.5 : 8.0),
    isOperative: true,
    notes: `${req.tripType} - ${isVan ? 'Aeroturex Van XL' : 'Sedán Estándar'}${hasNightSurcharge ? ' [Recargo Nocturno 21h-06h]' : ''}`,
  };
}

/**
 * Message Handler for Driver Actor.
 */
export function handleDriverMessage(message: ActorMessage<DriverPayload>): ActorMessage<DriverResult> {
  if (!message || (message as any).type === 'CONNECT_CHANNEL') {
    return {
      id: message?.id || 'SYS_INIT',
      sender: 'DRV_ACTOR',
      recipient: message?.sender || 'MAIN_UI',
      type: 'CHANNEL_CONNECTED',
      payload: { action: 'CONNECT_CHANNEL' as any, success: true, result: null as any },
      timestamp: Date.now(),
    };
  }

  const payload = message.payload;
  if (!payload || !payload.action) {
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'DRV_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'DRIVER_ERROR',
      payload: { action: 'UNKNOWN' as any, success: false, error: 'Invalid payload' },
      timestamp: Date.now(),
    };
  }

  try {
    switch (payload.action) {
      case 'CALCULATE_FARE': {
        const result = computeDriverFare(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'DRV_ACTOR',
          recipient: message.sender,
          type: 'DRIVER_FARE_CALCULATED',
          payload: { action: 'CALCULATE_FARE', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'CALCULATE_DISTANCE': {
        const { originCoords, destinationCoords, originName, destinationName } = payload.data;
        const distanceKm = calculateHaversineDistance(
          originCoords.latitude,
          originCoords.longitude,
          destinationCoords.latitude,
          destinationCoords.longitude
        );
        // Approx 2.5 mins per km in urban/mountain Medellín
        const estimatedMinutes = Math.max(10, Math.round(distanceKm * 2.5));
        const origCheck = isProhibitedTerritory(originName);
        const destCheck = isProhibitedTerritory(destinationName);

        const result: DistanceCalculationResult = {
          originName,
          destinationName,
          distanceKm,
          estimatedMinutes,
          isWithinOperativeZone: !origCheck.isProhibited && !destCheck.isProhibited,
        };

        return {
          id: `RESP_${message.id}`,
          sender: 'DRV_ACTOR',
          recipient: message.sender,
          type: 'DISTANCE_CALCULATED',
          payload: { action: 'CALCULATE_DISTANCE', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'VALIDATE_ROUTE': {
        const { origin, destination } = payload.data;
        const origCheck = isProhibitedTerritory(origin);
        const destCheck = isProhibitedTerritory(destination);

        if (origCheck.isProhibited || destCheck.isProhibited) {
          const zone = origCheck.matchedZone || destCheck.matchedZone;
          return {
            id: `RESP_${message.id}`,
            sender: 'DRV_ACTOR',
            recipient: message.sender,
            type: 'ROUTE_VALIDATED',
            payload: {
              action: 'VALIDATE_ROUTE',
              success: false,
              result: {
                isValid: false,
                prohibitedZoneDetected: zone,
                reason: `Zona Prohibida: ${zone} no está habilitada para Medical Trip`,
              },
            },
            timestamp: Date.now(),
          };
        }

        return {
          id: `RESP_${message.id}`,
          sender: 'DRV_ACTOR',
          recipient: message.sender,
          type: 'ROUTE_VALIDATED',
          payload: {
            action: 'VALIDATE_ROUTE',
            success: true,
            result: { isValid: true },
          },
          timestamp: Date.now(),
        };
      }

      default:
        throw new Error(`Unknown Driver action: ${(payload as any).action}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Driver calculation error';
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'DRV_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'DRIVER_ERROR',
      payload: { action: payload?.action || 'UNKNOWN' as any, success: false, error: errorMsg },
      timestamp: Date.now(),
    };
  }
}

// Web Worker Event Listener Attachment
if (
  typeof self !== 'undefined' &&
  typeof (self as any).postMessage === 'function' &&
  typeof window === 'undefined'
) {
  self.onmessage = (event: MessageEvent<ActorMessage<DriverPayload>>) => {
    const response = handleDriverMessage(event.data);
    if (response) {
      (self as any).postMessage(response);
    }
  };
}
