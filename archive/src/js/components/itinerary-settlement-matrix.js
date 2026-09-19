/**
 * Medical Trip Hub — Matriz Interactiva: Itinerario en Campo ➔ Liquidación Financiera
 * Conecta cada hito del cronograma hora a hora con su impacto en Caja Menor, Honorarios y Bancolombia.
 */

export class ItinerarySettlementMatrix {
    static getArchetypes() {
        return [
            {
                id: "rva171",
                title: "RVA171: Grupo Familiar Curazao (5 Pax)",
                paxName: "Catia Rodrigues (5 Pax)",
                stayDays: 5,
                vehicle: "Uber XL / Van Especial (Andrés)",
                hotel: "Hotel Inntu Laureles",
                guide: "[GUIA] Yenny",
                driver: "[DRV] Andrés",
                milestones: [
                    { time: "Día 1 - 10:00 AM", activity: "Aterrizaje Vuelo Z Fly en JMC", costConcept: "Traslado Van Aeropuerto ➔ Hotel", costCop: 160000, type: "TRANSPORTE", payee: "[DRV] Andrés" },
                    { time: "Día 1 - 02:00 PM", activity: "Traslado Inntu ➔ Clínica Clofán", costConcept: "Carrera Urbana Uber XL", costCop: 38000, type: "TRANSPORTE", payee: "[DRV] Andrés" },
                    { time: "Día 1 - 03:00 PM", activity: "Exámenes Oftalmología Dr. Peláez (María)", costConcept: "Guianza Bilingüe (3.5 hrs)", costCop: 54250, type: "HONORARIO_GUIA", payee: "[GUIA] Yenny" },
                    { time: "Día 1 - 04:30 PM", activity: "Parqueadero Ciudad del Río", costConcept: "Ticket Parqueadero Clínico", costCop: 12000, type: "CAJA_MENOR", payee: "Caja Menor" },
                    { time: "Día 2 - 05:45 AM", activity: "Traslado en ayunas a CIMA (Tatiana/Mariana)", costConcept: "Carrera Madrugada", costCop: 35000, type: "TRANSPORTE", payee: "[DRV] Andrés" },
                    { time: "Día 2 - 06:30 AM", activity: "Acompañamiento Ecografías CIMA (8 hrs)", costConcept: "Guianza (8 hrs) + Alim. ($35k)", costCop: 159000, type: "HONORARIO_GUIA", payee: "[GUIA] Yenny" },
                    { time: "Día 2 - 02:00 PM", activity: "Compra Fórmulas y Gotas Farmacia", costConcept: "Medicamentos Cruz Verde", costCop: 85000, type: "CAJA_MENOR", payee: "Caja Menor" },
                    { time: "Día 5 - 03:00 PM", activity: "Traslado Retorno Hotel ➔ JMC", costConcept: "Traslado Van Hotel ➔ JMC", costCop: 160000, type: "TRANSPORTE", payee: "[DRV] Andrés" }
                ],
                initialAdvance: 1000000,
                accumulatedPreviousAdvances: 1098100
            },
            {
                id: "rva282",
                title: "RVA282: Chequeo Cardiovascular & Urología (2 Pax)",
                paxName: "George Hernandez (2 Pax)",
                stayDays: 4,
                vehicle: "Sedán Ejecutivo Aeroturex (Ramón)",
                hotel: "Airbnb Ed. Park 42 Poblado",
                guide: "[GUIA] Yenny",
                driver: "[DRV] Ramón Rosero / Andrés",
                milestones: [
                    { time: "Día 1 - 03:27 PM", activity: "Llegada Wingo + Entrega SIM Claro", costConcept: "Traslado JMC ➔ Park 42 + SIM", costCop: 145000, type: "TRANSPORTE", payee: "[DRV] Ramón" },
                    { time: "Día 2 - 07:00 AM", activity: "Alistamiento Muestra Orina en Hotel", costConcept: "Alistamiento Carpeta Médica (1h)", costCop: 15500, type: "HONORARIO_GUIA", payee: "[GUIA] Yenny" },
                    { time: "Día 2 - 08:30 AM", activity: "Traslado Park 42 ➔ Torre Oviedo", costConcept: "Carrera Poblado ➔ Poblado", costCop: 30000, type: "TRANSPORTE", payee: "[DRV] Andrés" },
                    { time: "Día 2 - 09:00 AM", activity: "Entrega Muestras Lab Echavarría", costConcept: "Guianza Consulta Externa (4 hrs)", costCop: 62000, type: "HONORARIO_GUIA", payee: "[GUIA] Yenny" },
                    { time: "Día 2 - 10:00 AM", activity: "Consulta Enf. Jefe Bibiana (CES)", costConcept: "Subsidio Alimentación (4h)", costCop: 25000, type: "CAJA_MENOR", payee: "[GUIA] Yenny" },
                    { time: "Día 2 - 11:30 AM", activity: "Parqueadero Torre Oviedo", costConcept: "Ticket Parqueadero", costCop: 14000, type: "CAJA_MENOR", payee: "Caja Menor" },
                    { time: "Día 4 - 02:00 PM", activity: "Control Final & Certificado Fit-to-Fly", costConcept: "Consulta Cierre Dr. Yepes", costCop: 0, type: "INCLUIDO_PAQUETE", payee: "[MED] Dr. Yepes" },
                    { time: "Día 4 - 04:00 PM", activity: "Traslado Park 42 ➔ JMC Aeropuerto", costConcept: "Traslado Salida Sedán Aeroturex", costCop: 110000, type: "TRANSPORTE", payee: "[DRV] Ramón" }
                ],
                initialAdvance: 800000,
                accumulatedPreviousAdvances: 0
            },
            {
                id: "rva341",
                title: "RVA341: Eduard Hogenboom (Inglés / CES Oviedo)",
                paxName: "Eduard Hogenboom (2 Pax)",
                stayDays: 6,
                vehicle: "Sedán Ejecutivo (Alejandro / Andrés)",
                hotel: "Hotel Inntu Laureles",
                guide: "[GUIA] Alejandro",
                driver: "[DRV] Andrés",
                milestones: [
                    { time: "Día 1 - 03:27 PM", activity: "Vuelo Wingo Curazao + eSIM", costConcept: "Traslado JMC ➔ Inntu Laureles", costCop: 110000, type: "TRANSPORTE", payee: "[DRV] Andrés" },
                    { time: "Día 2 - 11:00 AM", activity: "Traslado Laureles ➔ CES Oviedo", costConcept: "Carrera Laureles ➔ Poblado", costCop: 35000, type: "TRANSPORTE", payee: "[DRV] Andrés" },
                    { time: "Día 2 - 12:00 PM", activity: "Consulta Dr. Carlos Suárez CES", costConcept: "Guianza Bilingüe Inglés (5 hrs)", costCop: 77500, type: "HONORARIO_GUIA", payee: "[GUIA] Alejandro" },
                    { time: "Día 2 - 01:30 PM", activity: "Alimentación Turno Tarde", costConcept: "Subsidio Alimentación (5h)", costCop: 25000, type: "CAJA_MENOR", payee: "[GUIA] Alejandro" },
                    { time: "Día 3 - 05:30 AM", activity: "Lab Echavarría a Domicilio en Hotel", costConcept: "Toma de Sangre a Domicilio", costCop: 65000, type: "CAJA_MENOR", payee: "Lab Echavarría" },
                    { time: "Día 3 - 08:00 AM", activity: "Consulta Anestesiología CES Prado", costConcept: "Guianza + Traslado Prado", costCop: 95000, type: "HONORARIO_GUIA", payee: "[GUIA] Alejandro" },
                    { time: "Día 6 - 02:00 PM", activity: "Traslado Inntu Laureles ➔ JMC", costConcept: "Traslado Retorno Aeroturex", costCop: 110000, type: "TRANSPORTE", payee: "[DRV] Andrés" }
                ],
                initialAdvance: 950000,
                accumulatedPreviousAdvances: 0
            }
        ];
    }

    static renderInteractiveMatrix(containerId, archetypeId = "rva171") {
        const container = document.getElementById(containerId);
        if (!container) return;

        const archetypes = this.getArchetypes();
        const current = archetypes.find(a => a.id === archetypeId) || archetypes[0];

        // Totales de Liquidación del Itinerario
        let totalTransporte = 0;
        let totalHonorariosGuia = 0;
        let totalCajaMenor = 0;

        current.milestones.forEach(m => {
            if (m.type === "TRANSPORTE") totalTransporte += m.costCop;
            else if (m.type === "HONORARIO_GUIA") totalHonorariosGuia += m.costCop;
            else if (m.type === "CAJA_MENOR") totalCajaMenor += m.costCop;
        });

        const totalCuentaCobro = totalTransporte + totalHonorariosGuia + totalCajaMenor;
        const totalAnticipos = current.initialAdvance + current.accumulatedPreviousAdvances;
        const saldoDiferencia = totalCuentaCobro - totalAnticipos;

        container.innerHTML = `
            <div class="matrix-container">
                <!-- Selector de Arquetipo -->
                <div class="matrix-header-tabs">
                    ${archetypes.map(a => `
                        <button class="matrix-tab-btn ${a.id === current.id ? 'active' : ''}" 
                                onclick="MedicalTripApp.selectItineraryArchetype('${a.id}')">
                            <i class="fa-solid fa-route"></i> ${a.title}
                        </button>
                    `).join('')}
                </div>

                <!-- Grid Dividido: Itinerario (Izquierda) vs Liquidación Financiera (Derecha) -->
                <div class="matrix-split-grid">
                    <!-- Columna Izquierda: Itinerario Hora a Hora -->
                    <div class="matrix-itinerary-col">
                        <div class="matrix-col-title">
                            <i class="fa-solid fa-calendar-check" style="color:var(--primary);"></i>
                            <span>Itinerario en Calle: ${current.paxName}</span>
                            <span class="step-role-badge">${current.hotel}</span>
                        </div>
                        <div class="matrix-milestone-list">
                            ${current.milestones.map((m, idx) => `
                                <div class="matrix-milestone-item">
                                    <div class="milestone-time-badge">${m.time}</div>
                                    <div class="milestone-content">
                                        <div class="milestone-act">${m.activity}</div>
                                        <div class="milestone-link-badge">
                                            <i class="fa-solid fa-arrow-right-arrow-left"></i> 
                                            <strong>Genera:</strong> ${m.costConcept} ➔ <code>$${m.costCop.toLocaleString('es-CO')} COP</code> (${m.payee})
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Columna Derecha: Balanza Contable y Cruce DTW -->
                    <div class="matrix-settlement-col">
                        <div class="matrix-col-title">
                            <i class="fa-solid fa-calculator" style="color:var(--amber);"></i>
                            <span>Liquidación Financiera en Tiempo Real</span>
                            <span class="flow-badge badge-amber">Cruce DTW</span>
                        </div>

                        <!-- Tarjetas de Resumen de Gastos -->
                        <div class="matrix-kpi-grid">
                            <div class="matrix-kpi-card">
                                <div class="kpi-label">🚗 Flota & Taxis</div>
                                <div class="kpi-value" style="color:var(--primary);">$${totalTransporte.toLocaleString('es-CO')}</div>
                            </div>
                            <div class="matrix-kpi-card">
                                <div class="kpi-label">⏱️ Honorarios Guía</div>
                                <div class="kpi-value" style="color:var(--purple);">$${totalHonorariosGuia.toLocaleString('es-CO')}</div>
                            </div>
                            <div class="matrix-kpi-card">
                                <div class="kpi-label">💊 Farmacia & Caja Menor</div>
                                <div class="kpi-value" style="color:var(--rose);">$${totalCajaMenor.toLocaleString('es-CO')}</div>
                            </div>
                        </div>

                        <!-- Balanza Contable -->
                        <div class="matrix-balance-box">
                            <div class="balance-row">
                                <span>(+) Total Cuenta de Cobro (Gastos + Honorarios):</span>
                                <strong>$${totalCuentaCobro.toLocaleString('es-CO')} COP</strong>
                            </div>
                            <div class="balance-row">
                                <span>(-) Menos Anticipos Recibidos en Bancolombia:</span>
                                <strong>$${totalAnticipos.toLocaleString('es-CO')} COP</strong>
                            </div>
                            <div class="balance-row total-highlight">
                                <span>(=) SALDO NETO CONCILIADO POR DTW:</span>
                                <strong style="color:${saldoDiferencia >= 0 ? 'var(--emerald)' : 'var(--primary)'};">
                                    ${saldoDiferencia >= 0 ? '+' : ''}$${saldoDiferencia.toLocaleString('es-CO')} COP
                                    <span style="font-size:0.75rem; display:block; font-weight:normal;">
                                        ${saldoDiferencia >= 0 ? '(A transferir por Medical Trip al Agente)' : '(Saldo a favor de Medical Trip para siguiente RVA)'}
                                    </span>
                                </strong>
                            </div>
                        </div>

                        <div style="margin-top:12px; font-size:0.78rem; background:var(--emerald-light); color:var(--emerald); padding:10px 12px; border-radius:8px; line-height:1.4;">
                            <strong><i class="fa-solid fa-link"></i> Coherencia de Negocio Garantizada:</strong>
                            Cada clic en el itinerario genera un asiento contable validado por DTW con geolocalización GPS, eliminando las discrepancias de hasta 14 días en las sábanas de Excel.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
