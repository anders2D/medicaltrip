import { EVENT_CATEGORIES } from '../domain/ItineraryEvent.js';

export class DayView {
    static render(currentDate, events = []) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const day = currentDate.getDate();

        const dayEvents = events.filter(e => {
            const ed = new Date(e.startDateTime);
            return ed.getFullYear() === year && ed.getMonth() === month && ed.getDate() === day;
        });

        const dayStr = currentDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        return `
            <div class="agenda-container">
                <div style="margin-bottom:20px; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
                    <h2 style="font-size:1.3rem; font-weight:800; text-transform:capitalize; color:var(--text-primary);">${dayStr}</h2>
                    <p style="font-size:0.85rem; color:var(--text-muted);">${dayEvents.length} actividades programadas para este día</p>
                </div>

                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${dayEvents.length === 0 ? `
                        <div style="text-align:center; padding:40px 20px; color:var(--text-muted); background:var(--bg-surface-subtle); border-radius:var(--radius-md);">
                            <i class="fa-regular fa-calendar" style="font-size:2rem; margin-bottom:8px; opacity:0.5;"></i>
                            <p>No hay eventos programados para este día.</p>
                        </div>
                    ` : dayEvents.map(e => {
                        const cat = EVENT_CATEGORIES[e.category] || EVENT_CATEGORIES.CLINICAL_CONSULTATION;
                        const start = new Date(e.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const end = new Date(e.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return `
                            <div class="agenda-card" data-event-id="${e.id}" style="border-left:4px solid var(--event-${cat.color}-badge);">
                                <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <span class="event-chip ${cat.color}" style="font-size:0.7rem; padding:2px 8px;">
                                            <i class="fa-solid fa-${cat.icon}"></i> ${cat.label}
                                        </span>
                                        <span style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">${start} - ${end}</span>
                                        ${e.status === 'COMPLETED' ? '<span style="font-size:0.7rem; color:var(--success); font-weight:700;"><i class="fa-solid fa-check"></i> COMPLETADO</span>' : ''}
                                    </div>
                                    <h3 style="font-size:1rem; font-weight:700; color:var(--text-primary);">${e.title}</h3>
                                    <div style="font-size:0.82rem; color:var(--text-secondary);">
                                        <i class="fa-solid fa-location-dot" style="color:var(--text-muted);"></i> ${e.location} • 
                                        <i class="fa-solid fa-user-tag" style="color:var(--text-muted);"></i> ${e.assignedRole} (${e.assignedAgentName})
                                    </div>
                                    ${e.notes ? `<div style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">"${e.notes}"</div>` : ''}
                                </div>

                                <div style="text-align:right; margin-left:16px;">
                                    <div style="font-size:0.95rem; font-weight:800; font-family:var(--font-mono); color:var(--primary);">${e.cost.format()}</div>
                                    <div style="font-size:0.7rem; color:var(--text-muted);">${e.costType}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}
