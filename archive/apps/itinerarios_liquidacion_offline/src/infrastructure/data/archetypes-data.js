import { KNOWN_OPERATIONAL_LOCATIONS } from '../hardware/simulated-geolocation-adapter.js';
import { Money } from '../../domain/value-objects/money.js';
import { ItineraryItem } from '../../domain/entities/itinerary-item.js';
import { SettlementLedger } from '../../domain/entities/settlement-ledger.js';
import { ExpenseItem } from '../../domain/entities/expense-item.js';
import { DriverTransfer } from '../../domain/entities/driver-transfer.js';
import { CompanionShift } from '../../domain/entities/companion-shift.js';

/**
 * 4 Canonical Google Drive Operational Archetypes Fixture Data.
 * Fully enriched with real multi-day medical schedules, exact BigInt finances,
 * geolocation coordinates, and actor assignments.
 */
export const ARCHETYPES_DATA = Object.freeze({
  // ==========================================================================
  // ARCHETYPE 1: RVA171 Catia x5 (Aesthetic & Bariatric 5-Day Stay)
  // ==========================================================================
  RVA171: {
    reservationCode: 'RVA171',
    patientUuid: 'ENT-PAX-0171',
    patientName: 'Catia Rodrigues',
    originCountry: 'Estados Unidos / Brasil',
    specialty: 'Cirugía Plástica y Estética',
    currency: 'COP',
    durationDays: 5,
    arrivalDate: '2026-09-01',
    departureDate: '2026-09-05',
    hotel: 'Hotel Diez Categoría Colombia (El Poblado)',
    advances: [
      { amountInCents: '200000000', currency: 'COP', amount: 2000000, notes: 'Anticipo inicial caja menor' }
    ],
    itineraryItems: [
      {
        id: 'ITN-RVA171-D1-01',
        dayNumber: 1,
        date: '2026-09-01',
        timeWindow: '09:00 - 11:30',
        title: 'Recepción en Aeropuerto JMC y Traslado a Hotel',
        description: 'Llegada vuelo internacional. Traslado ejecutivo hacia Hotel Diez en El Poblado.',
        specialty: 'Logística de Llegada',
        clinicName: 'Aeropuerto JMC / Hotel Diez',
        location: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        status: 'COMPLETADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: false
      },
      {
        id: 'ITN-RVA171-D1-02',
        dayNumber: 1,
        date: '2026-09-01',
        timeWindow: '14:00 - 16:30',
        title: 'Exámenes de Laboratorio Clínico Prequirúrgicos',
        description: 'Toma de muestras de sangre, tiempos de coagulación y cuadro hemático completo.',
        specialty: 'Laboratorio Clínico',
        clinicName: 'Laboratorio Clínico Echavarría Poblado',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_MEDELLIN_POBLADO,
        status: 'COMPLETADO',
        assignedActorIds: ['GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true,
        requiresReceipt: true
      },
      {
        id: 'ITN-RVA171-D2-01',
        dayNumber: 2,
        date: '2026-09-02',
        timeWindow: '08:00 - 10:30',
        title: 'Valoración Pre-Anestésica y Quirúrgica',
        description: 'Consulta con cirujano plástico y anestesiólogo en Clínica El Rosario Tesoro.',
        specialty: 'Cirugía Plástica',
        clinicName: 'Clínica El Rosario - Sede El Tesoro',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO,
        status: 'EN_SITIO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA171-D2-02',
        dayNumber: 2,
        date: '2026-09-02',
        timeWindow: '11:00 - 12:30',
        title: 'Compra de Medicamentos e Insumos Postquirúrgicos',
        description: 'Adquisición de antibióticos, analgésicos y faja postquirúrgica en Cruz Verde.',
        specialty: 'Farmacia',
        clinicName: 'Droguería Cruz Verde El Tesoro',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO,
        status: 'PROGRAMADO',
        assignedActorIds: ['GUIA-LILIANA-01'],
        requiresReceipt: true
      },
      {
        id: 'ITN-RVA171-D3-01',
        dayNumber: 3,
        date: '2026-09-03',
        timeWindow: '06:30 - 15:00',
        title: 'Procedimiento Quirúrgico y Recuperación en Clínica',
        description: 'Ingreso a quirófano y monitoreo postoperatorio inmediato con enfermera.',
        specialty: 'Cirugía Plástica',
        clinicName: 'Clínica El Rosario - Sede El Tesoro',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'NURSE-YENNY-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA171-D4-01',
        dayNumber: 4,
        date: '2026-09-04',
        timeWindow: '10:00 - 12:00',
        title: 'Curación y Primer Drenaje Linfático Postoperatorio',
        description: 'Sesión de fisioterapia y drenaje linfático asistido por enfermera bilingüe.',
        specialty: 'Fisioterapia Postquirúrgica',
        clinicName: 'Hotel Diez (Habitación)',
        location: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_DIEZ_POBLADO,
        status: 'PROGRAMADO',
        assignedActorIds: ['NURSE-YENNY-01'],
        requiresSignature: true
      },
      {
        id: 'ITN-RVA171-D5-01',
        dayNumber: 5,
        date: '2026-09-05',
        timeWindow: '13:00 - 16:00',
        title: 'Alta Médica y Traslado a Aeropuerto JMC',
        description: 'Revisión final de egreso, entrega de historia clínica y transfer a JMC.',
        specialty: 'Salida y Traslado',
        clinicName: 'Clínica El Rosario / Aeropuerto JMC',
        location: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      }
    ],
    expenses: [
      {
        id: 'EXP-RVA171-01',
        itineraryItemId: 'ITN-RVA171-D1-02',
        category: 'MEDICAL_LAB',
        description: 'Laboratorio Echavarría - Pruebas prequirúrgicas completas',
        amountInCents: '12500000',
        currency: 'COP',
        actorId: 'GUIA-LILIANA-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      },
      {
        id: 'EXP-RVA171-02',
        itineraryItemId: 'ITN-RVA171-D2-02',
        category: 'PHARMACY',
        description: 'Cruz Verde - Antibióticos, analgésicos y apósitos',
        amountInCents: '8500000',
        currency: 'COP',
        actorId: 'GUIA-LILIANA-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      }
    ],
    driverTransfers: [
      {
        id: 'TRF-RVA171-01',
        driverActorId: 'DRV-RAMON-01',
        itineraryItemId: 'ITN-RVA171-D1-01',
        origin: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        destination: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_DIEZ_POBLADO,
        flatRateInCents: '13000000',
        surchargeInCents: '1500000',
        currency: 'COP',
        status: 'COMPLETED'
      },
      {
        id: 'TRF-RVA171-02',
        driverActorId: 'DRV-RAMON-01',
        itineraryItemId: 'ITN-RVA171-D2-01',
        origin: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_DIEZ_POBLADO,
        destination: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO,
        flatRateInCents: '3500000',
        surchargeInCents: '0',
        currency: 'COP',
        status: 'ASSIGNED'
      }
    ],
    companionShifts: [
      {
        id: 'SHF-RVA171-01',
        guideActorId: 'GUIA-LILIANA-01',
        dayNumber: 1,
        startTime: '2026-09-01T08:30:00Z',
        endTime: '2026-09-01T16:30:00Z',
        totalHours: 8,
        hourlyRateInCents: '4000000',
        mealSubsidyInCents: '2000000',
        currency: 'COP',
        status: 'COMPLETED'
      }
    ]
  },

  // ==========================================================================
  // ARCHETYPE 2: RVA282 George Cardio (Cardiology 8-Day Stay, USD Currency)
  // ==========================================================================
  RVA282: {
    reservationCode: 'RVA282',
    patientUuid: 'ENT-PAX-0282',
    patientName: 'George Miller',
    originCountry: 'Canadá',
    specialty: 'Cardiología Intervencionista',
    currency: 'USD',
    durationDays: 8,
    arrivalDate: '2026-09-10',
    departureDate: '2026-09-17',
    hotel: 'Hotel Poblado Plaza',
    advances: [
      { amountInCents: '350000', currency: 'USD', amount: 3500, notes: 'Advance deposit for medical care' }
    ],
    itineraryItems: [
      {
        id: 'ITN-RVA282-D1-01',
        dayNumber: 1,
        date: '2026-09-10',
        timeWindow: '11:00 - 13:00',
        title: 'Airport VIP Reception & Hotel Check-in',
        description: 'International arrival from Miami. Private SUV transfer to Hotel Poblado Plaza.',
        specialty: 'Arrival Logistics',
        clinicName: 'JMC Airport / Hotel Poblado Plaza',
        location: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        status: 'COMPLETADO',
        assignedActorIds: ['DRV-RAMON-01', 'NURSE-YENNY-01'],
        requiresGpsCheckIn: true
      },
      {
        id: 'ITN-RVA282-D2-01',
        dayNumber: 2,
        date: '2026-09-11',
        timeWindow: '08:00 - 11:30',
        title: 'Comprehensive Cardiovascular Assessment & Stress Test',
        description: 'Clinical evaluation, resting ECG, and treadmill stress test at Cardio VID.',
        specialty: 'Cardiología',
        clinicName: 'Clínica Cardio VID',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CARDIO_VID,
        status: 'COMPLETADO',
        assignedActorIds: ['DRV-RAMON-01', 'NURSE-YENNY-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA282-D3-01',
        dayNumber: 3,
        date: '2026-09-12',
        timeWindow: '09:00 - 11:00',
        title: 'Color Doppler Transthoracic Echocardiogram',
        description: 'Advanced ultrasound cardiac imaging and ejection fraction measurement.',
        specialty: 'Ecocardiografía',
        clinicName: 'Clínica Cardio VID',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CARDIO_VID,
        status: 'PROGRAMADO',
        assignedActorIds: ['NURSE-YENNY-01'],
        requiresSignature: true
      },
      {
        id: 'ITN-RVA282-D4-01',
        dayNumber: 4,
        date: '2026-09-13',
        timeWindow: '07:00 - 14:00',
        title: 'Diagnostic Coronary Catheterization (Angiography)',
        description: 'Hemodynamic evaluation in catheterization lab and 6-hour observation recovery.',
        specialty: 'Hemodinamia',
        clinicName: 'Clínica Cardio VID',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CARDIO_VID,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'NURSE-YENNY-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA282-D7-01',
        dayNumber: 7,
        date: '2026-09-16',
        timeWindow: '10:00 - 11:30',
        title: 'Cardiology Discharge & Fit-to-Fly Clearance',
        description: 'Final medical evaluation and certification for international flight return.',
        specialty: 'Cardiología',
        clinicName: 'Clínica Cardio VID',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CARDIO_VID,
        status: 'PROGRAMADO',
        assignedActorIds: ['NURSE-YENNY-01'],
        requiresSignature: true
      }
    ],
    expenses: [
      {
        id: 'EXP-RVA282-01',
        itineraryItemId: 'ITN-RVA282-D2-01',
        category: 'MEDICAL_LAB',
        description: 'Specialized cardiac biomarker enzyme panel',
        amountInCents: '25000',
        currency: 'USD',
        actorId: 'NURSE-YENNY-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      },
      {
        id: 'EXP-RVA282-02',
        itineraryItemId: 'ITN-RVA282-D4-01',
        category: 'OTHER',
        description: 'Continuous 48h telemetry monitor rental',
        amountInCents: '18000',
        currency: 'USD',
        actorId: 'NURSE-YENNY-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      }
    ],
    driverTransfers: [
      {
        id: 'TRF-RVA282-01',
        driverActorId: 'DRV-RAMON-01',
        itineraryItemId: 'ITN-RVA282-D1-01',
        origin: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        destination: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_POBLADO_PLAZA,
        flatRateInCents: '5000',
        surchargeInCents: '1000',
        currency: 'USD',
        status: 'COMPLETED'
      }
    ],
    companionShifts: [
      {
        id: 'SHF-RVA282-01',
        guideActorId: 'NURSE-YENNY-01',
        dayNumber: 2,
        startTime: '2026-09-11T07:30:00Z',
        endTime: '2026-09-11T13:30:00Z',
        totalHours: 6,
        hourlyRateInCents: '2500',
        mealSubsidyInCents: '1500',
        currency: 'USD',
        status: 'COMPLETED'
      }
    ]
  },

  // ==========================================================================
  // ARCHETYPE 3: RVA341 Hogenboom CES (Ophthalmology & Maxillofacial 6-Day Stay)
  // ==========================================================================
  RVA341: {
    reservationCode: 'RVA341',
    patientUuid: 'ENT-PAX-0341',
    patientName: 'Hendrik Hogenboom',
    originCountry: 'Países Bajos (Holanda)',
    specialty: 'Oftalmología y Cirugía Maxilofacial',
    currency: 'COP',
    durationDays: 6,
    arrivalDate: '2026-09-15',
    departureDate: '2026-09-20',
    hotel: 'Hotel Inntu Laureles',
    advances: [
      { amountInCents: '500000000', currency: 'COP', amount: 5000000, notes: 'Anticipo inicial procedimientos CES' }
    ],
    itineraryItems: [
      {
        id: 'ITN-RVA341-D1-01',
        dayNumber: 1,
        date: '2026-09-15',
        timeWindow: '10:00 - 12:30',
        title: 'Recepción en Aeropuerto JMC y Acomodación Laureles',
        description: 'Llegada vuelo desde Ámsterdam con escala Bogotá. Traslado a Hotel Inntu.',
        specialty: 'Logística de Llegada',
        clinicName: 'Aeropuerto JMC / Laureles',
        location: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        status: 'COMPLETADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true
      },
      {
        id: 'ITN-RVA341-D2-01',
        dayNumber: 2,
        date: '2026-09-16',
        timeWindow: '08:30 - 11:30',
        title: 'Tomografía Corneal y Consulta Oftalmología Clofán',
        description: 'Topografía Pentacam y refracción ciclopléjica con especialista.',
        specialty: 'Oftalmología',
        clinicName: 'Clínica Clofán',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CLOFAN,
        status: 'COMPLETADO',
        assignedActorIds: ['GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA341-D3-01',
        dayNumber: 3,
        date: '2026-09-17',
        timeWindow: '07:00 - 13:00',
        title: 'Intervención Maxilofacial en Clínica CES Robledo',
        description: 'Cirugía ortognática menor y reconstrucción dental guiada por TAC.',
        specialty: 'Cirugía Maxilofacial',
        clinicName: 'Clínica CES Robledo',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CES_ROBLEDO,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA341-D4-01',
        dayNumber: 4,
        date: '2026-09-18',
        timeWindow: '09:00 - 12:00',
        title: 'Control Postquirúrgico y Medicación Oftálmica',
        description: 'Control de presión intraocular y retiro de apósitos en Clofán.',
        specialty: 'Oftalmología Postoperatoria',
        clinicName: 'Clínica Clofán',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_CLOFAN,
        status: 'PROGRAMADO',
        assignedActorIds: ['GUIA-LILIANA-01'],
        requiresSignature: true
      }
    ],
    expenses: [
      {
        id: 'EXP-RVA341-01',
        itineraryItemId: 'ITN-RVA341-D2-01',
        category: 'OTHER',
        description: 'Clofán - Copago Tomografía Pentacam de Alta Resolución',
        amountInCents: '25000000',
        currency: 'COP',
        actorId: 'GUIA-LILIANA-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      }
    ],
    driverTransfers: [
      {
        id: 'TRF-RVA341-01',
        driverActorId: 'DRV-RAMON-01',
        itineraryItemId: 'ITN-RVA341-D1-01',
        origin: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        destination: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_POBLADO_PLAZA,
        flatRateInCents: '14000000',
        surchargeInCents: '1000000',
        currency: 'COP',
        status: 'COMPLETED'
      }
    ],
    companionShifts: [
      {
        id: 'SHF-RVA341-01',
        guideActorId: 'GUIA-LILIANA-01',
        dayNumber: 2,
        startTime: '2026-09-16T08:00:00Z',
        endTime: '2026-09-16T14:00:00Z',
        totalHours: 6,
        hourlyRateInCents: '4200000',
        mealSubsidyInCents: '2000000',
        currency: 'COP',
        status: 'COMPLETED'
      }
    ]
  },

  // ==========================================================================
  // ARCHETYPE 4: RVA077 Rumai Cirugía 12d (Complex Surgical 12-Day Stay)
  // ==========================================================================
  RVA077: {
    reservationCode: 'RVA077',
    patientUuid: 'ENT-PAX-0077',
    patientName: 'Rumai Al-Mansoor',
    originCountry: 'Emiratos Árabes Unidos',
    specialty: 'Rehabilitación y Cirugía Compleja Multidisciplinaria',
    currency: 'COP',
    durationDays: 12,
    arrivalDate: '2026-10-01',
    departureDate: '2026-10-12',
    hotel: 'Hotel Poblado Plaza (Suite Médica)',
    advances: [
      { amountInCents: '1500000000', currency: 'COP', amount: 15000000, notes: 'Anticipo inicial 15M COP para 12 días' }
    ],
    itineraryItems: [
      {
        id: 'ITN-RVA077-D1-01',
        dayNumber: 1,
        date: '2026-10-01',
        timeWindow: '14:00 - 17:00',
        title: 'Llegada Internacional JMC y Suite Check-in',
        description: 'Recepción bilingüe en JMC Rionegro. Traslado de alta seguridad a Poblado Plaza.',
        specialty: 'Logística de Llegada VIP',
        clinicName: 'Aeropuerto JMC / Poblado Plaza',
        location: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        status: 'COMPLETADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true
      },
      {
        id: 'ITN-RVA077-D2-01',
        dayNumber: 2,
        date: '2026-10-02',
        timeWindow: '08:00 - 13:00',
        title: 'Junta Médica Multidisciplinaria en HPTU',
        description: 'Evaluación conjunta cirugía reconstructiva, anestesia y cardiología en HPTU.',
        specialty: 'Junta Médica Quirúrgica',
        clinicName: 'Hospital Pablo Tobón Uribe (HPTU)',
        location: KNOWN_OPERATIONAL_LOCATIONS.HOSPITAL_PABLO_TOBON_URIBE,
        status: 'COMPLETADO',
        assignedActorIds: ['DRV-RAMON-01', 'NURSE-YENNY-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA077-D4-01',
        dayNumber: 4,
        date: '2026-10-04',
        timeWindow: '06:00 - 16:00',
        title: 'Cirugía Mayor Reconstructiva Fase 1 en HPTU',
        description: 'Procedimiento de alta complejidad en quirófano central de HPTU.',
        specialty: 'Cirugía Reconstructiva',
        clinicName: 'Hospital Pablo Tobón Uribe (HPTU)',
        location: KNOWN_OPERATIONAL_LOCATIONS.HOSPITAL_PABLO_TOBON_URIBE,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'NURSE-YENNY-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA077-D8-01',
        dayNumber: 8,
        date: '2026-10-08',
        timeWindow: '09:00 - 11:30',
        title: 'Terapia de Rehabilitación Fisiátrica y Cámara Hiperbárica',
        description: 'Sesión de oxigenación hiperbárica para aceleración de cicatrización tisular.',
        specialty: 'Medicina Hiperbárica',
        clinicName: 'Clínica El Rosario - Sede El Tesoro',
        location: KNOWN_OPERATIONAL_LOCATIONS.CLINICA_EL_ROSARIO_TESORO,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      },
      {
        id: 'ITN-RVA077-D12-01',
        dayNumber: 12,
        date: '2026-10-12',
        timeWindow: '12:00 - 15:30',
        title: 'Despedida Oficial, Certificados y Traslado JMC',
        description: 'Entrega de dossiers médicos en inglés/español, cierre de cuentas y transfer.',
        specialty: 'Cierre y Retorno',
        clinicName: 'Aeropuerto JMC Rionegro',
        location: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        status: 'PROGRAMADO',
        assignedActorIds: ['DRV-RAMON-01', 'GUIA-LILIANA-01'],
        requiresGpsCheckIn: true,
        requiresSignature: true
      }
    ],
    expenses: [
      {
        id: 'EXP-RVA077-01',
        itineraryItemId: 'ITN-RVA077-D2-01',
        category: 'MEDICAL_LAB',
        description: 'HPTU - Paquete integral de imágenes diagnósticas TAC 3D',
        amountInCents: '145000000',
        currency: 'COP',
        actorId: 'NURSE-YENNY-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      },
      {
        id: 'EXP-RVA077-02',
        itineraryItemId: 'ITN-RVA077-D4-01',
        category: 'PHARMACY',
        description: 'Insumos quirúrgicos especializados de importación',
        amountInCents: '280000000',
        currency: 'COP',
        actorId: 'NURSE-YENNY-01',
        status: 'APPROVED',
        auditedBy: 'FIN-AUDITOR-01'
      }
    ],
    driverTransfers: [
      {
        id: 'TRF-RVA077-01',
        driverActorId: 'DRV-RAMON-01',
        itineraryItemId: 'ITN-RVA077-D1-01',
        origin: KNOWN_OPERATIONAL_LOCATIONS.AEROPUERTO_JMC_RIONEGRO,
        destination: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_POBLADO_PLAZA,
        flatRateInCents: '18000000',
        surchargeInCents: '3000000',
        currency: 'COP',
        status: 'COMPLETED'
      },
      {
        id: 'TRF-RVA077-02',
        driverActorId: 'DRV-RAMON-01',
        itineraryItemId: 'ITN-RVA077-D2-01',
        origin: KNOWN_OPERATIONAL_LOCATIONS.HOTEL_POBLADO_PLAZA,
        destination: KNOWN_OPERATIONAL_LOCATIONS.HOSPITAL_PABLO_TOBON_URIBE,
        flatRateInCents: '6500000',
        surchargeInCents: '0',
        currency: 'COP',
        status: 'COMPLETED'
      }
    ],
    companionShifts: [
      {
        id: 'SHF-RVA077-01',
        guideActorId: 'GUIA-LILIANA-01',
        dayNumber: 1,
        startTime: '2026-10-01T13:00:00Z',
        endTime: '2026-10-01T21:00:00Z',
        totalHours: 8,
        hourlyRateInCents: '4500000',
        mealSubsidyInCents: '2500000',
        currency: 'COP',
        status: 'COMPLETED'
      },
      {
        id: 'SHF-RVA077-02',
        guideActorId: 'NURSE-YENNY-01',
        dayNumber: 2,
        startTime: '2026-10-02T07:30:00Z',
        endTime: '2026-10-02T15:30:00Z',
        totalHours: 8,
        hourlyRateInCents: '5000000',
        mealSubsidyInCents: '2500000',
        currency: 'COP',
        status: 'COMPLETED'
      }
    ]
  }
});

/**
 * Retrieves archetype fixture data by code.
 * @param {'RVA171' | 'RVA282' | 'RVA341' | 'RVA077' | string} code
 * @returns {object | null}
 */
export function getArchetype(code) {
  if (!code) return null;
  const cleanCode = String(code).toUpperCase().trim();
  return ARCHETYPES_DATA[cleanCode] || null;
}

/**
 * Returns list of all 4 canonical operational archetypes.
 * @returns {object[]}
 */
export function getAllArchetypes() {
  return Object.values(ARCHETYPES_DATA);
}

/**
 * Hydrates relational storage adapter and blob storage with full archetype data.
 * @param {import('../storage/sqlite-storage-adapter.js').SqliteStorageAdapter} storagePort
 * @param {import('../storage/dexie-blob-storage-adapter.js').DexieBlobStorageAdapter} [blobStoragePort]
 * @param {'RVA171' | 'RVA282' | 'RVA341' | 'RVA077'} archetypeCode
 * @returns {Promise<{ ledger: SettlementLedger, itemsCount: number, expensesCount: number }>}
 */
export async function hydrateStorageWithArchetype(storagePort, blobStoragePort = null, archetypeCode = 'RVA171') {
  const data = getArchetype(archetypeCode);
  if (!data) {
    throw new Error(`[Archetypes Data] Arquetipo desconocido: '${archetypeCode}'`);
  }

  // 1. Save Patient Record
  await storagePort.savePatientRecord({
    patientUuid: data.patientUuid,
    fullName: data.patientName,
    reservationCode: data.reservationCode,
    originCountry: data.originCountry,
    specialty: data.specialty,
    arrivalDate: data.arrivalDate,
    departureDate: data.departureDate,
    notes: `Hospedaje: ${data.hotel}`
  });

  // 2. Save Itinerary Items
  for (const itemData of data.itineraryItems) {
    const item = new ItineraryItem(itemData);
    await storagePort.saveItinerary(item, data.reservationCode);
  }

  // 3. Create and Save Settlement Ledger
  const ledger = new SettlementLedger({
    reservationCode: data.reservationCode,
    patientUuid: data.patientUuid,
    currency: data.currency
  });

  // Add advances
  for (const adv of data.advances) {
    ledger.addAdvance(Money.fromCents(adv.amountInCents, adv.currency), false);
  }

  // Add expenses
  for (const expData of data.expenses) {
    const exp = new ExpenseItem({
      id: expData.id,
      itineraryItemId: expData.itineraryItemId,
      category: expData.category,
      description: expData.description,
      amount: Money.fromCents(expData.amountInCents, expData.currency),
      actorId: expData.actorId,
      status: expData.status,
      auditedBy: expData.auditedBy
    });
    ledger.addExpense(exp, false);
    await storagePort.saveExpense(exp, data.reservationCode);
  }

  // Add driver transfers
  for (const trData of data.driverTransfers) {
    const tr = new DriverTransfer({
      id: trData.id,
      driverActorId: trData.driverActorId,
      itineraryItemId: trData.itineraryItemId,
      origin: trData.origin,
      destination: trData.destination,
      flatRate: Money.fromCents(trData.flatRateInCents, trData.currency),
      surcharge: Money.fromCents(trData.surchargeInCents || '0', trData.currency),
      status: trData.status
    });
    ledger.addDriverTransfer(tr, false);
    await storagePort.saveDriverTransfer(tr, data.reservationCode);
  }

  // Add companion shifts
  for (const shData of data.companionShifts) {
    const sh = new CompanionShift({
      id: shData.id,
      guideActorId: shData.guideActorId,
      dayNumber: shData.dayNumber,
      startTime: shData.startTime,
      endTime: shData.endTime,
      totalHours: shData.totalHours,
      hourlyRate: Money.fromCents(shData.hourlyRateInCents, shData.currency),
      mealSubsidy: Money.fromCents(shData.mealSubsidyInCents, shData.currency),
      status: shData.status
    });
    ledger.addCompanionShift(sh, false);
    await storagePort.saveCompanionShift(sh, data.reservationCode);
  }

  ledger.recalculate();
  await storagePort.saveSettlementLedger(ledger);

  // Optional: Seed sample signature / receipt blob if blobStoragePort provided
  if (blobStoragePort) {
    const sampleSvg = `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg"><path d="M 50 100 Q 150 50, 250 120 T 350 100" stroke="#006699" stroke-width="3" fill="none"/></svg>`;
    await blobStoragePort.saveBlob(`blob-sig-${data.reservationCode.toLowerCase()}`, 'image/svg+xml', sampleSvg, {
      signerName: data.patientName,
      patientUuid: data.patientUuid,
      reservationCode: data.reservationCode
    });
  }

  return {
    ledger,
    itemsCount: data.itineraryItems.length,
    expensesCount: data.expenses.length
  };
}
