/**
 * m1-perception-routing.test.ts
 * Rigorous test suite for Milestone 1:
 * - Stagehand DOM Trimming & AXTree Compression
 * - Set-of-Marks Visual Coordinate Grounding
 * - Multi-Modal Context Routing
 * - Playwright MCP Protocol Action Dispatching
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  trimDOM,
  parseHTMLToDOMTree,
  extractAXTree,
  compressToTokenBudget
} from '../src/perception/dom-trimmer.js';

import {
  resolveNormalizedToPixels,
  resolvePixelsToNormalized,
  resolveVisualCoordinates,
  generateSetOfMarksOverlay,
  findMark,
  computeBoundingBoxIoU,
  clampCoordinates
} from '../src/perception/set-of-marks.js';

import {
  ContextRouter,
  routeAction,
  AppState
} from '../src/perception/context-router.js';

import {
  PlaywrightMCPDispatcher,
  MockBrowserDriver,
  PLAYWRIGHT_MCP_TOOLS
} from '../src/perception/mcp-protocol.js';

test('M1: Stagehand DOM Trimmer prunes invisible nodes and extracts AXTree', () => {
  const sampleHtml = `
    <div id="app" style="width: 1200px; height: 800px;">
      <header>
        <h1>Medical Trip Itinerary Dashboard</h1>
        <button id="btn-refresh" aria-label="Refresh Data">Refresh</button>
      </header>
      <main>
        <form id="patient-form">
          <input type="text" id="pax-name" name="paxName" placeholder="Patient Full Name" value="Catia Van Der Berg" />
          <select id="territory-select" aria-label="Territory Selection">
            <option value="MEDELLIN">Medellín</option>
            <option value="BOGOTA">Bogotá</option>
            <option value="CALI">Cali</option>
          </select>
          <button type="submit" id="btn-save-itinerary">Guardar Itinerario</button>
        </form>

        <!-- Hidden / Invisible nodes that MUST be pruned -->
        <div style="display: none;">
          <button id="secret-debug-btn">Debug</button>
        </div>
        <div style="visibility: hidden;">
          <input type="text" id="hidden-input" />
        </div>
        <div style="opacity: 0;">
          <a href="/legacy">Legacy Link</a>
        </div>
        <div aria-hidden="true">
          <button>Aria Hidden</button>
        </div>

        <!-- Canvas Signature Pad -->
        <div class="signature-section">
          <label>Firma Digital del Paciente:</label>
          <canvas id="signature-canvas" width="400" height="200" data-x="100" data-y="500" data-w="400" data-h="200"></canvas>
        </div>
      </main>
    </div>
  `;

  const snapshot = trimDOM(sampleHtml, { maxTokens: 400 });

  // 1. Assert snapshot structure
  assert.ok(snapshot.timestamp);
  assert.ok(snapshot.tokenCount > 0 && snapshot.tokenCount <= 400);
  assert.ok(snapshot.interactiveElements.length > 0);
  assert.ok(snapshot.rawTrimRatio > 0.3); // Compressed significantly

  // 2. Verify all extracted elements have alphanumeric IDs [e1], [e2]...
  const ids = snapshot.interactiveElements.map(el => el.elementId);
  assert.deepEqual(ids, ['e1', 'e2', 'e3', 'e4', 'e5']);

  // 3. Verify visible interactive elements are present
  const names = snapshot.interactiveElements.map(el => el.name);
  assert.ok(names.includes('Refresh Data'));
  assert.ok(names.includes('Patient Full Name') || names.includes('Catia Van Der Berg'));
  assert.ok(names.includes('Territory Selection'));
  assert.ok(names.includes('Guardar Itinerario'));

  // 4. Verify invisible nodes were completely pruned
  const allNames = names.join(' ');
  assert.ok(!allNames.includes('Debug'));
  assert.ok(!allNames.includes('Legacy Link'));
  assert.ok(!allNames.includes('Aria Hidden'));

  // 5. Verify canvas element is recognized as visual surface
  const canvasEl = snapshot.interactiveElements.find(el => el.tagName === 'canvas');
  assert.ok(canvasEl);
  assert.equal(canvasEl.isCanvasOrVisual, true);
});

test('M1: Stagehand DOM Trimmer adheres to strict 200-400 token compression budget', () => {
  // Generate heavy DOM with 200 items
  let hugeHtml = '<div class="data-grid">';
  for (let i = 1; i <= 200; i++) {
    hugeHtml += `
      <div class="row">
        <span>Patient Record #${i}</span>
        <button id="btn-edit-${i}">Edit Record ${i}</button>
        <button id="btn-del-${i}">Delete Record ${i}</button>
      </div>`;
  }
  hugeHtml += '</div>';

  const snapshot = trimDOM(hugeHtml, { maxTokens: 350 });

  // Assert token count is constrained
  assert.ok(snapshot.tokenCount <= 380, `Token count ${snapshot.tokenCount} exceeded budget`);
  assert.ok(snapshot.interactiveElements.length >= 5);
  assert.ok(snapshot.summaryText.includes('trimmed') || snapshot.tokenCount <= 350);
});

test('M1: Set-of-Marks coordinate resolution and viewport pixel transformations', () => {
  const viewport = { width: 1920, height: 1080 };

  // Normalized coordinate in center
  const normBBox = { x: 0.25, y: 0.20, width: 0.50, height: 0.60 };
  const pixelBBox = resolveNormalizedToPixels(normBBox, viewport);

  assert.equal(pixelBBox.x, 480);
  assert.equal(pixelBBox.y, 216);
  assert.equal(pixelBBox.width, 960);
  assert.equal(pixelBBox.height, 648);
  assert.equal(pixelBBox.centerX, 960);
  assert.equal(pixelBBox.centerY, 540);

  // Roundtrip conversion
  const backToNorm = resolvePixelsToNormalized(pixelBBox, viewport);
  assert.equal(backToNorm.x, 0.25);
  assert.equal(backToNorm.y, 0.20);
  assert.equal(backToNorm.width, 0.50);
  assert.equal(backToNorm.height, 0.60);

  // Coordinate resolver
  const coords = resolveVisualCoordinates(1, normBBox, viewport);
  assert.equal(coords.x, 960);
  assert.equal(coords.y, 540);

  // Viewport clamping
  const outOfBounds = { x: -50, y: 1200 };
  const clamped = clampCoordinates(outOfBounds, viewport);
  assert.equal(clamped.x, 0);
  assert.equal(clamped.y, 1080);
});

test('M1: Set-of-Marks overlay generation and query lookup', () => {
  const viewport = { width: 1280, height: 800 };
  const candidates = [
    {
      label: 'Digital Signature Canvas',
      category: 'signature_pad' as const,
      pixelBBox: { x: 100, y: 400, width: 300, height: 150 },
      confidence: 0.98
    },
    {
      label: 'Split Timeline Navigation Node 1',
      category: 'canvas_drawing' as const,
      normalizedBBox: { x: 0.05, y: 0.10, width: 0.15, height: 0.08 },
      confidence: 0.92
    },
    {
      label: 'Interactive Settlement Bar Chart',
      category: 'webgl_element' as const,
      pixelBBox: { x: 600, y: 100, width: 500, height: 300 },
      confidence: 0.95
    }
  ];

  const somResult = generateSetOfMarksOverlay(candidates, viewport);

  assert.equal(somResult.totalMarks, 3);
  assert.equal(somResult.canvasMarksCount, 3);
  assert.equal(somResult.marks[0].markId, 1);
  assert.equal(somResult.marks[0].centroid.x, 250);
  assert.equal(somResult.marks[0].centroid.y, 475);

  // Find mark by ID
  const mark1 = findMark(somResult, { markId: 1 });
  assert.ok(mark1);
  assert.equal(mark1.label, 'Digital Signature Canvas');

  // Find mark by substring
  const markTimeline = findMark(somResult, { label: 'Timeline Navigation' });
  assert.ok(markTimeline);
  assert.equal(markTimeline.markId, 2);

  // Find mark by proximity
  const nearest = findMark(somResult, { nearCoords: { x: 260, y: 480 }, maxDistancePx: 50 });
  assert.ok(nearest);
  assert.equal(nearest.markId, 1);

  // IoU calculation
  const boxA = { x: 100, y: 100, width: 200, height: 200 };
  const boxB = { x: 150, y: 150, width: 200, height: 200 };
  const iou = computeBoundingBoxIoU(boxA, boxB);
  assert.ok(iou > 0.2 && iou < 0.4);
});

test('M1: Context Router dispatches between AX_DOM_ROUTE, VLM_VISUAL_ROUTE and HYBRID_FALLBACK', () => {
  const sampleHtml = `
    <div>
      <button id="btn-submit" aria-label="Confirmar Cotizacion">Confirmar</button>
      <input id="txt-amount" aria-label="Monto Anticipo" value="500000" />
      <canvas id="sig-pad" width="300" height="150" data-x="100" data-y="300" data-w="300" data-h="150"></canvas>
    </div>
  `;
  const axSnapshot = trimDOM(sampleHtml);
  const visualMarks = generateSetOfMarksOverlay([
    {
      label: 'Patient Signature Pad',
      category: 'signature_pad',
      pixelBBox: { x: 100, y: 300, width: 300, height: 150 },
      confidence: 0.99
    }
  ]);

  const state: AppState = {
    currentUrl: 'http://localhost:3000/itinerario',
    axSnapshot,
    visualMarks
  };

  const router = new ContextRouter();

  // 1. Standard semantic button -> AX_DOM_ROUTE
  const decisionBtn = router.routeAction(state, { name: 'Confirmar Cotizacion' });
  assert.equal(decisionBtn.route, 'AX_DOM_ROUTE');
  assert.ok(decisionBtn.targetElementId);
  assert.ok(decisionBtn.confidence >= 0.9);

  // 2. Canvas Signature Pad -> VLM_VISUAL_ROUTE
  const decisionCanvas = router.routeAction(state, { tagName: 'canvas', name: 'Patient Signature Pad' });
  assert.equal(decisionCanvas.route, 'VLM_VISUAL_ROUTE');
  assert.ok(decisionCanvas.targetCoords);
  assert.equal(decisionCanvas.targetMarkId, 1);

  // 3. Explicit Mark ID -> VLM_VISUAL_ROUTE
  const decisionMark = router.routeAction(state, { markId: 1, isVisualTarget: true });
  assert.equal(decisionMark.route, 'VLM_VISUAL_ROUTE');
  assert.equal(decisionMark.targetMarkId, 1);

  // 4. Missing target in mutated DOM -> HYBRID_FALLBACK
  const decisionMissing = router.routeAction(state, { name: 'Non Existent Element' });
  assert.equal(decisionMissing.route, 'HYBRID_FALLBACK');
  assert.ok(decisionMissing.confidence < 0.8);

  // Check history recording
  assert.equal(router.getHistory().length, 4);
});

test('M1: Playwright MCP Action Protocol executes tools against Browser Driver', async () => {
  const driver = new MockBrowserDriver();
  const dispatcher = new PlaywrightMCPDispatcher(driver);

  // List tools
  const tools = dispatcher.listTools();
  assert.equal(tools.length, 8);
  assert.ok(tools.some(t => t.name === 'playwright_click'));
  assert.ok(tools.some(t => t.name === 'playwright_touch_pinch'));

  // 1. Dispatch click
  const clickRes = await dispatcher.dispatch({
    name: 'playwright_click',
    arguments: { elementId: 'e1' }
  });
  assert.equal(clickRes.toolResult.success, true);
  assert.equal(driver.actionLog[0].action, 'click');

  // 2. Dispatch type
  const typeRes = await dispatcher.dispatch({
    name: 'playwright_type',
    arguments: { elementId: 'e2', text: 'George Cardio 5D' }
  });
  assert.equal(typeRes.toolResult.success, true);
  assert.equal(driver.actionLog[1].action, 'type');

  // 3. Dispatch touch pinch
  const pinchRes = await dispatcher.dispatch({
    name: 'playwright_touch_pinch',
    arguments: { centerX: 500, centerY: 400, initialSpan: 100, finalSpan: 250, durationMs: 400 }
  });
  assert.equal(pinchRes.toolResult.success, true);
  assert.equal(driver.actionLog[2].action, 'touchPinch');

  // 4. Dispatch touch pan
  const panRes = await dispatcher.dispatch({
    name: 'playwright_touch_pan',
    arguments: { startX: 100, startY: 200, endX: 100, endY: 500, durationMs: 300 }
  });
  assert.equal(panRes.toolResult.success, true);
  assert.equal(driver.actionLog[3].action, 'touchPan');

  // 5. Dispatch evaluate script
  const evalRes = await dispatcher.dispatch({
    name: 'playwright_evaluate',
    arguments: { script: 'return 42;' }
  });
  assert.equal(evalRes.toolResult.success, true);
  assert.equal(evalRes.toolResult.data, 42);

  // 6. Error handling for missing required argument
  const invalidRes = await dispatcher.dispatch({
    name: 'playwright_type',
    arguments: {} // missing text
  });
  assert.equal(invalidRes.toolResult.success, false);
  assert.ok(invalidRes.toolResult.error?.includes('requires "text"'));
});
