/**
 * Medical Trip Hub — Main Application Entry Point & Module Initializer
 * Desacoplado bajo principios de Arquitectura Limpia y el Libro Blanco de Testing E2E
 */

import { MermaidManager } from './core/mermaid-manager.js';
import { GestureEngine } from './core/gesture-engine.js';
import { NavigationController } from './components/navigation.js';
import { StepTimelineController } from './components/step-timeline.js';
import { DrawerController } from './components/drawers.js';
import { RoiCalculator } from './components/roi-calculator.js';
import { PresentationTools } from './components/presentation-tools.js';
import { RobotTester } from './testing/robot-tester.js';
import { DiagnosticsRunner } from './testing/diagnostics-runner.js';
import { GapSolutionsEngine } from './components/gap-solutions-engine.js';
import { ItinerarySettlementMatrix } from './components/itinerary-settlement-matrix.js';
import { ItineraryLiveSuite } from './components/itinerary-live-suite.js';
import { LocalFirstDB } from './storage/local-first-db.js';

// Exponer funciones globales para compatibilidad y triggers de consola / HUD
window.MedicalTripApp = {
    zoom: (canvasId, factor) => GestureEngine.zoom(canvasId, factor),
    resetZoom: (canvasId) => GestureEngine.resetZoom(canvasId),
    toggleFullscreen: (viewportId) => GestureEngine.toggleFullscreen(viewportId),
    exitFullscreen: (viewportId) => GestureEngine.exitFullscreen(viewportId),
    navigateFlow: (flowId, el) => NavigationController.navigateFlow(flowId, el),
    stepNext: (containerId) => StepTimelineController.stepNext(containerId),
    stepPrev: (containerId) => StepTimelineController.stepPrev(containerId),
    filterRole: (roleCode, el) => StepTimelineController.filterByRole(roleCode, el),
    openDrawer: (drawerId) => DrawerController.openDrawer(drawerId),
    closeDrawer: (drawerId) => DrawerController.closeDrawer(drawerId),
    runRobotTester: () => RobotTester.run(),
    runDiagnostics: () => DiagnosticsRunner.run(),
    runGapSimulation: (gapNum) => window.runGapSimulation(gapNum),
    selectItineraryArchetype: (archetypeId) => ItineraryLiveSuite.switchArchetype(archetypeId)
};

window.ItineraryLiveSuite = ItineraryLiveSuite;
window.LocalFirstDB = LocalFirstDB;
window.ItinerarySettlementMatrix = ItinerarySettlementMatrix;
window.GapSolutionsEngine = GapSolutionsEngine;

// Aliases para inline onclick en templates si aplica
window.zoomDiagram = (canvasId, factor) => GestureEngine.zoom(canvasId, factor);
window.resetZoom = (canvasId) => GestureEngine.resetZoom(canvasId);
window.toggleFullscreen = (viewportId) => GestureEngine.toggleFullscreen(viewportId);
window.exitFullscreenMode = (viewportId) => GestureEngine.exitFullscreen(viewportId);
window.navigateFlow = (flowId, el) => NavigationController.navigateFlow(flowId, el);
window.stepSimNext = (containerId) => StepTimelineController.stepNext(containerId);
window.stepSimPrev = (containerId) => StepTimelineController.stepPrev(containerId);
window.filterByRole = (roleCode, el) => StepTimelineController.filterByRole(roleCode, el);
window.runRobotTester = () => RobotTester.run();
window.runFullDiagnostics = () => DiagnosticsRunner.run();
window.openGlossary = () => {
    DrawerController.renderGlossary();
    DrawerController.openDrawer('glossaryDrawerOverlay');
};
window.closeGlossary = () => DrawerController.closeDrawer('glossaryDrawerOverlay');
window.openExecutiveSummary = () => DrawerController.openDrawer('execDrawerOverlay');
window.closeExecutiveSummary = () => DrawerController.closeDrawer('execDrawerOverlay');
window.openDatabaseInspector = () => DrawerController.openDrawer('dbDrawerOverlay');
window.closeDatabaseInspector = () => DrawerController.closeDrawer('dbDrawerOverlay');
window.openAccessibilityDrawer = () => DrawerController.openDrawer('a11yDrawerOverlay');
window.closeAccessibilityDrawer = () => DrawerController.closeDrawer('a11yDrawerOverlay');
window.closeDiagnostics = () => DrawerController.closeDrawer('diagDrawerOverlay');
window.toggleTheme = () => DrawerController.toggleTheme();
window.toggleLaserPointer = () => {
    const laserBtn = document.getElementById('btnLaser');
    laserBtn?.click();
};
window.toggleAutoPlaySlides = () => {
    const btn = document.getElementById('btnAutoPlay');
    btn?.click();
};
window.handleLiveSearch = (val) => NavigationController.handleLiveSearch(val);
window.updateRoiCalculation = (val) => RoiCalculator.updateCalculation(val);
window.downloadMeetingNotes = () => RoiCalculator.downloadMeetingNotes();
window.setFontSize = (sz, el) => DrawerController.setFontSize(sz, el);
window.setHighContrast = (hc, el) => DrawerController.setHighContrast(hc, el);
window.setDyslexiaFont = (df, el) => DrawerController.setDyslexiaFont(df, el);
window.selectStepEntry = (el) => StepTimelineController.selectStepEntry(el);

window.runGapSimulation = (gapNum) => {
    const resultBoxId = `gapResult-${gapNum}`;
    const resultBox = document.getElementById(resultBoxId);
    if (!resultBox) return;

    let resultHtml = "";
    switch (gapNum) {
        case 1: {
            const res = GapSolutionsEngine.validatePassport("NUBD94KH5", "2027-04-15", "2026-08-05");
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--emerald);"><i class="fa-solid fa-circle-check"></i> ${res.status}</div>
                    <div style="font-size:0.78rem;"><strong>Pasaporte:</strong> ${res.passportNumber} | <strong>Vigencia:</strong> ${res.validityDays} Días (> 180d)</div>
                    <div style="font-size:0.78rem;"><strong>Radicado Check-Mig:</strong> <code>${res.radicadoCheckMig}</code></div>
                    <div style="font-size:0.74rem; color:var(--text-muted); margin-top:3px;">${res.message}</div>
                </div>
            `;
            break;
        }
        case 2: {
            const res = GapSolutionsEngine.runDtwReconciliation("2026-08-05 14:30", "2026-08-12", "[DRV] Ramón Rosero", 110000);
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--primary);"><i class="fa-solid fa-calculator"></i> DTW Alignment: ${res.matchConfidence}</div>
                    <div style="font-size:0.78rem;"><strong>Conductor:</strong> ${res.driverName} | <strong>Tarifa:</strong> ${res.costCop}</div>
                    <div style="font-size:0.78rem;"><strong>Latencia Absorbida:</strong> ${res.latencyDays} días | <strong>Estado:</strong> ${res.dtwStatus}</div>
                    <div style="font-size:0.74rem; color:var(--text-muted); margin-top:3px;">${res.message}</div>
                </div>
            `;
            break;
        }
        case 3: {
            const res = GapSolutionsEngine.translateMedischDossier("Patient heeft Hersen MRI nodig en Bloedonderzoek");
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--purple);"><i class="fa-solid fa-language"></i> Homologación CUPS Realizada:</div>
                    ${res.matchedCups.map(m => `<div style="font-size:0.78rem;">• <strong>CUPS ${m.cups}:</strong> ${m.desc} ($${m.priceCop.toLocaleString('es-CO')} COP / Spread ${m.margin})</div>`).join('')}
                    <div style="font-size:0.78rem; font-weight:700; color:var(--text-heading); margin-top:3px;">Total Estimado: ${res.totalEstimatedCop} (${res.totalEstimatedUsd})</div>
                </div>
            `;
            break;
        }
        case 4: {
            const res = GapSolutionsEngine.maskPhiData("Paciente George Hernandez, pasaporte NUBD94KH5, tel +59995681193 requiere cirugia.");
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--rose);"><i class="fa-solid fa-lock"></i> Seudonimización Zero-Knowledge:</div>
                    <div style="font-size:0.76rem; color:var(--text-muted); text-decoration:line-through;">Original: ${res.rawText}</div>
                    <div style="font-size:0.78rem; color:var(--emerald); font-weight:700; margin-top:2px;">Protegido: <code>${res.maskedText}</code></div>
                    <div style="font-size:0.72rem; color:var(--text-subtle);">${res.complianceLevel}</div>
                </div>
            `;
            break;
        }
        case 5: {
            const res = GapSolutionsEngine.calculateTrmHedging(2850, 4000);
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--amber);"><i class="fa-solid fa-money-bill-trend-up"></i> Hedging Cambiario & Spread 30%:</div>
                    <div style="font-size:0.78rem;"><strong>Cotización:</strong> ${res.cotizacionUsd} @ ${res.trmAplicada} (${res.bloqueoGarantizado})</div>
                    <div style="font-size:0.78rem;"><strong>Ingreso:</strong> ${res.ingresoBrutoCop} | <strong>Hospital (70%):</strong> ${res.costoConvenioHospital}</div>
                    <div style="font-size:0.78rem; font-weight:700; color:var(--emerald);">Ganancia Neta Real (30% - SWIFT): ${res.gananciaNetaReal}</div>
                </div>
            `;
            break;
        }
        case 6: {
            const res = GapSolutionsEngine.generateFitToFly("[PAX] George Hernandez", "[MED] Dr. Marcos Yepes", "Chequeo Cardiovascular & Post-Op", "2026-08-09");
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--teal);"><i class="fa-solid fa-plane-circle-check"></i> ${res.estadoClinico}</div>
                    <div style="font-size:0.78rem;"><strong>Certificado:</strong> <code>${res.codigoCertificado}</code> | <strong>Médico:</strong> ${res.medicoTratante}</div>
                    <div style="font-size:0.78rem;"><strong>Vuelo:</strong> ${res.aerolineaValida} (${res.fechaVuelo})</div>
                    <div style="font-size:0.72rem; color:var(--primary);">${res.seguroAsistencia} • QR Verificable</div>
                </div>
            `;
            break;
        }
        case 7: {
            const res = GapSolutionsEngine.scaleCompanionCapacity(1, 3);
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--purple);"><i class="fa-solid fa-users-viewfinder"></i> Reescalado Automático (Grupo de 4 Pax):</div>
                    <div style="font-size:0.78rem;"><strong>Vehículo Asignado:</strong> ${res.vehiculoRecomendado}</div>
                    <div style="font-size:0.78rem;"><strong>Alojamiento:</strong> ${res.alojamientoRecomendado}</div>
                    <div style="font-size:0.78rem; font-weight:700; color:var(--text-heading);">Suplemento Calculado: ${res.suplementoAcompanantesUsd} (${res.suplementoAcompanantesCop})</div>
                </div>
            `;
            break;
        }
        case 8: {
            const res = GapSolutionsEngine.auditPharmacyPrescription();
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--amber);"><i class="fa-solid fa-prescription-bottle-medical"></i> Farmacovigilancia y Gasto Auditado:</div>
                    <div style="font-size:0.78rem;"><strong>Total Fórmulas Dispensadas:</strong> ${res.totalGastoFarmacia} (Conciliado con Depósito)</div>
                    <div style="font-size:0.74rem; color:var(--primary);"><strong>Alerta Enfermera:</strong> ${res.alertaHoraria}</div>
                </div>
            `;
            break;
        }
        case 9: {
            const res = GapSolutionsEngine.scheduleTelemedicineFollowUp("2026-08-09");
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--teal);"><i class="fa-solid fa-video"></i> Cronograma de Telemedicina Post-Op:</div>
                    ${res.controlesProgramados.map(c => `<div style="font-size:0.78rem;">• <strong>${c.sesion}:</strong> ${c.fecha} (${c.canal})</div>`).join('')}
                    <div style="font-size:0.72rem; color:var(--emerald);">${res.notificacionesAutomaticas}</div>
                </div>
            `;
            break;
        }
        case 10: {
            const res = GapSolutionsEngine.trackBilingualGuianzaTime("07:30", "13:30", "Hospital Pablo Tobón Uribe");
            resultHtml = `
                <div class="gap-sim-box">
                    <div style="font-weight:700; color:var(--emerald);"><i class="fa-solid fa-clock"></i> Guianza Express Certificada por GPS:</div>
                    <div style="font-size:0.78rem;"><strong>Sede:</strong> ${res.clinica} | <strong>Horario:</strong> ${res.checkIn} a ${res.checkOut} (${res.horasEfectivas})</div>
                    <div style="font-size:0.78rem; font-weight:700; color:var(--text-heading);">Total Liquidado: ${res.totalLiquidadoGuia} • ${res.firmaDigitalPaciente}</div>
                </div>
            `;
            break;
        }
        default:
            resultHtml = `<div class="gap-sim-box">Solución operativa ejecutada.</div>`;
    }

    resultBox.innerHTML = resultHtml;
    resultBox.style.display = 'block';
};

// Inicialización de la suite cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando Medical Trip Hub (Arquitectura Modular v2.0)...');

    // 1. Inicializar Mermaid y Render inicial
    MermaidManager.init('light');
    await MermaidManager.renderAll();

    // 2. Inicializar Gestos, Viewports y Canvas
    GestureEngine.init();

    // 3. Inicializar Navegación y Búsqueda
    NavigationController.init();

    // 4. Inicializar Simulador de Pasos y Filtros
    StepTimelineController.init();

    // 5. Inicializar Drawers y Accesibilidad
    DrawerController.init();

    // 6. Inicializar Calculadora ROI y Notas
    RoiCalculator.init();

    // 7. Inicializar Herramientas de Presentación
    PresentationTools.init();

    // 8. Inicializar Persistencia Local-First 100% Offline e Itinerarios Suite
    await LocalFirstDB.init();
    await ItineraryLiveSuite.render('itinerary-settlement-container');

    // 9. Vincular botones de Test y Diagnóstico de la barra superior
    document.getElementById('btnRobotTest')?.addEventListener('click', () => RobotTester.run());
    document.getElementById('btnAutoTest')?.addEventListener('click', () => DiagnosticsRunner.run());

    // 10. Auto-Test si está habilitado por query string
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autotest') === 'true' || window.location.hash === '#autotest') {
        setTimeout(() => RobotTester.run(), 600);
    }

    console.log('✅ Medical Trip Hub listo y 100% operativo con 108 botones interactivos.');
});
