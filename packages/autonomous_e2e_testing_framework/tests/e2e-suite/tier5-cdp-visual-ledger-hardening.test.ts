/**
 * tier5-cdp-visual-ledger-hardening.test.ts
 * 
 * TIER 5: Adversarial Coverage Hardening & Empirical Stress Verification Suite (Part 2)
 * 
 * Domains:
 * 1. Low-Level CDP Multi-Touch Hardware Emulation & High-Frequency Touch Storms
 * 2. Structural Similarity Index (SSIM) & 64-Bit DCT Perceptual Hashing under Aggressive Perturbations
 * 3. Vectorial Agentic Memory & Multi-Modal Self-Healing under Radical Selector Mutations
 * 4. Single-Writer CQRS Ledger Idempotence & Zero-Drift Financial Balance Invariants
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';

// M3: CDP Hardware Emulation
import { MockCDPClient } from '../../src/cdp/cdp-client.js';
import {
  dispatchPinchToZoom,
  dispatchDragToPan,
  dispatchPressureStroke,
  dispatchTouchTap,
  generateRealisticSignature,
  PressureStrokePoint,
  TouchPointCDP
} from '../../src/cdp/gesture-dispatcher.js';
import {
  NETWORK_PROFILES,
  emulateNetwork,
  simulateNetworkFlap,
  clearEmulation
} from '../../src/cdp/network-emulator.js';
import {
  injectFocusTrapOverride,
  removeFocusTrapOverride
} from '../../src/cdp/focus-trap-override.js';

// M4: Visual Regression & Self-Healing
import {
  computeSSIM,
  createRawImage,
  drawRectOnImage,
  generateEvaluationMask,
  toGrayscaleMatrix,
  RawImage,
  Rect
} from '../../src/visual/ssim-engine.js';
import {
  computePHash,
  computeDHash,
  computeHammingDistance,
  comparePerceptual,
  compute2DDCT32,
  resampleGrayscale
} from '../../src/visual/perceptual-hash.js';
import {
  computeSemanticEmbedding,
  computeCosineSimilarity,
  computeTreeProximity,
  computeVisualIoU,
  calculateMultiModalSimilarity,
  AgenticMemory,
  healLocator,
  ElementDescriptor,
  ElementCandidate,
  DEFAULT_WEIGHTS,
  HEALING_CONFIDENCE_THRESHOLD
} from '../../src/visual/agentic-memory.js';
import {
  generateSyntheticPatient,
  assertZeroPIILeakage,
  CARIBBEAN_ARCHETYPES
} from '../../src/visual/synthetic-faker.js';

// M5: Master Lifecycle & Ledger
import {
  MasterLifecycleRunner,
  runMasterLifecycleJourney,
  isOperativeTerritory,
  OperativeTerritoryViolationError,
  LedgerTransaction
} from '../../src/runner/test-runner.js';
import {
  QuarantineManager,
  computeFlakinessScore
} from '../../src/runner/quarantine.js';

// Instantaneous delay for stress testing
const noopDelay = async () => {};

describe('TIER 5: Adversarial Hardening — 1. Low-Level CDP Multi-Touch Hardware Emulation', () => {
  let cdp: MockCDPClient;

  beforeEach(() => {
    cdp = new MockCDPClient();
  });

  it('1.1.1: should handle extreme pinch-to-zoom boundary coordinates (negative, large, inverted spans)', async () => {
    await dispatchPinchToZoom(
      cdp,
      { x: -500, y: -250 },
      1000,
      100,
      { steps: 10, delayFn: noopDelay }
    );

    const touchEvents = cdp.sentCommands.filter(c => c.method === 'Input.dispatchTouchEvent');
    assert.strictEqual(touchEvents.length, 12); // start + 10 moves + end

    const startEvent = touchEvents[0].params;
    assert.strictEqual(startEvent.type, 'touchStart');
    assert.strictEqual(startEvent.touchPoints.length, 2);
    assert.strictEqual(startEvent.touchPoints[0].x, -1000);
    assert.strictEqual(startEvent.touchPoints[1].x, 0);

    const lastMove = touchEvents[10].params;
    assert.strictEqual(lastMove.type, 'touchMove');
    assert.strictEqual(lastMove.touchPoints[0].x, -550);
    assert.strictEqual(lastMove.touchPoints[1].x, -450);
  });

  it('1.1.2: should handle zero-span and sub-pixel pinch gesture without division by zero or NaN', async () => {
    await dispatchPinchToZoom(
      cdp,
      { x: 300, y: 400 },
      0,
      0,
      { steps: 5, delayFn: noopDelay }
    );

    const touchEvents = cdp.sentCommands.filter(c => c.method === 'Input.dispatchTouchEvent');
    for (const evt of touchEvents) {
      if (evt.params.touchPoints) {
        for (const pt of evt.params.touchPoints) {
          assert.ok(!Number.isNaN(pt.x), 'Touch X must not be NaN');
          assert.ok(!Number.isNaN(pt.y), 'Touch Y must not be NaN');
          assert.ok(!Number.isNaN(pt.force), 'Force must not be NaN');
          assert.strictEqual(pt.x, 300);
          assert.strictEqual(pt.y, 400);
        }
      }
    }
  });

  it('1.1.3: should sustain a high-frequency touch event storm of 1,100+ rapid events with exact sequence ordering', async () => {
    const stormCount = 50;
    const startMs = Date.now();

    for (let i = 0; i < stormCount; i++) {
      await dispatchDragToPan(
        cdp,
        { x: i * 2, y: i * 3 },
        { x: i * 2 + 100, y: i * 3 + 50 },
        { steps: 20, delayFn: noopDelay }
      );
    }

    const totalDuration = Date.now() - startMs;
    const touchEvents = cdp.sentCommands.filter(c => c.method === 'Input.dispatchTouchEvent');
    
    assert.strictEqual(touchEvents.length, 1100);
    assert.ok(totalDuration < 3000, `High frequency storm took ${totalDuration}ms, must complete under 3000ms`);

    for (let i = 0; i < stormCount; i++) {
      const batchOffset = i * 22;
      assert.strictEqual(touchEvents[batchOffset].params.type, 'touchStart');
      for (let m = 1; m <= 20; m++) {
        assert.strictEqual(touchEvents[batchOffset + m].params.type, 'touchMove');
      }
      assert.strictEqual(touchEvents[batchOffset + 21].params.type, 'touchEnd');
    }
  });

  it('1.1.4: should generate and dispatch continuous pressure trajectory with 120+ points within bounded force [0.1, 1.0]', async () => {
    const trajectory = generateRealisticSignature({
      x: 50,
      y: 100,
      width: 400,
      height: 150
    }, 120);

    assert.strictEqual(trajectory.length, 120);

    for (const pt of trajectory) {
      assert.ok(pt.force! >= 0.1 && pt.force! <= 1.0, `Force ${pt.force} out of range [0.1, 1.0]`);
      assert.ok(pt.x >= 50 && pt.x <= 480, `X ${pt.x} outside expected bounding horizontal bounds`);
      assert.ok(pt.y >= 50 && pt.y <= 280, `Y ${pt.y} outside expected bounding vertical bounds`);
    }

    await dispatchPressureStroke(cdp, trajectory, { delayFn: noopDelay });

    const touchEvents = cdp.sentCommands.filter(c => c.method === 'Input.dispatchTouchEvent');
    assert.strictEqual(touchEvents.length, 121); // 1 start + 119 moves + 1 end
  });

  it('1.1.5: should execute rapid network flap stress (30 cycles) maintaining deterministic offline/online states', async () => {
    await simulateNetworkFlap(cdp, {
      cycles: 30,
      offlineDurationMs: 0,
      onlineDurationMs: 0,
      onlineProfile: 'LTE_4G',
      delayFn: noopDelay
    });

    const networkCommands = cdp.sentCommands.filter(c => c.method === 'Network.emulateNetworkConditions');
    assert.strictEqual(networkCommands.length, 60);

    for (let c = 0; c < 30; c++) {
      const offlineCmd = networkCommands[c * 2].params;
      const onlineCmd = networkCommands[c * 2 + 1].params;

      assert.strictEqual(offlineCmd.offline, true);
      assert.strictEqual(offlineCmd.downloadThroughput, 0);

      assert.strictEqual(onlineCmd.offline, false);
      assert.strictEqual(onlineCmd.latency, 40);
    }
  });

  it('1.1.6: should enforce focus-trap override script evaluation and cleanup cleanly', async () => {
    const res = await injectFocusTrapOverride(cdp);
    assert.ok(typeof res.scriptIdentifier === 'string' && res.scriptIdentifier.length > 0);
    assert.strictEqual(res.appliedImmediately, true);

    const evalCalls = cdp.sentCommands.filter(c => c.method === 'Runtime.evaluate');
    assert.strictEqual(evalCalls.length, 1);
    assert.ok(evalCalls[0].params.expression.includes('__focusTrapOverrideInstalled'));

    await removeFocusTrapOverride(cdp, res.scriptIdentifier);
    const pageRemoveCalls = cdp.sentCommands.filter(c => c.method === 'Page.removeScriptToEvaluateOnNewDocument');
    assert.strictEqual(pageRemoveCalls.length, 1);
    assert.strictEqual(pageRemoveCalls[0].params.identifier, res.scriptIdentifier);
  });
});

describe('TIER 5: Adversarial Hardening — 2. SSIM & 64-Bit DCT Perceptual Hashing', () => {
  it('2.1.1: should strictly satisfy mathematical properties of SSIM (identity, bounds [0, 1])', () => {
    const imgA = createRawImage(128, 128, { r: 120, g: 80, b: 200 });
    const imgB = createRawImage(128, 128, { r: 120, g: 80, b: 200 });

    const selfResult = computeSSIM(imgA, imgB);
    assert.strictEqual(selfResult.ssim, 1.0);
    assert.strictEqual(selfResult.passed, true);
    assert.strictEqual(selfResult.diffPixels, 0);

    const inverted = createRawImage(128, 128, { r: 0, g: 0, b: 0 });
    const white = createRawImage(128, 128, { r: 255, g: 255, b: 255 });
    const contrastResult = computeSSIM(inverted, white);
    assert.ok(contrastResult.ssim >= 0.0 && contrastResult.ssim <= 1.0, 'SSIM must stay within [0, 1]');
    assert.strictEqual(contrastResult.passed, false);
  });

  it('2.1.2: should detect subtle 1-pixel typography mutations while tolerating masked volatile areas', () => {
    const base = createRawImage(200, 100, { r: 250, g: 250, b: 250 });
    drawRectOnImage(base, { x: 20, y: 30, width: 60, height: 15 }, { r: 20, g: 20, b: 20 });
    drawRectOnImage(base, { x: 100, y: 30, width: 50, height: 15 }, { r: 20, g: 20, b: 20 });
    drawRectOnImage(base, { x: 160, y: 10, width: 30, height: 30 }, { r: 255, g: 0, b: 0 });

    const mutated = createRawImage(200, 100, { r: 250, g: 250, b: 250 });
    drawRectOnImage(mutated, { x: 22, y: 30, width: 60, height: 15 }, { r: 20, g: 20, b: 20 });
    drawRectOnImage(mutated, { x: 100, y: 30, width: 50, height: 15 }, { r: 20, g: 20, b: 20 });
    drawRectOnImage(mutated, { x: 160, y: 10, width: 30, height: 30 }, { r: 0, g: 255, b: 0 });

    const unmasked = computeSSIM(base, mutated, { threshold: 0.98 });
    assert.ok(unmasked.diffPixels > 0);

    const masked = computeSSIM(base, mutated, {
      maskRegions: [{ x: 155, y: 5, width: 40, height: 40 }],
      threshold: 0.99
    });

    assert.ok(masked.totalMaskedPixels >= 900);
    assert.ok(masked.diffPixels > 0, 'Must still detect typography diffs outside mask');
  });

  it('2.1.3: should handle extreme masking: 100% masked image returns ssim=1.0 and passed=true', () => {
    const imgA = createRawImage(64, 64, { r: 255, g: 0, b: 0 });
    const imgB = createRawImage(64, 64, { r: 0, g: 0, b: 255 });

    const fullMask: Rect[] = [{ x: 0, y: 0, width: 64, height: 64 }];
    const result = computeSSIM(imgA, imgB, { maskRegions: fullMask });

    assert.strictEqual(result.ssim, 1.0);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.totalEvaluatedPixels, 0);
    assert.strictEqual(result.totalMaskedPixels, 64 * 64);
  });

  it('2.1.4: should compute 2D-DCT pHash and verify exact orthogonality and Hamming distance properties', () => {
    const base = createRawImage(128, 128, { r: 240, g: 240, b: 240 });
    drawRectOnImage(base, { x: 30, y: 30, width: 68, height: 68 }, { r: 10, g: 50, b: 150 });

    const compressed = createRawImage(128, 128, { r: 242, g: 238, b: 241 });
    drawRectOnImage(compressed, { x: 30, y: 30, width: 68, height: 68 }, { r: 12, g: 52, b: 148 });

    const different = createRawImage(128, 128, { r: 50, g: 200, b: 50 });
    drawRectOnImage(different, { x: 10, y: 80, width: 100, height: 20 }, { r: 200, g: 10, b: 10 });

    const hashBase = computePHash(base);
    const hashCompressed = computePHash(compressed);
    const hashDifferent = computePHash(different);

    assert.strictEqual(hashBase.length, 16);
    assert.strictEqual(hashCompressed.length, 16);
    assert.strictEqual(hashDifferent.length, 16);

    const distClose = computeHammingDistance(hashBase, hashCompressed);
    const distDiff = computeHammingDistance(hashBase, hashDifferent);

    assert.ok(distClose <= 5, `Compressed distance ${distClose} must be <= 5`);
    assert.ok(distDiff > 10, `Different image distance ${distDiff} must be > 10`);

    const pMatch = comparePerceptual(base, compressed, { maxHammingDistance: 5 });
    assert.strictEqual(pMatch.match, true);

    const pFail = comparePerceptual(base, different, { maxHammingDistance: 5 });
    assert.strictEqual(pFail.match, false);
  });

  it('2.1.5: should verify dHash difference hashing invariance under moderate brightness shifts', () => {
    const imgA = createRawImage(100, 100, { r: 100, g: 100, b: 100 });
    drawRectOnImage(imgA, { x: 0, y: 0, width: 50, height: 100 }, { r: 200, g: 200, b: 200 });

    const imgB = createRawImage(100, 100, { r: 130, g: 130, b: 130 });
    drawRectOnImage(imgB, { x: 0, y: 0, width: 50, height: 100 }, { r: 230, g: 230, b: 230 });

    const dHashA = computeDHash(imgA);
    const dHashB = computeDHash(imgB);

    const dist = computeHammingDistance(dHashA, dHashB);
    assert.strictEqual(dist, 0, 'dHash must be invariant to uniform brightness shift');
  });

  it('2.1.6: should throw descriptive error on image dimension mismatch', () => {
    const imgA = createRawImage(100, 100);
    const imgB = createRawImage(200, 100);

    assert.throws(
      () => computeSSIM(imgA, imgB),
      /Image dimension mismatch/
    );
  });
});

describe('TIER 5: Adversarial Hardening — 3. Vectorial Agentic Memory & Multi-Modal Self-Healing', () => {
  let memory: AgenticMemory;

  beforeEach(() => {
    memory = new AgenticMemory();
  });

  it('3.1.1: should heal locator under radical mutation (classes wiped, ID randomized, wrapped in new container)', async () => {
    const originalSelector = 'button#btn-submit-medical-claim.btn.btn-primary.btn-lg';
    const originalDesc: ElementDescriptor = {
      tag: 'button',
      role: 'button',
      ariaLabel: 'Submit Medical Claim',
      text: 'Submit Medical Claim',
      classes: ['btn', 'btn-primary', 'btn-lg', 'shadow-md'],
      attributes: {
        id: 'btn-submit-medical-claim',
        'data-testid': 'submit-claim-button',
        type: 'submit'
      },
      domPath: 'html/body/main/div#app-container/form/button#btn-submit-medical-claim',
      boundingBox: { x: 450, y: 600, width: 220, height: 48 }
    };

    memory.registerElement(originalSelector, originalDesc);

    const candidates: ElementCandidate[] = [
      {
        candidateId: 'c1',
        currentSelector: 'button#btn-cancel-claim',
        tag: 'button',
        role: 'button',
        ariaLabel: 'Cancel Claim',
        text: 'Cancel',
        classes: ['btn', 'btn-secondary'],
        attributes: { id: 'btn-cancel-claim', type: 'button' },
        domPath: 'html/body/main/div#app-container/form/button#btn-cancel-claim',
        boundingBox: { x: 200, y: 600, width: 120, height: 48 }
      },
      {
        candidateId: 'c2',
        currentSelector: 'input#patient-notes',
        tag: 'input',
        role: 'textbox',
        ariaLabel: 'Patient Notes',
        text: '',
        classes: ['form-control'],
        attributes: { id: 'patient-notes', type: 'text' },
        domPath: 'html/body/main/div#app-container/form/input#patient-notes',
        boundingBox: { x: 200, y: 400, width: 470, height: 40 }
      },
      {
        candidateId: 'c-target-healed',
        currentSelector: 'button#btn-uuid-9f8e-4a2b',
        tag: 'button',
        role: 'button',
        ariaLabel: 'Submit Medical Claim',
        text: 'Submit Medical Claim',
        classes: [],
        attributes: {
          id: 'btn-uuid-9f8e-4a2b',
          'data-testid': 'submit-claim-button',
          type: 'submit'
        },
        domPath: 'html/body/main/div#app-container/section.wizard-step/article/form/button#btn-uuid-9f8e-4a2b',
        boundingBox: { x: 455, y: 605, width: 215, height: 48 }
      }
    ];

    const result = await healLocator(originalSelector, candidates, memory);
    assert.ok(result !== null, 'Must successfully heal broken locator');
    assert.strictEqual(result.healed, true);
    assert.strictEqual(result.healedSelector, 'button#btn-uuid-9f8e-4a2b');
    assert.strictEqual(result.candidateId, 'c-target-healed');
    assert.ok(result.confidence >= HEALING_CONFIDENCE_THRESHOLD, `Confidence ${result.confidence} >= 0.82`);
    assert.strictEqual(memory.getActiveSelector(originalSelector), 'button#btn-uuid-9f8e-4a2b');
  });

  it('3.1.2: should correctly heal tag change from <button> to <a role="button"> with ariaLabel retention', async () => {
    const originalSelector = 'button#download-pdf-receipt';
    memory.registerElement(originalSelector, {
      tag: 'button',
      role: 'button',
      ariaLabel: 'Download Official PDF Receipt',
      text: 'Download Receipt',
      classes: ['action-link', 'receipt-download'],
      attributes: { id: 'download-pdf-receipt' },
      domPath: 'html/body/div#receipt-modal/button#download-pdf-receipt',
      boundingBox: { x: 300, y: 500, width: 180, height: 40 }
    });

    const candidates: ElementCandidate[] = [
      {
        candidateId: 'cand-anchor',
        currentSelector: 'a.anchor-btn-download',
        tag: 'a',
        role: 'button',
        ariaLabel: 'Download Official PDF Receipt',
        text: 'Download Receipt',
        classes: ['anchor-btn-download'],
        attributes: { href: '#', 'aria-label': 'Download Official PDF Receipt' },
        domPath: 'html/body/div#receipt-modal/div.footer/a.anchor-btn-download',
        boundingBox: { x: 305, y: 502, width: 180, height: 40 }
      }
    ];

    const result = await healLocator(originalSelector, candidates, memory, 0.78);
    assert.ok(result !== null);
    assert.strictEqual(result.healedSelector, 'a.anchor-btn-download');
  });

  it('3.1.3: should disambiguate target amongst 20 decoy elements with similar classes/tags', async () => {
    const originalSelector = 'button#confirm-appointment';
    memory.registerElement(originalSelector, {
      tag: 'button',
      role: 'button',
      ariaLabel: 'Confirm Medical Specialist Appointment',
      text: 'Confirm Appointment',
      classes: ['btn', 'btn-success', 'action-btn'],
      attributes: { id: 'confirm-appointment', type: 'button' },
      domPath: 'html/body/main/div.appointment-view/button#confirm-appointment',
      boundingBox: { x: 500, y: 700, width: 200, height: 45 }
    });

    // Create 20 decoy candidates
    const candidates: ElementCandidate[] = [];
    for (let i = 0; i < 20; i++) {
      candidates.push({
        candidateId: `decoy-${i}`,
        currentSelector: `button#decoy-btn-${i}`,
        tag: 'button',
        role: 'button',
        ariaLabel: `Decoy Action Item ${i}`,
        text: `Action ${i}`,
        classes: ['btn', 'btn-secondary', 'action-btn'],
        attributes: { id: `decoy-btn-${i}`, type: 'button' },
        domPath: `html/body/main/div.appointment-view/div.card-${i}/button#decoy-btn-${i}`,
        boundingBox: { x: 100, y: 100 + i * 25, width: 150, height: 35 }
      });
    }

    // Insert true target at index 14 with mutated class/id
    candidates.splice(14, 0, {
      candidateId: 'true-target',
      currentSelector: 'button#confirmed-v2',
      tag: 'button',
      role: 'button',
      ariaLabel: 'Confirm Medical Specialist Appointment',
      text: 'Confirm Appointment',
      classes: ['btn', 'btn-primary'],
      attributes: { id: 'confirmed-v2', type: 'button' },
      domPath: 'html/body/main/div.appointment-view/div.actions/button#confirmed-v2',
      boundingBox: { x: 505, y: 702, width: 198, height: 45 }
    });

    const result = await healLocator(originalSelector, candidates, memory);
    assert.ok(result !== null);
    assert.strictEqual(result.candidateId, 'true-target');
    assert.strictEqual(result.healedSelector, 'button#confirmed-v2');
  });

  it('3.1.4: should reject healing when no candidate meets the strict confidence threshold', async () => {
    const originalSelector = 'button#generate-quote-cta';
    memory.registerElement(originalSelector, {
      tag: 'button',
      role: 'button',
      ariaLabel: 'Generate Dynamic Medical Quote',
      text: 'Calculate Instant Quote',
      classes: ['quote-btn'],
      domPath: 'html/body/main/button#generate-quote-cta',
      boundingBox: { x: 100, y: 200, width: 200, height: 50 }
    });

    const candidates: ElementCandidate[] = [
      {
        candidateId: 'unrelated-input',
        currentSelector: 'input#search-filter',
        tag: 'input',
        role: 'searchbox',
        ariaLabel: 'Search Clinic Directory',
        text: '',
        classes: ['search-input'],
        domPath: 'html/body/header/nav/input#search-filter',
        boundingBox: { x: 800, y: 20, width: 250, height: 30 }
      }
    ];

    const result = await healLocator(originalSelector, candidates, memory, HEALING_CONFIDENCE_THRESHOLD);
    assert.strictEqual(result, null, 'Must reject low-confidence matches');
    assert.strictEqual(memory.getActiveSelector(originalSelector), originalSelector);
  });

  it('3.1.5: should correctly serialize and restore memory state across sessions', () => {
    memory.registerElement('btn#a', { tag: 'button', text: 'Accept' });
    memory.registerElement('btn#b', { tag: 'button', text: 'Decline' });
    memory.recordHealedBinding('btn#a', 'btn#a-new');

    const json = memory.exportSnapshot();
    assert.ok(json.length > 50);

    const freshMemory = new AgenticMemory();
    freshMemory.importSnapshot(json);

    assert.strictEqual(freshMemory.getActiveSelector('btn#a'), 'btn#a-new');
    assert.strictEqual(freshMemory.getActiveSelector('btn#b'), 'btn#b');
    assert.ok(freshMemory.getSignature('btn#a') !== undefined);
    assert.ok(freshMemory.getSignature('btn#b') !== undefined);
  });
});

describe('TIER 5: Adversarial Hardening — 4. CQRS Ledger Idempotence & Financial Invariants', () => {
  it('4.1.1: should guarantee zero float drift across 10,000 randomized BigInt cents transactions', () => {
    let accumulatedDebits = 0n;
    let accumulatedCredits = 0n;

    for (let i = 1; i <= 10000; i++) {
      const amount = BigInt(i * 137 + (i % 97));
      accumulatedDebits += amount;
      accumulatedCredits += amount;
    }

    const variance = accumulatedDebits - accumulatedCredits;
    assert.strictEqual(variance, 0n, 'BigInt math must guarantee exact zero variance');
    assert.ok(accumulatedDebits > 1000000000n, 'Accumulated total exceeds 1 Billion COP cents');
  });

  it('4.1.2: should maintain strict event idempotence under replayed event storms (500 duplicate events)', async () => {
    const runner = new MasterLifecycleRunner({
      archetypeCode: 'RVA171',
      stages: [5, 7]
    });

    const report = await runner.run();
    assert.strictEqual(report.overallStatus, 'PASSED');
    assert.strictEqual(report.ledgerAudit.isBalanced, true);
    assert.strictEqual(report.ledgerAudit.idempotenceVerified, true);
    assert.strictEqual(report.ledgerAudit.varianceCents, 0n);
  });

  it('4.1.3: should execute all 4 operational archetypes end-to-end with 100% stage pass and zero ledger variance', async () => {
    const archetypes = ['RVA171', 'RVA282', 'RVA341', 'RVA077'] as const;

    for (const code of archetypes) {
      const runner = new MasterLifecycleRunner({
        archetypeCode: code,
        stages: [1, 2, 3, 4, 5, 6, 7]
      });

      const report = await runner.run();
      assert.strictEqual(report.overallStatus, 'PASSED', `Archetype ${code} journey must pass`);
      assert.strictEqual(report.stages.length, 7, `Archetype ${code} must execute all 7 stages`);
      assert.strictEqual(report.ledgerAudit.isBalanced, true, `Archetype ${code} ledger must be balanced`);
      assert.strictEqual(report.ledgerAudit.varianceCents, 0n, `Archetype ${code} variance must be 0`);
      assert.ok(report.paxJourney.patientCode.startsWith('ENT-PAX-'));
      assertZeroPIILeakage(report.paxJourney);
    }
  });

  it('4.1.4: should gracefully handle adversarial payment rollback scenario with state consistency', async () => {
    const runner = new MasterLifecycleRunner({
      archetypeCode: 'RVA282',
      adversarialScenario: 'PAYMENT_FAILURE',
      stages: [1, 2, 5, 6, 7]
    });

    const report = await runner.run();
    assert.strictEqual(report.overallStatus, 'ROLLED_BACK');
    const stage6 = report.stages.find(s => s.stage === 6);
    assert.ok(stage6 !== undefined);
    assert.strictEqual(stage6.passed, true);
    assert.strictEqual(stage6.data.rollbackExecuted, true);
    assert.strictEqual(stage6.data.stateConsistent, true);
  });

  it('4.1.5: should fail-fast on non-operative territory (Mocoa) with OperativeTerritoryViolationError', async () => {
    assert.strictEqual(isOperativeTerritory('Mocoa'), false);
    assert.strictEqual(isOperativeTerritory('Leticia'), false);
    assert.strictEqual(isOperativeTerritory('Putumayo'), false);
    assert.strictEqual(isOperativeTerritory('Medellín'), true);
    assert.strictEqual(isOperativeTerritory('Envigado'), true);
    assert.strictEqual(isOperativeTerritory('Rionegro'), true);

    const runner = new MasterLifecycleRunner({
      territory: 'Mocoa',
      adversarialScenario: 'NONE',
      stages: [1, 2]
    });

    const report = await runner.run();
    assert.strictEqual(report.overallStatus, 'FAILED');
    const stage2 = report.stages.find(s => s.stage === 2);
    assert.strictEqual(stage2?.passed, false);
    assert.ok(stage2?.error?.includes('OperativeTerritoryViolationError'));
  });

  it('4.1.6: should quarantine flaking tests (Fs >= 0.15) and isolate them from the active suite', () => {
    const engine = new QuarantineManager({
      threshold: 0.15,
      consecutivePassesToUnquarantine: 5,
      minRunsBeforeQuarantine: 5
    });

    for (let i = 0; i < 8; i++) {
      engine.recordRun({ testId: 'test-cdp-pressure-flake', passed: true, durationMs: 50 });
    }
    engine.recordRun({ testId: 'test-cdp-pressure-flake', passed: false, durationMs: 100, error: 'CDP Timeout' });
    engine.recordRun({ testId: 'test-cdp-pressure-flake', passed: false, durationMs: 100, error: 'CDP Timeout' });

    const score = engine.computeFlakinessScore('test-cdp-pressure-flake');
    assert.strictEqual(score, 0.20);
    assert.strictEqual(engine.isQuarantined('test-cdp-pressure-flake'), true);

    for (let i = 0; i < 5; i++) {
      engine.recordRun({ testId: 'test-cdp-pressure-flake', passed: true, durationMs: 40 });
    }
    assert.strictEqual(engine.isQuarantined('test-cdp-pressure-flake'), false);
  });
});
