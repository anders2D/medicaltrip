/**
 * Driver Subagent Worker [DRV]
 * Handles logistics updates, route estimates, Haversine geo-distance, and driver rate calculation.
 */

export interface HaversineCoords {
  latitude: number;
  longitude: number;
}

export interface TransferRequest {
  role?: string;
  patientId?: string;
  origin: string;
  destination: string;
  vehicleType?: 'Standard' | 'Uber XL' | 'Van' | 'Sedan';
  paxCount?: number;
  originCoords?: HaversineCoords;
  destCoords?: HaversineCoords;
  waitingHours?: number;
}

export interface TransferEstimateResult {
  transferFeeCOP: number;
  baseFareCOP: number;
  surchargeCOP: number;
  waitingFeeCOP: number;
  distanceKm: number | null;
  estimatedDurationMinutes: number;
  corridor: string;
  vehicleType: string;
  isValidRoute: boolean;
}

// Bounding box for operative corridor validation
const OPERATIVE_BOXES = [
  { name: 'ANTIOQUIA_CENTRAL', minLat: 5.9, maxLat: 6.5, minLng: -75.8, maxLng: -75.3 },
  { name: 'MANIZALES_CALDAS', minLat: 4.95, maxLat: 5.2, minLng: -75.6, maxLng: -75.4 },
  { name: 'PEREIRA_RISARALDA', minLat: 4.7, maxLat: 4.95, minLng: -75.8, maxLng: -75.6 },
  { name: 'BOGOTA_DC', minLat: 4.45, maxLat: 4.85, minLng: -74.25, maxLng: -73.95 },
];

const FORBIDDEN_ZONES = ['MOCOA', 'LETICIA', 'AMAZONAS', 'TUMACO', 'NARINO', 'ARAUCA', 'CHOCO'];

/**
 * Calculates great-circle distance between two points using the Haversine formula.
 */
export function calculateHaversineDistance(
  coord1: HaversineCoords,
  coord2: HaversineCoords
): number {
  const R = 6371; // Earth's radius in kilometers
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const dLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // 2 decimal places
}

/**
 * Validates if coordinates or names are within authorized corridors.
 */
export function validateRouteLocations(origin: string, destination: string): { valid: boolean; error?: string } {
  const normOrigin = origin.toUpperCase();
  const normDest = destination.toUpperCase();

  for (const forbidden of FORBIDDEN_ZONES) {
    if (normOrigin.includes(forbidden) || normDest.includes(forbidden)) {
      return {
        valid: false,
        error: `[Zona Prohibida]: La ruta (${origin} -> ${destination}) involucra una zona no operativa (${forbidden}).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Calculates transfer fee based on pax count, vehicle type, waiting time, and corridor rates.
 */
export function calculateTransferFee(request: TransferRequest): TransferEstimateResult {
  const routeValidation = validateRouteLocations(request.origin, request.destination);
  if (!routeValidation.valid) {
    throw new Error(routeValidation.error);
  }

  const paxCount = request.paxCount || 1;
  const vehicleType = request.vehicleType || (paxCount > 4 ? 'Uber XL' : 'Standard');
  const isAirportJMC =
    request.origin.toUpperCase().includes('JMC') ||
    request.origin.toUpperCase().includes('AEROPUERTO') ||
    request.origin.toUpperCase().includes('RIONEGRO') ||
    request.destination.toUpperCase().includes('JMC') ||
    request.destination.toUpperCase().includes('AEROPUERTO') ||
    request.destination.toUpperCase().includes('RIONEGRO');

  let baseFareCOP = 145000;
  let surchargeCOP = 0;

  if (isAirportJMC) {
    if (paxCount > 4 || vehicleType === 'Uber XL' || vehicleType === 'Van') {
      baseFareCOP = 160000;
    } else {
      baseFareCOP = 145000;
    }
  } else {
    // Urban transfer within Medellín / Valle de Aburrá
    baseFareCOP = 45000;
    if (vehicleType === 'Uber XL' || paxCount > 4) {
      surchargeCOP = 25000;
    }
  }

  // Waiting fee: 25,000 COP per hour
  const waitingHours = Math.max(0, request.waitingHours || 0);
  const waitingFeeCOP = Math.round(waitingHours * 25000);

  let distanceKm: number | null = null;
  let estimatedDurationMinutes = isAirportJMC ? 45 : 25;

  if (request.originCoords && request.destCoords) {
    distanceKm = calculateHaversineDistance(request.originCoords, request.destCoords);
    // Estimate 35 km/h urban / corridor average speed
    estimatedDurationMinutes = Math.max(15, Math.round((distanceKm / 35) * 60));
  }

  const totalFeeCOP = baseFareCOP + surchargeCOP + waitingFeeCOP;

  return {
    transferFeeCOP: totalFeeCOP,
    baseFareCOP,
    surchargeCOP,
    waitingFeeCOP,
    distanceKm,
    estimatedDurationMinutes,
    corridor: isAirportJMC ? 'RIONEGRO_MEDELLIN' : 'MEDELLIN_METRO',
    vehicleType,
    isValidRoute: true,
  };
}

/**
 * Driver Subagent Request Dispatcher
 */
export function processDriverAction(action: string, payload: any): any {
  switch (action) {
    case 'CALCULATE_TRANSFER_FEE':
    case 'ESTIMATE_TRANSFER':
      return calculateTransferFee(payload);

    case 'CALCULATE_HAVERSINE_DISTANCE':
      return {
        distanceKm: calculateHaversineDistance(payload.coord1, payload.coord2),
      };

    case 'VALIDATE_ROUTE':
      return validateRouteLocations(payload.origin, payload.destination);

    case 'ASSIGN_DRIVER':
      return {
        assignedDriverId: payload.driverId || 'DRV-001-CARLOS',
        driverName: payload.driverName || 'Carlos Montoya',
        vehiclePlate: 'FXY-789',
        vehicleType: payload.vehicleType || 'Uber XL (Toyota Prado)',
        status: 'CONFIRMED',
      };

    default:
      throw new Error(`[DriverWorker]: Unknown action '${action}'`);
  }
}

// Web Worker message event listener
if (
  typeof self !== 'undefined' &&
  typeof (self as any).addEventListener === 'function' &&
  typeof (self as any).postMessage === 'function'
) {
  (self as any).addEventListener('message', (event: MessageEvent) => {
    const { id, action, payload } = event.data || {};
    try {
      const result = processDriverAction(action, payload);
      (self as any).postMessage({ id, success: true, result });
    } catch (err: any) {
      (self as any).postMessage({ id, success: false, error: err.message });
    }
  });
}
