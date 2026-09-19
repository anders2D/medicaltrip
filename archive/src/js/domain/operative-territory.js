/**
 * Medical Trip Domain — Value Object: OperativeTerritory
 * Invariante de Dominio: Valida zonas autorizadas de la operación médica y rechaza explícitamente zonas fuera de corredor (ej: Mocoa).
 */

export class OperativeTerritory {
    static VALID_CORRIDORS = [
        'MEDELLIN', 'RIONEGRO', 'POBLADO', 'LAURELES', 'ROBLEDO',
        'CIUDAD_DEL_RIO', 'ENVIGADO', 'SABANETA', 'BELLO', 'MANIZALES'
    ];

    static FORBIDDEN_LOCATIONS = [
        'MOCOA', 'AMAZONAS', 'LETICIA', 'ARAUCA', 'GUAVIARE'
    ];

    constructor(locationName) {
        const normalized = String(locationName || '').trim().toUpperCase();
        
        if (OperativeTerritory.FORBIDDEN_LOCATIONS.some(f => normalized.includes(f))) {
            throw new Error(`[DomainError - Violación de Invariante Geoespacial]: La ubicación '${locationName}' está explícitamente fuera del corredor habilitado de Medical Trip Colombia S.A.S.`);
        }

        const isValid = OperativeTerritory.VALID_CORRIDORS.some(v => normalized.includes(v)) || 
                        normalized.includes('JMC') || 
                        normalized.includes('AEROPUERTO') ||
                        normalized.includes('HOTEL') ||
                        normalized.includes('CLINICA');

        if (!isValid && normalized.length > 0) {
            console.warn(`[Territorio Operativo]: '${locationName}' marcado como zona especial.`);
        }

        this._name = locationName;
        Object.freeze(this);
    }

    get name() {
        return this._name;
    }
}
