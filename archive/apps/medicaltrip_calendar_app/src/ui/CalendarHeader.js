export class CalendarHeader {
    static render(currentDate, currentView, onViewChange, onNavChange, onNewEventClick) {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const monthStr = monthNames[currentDate.getMonth()];
        const yearStr = currentDate.getFullYear();

        return `
            <header class="app-header">
                <div class="brand-section">
                    <div class="brand-logo">MT</div>
                    <div>
                        <div class="brand-title">Medical Trip Itinerarios</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">Consumer Calendar & Liquidación</div>
                    </div>
                </div>

                <div class="header-nav">
                    <button class="btn btn-sm" id="btnToday">Hoy</button>
                    <button class="btn btn-sm" id="btnPrevMonth" title="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
                    <button class="btn btn-sm" id="btnNextMonth" title="Siguiente"><i class="fa-solid fa-chevron-right"></i></button>
                    <div class="header-title-date" id="calendarDateTitle">${monthStr} ${yearStr}</div>
                </div>

                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="view-switcher">
                        <button class="view-btn ${currentView === 'month' ? 'active' : ''}" data-view="month">Mes</button>
                        <button class="view-btn ${currentView === 'week' ? 'active' : ''}" data-view="week">Semana</button>
                        <button class="view-btn ${currentView === 'day' ? 'active' : ''}" data-view="day">Día</button>
                        <button class="view-btn ${currentView === 'agenda' ? 'active' : ''}" data-view="agenda">Agenda</button>
                    </div>

                    <button class="btn btn-primary" id="btnNewEvent">
                        <i class="fa-solid fa-plus"></i> Nuevo Evento
                    </button>
                </div>
            </header>
        `;
    }
}
