import { IItineraryRepository } from '../ports/IItineraryRepository';
import { MedicalItinerary } from '../../domain/aggregates/MedicalItinerary';
import { Patient } from '../../domain/entities/Patient';
import { Booking } from '../../domain/entities/Booking';
import { ItineraryMilestone } from '../../domain/entities/ItineraryMilestone';
import { FinancialTransaction } from '../../domain/entities/FinancialTransaction';
import { Money } from '../../domain/values/Money';
import { InvariantViolationError } from '../../domain/errors/DomainErrors';

export type ArchetypeId = 'RVA171' | 'RVA282' | 'RVA341' | 'RVA077';

export class LoadArchetypeUseCase {
  constructor(private readonly itineraryRepo: IItineraryRepository) {}

  async execute(archetypeId: ArchetypeId): Promise<{
    itinerary: MedicalItinerary;
    patient: Patient;
    milestoneCount: number;
    transactionCount: number;
  }> {
    let itinerary: MedicalItinerary;
    let patient: Patient;

    switch (archetypeId.toUpperCase()) {
      case 'RVA171': {
        patient = new Patient({
          id: 'ENT-PAX-0171',
          firstName: 'Catia',
          lastName: 'Rodrigues',
          passportHash: 'SHA256_CATIA_0171',
          country: 'Curazao',
          language: 'Papiamento',
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
        });

        itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

        // Advance Payments
        itinerary.recordCashAdvance(Money.fromCents(100000000n, 'COP'), 'Abono Inicial Bancolombia');
        itinerary.recordCashAdvance(Money.fromCents(109810000n, 'COP'), 'Segundo Abono Transferencia');

        // Milestones
        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-171-01',
            reservaId: booking.code,
            dayNumber: 1,
            title: 'Llegada Vuelo Z-Fly Curazao (5 Pax) + Traslado Especial Aeroturex',
            category: 'FLIGHT',
            startDateTime: '2026-08-20T10:00:00.000Z',
            endDateTime: '2026-08-20T12:00:00.000Z',
            location: 'Aeropuerto JMC Rionegro ➔ Hotel Inntu Laureles',
            providerName: 'Uber XL Van / Aeroturex',
            assignedDriverId: 'DRV-03',
            financialType: 'FLEET_TAXI',
            cost: Money.fromCents(16000000n, 'COP'), // 160k COP
            status: 'COMPLETADO',
            gpsChecked: true,
            notes: 'Recepción 5 maletas grandes.',
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-171-02',
            reservaId: booking.code,
            dayNumber: 1,
            title: 'Consulta y Exámenes Oftalmología Dr. Peláez (María)',
            category: 'CLINICAL',
            startDateTime: '2026-08-20T15:00:00.000Z',
            endDateTime: '2026-08-20T18:30:00.000Z',
            location: 'Clínica Clofán Ciudad del Río',
            providerName: 'Clínica Clofán',
            assignedGuideId: 'GUIA-01',
            financialType: 'GUIDE_FEE',
            guideHours: 3.5,
            cost: Money.fromCents(5425000n, 'COP'), // 3.5h x 15.5k = 54.25k COP
            status: 'COMPLETADO',
            notes: 'Traducción simultánea en Papiamento.',
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-171-03',
            reservaId: booking.code,
            dayNumber: 2,
            title: 'Ecografías Integrales CIMA (Tatiana / Mariana)',
            category: 'LAB',
            startDateTime: '2026-08-21T06:30:00.000Z',
            endDateTime: '2026-08-21T14:30:00.000Z',
            location: 'CIMA Ayudas Diagnósticas (Cra 44)',
            providerName: 'CIMA Cra 44',
            assignedGuideId: 'GUIA-01',
            financialType: 'GUIDE_FEE',
            guideHours: 8.0,
            cost: Money.fromCents(15900000n, 'COP'), // 8h ($124k) + Subsidio Tier 3 ($35k) = $159k
            status: 'PROGRAMADO',
            notes: 'Ayuno estricto 8 horas.',
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-171-04',
            reservaId: booking.code,
            dayNumber: 2,
            title: 'Medicamentos y Fórmulas Post-Op Gotas Oftálmicas',
            category: 'PHARMACY',
            startDateTime: '2026-08-21T15:30:00.000Z',
            endDateTime: '2026-08-21T16:30:00.000Z',
            location: 'Droguería Cruz Verde Poblado',
            providerName: 'Cruz Verde',
            financialType: 'OUT_OF_POCKET',
            cost: Money.fromCents(8500000n, 'COP'), // 85k COP
            status: 'PROGRAMADO',
            requiresReceipt: true,
          })
        );

        break;
      }

      case 'RVA282': {
        patient = new Patient({
          id: 'ENT-PAX-0282',
          firstName: 'George',
          lastName: 'Hernandez',
          passportHash: 'SHA256_GEORGE_0282',
          country: 'USA / Curazao',
          language: 'Inglés / Papiamento',
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
          hotelName: 'Edificio Park 42 Poblado',
        });

        itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });

        itinerary.recordCashAdvance(Money.fromCents(120000000n, 'COP'), 'Anticipo Transferencia COP');

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-282-01',
            reservaId: booking.code,
            dayNumber: 1,
            title: 'Llegada Vuelo Wingo 7449 + Entrega eSIM Claro 80GB',
            category: 'FLIGHT',
            startDateTime: '2026-08-21T15:27:00.000Z',
            endDateTime: '2026-08-21T17:30:00.000Z',
            location: 'Aeropuerto JMC ➔ Edificio Park 42 Poblado',
            providerName: 'Aeroturex Sedán',
            assignedDriverId: 'DRV-01',
            financialType: 'FLEET_TAXI',
            cost: Money.fromCents(14500000n, 'COP'),
            status: 'COMPLETADO',
            gpsChecked: true,
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-282-02',
            reservaId: booking.code,
            dayNumber: 2,
            title: 'Chequeo Cardiovascular Integral & Ecocardiograma Doppler',
            category: 'CLINICAL',
            startDateTime: '2026-08-22T08:00:00.000Z',
            endDateTime: '2026-08-22T13:00:00.000Z',
            location: 'Clínica Cardio VID Robledo',
            providerName: 'Clínica Cardio VID',
            assignedGuideId: 'GUIA-01',
            financialType: 'GUIDE_FEE',
            guideHours: 5.0,
            cost: Money.fromCents(7750000n, 'COP'),
            status: 'PROGRAMADO',
          })
        );

        itinerary.recordOutOfPocketExpense('eSIM Internacional 80GB', Money.fromCents(9090900n, 'COP'));

        break;
      }

      case 'RVA341': {
        patient = new Patient({
          id: 'ENT-PAX-0341',
          firstName: 'Eduard',
          lastName: 'Hogenboom',
          passportHash: 'SHA256_EDUARD_0341',
          country: 'Netherlands / Aruba',
          language: 'Holandés / Inglés',
          companionNames: ['Marcelle Cameron'],
        });

        const booking = new Booking({
          id: 'bkg-rva341',
          code: 'RVA341-1',
          patientId: patient.id,
          paxCount: 2,
          arrivalDate: '2026-08-22T15:27:00.000Z',
          departureDate: '2026-08-27T14:00:00.000Z',
          hotelId: 'HOTEL-INNTU',
          hotelName: 'Hotel Inntu Laureles Hab. 1004',
        });

        itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });
        itinerary.recordCashAdvance(Money.fromCents(95000000n, 'COP'), 'Abono en Efectivo');

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-341-01',
            reservaId: booking.code,
            dayNumber: 2,
            title: 'Toma de Muestras Domiciliaria en Habitación 1004 (Ayunas)',
            category: 'LAB',
            startDateTime: '2026-08-23T05:30:00.000Z',
            endDateTime: '2026-08-23T06:30:00.000Z',
            location: 'Hotel Inntu Laureles',
            providerName: 'Laboratorio Echavarría',
            assignedNurseId: 'NURSE-01',
            financialType: 'OUT_OF_POCKET',
            cost: Money.fromCents(9735000n, 'COP'), // 65k + 32.35k recargo = 97.35k COP
            status: 'PROGRAMADO',
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-341-02',
            reservaId: booking.code,
            dayNumber: 2,
            title: 'Consulta Urología Dr. Carlos Suárez (Bilingüe Inglés)',
            category: 'CLINICAL',
            startDateTime: '2026-08-23T11:00:00.000Z',
            endDateTime: '2026-08-23T16:00:00.000Z',
            location: 'Torre Médica Oviedo Piso 6',
            providerName: 'CES Oviedo',
            assignedGuideId: 'GUIA-02',
            financialType: 'GUIDE_FEE',
            guideHours: 5.0,
            cost: Money.fromCents(10250000n, 'COP'), // 5h ($77.5k) + Subsidio Tier 2 ($25k) = $102.5k
            status: 'PROGRAMADO',
          })
        );

        break;
      }

      case 'RVA077': {
        patient = new Patient({
          id: 'ENT-PAX-0077',
          firstName: 'Alejandra',
          lastName: 'Rumai',
          passportHash: 'SHA256_RUMAI_0077',
          country: 'Curazao',
          language: 'Papiamento / Español',
          companionNames: ['Xiomahara Rumai'],
        });

        const booking = new Booking({
          id: 'bkg-rva077',
          code: 'RVA077-5',
          patientId: patient.id,
          paxCount: 2,
          arrivalDate: '2026-08-10T10:00:00.000Z',
          departureDate: '2026-08-22T07:00:00.000Z',
          hotelId: 'HOTEL-NOVELTY',
          hotelName: 'Hotel Novelty Suites El Poblado',
        });

        itinerary = new MedicalItinerary({ booking, defaultCurrency: 'COP' });
        itinerary.recordCashAdvance(Money.fromCents(350000000n, 'COP'), 'Anticipo Inicial Multi-Etapa');

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-077-01',
            reservaId: booking.code,
            dayNumber: 1,
            title: 'Llegada Z-Air JMC ➔ Traslado Hotel Novelty Suites',
            category: 'FLIGHT',
            startDateTime: '2026-08-10T10:00:00.000Z',
            endDateTime: '2026-08-10T12:00:00.000Z',
            location: 'Aeropuerto JMC ➔ Novelty Suites El Poblado',
            providerName: 'Aeroturex Juan Carlos',
            assignedDriverId: 'DRV-02',
            financialType: 'FLEET_TAXI',
            cost: Money.fromCents(14500000n, 'COP'),
            status: 'COMPLETADO',
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-077-02',
            reservaId: booking.code,
            dayNumber: 1,
            title: 'Consulta Gastroenterología Dr. Mosquera Torre B Cons 154',
            category: 'CLINICAL',
            startDateTime: '2026-08-10T15:45:00.000Z',
            endDateTime: '2026-08-10T19:45:00.000Z',
            location: 'Hospital Pablo Tobón Uribe (HPTU)',
            providerName: 'HPTU Robledo',
            assignedGuideId: 'GUIA-01',
            financialType: 'GUIDE_FEE',
            guideHours: 4.0,
            cost: Money.fromCents(6200000n, 'COP'),
            status: 'COMPLETADO',
          })
        );

        itinerary.addMilestone(
          new ItineraryMilestone({
            id: 'itn-077-03',
            reservaId: booking.code,
            dayNumber: 3,
            title: 'Radiografía de Tórax, Ecografía Abdomen & Mama Hernán Ocazionez',
            category: 'LAB',
            startDateTime: '2026-08-12T09:00:00.000Z',
            endDateTime: '2026-08-12T13:00:00.000Z',
            location: 'Centro Diagnóstico Hernán Ocazionez Poblado',
            providerName: 'Hernán Ocazionez',
            financialType: 'OUT_OF_POCKET',
            cost: Money.fromCents(17075500n, 'COP'), // 170.755 COP
            status: 'PROGRAMADO',
            requiresReceipt: true,
          })
        );

        break;
      }

      default:
        throw new InvariantViolationError(
          `[Arquetipo Inválido]: '${archetypeId}' no reconocido. Arquetipos válidos: RVA171, RVA282, RVA341, RVA077.`
        );
    }

    await this.itineraryRepo.save(itinerary);

    return {
      itinerary,
      patient,
      milestoneCount: itinerary.milestones.length,
      transactionCount: itinerary.transactions.length,
    };
  }
}
