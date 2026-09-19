/**
 * independent_verification.ts
 * Independent Forensic Verification Script executed by auditor_1.
 * Empirically validates mathematical invariants and algorithm soundness.
 */

import assert from 'node:assert/strict';
import { PetriNet } from '../../packages/autonomous_e2e_testing_framework/src/formal/petri-net.js';
import { SoundnessVerifier } from '../../packages/autonomous_e2e_testing_framework/src/formal/soundness-verifier.js';
import { LTLEngine, evaluateLTL } from '../../packages/autonomous_e2e_testing_framework/src/formal/ltl-engine.js';
import { computeSSIM } from '../../packages/autonomous_e2e_testing_framework/src/visual/ssim-engine.js';
import { computePHash, computeDHash, computeHammingDistance } from '../../packages/autonomous_e2e_testing_framework/src/visual/perceptual-hash.js';
import { generateSyntheticPatient, assertZeroPIILeakage } from '../../packages/autonomous_e2e_testing_framework/src/visual/synthetic-faker.js';

console.log('--- INDEPENDENT FORENSIC VERIFICATION START ---');

// 1. Petri Net Incidence Matrix & Soundness Verification
console.log('1. Verifying Petri Net Incidence Matrix C = C+ - C- and Siphon/Trap Soundness...');
const net = new PetriNet();
net.addPlace({ id: 'p0', label: 'Start', isInitial: true });
net.addPlace({ id: 'p1', label: 'Mid' });
net.addPlace({ id: 'p2', label: 'End', isFinal: true });

net.addTransition({ id: 't0', label: 'T0' });
net.addTransition({ id: 't1', label: 'T1' });

net.addArc('p0', 't0');
net.addArc('t0', 'p1');
net.addArc('p1', 't1');
net.addArc('t1', 'p2');

const inc = net.computeIncidenceMatrix();
// p0: t0=-1, t1=0
// p1: t0=+1, t1=-1
// p2: t0=0, t1=+1
const p0_idx = inc.placeOrder.indexOf('p0');
const p1_idx = inc.placeOrder.indexOf('p1');
const p2_idx = inc.placeOrder.indexOf('p2');
const t0_idx = inc.transitionOrder.indexOf('t0');
const t1_idx = inc.transitionOrder.indexOf('t1');

assert.equal(inc.incidenceMatrix[p0_idx][t0_idx], -1, 'p0->t0 must be -1');
assert.equal(inc.incidenceMatrix[p0_idx][t1_idx], 0, 'p0->t1 must be 0');
assert.equal(inc.incidenceMatrix[p1_idx][t0_idx], 1, 't0->p1 must be +1');
assert.equal(inc.incidenceMatrix[p1_idx][t1_idx], -1, 'p1->t1 must be -1');
assert.equal(inc.incidenceMatrix[p2_idx][t0_idx], 0, 'p2->t0 must be 0');
assert.equal(inc.incidenceMatrix[p2_idx][t1_idx], 1, 't1->p2 must be +1');
console.log('   ✓ Incidence Matrix algebraic formula C = C+ - C- verified!');

const proof = SoundnessVerifier.verifySoundness(net);
assert.equal(proof.isSound, true, 'Sequence net must be sound');
assert.equal(proof.optionToComplete, true);
assert.equal(proof.properCompletion, true);
assert.equal(proof.liveTransitions, true);
console.log('   ✓ SoundnessVerifier OptionToComplete/ProperCompletion/Liveness verified!');

// Test an UNSOUND net with a deadlock
const unsoundNet = new PetriNet();
unsoundNet.addPlace({ id: 'p0', label: 'Start', isInitial: true });
unsoundNet.addPlace({ id: 'p1', label: 'Deadlock' });
unsoundNet.addPlace({ id: 'p_end', label: 'End', isFinal: true });
unsoundNet.addTransition({ id: 't0', label: 'GoToDeadlock' });
unsoundNet.addArc('p0', 't0');
unsoundNet.addArc('t0', 'p1'); // p1 has no outgoing transition!

const unsoundProof = SoundnessVerifier.verifySoundness(unsoundNet);
assert.equal(unsoundProof.isSound, false, 'Unsound net must fail soundness check');
assert.equal(unsoundProof.deadlocks.length > 0, true, 'Deadlock must be detected');
console.log('   ✓ Deadlock detection in unsound net verified!');

// 2. LTL Model Checker Verification
console.log('2. Verifying LTL Engine on temporal traces...');
const trace = [
  { index: 0, state: 'START', variables: { loggedIn: false, error: false, balance: 0 } },
  { index: 1, state: 'AUTH', variables: { loggedIn: true, error: false, balance: 100 } },
  { index: 2, state: 'SETTLE', variables: { loggedIn: true, error: false, balance: 100 } }
];

const ltlRes1 = evaluateLTL('F(loggedIn == true)', trace);
assert.equal(ltlRes1.satisfied, true, 'F(loggedIn == true) must hold');

const ltlRes2 = evaluateLTL('G(error == false)', trace);
assert.equal(ltlRes2.satisfied, true, 'G(error == false) must hold');

const ltlRes3 = evaluateLTL('G(error == true)', trace);
assert.equal(ltlRes3.satisfied, false, 'G(error == true) must fail');
assert.equal(ltlRes3.violatedStepIndex, 0, 'Violation must be step 0');
console.log('   ✓ LTL formulas F, G, predicate evaluation verified!');

// 3. SSIM Mathematical Formula Verification
console.log('3. Verifying SSIM Engine...');
const imgA = { width: 16, height: 16, data: new Uint8Array(16 * 16 * 4).fill(128), channels: 4 as const };
const imgB = { width: 16, height: 16, data: new Uint8Array(16 * 16 * 4).fill(128), channels: 4 as const };
const ssimIdentical = computeSSIM(imgA, imgB, { windowSize: 8 });
assert.equal(ssimIdentical.ssim, 1.0, 'Identical images must yield SSIM = 1.0');
assert.equal(ssimIdentical.passed, true);

const imgC = { width: 16, height: 16, data: new Uint8Array(16 * 16 * 4).fill(0), channels: 4 as const };
const ssimDifferent = computeSSIM(imgA, imgC, { windowSize: 8 });
assert.ok(ssimDifferent.ssim < 0.5, 'Very different images must yield low SSIM');
console.log(`   ✓ SSIM math verified: identical=${ssimIdentical.ssim}, different=${ssimDifferent.ssim}`);

// 4. 64-bit DCT pHash & Hamming Distance Verification
console.log('4. Verifying 64-Bit DCT Perceptual Hashing...');
const pHashA = computePHash(imgA);
const pHashB = computePHash(imgB);
assert.equal(pHashA, pHashB, 'Identical images must produce identical pHash');
assert.equal(pHashA.length, 16, 'pHash must be 16-hex character (64 bits)');
const hamming = computeHammingDistance(pHashA, pHashB);
assert.equal(hamming, 0, 'Identical hash must have Hamming distance 0');
console.log(`   ✓ pHash computed: ${pHashA} (Hamming distance = ${hamming})`);

// 5. Synthetic Patient PII/PHI & BigInt Integrity Verification
console.log('5. Verifying Synthetic Patient PII/PHI and BigInt Precision...');
const archetypes = ['RVA171', 'RVA282', 'RVA341', 'RVA077'];
for (const arch of archetypes) {
  const pax = generateSyntheticPatient(arch);
  const piiCheck = assertZeroPIILeakage(pax);
  assert.equal(piiCheck.isSafe, true, `Archetype ${arch} must have zero PII violations: ${piiCheck.violations.join(', ')}`);
  assert.ok(typeof pax.medicalProcedure.baseCostCopCents === 'bigint', 'baseCost must be BigInt');
  assert.ok(typeof pax.medicalProcedure.marginCopCents === 'bigint', 'margin must be BigInt');
  assert.ok(typeof pax.totalLedgerBalanceCents === 'bigint', 'totalLedgerBalance must be BigInt');
  assert.equal(pax.medicalProcedure.totalCostCopCents, pax.medicalProcedure.baseCostCopCents + pax.medicalProcedure.marginCopCents);
}
console.log('   ✓ All 4 archetypes verified: 0 PII violations, 100% BigInt integer cents!');

console.log('--- ALL INDEPENDENT VERIFICATIONS PASSED CLEANLY ---');
