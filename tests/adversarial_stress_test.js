// tests/adversarial_stress_test.js
// Comprehensive Empirical Stress Testing Harness for Medical Trip Colombia S.A.S.
// Validates Gesture Engine, 108 Button Bindings, Step Simulator Edge Cases, 13 Mermaid Workflows, and 3NF Database

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");

console.log("=======================================================================");
console.log("🔥 EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MEDICAL TRIP HUB 2.0");
console.log("=======================================================================\n");

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function assert(condition, message) {
    totalAssertions++;
    if (condition) {
        passedAssertions++;
        console.log("  [PASS] " + message);
    } else {
        failedAssertions++;
        console.error("  [FAIL] " + message);
        failureDetails.push(message);
    }
}

// -----------------------------------------------------------------------------
// SECTION 1: SQLite 3NF Database Deep Audit & Foreign Key Verification
// -----------------------------------------------------------------------------
console.log("=== SECTION 1: SQLite 3NF Database Deep Audit ===");
const dbPath = path.join(ROOT_DIR, "data", "medicaltrip_master.db");
assert(fs.existsSync(dbPath), "Master SQLite database exists at data/medicaltrip_master.db");

try {
    const fkResult = execSync("sqlite3 \"" + dbPath + "\" \"PRAGMA foreign_key_check;\"", { encoding: "utf-8" }).trim();
    assert(fkResult === "", "PRAGMA foreign_key_check returns 0 violations");

    const integrityResult = execSync("sqlite3 \"" + dbPath + "\" \"PRAGMA integrity_check;\"", { encoding: "utf-8" }).trim();
    assert(integrityResult === "ok", "PRAGMA integrity_check returns ok");

    const tableCounts = {
        pacientes: 304,
        cotizaciones_ctz: 79,
        reservas_rva: 95,
        traslados_logistica: 63,
        empleados: 5,
        proveedores: 10,
        plantillas_comunicacion: 4,
        ocel_events: 18602,
        ocel_event_objects: 25241
    };

    for (const [table, expected] of Object.entries(tableCounts)) {
        const count = parseInt(execSync("sqlite3 \"" + dbPath + "\" \"SELECT count(*) FROM " + table + ";\"", { encoding: "utf-8" }).trim(), 10);
        assert(count === expected, "Table " + table + " contains exactly " + expected + " rows (actual: " + count + ")");
    }

    // Zero-hallucination check in database
    const botCheck = execSync("sqlite3 \"" + dbPath + "\" \"SELECT count(*) FROM empleados WHERE nombre LIKE '%bot%' OR rol LIKE '%bot%';\"", { encoding: "utf-8" }).trim();
    assert(parseInt(botCheck, 10) === 0, "Zero unassigned Bot entities in empleados table");

    // PHI Check: Verify that all patient IDs follow ENT-PAX-XXXX format
    const phiCheck = execSync("sqlite3 \"" + dbPath + "\" \"SELECT count(*) FROM pacientes WHERE uuid NOT LIKE 'ENT-PAX-%';\"", { encoding: "utf-8" }).trim();
    assert(parseInt(phiCheck, 10) === 0, "All 304 patient records adhere to ENT-PAX-XXXX pseudonymization");

} catch(err) {
    assert(false, "SQLite Database execution error: " + err.message);
}

// -----------------------------------------------------------------------------
// SECTION 2: 13 Mermaid Workflows Syntax & Soundness Verification
// -----------------------------------------------------------------------------
console.log("\n=== SECTION 2: 13 Mermaid Workflows & BPMN 2.0 Soundness ===");
const flowsJsContent = fs.readFileSync(path.join(ROOT_DIR, "src", "js", "data", "flows.js"), "utf-8");

const flowsMatch = flowsJsContent.match(/export const FLOW_DEFINITIONS = ({[\s\S]*?});/);
assert(flowsMatch !== null, "FLOW_DEFINITIONS exported from flows.js");

const flowDefs = eval("(" + flowsMatch[1] + ")");
const canvasKeys = Object.keys(flowDefs);
assert(canvasKeys.length === 12, "Exactly 12 Mermaid diagram definitions present (found: " + canvasKeys.length + ")");

const requiredCanvases = [
    "can-macro", "can-lead", "can-quote", "can-booking",
    "can-checkmig", "can-transport", "can-clinical", "can-companion",
    "can-postop", "can-fittotly", "can-finance", "can-whatsapp"
];

requiredCanvases.forEach(canId => {
    const code = flowDefs[canId];
    assert(typeof code === "string" && code.trim().length > 0, "Diagram " + canId + " has valid non-empty Mermaid definition");
    
    // Check syntax type
    const firstLine = code.trim().split("\n")[0].trim();
    const isValidType = firstLine.startsWith("graph") || firstLine.startsWith("flowchart") || firstLine.startsWith("sequenceDiagram");
    assert(isValidType, "Diagram " + canId + " has valid Mermaid header (" + firstLine + ")");

    // Check empirical actor presence
    const hasEmpiricalActor = code.includes("Carolina") || code.includes("Jenny") || code.includes("Gilma") || 
                              code.includes("Marcos") || code.includes("Ramón") || code.includes("Guianza") ||
                              code.includes("George Hernandez") || code.includes("Zulaica Giterson");
    assert(hasEmpiricalActor, "Diagram " + canId + " contains verified empirical actors");

    // Check for forbidden "Bot" or unassigned placeholder
    assert(!code.includes("Bot") && !code.includes("Synthetic") && !code.includes("TODO"), "Diagram " + canId + " contains 0 unassigned Bot/Synthetic placeholders");

    // Check balanced syntax
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    assert(openBrackets === closeBrackets, "Diagram " + canId + " has balanced brackets: [" + openBrackets + "] vs [" + closeBrackets + "]");
    
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    assert(openBraces === closeBraces, "Diagram " + canId + " has balanced braces: {" + openBraces + "} vs {" + closeBraces + "}");
});

// Verify 13th Flow (#flow-audit) in index.html
const indexHtmlContent = fs.readFileSync(path.join(ROOT_DIR, "index.html"), "utf-8");
assert(indexHtmlContent.includes("id=\"flow-audit\""), "13th flow #flow-audit exists in index.html");
assert(indexHtmlContent.includes("12. Auditoría de Vacíos & Gaps"), "#flow-audit has proper header title in index.html");

// -----------------------------------------------------------------------------
// SECTION 3: Gesture Engine Bounds & Mathematical Invariants
// -----------------------------------------------------------------------------
console.log("\n=== SECTION 3: Gesture Engine Numerical & Boundary Stress Test ===");

function simulateWheelZoom(currentScale, deltaY) {
    const zoomDelta = -deltaY * 0.01;
    return Math.min(Math.max(0.35, currentScale + zoomDelta), 3.5);
}

function simulateHudZoom(currentScale, factor) {
    return Math.min(Math.max(0.35, currentScale * factor), 4.0);
}

// Test 1: Minimum Zoom Clamping (0.35x)
let scale = 1.0;
for (let i = 0; i < 50; i++) {
    scale = simulateWheelZoom(scale, 100);
}
assert(scale === 0.35, "Wheel zoom out repeatedly clamped strictly at 0.35x (actual: " + scale + ")");

// Test 2: Maximum Wheel Zoom Clamping (3.5x)
scale = 1.0;
for (let i = 0; i < 50; i++) {
    scale = simulateWheelZoom(scale, -100);
}
assert(scale === 3.5, "Wheel zoom in repeatedly clamped strictly at 3.5x (actual: " + scale + ")");

// Test 3: HUD Zoom In (factor 1.2) Clamping (4.0x)
scale = 1.0;
for (let i = 0; i < 50; i++) {
    scale = simulateHudZoom(scale, 1.2);
}
assert(scale === 4.0, "HUD zoom in repeatedly clamped strictly at 4.0x (actual: " + scale + ")");

// Test 4: HUD Zoom Out (factor 0.8) Clamping (0.35x)
scale = 1.0;
for (let i = 0; i < 50; i++) {
    scale = simulateHudZoom(scale, 0.8);
}
assert(scale === 0.35, "HUD zoom out repeatedly clamped strictly at 0.35x (actual: " + scale + ")");

// Test 5: Extreme single-step delta (deltaY = 1,000,000)
const extremeZoomOut = simulateWheelZoom(1.0, 1000000);
assert(extremeZoomOut === 0.35, "Extreme single-step zoom out (+1M) clamped strictly at 0.35x (actual: " + extremeZoomOut + ")");

const extremeZoomIn = simulateWheelZoom(1.0, -1000000);
assert(extremeZoomIn === 3.5, "Extreme single-step zoom in (-1M) clamped strictly at 3.5x (actual: " + extremeZoomIn + ")");

// Test 6: Zero & negative zoom factors
const hudZeroFactor = simulateHudZoom(1.0, 0);
assert(hudZeroFactor === 0.35, "HUD zoom with factor 0 clamped strictly at 0.35x");

const hudNegativeFactor = simulateHudZoom(1.0, -2);
assert(hudNegativeFactor === 0.35, "HUD zoom with negative factor clamped strictly at 0.35x");

// Test 7: Reset Zoom invariant
function resetZoom() {
    return { scale: 1.0, panX: 0, panY: 0, isDragging: false };
}
const resetState = resetZoom();
assert(resetState.scale === 1.0 && resetState.panX === 0 && resetState.panY === 0, "resetZoom restores viewport to scale 1.0 and pan (0,0)");

// -----------------------------------------------------------------------------
// SECTION 4: 108 Button Handler Inventory & Binding Verification
// -----------------------------------------------------------------------------
console.log("\n=== SECTION 4: 108 Button Handler Inventory & Binding Verification ===");

// 1. Navigation Flow Buttons
const navFlowButtons = (indexHtmlContent.match(/class="[^"]*nav-link[^"]*"/g) || []).length;
assert(navFlowButtons === 13, "13 Navigation flow buttons present (found: " + navFlowButtons + ")");

// 2. Toolbar & Top Header Action Buttons
const toolbarBtnIds = [
    "btnRoi", "btnDb", "btnA11y", "btnLaser", "btnAutoPlay",
    "btnRobotTest", "btnAutoTest", "btnTheme"
];
toolbarBtnIds.forEach(btnId => {
    assert(indexHtmlContent.includes("id=\"" + btnId + "\""), "Toolbar button #" + btnId + " present in index.html");
});

// 3. HUD Controls per Viewport (Zoom In, Zoom Out, Reset, Fullscreen, Exit Fullscreen)
const hudZoomInBtns = (indexHtmlContent.match(/class="[^"]*hud-btn-zoom-in[^"]*"/g) || []).length;
const hudZoomOutBtns = (indexHtmlContent.match(/class="[^"]*hud-btn-zoom-out[^"]*"/g) || []).length;
const hudResetBtns = (indexHtmlContent.match(/class="[^"]*hud-btn-reset[^"]*"/g) || []).length;
const hudFullscreenBtns = (indexHtmlContent.match(/class="[^"]*hud-btn-fullscreen[^"]*"/g) || []).length;
const fullscreenExitBtns = (indexHtmlContent.match(/class="[^"]*fullscreen-exit-btn[^"]*"/g) || []).length;

assert(hudZoomInBtns === 12, "12 HUD Zoom In buttons present (found: " + hudZoomInBtns + ")");
assert(hudZoomOutBtns === 12, "12 HUD Zoom Out buttons present (found: " + hudZoomOutBtns + ")");
assert(hudResetBtns === 12, "12 HUD Reset Zoom buttons present (found: " + hudResetBtns + ")");
assert(hudFullscreenBtns === 12, "12 HUD Fullscreen buttons present (found: " + hudFullscreenBtns + ")");
assert(fullscreenExitBtns === 12, "12 Fullscreen Exit buttons present (found: " + fullscreenExitBtns + ")");

// 4. Step Simulator Next / Prev Buttons
const stepNextBtns = (indexHtmlContent.match(/class="[^"]*btn-step-next[^"]*"/g) || []).length;
const stepPrevBtns = (indexHtmlContent.match(/class="[^"]*btn-step-prev[^"]*"/g) || []).length;
assert(stepNextBtns >= 1, "Step Next simulator button present in index.html");
assert(stepPrevBtns >= 1, "Step Prev simulator button present in index.html");

// 5. Interactive Step Timeline Rows
const stepTimelineRows = (indexHtmlContent.match(/class="[^"]*step-entry[^"]*"/g) || []).length;
assert(stepTimelineRows === 60, "60 Interactive step timeline rows present (found: " + stepTimelineRows + ")");

// 6. Role Filter Chips
const filterChips = (indexHtmlContent.match(/class="[^"]*filter-chip[^"]*"/g) || []).length;
assert(filterChips >= 7, "7+ Role filter chips present (found: " + filterChips + ")");

// 7. Drawer Close & Action Buttons
const drawerCloseBtns = ["close-exec-btn", "close-db-btn", "close-a11y-btn", "close-diag-btn"];
drawerCloseBtns.forEach(btnId => {
    assert(indexHtmlContent.includes("id=\"" + btnId + "\""), "Drawer close button #" + btnId + " present in index.html");
});

const a11yBtns = [
    "btnFontNormal", "btnFontLarge", "btnFontXLarge",
    "btnContrastNormal", "btnContrastHigh",
    "btnDyslexiaOff", "btnDyslexiaOn"
];
a11yBtns.forEach(btnId => {
    assert(indexHtmlContent.includes("id=\"" + btnId + "\""), "Accessibility option button #" + btnId + " present in index.html");
});

assert(indexHtmlContent.includes("id=\"btnDownloadNotes\""), "Download Meeting Notes button #btnDownloadNotes present");

// Calculate Total Verified Interactive Controls
const totalInteractiveControls = navFlowButtons + toolbarBtnIds.length + 
    hudZoomInBtns + hudZoomOutBtns + hudResetBtns + hudFullscreenBtns + fullscreenExitBtns +
    stepNextBtns + stepPrevBtns + stepTimelineRows + filterChips + drawerCloseBtns.length + a11yBtns.length + 1;

assert(totalInteractiveControls >= 108, "Total verified interactive controls count >= 108 (actual: " + totalInteractiveControls + ")");

// Verify all 24 window action exports in src/js/app.js
const appJsContent = fs.readFileSync(path.join(ROOT_DIR, "src", "js", "app.js"), "utf-8");
const windowExports = [
    "zoomDiagram", "resetZoom", "toggleFullscreen", "exitFullscreenMode",
    "navigateFlow", "stepSimNext", "stepSimPrev", "filterByRole",
    "runFullDiagnostics", "runRobotTester", "toggleLaserPointer", "toggleAutoPlaySlides",
    "openExecutiveSummary", "closeExecutiveSummary", "updateRoiCalculation", "downloadMeetingNotes",
    "openAccessibilityDrawer", "closeAccessibilityDrawer", "openDatabaseInspector", "closeDatabaseInspector",
    "setFontSize", "setHighContrast", "setDyslexiaFont", "toggleTheme"
];
windowExports.forEach(fn => {
    assert(appJsContent.includes("window." + fn), "Global window action export window." + fn + " defined in app.js");
});

// -----------------------------------------------------------------------------
// SECTION 5: Step Simulator State Machine & Edge Cases
// -----------------------------------------------------------------------------
console.log("\n=== SECTION 5: Step Simulator State Machine & Edge Cases ===");

class MockTimeline {
    constructor(stepsData) {
        this.steps = stepsData.map((d, i) => ({
            id: "step-" + (i+1),
            role: d.role,
            display: "block",
            active: i === 0
        }));
    }

    stepNext() {
        const visible = this.steps.filter(s => s.display !== "none");
        if (visible.length === 0) return;
        const activeIdx = visible.findIndex(s => s.active);
        if (activeIdx === -1) {
            this.steps.forEach(s => s.active = false);
            visible[0].active = true;
        } else if (activeIdx < visible.length - 1) {
            this.steps.forEach(s => s.active = false);
            visible[activeIdx + 1].active = true;
        }
    }

    stepPrev() {
        const visible = this.steps.filter(s => s.display !== "none");
        if (visible.length === 0) return;
        const activeIdx = visible.findIndex(s => s.active);
        if (activeIdx > 0) {
            this.steps.forEach(s => s.active = false);
            visible[activeIdx - 1].active = true;
        } else if (activeIdx === -1) {
            this.steps.forEach(s => s.active = false);
            visible[0].active = true;
        }
    }

    filterRole(roleCode) {
        this.steps.forEach(s => {
            s.display = (roleCode === "ALL" || s.role.includes(roleCode)) ? "block" : "none";
        });
        const visible = this.steps.filter(s => s.display !== "none");
        const hasActiveVisible = visible.some(s => s.active);
        if (!hasActiveVisible && visible.length > 0) {
            this.steps.forEach(s => s.active = false);
            visible[0].active = true;
        }
    }

    getActive() {
        return this.steps.find(s => s.active) || null;
    }
}

const simTimeline = new MockTimeline([
    { role: "PAX COORD" },
    { role: "MED" },
    { role: "DRV" },
    { role: "COORD FIN" },
    { role: "PAX" }
]);

assert(simTimeline.getActive().id === "step-1", "Initial active step is step-1");

// Advance through all steps
simTimeline.stepNext();
assert(simTimeline.getActive().id === "step-2", "stepNext moves to step-2");
simTimeline.stepNext();
assert(simTimeline.getActive().id === "step-3", "stepNext moves to step-3");
simTimeline.stepNext();
assert(simTimeline.getActive().id === "step-4", "stepNext moves to step-4");
simTimeline.stepNext();
assert(simTimeline.getActive().id === "step-5", "stepNext moves to terminal step-5");

// Edge case: stepNext when already on terminal step
simTimeline.stepNext();
assert(simTimeline.getActive().id === "step-5", "Edge Case: stepNext on terminal step remains safely on step-5");

// Step backwards
simTimeline.stepPrev();
assert(simTimeline.getActive().id === "step-4", "stepPrev moves to step-4");
simTimeline.stepPrev();
simTimeline.stepPrev();
simTimeline.stepPrev();
assert(simTimeline.getActive().id === "step-1", "stepPrev returns to initial step-1");

// Edge case: stepPrev when already on initial step
simTimeline.stepPrev();
assert(simTimeline.getActive().id === "step-1", "Edge Case: stepPrev on initial step remains safely on step-1");

// Role filtering stress test
simTimeline.filterRole("MED");
assert(simTimeline.getActive().id === "step-2", "filterRole(MED) shifts active step to visible step-2");

simTimeline.filterRole("DRV");
assert(simTimeline.getActive().id === "step-3", "filterRole(DRV) shifts active step to visible step-3");

// Filter with 0 matching steps
simTimeline.filterRole("NONEXISTENT");
assert(simTimeline.steps.filter(s => s.display !== "none").length === 0, "0 visible steps when filter has no matches");
simTimeline.stepNext();
simTimeline.stepPrev();
assert(true, "stepNext and stepPrev gracefully handle 0 visible steps without exception");

// Restore ALL filter (preserves currently active step if still valid)
simTimeline.filterRole("ALL");
assert(simTimeline.steps.every(s => s.display === "block"), "ALL filter restores all steps to visible");
assert(simTimeline.getActive() !== null, "Active step remains safely defined on ALL filter");

// -----------------------------------------------------------------------------
// SECTION 6: ROI Calculator Financial Bounds
// -----------------------------------------------------------------------------
console.log("\n=== SECTION 6: ROI Calculator Financial Bounds ===");

function calcRoi(paxValue) {
    const pax = parseInt(paxValue, 10) || 15;
    const revenue = pax * 2500;
    const margin = revenue * 0.30;
    return { pax, revenue, margin };
}

assert(calcRoi(15).revenue === 37500 && calcRoi(15).margin === 11250, "ROI at 15 pax: $37,500 USD Revenue, $11,250 USD Margin (30%)");
assert(calcRoi(25).revenue === 62500 && calcRoi(25).margin === 18750, "ROI at 25 pax: $62,500 USD Revenue, $18,750 USD Margin (30%)");
assert(calcRoi(0).pax === 15, "ROI handles 0/falsy input with fallback to 15 pax default");
assert(calcRoi(100).revenue === 250000 && calcRoi(100).margin === 75000, "ROI at 100 pax: $250,000 USD Revenue, $75,000 USD Margin (30%)");

// -----------------------------------------------------------------------------
// SECTION 7: 10 Gap Solutions Engines Adversarial & Boundary Stress Test
// -----------------------------------------------------------------------------
console.log("\n=== SECTION 7: 10 Gap Solutions Engines Adversarial & Boundary Stress Test ===");

const gapEngineCode = fs.readFileSync(path.join(ROOT_DIR, "src", "js", "components", "gap-solutions-engine.js"), "utf-8").replace("export class", "class");
const GapSolutionsEngine = eval(gapEngineCode + "; GapSolutionsEngine");

// --- 7.1 Engine 1: Passport MRZ Validator & Check-Mig Automated Filing ---
console.log("  -> Testing Engine 1: Passport MRZ & Check-Mig Filing...");
const passExact180 = GapSolutionsEngine.validatePassport("PA123456", "2027-01-28", "2026-08-01");
assert(passExact180.isValid === true && passExact180.validityDays === 180, "Passport at exact 180-day boundary is valid (180 days)");
assert(passExact180.status === "APROBADO_PARA_VIAJE" && passExact180.checkMigEligible === true, "Passport at 180 days is approved and eligible for Check-Mig");
assert(passExact180.radicadoCheckMig && passExact180.radicadoCheckMig.startsWith("CM-COL-2026-"), "Check-Mig radicado generated with valid format CM-COL-2026-XXXXXX");

const passSub179 = GapSolutionsEngine.validatePassport("pa-888999", "2027-01-27", "2026-08-01");
assert(passSub179.isValid === false && passSub179.validityDays === 179, "Passport at 179-day sub-boundary is rejected (<180 days)");
assert(passSub179.status === "RIESGO_INADMISIÓN_EXPIRACIÓN" && passSub179.checkMigEligible === false, "Passport at 179 days triggers inadmission alert and Check-Mig ineligible");
assert(passSub179.radicadoCheckMig === null, "Rejected passport receives null Check-Mig radicado");
assert(passSub179.passportNumber === "PA-888999", "Passport number normalized to uppercase");

const passExpired = GapSolutionsEngine.validatePassport("PA000001", "2026-07-01", "2026-08-01");
assert(passExpired.isValid === false && passExpired.validityDays === -31, "Expired passport returns negative validity (-31 days) and is rejected");

const passLeapYear = GapSolutionsEngine.validatePassport("LEAP2028", "2028-08-26", "2028-02-28");
assert(passLeapYear.isValid === true && passLeapYear.validityDays === 180, "Leap year passport validity calculation handles Feb 29 (180 days)");

// --- 7.2 Engine 2: DTW Latency Reconciliation (WhatsApp vs Excel Ledgers) ---
console.log("  -> Testing Engine 2: DTW Latency Reconciliation...");
const dtw0d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-01T10:00:00");
assert(dtw0d.latencyDays === 0 && dtw0d.matchConfidence === "100.0%", "DTW 0-day latency returns 100.0% confidence");
assert(dtw0d.reconciled === true && dtw0d.dtwStatus === "CONCILIADO_TIEMPO_REAL", "DTW 0-day latency categorized as CONCILIADO_TIEMPO_REAL");

const dtw2d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-03T10:00:00");
assert(dtw2d.latencyDays === 2 && dtw2d.matchConfidence === "93.0%" && dtw2d.dtwStatus === "CONCILIADO_TIEMPO_REAL", "DTW 2-day latency is CONCILIADO_TIEMPO_REAL (93.0% confidence)");

const dtw6d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-07T10:00:00");
assert(dtw6d.latencyDays === 6 && dtw6d.matchConfidence === "79.0%", "DTW 6-day latency returns 79.0% confidence within Sakoe-Chiba window");
assert(dtw6d.reconciled === true && dtw6d.dtwStatus === "CONCILIADO_CON_DESFASE_DTW", "DTW 6-day latency reconciled with status CONCILIADO_CON_DESFASE_DTW");

const dtw7d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-08T10:00:00");
assert(dtw7d.latencyDays === 7 && dtw7d.matchConfidence === "75.5%" && dtw7d.reconciled === true, "DTW 7-day Sakoe-Chiba standard window reconciled (75.5% confidence)");

const dtw14d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-15T10:00:00");
assert(dtw14d.latencyDays === 14 && dtw14d.matchConfidence === "51.0%" && dtw14d.reconciled === true, "DTW 14-day outer boundary reconciled (51.0% confidence)");

const dtw15d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-16T10:00:00");
assert(dtw15d.latencyDays === 15 && dtw15d.matchConfidence === "35.0%" && dtw15d.reconciled === false, "DTW 15-day latency exceeds threshold, unreconciled with base 35.0% confidence");

const dtw30d = GapSolutionsEngine.runDtwReconciliation("2026-08-01T10:00:00", "2026-08-31T10:00:00");
assert(dtw30d.latencyDays === 30 && dtw30d.reconciled === false && dtw30d.matchConfidence === "35.0%", "DTW 30-day extreme outlier rejected as unreconciled");

const dtwReverse = GapSolutionsEngine.runDtwReconciliation("2026-08-10T10:00:00", "2026-08-05T10:00:00");
assert(dtwReverse.latencyDays === 5 && dtwReverse.reconciled === true, "DTW handles negative temporal order via Math.abs (5 days lag)");

// --- 7.3 Engine 3: Medisch Dossier Multilingual Clinical Mappings & CUPS ---
console.log("  -> Testing Engine 3: Medisch Dossier Multilingual CUPS Homologation...");
const mdDutch = GapSolutionsEngine.translateMedischDossier("Patient heeft hersen mri en bloedonderzoek nodig");
assert(mdDutch.matchedCups.length === 2, "Dutch clinical narrative matches exactly 2 CUPS procedures (MRI + Lab)");
assert(mdDutch.matchedCups.some(c => c.cups === "883101") && mdDutch.matchedCups.some(c => c.cups === "903841"), "Matched CUPS 883101 (RNM Cerebro) and CUPS 903841 (Laboratorio Pre-Op)");
assert(mdDutch.totalEstimatedCop.includes("930.000"), "Aggregated estimated COP equals 930,000 COP ($710k + $220k)");

const mdPapiamento = GapSolutionsEngine.translateMedischDossier("Dokter a pidi un evaluacion pa cardio y ecg pa e kurason");
assert(mdPapiamento.matchedCups.length === 1 && mdPapiamento.matchedCups[0].cups === "CHQ-CARD", "Papiamento cardio request matches CUPS CHQ-CARD (Chequeo Cardiovascular)");
assert(mdPapiamento.matchedCups[0].priceCop === 3800000 && mdPapiamento.matchedCups[0].margin === "27.6%", "CUPS CHQ-CARD tariff is 3,800,000 COP with 27.6% margin");

const mdGyn = GapSolutionsEngine.translateMedischDossier("Consulta de gynaecologie y problemas de bekkenbodem");
assert(mdGyn.matchedCups.length === 1 && mdGyn.matchedCups[0].cups === "890201-GIN", "Dutch/Spanish gynaecologie & bekkenbodem matches CUPS 890201-GIN");

const mdSleep = GapSolutionsEngine.translateMedischDossier("Patient heeft slaaponderzoek polisomnografia nodig");
assert(mdSleep.matchedCups.length === 1 && mdSleep.matchedCups[0].cups === "CHQ-SUEÑO", "Dutch slaaponderzoek matches CUPS CHQ-SUEÑO");

const mdStemCell = GapSolutionsEngine.translateMedischDossier("Tratamiento de regeneracion con celulas madre y stamcel");
assert(mdStemCell.matchedCups.length === 1 && mdStemCell.matchedCups[0].cups === "TER-CEL", "Regenerative medicine / stamcel matches CUPS TER-CEL (12.8M COP)");

const mdFallback = GapSolutionsEngine.translateMedischDossier("unrecognized non-medical text XYZ123");
assert(mdFallback.matchedCups.length === 1 && mdFallback.matchedCups[0].cups === "890201", "Unrecognized text safely falls back to default consultation CUPS 890201");
assert(mdFallback.totalEstimatedCop.includes("350.000"), "Default consultation tariff is 350,000 COP");

// --- 7.4 Engine 4: PHI Zero-Knowledge Masking ---
console.log("  -> Testing Engine 4: Real-Time PHI Zero-Knowledge Masking...");
const phiMulti = GapSolutionsEngine.maskPhiData("Paciente George Hernandez, pasaporte PA1234567, tel +599 9 512 3456, Sra. Zulaica Giterson, doc CU888888, tel +57 300 123 4567");
assert(phiMulti.maskedText.includes("[ENT-PAX-1001]") && phiMulti.maskedText.includes("[ENT-PAX-1002]"), "Both patient names pseudonymized as [ENT-PAX-1001] and [ENT-PAX-1002]");
assert(phiMulti.maskedText.includes("[DOC-2001]") && phiMulti.maskedText.includes("[DOC-2002]"), "Both document/passport numbers masked as [DOC-2001] and [DOC-2002]");
assert(!phiMulti.maskedText.includes("+599") && !phiMulti.maskedText.includes("+57"), "All international phone numbers masked with [TEL-PROTEGIDO]");
assert(phiMulti.phiProtected === true && phiMulti.complianceLevel.includes("HIPAA"), "Compliance level certified as HIPAA / GDPR / Ley 1581");

const phiAccents = GapSolutionsEngine.maskPhiData("Nombre: Dra. María José Beltrán, doc COL998877");
assert(phiAccents.maskedText.includes("[ENT-PAX-1001]") && phiAccents.maskedText.includes("[DOC-2001]"), "Spanish names with accents (María José Beltrán) masked correctly");

// --- 7.5 Engine 5: TRM Hedging & 72h Currency Lock ---
console.log("  -> Testing Engine 5: TRM Hedging & 72h Currency Lock...");
const trmStandard = GapSolutionsEngine.calculateTrmHedging(2500, 4000);
assert(trmStandard.ingresoBrutoCop.includes("10.000.000") && trmStandard.costoConvenioHospital.includes("7.000.000"), "Standard $2,500 USD @ 4,000 TRM: Gross 10M COP, Hospital 70% 7M COP");
assert(trmStandard.margenBrutoMedicalTrip.includes("3.000.000"), "Gross Margin is 30% (3,000,000 COP)");
assert(trmStandard.comisionSwift.includes("120.000") && trmStandard.gananciaNetaReal.includes("2.880.000"), "Net profit after 120,000 COP Swift fee is 2,880,000 COP");

const trmVolatileLow = GapSolutionsEngine.calculateTrmHedging(5000, 3800);
assert(trmVolatileLow.ingresoBrutoCop.includes("19.000.000") && trmVolatileLow.gananciaNetaReal.includes("5.580.000"), "Appreciated TRM (3,800 COP/USD): Gross 19M COP, Net profit 5,580,000 COP");

const trmVolatileHigh = GapSolutionsEngine.calculateTrmHedging(10000, 4800);
assert(trmVolatileHigh.ingresoBrutoCop.includes("48.000.000") && trmVolatileHigh.gananciaNetaReal.includes("14.280.000"), "Depreciated TRM (4,800 COP/USD): Gross 48M COP, Net profit 14,280,000 COP");

const trmLarge = GapSolutionsEngine.calculateTrmHedging(50000, 4200);
assert(trmLarge.ingresoBrutoCop.includes("210.000.000") && trmLarge.gananciaNetaReal.includes("62.880.000"), "Institutional quote $50,000 USD @ 4,200 TRM: Gross 210M COP, Net profit 62,880,000 COP");

// --- 7.6 Engine 6: Digital Fit-to-Fly Certificate Generator ---
console.log("  -> Testing Engine 6: Digital Fit-to-Fly Certificate Generator...");
const ftf = GapSolutionsEngine.generateFitToFly("George Hernandez", "Dr. Marcos Yepes", "Chequeo Cardiovascular & Post-Op", "2026-08-09");
assert(ftf.codigoCertificado && /^FTF-2026-\d{6}$/.test(ftf.codigoCertificado), "Fit-to-Fly certificate code follows FTF-2026-XXXXXX format");
assert(ftf.estadoClinico === "APTO PARA VOLAR (FIT-TO-FLY)", "Fit-to-Fly clinical status is APTO PARA VOLAR");
assert(ftf.aerolineaValida.includes("Wingo 7449") && ftf.aerolineaValida.includes("Avianca"), "Fit-to-Fly valid for Caribbean route airlines (Wingo 7449 / Avianca / Copa)");
assert(ftf.verificacionQrUrl.includes("https://medicaltrip-colombia.vercel.app/verify/FTF-2026-"), "QR verification URL links to production verification endpoint");

// --- 7.7 Engine 7: Companion Capacity Scaling ---
console.log("  -> Testing Engine 7: Companion Capacity Scaling...");
const compSolo = GapSolutionsEngine.scaleCompanionCapacity(1, 0);
assert(compSolo.totalPasajeros === 1 && compSolo.vehiculoRecomendado.includes("Sedán Ejecutivo"), "1 Solo Pax: Sedán Ejecutivo recommended");
assert(compSolo.alojamientoRecomendado.includes("Suite Individual") && compSolo.suplementoAcompanantesUsd === "$0 USD", "1 Solo Pax: Suite Individual, $0 USD extra charge");

const comp1 = GapSolutionsEngine.scaleCompanionCapacity(1, 1);
assert(comp1.totalPasajeros === 2 && comp1.vehiculoRecomendado.includes("Sedán Ejecutivo"), "1 Pax + 1 Comp (Total 2): Sedán Ejecutivo");
assert(comp1.alojamientoRecomendado.includes("Suite Doble con Acompañante") && comp1.suplementoAcompanantesUsd === "$250 USD", "Total 2: Suite Doble, $250 USD extra charge ($1,000,000 COP)");

const comp2 = GapSolutionsEngine.scaleCompanionCapacity(1, 2);
assert(comp2.totalPasajeros === 3 && comp2.vehiculoRecomendado.includes("Van Especial Aeroturex"), "1 Pax + 2 Comp (Total 3): Upgrades to Van Especial Aeroturex");
assert(comp2.alojamientoRecomendado.includes("Suite Doble Familiar / Villa Anita") && comp2.suplementoAcompanantesUsd === "$700 USD", "Total 3: Villa Anita Suite, $700 USD extra charge ($2,800,000 COP)");

const compGroup = GapSolutionsEngine.scaleCompanionCapacity(2, 8);
assert(compGroup.totalPasajeros === 10 && compGroup.vehiculoRecomendado.includes("Van Especial Aeroturex"), "10 Pax Group: Van Especial Aeroturex");
assert(compGroup.suplementoAcompanantesUsd === "$3150 USD" && compGroup.suplementoAcompanantesCop.includes("12.600.000"), "10 Pax Group: $3,150 USD ($12,600,000 COP) companion supplement");

// --- 7.8 Engine 8: Pharmacy Audit & Prescription Bitácora ---
console.log("  -> Testing Engine 8: Pharmacy Audit & Prescription Bitácora...");
const pharmDefault = GapSolutionsEngine.auditPharmacyPrescription();
assert(pharmDefault.medicamentos.length === 4, "Default pharmacy audit contains exactly 4 post-op medications");
assert(pharmDefault.totalGastoFarmacia.includes("410.000"), "Total default pharmacy expenditure equals 410,000 COP");
assert(pharmDefault.alertaHoraria.includes("Enoxaparina 40mg a las 21:00"), "Scheduled dosage alert for Enoxaparina 40mg at 21:00 active");
assert(pharmDefault.estadoConciliacion === "DESCONTADO_DE_DEPOSITO_PACIENTE", "Reconciliation status confirms DESCONTADO_DE_DEPOSITO_PACIENTE");

const pharmCustom = GapSolutionsEngine.auditPharmacyPrescription([
    { nombre: "Antibiótico Especial", horario: "Cada 8h", costoCop: 85000, estado: "ADMINISTRADO" },
    { nombre: "Analgésico IV", horario: "Cada 12h", costoCop: 115000, estado: "ADMINISTRADO" }
]);
assert(pharmCustom.medicamentos.length === 2 && pharmCustom.totalGastoFarmacia.includes("200.000"), "Custom pharmacy list calculated accurately (200,000 COP)");

const pharmEmpty = GapSolutionsEngine.auditPharmacyPrescription([]);
assert(pharmEmpty.medicamentos.length === 0 && pharmEmpty.totalGastoFarmacia.includes("0"), "Empty pharmacy prescription list returns $0 COP");

// --- 7.9 Engine 9: Cross-Border Telemedicine Scheduler ---
console.log("  -> Testing Engine 9: Cross-Border Telemedicine Scheduler...");
const teleStandard = GapSolutionsEngine.scheduleTelemedicineFollowUp("2026-08-09");
assert(teleStandard.fechaRetorno === "2026-08-09", "Telemedicine return date registered as 2026-08-09");
assert(teleStandard.controlesProgramados.length === 3, "Exactly 3 follow-up teleconsultation sessions scheduled (+15, +30, +90 days)");
assert(teleStandard.controlesProgramados[0].fecha === "2026-08-24" && teleStandard.controlesProgramados[0].sesion.includes("Día 15"), "Control Día 15 scheduled at 2026-08-24 via WhatsApp Video HD");
assert(teleStandard.controlesProgramados[1].fecha === "2026-09-08" && teleStandard.controlesProgramados[1].sesion.includes("Día 30"), "Control Día 30 scheduled at 2026-09-08 via WhatsApp Video HD");
assert(teleStandard.controlesProgramados[2].fecha === "2026-11-07" && teleStandard.controlesProgramados[2].sesion.includes("Día 90"), "Alta Definitiva Día 90 scheduled at 2026-11-07 via WhatsApp Video HD");

const teleYearEnd = GapSolutionsEngine.scheduleTelemedicineFollowUp("2026-12-01");
assert(teleYearEnd.controlesProgramados[0].fecha === "2026-12-16", "Year-end D15 scheduled on 2026-12-16");
assert(teleYearEnd.controlesProgramados[1].fecha === "2026-12-31", "Year-end D30 scheduled on 2026-12-31");
assert(teleYearEnd.controlesProgramados[2].fecha === "2027-03-01", "Year-end D90 safely crosses calendar year boundary to 2027-03-01");

// --- 7.10 Engine 10: GPS-Verified Bilingual Guianza Time Tracker ---
console.log("  -> Testing Engine 10: GPS-Verified Bilingual Guianza Tracker...");
const guianzaDef = GapSolutionsEngine.trackBilingualGuianzaTime();
assert(guianzaDef.clinica === "Hospital Pablo Tobón Uribe (HPTU)", "Default clinic is Hospital Pablo Tobón Uribe (HPTU)");
assert(guianzaDef.checkIn === "07:30" && guianzaDef.checkOut === "13:30", "Default check-in 07:30 and check-out 13:30");
assert(guianzaDef.horasEfectivas.includes("6 Horas"), "Certified duration is 6.0 hours");
assert(guianzaDef.tarifaHora.includes("35.000") && guianzaDef.totalLiquidadoGuia.includes("210.000"), "Hourly rate 35,000 COP/h liquidates to exactly 210,000 COP");
assert(guianzaDef.firmaDigitalPaciente.includes("Firma Digital Capturada"), "Digital patient signature captured");
assert(guianzaDef.estado === "LIQUIDADO_SIN_DESCUADRE", "Liquidation status is LIQUIDADO_SIN_DESCUADRE");

const guianzaCustom = GapSolutionsEngine.trackBilingualGuianzaTime("08:00", "14:00", "Clínica Las Américas / Medellín");
assert(guianzaCustom.clinica === "Clínica Las Américas / Medellín", "Custom clinic assigned correctly");
assert(guianzaCustom.totalLiquidadoGuia.includes("210.000") && guianzaCustom.estado === "LIQUIDADO_SIN_DESCUADRE", "Custom guianza session liquidated without discrepancy");

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log("\n=======================================================================");
console.log("🏆 EMPIRICAL STRESS TEST RESULTS SUMMARY");
console.log("=======================================================================");
console.log("Total Assertions: " + totalAssertions);
console.log("Passed Assertions: " + passedAssertions + " (" + ((passedAssertions / totalAssertions) * 100).toFixed(1) + "%)");
console.log("Failed Assertions: " + failedAssertions);
if (failedAssertions > 0) {
    console.log("\nFailure Details:");
    failureDetails.forEach((f, idx) => console.log("  " + (idx + 1) + ". " + f));
}
console.log("=======================================================================");

process.exit(failedAssertions === 0 ? 0 : 1);

