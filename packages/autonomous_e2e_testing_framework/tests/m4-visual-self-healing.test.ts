/**
 * Test Suite: Milestone 4 - Resilient Self-Healing & Visual Regression Engine
 * 
 * Verifies 384-dimensional vectorial agentic memory, multi-modal similarity S(c, tau),
 * locator self-healing, SSIM with dynamic ROI masking, 64-bit DCT perceptual hashing,
 * and 100% PII/PHI-safe Caribbean synthetic data generator in BigInt integer cents.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  AgenticMemory,
  computeSemanticEmbedding,
  computeCosineSimilarity,
  computeTreeProximity,
  computeVisualIoU,
  calculateMultiModalSimilarity,
  healLocator,
  EMBEDDING_DIMENSION
} from '../src/visual/agentic-memory.js';
import {
  computeSSIM,
  createRawImage,
  drawRectOnImage
} from '../src/visual/ssim-engine.js';
import {
  computePHash,
  computeDHash,
  computeHammingDistance,
  comparePerceptual
} from '../src/visual/perceptual-hash.js';
import {
  generateSyntheticPatient,
  generateSyntheticPatientCode,
  generateSaltedPassportHash,
  assertZeroPIILeakage
} from '../src/visual/synthetic-faker.js';

describe('M4: Vectorial Agentic Memory & Locator Self-Healing', () => {
  it('should generate 384-dimensional L2-normalized semantic embedding vectors', () => {
    const element = {
      tag: 'button',
      role: 'button',
      ariaLabel: 'Confirm Medical Quote',
      text: 'Confirm & Sign',
      classes: ['btn', 'btn-primary', 'action-confirm'],
      attributes: { 'data-testid': 'btn-confirm-quote' },
      domPath: 'html/body/div#app/main/div.modal/button',
      boundingBox: { x: 100, y: 500, width: 200, height: 48 }
    };

    const embedding = computeSemanticEmbedding(element);
    assert.equal(embedding.length, EMBEDDING_DIMENSION);

    // Verify L2 unit norm ||v||_2 ~= 1.0
    let sumSq = 0;
    for (const val of embedding) {
      sumSq += val * val;
    }
    assert.ok(Math.abs(Math.sqrt(sumSq) - 1.0) < 1e-5, `Norm ${Math.sqrt(sumSq)} is not ~1.0`);
  });

  it('should calculate cosine similarity correctly', () => {
    const el1 = { tag: 'button', role: 'button', text: 'Submit Payment', ariaLabel: 'Pay' };
    const el2 = { tag: 'button', role: 'button', text: 'Submit Payment', ariaLabel: 'Pay' };
    const el3 = { tag: 'input', role: 'textbox', text: 'Patient Name', ariaLabel: 'Name' };

    const v1 = computeSemanticEmbedding(el1);
    const v2 = computeSemanticEmbedding(el2);
    const v3 = computeSemanticEmbedding(el3);

    const simIdentical = computeCosineSimilarity(v1, v2);
    const simDifferent = computeCosineSimilarity(v1, v3);

    assert.ok(simIdentical > 0.99, `Identical cosine ${simIdentical} should be ~1.0`);
    assert.ok(simDifferent < 0.70, `Different cosine ${simDifferent} should be lower`);
  });

  it('should compute DOM tree proximity evaluating structural hierarchy', () => {
    const pathA = 'html/body/div#app/div.split-pane/div.left-pane/button#submit';
    const pathB = 'html/body/div#app/div.split-pane/div.left-pane/button.submit-btn';
    const pathFar = 'html/body/div#app/footer/div.nav-bar/ul/li/a';

    const proxClose = computeTreeProximity(pathA, pathB);
    const proxFar = computeTreeProximity(pathA, pathFar);

    assert.ok(proxClose > 0.7, `Close path proximity ${proxClose} should be high`);
    assert.ok(proxFar < 0.5, `Far path proximity ${proxFar} should be lower`);
  });

  it('should compute Visual Bounding Box IoU accurately', () => {
    const boxA = { x: 50, y: 100, width: 100, height: 50 };
    const boxB = { x: 50, y: 100, width: 100, height: 50 }; // identical
    const boxC = { x: 100, y: 100, width: 100, height: 50 }; // 50% overlap
    const boxD = { x: 300, y: 300, width: 100, height: 50 }; // 0% overlap

    assert.equal(computeVisualIoU(boxA, boxB), 1.0);
    assert.ok(Math.abs(computeVisualIoU(boxA, boxC) - 0.333) < 0.05);
    assert.equal(computeVisualIoU(boxA, boxD), 0.0);
  });

  it('should successfully heal mutated DOM locator using multi-modal similarity', async () => {
    const memory = new AgenticMemory();

    // Register original element in memory
    const originalSelector = '#btn-confirm-quote';
    memory.registerElement(originalSelector, {
      tag: 'button',
      role: 'button',
      ariaLabel: 'Confirm Medical Quote',
      text: 'Confirmar Cotización RVA171',
      classes: ['btn', 'btn-primary'],
      domPath: 'html/body/div#app/main/div.split-pane/div.right-pane/button#btn-confirm-quote',
      boundingBox: { x: 450, y: 600, width: 220, height: 44 }
    });

    // Frontend mutates: ID removed, CSS class changed, wrapped in div.actions
    const candidates = [
      {
        candidateId: 'cand_wrong_cancel',
        currentSelector: 'button.btn-secondary-cancel',
        tag: 'button',
        role: 'button',
        text: 'Cancelar',
        classes: ['btn', 'btn-secondary'],
        domPath: 'html/body/div#app/main/div.split-pane/div.right-pane/button.btn-secondary-cancel',
        boundingBox: { x: 200, y: 600, width: 120, height: 44 }
      },
      {
        candidateId: 'cand_mutated_target',
        currentSelector: 'button.quote-modal__submit-btn-v2',
        tag: 'button',
        role: 'button',
        ariaLabel: 'Confirm Medical Quote',
        text: 'Confirmar Cotización RVA171',
        classes: ['quote-modal__submit-btn-v2', 'action-primary'],
        domPath: 'html/body/div#app/main/div.split-pane/div.right-pane/div.actions/button.quote-modal__submit-btn-v2',
        boundingBox: { x: 450, y: 600, width: 220, height: 44 }
      }
    ];

    const healingResult = await healLocator(originalSelector, candidates, memory);

    assert.ok(healingResult, 'Healing result should not be null');
    assert.equal(healingResult.healed, true);
    assert.equal(healingResult.originalSelector, originalSelector);
    assert.equal(healingResult.healedSelector, 'button.quote-modal__submit-btn-v2');
    assert.equal(healingResult.candidateId, 'cand_mutated_target');
    assert.ok(healingResult.confidence >= 0.82, `Confidence ${healingResult.confidence} should exceed threshold 0.82`);

    // Verify active selector is updated in memory
    assert.equal(memory.getActiveSelector(originalSelector), 'button.quote-modal__submit-btn-v2');
  });
});

describe('M4: SSIM Engine with Dynamic ROI Masking', () => {
  it('should report SSIM = 1.0 for identical images', () => {
    const img1 = createRawImage(100, 100, { r: 240, g: 240, b: 240 });
    const img2 = createRawImage(100, 100, { r: 240, g: 240, b: 240 });

    const result = computeSSIM(img1, img2);

    assert.equal(result.ssim, 1.0);
    assert.equal(result.passed, true);
    assert.equal(result.diffPixels, 0);
  });

  it('should detect visual regression when unmasked layout differs', () => {
    const baseline = createRawImage(120, 120, { r: 255, g: 255, b: 255 });
    const mutated = createRawImage(120, 120, { r: 255, g: 255, b: 255 });

    // Draw an unexpected red error banner across the middle
    drawRectOnImage(mutated, { x: 10, y: 30, width: 100, height: 40 }, { r: 230, g: 20, b: 20 });

    const result = computeSSIM(baseline, mutated, { threshold: 0.95 });

    assert.ok(result.ssim < 0.85, `SSIM ${result.ssim} should drop significantly on regression`);
    assert.equal(result.passed, false);
    assert.ok(result.diffPixels > 1000);
  });

  it('should successfully pass SSIM when volatile animated spinner is masked out', () => {
    const baseline = createRawImage(120, 120, { r: 255, g: 255, b: 255 });
    const actualWithSpinner = createRawImage(120, 120, { r: 255, g: 255, b: 255 });

    // Draw static header and button on both
    drawRectOnImage(baseline, { x: 10, y: 10, width: 100, height: 20 }, { r: 30, g: 100, b: 200 });
    drawRectOnImage(actualWithSpinner, { x: 10, y: 10, width: 100, height: 20 }, { r: 30, g: 100, b: 200 });

    // Simulate animated loading spinner inside ROI { x: 45, y: 50, width: 30, height: 30 }
    drawRectOnImage(actualWithSpinner, { x: 45, y: 50, width: 30, height: 30 }, { r: 128, g: 128, b: 128 });

    // 1. Without mask: fails
    const unmaskedResult = computeSSIM(baseline, actualWithSpinner, { threshold: 0.95 });
    assert.equal(unmaskedResult.passed, false);

    // 2. With ROI mask around the spinner: passes
    const maskedResult = computeSSIM(baseline, actualWithSpinner, {
      threshold: 0.95,
      maskRegions: [{ x: 40, y: 45, width: 40, height: 40 }]
    });

    assert.equal(maskedResult.passed, true);
    assert.ok(maskedResult.ssim >= 0.95, `Masked SSIM ${maskedResult.ssim} should pass`);
    assert.ok(maskedResult.totalMaskedPixels > 0);
  });
});

describe('M4: Perceptual Hashing (64-Bit 2D-DCT pHash & dHash)', () => {
  it('should produce identical 64-bit pHash for identical images (Hamming distance 0)', () => {
    const imgA = createRawImage(64, 64, { r: 100, g: 150, b: 200 });
    const imgB = createRawImage(64, 64, { r: 100, g: 150, b: 200 });

    drawRectOnImage(imgA, { x: 10, y: 10, width: 30, height: 30 }, { r: 20, g: 20, b: 20 });
    drawRectOnImage(imgB, { x: 10, y: 10, width: 30, height: 30 }, { r: 20, g: 20, b: 20 });

    const hashA = computePHash(imgA);
    const hashB = computePHash(imgB);

    assert.equal(hashA.length, 16);
    assert.equal(hashA, hashB);
    assert.equal(computeHammingDistance(hashA, hashB), 0);
  });

  it('should tolerate minor pixel noise with low Hamming distance (<= 5)', () => {
    const imgA = createRawImage(64, 64, { r: 200, g: 200, b: 200 });
    const imgB = createRawImage(64, 64, { r: 200, g: 200, b: 200 });

    drawRectOnImage(imgA, { x: 15, y: 15, width: 30, height: 30 }, { r: 50, g: 50, b: 50 });
    drawRectOnImage(imgB, { x: 15, y: 15, width: 30, height: 30 }, { r: 53, g: 48, b: 52 }); // slight noise

    const comparison = comparePerceptual(imgA, imgB, { algorithm: 'pHash', maxHammingDistance: 5 });

    assert.ok(comparison.hammingDistance <= 5, `Hamming distance ${comparison.hammingDistance} exceeds tolerance 5`);
    assert.equal(comparison.match, true);
  });

  it('should compute dHash and distinguish distinct layout structures', () => {
    const img1 = createRawImage(64, 64, { r: 255, g: 255, b: 255 });
    const img2 = createRawImage(64, 64, { r: 255, g: 255, b: 255 });

    // img1: Left white (255), Right black (0) -> descending gradient across all rows
    drawRectOnImage(img1, { x: 32, y: 0, width: 32, height: 64 }, { r: 0, g: 0, b: 0 });

    // img2: Left black (0), Right white (255) -> ascending gradient across all rows
    drawRectOnImage(img2, { x: 0, y: 0, width: 32, height: 64 }, { r: 0, g: 0, b: 0 });

    const hash1 = computeDHash(img1);
    const hash2 = computeDHash(img2);
    const distance = computeHammingDistance(hash1, hash2);

    assert.ok(distance >= 8, `Hamming distance between inverse gradients ${distance} should be >= 8`);
  });
});

describe('M4: 100% PII/PHI-Safe Synthetic Caribbean Patient Data Engine', () => {
  const archetypes = ['RVA171', 'RVA282', 'RVA341', 'RVA077'] as const;

  it('should generate all 4 operational archetypes with deterministic attributes', () => {
    for (const arch of archetypes) {
      const pax = generateSyntheticPatient(arch);

      assert.equal(pax.rvaCode, arch);
      assert.ok(pax.patientCode.startsWith('ENT-PAX-'));
      assert.equal(pax.passportHash.length, 64);
      assert.ok(typeof pax.medicalProcedure.baseCostCopCents === 'bigint');
      assert.ok(typeof pax.medicalProcedure.marginCopCents === 'bigint');
      assert.ok(typeof pax.totalLedgerBalanceCents === 'bigint');
      assert.ok(pax.expenses.length > 0);

      // Verify specific archetype details
      if (arch === 'RVA171') {
        assert.equal(pax.originCountry, 'Curazao');
        assert.ok(pax.fullName.includes('Catia'));
        assert.equal(pax.assignedDriver, '[DRV] Ramón Rosero');
      } else if (arch === 'RVA282') {
        assert.equal(pax.originCountry, 'Aruba');
        assert.ok(pax.fullName.includes('George'));
        assert.equal(pax.medicalProcedure.category, 'CARDIOLOGIA');
      } else if (arch === 'RVA341') {
        assert.equal(pax.originCountry, 'Surinam');
        assert.ok(pax.fullName.includes('Hogenboom'));
        assert.equal(pax.medicalProcedure.category, 'REGENERATIVA');
      } else if (arch === 'RVA077') {
        assert.equal(pax.originCountry, 'Bonaire');
        assert.ok(pax.fullName.includes('Rumai'));
        assert.equal(pax.stayDurationDays, 12);
      }
    }
  });

  it('should guarantee zero PII/PHI leakage and strict BigInt integer cents', () => {
    for (const arch of archetypes) {
      const pax = generateSyntheticPatient(arch);
      const safety = assertZeroPIILeakage(pax);

      assert.equal(safety.isSafe, true, `PII Violations found: ${safety.violations.join(', ')}`);
      assert.equal(safety.violations.length, 0);

      // Verify arithmetic balance: totalLedgerBalance = base + margin + sum(expenses)
      let sumExpenses = 0n;
      for (const exp of pax.expenses) {
        sumExpenses += exp.amountCopCents;
      }
      const expectedTotal = pax.medicalProcedure.baseCostCopCents + pax.medicalProcedure.marginCopCents + sumExpenses;
      assert.equal(pax.totalLedgerBalanceCents, expectedTotal);
    }
  });

  it('should generate deterministic salted passport hashes and patient codes', () => {
    const code1 = generateSyntheticPatientCode('seed_alpha');
    const code2 = generateSyntheticPatientCode('seed_alpha');
    const code3 = generateSyntheticPatientCode('seed_beta');

    assert.equal(code1, code2);
    assert.notEqual(code1, code3);

    const passHash1 = generateSaltedPassportHash('ENT-PAX-1234');
    const passHash2 = generateSaltedPassportHash('ENT-PAX-1234');
    assert.equal(passHash1, passHash2);
    assert.equal(passHash1.length, 64);
  });
});
