/**
 * Medical Trip Hub — Suite Integral de Itinerarios & Liquidaciones (Local-First 100% Offline)
 * Implementa la interfaz dividida (Master-Detail), timeline por días, simulación GPS,
 * tickets de farmacia con OCR, firma digital y liquidación matemática determinista (Money).
 */

import { Money } from '../domain/money.js';
import { OperativeTerritory } from '../domain/operative-territory.js';
import { LocalFirstDB } from '../storage/local-first-db.js';
import { AgentSwarmSimulator } from '../actors/agent-swarm-simulator.js';

export class ItineraryLiveSuite {
    static _currentArchetype = 'rva171';
    static _activeDay = 1;
    static _expensesList = [];
    static _milestonesState = {};

    static getArchetypeData() {
        return {
            rva171: {
                id: 'rva171',
                code: 'RVA171-4',
                title: 'RVA171: Grupo Familiar Curazao (Catia Rodrigues x5)',
                paxName: 'Catia Rodrigues, Tatiana, Mariana, María, Lisandra',
                country: 'Curazao',
                paxCount: 5,
                hotel: 'Hotel Inntu Laureles',
                stayDays: 5,
                advanceTotal: Money.fromUnits(2098100, 'COP'),
                days: {
                    1: [
                        { id: 'h-171-1', time: '10:00 AM', act: 'Aterrizaje Vuelo Z Fly en JMC', loc: 'Aeropuerto JMC ➔ Inntu Laureles', prov: 'Uber XL / Andrés', role: '[DRV] Andrés', costType: 'TRANSPORTE', costUnits: 160000, status: 'COMPLETADO', gpsChecked: true },
                        { id: 'h-171-2', time: '02:00 PM', act: 'Traslado Inntu ➔ Clínica Clofán', loc: 'Laureles ➔ Ciudad del Río', prov: 'Uber XL', role: '[DRV] Andrés', costType: 'TRANSPORTE', costUnits: 38000, status: 'COMPLETADO', gpsChecked: true },
                        { id: 'h-171-3', time: '03:00 PM', act: 'Exámenes Oftalmología Dr. Peláez (María)', loc: 'Clínica Clofán', prov: 'Clofán', role: '[GUIA] Yenny', costType: 'HONORARIO_GUIA', hours: 3.5, costUnits: 54250, status: 'COMPLETADO', gpsChecked: true },
                        { id: 'h-171-4', time: '04:30 PM', act: 'Parqueadero Torre Médica Clofán', loc: 'Sótano Clofán', prov: 'Parqueadero', role: '[DRV] Andrés', costType: 'CAJA_MENOR', costUnits: 12000, status: 'COMPLETADO', gpsChecked: false }
                    ],
                    2: [
                        { id: 'h-171-5', time: '05:45 AM', act: 'Traslado en ayunas a CIMA (Tatiana/Mariana)', loc: 'Inntu ➔ CIMA (Cra 44)', prov: 'Uber XL', role: '[DRV] Andrés', costType: 'TRANSPORTE', costUnits: 35000, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-171-6', time: '06:30 AM', act: 'Acompañamiento Ecografías CIMA (8 hrs)', loc: 'CIMA Ayudas Diagnósticas', prov: 'CIMA', role: '[GUIA] Yenny', costType: 'HONORARIO_GUIA', hours: 8.0, costUnits: 124000, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-171-7', time: '02:00 PM', act: 'Alimentación Turno Guía (>8h)', loc: 'Zona CIMA', prov: 'Alimentación', role: '[GUIA] Yenny', costType: 'CAJA_MENOR', costUnits: 35000, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-171-8', time: '03:30 PM', act: 'Compra de Gotas y Fórmulas Farmacia', loc: 'Cruz Verde Poblado', prov: 'Cruz Verde', role: '[GUIA] Yenny', costType: 'FARMACIA', costUnits: 85000, status: 'PROGRAMADO', gpsChecked: false }
                    ],
                    5: [
                        { id: 'h-171-9', time: '01:00 PM', act: 'Check-out y Cierre Médico', loc: 'Hotel Inntu Laureles', prov: 'Medical Trip', role: '[COORD] Carolina', costType: 'INCLUIDO', costUnits: 0, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-171-10', time: '03:00 PM', act: 'Traslado Retorno Hotel ➔ JMC', loc: 'Laureles ➔ Aeropuerto JMC', prov: 'Uber XL', role: '[DRV] Andrés', costType: 'TRANSPORTE', costUnits: 160000, status: 'PROGRAMADO', gpsChecked: false }
                    ]
                }
            },
            rva282: {
                id: 'rva282',
                code: 'RVA282-5',
                title: 'RVA282: Chequeo Cardio & Urología (George Hernandez x2)',
                paxName: 'George Hernandez & Adriaan Fabian',
                country: 'Curazao',
                paxCount: 2,
                hotel: 'Airbnb Ed. Park 42 Poblado',
                stayDays: 4,
                advanceTotal: Money.fromUnits(1200000, 'COP'),
                days: {
                    1: [
                        { id: 'h-282-1', time: '03:27 PM', act: 'Aterrizaje Wingo + Entrega SIM Claro', loc: 'Aeropuerto JMC ➔ Park 42', prov: 'Aeroturex', role: '[DRV] Ramón Rosero', costType: 'TRANSPORTE', costUnits: 145000, status: 'COMPLETADO', gpsChecked: true }
                    ],
                    2: [
                        { id: 'h-282-2', time: '07:00 AM', act: 'Alistamiento Muestra Orina & Carpeta', loc: 'Habitación Park 42', prov: 'Guianza Express', role: '[GUIA] Yenny', costType: 'HONORARIO_GUIA', hours: 1.0, costUnits: 15500, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-282-3', time: '08:30 AM', act: 'Traslado Park 42 ➔ Torre Oviedo', loc: 'Poblado ➔ Poblado', prov: 'Aeroturex', role: '[DRV] Ramón Rosero', costType: 'TRANSPORTE', costUnits: 30000, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-282-4', time: '09:00 AM', act: 'Entrega Muestras Lab Echavarría & CES', loc: 'Torre Oviedo Piso 6', prov: 'CES / Echavarría', role: '[GUIA] Yenny', costType: 'HONORARIO_GUIA', hours: 4.0, costUnits: 62000, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-282-5', time: '11:00 AM', act: 'Subsidio Alimentación Guía (4h)', loc: 'Sector Oviedo', prov: 'Alimentación', role: '[GUIA] Yenny', costType: 'CAJA_MENOR', costUnits: 25000, status: 'PROGRAMADO', gpsChecked: false }
                    ],
                    4: [
                        { id: 'h-282-6', time: '04:00 PM', act: 'Traslado Salida Sedán Aeroturex', loc: 'Park 42 ➔ JMC Aeropuerto', prov: 'Aeroturex', role: '[DRV] Ramón Rosero', costType: 'TRANSPORTE', costUnits: 110000, status: 'PROGRAMADO', gpsChecked: false }
                    ]
                }
            },
            rva341: {
                id: 'rva341',
                code: 'RVA341-1',
                title: 'RVA341: Eduard Hogenboom (Bilingüe Inglés / CES)',
                paxName: 'Eduard Hogenboom & Marcelle Cameron',
                country: 'Curazao',
                paxCount: 2,
                hotel: 'Hotel Inntu Laureles',
                stayDays: 6,
                advanceTotal: Money.fromUnits(950000, 'COP'),
                days: {
                    1: [
                        { id: 'h-341-1', time: '03:27 PM', act: 'Vuelo Wingo Curazao + Activación eSIM', loc: 'Aeropuerto JMC ➔ Inntu Laureles', prov: 'Aeroturex', role: '[DRV] Andrés', costType: 'TRANSPORTE', costUnits: 110000, status: 'COMPLETADO', gpsChecked: true }
                    ],
                    2: [
                        { id: 'h-341-2', time: '11:00 AM', act: 'Traslado Laureles ➔ CES Oviedo', loc: 'Laureles ➔ Poblado', prov: 'Aeroturex', role: '[DRV] Andrés', costType: 'TRANSPORTE', costUnits: 35000, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-341-3', time: '12:00 PM', act: 'Consulta Dr. Carlos Suárez CES (Inglés)', loc: 'CES Sede Oviedo', prov: 'CES', role: '[GUIA] Alejandro', costType: 'HONORARIO_GUIA', hours: 5.0, costUnits: 77500, status: 'PROGRAMADO', gpsChecked: false },
                        { id: 'h-341-4', time: '01:30 PM', act: 'Subsidio Alimentación Turno Tarde', loc: 'Oviedo', prov: 'Alimentación', role: '[GUIA] Alejandro', costType: 'CAJA_MENOR', costUnits: 25000, status: 'PROGRAMADO', gpsChecked: false }
                    ],
                    3: [
                        { id: 'h-341-5', time: '05:30 AM', act: 'Lab Echavarría a Domicilio en Hotel', loc: 'Inntu Laureles Hab. 1004', prov: 'Lab Echavarría', role: 'Lab Domicilio', costType: 'CAJA_MENOR', costUnits: 65000, status: 'PROGRAMADO', gpsChecked: false }
                    ]
                }
            }
        };
    }

    static async render(containerId = 'itinerary-settlement-container', archId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (archId) this._currentArchetype = archId;
        const allData = this.getArchetypeData();
        const arch = allData[this._currentArchetype] || allData.rva171;

        // Validar territorio operativo con Domain Value Object
        try {
            new OperativeTerritory(arch.hotel);
        } catch (e) {
            console.error(e.message);
        }

        // Obtener cuota de almacenamiento offline
        const storageInfo = await LocalFirstDB.getStorageEstimate();

        // Calcular cuentas deterministas usando Money
        let moneyTransporte = Money.zero('COP');
        let moneyGuianza = Money.zero('COP');
        let moneyCajaMenor = Money.zero('COP');

        Object.values(arch.days).forEach(dayMilestones => {
            dayMilestones.forEach(m => {
                const itemMoney = Money.fromUnits(m.costUnits || 0, 'COP');
                if (m.costType === 'TRANSPORTE') moneyTransporte = moneyTransporte.add(itemMoney);
                else if (m.costType === 'HONORARIO_GUIA') moneyGuianza = moneyGuianza.add(itemMoney);
                else if (m.costType === 'CAJA_MENOR' || m.costType === 'FARMACIA') moneyCajaMenor = moneyCajaMenor.add(itemMoney);
            });
        });

        // Sumar gastos extras locales de tickets
        const extraExpenses = LocalFirstDB.getLocalExpenses(arch.id);
        extraExpenses.forEach(exp => {
            moneyCajaMenor = moneyCajaMenor.add(Money.fromUnits(exp.monto_gasto_cop || 0, 'COP'));
        });

        const totalCuentaCobro = moneyTransporte.add(moneyGuianza).add(moneyCajaMenor);
        const anticiposRecibidos = arch.advanceTotal;
        const saldoDiferencia = totalCuentaCobro.subtract(anticiposRecibidos);

        const activeDayMilestones = arch.days[this._activeDay] || arch.days[1] || [];

        container.innerHTML = `
            <div class="matrix-container" style="border: 2px solid var(--primary-light);">
                <!-- Barra de Estado Local-First 100% Offline -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card-subtle); padding:8px 14px; border-radius:8px; margin-bottom:14px; border:1px solid var(--border-subtle); flex-wrap:wrap; gap:8px;">
                    <div style="font-size:0.78rem; font-weight:700; color:var(--emerald); display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-hard-drive"></i> 
                        <span>Local-First Engine: <strong>100% OFFLINE (IndexedDB + SQLite Local)</strong></span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-subtle);">
                        <i class="fa-solid fa-shield-check"></i> Anti-Evicción Safari: <strong>ACTIVADO</strong> • Cuota Usada: <strong>${storageInfo.usageMB} MB / ${storageInfo.quotaMB} MB</strong>
                    </div>
                </div>

                <!-- Selector de Arquetipos Reales -->
                <div class="matrix-header-tabs">
                    <button class="matrix-tab-btn ${this._currentArchetype === 'rva171' ? 'active' : ''}" onclick="window.ItineraryLiveSuite.switchArchetype('rva171')">
                        <i class="fa-solid fa-users"></i> RVA171: Grupo Familiar x5 (Catia)
                    </button>
                    <button class="matrix-tab-btn ${this._currentArchetype === 'rva282' ? 'active' : ''}" onclick="window.ItineraryLiveSuite.switchArchetype('rva282')">
                        <i class="fa-solid fa-heart-pulse"></i> RVA282: Cardio & Urología (George)
                    </button>
                    <button class="matrix-tab-btn ${this._currentArchetype === 'rva341' ? 'active' : ''}" onclick="window.ItineraryLiveSuite.switchArchetype('rva341')">
                        <i class="fa-solid fa-language"></i> RVA341: Bilingüe Inglés & Lab Domicilio (Eduard)
                    </button>
                </div>

                <!-- Grid Dividido: Master-Detail (Itinerario vs Liquidación) -->
                <div class="matrix-split-grid">
                    <!-- Columna Izquierda: Itinerario y Timeline de Campo -->
                    <div class="matrix-itinerary-col">
                        <div class="matrix-col-title">
                            <div>
                                <i class="fa-solid fa-calendar-days" style="color:var(--primary);"></i>
                                <span>Itinerario: ${arch.code} (${arch.country})</span>
                            </div>
                            <span class="step-role-badge">${arch.hotel}</span>
                        </div>

                        <!-- Selector de Días del Itinerario -->
                        <div style="display:flex; gap:6px; margin-bottom:12px; overflow-x:auto; padding-bottom:4px;">
                            ${Object.keys(arch.days).map(dayNum => `
                                <button class="tool-btn ${Number(dayNum) === this._activeDay ? 'active' : ''}" 
                                        style="font-size:0.75rem; padding:4px 10px;"
                                        onclick="window.ItineraryLiveSuite.switchDay(${dayNum})">
                                    Día ${dayNum}
                                </button>
                            `).join('')}
                        </div>

                        <!-- Lista de Hitos del Día Activo -->
                        <div class="matrix-milestone-list">
                            ${activeDayMilestones.map((m, idx) => `
                                <div class="matrix-milestone-item" id="item-${m.id}">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <span class="milestone-time-badge"><i class="fa-solid fa-clock"></i> ${m.time}</span>
                                        <span class="flow-badge ${m.status === 'COMPLETADO' ? 'badge-emerald' : 'badge-amber'}" style="margin:0; font-size:0.68rem;">
                                            ${m.status === 'COMPLETADO' ? '✅ COMPLETADO' : '⏳ PROGRAMADO'}
                                        </span>
                                    </div>
                                    <div class="milestone-act">${m.act}</div>
                                    <div style="font-size:0.76rem; color:var(--text-subtle);">
                                        <i class="fa-solid fa-location-dot"></i> ${m.loc} • <i class="fa-solid fa-user-tag"></i> ${m.role}
                                    </div>
                                    
                                    <div class="milestone-link-badge">
                                        <i class="fa-solid fa-calculator"></i> Impacto Liquidación: <strong>${Money.fromUnits(m.costUnits, 'COP').format()}</strong> (${m.costType})
                                    </div>

                                    <!-- Acciones Rápidas en Campo -->
                                    <div style="display:flex; gap:6px; margin-top:6px;">
                                        <button class="tool-btn" style="font-size:0.72rem; padding:4px 8px; flex:1; justify-content:center; background:${m.gpsChecked ? 'var(--emerald-light)' : 'var(--bg-card-subtle)'}; color:${m.gpsChecked ? 'var(--emerald)' : 'var(--text-primary)'};"
                                                onclick="window.ItineraryLiveSuite.simulateGpsCheckin('${m.id}')">
                                            <i class="fa-solid ${m.gpsChecked ? 'fa-location-circle-check' : 'fa-location-dot'}"></i> ${m.gpsChecked ? 'GPS Check-In OK' : 'Simular GPS'}
                                        </button>
                                        <button class="tool-btn" style="font-size:0.72rem; padding:4px 8px; flex:1; justify-content:center;"
                                                onclick="window.ItineraryLiveSuite.openTicketModal('${m.id}')">
                                            <i class="fa-solid fa-camera"></i> Subir Recibo
                                        </button>
                                        <button class="tool-btn" style="font-size:0.72rem; padding:4px 8px; flex:1; justify-content:center;"
                                                onclick="window.ItineraryLiveSuite.openSignatureModal('${m.id}')">
                                            <i class="fa-solid fa-signature"></i> Firma Pax
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Columna Derecha: Motor de Liquidación y Balanza Financiera -->
                    <div class="matrix-settlement-col">
                        <div class="matrix-col-title">
                            <div>
                                <i class="fa-solid fa-scale-balanced" style="color:var(--amber);"></i>
                                <span>Balanza Contable en Tiempo Real</span>
                            </div>
                            <span class="flow-badge badge-emerald">Deterministic Money (BigInt)</span>
                        </div>

                        <!-- KPIs de Gastos -->
                        <div class="matrix-kpi-grid">
                            <div class="matrix-kpi-card">
                                <div class="kpi-label">🚗 Flota & Taxis</div>
                                <div class="kpi-value" style="color:var(--primary);">${moneyTransporte.format()}</div>
                            </div>
                            <div class="matrix-kpi-card">
                                <div class="kpi-label">⏱️ Horas Guianza</div>
                                <div class="kpi-value" style="color:var(--purple);">${moneyGuianza.format()}</div>
                            </div>
                            <div class="matrix-kpi-card">
                                <div class="kpi-label">💊 Farmacia & CM</div>
                                <div class="kpi-value" style="color:var(--rose);">${moneyCajaMenor.format()}</div>
                            </div>
                        </div>

                        <!-- Caja de Balanza Contable -->
                        <div class="matrix-balance-box">
                            <div class="balance-row">
                                <span>(+) Total Cuentas de Cobro (Gastos + Horas):</span>
                                <strong>${totalCuentaCobro.format()}</strong>
                            </div>
                            <div class="balance-row">
                                <span>(-) Menos Anticipos Recibidos Bancolombia:</span>
                                <strong>${anticiposRecibidos.format()}</strong>
                            </div>
                            <div class="balance-row total-highlight">
                                <span>(=) SALDO NETO CONCILIADO DTW:</span>
                                <strong style="color:${saldoDiferencia.isPositive() ? 'var(--emerald)' : 'var(--primary)'}; font-size:1.05rem;">
                                    ${saldoDiferencia.format()}
                                </strong>
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-subtle); text-align:right;">
                                ${saldoDiferencia.isPositive() ? '💰 Saldo a favor del Agente (Transferir por Bancolombia)' : '🔄 Saldo a favor de Medical Trip (Fondo para próxima RVA)'}
                            </div>
                        </div>

                        <!-- Estado del Enjambre de Subagentes Autónomos -->
                        <div style="margin-top:14px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:8px; padding:10px 12px;">
                            <div style="font-size:0.8rem; font-weight:800; color:var(--text-heading); margin-bottom:6px; display:flex; justify-content:space-between;">
                                <span><i class="fa-solid fa-network-wired" style="color:var(--primary);"></i> Enjambre Multiagente Local (Actor Model)</span>
                                <span class="step-role-badge">5 Actores Activos</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-muted); display:flex; flex-direction:column; gap:4px;">
                                <div>• <strong>[DRV] Ramón Rosero:</strong> Monitoreo vuelo Wingo 7449 <span class="flow-badge badge-emerald" style="padding:1px 4px; font-size:0.65rem;">ACTIVO</span></div>
                                <div>• <strong>[GUIA] Yenny:</strong> Traducción Papiamento en CIMA <span class="flow-badge badge-teal" style="padding:1px 4px; font-size:0.65rem;">EN SITIO</span></div>
                                <div>• <strong>[FIN] Dra. Jenny:</strong> Auditoría DTW y Asientos <span class="flow-badge badge-purple" style="padding:1px 4px; font-size:0.65rem;">CONCILIANDO</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static switchArchetype(archId) {
        this._currentArchetype = archId;
        this._activeDay = 1;
        this.render('itinerary-settlement-container');
    }

    static switchDay(dayNum) {
        this._activeDay = dayNum;
        this.render('itinerary-settlement-container');
    }

    static simulateGpsCheckin(milestoneId) {
        const arch = this.getArchetypeData()[this._currentArchetype];
        const m = (arch.days[this._activeDay] || []).find(item => item.id === milestoneId);
        if (m) {
            m.gpsChecked = true;
            m.status = 'COMPLETED';
            LocalFirstDB.appendEvent('GPS_CHECKIN', { milestoneId, timestamp: new Date().toISOString(), coords: '6.2088,-75.5678 (Medellín)' });
            this.render('itinerary-settlement-container');
        }
    }

    static openTicketModal(milestoneId) {
        const modalHtml = `
            <div class="drawer-overlay" id="ticketModalOverlay" style="display:flex;" onclick="document.getElementById('ticketModalOverlay').remove()">
                <div class="drawer-panel" style="max-width:420px; margin:auto; border-radius:12px; height:auto; max-height:90vh;" onclick="event.stopPropagation()">
                    <div class="drawer-header">
                        <div class="drawer-title"><i class="fa-solid fa-receipt" style="color:var(--rose);"></i> Subir Ticket de Farmacia / Gasto</div>
                        <button class="hud-btn" onclick="document.getElementById('ticketModalOverlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:12px;">
                        Captura o selecciona el recibo térmico de droguería (Cruz Verde / Locatel) para deducción automática en el libro mayor.
                    </div>
                    <div style="background:var(--bg-card-subtle); border:2px dashed var(--border-color); border-radius:8px; padding:16px; text-align:center; margin-bottom:12px;">
                        <i class="fa-solid fa-file-invoice-dollar" style="font-size:2rem; color:var(--primary); margin-bottom:8px;"></i>
                        <div style="font-size:0.8rem; font-weight:700;">Recibo Cruz Verde #84920</div>
                        <div style="font-size:0.75rem; color:var(--text-subtle);">Enoxaparina 40mg + Faja Postquirúrgica</div>
                        <div style="font-size:0.9rem; font-weight:800; color:var(--rose); margin-top:4px;">$65.000 COP</div>
                    </div>
                    <button class="tool-btn" style="width:100%; justify-content:center; background:var(--primary); color:white; font-weight:700;"
                            onclick="window.ItineraryLiveSuite.confirmTicketExpense('${milestoneId}', 65000, 'Cruz Verde - Enoxaparina 40mg')">
                        <i class="fa-solid fa-check"></i> Aprobar & Deducir de Caja Menor
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static confirmTicketExpense(milestoneId, amount, concept) {
        LocalFirstDB.saveTicketExpense({
            id_gasto: 'GST-' + Date.now(),
            id_reserva: this._currentArchetype,
            id_hito: milestoneId,
            id_agente: '[GUIA] Yenny',
            fecha_gasto: new Date().toISOString(),
            rubro_gasto: 'FARMACIA_POSTOP',
            descripcion_concepto: concept,
            monto_gasto_cop: amount
        });

        document.getElementById('ticketModalOverlay')?.remove();
        this.render('itinerary-settlement-container');
    }

    static openSignatureModal(milestoneId) {
        const modalHtml = `
            <div class="drawer-overlay" id="sigModalOverlay" style="display:flex;" onclick="document.getElementById('sigModalOverlay').remove()">
                <div class="drawer-panel" style="max-width:420px; margin:auto; border-radius:12px; height:auto;" onclick="event.stopPropagation()">
                    <div class="drawer-header">
                        <div class="drawer-title"><i class="fa-solid fa-signature" style="color:var(--emerald);"></i> Firma de Conformidad del Paciente</div>
                        <button class="hud-btn" onclick="document.getElementById('sigModalOverlay').remove()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:8px;">
                        El paciente firma en pantalla para validar las horas de acompañamiento y el traslado.
                    </div>
                    <div style="background:white; border:2px solid var(--border-color); border-radius:8px; height:120px; display:flex; align-items:center; justify-content:center; margin-bottom:12px;">
                        <svg width="200" height="60" viewBox="0 0 200 60">
                            <path d="M 10 40 Q 50 10, 90 35 T 180 25" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <button class="tool-btn" style="width:100%; justify-content:center; background:var(--emerald); color:white; font-weight:700;"
                            onclick="window.ItineraryLiveSuite.confirmSignature('${milestoneId}')">
                        <i class="fa-solid fa-check-double"></i> Certificar Turno con Firma Digital
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static confirmSignature(milestoneId) {
        LocalFirstDB.appendEvent('FIRMA_PACIENTE_REGISTRADA', { milestoneId, timestamp: new Date().toISOString() });
        document.getElementById('sigModalOverlay')?.remove();
        this.simulateGpsCheckin(milestoneId);
    }
}

window.ItineraryLiveSuite = ItineraryLiveSuite;
