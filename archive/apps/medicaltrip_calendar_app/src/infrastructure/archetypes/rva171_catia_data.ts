import { Patient } from '../../domain/entities/Patient';
import { Booking } from '../../domain/entities/Booking';
import { ItineraryMilestone } from '../../domain/entities/ItineraryMilestone';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';
import { Money } from '../../domain/values/Money';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';

export interface ArchetypeBundle {
  patient: Patient;
  booking: Booking;
  itinerary: MedicalItinerary;
}

export function createRva171CatiaArchetype(): ArchetypeBundle {
  const patient = new Patient({
    id: 'ENT-PAX-0171',
    firstName: 'Catia',
    lastName: 'Rodrigues',
    passportHash: 'SHA256_CATIA_0171',
    country: 'Curazao',
    language: 'Papiamento',
    phone: '+5999 512 3456',
    email: 'catia.rodrigues@medicaltrip.test',
    companionNames: ['Tatiana Faria', 'Mariana Faria', 'María Rodrigues', 'Lisandra Rodrigues'],
  });

  const booking = new Booking({
    id: 'bkg-rva171',
    code: 'RVA171-4',
    patientId: patient.id,
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

  const itinerary = new MedicalItinerary({
    booking,
    defaultCurrency: 'COP',
  });

  // Financial Advances
  itinerary.recordCashAdvance(Money.fromCents(100000000n, 'COP'), 'Abono Inicial Bancolombia');
  itinerary.recordCashAdvance(Money.fromCents(109810000n, 'COP'), 'Segundo Abono Transferencia');

  // Milestones
  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-171-1',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Aterrizaje Vuelo Z-Fly Curazao (5 Pax) + Traslado Aeroturex',
      category: 'FLIGHT',
      startDateTime: '2026-08-20T10:00:00.000Z',
      endDateTime: '2026-08-20T12:00:00.000Z',
      location: new OperativeTerritory('Aeropuerto JMC Rionegro ➔ Hotel Inntu Laureles'),
      coordinates: new Coordinates(6.1645, -75.4267),
      providerId: 'PROV-AEROTUREX',
      providerName: 'Uber XL / Andrés',
      assignedDriverId: 'DRV-03',
      financialType: 'FLEET_TAXI',
      cost: Money.fromCents(16000000n, 'COP'),
      status: 'COMPLETADO',
      gpsChecked: true,
      notes: 'Recepción con letrero Medical Trip en puerta internacional. 5 maletas grandes.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-171-2',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Consulta y Exámenes Oftalmología Dr. Peláez (María Rodrigues)',
      category: 'CLINICAL',
      startDateTime: '2026-08-20T15:00:00.000Z',
      endDateTime: '2026-08-20T17:30:00.000Z',
      location: new OperativeTerritory('Clínica Clofán Ciudad del Río'),
      coordinates: new Coordinates(6.2235, -75.5746),
      providerId: 'CLINIC-CLOFAN',
      providerName: 'Clínica Clofán',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 2.5,
      cost: Money.fromCents(3875000n, 'COP'), // 2.5h x 15.5k = 38.75k
      status: 'COMPLETADO',
      gpsChecked: true,
      notes: 'Traducción simultánea en Papiamento. Dilatación de pupila.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-171-3',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Parqueadero Torre Médica Clofán Sótano 2',
      category: 'PHARMACY',
      startDateTime: '2026-08-20T17:30:00.000Z',
      endDateTime: '2026-08-20T18:00:00.000Z',
      location: new OperativeTerritory('Clínica Clofán Ciudad del Río'),
      providerName: 'Parqueadero Clofán',
      financialType: 'OUT_OF_POCKET',
      cost: Money.fromCents(1200000n, 'COP'),
      status: 'COMPLETADO',
      notes: 'Recibo físico liquidado en caja menor.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-171-4',
      reservaId: booking.code,
      dayNumber: 2,
      title: 'Ecografías & Diagnóstico Integral CIMA (Tatiana / Mariana)',
      category: 'LAB',
      startDateTime: '2026-08-21T06:30:00.000Z',
      endDateTime: '2026-08-21T14:30:00.000Z',
      location: new OperativeTerritory('CIMA Ayudas Diagnósticas (Cra 44)'),
      coordinates: new Coordinates(6.2312, -75.5701),
      providerId: 'CLINIC-CIMA',
      providerName: 'CIMA Diagnósticos',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 8.0,
      cost: Money.fromCents(15900000n, 'COP'), // 8h ($124k) + Subsidio Tier 3 ($35k) = $159k
      status: 'PROGRAMADO',
      notes: 'Ayuno estricto 8 horas. Llevar muestra de orina recolectada a las 05:30 AM.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-171-5',
      reservaId: booking.code,
      dayNumber: 2,
      title: 'Compra de Gotas Oftálmicas & Fórmulas Post-Op Cruz Verde',
      category: 'PHARMACY',
      startDateTime: '2026-08-21T15:00:00.000Z',
      endDateTime: '2026-08-21T16:00:00.000Z',
      location: new OperativeTerritory('Droguería Cruz Verde Poblado'),
      providerName: 'Cruz Verde',
      financialType: 'OUT_OF_POCKET',
      cost: Money.fromCents(8500000n, 'COP'),
      status: 'PROGRAMADO',
      requiresReceipt: true,
      notes: 'Deducción de caja menor con ticket térmico.',
    })
  );

  return { patient, booking, itinerary };
}
