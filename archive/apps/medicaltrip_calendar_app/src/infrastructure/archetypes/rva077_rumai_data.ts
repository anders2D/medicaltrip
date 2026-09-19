import { Patient } from '../../domain/entities/Patient';
import { Booking } from '../../domain/entities/Booking';
import { ItineraryMilestone } from '../../domain/entities/ItineraryMilestone';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';
import { Money } from '../../domain/values/Money';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';
import { ArchetypeBundle } from './rva171_catia_data';

export function createRva077RumaiArchetype(): ArchetypeBundle {
  const patient = new Patient({
    id: 'ENT-PAX-0077',
    firstName: 'Alejandra',
    lastName: 'Rumai',
    passportHash: 'SHA256_RUMAI_0077',
    country: 'Curazao',
    language: 'Papiamento',
    phone: '+5999 578 9012',
    email: 'alejandra.rumai@medicaltrip.test',
    companionNames: ['Xiomahara Rumai', 'Familiar Acompañante'],
  });

  const booking = new Booking({
    id: 'bkg-rva077',
    code: 'RVA077-2',
    patientId: patient.id,
    paxCount: 2,
    arrivalDate: '2026-08-18T10:00:00.000Z',
    departureDate: '2026-08-30T07:00:00.000Z',
    arrivalAirline: 'Z-Air',
    arrivalFlight: '7Z-0511',
    hotelId: 'HOTEL-NOVELTY',
    hotelName: 'Novelty Suites El Poblado',
    status: 'PROGRAMADO',
    notes: 'Jornada quirúrgica y recuperación de 12 días en HPTU, Hernán Ocazionez y Novelty Suites / Villa Anita.',
  });

  const itinerary = new MedicalItinerary({
    booking,
    defaultCurrency: 'COP',
  });

  // Advance Payment
  itinerary.recordCashAdvance(Money.fromCents(350000000n, 'COP'), 'Anticipo Inicial Multi-Etapa');

  // Milestones
  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-077-1',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Llegada Z-Air JMC ➔ Traslado Hotel Novelty Suites',
      category: 'FLIGHT',
      startDateTime: '2026-08-18T10:00:00.000Z',
      endDateTime: '2026-08-18T12:00:00.000Z',
      location: new OperativeTerritory('Aeropuerto JMC ➔ Novelty Suites El Poblado'),
      coordinates: new Coordinates(6.1645, -75.4267),
      providerName: 'Aeroturex Juan Carlos',
      assignedDriverId: 'DRV-02',
      financialType: 'FLEET_TAXI',
      cost: Money.fromCents(14500000n, 'COP'),
      status: 'COMPLETADO',
      gpsChecked: true,
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-077-2',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Consulta Gastroenterología Dr. Mosquera Torre B Cons 154',
      category: 'CLINICAL',
      startDateTime: '2026-08-18T15:45:00.000Z',
      endDateTime: '2026-08-18T19:45:00.000Z',
      location: new OperativeTerritory('Hospital Pablo Tobón Uribe (HPTU)'),
      coordinates: new Coordinates(6.2758, -75.5898),
      providerId: 'CLINIC-HPTU',
      providerName: 'HPTU Robledo',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 4.0,
      cost: Money.fromCents(6200000n, 'COP'), // 4h x 15.5k = 62k COP
      status: 'COMPLETADO',
      notes: 'Valoración especializada de gastroenterología y programación de endoscopia.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-077-3',
      reservaId: booking.code,
      dayNumber: 3,
      title: 'Radiografía de Tórax, Ecografía Abdomen & Mama Hernán Ocazionez',
      category: 'LAB',
      startDateTime: '2026-08-20T09:00:00.000Z',
      endDateTime: '2026-08-20T13:00:00.000Z',
      location: new OperativeTerritory('Centro Diagnóstico Hernán Ocazionez Poblado'),
      coordinates: new Coordinates(6.2087, -75.5684),
      providerId: 'LAB-OCAZIONEZ',
      providerName: 'Hernán Ocazionez',
      financialType: 'OUT_OF_POCKET',
      cost: Money.fromCents(17075500n, 'COP'), // $170.755 COP
      status: 'PROGRAMADO',
      requiresReceipt: true,
      notes: 'Exámenes preoperatorios completos con factura legal.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-077-4',
      reservaId: booking.code,
      dayNumber: 4,
      title: 'Consulta Ginecología Clínica Bolivariana & Pre-Anestesia Cardio VID',
      category: 'CLINICAL',
      startDateTime: '2026-08-21T08:30:00.000Z',
      endDateTime: '2026-08-21T13:30:00.000Z',
      location: new OperativeTerritory('Clínica Universitaria Bolivariana'),
      coordinates: new Coordinates(6.2486, -75.5901),
      providerName: 'Clínica Bolivariana',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 5.0,
      cost: Money.fromCents(7750000n, 'COP'),
      status: 'PROGRAMADO',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-077-5',
      reservaId: booking.code,
      dayNumber: 5,
      title: 'Ingreso a Quirófano y Acompañamiento en Recuperación Continua',
      category: 'CLINICAL',
      startDateTime: '2026-08-22T06:00:00.000Z',
      endDateTime: '2026-08-22T18:00:00.000Z',
      location: new OperativeTerritory('Hospital Pablo Tobón Uribe (HPTU)'),
      coordinates: new Coordinates(6.2758, -75.5898),
      providerName: 'HPTU Quirófanos',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 12.0,
      cost: Money.fromCents(23100000n, 'COP'), // 12h ($186k) + Subsidio Tier 4 ($45k) = $231k
      status: 'PROGRAMADO',
      notes: 'Turno extendido postquirúrgico y entrega de reporte a familiares en Curazao.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-077-6',
      reservaId: booking.code,
      dayNumber: 12,
      title: 'Check-out y Traslado Hotel Novelty Suites ➔ Aeropuerto JMC',
      category: 'FLIGHT',
      startDateTime: '2026-08-29T07:00:00.000Z',
      endDateTime: '2026-08-29T09:00:00.000Z',
      location: new OperativeTerritory('Novelty Suites El Poblado ➔ Aeropuerto JMC'),
      coordinates: new Coordinates(6.1645, -75.4267),
      providerName: 'Aeroturex Gustavo Mora',
      assignedDriverId: 'DRV-04',
      financialType: 'FLEET_TAXI',
      cost: Money.fromCents(14500000n, 'COP'),
      status: 'PROGRAMADO',
    })
  );

  return { patient, booking, itinerary };
}
