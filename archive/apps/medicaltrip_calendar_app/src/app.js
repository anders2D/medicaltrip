import { DriveDatasetAdapter } from './infrastructure/DriveDatasetAdapter.js';
import { LocalFirstStorageAdapter } from './infrastructure/LocalFirstStorageAdapter.js';
import { CalendarHeader } from './ui/CalendarHeader.js';
import { MonthView } from './ui/MonthView.js';
import { WeekView } from './ui/WeekView.js';
import { DayView } from './ui/DayView.js';
import { AgendaView } from './ui/AgendaView.js';
import { EventDetailDrawer } from './ui/EventDetailDrawer.js';
import { SettlementBalanceBar } from './ui/SettlementBalanceBar.js';
import { ReceiptOcrModal } from './ui/ReceiptOcrModal.js';
import { DigitalSignatureModal } from './ui/DigitalSignatureModal.js';
import { ItineraryEvent } from './domain/ItineraryEvent.js';
import { SettlementLedger } from './domain/SettlementLedger.js';
import { OperativeTerritory } from './domain/OperativeTerritory.js';

export class MedicalTripCalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month'; // 'month' | 'week' | 'day' | 'agenda'
        this.patients = DriveDatasetAdapter.getPatients();
        this.selectedPatientId = 'rva171';
        this.events = [];
        this.extraTickets = [];
    }

    async init() {
        await LocalFirstStorageAdapter.init();

        const defaultEvents = DriveDatasetAdapter.getInitialEvents();
        const loaded = LocalFirstStorageAdapter.loadEvents(defaultEvents);
        
        // Mapear objetos a instancias de ItineraryEvent
        this.events = loaded.map(e => new ItineraryEvent({
            ...e,
            costUnits: e.cost?.units || e.costUnits || 0
        }));

        this.extraTickets = LocalFirstStorageAdapter.loadTickets(this.selectedPatientId);

        this.render();
        console.log('✅ [MedicalTripCalendarApp]: Inicializada con éxito bajo Arquitectura Hexagonal y Local-First.');
    }

    get currentPatient() {
        return this.patients.find(p => p.id === this.selectedPatientId) || this.patients[0];
    }

    get patientEvents() {
        return this.events.filter(e => e.patientId === this.selectedPatientId);
    }

    calculateSettlement() {
        const ledger = new SettlementLedger(this.selectedPatientId, this.currentPatient.advanceTotal);
        return ledger.calculateFromEvents(this.patientEvents, this.extraTickets);
    }

    render() {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;

        const settlement = this.calculateSettlement();

        appContainer.innerHTML = `
            ${CalendarHeader.render(this.currentDate, this.currentView)}
            
            <div class="patient-bar">
                <span class="patient-label"><i class="fa-solid fa-hospital-user"></i> Paciente:</span>
                ${this.patients.map(p => `
                    <div class="patient-pill ${p.id === this.selectedPatientId ? 'active' : ''}" data-patient-id="${p.id}">
                        <span>${p.code}: ${p.name}</span>
                        <span style="font-size:0.68rem; opacity:0.8;">(${p.country} • ${p.paxCount} Pax)</span>
                    </div>
                `).join('')}
            </div>

            <main class="calendar-viewport">
                <div class="calendar-main" id="calendarMain">
                    ${this.renderCurrentView()}
                </div>
            </main>

            ${SettlementBalanceBar.render(settlement)}
            <div id="drawerMount"></div>
            <div id="modalMount"></div>
        `;

        this.bindEvents();
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'week':
                return WeekView.render(this.currentDate, this.patientEvents);
            case 'day':
                return DayView.render(this.currentDate, this.patientEvents);
            case 'agenda':
                return AgendaView.render(this.patientEvents);
            case 'month':
            default:
                return MonthView.render(this.currentDate, this.patientEvents);
        }
    }

    bindEvents() {
        // Switcher de Vistas
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentView = e.currentTarget.dataset.view;
                this.render();
            });
        });

        // Navegación Temporal
        document.getElementById('btnToday')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.render();
        });

        document.getElementById('btnPrevMonth')?.addEventListener('click', () => {
            this.navigateTime(-1);
        });

        document.getElementById('btnNextMonth')?.addEventListener('click', () => {
            this.navigateTime(1);
        });

        // Switcher de Pacientes
        document.querySelectorAll('.patient-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                this.selectedPatientId = e.currentTarget.dataset.patientId;
                this.extraTickets = LocalFirstStorageAdapter.loadTickets(this.selectedPatientId);
                this.render();
            });
        });

        // Click en Eventos para Editar
        document.querySelectorAll('[data-event-id]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = el.dataset.eventId;
                const evt = this.events.find(x => x.id === eventId);
                if (evt) this.openEventDrawer(evt);
            });
        });

        // Click en Celdas de Día para Crear
        document.querySelectorAll('.month-cell:not(.other-month)').forEach(cell => {
            cell.addEventListener('click', () => {
                const dateIso = cell.dataset.date;
                this.openNewEventDrawer(dateIso);
            });
        });

        // Botón Nuevo Evento Header
        document.getElementById('btnNewEvent')?.addEventListener('click', () => {
            this.openNewEventDrawer();
        });

        // Botones de Liquidación (OCR y Firma)
        document.getElementById('btnUploadReceipt')?.addEventListener('click', () => {
            this.openOcrModal();
        });

        document.getElementById('btnSignOff')?.addEventListener('click', () => {
            this.openSignatureModal();
        });
    }

    navigateTime(delta) {
        const d = new Date(this.currentDate);
        if (this.currentView === 'month') {
            d.setMonth(d.getMonth() + delta);
        } else if (this.currentView === 'week') {
            d.setDate(d.getDate() + delta * 7);
        } else if (this.currentView === 'day') {
            d.setDate(d.getDate() + delta);
        }
        this.currentDate = d;
        this.render();
    }

    openNewEventDrawer(initialDateIso = null) {
        const mount = document.getElementById('drawerMount');
        if (!mount) return;

        const defaultEvent = initialDateIso ? {
            startDateTime: initialDateIso,
            endDateTime: new Date(new Date(initialDateIso).getTime() + 60*60*1000).toISOString()
        } : null;

        mount.innerHTML = EventDetailDrawer.render(defaultEvent, this.selectedPatientId);
        
        const backdrop = document.getElementById('eventDrawerBackdrop');
        setTimeout(() => backdrop?.classList.add('open'), 10);

        this.bindDrawerEvents(null);
    }

    openEventDrawer(event) {
        const mount = document.getElementById('drawerMount');
        if (!mount) return;

        mount.innerHTML = EventDetailDrawer.render(event, this.selectedPatientId);
        const backdrop = document.getElementById('eventDrawerBackdrop');
        setTimeout(() => backdrop?.classList.add('open'), 10);

        this.bindDrawerEvents(event);
    }

    closeDrawer() {
        const backdrop = document.getElementById('eventDrawerBackdrop');
        if (backdrop) {
            backdrop.classList.remove('open');
            setTimeout(() => backdrop.remove(), 200);
        }
    }

    bindDrawerEvents(existingEvent) {
        const backdrop = document.getElementById('eventDrawerBackdrop');
        backdrop?.addEventListener('click', () => this.closeDrawer());
        document.getElementById('btnCloseDrawer')?.addEventListener('click', () => this.closeDrawer());
        document.getElementById('btnCancelDrawer')?.addEventListener('click', () => this.closeDrawer());

        document.getElementById('btnDeleteEvent')?.addEventListener('click', () => {
            if (existingEvent && confirm(`¿Eliminar actividad "${existingEvent.title}"?`)) {
                this.events = this.events.filter(e => e.id !== existingEvent.id);
                LocalFirstStorageAdapter.saveEvents(this.events);
                this.closeDrawer();
                this.render();
            }
        });

        document.getElementById('eventDrawerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('drawerTitle').value.trim();
            const category = document.getElementById('drawerCategory').value;
            const start = document.getElementById('drawerStart').value;
            const end = document.getElementById('drawerEnd').value;
            const location = document.getElementById('drawerLocation').value.trim();
            const role = document.getElementById('drawerRole').value;
            const costType = document.getElementById('drawerCostType').value;
            const costUnits = Number(document.getElementById('drawerCostUnits').value) || 0;
            const hours = Number(document.getElementById('drawerHours').value) || 0;
            const notes = document.getElementById('drawerNotes').value.trim();

            try {
                // Invariante de dominio geoespacial
                new OperativeTerritory(location);

                if (existingEvent) {
                    existingEvent.title = title;
                    existingEvent.category = category;
                    existingEvent.startDateTime = new Date(start);
                    existingEvent.endDateTime = new Date(end);
                    existingEvent.location = location;
                    existingEvent.assignedRole = role;
                    existingEvent.costType = costType;
                    existingEvent.cost = existingEvent.cost.constructor.fromUnits(costUnits, 'COP');
                    existingEvent.hours = hours;
                    existingEvent.notes = notes;
                } else {
                    const newEvt = new ItineraryEvent({
                        id: 'evt-' + Date.now(),
                        patientId: this.selectedPatientId,
                        title,
                        category,
                        startDateTime: start,
                        endDateTime: end,
                        location,
                        assignedRole: role,
                        costType,
                        costUnits,
                        hours,
                        notes
                    });
                    this.events.push(newEvt);
                }

                LocalFirstStorageAdapter.saveEvents(this.events);
                this.closeDrawer();
                this.render();
            } catch (err) {
                alert(err.message);
            }
        });
    }

    openOcrModal() {
        const mount = document.getElementById('modalMount');
        if (!mount) return;

        mount.innerHTML = ReceiptOcrModal.render();

        document.getElementById('ocrModalBackdrop')?.addEventListener('click', () => {
            document.getElementById('ocrModalBackdrop')?.remove();
        });
        document.getElementById('btnCloseOcrModal')?.addEventListener('click', () => {
            document.getElementById('ocrModalBackdrop')?.remove();
        });
        document.getElementById('btnCancelOcr')?.addEventListener('click', () => {
            document.getElementById('ocrModalBackdrop')?.remove();
        });

        document.getElementById('btnConfirmOcr')?.addEventListener('click', () => {
            const concept = document.getElementById('ocrConcept').value;
            const amount = Number(document.getElementById('ocrAmount').value) || 0;

            const ticket = {
                id: 'tkt-' + Date.now(),
                patientId: this.selectedPatientId,
                concept,
                amountUnits: amount,
                date: new Date().toISOString()
            };

            LocalFirstStorageAdapter.addTicket(ticket);
            this.extraTickets.push(ticket);
            document.getElementById('ocrModalBackdrop')?.remove();
            this.render();
        });
    }

    openSignatureModal() {
        const mount = document.getElementById('modalMount');
        if (!mount) return;

        mount.innerHTML = DigitalSignatureModal.render(this.currentPatient.name);

        const canvas = document.getElementById('sigCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#0284c7';

            let isDrawing = false;
            canvas.addEventListener('mousedown', (e) => {
                isDrawing = true;
                ctx.beginPath();
                ctx.moveTo(e.offsetX, e.offsetY);
            });
            canvas.addEventListener('mousemove', (e) => {
                if (isDrawing) {
                    ctx.lineTo(e.offsetX, e.offsetY);
                    ctx.stroke();
                }
            });
            canvas.addEventListener('mouseup', () => { isDrawing = false; });
            canvas.addEventListener('mouseleave', () => { isDrawing = false; });

            document.getElementById('btnClearSig')?.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            document.getElementById('btnAutoSig')?.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.moveTo(20, 70);
                ctx.bezierCurveTo(80, 20, 140, 90, 200, 50);
                ctx.bezierCurveTo(240, 30, 280, 80, 350, 60);
                ctx.stroke();
            });
        }

        document.getElementById('sigModalBackdrop')?.addEventListener('click', () => {
            document.getElementById('sigModalBackdrop')?.remove();
        });
        document.getElementById('btnCloseSigModal')?.addEventListener('click', () => {
            document.getElementById('sigModalBackdrop')?.remove();
        });
        document.getElementById('btnCancelSig')?.addEventListener('click', () => {
            document.getElementById('sigModalBackdrop')?.remove();
        });

        document.getElementById('btnConfirmSig')?.addEventListener('click', () => {
            alert('✅ Turno y liquidación certificados con firma digital del paciente.');
            document.getElementById('sigModalBackdrop')?.remove();
        });
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.App = new MedicalTripCalendarApp();
    window.App.init();
});
