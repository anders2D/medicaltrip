import { EVENT_CATEGORIES } from '../domain/ItineraryEvent.js';

export class AgendaView {
    static render(events = []) {
        // Agrupar eventos por fecha YYYY-MM-DD
        const grouped = {};
        const sorted = [...events].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

        sorted.forEach(e => {
            const d = new Date(e.startDateTime);
            const key = d.toISOString().split('T')[0];
            if (!grouped[key]) grouped[key] = { date: d, events: [] };
            grouped[key].events.push(e);
        });

        return `
            <div class="agenda-container">
                <div style="margin-bottom:20px; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
                    <h2 style="font-size:1.25rem; font-weight:800;">Cronograma Maestro de Itinerario en Terreno</h2>
                    <p style="font-size:0.85rem; color:var(--text-muted);">Visualización secuencial ordenada cronológicamente con liquidación integrada</p>
                </div>

                ${Object.keys(grouped).length === 0 ? `
                    <div style="text-align:center; padding:40px; color:var(--text-muted);">No hay eventos en el itinerario.</div>
                ` : Object.values(grouped).map(group => {
                    const dateStr = group.date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
                    return `
                        <div class="agenda-day-group">
                            <div class="agenda-date-header">
                                <span class="agenda-date-badge">${group.events.length} eventos</span>
                                <span>${dateStr}</span>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:8px;">
                                ${group.events.map(e => {
                                    const cat = EVENT_CATEGORIES[e.category] || EVENT_CATEGORIES.CLINICAL_CONSULTATION;
                                    const start = new Date(e.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const end = new Date(e.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return `
                                        <div class="agenda-card" data-event-id="${e.id}">
                                            <div style="display:flex; align-items:center; gap:12px; flex:1;">
                                                <div style="min-width:90px; font-size:0.8rem; font-weight:700; color:var(--text-secondary);">
                                                    ${start} - ${end}
                                                </div>
                                                <div style="width:4px; height:32px; background:var(--event-${cat.color}-badge); border-radius:2px;"></div>
                                                <div style="flex:1;">
                                                    <div style="font-size:0.9rem; font-weight:700; color:var(--text-primary);">${e.title}</div>
                                                    <div style="font-size:0.78rem; color:var(--text-muted);">
                                                        ${e.location} • ${e.assignedRole}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style="text-align:right;">
                                                <div style="font-size:0.88rem; font-weight:800; font-family:var(--font-mono);">${e.cost.format()}</div>
                                                <div style="font-size:0.68rem; color:var(--text-muted);">${e.costType}</div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}
