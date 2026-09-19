import { PatientBooking } from '../domain/PatientBooking.js';
import { ItineraryEvent, EVENT_STATUS } from '../domain/ItineraryEvent.js';

export class DriveDatasetAdapter {
    static getPatients() {
        return [
            new PatientBooking({
                id: 'rva171',
                code: 'RVA171-4',
                name: 'Catia Rodrigues (Grupo Familiar 5 Pax)',
                country: 'Curazao',
                paxCount: 5,
                language: 'Papiamento',
                hotel: 'Hotel Inntu Laureles',
                startDate: '2026-08-20',
                endDate: '2026-08-25',
                advanceTotalUnits: 2098100,
                companionName: 'Tatiana, Mariana, María, Lisandra'
            }),
            new PatientBooking({
                id: 'rva282',
                code: 'RVA282-5',
                name: 'George Hernandez (Chequeo Cardio & Uro)',
                country: 'Curazao',
                paxCount: 2,
                language: 'Papiamento',
                hotel: 'Airbnb Ed. Park 42 Poblado',
                startDate: '2026-08-21',
                endDate: '2026-08-26',
                advanceTotalUnits: 1200000,
                companionName: 'Adriaan Fabian'
            }),
            new PatientBooking({
                id: 'rva341',
                code: 'RVA341-1',
                name: 'Eduard Hogenboom (Bilingüe Inglés / CES)',
                country: 'Curazao',
                paxCount: 2,
                language: 'Inglés / Neerlandés',
                hotel: 'Hotel Inntu Laureles',
                startDate: '2026-08-22',
                endDate: '2026-08-27',
                advanceTotalUnits: 950000,
                companionName: 'Marcelle Cameron'
            }),
            new PatientBooking({
                id: 'rva077',
                code: 'RVA077-2',
                name: 'Alejandra Rumai (Cirugía & Post-Op 12 Días)',
                country: 'Curazao',
                paxCount: 2,
                language: 'Papiamento',
                hotel: 'Novelty Suites El Poblado',
                startDate: '2026-08-18',
                endDate: '2026-08-30',
                advanceTotalUnits: 3500000,
                companionName: 'Familiar Acompañante'
            })
        ];
    }

    static getInitialEvents() {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = today.getDate();

        // Helper para crear ISO dates relativos
        const dateAt = (dayOffset, timeStr) => {
            const target = new Date(today);
            target.setDate(d + dayOffset);
            const [hours, mins] = timeStr.split(':');
            target.setHours(Number(hours), Number(mins), 0, 0);
            return target.toISOString();
        };

        return [
            // RVA171 Events
            new ItineraryEvent({
                id: 'evt-171-1',
                patientId: 'rva171',
                title: 'Aterrizaje Vuelo Z Fly Curazao (5 Pax) + Traslado Aeroturex',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: dateAt(0, '09:00'),
                endDateTime: dateAt(0, '11:00'),
                location: 'Aeropuerto JMC Rionegro ➔ Hotel Inntu Laureles',
                provider: 'Uber XL / Andrés',
                assignedRole: '[DRV] Andrés',
                assignedAgentName: 'Andrés Flota',
                costType: 'TRANSPORTE',
                costUnits: 160000,
                status: EVENT_STATUS.COMPLETED,
                notes: 'Recepción con letrero Medical Trip en puerta internacional. 5 maletas grandes.',
                gpsChecked: true
            }),
            new ItineraryEvent({
                id: 'evt-171-2',
                patientId: 'rva171',
                title: 'Consulta Oftalmología Dr. Peláez (María Rodrigues)',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: dateAt(0, '14:00'),
                endDateTime: dateAt(0, '16:30'),
                location: 'Clínica Clofán Ciudad del Río',
                provider: 'Clínica Clofán',
                assignedRole: '[GUIA] Yenny',
                assignedAgentName: 'Yenny Bilingüe',
                costType: 'HONORARIO_GUIA',
                hours: 2.5,
                costUnits: 38750,
                status: EVENT_STATUS.COMPLETED,
                notes: 'Traducción simultánea en Papiamento. Dilatación de pupila.',
                gpsChecked: true
            }),
            new ItineraryEvent({
                id: 'evt-171-3',
                patientId: 'rva171',
                title: 'Parqueadero Torre Médica Clofán',
                category: 'PHARMACY_EXPENSE',
                startDateTime: dateAt(0, '16:30'),
                endDateTime: dateAt(0, '17:00'),
                location: 'Sótano 2 Clofán',
                provider: 'Parqueadero Clofán',
                assignedRole: '[DRV] Andrés',
                costType: 'CAJA_MENOR',
                costUnits: 12000,
                status: EVENT_STATUS.COMPLETED
            }),
            new ItineraryEvent({
                id: 'evt-171-4',
                patientId: 'rva171',
                title: 'Ecografías & Diagnóstico Integral CIMA (Tatiana / Mariana)',
                category: 'LAB_DIAGNOSTICS',
                startDateTime: dateAt(1, '06:30'),
                endDateTime: dateAt(1, '14:30'),
                location: 'CIMA Ayudas Diagnósticas (Cra 44)',
                provider: 'CIMA Diagnósticos',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 8.0,
                costUnits: 124000,
                status: EVENT_STATUS.SCHEDULED,
                notes: 'Ayuno estricto 8 horas. Llevar muestra de orina recolectada a las 05:30 AM.'
            }),
            new ItineraryEvent({
                id: 'evt-171-5',
                patientId: 'rva171',
                title: 'Compra de Gotas Oftálmicas & Fórmulas Post-Op',
                category: 'PHARMACY_EXPENSE',
                startDateTime: dateAt(1, '15:00'),
                endDateTime: dateAt(1, '16:00'),
                location: 'Droguería Cruz Verde Poblado',
                provider: 'Cruz Verde',
                assignedRole: '[GUIA] Yenny',
                costType: 'FARMACIA',
                costUnits: 85000,
                status: EVENT_STATUS.SCHEDULED,
                notes: 'Deducción de caja menor con ticket térmico.'
            }),

            // RVA282 Events
            new ItineraryEvent({
                id: 'evt-282-1',
                patientId: 'rva282',
                title: 'Llegada Wingo Curazao 7449 + Entrega SIM Claro en JMC',
                category: 'FLIGHT_TRANSPORT',
                startDateTime: dateAt(0, '15:27'),
                endDateTime: dateAt(0, '17:30'),
                location: 'Aeropuerto JMC ➔ Ed. Park 42 Poblado',
                provider: 'Aeroturex Sedán',
                assignedRole: '[DRV] Ramón Rosero',
                costType: 'TRANSPORTE',
                costUnits: 145000,
                status: EVENT_STATUS.COMPLETED,
                gpsChecked: true
            }),
            new ItineraryEvent({
                id: 'evt-282-2',
                patientId: 'rva282',
                title: 'Consulta Cardiología & Ecocardiograma Dr. Marcos Yepes',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: dateAt(1, '09:00'),
                endDateTime: dateAt(1, '12:00'),
                location: 'Clínica CES Sede Oviedo Piso 6',
                provider: 'CES Oviedo',
                assignedRole: '[GUIA] Yenny',
                costType: 'HONORARIO_GUIA',
                hours: 3.0,
                costUnits: 46500,
                status: EVENT_STATUS.SCHEDULED
            }),

            // RVA341 Events
            new ItineraryEvent({
                id: 'evt-341-1',
                patientId: 'rva341',
                title: 'Toma de Muestras de Sangre a Domicilio en Habitación Hotel',
                category: 'LAB_DIAGNOSTICS',
                startDateTime: dateAt(1, '05:30'),
                endDateTime: dateAt(1, '06:30'),
                location: 'Hotel Inntu Laureles Hab. 1004',
                provider: 'Laboratorio Echavarría',
                assignedRole: 'Lab Domicilio',
                costType: 'CAJA_MENOR',
                costUnits: 65000,
                status: EVENT_STATUS.SCHEDULED,
                notes: 'Bacterióloga asignada. Paciente no requiere desplazamiento en ayunas.'
            }),
            new ItineraryEvent({
                id: 'evt-341-2',
                patientId: 'rva341',
                title: 'Consulta Urología Dr. Carlos Suárez (Bilingüe Inglés)',
                category: 'CLINICAL_CONSULTATION',
                startDateTime: dateAt(1, '11:00'),
                endDateTime: dateAt(1, '13:30'),
                location: 'Torre Médica Oviedo',
                provider: 'CES Sede Oviedo',
                assignedRole: '[GUIA] Alejandro',
                costType: 'HONORARIO_GUIA',
                hours: 2.5,
                costUnits: 38750,
                status: EVENT_STATUS.SCHEDULED
            })
        ];
    }
}
