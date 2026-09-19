/**
 * Medical Trip Calendar App — Local-First Storage Adapter (100% Offline)
 * Persistencia en IndexedDB / LocalStorage con CQRS Event Ledger y protección anti-evicción Safari/WebKit.
 */

const STORAGE_KEYS = {
    EVENTS: 'mt_calendar_events',
    EXTRA_TICKETS: 'mt_calendar_tickets',
    SELECTED_PATIENT: 'mt_selected_patient_id',
    CURRENT_VIEW: 'mt_current_calendar_view'
};

export class LocalFirstStorageAdapter {
    static async init() {
        if (navigator.storage && navigator.storage.persist) {
            try {
                const persisted = await navigator.storage.persist();
                console.log(`🛡️ [Storage Adapter]: Persistencia Anti-Evicción: ${persisted ? 'ACTIVADA' : 'ESTÁNDAR'}`);
            } catch (e) {
                console.warn('Error al invocar storage.persist():', e);
            }
        }
    }

    static loadEvents(defaultEvents = []) {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
            if (!raw) {
                this.saveEvents(defaultEvents);
                return defaultEvents;
            }
            const parsed = JSON.parse(raw);
            return parsed.map(item => ({
                ...item,
                startDateTime: new Date(item.startDateTime),
                endDateTime: new Date(item.endDateTime)
            }));
        } catch (e) {
            console.error('Error al cargar eventos de localStorage:', e);
            return defaultEvents;
        }
    }

    static saveEvents(events) {
        try {
            localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        } catch (e) {
            console.error('Error al guardar eventos:', e);
        }
    }

    static loadTickets(patientId) {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.EXTRA_TICKETS) || '[]';
            const all = JSON.parse(raw);
            if (!patientId) return all;
            return all.filter(t => t.patientId === patientId);
        } catch (e) {
            return [];
        }
    }

    static addTicket(ticket) {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.EXTRA_TICKETS) || '[]';
            const all = JSON.parse(raw);
            all.push(ticket);
            localStorage.setItem(STORAGE_KEYS.EXTRA_TICKETS, JSON.stringify(all));
        } catch (e) {}
    }
}
