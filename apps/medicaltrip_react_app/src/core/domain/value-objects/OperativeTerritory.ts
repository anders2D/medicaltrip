import { NonOperativeTerritoryError } from '../errors/NonOperativeTerritoryError';

export type OperativeZone =
  | 'MEDELLIN_CENTRO'
  | 'POBLADO'
  | 'LAURELES'
  | 'BELEN'
  | 'ROBLEDO'
  | 'CIUDAD_DEL_RIO'
  | 'ENVIGADO'
  | 'SABANETA'
  | 'ITAGUI'
  | 'BELLO'
  | 'RIONEGRO_AEROPUERTO';

export interface GeoCoordinates {
  readonly lat: number;
  readonly lng: number;
}

export class OperativeTerritory {
  public readonly zone: OperativeZone;
  public readonly address: string;
  public readonly coordinates?: GeoCoordinates;

  private static readonly FORBIDDEN_KEYWORDS = [
    'MOCOA',
    'PUTUMAYO',
    'LETICIA',
    'AMAZONAS',
    'TUMACO',
    'PASTO',
    'NARINO',
    'NARIÑO',
    'CALI',
    'VALLE DEL CAUCA',
    'BOGOTA',
    'BOGOTÁ',
    'CUNDINAMARCA',
    'LONDON',
    'LONDRES',
    'NEW YORK',
    'BUENAVENTURA',
    'ARAUCA',
    'GUAVIARE',
    'MITU',
    'MITÚ',
    'VAUPES',
    'VAUPÉS',
    'INIRIDA',
    'INÍRIDA',
    'GUAINIA',
    'GUAINÍA',
    'PUERTO CARRENO',
    'PUERTO CARREÑO',
    'VICHADA',
    'CHOCO',
    'CHOCÓ',
    'LA GUAJIRA',
    'CAQUETA',
    'CAQUETÁ'
  ];

  private static readonly AUTHORIZED_CORRIDORS: Record<OperativeZone, { keywords: string[]; defaultCoords: GeoCoordinates }> = {
    POBLADO: {
      keywords: ['POBLADO', 'OVIEDO', 'SANTA FE', 'SANTA FÉ', 'PARK 42', 'NOVELTY', 'MILLA DE ORO', 'PROVENZA', 'MANILA', 'ASTORGA', 'DIEZ', 'POBLADO PLAZA'],
      defaultCoords: { lat: 6.2087, lng: -75.5684 }
    },
    LAURELES: {
      keywords: ['LAURELES', 'INNTU', 'SEGUNDO PARQUE', 'ESTADIO', 'CUB', 'BOLIVARIANA', 'TRANSVERSAL 39'],
      defaultCoords: { lat: 6.2425, lng: -75.5925 }
    },
    CIUDAD_DEL_RIO: {
      keywords: ['CIUDAD DEL RIO', 'CIUDAD DEL RÍO', 'TORRE MEDICA CIUDAD DEL RIO', 'CLOFAN', 'CLOFÁN', 'CIMA'],
      defaultCoords: { lat: 6.2235, lng: -75.5746 }
    },
    ROBLEDO: {
      keywords: ['ROBLEDO', 'HPTU', 'PABLO TOBON', 'PABLO TOBÓN', 'CARDIO VID', 'CARDIOVID'],
      defaultCoords: { lat: 6.2758, lng: -75.5894 }
    },
    MEDELLIN_CENTRO: {
      keywords: ['CENTRO', 'PRADO CENTRO', 'CES PRADO', 'LA CANDELARIA', 'CLINICA MEDELLIN', 'MEDELLIN', 'MEDELLÍN'],
      defaultCoords: { lat: 6.2518, lng: -75.5636 }
    },
    BELEN: {
      keywords: ['BELEN', 'BELÉN', 'CLINICA LAS AMERICAS', 'LAS AMÉRICAS'],
      defaultCoords: { lat: 6.2205, lng: -75.6015 }
    },
    ENVIGADO: {
      keywords: ['ENVIGADO', 'VILLA ANITA', 'EL PORTAL', 'LOMA DEL CHOCHO', 'POLICLINICA ENVIGADO'],
      defaultCoords: { lat: 6.1685, lng: -75.5815 }
    },
    SABANETA: {
      keywords: ['SABANETA', 'MAYORCA', 'CASAS DE RECUPERACION'],
      defaultCoords: { lat: 6.1515, lng: -75.6155 }
    },
    ITAGUI: {
      keywords: ['ITAGUI', 'ITAGÜÍ'],
      defaultCoords: { lat: 6.1725, lng: -75.6095 }
    },
    BELLO: {
      keywords: ['BELLO', 'CLINICA DEL NORTE'],
      defaultCoords: { lat: 6.3335, lng: -75.5585 }
    },
    RIONEGRO_AEROPUERTO: {
      keywords: ['RIONEGRO', 'JMC', 'JOSE MARIA CORDOVA', 'JOSÉ MARÍA CÓRDOVA', 'AEROPUERTO', 'LLANOGRANDE', 'MDE'],
      defaultCoords: { lat: 6.1645, lng: -75.4267 }
    }
  };

  private constructor(zone: OperativeZone, address: string, coordinates?: GeoCoordinates) {
    this.zone = zone;
    this.address = address.trim();
    this.coordinates = coordinates || OperativeTerritory.AUTHORIZED_CORRIDORS[zone].defaultCoords;
    Object.freeze(this);
  }

  public static fromString(input: string, coordinates?: GeoCoordinates): OperativeTerritory {
    if (!input || input.trim().length === 0) {
      throw new NonOperativeTerritoryError(input || '(vacío)', 'La ubicación no puede estar vacía');
    }

    const normalized = input.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Fail-fast invariant check for forbidden conflict zones or non-operative cities
    for (const forbidden of OperativeTerritory.FORBIDDEN_KEYWORDS) {
      const normForbidden = forbidden.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized.includes(normForbidden)) {
        throw new NonOperativeTerritoryError(
          input,
          `Zona prohibida o no autorizada para operaciones médicas: '${forbidden}'. Invariante de seguridad Medical Trip.`
        );
      }
    }

    // Collect all matching keywords across authorized corridors and pick the longest match
    let bestMatchZone: OperativeZone | null = null;
    let longestMatchLength = 0;

    for (const [zoneKey, zoneData] of Object.entries(OperativeTerritory.AUTHORIZED_CORRIDORS) as [OperativeZone, typeof OperativeTerritory.AUTHORIZED_CORRIDORS[OperativeZone]][]) {
      for (const kw of zoneData.keywords) {
        const normKw = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(normKw)) {
          if (normKw.length > longestMatchLength) {
            longestMatchLength = normKw.length;
            bestMatchZone = zoneKey;
          }
        }
      }
    }

    if (bestMatchZone) {
      return new OperativeTerritory(bestMatchZone, input, coordinates);
    }

    // Generic fallback only for medical facilities explicitly in Medellín
    if ((normalized.includes('CLINICA') || normalized.includes('HOSPITAL') || normalized.includes('HOTEL') || normalized.includes('LABORATORIO') || normalized.includes('CONSULTORIO')) && (normalized.includes('MEDELLIN') || normalized.includes('MEDELLÍN') || normalized.includes('ABURRA') || normalized.includes('ABURRÁ'))) {
      return new OperativeTerritory('MEDELLIN_CENTRO', input, coordinates);
    }

    throw new NonOperativeTerritoryError(
      input,
      `No se pudo vincular la dirección a ningún corredor operativo autorizado (Medellín, Poblado, Laureles, Envigado, Sabaneta, Bello, Itagüí, Rionegro Aeropuerto JMC)`
    );
  }

  public static fromPreset(zone: OperativeZone, address: string, coordinates?: GeoCoordinates): OperativeTerritory {
    return new OperativeTerritory(zone, address, coordinates);
  }

  public toJSON(): { zone: OperativeZone; address: string; coordinates?: GeoCoordinates } {
    return {
      zone: this.zone,
      address: this.address,
      coordinates: this.coordinates,
    };
  }
}
