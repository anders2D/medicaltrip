export type EventCategoryType = 'FLIGHT' | 'CLINICAL' | 'LAB' | 'PHARMACY' | 'HOTEL' | 'TRANSFER';

export interface EventCategoryMetadata {
  readonly code: EventCategoryType;
  readonly label: string;
  readonly badgeColor: string;
  readonly iconName: string;
  readonly description: string;
}

export class EventCategory {
  public static readonly FLIGHT: EventCategoryMetadata = {
    code: 'FLIGHT',
    label: 'Vuelo / Llegada',
    badgeColor: 'sky',
    iconName: 'Plane',
    description: 'Vuelos internacionales de llegada, conexión o retorno',
  };

  public static readonly CLINICAL: EventCategoryMetadata = {
    code: 'CLINICAL',
    label: 'Cita Clínica / Quirúrgica',
    badgeColor: 'indigo',
    iconName: 'Stethoscope',
    description: 'Consultas con especialistas, valoraciones y procedimientos',
  };

  public static readonly LAB: EventCategoryMetadata = {
    code: 'LAB',
    label: 'Laboratorio / Diagnóstico',
    badgeColor: 'teal',
    iconName: 'Activity',
    description: 'Toma de muestras, ecografías, resonancias y rayos X',
  };

  public static readonly PHARMACY: EventCategoryMetadata = {
    code: 'PHARMACY',
    label: 'Farmacia / Caja Menor',
    badgeColor: 'emerald',
    iconName: 'Pill',
    description: 'Compras de medicamentos postquirúrgicos y gastos menores',
  };

  public static readonly HOTEL: EventCategoryMetadata = {
    code: 'HOTEL',
    label: 'Hotel / Recuperación',
    badgeColor: 'slate',
    iconName: 'Building',
    description: 'Alojamiento, check-in, check-out y visitas domiciliarias',
  };

  public static readonly TRANSFER: EventCategoryMetadata = {
    code: 'TRANSFER',
    label: 'Traslado Ejecutivo',
    badgeColor: 'amber',
    iconName: 'Car',
    description: 'Rutas y traslados de flota Aeroturex o Uber XL',
  };

  public static getMetadata(category: EventCategoryType): EventCategoryMetadata {
    switch (category) {
      case 'FLIGHT': return EventCategory.FLIGHT;
      case 'CLINICAL': return EventCategory.CLINICAL;
      case 'LAB': return EventCategory.LAB;
      case 'PHARMACY': return EventCategory.PHARMACY;
      case 'HOTEL': return EventCategory.HOTEL;
      case 'TRANSFER': return EventCategory.TRANSFER;
    }
  }

  public static isValid(category: string): category is EventCategoryType {
    return ['FLIGHT', 'CLINICAL', 'LAB', 'PHARMACY', 'HOTEL', 'TRANSFER'].includes(category);
  }
}
