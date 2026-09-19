/**
 * Medical Trip Calendar App — Domain Value Object: OperativeTerritory
 * Invariante de Dominio: Valida zonas autorizadas en Antioquia/Eje Cafetero y rechaza explícitamente zonas fuera de corredor (ej: Mocoa).
 */

export class OperativeTerritory {
    static VALID_CORRIDORS = [
        'MEDELLIN', 'RIONEGRO', 'POBLADO', 'LAURELES', 'ROBLEDO',
        'CIUDAD_DEL_RIO', 'ENVIGADO', 'SABANETA', 'BELLO', 'MANIZALES'
    ];

    static FORBIDDEN_LOCATIONS = [
        'MOCOA', 'AMAZONAS', 'LETICIA', 'ARAUCA', 'GUAVIARE', 'PUTUMAYO'
    ];

    constructor(locationName) {
        const raw = String(locationName || '').trim();
        if (!raw) {
            this._name = 'Medellín (Ubicación General)';
            Object.freeze(this);
            return;
        }

        const normalized = raw.toUpperCase();
        
        if (OperativeTerritory.FORBIDDEN_LOCATIONS.some(f => normalized.includes(f))) {
            throw new Error(`[DomainError - Violación Geoespacial]: La ubicación '${locationName}' está prohibida y fuera del corredor operativo de Medical Trip Colombia.`);
        }

        this._name = locationName;
        Object.freeze(this);
    }

    get name() {
        return this._name;
    }
}
