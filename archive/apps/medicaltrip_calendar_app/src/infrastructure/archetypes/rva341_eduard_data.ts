import { Patient } from '../../domain/entities/Patient';
import { Booking } from '../../domain/entities/Booking';
import { ItineraryMilestone } from '../../domain/entities/ItineraryMilestone';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';
import { Money } from '../../domain/values/Money';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';
import { ArchetypeBundle } from './rva171_catia_data';

export function createRva341EduardArchetype(): ArchetypeBundle {
  const patient = new Patient({
    id: 'ENT-PAX-0341',
    firstName: 'Eduard',
    lastName: 'Hogenboom',
    passportHash: 'SHA256_EDUARD_0341',
    country: 'Curazao',
    language: 'Inglés / Neerlandés',
    phone: '+5999 534 5678',
    email: 'eduard.hogenboom@medicaltrip.test',
    companionNames: ['Marcelle Cameron'],
  });

  const booking = new Booking({
    id: 'bkg-rva341',
    code: 'RVA341-1',
    patientId: patient.id,
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

  const itinerary = new MedicalItinerary({
    booking,
    defaultCurrency: 'COP',
  });

  // Advance Payment
  itinerary.recordCashAdvance(Money.fromCents(95000000n, 'COP'), 'Abono en Efectivo COP');

  // Milestones
  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-341-3',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Llegada Vuelo JMC ➔ Traslado Hotel Inntu Laureles',
      category: 'FLIGHT',
      startDateTime: '2026-08-22T15:27:00.000Z',
      endDateTime: '2026-08-22T17:30:00.000Z',
      location: new OperativeTerritory('Aeropuerto JMC ➔ Hotel Inntu Laureles'),
      coordinates: new Coordinates(6.1645, -75.4267),
      providerName: 'Sedán Ejecutivo / Andrés',
      assignedDriverId: 'DRV-03',
      financialType: 'FLEET_TAXI',
      cost: Money.fromCents(11000000n, 'COP'),
      status: 'COMPLETADO',
      gpsChecked: true,
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-341-1',
      reservaId: booking.code,
      dayNumber: 2,
      title: 'Toma de Muestras de Sangre a Domicilio en Habitación Hotel (Ayunas 05:30 AM)',
      category: 'LAB',
      startDateTime: '2026-08-23T05:30:00.000Z',
      endDateTime: '2026-08-23T06:30:00.000Z',
      location: new OperativeTerritory('Hotel Inntu Laureles Hab. 1004'),
      coordinates: new Coordinates(6.2442, -75.5922),
      providerId: 'LAB-ECHAVARRIA',
      providerName: 'Laboratorio Echavarría',
      assignedNurseId: 'NURSE-01',
      financialType: 'OUT_OF_POCKET',
      cost: Money.fromCents(9735000n, 'COP'), // 65k + 32.35k recargo = 97.35k COP
      status: 'PROGRAMADO',
      notes: 'Bacterióloga asignada. Paciente no requiere desplazamiento en ayunas.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-341-2',
      reservaId: booking.code,
      dayNumber: 2,
      title: 'Consulta Urología Dr. Carlos Suárez (Bilingüe Inglés)',
      category: 'CLINICAL',
      startDateTime: '2026-08-23T11:00:00.000Z',
      endDateTime: '2026-08-23T13:30:00.000Z',
      location: new OperativeTerritory('Torre Médica Oviedo'),
      coordinates: new Coordinates(6.1985, -75.5732),
      providerId: 'CLINIC-CES-OVIEDO',
      providerName: 'CES Sede Oviedo',
      assignedGuideId: 'GUIA-02',
      financialType: 'GUIDE_FEE',
      guideHours: 2.5,
      cost: Money.fromCents(3875000n, 'COP'), // 2.5h x 15.5k = 38.75k COP
      status: 'PROGRAMADO',
    })
  );

  return { patient, booking, itinerary };
}
