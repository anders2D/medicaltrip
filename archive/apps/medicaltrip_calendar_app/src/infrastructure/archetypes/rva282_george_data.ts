import { Patient } from '../../domain/entities/Patient';
import { Booking } from '../../domain/entities/Booking';
import { ItineraryMilestone } from '../../domain/entities/ItineraryMilestone';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';
import { Money } from '../../domain/values/Money';
import { OperativeTerritory } from '../../domain/values/OperativeTerritory';
import { Coordinates } from '../../domain/values/Coordinates';
import { ArchetypeBundle } from './rva171_catia_data';

export function createRva282GeorgeArchetype(): ArchetypeBundle {
  const patient = new Patient({
    id: 'ENT-PAX-0282',
    firstName: 'George',
    lastName: 'Hernandez',
    passportHash: 'SHA256_GEORGE_0282',
    country: 'Curazao',
    language: 'Papiamento',
    phone: '+5999 567 8901',
    email: 'george.hernandez@medicaltrip.test',
    companionNames: ['Adriaan Fabian'],
  });

  const booking = new Booking({
    id: 'bkg-rva282',
    code: 'RVA282-5',
    patientId: patient.id,
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

  const itinerary = new MedicalItinerary({
    booking,
    defaultCurrency: 'COP',
  });

  // Advance Payment
  itinerary.recordCashAdvance(Money.fromCents(120000000n, 'COP'), 'Anticipo Transferencia Bancolombia');

  // Milestones
  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-282-1',
      reservaId: booking.code,
      dayNumber: 1,
      title: 'Llegada Wingo Curazao 7449 + Entrega SIM Claro en JMC',
      category: 'FLIGHT',
      startDateTime: '2026-08-21T15:27:00.000Z',
      endDateTime: '2026-08-21T17:30:00.000Z',
      location: new OperativeTerritory('Aeropuerto JMC ➔ Edificio Park 42 Poblado'),
      coordinates: new Coordinates(6.1645, -75.4267),
      providerName: 'Aeroturex Sedán',
      assignedDriverId: 'DRV-01',
      financialType: 'FLEET_TAXI',
      cost: Money.fromCents(14500000n, 'COP'),
      status: 'COMPLETADO',
      gpsChecked: true,
      notes: 'Entrega de eSIM Claro 80GB y traslado a Park 42.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-282-2',
      reservaId: booking.code,
      dayNumber: 2,
      title: 'Consulta Cardiología & Ecocardiograma Dr. Marcos Yepes',
      category: 'CLINICAL',
      startDateTime: '2026-08-22T09:00:00.000Z',
      endDateTime: '2026-08-22T12:00:00.000Z',
      location: new OperativeTerritory('Clínica CES Sede Oviedo Piso 6'),
      coordinates: new Coordinates(6.1985, -75.5732),
      providerId: 'CLINIC-CES-OVIEDO',
      providerName: 'CES Oviedo',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 3.0,
      cost: Money.fromCents(4650000n, 'COP'), // 3h x 15.5k = 46.5k
      status: 'PROGRAMADO',
      notes: 'Valoración cardiovascular y ecocardiograma transtorácico.',
    })
  );

  itinerary.addMilestone(
    new ItineraryMilestone({
      id: 'evt-282-3',
      reservaId: booking.code,
      dayNumber: 3,
      title: 'Chequeo Cardiovascular Integral & Ecocardiograma Doppler',
      category: 'CLINICAL',
      startDateTime: '2026-08-23T08:00:00.000Z',
      endDateTime: '2026-08-23T13:00:00.000Z',
      location: new OperativeTerritory('Clínica Cardio VID Robledo'),
      coordinates: new Coordinates(6.2758, -75.5898),
      providerId: 'CLINIC-CARDIO-VID',
      providerName: 'Clínica Cardio VID',
      assignedGuideId: 'GUIA-01',
      financialType: 'GUIDE_FEE',
      guideHours: 5.0,
      cost: Money.fromCents(7750000n, 'COP'), // 5h x 15.5k = 77.5k
      status: 'PROGRAMADO',
    })
  );

  // Out of pocket expense
  itinerary.recordOutOfPocketExpense('eSIM Internacional Claro 80GB', Money.fromCents(9090900n, 'COP'));

  return { patient, booking, itinerary };
}
