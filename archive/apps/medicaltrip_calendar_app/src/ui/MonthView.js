import { EVENT_CATEGORIES } from '../domain/ItineraryEvent.js';

export class MonthView {
    static render(currentDate, events = [], onEventClick, onDayClick) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDayIndex = firstDay.getDay(); // 0 = Domingo
        const totalDays = lastDay.getDate();

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        let cellsHtml = '';

        // Días del mes anterior para rellenar
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            cellsHtml += `
                <div class="month-cell other-month">
                    <div class="month-date-number">${dayNum}</div>
                </div>
            `;
        }

        // Días del mes actual
        for (let day = 1; day <= totalDays; day++) {
            const isToday = isCurrentMonth && today.getDate() === day;
            const thisDate = new Date(year, month, day);

            // Filtrar eventos de este día
            const dayEvents = events.filter(e => {
                const eDate = new Date(e.startDateTime);
                return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day;
            });

            cellsHtml += `
                <div class="month-cell ${isToday ? 'today' : ''}" data-date="${thisDate.toISOString()}">
                    <div class="month-date-number">${day}</div>
                    <div style="display:flex; flex-direction:column; gap:3px; overflow-y:auto; max-height:85px;">
                        ${dayEvents.slice(0, 3).map(e => {
                            const cat = EVENT_CATEGORIES[e.category] || EVENT_CATEGORIES.CLINICAL_CONSULTATION;
                            const timeStr = new Date(e.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return `
                                <div class="event-chip ${cat.color}" data-event-id="${e.id}" title="${e.title}">
                                    <i class="fa-solid fa-${cat.icon}" style="font-size:0.65rem;"></i>
                                    <span>${timeStr} ${e.title}</span>
                                </div>
                            `;
                        }).join('')}
                        ${dayEvents.length > 3 ? `<div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; padding-left:4px;">+${dayEvents.length - 3} más</div>` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="month-header-row">
                ${dayNames.map(name => `<div class="month-day-name">${name}</div>`).join('')}
            </div>
            <div class="month-grid">
                ${cellsHtml}
            </div>
        `;
    }
}
