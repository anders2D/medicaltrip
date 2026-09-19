/**
 * Medical Trip Colombia S.A.S. - Master Directory of Providers, Accommodations & Drivers
 * Extracted from 4 years of empirical operational logs (HPTU, Cardio VID, Clofán, CIMA, CES, etc.)
 */

export interface MedicalProvider {
  readonly id: string;
  readonly name: string;
  readonly sector: string;
  readonly address: string;
  readonly category: 'CLINIC' | 'LAB' | 'HOTEL' | 'RECOVERY_HOUSE';
  readonly specialties: string[];
  readonly contactStaff?: string;
  readonly phone?: string;
  readonly defaultCoordinates: { readonly lat: number; readonly lng: number };
}

export interface FleetDriverInfo {
  readonly id: string;
  readonly name: string;
  readonly vehicleModel: string;
  readonly vehicleClass: 'SEDAN' | 'VAN_XL' | 'DUSTER';
  readonly licensePlate?: string;
  readonly company: string;
  readonly phone?: string;
}

export interface FieldStaffInfo {
  readonly id: string;
  readonly name: string;
  readonly role: 'GUIDE' | 'NURSE' | 'COORDINATOR';
  readonly languages: string[];
  readonly phone?: string;
}

// 🏥 CLINICAL & DIAGNOSTIC PARTNERS
export const CLINICAL_PROVIDERS: Record<string, MedicalProvider> = {
  'CLINIC-HPTU': {
    id: 'CLINIC-HPTU',
    name: 'Hospital Pablo Tobón Uribe (HPTU)',
    sector: 'Robledo, Medellín',
    address: 'Calle 78B #69-240, Robledo',
    category: 'CLINIC',
    specialties: ['Alta Complejidad', 'Gastroenterología', 'Cirugía Bariátrica', 'Neurología', 'Hospitalización'],
    contactStaff: 'Dr. Mosquera (Torre B Cons 154)',
    defaultCoordinates: { lat: 6.2758, lng: -75.5894 },
  },
  'CLINIC-CARDIO-VID': {
    id: 'CLINIC-CARDIO-VID',
    name: 'Clínica Cardio VID',
    sector: 'Robledo, Medellín',
    address: 'Calle 78B #75-21, Robledo',
    category: 'CLINIC',
    specialties: ['Chequeo Cardiovascular', 'Ecocardiograma Doppler', 'Prueba de Esfuerzo', 'Cateterismo Cardíaco'],
    contactStaff: 'Dr. Marcos Yepes (Asesor / Fit-to-Fly)',
    defaultCoordinates: { lat: 6.2758, lng: -75.5898 },
  },
  'CLINIC-CLOFAN': {
    id: 'CLINIC-CLOFAN',
    name: 'Clínica Clofán',
    sector: 'Ciudad del Río, Medellín',
    address: 'Cra 48 #19A-40, Torre Médica Ciudad del Río',
    category: 'CLINIC',
    specialties: ['Oftalmología de Precisión', 'Cirugía Refractiva Láser', 'Topografía Pentacam', 'Cataratas'],
    contactStaff: 'Dr. Jorge Eduardo Peláez',
    defaultCoordinates: { lat: 6.2235, lng: -75.5746 },
  },
  'CLINIC-CIMA': {
    id: 'CLINIC-CIMA',
    name: 'CIMA Ayudas Diagnósticas',
    sector: 'Medellín Centro / Cra 44',
    address: 'Carrera 44 #18-51, Medellín',
    category: 'LAB',
    specialties: ['Ecografía Abdominal Total', 'Ecografía Mamaria', 'Ecografía Transvaginal', 'Laboratorio General'],
    contactStaff: 'Equipo Radiología e Imágenes CIMA',
    defaultCoordinates: { lat: 6.2312, lng: -75.5701 },
  },
  'CLINIC-CES-OVIEDO': {
    id: 'CLINIC-CES-OVIEDO',
    name: 'Clínica CES (Sede Oviedo)',
    sector: 'El Poblado, Medellín',
    address: 'Cra 43A #6S-15, Torre Médica Oviedo, Pisos 4 & 6',
    category: 'CLINIC',
    specialties: ['Urología de Alta Complejidad en Inglés', 'Consultas Prequirúrgicas', 'Uroginecología'],
    contactStaff: 'Dr. Carlos Suárez / Enf. Jefe Bibiana',
    defaultCoordinates: { lat: 6.1985, lng: -75.5732 },
  },
  'CLINIC-CES-PRADO': {
    id: 'CLINIC-CES-PRADO',
    name: 'Clínica CES (Sede Prado)',
    sector: 'Prado Centro, Medellín',
    address: 'Calle 58 #50C-2, Prado Centro',
    category: 'CLINIC',
    specialties: ['Cirugía Maxilofacial', 'Quirófanos Generales', 'Valoración Pre-Anestésica'],
    contactStaff: 'Equipo Quirúrgico CES Prado',
    defaultCoordinates: { lat: 6.2555, lng: -75.5645 },
  },
  'LAB-ECHAVARRIA': {
    id: 'LAB-ECHAVARRIA',
    name: 'Laboratorio Clínico Echavarría',
    sector: 'El Poblado / Laureles (Servicio Domiciliario)',
    address: 'Calle 7 #42-40, El Poblado',
    category: 'LAB',
    specialties: ['Toma Domiciliaria en Hotel (05:30 AM)', 'Uroanálisis', 'Urocultivo CMI', 'Perfil Lipídico', 'eGFR Renal'],
    contactStaff: 'Enf. Domiciliaria Emi Echavarría',
    defaultCoordinates: { lat: 6.2087, lng: -75.5684 },
  },
  'LAB-OCAZIONEZ': {
    id: 'LAB-OCAZIONEZ',
    name: 'Centro Radiológico Hernán Ocazionez',
    sector: 'El Poblado, Medellín',
    address: 'Cra 43A #1 Sur-100, El Poblado',
    category: 'LAB',
    specialties: ['Rayos X de Tórax', 'Ecografía de Abdomen Total', 'Mamografía Prequirúrgica'],
    contactStaff: 'Radiólogos Especialistas Ocazionez',
    defaultCoordinates: { lat: 6.2045, lng: -75.5710 },
  },
  'CLINIC-BOLIVARIANA': {
    id: 'CLINIC-BOLIVARIANA',
    name: 'Clínica Universitaria Bolivariana',
    sector: 'Laureles, Medellín',
    address: 'Circular 1 #70-01, Laureles',
    category: 'CLINIC',
    specialties: ['Ginecología Especializada', 'Consultas Pre-Anestésicas', 'Urgencias Médicas'],
    contactStaff: 'Ginecólogos Adscritos CUB',
    defaultCoordinates: { lat: 6.2440, lng: -75.5910 },
  },
};

// 🏨 ACCOMMODATION NETWORK
export const ACCOMMODATION_PROVIDERS: Record<string, MedicalProvider> = {
  'HOTEL-INNTU': {
    id: 'HOTEL-INNTU',
    name: 'Hotel Inntu Laureles',
    sector: 'Segundo Parque de Laureles',
    address: 'Transversal 39 #74B-10, Laureles, Medellín',
    category: 'HOTEL',
    specialties: ['Hotel Boutique de Recuperación', 'Cocina Saludable', 'Acceso Adaptado', 'Habitaciones Estándar & Suites (Hab. 1004)'],
    contactStaff: 'Recepción Inntu Laureles',
    defaultCoordinates: { lat: 6.2442, lng: -75.5922 },
  },
  'HOTEL-PARK42': {
    id: 'HOTEL-PARK42',
    name: 'Airbnb Edificio Park 42 Poblado',
    sector: 'Sector Astorga / Manila, El Poblado',
    address: 'Carrera 42 #9-28, El Poblado, Medellín',
    category: 'HOTEL',
    specialties: ['Apartamentos Amoblados', 'Cocina Integral', 'Estadías Prolongadas (32 días)'],
    contactStaff: 'Administración Park 42',
    defaultCoordinates: { lat: 6.2110, lng: -75.5705 },
  },
  'HOTEL-NOVELTY': {
    id: 'HOTEL-NOVELTY',
    name: 'Hotel Novelty Suites',
    sector: 'Milla de Oro, El Poblado',
    address: 'Calle 4 Sur #43A-109, El Poblado, Medellín',
    category: 'HOTEL',
    specialties: ['Suites Ejecutivas con Cocineta', 'Cercanía a Centros Médicos', 'Desayuno Buffet Adaptado'],
    contactStaff: 'Front Desk Novelty',
    defaultCoordinates: { lat: 6.1990, lng: -75.5740 },
  },
  'HOTEL-VILLA-ANITA': {
    id: 'HOTEL-VILLA-ANITA',
    name: 'Villa Anita Casa de Recuperación',
    sector: 'Sector Campestre, Envigado / Sabaneta',
    address: 'Calle 38 Sur #30-45, Envigado',
    category: 'RECOVERY_HOUSE',
    specialties: ['Enfermería 24/7', 'Dietas Blandas Postquirúrgicas', 'Drenaje Linfático', 'Asistencia de Movilidad'],
    contactStaff: 'Coordinación Enfermería Villa Anita',
    defaultCoordinates: { lat: 6.1685, lng: -75.5815 },
  },
  'HOTEL-DIEZ': {
    id: 'HOTEL-DIEZ',
    name: 'Hotel Diez Categoría Colombia',
    sector: 'El Poblado, Medellín',
    address: 'Calle 10A #34-11, El Poblado',
    category: 'HOTEL',
    specialties: ['Habitaciones Ejecutivas', 'Ubicación Gastronómica y Quirúrgica'],
    contactStaff: 'Recepción Hotel Diez',
    defaultCoordinates: { lat: 6.2085, lng: -75.5650 },
  },
  'HOTEL-POBLADO-PLAZA': {
    id: 'HOTEL-POBLADO-PLAZA',
    name: 'Hotel Poblado Plaza',
    sector: 'Milla de Oro, El Poblado',
    address: 'Cra 43A #4 Sur-75, El Poblado',
    category: 'HOTEL',
    specialties: ['Suites Premium Internacionales', 'Servicio Bilingüe'],
    contactStaff: 'Concierge Poblado Plaza',
    defaultCoordinates: { lat: 6.1980, lng: -75.5745 },
  },
};

// 🚗 FLEET LOGISTICS & DRIVERS
export const FLEET_DRIVERS: Record<string, FleetDriverInfo> = {
  'DRV-01': {
    id: 'DRV-01',
    name: 'Ramón Rosero',
    vehicleModel: 'Kia Sonet (Sedán / SUV Compacto)',
    vehicleClass: 'SEDAN',
    licensePlate: 'NLX666',
    company: 'Aeroturex Transporte Especial',
    phone: '+57 310 456 7890',
  },
  'DRV-02': {
    id: 'DRV-02',
    name: 'Juan Carlos Montoya',
    vehicleModel: 'Kia Soul (Sedán Ejecutivo)',
    vehicleClass: 'SEDAN',
    licensePlate: 'ESO942',
    company: 'Flota Ejecutiva Medical Trip',
    phone: '+57 311 234 5678',
  },
  'DRV-03': {
    id: 'DRV-03',
    name: 'Andrés Cantero',
    vehicleModel: 'Sedán Ejecutivo / Asistencia Bilingüe',
    vehicleClass: 'SEDAN',
    company: 'Flota Ejecutiva & Asistencia Bilingüe',
    phone: '+57 312 345 6789',
  },
  'DRV-04': {
    id: 'DRV-04',
    name: 'Gustavo Mora',
    vehicleModel: 'Renault Duster (SUV)',
    vehicleClass: 'DUSTER',
    licensePlate: 'LKN507',
    company: 'Aeroturex / Flota Privada',
    phone: '+57 313 456 7891',
  },
  'DRV-05': {
    id: 'DRV-05',
    name: 'Oswaldo Giraldo',
    vehicleModel: 'Renault Duster (SUV)',
    vehicleClass: 'DUSTER',
    licensePlate: 'PUO663',
    company: 'Aeroturex / Flota Privada',
    phone: '+57 314 567 8902',
  },
  'DRV-06': {
    id: 'DRV-06',
    name: 'Flota Uber XL',
    vehicleModel: 'Van XL / Minivan 5-6 Pax',
    vehicleClass: 'VAN_XL',
    company: 'Flota Uber XL para Grupos Familiares',
    phone: '+57 300 000 0000',
  },
};

// 👩‍⚕️ BILINGUAL COMPANIONS & CLINICAL STAFF
export const FIELD_STAFF: Record<string, FieldStaffInfo> = {
  'GUIA-01': {
    id: 'GUIA-01',
    name: 'Yenny Roberto',
    role: 'GUIDE',
    languages: ['Papiamento', 'Español', 'Inglés'],
    phone: '+57 300 123 4567',
  },
  'GUIA-02': {
    id: 'GUIA-02',
    name: 'Alejandro Restrepo',
    role: 'GUIDE',
    languages: ['Inglés', 'Español', 'Neerlandés'],
    phone: '+57 301 234 5678',
  },
  'GUIA-03': {
    id: 'GUIA-03',
    name: 'Diana Morales',
    role: 'GUIDE',
    languages: ['Inglés', 'Español', 'Papiamento'],
    phone: '+57 303 345 6789',
  },
  'NURSE-01': {
    id: 'NURSE-01',
    name: 'Emi Echavarría',
    role: 'NURSE',
    languages: ['Español'],
    phone: '+57 302 345 6789',
  },
};

export const BILINGUAL_COMPANIONS = FIELD_STAFF;
