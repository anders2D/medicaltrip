import { Money } from './Money.js';
import { OperativeTerritory } from './OperativeTerritory.js';

export const EVENT_CATEGORIES = {
    FLIGHT_TRANSPORT: { id: 'FLIGHT_TRANSPORT', label: 'Vuelo & Traslado', color: 'sky', icon: 'plane' },
    CLINICAL_CONSULTATION: { id: 'CLINICAL_CONSULTATION', label: 'Consulta Médica', color: 'indigo', icon: 'stethoscope' },
    LAB_DIAGNOSTICS: { id: 'LAB_DIAGNOSTICS', label: 'Laboratorio & Ayudas', color: 'teal', icon: 'flask' },
    SURGERY_PROCEDURE: { id: 'SURGERY_PROCEDURE', label: 'Cirugía & Quirófano', color: 'rose', icon: 'hospital' },
    PHARMACY_EXPENSE: { id: 'PHARMACY_EXPENSE', label: 'Farmacia & Caja Menor', color: 'amber', icon: 'receipt' },
    HOTEL_RECOVERY: { id: 'HOTEL_RECOVERY', label: 'Hotel & Reposo', color: 'slate', icon: 'bed' }
};

export const EVENT_STATUS = {
    SCHEDULED: 'SCHEDULED',
    IN_TRANSIT: 'IN_TRANSIT',
    ON_SITE: 'ON_SITE',
    COMPLETED: 'COMPLETED'
};

export class ItineraryEvent {
    constructor({
        id,
        patientId,
        title,
        category = 'CLINICAL_CONSULTATION',
        startDateTime, // ISO string
        endDateTime,   // ISO string
        location,
        provider,
        assignedRole,
        assignedAgentName,
        costType = 'INCLUIDO', // 'TRANSPORTE', 'HONORARIO_GUIA', 'CAJA_MENOR', 'FARMACIA', 'INCLUIDO'
        costUnits = 0,
        hours = 0,
        status = EVENT_STATUS.SCHEDULED,
        notes = '',
        gpsChecked = false
    }) {
        if (!id) throw new Error('[ItineraryEvent]: id es obligatorio');
        if (!patientId) throw new Error('[ItineraryEvent]: patientId es obligatorio');
        if (!title) throw new Error('[ItineraryEvent]: title es obligatorio');

        this.id = id;
        this.patientId = patientId;
        this.title = title;
        this.category = EVENT_CATEGORIES[category] ? category : 'CLINICAL_CONSULTATION';
        this.startDateTime = new Date(startDateTime);
        this.endDateTime = endDateTime ? new Date(endDateTime) : new Date(this.startDateTime.getTime() + 60 * 60 * 1000);
        
        // Validación territorial del dominio
        this.territory = new OperativeTerritory(location);
        this.location = this.territory.name;
        
        this.provider = provider || 'Medical Trip';
        this.assignedRole = assignedRole || '[COORD] Carolina';
        this.assignedAgentName = assignedAgentName || 'Carolina Cortázar';
        this.costType = costType;
        this.cost = Money.fromUnits(costUnits, 'COP');
        this.hours = Number(hours) || 0;
        this.status = status;
        this.notes = notes;
        this.gpsChecked = Boolean(gpsChecked);
    }

    get durationMinutes() {
        return Math.round((this.endDateTime.getTime() - this.startDateTime.getTime()) / (1000 * 60));
    }

    reschedule(newStartDateTime, newEndDateTime = null) {
        const oldDuration = this.durationMinutes;
        this.startDateTime = new Date(newStartDateTime);
        if (newEndDateTime) {
            this.endDateTime = new Date(newEndDateTime);
        } else {
            this.endDateTime = new Date(this.startDateTime.getTime() + oldDuration * 60 * 1000);
        }
    }

    markCompleted(gpsCoords = null) {
        this.status = EVENT_STATUS.COMPLETED;
        this.gpsChecked = true;
        this.gpsCoords = gpsCoords;
    }
}
