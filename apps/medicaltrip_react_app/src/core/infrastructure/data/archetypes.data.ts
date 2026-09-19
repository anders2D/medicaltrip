/**
 * Medical Trip Colombia S.A.S. - Empirical Operational Archetype Datasets
 * Synthesized from real historical Google Drive logs & Excel spreadsheets
 */

import { PatientBooking } from '../../../core/domain/entities/PatientBooking';
import { ItineraryEvent } from '@/features/itinerary';
import { CompanionShift } from '@/features/companion-shifts';
import { DriverTransfer } from '@/features/logistics-fleet';
import { ReceiptExpense } from '@/features/settlement';
import { SettlementLedger, CashAdvance } from '@/features/settlement';
import { OperativeTerritory } from '../../../core/domain/value-objects/OperativeTerritory';
import { Money } from '../../../core/domain/value-objects/Money';

export interface ArchetypeBundle {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly badgeColor: string;
  readonly booking: PatientBooking;
  readonly events: ItineraryEvent[];
  readonly shifts: CompanionShift[];
  readonly transfers: DriverTransfer[];
  readonly expenses: ReceiptExpense[];
  readonly advances: CashAdvance[];
  readonly settlement: SettlementLedger;
}

// =========================================================================
// 1. RVA171 Catia x5 (5 Pax, Clofán Eye, CIMA Ultrasound, Uber XL)
// =========================================================================
const bookingRva171 = new PatientBooking({
  id: 'bkg-rva171',
  code: 'RVA171-4',
  patientId: 'ENT-PAX-0171',
  firstName: 'Catia',
  lastName: 'Rodrigues',
  passportHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  country: 'Curazao',
  language: 'Papiamento / Holandés',
  phone: '+5999 512 3456',
  email: 'catia.rodrigues@medicaltrip.test',
  companionNames: ['Tatiana Faria', 'Mariana Faria', 'María Rodrigues', 'Lisandra Rodrigues'],
  paxCount: 5,
  arrivalDate: '2026-08-20T10:00:00.000Z',
  departureDate: '2026-08-25T15:00:00.000Z',
  arrivalAirline: 'Z-Fly',
  arrivalFlight: 'ZF-104',
  hotelId: 'HOTEL-INNTU',
  hotelName: 'Hotel Inntu Laureles',
  status: 'PROGRAMADO',
  notes: 'Grupo familiar de 5 Pax. Oftalmología Clofán, CIMA ecografías, Urología Pediátrica.',
});

const advancesRva171: CashAdvance[] = [
  {
    id: 'adv-171-1',
    date: '2026-08-20T10:00:00.000Z',
    amount: Money.fromAmount(1000000, 'COP'),
    description: 'Abono Inicial Bancolombia',
  },
  {
    id: 'adv-171-2',
    date: '2026-08-22T14:00:00.000Z',
    amount: Money.fromAmount(1098100, 'COP'),
    description: 'Segundo Abono Transferencia Bancolombia',
  },
];

const eventsRva171: ItineraryEvent[] = [
  new ItineraryEvent({
    id: 'evt-171-1',
    bookingId: 'RVA171-4',
    dayNumber: 1,
    title: 'Aterrizaje Vuelo Z-Fly Curazao (5 Pax) + Traslado Aeroturex',
    category: 'FLIGHT',
    startDateTime: '2026-08-20T10:00:00.000Z',
    endDateTime: '2026-08-20T12:00:00.000Z',
    location: OperativeTerritory.fromString('Aeropuerto JMC'),
    providerId: 'HOTEL-INNTU',
    providerName: 'Uber XL / Andrés',
    assignedDriverId: 'DRV-03',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(160000, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
    notes: 'Recepción con letrero Medical Trip en puerta internacional. 5 maletas grandes.',
  }),
  new ItineraryEvent({
    id: 'evt-171-2',
    bookingId: 'RVA171-4',
    dayNumber: 1,
    title: 'Consulta y Exámenes Oftalmología Dr. Peláez (María Rodrigues)',
    category: 'CLINICAL',
    startDateTime: '2026-08-20T15:00:00.000Z',
    endDateTime: '2026-08-20T17:30:00.000Z',
    location: OperativeTerritory.fromString('Torre Medica Ciudad del Rio Clofan'),
    providerId: 'CLINIC-CLOFAN',
    providerName: 'Clínica Clofán',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 2.5,
    cost: Money.fromAmount(38750, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
    notes: 'Traducción simultánea en Papiamento. Dilatación de pupila.',
  }),
  new ItineraryEvent({
    id: 'evt-171-3',
    bookingId: 'RVA171-4',
    dayNumber: 1,
    title: 'Parqueadero Torre Médica Clofán Sótano 2',
    category: 'PHARMACY',
    startDateTime: '2026-08-20T17:30:00.000Z',
    endDateTime: '2026-08-20T18:00:00.000Z',
    location: OperativeTerritory.fromString('Torre Medica Ciudad del Rio'),
    providerName: 'Parqueadero Clofán',
    financialType: 'OUT_OF_POCKET',
    cost: Money.fromAmount(12000, 'COP'),
    status: 'COMPLETADO',
    notes: 'Recibo físico liquidado en caja menor.',
  }),
  new ItineraryEvent({
    id: 'evt-171-4',
    bookingId: 'RVA171-4',
    dayNumber: 2,
    title: 'Ecografías & Diagnóstico Integral CIMA (Tatiana / Mariana)',
    category: 'LAB',
    startDateTime: '2026-08-21T06:30:00.000Z',
    endDateTime: '2026-08-21T14:30:00.000Z',
    location: OperativeTerritory.fromString('CIMA Cra 44'),
    providerId: 'CLINIC-CIMA',
    providerName: 'CIMA Diagnósticos',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 8.0,
    cost: Money.fromAmount(159000, 'COP'), // 124k + 35k meal tier 3
    status: 'PROGRAMADO',
    notes: 'Ayuno estricto 8 horas. Muestra de orina recolectada a las 05:30 AM.',
  }),
  new ItineraryEvent({
    id: 'evt-171-5',
    bookingId: 'RVA171-4',
    dayNumber: 2,
    title: 'Compra de Gotas Oftálmicas & Fórmulas Post-Op Cruz Verde',
    category: 'PHARMACY',
    startDateTime: '2026-08-21T15:00:00.000Z',
    endDateTime: '2026-08-21T16:00:00.000Z',
    location: OperativeTerritory.fromString('Poblado Milla de Oro'),
    providerName: 'Cruz Verde Poblado',
    financialType: 'OUT_OF_POCKET',
    cost: Money.fromAmount(85000, 'COP'),
    status: 'PROGRAMADO',
    requiresReceipt: true,
    notes: 'Deducción de caja menor con ticket térmico.',
  }),
];

const shiftsRva171: CompanionShift[] = [
  new CompanionShift({
    id: 'shf-171-1',
    bookingId: 'RVA171-4',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 1,
    date: '2026-08-20',
    hoursLogged: 2.5,
    status: 'COMPLETED',
  }),
  new CompanionShift({
    id: 'shf-171-2',
    bookingId: 'RVA171-4',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 2,
    date: '2026-08-21',
    hoursLogged: 8.0,
    status: 'SCHEDULED',
  }),
];

const transfersRva171: DriverTransfer[] = [
  new DriverTransfer({
    id: 'trf-171-1',
    bookingId: 'RVA171-4',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'VAN_XL',
    routeType: 'AIRPORT_ARRIVAL',
    origin: OperativeTerritory.fromString('Aeropuerto JMC'),
    destination: OperativeTerritory.fromString('Hotel Inntu Laureles'),
    scheduledTime: '2026-08-20T10:00:00.000Z',
    baseRate: Money.fromAmount(160000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-171-2',
    bookingId: 'RVA171-4',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'VAN_XL',
    routeType: 'INTRA_CITY_SHORT',
    origin: OperativeTerritory.fromString('Hotel Inntu Laureles'),
    destination: OperativeTerritory.fromString('Torre Medica Ciudad del Rio Clofan'),
    scheduledTime: '2026-08-20T14:00:00.000Z',
    baseRate: Money.fromAmount(38000, 'COP'),
    status: 'COMPLETED',
  }),
];

const expensesRva171: ReceiptExpense[] = [
  new ReceiptExpense({
    id: 'exp-171-1',
    bookingId: 'RVA171-4',
    eventId: 'evt-171-3',
    category: 'PARKING',
    description: 'Parqueadero Torre Médica Clofán Sótano 2',
    amount: Money.fromAmount(12000, 'COP'),
    date: '2026-08-20T17:30:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
  new ReceiptExpense({
    id: 'exp-171-2',
    bookingId: 'RVA171-4',
    eventId: 'evt-171-5',
    category: 'PHARMACY',
    description: 'Gotas oftálmicas y analgésicos Cruz Verde',
    amount: Money.fromAmount(85000, 'COP'),
    date: '2026-08-21T15:00:00.000Z',
    audited: false,
    status: 'APPROVED',
  }),
];

const settlementRva171 = SettlementLedger.calculate({
  bookingId: 'RVA171-4',
  expenses: expensesRva171,
  shifts: shiftsRva171,
  transfers: transfersRva171,
  advances: advancesRva171,
});

// =========================================================================
// 2. RVA282 George Cardio (2 Pax, Cardio VID, CES Oviedo, 32 days Park 42)
// =========================================================================
const bookingRva282 = new PatientBooking({
  id: 'bkg-rva282',
  code: 'RVA282-5',
  patientId: 'ENT-PAX-0282',
  firstName: 'George',
  lastName: 'Hernandez',
  passportHash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
  country: 'Curazao / EE.UU.',
  language: 'Papiamento / Inglés',
  phone: '+5999 567 8901',
  email: 'george.hernandez@medicaltrip.test',
  companionNames: ['Adriaan Fabian'],
  paxCount: 2,
  arrivalDate: '2026-08-21T15:27:00.000Z',
  departureDate: '2026-08-28T18:00:00.000Z',
  arrivalAirline: 'Wingo',
  arrivalFlight: 'Wingo 7449',
  hotelId: 'HOTEL-PARK42',
  hotelName: 'Airbnb Ed. Park 42 Poblado',
  status: 'PROGRAMADO',
  notes: 'Chequeo Cardiovascular en Cardio VID + Urología CES Oviedo. 32 días de estadía.',
});

const advancesRva282: CashAdvance[] = [
  {
    id: 'adv-282-1',
    date: '2026-08-21T15:27:00.000Z',
    amount: Money.fromAmount(1200000, 'COP'),
    description: 'Anticipo Transferencia Bancolombia',
  },
];

const eventsRva282: ItineraryEvent[] = [
  new ItineraryEvent({
    id: 'evt-282-1',
    bookingId: 'RVA282-5',
    dayNumber: 1,
    title: 'Llegada Wingo Curazao 7449 + Entrega SIM Claro en JMC',
    category: 'FLIGHT',
    startDateTime: '2026-08-21T15:27:00.000Z',
    endDateTime: '2026-08-21T17:30:00.000Z',
    location: OperativeTerritory.fromString('Aeropuerto JMC'),
    providerName: 'Aeroturex Sedán',
    assignedDriverId: 'DRV-01',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(145000, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
    notes: 'Entrega de eSIM Claro 80GB y traslado a Park 42.',
  }),
  new ItineraryEvent({
    id: 'evt-282-2',
    bookingId: 'RVA282-5',
    dayNumber: 2,
    title: 'Consulta Cardiología & Ecocardiograma Dr. Marcos Yepes',
    category: 'CLINICAL',
    startDateTime: '2026-08-22T09:00:00.000Z',
    endDateTime: '2026-08-22T12:00:00.000Z',
    location: OperativeTerritory.fromString('Torre Medica Oviedo CES'),
    providerId: 'CLINIC-CES-OVIEDO',
    providerName: 'CES Oviedo',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 3.0,
    cost: Money.fromAmount(46500, 'COP'),
    status: 'PROGRAMADO',
    notes: 'Valoración cardiovascular y ecocardiograma transtorácico.',
  }),
  new ItineraryEvent({
    id: 'evt-282-3',
    bookingId: 'RVA282-5',
    dayNumber: 3,
    title: 'Chequeo Cardiovascular Integral & Doppler en Cardio VID',
    category: 'CLINICAL',
    startDateTime: '2026-08-23T08:00:00.000Z',
    endDateTime: '2026-08-23T13:00:00.000Z',
    location: OperativeTerritory.fromString('Cardio VID Robledo'),
    providerId: 'CLINIC-CARDIO-VID',
    providerName: 'Clínica Cardio VID',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 5.0,
    cost: Money.fromAmount(77500, 'COP'),
    status: 'PROGRAMADO',
  }),
];

const shiftsRva282: CompanionShift[] = [
  new CompanionShift({
    id: 'shf-282-1',
    bookingId: 'RVA282-5',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 2,
    date: '2026-08-22',
    hoursLogged: 3.0,
    status: 'SCHEDULED',
  }),
  new CompanionShift({
    id: 'shf-282-2',
    bookingId: 'RVA282-5',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 3,
    date: '2026-08-23',
    hoursLogged: 5.0,
    status: 'SCHEDULED',
  }),
];

const transfersRva282: DriverTransfer[] = [
  new DriverTransfer({
    id: 'trf-282-1',
    bookingId: 'RVA282-5',
    driverId: 'DRV-01',
    driverName: 'Ramón Rosero',
    vehicleType: 'SEDAN',
    routeType: 'AIRPORT_ARRIVAL',
    origin: OperativeTerritory.fromString('Aeropuerto JMC'),
    destination: OperativeTerritory.fromString('Edificio Park 42 Poblado'),
    scheduledTime: '2026-08-21T15:27:00.000Z',
    baseRate: Money.fromAmount(145000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-282-2',
    bookingId: 'RVA282-5',
    driverId: 'DRV-01',
    driverName: 'Ramón Rosero',
    vehicleType: 'SEDAN',
    routeType: 'INTRA_CITY_SHORT',
    origin: OperativeTerritory.fromString('Edificio Park 42 Poblado'),
    destination: OperativeTerritory.fromString('Torre Medica Oviedo CES'),
    scheduledTime: '2026-08-22T08:30:00.000Z',
    baseRate: Money.fromAmount(30000, 'COP'),
    status: 'CONFIRMED',
  }),
];

const expensesRva282: ReceiptExpense[] = [
  new ReceiptExpense({
    id: 'exp-282-1',
    bookingId: 'RVA282-5',
    category: 'SIM_CARD',
    description: 'eSIM Claro Internacional 80GB',
    amount: Money.fromAmount(90909, 'COP'),
    date: '2026-08-21T16:15:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
  new ReceiptExpense({
    id: 'exp-282-2',
    bookingId: 'RVA282-5',
    category: 'MEDICAL_LAB',
    description: 'Laboratorio Echavarría (Uroanálisis + Urocultivo)',
    amount: Money.fromAmount(125000, 'COP'),
    date: '2026-08-22T09:30:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
];

const settlementRva282 = SettlementLedger.calculate({
  bookingId: 'RVA282-5',
  expenses: expensesRva282,
  shifts: shiftsRva282,
  transfers: transfersRva282,
  advances: advancesRva282,
});

// =========================================================================
// 3. RVA341 Eduard CES (2 Pax, Bilingual Dutch/English, Inntu 1004)
// =========================================================================
const bookingRva341 = new PatientBooking({
  id: 'bkg-rva341',
  code: 'RVA341-1',
  patientId: 'ENT-PAX-0341',
  firstName: 'Eduard',
  lastName: 'Hogenboom',
  passportHash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
  country: 'Curazao / Países Bajos',
  language: 'Inglés / Neerlandés',
  phone: '+5999 534 5678',
  email: 'eduard.hogenboom@medicaltrip.test',
  companionNames: ['Marcelle Cameron'],
  paxCount: 2,
  arrivalDate: '2026-08-22T15:27:00.000Z',
  departureDate: '2026-08-27T14:00:00.000Z',
  arrivalAirline: 'Z-Fly',
  arrivalFlight: 'ZF-202',
  hotelId: 'HOTEL-INNTU',
  hotelName: 'Hotel Inntu Laureles',
  status: 'PROGRAMADO',
  notes: 'Cirugía Urológica en Clínica CES Oviedo y toma de muestra domiciliaria a las 05:30 AM.',
});

const advancesRva341: CashAdvance[] = [
  {
    id: 'adv-341-1',
    date: '2026-08-22T15:27:00.000Z',
    amount: Money.fromAmount(950000, 'COP'),
    description: 'Abono en Efectivo COP',
  },
];

const eventsRva341: ItineraryEvent[] = [
  new ItineraryEvent({
    id: 'evt-341-1',
    bookingId: 'RVA341-1',
    dayNumber: 1,
    title: 'Llegada Vuelo JMC ➔ Traslado Hotel Inntu Laureles',
    category: 'FLIGHT',
    startDateTime: '2026-08-22T15:27:00.000Z',
    endDateTime: '2026-08-22T17:30:00.000Z',
    location: OperativeTerritory.fromString('Aeropuerto JMC'),
    providerName: 'Sedán Ejecutivo / Andrés',
    assignedDriverId: 'DRV-03',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(110000, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
  }),
  new ItineraryEvent({
    id: 'evt-341-2',
    bookingId: 'RVA341-1',
    dayNumber: 2,
    title: 'Toma de Muestras de Sangre a Domicilio en Habitación Hotel (Ayunas 05:30 AM)',
    category: 'LAB',
    startDateTime: '2026-08-23T05:30:00.000Z',
    endDateTime: '2026-08-23T06:30:00.000Z',
    location: OperativeTerritory.fromString('Hotel Inntu Laureles'),
    providerId: 'LAB-ECHAVARRIA',
    providerName: 'Laboratorio Echavarría',
    assignedNurseId: 'NURSE-01',
    financialType: 'OUT_OF_POCKET',
    cost: Money.fromAmount(97350, 'COP'), // 65k + 32.35k early morning
    status: 'PROGRAMADO',
    notes: 'Hemograma, Creatinina, Tiempos de Coagulación, Glicemia en ayunas.',
  }),
  new ItineraryEvent({
    id: 'evt-341-3',
    bookingId: 'RVA341-1',
    dayNumber: 2,
    title: 'Consulta Urología en Inglés Dr. Carlos Suárez',
    category: 'CLINICAL',
    startDateTime: '2026-08-23T12:00:00.000Z',
    endDateTime: '2026-08-23T17:00:00.000Z',
    location: OperativeTerritory.fromString('Torre Medica Oviedo CES'),
    providerId: 'CLINIC-CES-OVIEDO',
    providerName: 'CES Oviedo',
    assignedGuideId: 'GUIA-02',
    financialType: 'GUIDE_FEE',
    guideHours: 5.0,
    cost: Money.fromAmount(77500, 'COP'),
    status: 'PROGRAMADO',
  }),
];

const shiftsRva341: CompanionShift[] = [
  new CompanionShift({
    id: 'shf-341-1',
    bookingId: 'RVA341-1',
    guideId: 'GUIA-02',
    guideName: 'Alejandro',
    dayNumber: 2,
    date: '2026-08-23',
    hoursLogged: 5.0,
    status: 'SCHEDULED',
  }),
];

const transfersRva341: DriverTransfer[] = [
  new DriverTransfer({
    id: 'trf-341-1',
    bookingId: 'RVA341-1',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'SEDAN',
    routeType: 'AIRPORT_ARRIVAL',
    origin: OperativeTerritory.fromString('Aeropuerto JMC'),
    destination: OperativeTerritory.fromString('Hotel Inntu Laureles'),
    scheduledTime: '2026-08-22T15:27:00.000Z',
    baseRate: Money.fromAmount(110000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-341-2',
    bookingId: 'RVA341-1',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'SEDAN',
    routeType: 'INTRA_CITY_SHORT',
    origin: OperativeTerritory.fromString('Hotel Inntu Laureles'),
    destination: OperativeTerritory.fromString('Torre Medica Oviedo CES'),
    scheduledTime: '2026-08-23T11:00:00.000Z',
    baseRate: Money.fromAmount(35000, 'COP'),
    status: 'CONFIRMED',
  }),
];

const expensesRva341: ReceiptExpense[] = [
  new ReceiptExpense({
    id: 'exp-341-1',
    bookingId: 'RVA341-1',
    eventId: 'evt-341-2',
    category: 'MEDICAL_LAB',
    description: 'Toma Domiciliaria Laboratorio Echavarría Hab. 1004 Inntu',
    amount: Money.fromAmount(97350, 'COP'),
    date: '2026-08-23T05:30:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
];

const settlementRva341 = SettlementLedger.calculate({
  bookingId: 'RVA341-1',
  expenses: expensesRva341,
  shifts: shiftsRva341,
  transfers: transfersRva341,
  advances: advancesRva341,
});

// =========================================================================
// 4. RVA077 Alejandra Rumai 12d (12-Day Surgical Stay, HPTU, Novelty Suites)
// =========================================================================
const bookingRva077 = new PatientBooking({
  id: 'bkg-rva077',
  code: 'RVA077-5',
  patientId: 'ENT-PAX-0077',
  firstName: 'Alejandra Filomena',
  lastName: 'Rumai',
  passportHash: 'f4581c8b321a4f0b78d2345e6789abcd1234567890abcdef1234567890abcdef',
  country: 'Curazao',
  language: 'Papiamento / Español',
  phone: '+5999 578 9012',
  email: 'alejandra.rumai@medicaltrip.test',
  companionNames: ['Xiomahara Eulogia Rumai', 'Giandra', 'Reginald'],
  paxCount: 4,
  arrivalDate: '2026-08-10T10:00:00.000Z',
  departureDate: '2026-08-22T07:00:00.000Z',
  arrivalAirline: 'Z-Air',
  arrivalFlight: '7Z 0511',
  hotelId: 'HOTEL-NOVELTY',
  hotelName: 'Hotel Novelty Suites Poblado',
  status: 'PROGRAMADO',
  notes: 'Estadía quirúrgica de 12 días. HPTU Dr. Mosquera, Ocazionez, CUB, Villa Anita.',
});

const advancesRva077: CashAdvance[] = [
  {
    id: 'adv-077-1',
    date: '2026-08-10T10:00:00.000Z',
    amount: Money.fromAmount(2000000, 'COP'),
    description: 'Anticipo Inicial en Efectivo',
  },
  {
    id: 'adv-077-2',
    date: '2026-08-15T12:00:00.000Z',
    amount: Money.fromAmount(1500000, 'COP'),
    description: 'Segundo Anticipo Bancolombia',
  },
];

const eventsRva077: ItineraryEvent[] = [
  new ItineraryEvent({
    id: 'evt-077-1',
    bookingId: 'RVA077-5',
    dayNumber: 1,
    title: 'Llegada Vuelo Z-Air Curazao + Traslado Novelty Suites Poblado',
    category: 'FLIGHT',
    startDateTime: '2026-08-10T10:00:00.000Z',
    endDateTime: '2026-08-10T12:00:00.000Z',
    location: OperativeTerritory.fromString('Aeropuerto JMC'),
    providerName: 'Flota Ejecutiva Juan Carlos',
    assignedDriverId: 'DRV-02',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(145000, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
  }),
  new ItineraryEvent({
    id: 'evt-077-2',
    bookingId: 'RVA077-5',
    dayNumber: 1,
    title: 'Consulta Gastroenterología HPTU Torre B Cons 154 Dr. Mosquera',
    category: 'CLINICAL',
    startDateTime: '2026-08-10T15:45:00.000Z',
    endDateTime: '2026-08-10T19:45:00.000Z',
    location: OperativeTerritory.fromString('Hospital Pablo Tobon Uribe Robledo'),
    providerId: 'CLINIC-HPTU',
    providerName: 'Hospital Pablo Tobón Uribe',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 4.0,
    cost: Money.fromAmount(62000, 'COP'),
    status: 'COMPLETADO',
  }),
  new ItineraryEvent({
    id: 'evt-077-3',
    bookingId: 'RVA077-5',
    dayNumber: 3,
    title: 'Ayudas Diagnósticas Hernán Ocazionez (Tórax, Abdomen, Mama)',
    category: 'LAB',
    startDateTime: '2026-08-12T09:00:00.000Z',
    endDateTime: '2026-08-12T13:00:00.000Z',
    location: OperativeTerritory.fromString('Poblado Centro Radiologico Hernan Ocazionez'),
    providerId: 'LAB-OCAZIONEZ',
    providerName: 'Centro Radiológico Hernán Ocazionez',
    assignedGuideId: 'GUIA-01',
    financialType: 'OUT_OF_POCKET',
    cost: Money.fromAmount(170755, 'COP'),
    status: 'COMPLETADO',
  }),
  new ItineraryEvent({
    id: 'evt-077-4',
    bookingId: 'RVA077-5',
    dayNumber: 5,
    title: 'Jornada Quirúrgica & Recuperación Post-Op 12 Horas HPTU',
    category: 'CLINICAL',
    startDateTime: '2026-08-14T06:00:00.000Z',
    endDateTime: '2026-08-14T18:00:00.000Z',
    location: OperativeTerritory.fromString('Hospital Pablo Tobon Uribe Robledo'),
    providerId: 'CLINIC-HPTU',
    providerName: 'HPTU Quirófanos',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 12.0,
    cost: Money.fromAmount(231000, 'COP'), // 186k + 45k Tier 4 meal
    status: 'PROGRAMADO',
  }),
];

const shiftsRva077: CompanionShift[] = [
  new CompanionShift({
    id: 'shf-077-1',
    bookingId: 'RVA077-5',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 1,
    date: '2026-08-10',
    hoursLogged: 4.0,
    status: 'COMPLETED',
  }),
  new CompanionShift({
    id: 'shf-077-2',
    bookingId: 'RVA077-5',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 5,
    date: '2026-08-14',
    hoursLogged: 12.0,
    mealSubsidyTier: 'TIER_4',
    status: 'SCHEDULED',
  }),
];

const transfersRva077: DriverTransfer[] = [
  new DriverTransfer({
    id: 'trf-077-1',
    bookingId: 'RVA077-5',
    driverId: 'DRV-02',
    driverName: 'Juan Carlos Montoya',
    vehicleType: 'SEDAN',
    routeType: 'AIRPORT_ARRIVAL',
    origin: OperativeTerritory.fromString('Aeropuerto JMC'),
    destination: OperativeTerritory.fromString('Hotel Novelty Suites Poblado'),
    scheduledTime: '2026-08-10T10:00:00.000Z',
    baseRate: Money.fromAmount(145000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-077-2',
    bookingId: 'RVA077-5',
    driverId: 'DRV-04',
    driverName: 'Gustavo Mora',
    vehicleType: 'DUSTER',
    routeType: 'INTRA_CITY_LONG',
    origin: OperativeTerritory.fromString('Hotel Novelty Suites Poblado'),
    destination: OperativeTerritory.fromString('Hospital Pablo Tobon Uribe Robledo'),
    scheduledTime: '2026-08-10T14:30:00.000Z',
    baseRate: Money.fromAmount(55000, 'COP'),
    status: 'COMPLETED',
  }),
];

const expensesRva077: ReceiptExpense[] = [
  new ReceiptExpense({
    id: 'exp-077-1',
    bookingId: 'RVA077-5',
    category: 'MEDICAL_LAB',
    description: 'Exámenes Radiológicos Hernán Ocazionez (Tórax + Abdomen + Mama)',
    amount: Money.fromAmount(170755, 'COP'),
    date: '2026-08-12T09:00:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
  new ReceiptExpense({
    id: 'exp-077-2',
    bookingId: 'RVA077-5',
    category: 'OTHER',
    description: 'Consulta Ginecología Clínica Universitaria Bolivariana',
    amount: Money.fromAmount(135000, 'COP'),
    date: '2026-08-13T08:30:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
];

const settlementRva077 = SettlementLedger.calculate({
  bookingId: 'RVA077-5',
  expenses: expensesRva077,
  shifts: shiftsRva077,
  transfers: transfersRva077,
  advances: advancesRva077,
});

// =========================================================================
// 5. RVA350 Natalie Rumai (2 Pax, Glaucornea Oftalmología, Hotel 1616)
// =========================================================================
const bookingRva350 = new PatientBooking({
  id: 'bkg-rva350',
  code: 'RVA350-1',
  patientId: 'ENT-PAX-0350',
  firstName: 'Natalie Monica',
  lastName: 'Bito e/v Rumai',
  passportHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
  country: 'Curazao / Bonaire',
  language: 'Papiamento / Holandés / Español',
  phone: '+599 786 4234',
  email: 'natalie.rumai@medicaltrip.test',
  companionNames: ['Alci Amundaray Rumai'],
  paxCount: 2,
  arrivalDate: '2026-09-13T19:30:00.000Z',
  departureDate: '2026-09-29T14:00:00.000Z',
  arrivalAirline: 'Arajet',
  arrivalFlight: 'Arajet S8242C',
  flightLegs: [
    {
      from: 'Curazao (CUR)',
      to: 'Santo Domingo (SDQ)',
      flightNumber: 'DM-101',
      airline: 'Arajet',
      departureTime: '12:00',
      arrivalTime: '14:30',
    },
    {
      from: 'Santo Domingo (SDQ)',
      to: 'Medellín (MDE)',
      flightNumber: 'S8242C',
      airline: 'Arajet',
      departureTime: '18:10',
      arrivalTime: '19:30',
    },
  ],
  treatmentPhase: 'DIAGNOSTIC',
  hotelId: 'HOTEL-1616',
  hotelName: 'HOTEL 1616 Poblado',
  hotelNights: 7,
  hotelNightlyRateCents: 31000000n, // $310.000 COP / noche
  hotelTotalQuotedCents: 217000000n, // $2.170.000 COP
  hotelAgencyDepositCents: 44200000n, // $442.000 COP (1 noche depósito pax)
  hotelDirectPayCents: 172800000n, // $1.728.000 COP (saldo directo en recepción)
  status: 'PROGRAMADO',
  notes: 'Evaluación y diagnóstico en Glaucornea (Dr. Lukas Saldarriaga) para futura Operación Intraocular. Estadía de 17 días (16 noches) en Hotel 1616 y Guatapé.',
  passengers: [
    {
      id: 'bkg-rva350-pax-0',
      fullName: 'Natalie Monica Bito e/v Rumai',
      age: 59,
      ageCategory: 'ADULT',
      role: 'PATIENT',
      passportNumber: 'NP54RL234',
      relationshipWithPrimary: 'Titular',
      requiresHotelBed: true,
      roomPreference: 'DOUBLE_SHARED',
      individualQuotationCOP: 1498750,
      medicalSurvey: {
        hasPreexistingConditions: true,
        conditionsDescription: 'Evaluación oftalmológica para cirugía intraocular',
        takesMedications: false,
        specialRequirements: [],
      },
    },
    {
      id: 'bkg-rva350-pax-1',
      fullName: 'Alci Amundaray Rumai',
      age: 57,
      ageCategory: 'ADULT',
      role: 'COMPANION',
      passportNumber: 'NUL2PC728',
      relationshipWithPrimary: 'Cónyuge',
      requiresHotelBed: true,
      roomPreference: 'DOUBLE_SHARED',
      individualQuotationCOP: 0,
      medicalSurvey: {
        hasPreexistingConditions: false,
        takesMedications: false,
        specialRequirements: [],
      },
    },
  ],
});

const advancesRva350: CashAdvance[] = [
  {
    id: 'adv-350-1',
    date: '2026-09-12T10:00:00.000Z',
    amount: Money.fromAmount(442000, 'COP'),
    description: 'Depósito Garantía Hotel 1616 (1 Noche)',
  },
  {
    id: 'adv-350-2',
    date: '2026-09-14T14:00:00.000Z',
    amount: Money.fromAmount(1056750, 'COP'),
    description: 'Abono Servicios Médicos & Logística Bancolombia',
  },
];

const eventsRva350: ItineraryEvent[] = [
  new ItineraryEvent({
    id: 'evt-350-1',
    bookingId: 'RVA350-1',
    dayNumber: 1,
    title: 'Llegada Vuelo Arajet S8242C (CUR ➔ SDQ ➔ MDE 19:30) + Traslado Aeroturex Hotel 1616',
    category: 'FLIGHT',
    startDateTime: '2026-09-13T19:30:00.000Z',
    endDateTime: '2026-09-13T21:30:00.000Z',
    location: OperativeTerritory.fromString('Aeropuerto JMC'),
    providerName: 'Aeroturex Sedán',
    assignedDriverId: 'DRV-01',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(175000, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
    notes: 'Recepción en puerta internacional JMC con letrero Medical Trip. 2 pasajeros.',
  }),
  new ItineraryEvent({
    id: 'evt-350-2',
    bookingId: 'RVA350-1',
    dayNumber: 2,
    title: 'Traslado Hotel 1616 ➔ Glaucornea Torre Médica Ciudad del Río (Chofer Andrés)',
    category: 'TRANSFER',
    startDateTime: '2026-09-14T08:15:00.000Z',
    endDateTime: '2026-09-14T08:50:00.000Z',
    location: OperativeTerritory.fromString('HOTEL 1616 Poblado'),
    providerName: 'Andrés Chofer Privado',
    assignedDriverId: 'DRV-03',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(45000, 'COP'),
    status: 'COMPLETADO',
    gpsChecked: true,
  }),
  new ItineraryEvent({
    id: 'evt-350-3',
    bookingId: 'RVA350-1',
    dayNumber: 2,
    title: 'Consulta Oftalmología & Exámenes Dr. Lukas Saldarriaga (Glaucornea Cons. 1518-1519)',
    category: 'CLINICAL',
    startDateTime: '2026-09-14T09:00:00.000Z',
    endDateTime: '2026-09-14T12:00:00.000Z',
    location: OperativeTerritory.fromString('Torre Medica Ciudad del Rio'),
    providerId: 'CLINIC-GLAUCORNEA',
    providerName: 'Glaucornea - Dr. Lukas Saldarriaga',
    assignedGuideId: 'GUIA-01',
    financialType: 'OUT_OF_POCKET',
    cost: Money.fromAmount(360000, 'COP'),
    status: 'COMPLETADO',
    notes: 'Recomendado por la Sra. Alejandra Rumai (RVA077). Dilatación y formulación de lentes.',
  }),
  new ItineraryEvent({
    id: 'evt-350-4',
    bookingId: 'RVA350-1',
    dayNumber: 2,
    title: 'Acompañamiento Presencial en Clínica & Diligencias (0.75 Jornada)',
    category: 'CLINICAL',
    startDateTime: '2026-09-14T08:15:00.000Z',
    endDateTime: '2026-09-14T14:15:00.000Z',
    location: OperativeTerritory.fromString('Torre Medica Ciudad del Rio'),
    providerName: 'Medical Trip Acompañamiento',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 6.0,
    cost: Money.fromAmount(165750, 'COP'),
    status: 'COMPLETADO',
  }),
  new ItineraryEvent({
    id: 'evt-350-5',
    bookingId: 'RVA350-1',
    dayNumber: 2,
    title: 'Traslado Clínica ➔ Centro Comercial Oviedo (Cambio de Dólares) ➔ Hotel 1616',
    category: 'TRANSFER',
    startDateTime: '2026-09-14T13:00:00.000Z',
    endDateTime: '2026-09-14T15:00:00.000Z',
    location: OperativeTerritory.fromString('Centro Comercial Oviedo'),
    providerName: 'Andrés Chofer Privado',
    assignedDriverId: 'DRV-03',
    financialType: 'FLEET_TAXI',
    cost: Money.fromAmount(85000, 'COP'),
    status: 'COMPLETADO',
  }),
  new ItineraryEvent({
    id: 'evt-350-6',
    bookingId: 'RVA350-1',
    dayNumber: 3,
    title: 'Graffiti Tour Comuna 13 (Transporte Privado + Acompañamiento Medical 6 Horas)',
    category: 'TRANSFER',
    startDateTime: '2026-09-15T15:30:00.000Z',
    endDateTime: '2026-09-15T21:30:00.000Z',
    location: OperativeTerritory.fromString('Comuna 13 San Javier Medellín'),
    providerName: 'Turibus / Andrés',
    assignedGuideId: 'GUIA-01',
    financialType: 'GUIDE_FEE',
    guideHours: 6.0,
    cost: Money.fromAmount(391000, 'COP'), // $170k transporte + $221k acompañamiento 6h
    status: 'PROGRAMADO',
    notes: 'Punto de encuentro: Parque El Poblado. Guía local de Comuna 13 a contratar en sitio (~$200.000 COP).',
  }),
  new ItineraryEvent({
    id: 'evt-350-7',
    bookingId: 'RVA350-1',
    dayNumber: 17,
    title: 'Traslado Hotel 1616 ➔ Aeropuerto JMC + Vuelo Retorno Arajet a Curazao',
    category: 'FLIGHT',
    startDateTime: '2026-09-29T10:00:00.000Z',
    endDateTime: '2026-09-29T14:00:00.000Z',
    location: OperativeTerritory.fromString('Aeropuerto JMC'),
    providerName: 'Aeroturex Sedán',
    assignedDriverId: 'DRV-01',
    financialType: 'FLEET_TAXI',
    cost: Money.zero(),
    status: 'PROGRAMADO',
    notes: 'Traslado de regreso cubierto en el paquete ida/vuelta de Aeroturex.',
  }),
];

const shiftsRva350: CompanionShift[] = [
  new CompanionShift({
    id: 'shf-350-1',
    bookingId: 'RVA350-1',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 2,
    date: '2026-09-14',
    hoursLogged: 6.0,
    status: 'COMPLETED',
  }),
  new CompanionShift({
    id: 'shf-350-2',
    bookingId: 'RVA350-1',
    guideId: 'GUIA-01',
    guideName: 'Yenny Roberto',
    dayNumber: 3,
    date: '2026-09-15',
    hoursLogged: 6.0,
    status: 'SCHEDULED',
  }),
];

const transfersRva350: DriverTransfer[] = [
  new DriverTransfer({
    id: 'trf-350-1',
    bookingId: 'RVA350-1',
    driverId: 'DRV-01',
    driverName: 'Ramón Rosero',
    vehicleType: 'SEDAN',
    routeType: 'AIRPORT_ARRIVAL',
    origin: OperativeTerritory.fromString('Aeropuerto JMC'),
    destination: OperativeTerritory.fromString('HOTEL 1616 Poblado'),
    scheduledTime: '2026-09-13T19:30:00.000Z',
    baseRate: Money.fromAmount(175000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-350-2',
    bookingId: 'RVA350-1',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'SEDAN',
    routeType: 'INTRA_CITY_SHORT',
    origin: OperativeTerritory.fromString('HOTEL 1616 Poblado'),
    destination: OperativeTerritory.fromString('Torre Medica Ciudad del Rio'),
    scheduledTime: '2026-09-14T08:15:00.000Z',
    baseRate: Money.fromAmount(45000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-350-3',
    bookingId: 'RVA350-1',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'SEDAN',
    routeType: 'INTRA_CITY_SHORT',
    origin: OperativeTerritory.fromString('Torre Medica Ciudad del Rio'),
    destination: OperativeTerritory.fromString('Centro Comercial Oviedo'),
    scheduledTime: '2026-09-14T13:00:00.000Z',
    baseRate: Money.fromAmount(40000, 'COP'),
    status: 'COMPLETED',
  }),
  new DriverTransfer({
    id: 'trf-350-4',
    bookingId: 'RVA350-1',
    driverId: 'DRV-03',
    driverName: 'Andrés Cantero',
    vehicleType: 'SEDAN',
    routeType: 'INTRA_CITY_LONG',
    origin: OperativeTerritory.fromString('HOTEL 1616 Poblado'),
    destination: OperativeTerritory.fromString('Comuna 13 San Javier Medellín'),
    scheduledTime: '2026-09-15T15:30:00.000Z',
    baseRate: Money.fromAmount(85000, 'COP'),
    status: 'CONFIRMED',
  }),
];

const expensesRva350: ReceiptExpense[] = [
  new ReceiptExpense({
    id: 'exp-350-1',
    bookingId: 'RVA350-1',
    category: 'OTHER',
    description: 'Póliza Asistencia Médica Colasistencia (30 días)',
    amount: Money.fromAmount(120000, 'COP'),
    date: '2026-09-12T10:00:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
  new ReceiptExpense({
    id: 'exp-350-2',
    bookingId: 'RVA350-1',
    category: 'SIM_CARD',
    description: '2 SIM Cards Físicas Claro ($15.000 c/u)',
    amount: Money.fromAmount(30000, 'COP'),
    date: '2026-09-13T18:00:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
  new ReceiptExpense({
    id: 'exp-350-3',
    bookingId: 'RVA350-1',
    category: 'SIM_CARD',
    description: '2 Recargas de Datos 15 Días Claro ($38.000 c/u)',
    amount: Money.fromAmount(76000, 'COP'),
    date: '2026-09-14T08:00:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
  new ReceiptExpense({
    id: 'exp-350-4',
    bookingId: 'RVA350-1',
    category: 'PARKING',
    description: 'Parqueadero Graffiti Tour Comuna 13 (5 Horas)',
    amount: Money.fromAmount(50000, 'COP'),
    date: '2026-09-15T18:00:00.000Z',
    audited: true,
    status: 'APPROVED',
  }),
];

const settlementRva350 = SettlementLedger.calculate({
  bookingId: 'RVA350-1',
  expenses: expensesRva350,
  shifts: shiftsRva350,
  transfers: transfersRva350,
  advances: advancesRva350,
});

// =========================================================================
// ACTIVE ARCHETYPES CATALOG (Active in UI: Exclusively Natalie Rumai RVA-350)
// =========================================================================
export const ACTIVE_ARCHETYPES_DATA: Record<string, ArchetypeBundle> = {
  rva350: {
    id: 'rva350',
    code: 'RVA350-1',
    name: 'Natalie Rumai (Oftalmología & Glaucornea)',
    description: 'Diagnóstico Oftalmológico Dr. Lukas Saldarriaga, Hotel 1616 (7 Noches), Tour Comuna 13 y Arajet Escala',
    badgeColor: 'amber',
    booking: bookingRva350,
    events: eventsRva350,
    shifts: shiftsRva350,
    transfers: transfersRva350,
    expenses: expensesRva350,
    advances: advancesRva350,
    settlement: settlementRva350,
  },
};

// =========================================================================
// MASTER ARCHETYPES CATALOG (Full empirical fixtures for test verification)
// =========================================================================
export const ARCHETYPES_DATA: Record<string, ArchetypeBundle> = {
  rva350: ACTIVE_ARCHETYPES_DATA.rva350,
  rva171: {
    id: 'rva171',
    code: 'RVA171-4',
    name: 'Catia Rodrigues (Grupo Familiar 5 Pax)',
    description: 'Cirugía Oftalmológica Clofán, Ecografías CIMA, Urología Pediátrica y Flota Uber XL',
    badgeColor: 'sky',
    booking: bookingRva171,
    events: eventsRva171,
    shifts: shiftsRva171,
    transfers: transfersRva171,
    expenses: expensesRva171,
    advances: advancesRva171,
    settlement: settlementRva171,
  },
  rva282: {
    id: 'rva282',
    code: 'RVA282-5',
    name: 'George Hernandez (Chequeo Cardio & Uro)',
    description: 'Chequeo Cardiovascular Cardio VID, Urología CES Oviedo, 32 días en Ed. Park 42',
    badgeColor: 'indigo',
    booking: bookingRva282,
    events: eventsRva282,
    shifts: shiftsRva282,
    transfers: transfersRva282,
    expenses: expensesRva282,
    advances: advancesRva282,
    settlement: settlementRva282,
  },
  rva341: {
    id: 'rva341',
    code: 'RVA341-1',
    name: 'Eduard Hogenboom (Bilingüe Inglés / CES)',
    description: 'Cirugía Urológica CES Oviedo y Toma de Muestras Domiciliaria en Hab. 1004 Hotel Inntu',
    badgeColor: 'teal',
    booking: bookingRva341,
    events: eventsRva341,
    shifts: shiftsRva341,
    transfers: transfersRva341,
    expenses: expensesRva341,
    advances: advancesRva341,
    settlement: settlementRva341,
  },
  rva077: {
    id: 'rva077',
    code: 'RVA077-5',
    name: 'Alejandra Rumai (Jornada Quirúrgica 12 Días)',
    description: 'Cirugía de Alta Complejidad HPTU, Novelty Suites Poblado, 12 Días de Acompañamiento',
    badgeColor: 'rose',
    booking: bookingRva077,
    events: eventsRva077,
    shifts: shiftsRva077,
    transfers: transfersRva077,
    expenses: expensesRva077,
    advances: advancesRva077,
    settlement: settlementRva077,
  },
};

export const HISTORICAL_ARCHETYPES_DATA = ARCHETYPES_DATA;

