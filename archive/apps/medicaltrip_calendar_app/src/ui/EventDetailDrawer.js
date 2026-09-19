import { EVENT_CATEGORIES, EVENT_STATUS } from '../domain/ItineraryEvent.js';

export class EventDetailDrawer {
    static render(event = null, patientId = 'rva171') {
        const isEdit = Boolean(event);
        const categories = Object.values(EVENT_CATEGORIES);

        // Fechas por defecto
        const now = new Date();
        const startStr = isEdit 
            ? new Date(event.startDateTime).toISOString().slice(0, 16) 
            : new Date(now.setMinutes(0, 0, 0)).toISOString().slice(0, 16);
        const endStr = isEdit 
            ? new Date(event.endDateTime).toISOString().slice(0, 16) 
            : new Date(now.getTime() + 60*60*1000).toISOString().slice(0, 16);

        return `
            <div class="drawer-backdrop" id="eventDrawerBackdrop">
                <div class="drawer-panel" onclick="event.stopPropagation()">
                    <div class="drawer-header">
                        <div class="drawer-title">
                            <i class="fa-solid fa-${isEdit ? 'pen-to-square' : 'plus'}" style="color: var(--primary);"></i>
                            <span>${isEdit ? 'Editar Actividad' : 'Nueva Actividad de Itinerario'}</span>
                        </div>
                        <button class="btn btn-sm" id="btnCloseDrawer"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <form id="eventDrawerForm" class="drawer-body">
                        <input type="hidden" id="drawerEventId" value="${isEdit ? event.id : ''}">
                        <input type="hidden" id="drawerPatientId" value="${patientId}">

                        <div class="form-group">
                            <label class="form-label" for="drawerTitle">Título de la Actividad *</label>
                            <input type="text" id="drawerTitle" class="form-input" required 
                                   placeholder="Ej: Consulta Oftalmología Dr. Peláez" 
                                   value="${isEdit ? event.title : ''}">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="drawerCategory">Categoría</label>
                            <select id="drawerCategory" class="form-select">
                                ${categories.map(cat => `
                                    <option value="${cat.id}" ${isEdit && event.category === cat.id ? 'selected' : ''}>
                                        ${cat.label}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label class="form-label" for="drawerStart">Inicio</label>
                                <input type="datetime-local" id="drawerStart" class="form-input" required value="${startStr}">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="drawerEnd">Fin</label>
                                <input type="datetime-local" id="drawerEnd" class="form-input" required value="${endStr}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="drawerLocation">Ubicación / Clínica / Hotel *</label>
                            <input type="text" id="drawerLocation" class="form-input" required 
                                   placeholder="Ej: Clínica Clofán Ciudad del Río" 
                                   value="${isEdit ? event.location : ''}">
                            <span style="font-size: 0.7rem; color: var(--text-muted);">
                                Invariante: Zonas permitidas (Medellín, Rionegro, Poblado, Laureles, etc.)
                            </span>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label class="form-label" for="drawerRole">Responsable</label>
                                <select id="drawerRole" class="form-select">
                                    <option value="[GUIA] Yenny" ${isEdit && event.assignedRole === '[GUIA] Yenny' ? 'selected' : ''}>[GUIA] Yenny Bilingüe</option>
                                    <option value="[DRV] Ramón" ${isEdit && event.assignedRole === '[DRV] Ramón' ? 'selected' : ''}>[DRV] Ramón Rosero</option>
                                    <option value="[DRV] Andrés" ${isEdit && event.assignedRole === '[DRV] Andrés' ? 'selected' : ''}>[DRV] Andrés (Uber XL)</option>
                                    <option value="[COORD] Carolina" ${isEdit && event.assignedRole === '[COORD] Carolina' ? 'selected' : ''}>[COORD] Carolina Cortázar</option>
                                    <option value="Lab Domicilio" ${isEdit && event.assignedRole === 'Lab Domicilio' ? 'selected' : ''}>Lab Echavarría Domicilio</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="drawerCostType">Rubro de Costo</label>
                                <select id="drawerCostType" class="form-select">
                                    <option value="INCLUIDO" ${isEdit && event.costType === 'INCLUIDO' ? 'selected' : ''}>Incluido en Paquete</option>
                                    <option value="TRANSPORTE" ${isEdit && event.costType === 'TRANSPORTE' ? 'selected' : ''}>Transporte / Flota</option>
                                    <option value="HONORARIO_GUIA" ${isEdit && event.costType === 'HONORARIO_GUIA' ? 'selected' : ''}>Honorarios Guianza</option>
                                    <option value="CAJA_MENOR" ${isEdit && event.costType === 'CAJA_MENOR' ? 'selected' : ''}>Caja Menor / Viático</option>
                                    <option value="FARMACIA" ${isEdit && event.costType === 'FARMACIA' ? 'selected' : ''}>Farmacia & Recetas</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="form-group">
                                <label class="form-label" for="drawerCostUnits">Monto COP</label>
                                <input type="number" id="drawerCostUnits" class="form-input" min="0" step="500" 
                                       placeholder="Ej: 35000" 
                                       value="${isEdit ? event.cost.units : '0'}">
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="drawerHours">Horas (si es Guía)</label>
                                <input type="number" id="drawerHours" class="form-input" min="0" max="24" step="0.5" 
                                       placeholder="Ej: 3.5" 
                                       value="${isEdit ? event.hours : '0'}">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="drawerNotes">Notas e Instrucciones Operativas</label>
                            <textarea id="drawerNotes" class="form-textarea" rows="3" 
                                      placeholder="Ej: Ayuno estricto 8h / Llevar muestra orina recolectada">${isEdit ? event.notes : ''}</textarea>
                        </div>
                    </form>

                    <div class="drawer-footer">
                        ${isEdit ? `
                            <button type="button" class="btn btn-sm" id="btnDeleteEvent" style="color: var(--danger); margin-right: auto;">
                                <i class="fa-solid fa-trash"></i> Eliminar
                            </button>
                        ` : ''}
                        <button type="button" class="btn" id="btnCancelDrawer">Cancelar</button>
                        <button type="submit" form="eventDrawerForm" class="btn btn-primary">
                            <i class="fa-solid fa-check"></i> ${isEdit ? 'Guardar Cambios' : 'Crear Actividad'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}
