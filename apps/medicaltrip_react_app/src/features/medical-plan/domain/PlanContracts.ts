/**
 * Medical Trip Colombia S.A.S. - PlanContracts
 * Domain models and contracts for Window 4: Dual Clinical Timeline & Hospital Triage Network.
 * Pure domain contracts: Zero framework, UI, or storage driver imports.
 */

export type TimelineTrackType = 'CLINICAL' | 'LOGISTICS';

export interface ClinicalTimelineItem {
  readonly id: string;
  readonly dayNumber: number;
  readonly title: string;
  readonly category: string;
  readonly timeFormatted: string; // e.g., '05:30 AM'
  readonly locationName: string;
  readonly providerName?: string;
  readonly specialist?: string;
  readonly status: string;
  readonly notes?: string;
  readonly isFastingRequired: boolean;
  readonly track: TimelineTrackType;
}

export interface DualTimelineDayGroup {
  readonly dayNumber: number;
  readonly dateFormatted: string;
  readonly clinicalTrack: ClinicalTimelineItem[];
  readonly logisticsTrack: ClinicalTimelineItem[];
}

export interface HospitalTriageFacility {
  readonly id: string;
  readonly name: string;
  readonly level: string;
  readonly address: string;
  readonly zone: string;
  readonly phoneDisplay: string;
  readonly phoneDialer: string; // tel:+57...
  readonly whatsappNumber: string; // 573...
  readonly triageSpecialties: string[];
  readonly isOpen24Hours: boolean;
}

export const MASTER_TRIAGE_FACILITIES: HospitalTriageFacility[] = [
  {
    id: 'FACILITY-CIMA',
    name: 'Clínica CIMA (Sede El Poblado)',
    level: 'Nivel III / Urgencias & Cirugía',
    address: 'Calle 7 Sur #42-70, El Poblado, Medellín',
    zone: 'El Poblado',
    phoneDisplay: '+57 (4) 444 0000',
    phoneDialer: 'tel:+5744440000',
    whatsappNumber: '573104440000',
    triageSpecialties: ['Triage Quirúrgico 24h', 'Ecografía de Urgencia', 'Cuidados Intermedios'],
    isOpen24Hours: true,
  },
  {
    id: 'FACILITY-CLINICA-MEDELLIN',
    name: 'Clínica Medellín (Sede Poblado / Centro)',
    level: 'Alta Complejidad / Triage Adultos',
    address: 'Calle 7 #39-290, El Poblado, Medellín',
    zone: 'El Poblado',
    phoneDisplay: '+57 (604) 356 8585',
    phoneDialer: 'tel:+576043568585',
    whatsappNumber: '573003568585',
    triageSpecialties: ['Urgencias Generales 24/7', 'Pabellón Quirúrgico', 'UCI Adultos'],
    isOpen24Hours: true,
  },
  {
    id: 'FACILITY-CES',
    name: 'Clínica CES (Sede Prado Centro / Oviedo)',
    level: 'Hospital Universitario / Acreditado',
    address: 'Calle 58 #50C-2, Prado Centro / Cr 43A #6S-15 Oviedo',
    zone: 'Prado Centro & Oviedo',
    phoneDisplay: '+57 (604) 576 5700',
    phoneDialer: 'tel:+576045765700',
    whatsappNumber: '573180553238',
    triageSpecialties: ['Triage Institucional CES', 'Urología de Urgencia', 'Valoración Especialistas'],
    isOpen24Hours: true,
  },
  {
    id: 'FACILITY-HPTU',
    name: 'Hospital Pablo Tobón Uribe (HPTU)',
    level: 'Nivel IV / Trauma & Alta Complejidad',
    address: 'Calle 78B #69-240, Robledo, Medellín',
    zone: 'Robledo',
    phoneDisplay: '+57 (604) 445 9000',
    phoneDialer: 'tel:+576044459000',
    whatsappNumber: '573014459000',
    triageSpecialties: ['Centro de Trauma Nivel IV', 'Cirugía Mayor Reconstructiva', 'Hospitalización'],
    isOpen24Hours: true,
  },
];

export interface EmergencyCoordinatorContact {
  readonly name: string;
  readonly roleTitle: string;
  readonly phoneDisplay: string;
  readonly phoneDialer: string;
  readonly whatsappNumber: string;
  readonly location: string;
}

export const EMERGENCY_COORDINATORS = {
  HOTLINE_24_7: {
    name: 'Carolina Cortázar',
    roleTitle: 'Coordinación de Emergencias & Operaciones 24/7',
    phoneDisplay: '+57 (300) 123 4567',
    phoneDialer: 'tel:+573001234567',
    whatsappNumber: '573001234567',
    location: 'Sede Administrativa Medellín · El Poblado',
  },
  MEDICAL_DIRECTOR: {
    name: 'Dra. Jenny Paola Acosta',
    roleTitle: 'Dirección Médica & Triage Clínico Internacional',
    phoneDisplay: '+57 (301) 444 1122',
    phoneDialer: 'tel:+573014441122',
    whatsappNumber: '573014441122',
    location: 'Clínica CIMA / Consultorio 402, Medellín',
  },
};
