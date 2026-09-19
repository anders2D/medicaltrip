import { EVENT_CATEGORIES } from '../domain/ItineraryEvent.js';

export class WeekView {
    static render(currentDate, events = []) {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day); // Domingo de inicio de semana

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(d.getDate() + i);
            weekDays.push(d);
        }

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 06:00 to 21:00

        const headerHtml = `
            <div class="timegrid-header">
                <div style="border-right:1px solid var(--border-subtle);"></div>
                ${weekDays.map((wd, i) => `
                    <div style="text-align:center; padding:8px; border-left:1px solid var(--border-subtle);">
                        <div style="font-size:0.72rem; font-weight:700; color:var(--text-muted);">${dayNames[i]}</div>
                        <div style="font-size:1rem; font-weight:800;">${wd.getDate()}</div>
                    </div>
                `).join('')}
            </div>
        `;

        const bodyHtml = `
            <div class="timegrid-body">
                <div>
                    ${hours.map(h => `<div class="time-slot-label">${h}:00</div>`).join('')}
                </div>
                ${weekDays.map(wd => {
                    const dayEvents = events.filter(e => {
                        const ed = new Date(e.startDateTime);
                        return ed.getFullYear() === wd.getFullYear() && ed.getMonth() === wd.getMonth() && ed.getDate() === wd.getDate();
                    });

                    return `
                        <div class="day-column">
                            ${hours.map(() => `<div class="hour-cell-line"></div>`).join('')}
                            ${dayEvents.map(e => {
                                const start = new Date(e.startDateTime);
                                const end = new Date(e.endDateTime);
                                const startHours = start.getHours() + start.getMinutes() / 60;
                                const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                                if (startHours < 6 || startHours > 22) return '';

                                const topPx = (startHours - 6) * 48;
                                const heightPx = Math.max(durationHours * 48, 26);
                                const cat = EVENT_CATEGORIES[e.category] || EVENT_CATEGORIES.CLINICAL_CONSULTATION;

                                return `
                                    <div class="timegrid-event ${cat.color}" 
                                         style="top: ${topPx}px; height: ${heightPx}px;"
                                         data-event-id="${e.id}"
                                         title="${e.title}">
                                        <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                            ${e.title}
                                        </div>
                                        <div style="font-size:0.68rem; opacity:0.85;">
                                            ${start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${e.location}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        return `
            <div class="week-grid-container">
                ${headerHtml}
                ${bodyHtml}
            </div>
        `;
    }
}
