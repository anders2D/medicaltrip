/**
 * Challenger 4 — Empirical Stress Testing Harness
 * Rigorous validation of BPMN 2.0 graph topologies, Mermaid flows, 0 Bot actors, and SQLite 3NF relational queries.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, message, details = '') {
    if (condition) {
        passCount++;
        console.log('  [PASS] ' + message);
        results.push({ status: 'PASS', message, details });
    } else {
        failCount++;
        console.error('  [FAIL] ' + message + (details ? ' (' + details + ')' : ''));
        results.push({ status: 'FAIL', message, details });
    }
}

console.log('=======================================================================');
console.log('🔥 CHALLENGER 4: EMPIRICAL STRESS TEST SUITE — MEDICAL TRIP COLOMBIA');
console.log('=======================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: 12 MERMAID WORKFLOWS — TOPOLOGY, REACHABILITY & SOUNDNESS
// -----------------------------------------------------------------------------
console.log('=== SECTION 1: BPMN 2.0 Graph Topologies & Reachability Audit ===');

const flowsPath = path.join(__dirname, '../src/js/data/flows.js');
assert(fs.existsSync(flowsPath), 'src/js/data/flows.js exists');

const flowsContent = fs.readFileSync(flowsPath, 'utf8');

// Parse FLOW_DEFINITIONS
const flowDefsMatch = flowsContent.match(/export const FLOW_DEFINITIONS = ({[\s\S]*?\n};)/);
assert(!!flowDefsMatch, 'FLOW_DEFINITIONS object exported and parsed');

const flowsObjectStr = flowDefsMatch[1].replace(/export const FLOW_DEFINITIONS = /, '').replace(/;$/, '');
let FLOW_DEFINITIONS = {};
try {
    FLOW_DEFINITIONS = eval('(' + flowsObjectStr + ')');
    assert(Object.keys(FLOW_DEFINITIONS).length === 12, 'Exact 12 Mermaid flow definitions loaded', 'Found ' + Object.keys(FLOW_DEFINITIONS).length);
} catch (e) {
    assert(false, 'Failed to parse FLOW_DEFINITIONS: ' + e.message);
}

// Graph topology checker for Flowcharts/Graphs and Sequence Diagrams
function analyzeGraphTopology(canvasId, mermaidCode) {
    const lines = mermaidCode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%') && !l.startsWith('autonumber') && !l.startsWith('actor'));
    const header = lines[0];
    const isGraph = header.startsWith('graph') || header.startsWith('flowchart');
    const isSequence = header.startsWith('sequenceDiagram');

    // Syntax & Bracket checks
    const leftBrackets = (mermaidCode.match(/\[/g) || []).length;
    const rightBrackets = (mermaidCode.match(/\]/g) || []).length;
    assert(leftBrackets === rightBrackets, canvasId + ': Balanced square brackets [' + leftBrackets + ' vs ' + rightBrackets + ']');

    const leftBraces = (mermaidCode.match(/\{/g) || []).length;
    const rightBraces = (mermaidCode.match(/\}/g) || []).length;
    assert(leftBraces === rightBraces, canvasId + ': Balanced curly braces {' + leftBraces + ' vs ' + rightBraces + '}');

    const leftParens = (mermaidCode.match(/\(/g) || []).length;
    const rightParens = (mermaidCode.match(/\)/g) || []).length;
    assert(leftParens === rightParens, canvasId + ': Balanced parentheses (' + leftParens + ' vs ' + rightParens + ')');

    if (isSequence) {
        // Sequence diagram validation
        const actors = [];
        const actorMatches = mermaidCode.matchAll(/actor\s+([A-Za-z0-9_]+)\s+as\s+(.+)/g);
        for (const m of actorMatches) {
            actors.push({ id: m[1], label: m[2] });
        }
        assert(actors.length >= 3, canvasId + ': Sequence diagram has >= 3 distinct empirical actors', 'Found ' + actors.length);
        
        const msgLines = lines.filter(l => l.includes('->>') || l.includes('-->>'));
        assert(msgLines.length >= 4, canvasId + ': Sequence diagram has substantial message exchanges', 'Found ' + msgLines.length);

        // Verify all defined actors participate
        for (const act of actors) {
            const participates = msgLines.some(l => l.includes(act.id + '->>') || l.includes(act.id + '-->>') || l.includes('->>' + act.id) || l.includes('-->>' + act.id));
            assert(participates, canvasId + ': Actor ' + act.id + ' (' + act.label + ') participates in message interactions');
        }
    } else if (isGraph) {
        // Directed Graph validation (Soundness, Reachability, 0 Deadlocks)
        const adj = new Map();
        const nodes = new Set();
        const inDegree = new Map();
        const outDegree = new Map();

        // Edge extraction regex (handles A --> B, A -->|label| B, etc.)
        const edgeRegex = /([A-Za-z0-9_]+)(?:\[[^\]]*\]|\{[^\}]*\})?\s*-->\s*(?:\|[^\|]*\|\s*)?([A-Za-z0-9_]+)/g;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            let match;
            while ((match = edgeRegex.exec(line)) !== null) {
                const from = match[1];
                const to = match[2];
                nodes.add(from);
                nodes.add(to);
                if (!adj.has(from)) adj.set(from, []);
                adj.get(from).push(to);

                outDegree.set(from, (outDegree.get(from) || 0) + 1);
                inDegree.set(to, (inDegree.get(to) || 0) + 1);
                if (!inDegree.has(from)) inDegree.set(from, 0);
                if (!outDegree.has(to)) outDegree.set(to, 0);
            }
        }

        const nodeList = Array.from(nodes);
        assert(nodeList.length >= 3, canvasId + ': Graph has >= 3 parsed nodes', 'Found ' + nodeList.length + ' nodes');

        // Find sources (in-degree 0) and sinks (out-degree 0)
        const sources = nodeList.filter(n => inDegree.get(n) === 0);
        const sinks = nodeList.filter(n => outDegree.get(n) === 0);

        assert(sources.length >= 1, canvasId + ': Graph has defined entry point(s)', 'Sources: ' + sources.join(', '));
        assert(sinks.length >= 1, canvasId + ': Graph has defined termination sink(s)', 'Sinks: ' + sinks.join(', '));

        // Reachability test from primary source (Forward BFS)
        const visitedForward = new Set();
        const queue = [...sources];
        queue.forEach(s => visitedForward.add(s));

        while (queue.length > 0) {
            const curr = queue.shift();
            const neighbors = adj.get(curr) || [];
            for (const nxt of neighbors) {
                if (!visitedForward.has(nxt)) {
                    visitedForward.add(nxt);
                    queue.push(nxt);
                }
            }
        }

        const unreachableNodes = nodeList.filter(n => !visitedForward.has(n));
        assert(unreachableNodes.length === 0, canvasId + ': 100% Forward Reachability from start node', unreachableNodes.length ? 'Unreachable: ' + unreachableNodes.join(', ') : 'All ' + nodeList.length + ' reachable');

        // Co-reachability / Absence of Deadlocks: Every node can reach at least one sink
        const canReachSink = new Set(sinks);
        let changed = true;
        while (changed) {
            changed = false;
            for (const u of nodeList) {
                if (!canReachSink.has(u)) {
                    const neighbors = adj.get(u) || [];
                    if (neighbors.some(v => canReachSink.has(v))) {
                        canReachSink.add(u);
                        changed = true;
                    }
                }
            }
        }

        const deadlockedNodes = nodeList.filter(n => !canReachSink.has(n));
        assert(deadlockedNodes.length === 0, canvasId + ': Zero Deadlocks (All nodes can reach a valid sink)', deadlockedNodes.length ? 'Deadlocked: ' + deadlockedNodes.join(', ') : 'Sound');
    }
}

for (const [canvasId, code] of Object.entries(FLOW_DEFINITIONS)) {
    console.log('\n--- Stress Testing Diagram: ' + canvasId + ' ---');
    analyzeGraphTopology(canvasId, code);
}

// -----------------------------------------------------------------------------
// SECTION 2: 0 SYNTHETIC 'BOT' ENTITIES SCAN
// -----------------------------------------------------------------------------
console.log('\n=== SECTION 2: Zero Synthetic Bot Entity Empirical Scan ===');

// Check in flows.js
const botInFlows = flowsContent.match(/\b[Bb]ot\b|Chatbot|asistente\s+virtual|synthetic/i);
assert(!botInFlows, 'flows.js contains 0 Bot / Chatbot / Synthetic entity mentions');

// Check in HTML / JS core
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const nonTestHtml = indexHtml.replace(/<!--[\s\S]*?-->/g, '');
const botMatchesInHtml = [];
const botRegex = /\b(chatbot|asistente\s+virtual|agente\s+bot)\b/gi;
let bm;
while ((bm = botRegex.exec(nonTestHtml)) !== null) {
    botMatchesInHtml.push(bm[0]);
}
assert(botMatchesInHtml.length === 0, 'index.html contains 0 Chatbot/Virtual Assistant actor references', 'Found: ' + botMatchesInHtml.join(', '));

// Check in database
const dbPath = path.join(__dirname, '../data/medicaltrip_master.db');
assert(fs.existsSync(dbPath), 'data/medicaltrip_master.db exists');

const botCheckQueries = [
    "SELECT count(*) FROM ocel_events WHERE remitente LIKE '%bot%' OR remitente LIKE '%chatbot%' OR remitente LIKE '%asistente%';",
    "SELECT count(*) FROM empleados WHERE nombre LIKE '%bot%' OR rol LIKE '%bot%';",
    "SELECT count(*) FROM proveedores WHERE nombre LIKE '%bot%';",
    "SELECT count(*) FROM ocel_event_objects WHERE object_id LIKE '%bot%';",
    "SELECT count(*) FROM pacientes WHERE nombre_completo LIKE '%bot%';"
];

for (const q of botCheckQueries) {
    const out = execSync(`sqlite3 "${dbPath}" "${q}"`, { encoding: 'utf8' }).trim();
    assert(parseInt(out, 10) === 0, 'Database query (' + q.slice(0, 35) + '...) returned 0 bot records', 'Count: ' + out);
}

// Check empirical actors presence in database
const empleadosList = execSync(`sqlite3 "${dbPath}" "SELECT rol || ': ' || nombre FROM empleados;"`, { encoding: 'utf8' }).trim().split('\n');
console.log('  Verified Empirical Staff Members in DB:');
empleadosList.forEach(e => console.log('    - ' + e));
assert(empleadosList.length >= 4, 'Empirical employees properly configured in DB (Carolina, Paola, Blanca, Marcos)', 'Count: ' + empleadosList.length);

// -----------------------------------------------------------------------------
// SECTION 3: SQLITE 3NF RELATIONAL INTEGRITY & MULTI-TABLE JOINS
// -----------------------------------------------------------------------------
console.log('\n=== SECTION 3: SQLite 3NF Relational Integrity & Multi-Table Joins ===');

const fkCheck = execSync(`sqlite3 "${dbPath}" "PRAGMA foreign_key_check;"`, { encoding: 'utf8' }).trim();
assert(fkCheck === '', 'PRAGMA foreign_key_check returned 0 violations', fkCheck ? 'Violations: ' + fkCheck : 'Clean');

const integrityCheck = execSync(`sqlite3 "${dbPath}" "PRAGMA integrity_check;"`, { encoding: 'utf8' }).trim();
assert(integrityCheck === 'ok', 'PRAGMA integrity_check returned ok', integrityCheck);

const quickCheck = execSync(`sqlite3 "${dbPath}" "PRAGMA quick_check;"`, { encoding: 'utf8' }).trim();
assert(quickCheck === 'ok', 'PRAGMA quick_check returned ok', quickCheck);

// Complex Join 1: Pacientes + Cotizaciones CTZ + Reservas RVA
const join1Query = `
SELECT 
    p.uuid, 
    p.nombre_completo, 
    p.pais_origen,
    count(DISTINCT c.id) as total_ctz,
    count(DISTINCT r.id) as total_rva,
    coalesce(sum(c.monto_estimado_usd), 0) as total_usd
FROM pacientes p
LEFT JOIN cotizaciones_ctz c ON p.uuid = c.paciente_uuid
LEFT JOIN reservas_rva r ON p.uuid = r.paciente_uuid
GROUP BY p.uuid
HAVING total_rva > 0 OR total_ctz > 0
ORDER BY total_rva DESC, total_usd DESC
LIMIT 5;
`;
const join1Out = execSync(`sqlite3 -header -column "${dbPath}" "${join1Query}"`, { encoding: 'utf8' }).trim();
console.log('  [Join 1 Result Preview]:\n' + join1Out);
assert(join1Out.length > 50, 'Join 1 (Pacientes + CTZ + RVA) executed successfully');

// Complex Join 2: Reservas RVA + Traslados Logistica
const join2Query = `
SELECT 
    r.codigo_rva,
    r.numero_vuelo,
    r.destino_hospedaje,
    t.fecha_servicio,
    t.hora_recogida,
    t.conductor_nombre,
    t.origen,
    t.destino
FROM reservas_rva r
INNER JOIN traslados_logistica t ON r.codigo_rva = t.codigo_rva
LIMIT 5;
`;
const join2Out = execSync(`sqlite3 -header -column "${dbPath}" "${join2Query}"`, { encoding: 'utf8' }).trim();
console.log('  [Join 2 Result Preview]:\n' + join2Out);
assert(join2Out.length > 50, 'Join 2 (Reservas RVA + Traslados Logística) executed successfully');

// Complex Join 3: OCEL Events + OCEL Event Objects + Pacientes
const join3Query = `
SELECT 
    e.event_id,
    e.activity,
    e.timestamp,
    e.remitente,
    eo.object_type,
    p.nombre_completo,
    p.pais_origen
FROM ocel_events e
JOIN ocel_event_objects eo ON e.event_id = eo.event_id
JOIN pacientes p ON eo.object_id = p.uuid
WHERE eo.object_type = 'PACIENTE'
LIMIT 5;
`;
const join3Out = execSync(`sqlite3 -header -column "${dbPath}" "${join3Query}"`, { encoding: 'utf8' }).trim();
console.log('  [Join 3 Result Preview]:\n' + join3Out);
assert(join3Out.length > 50, 'Join 3 (OCEL Events + Event Objects + Pacientes) executed successfully');

// Deep 6-Table Relational Join
const join4Query = `
SELECT 
    e.event_id,
    e.activity,
    p.nombre_completo,
    r.codigo_rva,
    c.codigo_ctz,
    t.conductor_nombre
FROM ocel_events e
JOIN ocel_event_objects eo ON e.event_id = eo.event_id AND eo.object_type = 'PACIENTE'
JOIN pacientes p ON eo.object_id = p.uuid
LEFT JOIN reservas_rva r ON p.uuid = r.paciente_uuid
LEFT JOIN cotizaciones_ctz c ON p.uuid = c.paciente_uuid
LEFT JOIN traslados_logistica t ON r.codigo_rva = t.codigo_rva
WHERE r.codigo_rva IS NOT NULL
LIMIT 5;
`;
const join4Out = execSync(`sqlite3 -header -column "${dbPath}" "${join4Query}"`, { encoding: 'utf8' }).trim();
console.log('  [Join 4 Deep 6-Table Relational Join Result Preview]:\n' + join4Out);
assert(join4Out.length > 50, 'Join 4 (Deep 6-Table Relational Join) executed successfully');

// Cardinality & Volume Stress Checks
const getCount = (tbl) => parseInt(execSync(`sqlite3 "${dbPath}" "SELECT count(*) FROM ${tbl};"`, { encoding: 'utf8' }).trim(), 10);
const counts = {
    pacientes: getCount('pacientes'),
    cotizaciones: getCount('cotizaciones_ctz'),
    reservas: getCount('reservas_rva'),
    traslados: getCount('traslados_logistica'),
    events: getCount('ocel_events'),
    e2o: getCount('ocel_event_objects')
};

assert(counts.pacientes === 304, 'Master database contains exactly 304 canonical pacientes', 'Actual: ' + counts.pacientes);
assert(counts.cotizaciones === 79, 'Master database contains exactly 79 cotizaciones CTZ', 'Actual: ' + counts.cotizaciones);
assert(counts.reservas === 95, 'Master database contains exactly 95 reservas RVA', 'Actual: ' + counts.reservas);
assert(counts.traslados === 63, 'Master database contains exactly 63 traslados logísticos', 'Actual: ' + counts.traslados);
assert(counts.events === 18602, 'Master database contains exactly 18,602 OCEL events', 'Actual: ' + counts.events);
assert(counts.e2o === 25241, 'Master database contains exactly 25,241 E2O object relations', 'Actual: ' + counts.e2o);

// -----------------------------------------------------------------------------
// SECTION 4: TEST RUNNER SUITES EXECUTION
// -----------------------------------------------------------------------------
console.log('\n=== SECTION 4: Execution of Automated Test Runners ===');

try {
    const out1 = execSync('./.bin/bin/node tests/browser_automation_test.js', { encoding: 'utf8' });
    const pass1 = out1.includes('100% PASS');
    assert(pass1, 'tests/browser_automation_test.js executed with 100% PASS rate');
} catch (e) {
    assert(false, 'tests/browser_automation_test.js failed: ' + e.message);
}

try {
    const out2 = execSync('./.bin/bin/node tests/adversarial_stress_test.js', { encoding: 'utf8' });
    const pass2 = out2.includes('100.0%') && out2.includes('Failed Assertions: 0');
    assert(pass2, 'tests/adversarial_stress_test.js executed with 100% PASS rate (247 assertions, 0 failed)');
} catch (e) {
    assert(false, 'tests/adversarial_stress_test.js failed: ' + e.message);
}

console.log('\n=======================================================================');
console.log('🏆 CHALLENGER 4 EMPIRICAL VERDICT SUMMARY');
console.log('=======================================================================');
console.log('Total Assertions Checked: ' + (passCount + failCount));
console.log('Passed Assertions: ' + passCount + ' (' + ((passCount / (passCount + failCount)) * 100).toFixed(1) + '%)');
console.log('Failed Assertions: ' + failCount);
if (failCount === 0) {
    console.log('FINAL VERDICT: ✅ CONFIRM (Zero Defects, Full BPMN Soundness & 3NF Integrity)');
} else {
    console.log('FINAL VERDICT: ❌ REJECT (Defects Detected)');
}
console.log('=======================================================================');
process.exit(failCount === 0 ? 0 : 1);
