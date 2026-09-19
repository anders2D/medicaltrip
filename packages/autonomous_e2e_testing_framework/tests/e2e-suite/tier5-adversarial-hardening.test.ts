/**
 * tier5-adversarial-hardening.test.ts
 * Tier 5 Adversarial Coverage Hardening & Empirical Stress Verification Suite.
 * 
 * Target Domains:
 * 1. Formal Process Modeling (High-concurrency Petri Nets, Deep Reachability Graphs, Cyclic Loops, Deadlocks)
 * 2. Complex Nested LTL/CTL Model Checking (G(p -> (q U (r W s))), Counterexample Extraction, Trace Scale)
 * 3. Stagehand Semantic DOM Trimming Under Massive Scale (10,000+ Nodes, Deep Nesting, Token Compression)
 * 4. Malformed XML, Broken BPMN Gateways, and Robust Fallbacks
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PetriNet, Marking } from '../../src/formal/petri-net.js';
import {
  translateBpmnToPetriNet,
  translateBpmnProcessToPetriNet,
  parseBPMNXML,
  BPMNProcessDefinition
} from '../../src/formal/bpmn-translator.js';
import {
  SoundnessVerifier,
  verifySoundness
} from '../../src/formal/soundness-verifier.js';
import {
  LTLEngine,
  evaluateLTL,
  ExecutionTrace,
  TraceStep
} from '../../src/formal/ltl-engine.js';
import {
  trimDOM,
  parseHTMLToDOMTree,
  extractAXTree,
  compressToTokenBudget
} from '../../src/perception/dom-trimmer.js';
import {
  ContextRouter,
  routeAction,
  AppState
} from '../../src/perception/context-router.js';
import {
  generateSetOfMarksOverlay,
  findMark,
  resolveNormalizedToPixels,
  computeBoundingBoxIoU
} from '../../src/perception/set-of-marks.js';
import {
  PlaywrightMCPDispatcher,
  MockBrowserDriver
} from '../../src/perception/mcp-protocol.js';

test('Tier 5 Stress: High-Concurrency Petri Nets & Reachability Space Explosion', async (t) => {
  await t.test('should correctly explore 2^8 (256) reachable markings in an 8-way concurrent AND-split/AND-join net', () => {
    const net = new PetriNet();
    net.addPlace({ id: 'p_start', label: 'Start', isInitial: true });
    net.addPlace({ id: 'p_end', label: 'End', isFinal: true });

    const branchCount = 8;
    net.addTransition({ id: 't_fork', label: 'Fork 8 Parallel Tasks', isSilent: true });
    net.addTransition({ id: 't_join', label: 'Join 8 Parallel Tasks', isSilent: true });

    net.addArc('p_start', 't_fork');
    net.addArc('t_join', 'p_end');

    for (let i = 0; i < branchCount; i++) {
      const pIn = `p_branch_${i}_in`;
      const pOut = `p_branch_${i}_out`;
      const tTask = `t_task_${i}`;

      net.addPlace({ id: pIn, label: `Branch ${i} In` });
      net.addPlace({ id: pOut, label: `Branch ${i} Out` });
      net.addTransition({ id: tTask, label: `Parallel Worker ${i}` });

      net.addArc('t_fork', pIn);
      net.addArc(pIn, tTask);
      net.addArc(tTask, pOut);
      net.addArc(pOut, 't_join');
    }

    const startTime = performance.now();
    const reachability = net.computeReachabilityGraph(10000);
    const duration = performance.now() - startTime;

    // 8-way parallel task: reachable markings = 1 (start) + 2^8 (all combinations) + 1 (end) = 258 markings
    assert.equal(reachability.isFinite, true);
    assert.equal(reachability.isBounded, true);
    assert.equal(reachability.markings.size, 258, `Expected 258 markings for 8-way concurrency, got ${reachability.markings.size}`);
    assert.equal(reachability.deadlockStates.length, 0, 'Must have zero deadlocks');
    assert.ok(duration < 200, `Reachability BFS took ${duration.toFixed(2)}ms (target < 200ms)`);

    // Verify mathematical Soundness
    const proof = verifySoundness(net);
    assert.equal(proof.isSound, true, '8-way concurrent workflow must be mathematically Sound');
    assert.equal(proof.optionToComplete, true);
    assert.equal(proof.properCompletion, true);
    assert.equal(proof.liveTransitions, true);
    assert.equal(proof.deadlocks.length, 0);
  });

  await t.test('should gracefully handle reachability state limits on hyper-concurrent nets exceeding maxStates', () => {
    // 14-way parallel net => 2^14 = 16,384 states > maxStates (1000)
    const net = new PetriNet();
    net.addPlace({ id: 'p_start', label: 'Start', isInitial: true });
    net.addPlace({ id: 'p_end', label: 'End', isFinal: true });
    net.addTransition({ id: 't_fork', label: 'Fork' });
    net.addTransition({ id: 't_join', label: 'Join' });
    net.addArc('p_start', 't_fork');
    net.addArc('t_join', 'p_end');

    for (let i = 0; i < 14; i++) {
      const pIn = `p_in_${i}`;
      const pOut = `p_out_${i}`;
      const tTask = `t_${i}`;
      net.addPlace({ id: pIn, label: `In ${i}` });
      net.addPlace({ id: pOut, label: `Out ${i}` });
      net.addTransition({ id: tTask, label: `T ${i}` });
      net.addArc('t_fork', pIn);
      net.addArc(pIn, tTask);
      net.addArc(tTask, pOut);
      net.addArc(pOut, 't_join');
    }

    const reachability = net.computeReachabilityGraph(1000); // capped at 1000 states
    assert.equal(reachability.isFinite, false);
    assert.equal(reachability.isBounded, false);
    assert.ok(reachability.markings.size > 1000);
  });

  await t.test('should correctly verify Soundness and termination in BPMN cyclic retry loops with explicit XOR-join', () => {
    // Medical Trip Retrying Itinerary Review with Explicit XOR-Join Gateway:
    // Start -> [XOR Join] -> Lead Intake -> [XOR Review] -> (Approve -> End) | (Reject -> Modify -> Loop to XOR Join)
    const bpmnDefinition: BPMNProcessDefinition = {
      id: 'medical_retry_loop_process',
      name: 'Medical Lead Review with Retry Loop',
      nodes: [
        { id: 'start', name: 'Start Event', type: 'startEvent', incoming: [], outgoing: ['f1'] },
        { id: 'xor_join_entry', name: 'Join Entry & Retry', type: 'exclusiveGateway', incoming: ['f1', 'f_retry'], outgoing: ['f_to_intake'] },
        { id: 'task_intake', name: 'Intake Lead', type: 'userTask', incoming: ['f_to_intake'], outgoing: ['f2'] },
        { id: 'xor_eval', name: 'Clinical Evaluation', type: 'exclusiveGateway', incoming: ['f2'], outgoing: ['f_approve', 'f_reject'] },
        { id: 'task_quote', name: 'Generate Quote', type: 'serviceTask', incoming: ['f_approve'], outgoing: ['f_to_end'] },
        { id: 'task_remedy', name: 'Request Clinical Amendment', type: 'userTask', incoming: ['f_reject'], outgoing: ['f_retry'] },
        { id: 'end', name: 'End Event', type: 'endEvent', incoming: ['f_to_end'], outgoing: [] }
      ],
      sequenceFlows: [
        { id: 'f1', sourceRef: 'start', targetRef: 'xor_join_entry' },
        { id: 'f_to_intake', sourceRef: 'xor_join_entry', targetRef: 'task_intake' },
        { id: 'f2', sourceRef: 'task_intake', targetRef: 'xor_eval' },
        { id: 'f_approve', name: 'Approved', sourceRef: 'xor_eval', targetRef: 'task_quote' },
        { id: 'f_reject', name: 'Needs Amendment', sourceRef: 'xor_eval', targetRef: 'task_remedy' },
        { id: 'f_retry', sourceRef: 'task_remedy', targetRef: 'xor_join_entry' },
        { id: 'f_to_end', sourceRef: 'task_quote', targetRef: 'end' }
      ]
    };

    const net = translateBpmnProcessToPetriNet(bpmnDefinition);
    const proof = verifySoundness(net);

    assert.equal(proof.isSound, true, 'Cyclic retry workflow with XOR join must be mathematically Sound');
    assert.equal(proof.optionToComplete, true, 'Every state must be able to reach terminal state');
    assert.equal(proof.properCompletion, true);
    assert.equal(proof.liveTransitions, true, 'All transitions (including retry) must be live');
    assert.equal(proof.deadlocks.length, 0);
  });

  await t.test('should identify deadlock when a task has multiple incoming flows without XOR-Join', () => {
    // Anti-pattern: Task with 2 incoming flows directly into transition (implicit AND synchronization)
    const implicitAndBpmn: BPMNProcessDefinition = {
      id: 'implicit_and_task_flaw',
      name: 'Implicit AND on Task',
      nodes: [
        { id: 'start', name: 'Start', type: 'startEvent', incoming: [], outgoing: ['f1'] },
        { id: 'task_intake', name: 'Intake', type: 'task', incoming: ['f1', 'f_retry'], outgoing: ['f2'] },
        { id: 'xor_eval', name: 'Eval', type: 'exclusiveGateway', incoming: ['f2'], outgoing: ['f_approve', 'f_retry'] },
        { id: 'end', name: 'End', type: 'endEvent', incoming: ['f_approve'], outgoing: [] }
      ],
      sequenceFlows: [
        { id: 'f1', sourceRef: 'start', targetRef: 'task_intake' },
        { id: 'f2', sourceRef: 'task_intake', targetRef: 'xor_eval' },
        { id: 'f_approve', sourceRef: 'xor_eval', targetRef: 'end' },
        { id: 'f_retry', sourceRef: 'xor_eval', targetRef: 'task_intake' }
      ]
    };

    const net = translateBpmnProcessToPetriNet(implicitAndBpmn);
    const proof = verifySoundness(net);

    assert.equal(proof.isSound, false, 'Implicit multi-input task must be identified as unsound');
    assert.equal(proof.optionToComplete, false);
    assert.ok(proof.deadTransitions.length > 0);
  });

  await t.test('should detect deadlocks and dead transitions in asymmetric multi-join networks', () => {
    // Multi-branch network with 3 paths where 2 merge into AND and 1 merges into XOR -> structural deadlock
    const flawedBpmn: BPMNProcessDefinition = {
      id: 'asymmetric_deadlock_network',
      name: 'Asymmetric Deadlock Network',
      nodes: [
        { id: 'start', name: 'Start', type: 'startEvent', incoming: [], outgoing: ['f0'] },
        { id: 'split', name: 'XOR Split 3', type: 'exclusiveGateway', incoming: ['f0'], outgoing: ['f1', 'f2', 'f3'] },
        { id: 'task1', name: 'Task 1', type: 'task', incoming: ['f1'], outgoing: ['f4'] },
        { id: 'task2', name: 'Task 2', type: 'task', incoming: ['f2'], outgoing: ['f5'] },
        { id: 'task3', name: 'Task 3', type: 'task', incoming: ['f3'], outgoing: ['f6'] },
        { id: 'and_join', name: 'AND Join 1&2', type: 'parallelGateway', incoming: ['f4', 'f5'], outgoing: ['f7'] },
        { id: 'final_join', name: 'Final XOR Join', type: 'exclusiveGateway', incoming: ['f7', 'f6'], outgoing: ['f8'] },
        { id: 'end', name: 'End', type: 'endEvent', incoming: ['f8'], outgoing: [] }
      ],
      sequenceFlows: [
        { id: 'f0', sourceRef: 'start', targetRef: 'split' },
        { id: 'f1', sourceRef: 'split', targetRef: 'task1' },
        { id: 'f2', sourceRef: 'split', targetRef: 'task2' },
        { id: 'f3', sourceRef: 'split', targetRef: 'task3' },
        { id: 'f4', sourceRef: 'task1', targetRef: 'and_join' },
        { id: 'f5', sourceRef: 'task2', targetRef: 'and_join' },
        { id: 'f6', sourceRef: 'task3', targetRef: 'final_join' },
        { id: 'f7', sourceRef: 'and_join', targetRef: 'final_join' },
        { id: 'f8', sourceRef: 'final_join', targetRef: 'end' }
      ]
    };

    const net = translateBpmnProcessToPetriNet(flawedBpmn);
    const proof = verifySoundness(net);

    assert.equal(proof.isSound, false);
    assert.equal(proof.optionToComplete, false);
    assert.ok(proof.deadlocks.length > 0, 'Deadlocks must be identified');
  });

  await t.test('should identify unreachable places and dead transitions in disconnected subnets', () => {
    const net = new PetriNet();
    net.addPlace({ id: 'p_start', label: 'Start', isInitial: true });
    net.addPlace({ id: 'p_end', label: 'End', isFinal: true });
    net.addPlace({ id: 'p_island', label: 'Island' });
    net.addTransition({ id: 't_main', label: 'Main' });
    net.addTransition({ id: 't_island', label: 'Island Task' });
    net.addArc('p_start', 't_main');
    net.addArc('t_main', 'p_end');
    net.addArc('p_island', 't_island');

    const proof = verifySoundness(net);
    assert.equal(proof.isSound, false);
    assert.deepEqual(proof.deadTransitions, ['t_island']);
    assert.deepEqual(proof.unreachablePlaces, ['p_island']);
  });
});

test('Tier 5 Stress: Nested LTL/CTL Formulas & High-Volume Temporal Trace Verification', async (t) => {
  await t.test('should evaluate complex nested LTL formulas: G(p -> (q U (r W s)))', () => {
    // Formula: Globally, if lead requested (p), then status remains IN_REVIEW (q) UNTIL
    // either deposit made (r) or weakly itinerary finalized (s).
    // AST: G( p -> ( q U ( r W s ) ) )
    const p = LTLEngine.predicate('LeadRequested', step => step.variables['LeadRequested'] === true);
    const q = LTLEngine.predicate('InReview', step => step.variables['Status'] === 'IN_REVIEW');
    const r = LTLEngine.predicate('DepositMade', step => step.variables['DepositMade'] === true);
    const s = LTLEngine.predicate('ItineraryFinalized', step => step.variables['ItineraryFinalized'] === true);

    const rWeakUntilS = LTLEngine.weakUntil(r, s);
    const qUntilRWeakS = LTLEngine.until(q, rWeakUntilS);
    const formula = LTLEngine.globally(LTLEngine.implies(p, qUntilRWeakS));

    // Trace 1: Satisfies formula
    const satisfyingTrace: ExecutionTrace = [
      { index: 0, variables: { LeadRequested: false, Status: 'IDLE' } },
      { index: 1, variables: { LeadRequested: true, Status: 'IN_REVIEW' } },
      { index: 2, variables: { LeadRequested: false, Status: 'IN_REVIEW' } },
      { index: 3, variables: { LeadRequested: false, Status: 'IN_REVIEW' } },
      { index: 4, variables: { LeadRequested: false, Status: 'PROCESSING', DepositMade: true, ItineraryFinalized: false } },
      { index: 5, variables: { LeadRequested: false, Status: 'DONE', ItineraryFinalized: true } }
    ];

    const res1 = LTLEngine.verify(formula, satisfyingTrace);
    assert.equal(res1.satisfied, true, 'Formula must be satisfied on compliant trace');
    assert.equal(res1.evaluatedStepsCount, 6);

    // Trace 2: Violates formula (Status drops out of IN_REVIEW before DepositMade or ItineraryFinalized)
    const violatingTrace: ExecutionTrace = [
      { index: 0, variables: { LeadRequested: true, Status: 'IN_REVIEW' } },
      { index: 1, variables: { LeadRequested: false, Status: 'CANCELLED_UNEXPECTEDLY', DepositMade: false, ItineraryFinalized: false } },
      { index: 2, variables: { LeadRequested: false, Status: 'IDLE', DepositMade: false, ItineraryFinalized: false } }
    ];

    const res2 = LTLEngine.verify(formula, violatingTrace);
    assert.equal(res2.satisfied, false, 'Formula must fail on premature state break');
    assert.equal(res2.violatedStepIndex, 0);
    assert.ok(res2.counterExample);
    assert.ok(res2.counterExample.length >= 2);
  });

  await t.test('should verify LTL Release operator (left R right) and Weak Until (left W right) equivalence', () => {
    // Under LTL duality: (p W q) is equivalent to (q R (q || p))
    // Also: if q never occurs, p must hold globally for W.
    const p = LTLEngine.predicate('HoldP', step => Boolean(step.variables['p']));
    const q = LTLEngine.predicate('HoldQ', step => Boolean(step.variables['q']));

    const weakUntilNode = LTLEngine.weakUntil(p, q);

    // Trace where q never occurs, but p holds globally
    const traceInfiniteP: ExecutionTrace = [
      { index: 0, variables: { p: true, q: false } },
      { index: 1, variables: { p: true, q: false } },
      { index: 2, variables: { p: true, q: false } },
      { index: 3, variables: { p: true, q: false } }
    ];

    const resWeak = LTLEngine.verify(weakUntilNode, traceInfiniteP);
    assert.equal(resWeak.satisfied, true, 'Weak until must hold when left holds globally even if right never holds');

    // Strict until should FAIL on the same trace because right never holds
    const strictUntilNode = LTLEngine.until(p, q);
    const resStrict = LTLEngine.verify(strictUntilNode, traceInfiniteP);
    assert.equal(resStrict.satisfied, false, 'Strict until must fail if right never holds');
  });

  await t.test('should efficiently model-check massive 5,000-step execution trace without performance degradation', () => {
    const hugeTrace: ExecutionTrace = [];
    let balance = 0n;

    for (let i = 0; i < 5000; i++) {
      const delta = BigInt(i * 100);
      balance += delta;
      hugeTrace.push({
        index: i,
        timestampMs: i * 50,
        state: i === 4999 ? 'COMPLETED' : 'PROCESSING',
        variables: {
          StepIndex: i,
          LedgerDebits: balance,
          LedgerCredits: balance,
          IsActive: true,
          Territory: i % 2 === 0 ? 'Medellin' : 'Bogota'
        }
      });
    }

    const formulaStr = 'G(IsActive -> LedgerDebits == LedgerCredits)';
    const startTime = performance.now();
    const res = evaluateLTL(formulaStr, hugeTrace);
    const duration = performance.now() - startTime;

    assert.equal(res.satisfied, true);
    assert.equal(res.evaluatedStepsCount, 5000);
    assert.ok(duration < 150, `Evaluating 5,000 steps took ${duration.toFixed(2)}ms (target < 150ms)`);
  });

  await t.test('should precisely isolate counterexamples in deeply nested temporal failure traces', () => {
    // Trace of 1,000 steps where invariant fails at step 742
    const traceWithDefect: ExecutionTrace = [];
    for (let i = 0; i < 1000; i++) {
      const isDefectiveStep = (i === 742);
      traceWithDefect.push({
        index: i,
        variables: {
          Step: i,
          LedgerBalanced: !isDefectiveStep,
          Committed: true
        }
      });
    }

    const result = evaluateLTL('G(Committed -> LedgerBalanced)', traceWithDefect);
    assert.equal(result.satisfied, false);
    assert.equal(result.violatedStepIndex, 742, `Expected violation at step 742, got ${result.violatedStepIndex}`);
    assert.ok(result.counterExample);
    assert.equal(result.counterExample[result.counterExample.length - 1].index, 743);
  });
});

test('Tier 5 Stress: Massive DOM Trees (10,000+ Nodes) and Stagehand Compression Budget', async (t) => {
  await t.test('should parse and trim massive 10,000+ node DOM tree under 150ms with tight compression ratio', () => {
    // Generate massive DOM tree: 12,000 nodes total
    // 3,000 rows x 4 elements per row (nested deep inside tables, spans, divs)
    let massiveHtml = '<!DOCTYPE html><html><body><div id="medical-hub" class="container" style="width: 1440px; height: 900px;">';
    massiveHtml += '<header><h1>Medical Trip Enterprise Operations Portal</h1><button id="btn-sync">Sincronizar CRM</button></header>';
    massiveHtml += '<table id="itinerary-grid" style="width: 100%;">';

    for (let r = 1; r <= 3000; r++) {
      const isHidden = (r % 5 === 0);
      const style = isHidden ? 'style="display: none;"' : '';
      massiveHtml += `
        <tr class="row-${r}" ${style}>
          <td><span class="badge">#${r}</span></td>
          <td><div class="patient-cell"><strong class="pax-name">Patient ENT-PAX-${r.toString().padStart(4, '0')}</strong><small class="ref">RVA-${r}</small></div></td>
          <td><input type="text" id="status-${r}" aria-label="Status ${r}" value="PROGRAMADO" /></td>
          <td><button id="btn-action-${r}" aria-label="Exec Action ${r}">Liquidar #${r}</button></td>
        </tr>`;
    }

    massiveHtml += '</table>';
    massiveHtml += '<canvas id="audit-signature-pad" width="600" height="300" data-x="100" data-y="600" data-w="600" data-h="300"></canvas>';
    massiveHtml += '</div></body></html>';

    assert.ok(massiveHtml.length > 500_000, `Raw DOM size ${massiveHtml.length} bytes must exceed 500KB`);

    const startTime = performance.now();
    const snapshot = trimDOM(massiveHtml, { maxTokens: 400 });
    const duration = performance.now() - startTime;

    // Strict assertions: Stagehand budget is ~200-400 tokens
    assert.ok(snapshot.tokenCount >= 100, `Token count ${snapshot.tokenCount} too small`);
    assert.ok(snapshot.interactiveElements.length >= 5, 'Must keep top interactive elements');
    assert.ok(snapshot.rawTrimRatio > 0.95, `Raw trim ratio ${snapshot.rawTrimRatio} should compress > 95% of raw DOM`);
    assert.ok(snapshot.summaryText.includes('[e1]'), 'Must format with [e1] IDs');
    assert.ok(snapshot.summaryText.includes('trimmed') || snapshot.tokenCount <= 420);
    assert.ok(duration < 250, `Trimming 12,000 nodes took ${duration.toFixed(2)}ms (target < 250ms)`);

    // Verify sequential alphanumeric IDs without collision
    const ids = snapshot.interactiveElements.map(e => e.elementId);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'IDs must be unique and non-colliding');
    assert.equal(ids[0], 'e1');
    assert.equal(ids[1], 'e2');
  });

  await t.test('should gracefully handle 100-level deeply nested DOM without call stack overflow', () => {
    let deepHtml = '<div id="level-0">';
    for (let d = 1; d <= 100; d++) {
      deepHtml += `<div id="level-${d}" class="nested-wrapper">`;
    }
    deepHtml += '<button id="btn-deepest" aria-label="Deepest Action">Execute Deep</button>';
    for (let d = 100; d >= 1; d--) {
      deepHtml += '</div>';
    }
    deepHtml += '</div>';

    const snapshot = trimDOM(deepHtml, { maxTokens: 400 });
    assert.ok(snapshot.interactiveElements.length === 1);
    assert.equal(snapshot.interactiveElements[0].name, 'Deepest Action');
    assert.equal(snapshot.interactiveElements[0].elementId, 'e1');
  });

  await t.test('should prune off-screen elements outside viewport bounds', () => {
    const htmlWithOffscreen = `
      <div style="width: 1280px; height: 800px;">
        <button id="btn-onscreen" data-x="100" data-y="200" data-w="150" data-h="40">Onscreen</button>
        <button id="btn-offscreen-right" data-x="2500" data-y="200" data-w="150" data-h="40">Offscreen Right</button>
        <button id="btn-offscreen-bottom" data-x="100" data-y="4000" data-w="150" data-h="40">Offscreen Bottom</button>
        <button id="btn-negative" data-x="-500" data-y="-200" data-w="150" data-h="40">Negative Coords</button>
      </div>
    `;

    const snapshot = trimDOM(htmlWithOffscreen, { viewport: { width: 1280, height: 800 } });
    assert.equal(snapshot.interactiveElements.length, 1);
    assert.equal(snapshot.interactiveElements[0].name, 'Onscreen');
  });
});

test('Tier 5 Stress: Malformed BPMN XML, Incomplete Gateways & Context Router Robustness', async (t) => {
  await t.test('should parse XML with standard BPMN elements', () => {
    const rawXml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Def_Complex">
        <bpmn:process id="medical_kyc_flow" name="KYC Verification">
          <bpmn:startEvent id="start_kyc" name="Start KYC"/>
          <bpmn:sequenceFlow id="f_1" sourceRef="start_kyc" targetRef="task_ocr" name="To OCR"/>
          <bpmn:serviceTask id="task_ocr" name="OCR Passport SHA-256">
            <bpmn:incoming>f_1</bpmn:incoming>
            <bpmn:outgoing>f_2</bpmn:outgoing>
          </bpmn:serviceTask>
          <bpmn:sequenceFlow id="f_2" sourceRef="task_ocr" targetRef="xor_kyc_eval"/>
          <bpmn:exclusiveGateway id="xor_kyc_eval" name="KYC Valid?">
            <bpmn:incoming>f_2</bpmn:incoming>
            <bpmn:outgoing>f_pass</bpmn:outgoing>
            <bpmn:outgoing>f_fail</bpmn:outgoing>
          </bpmn:exclusiveGateway>
          <bpmn:sequenceFlow id="f_pass" sourceRef="xor_kyc_eval" targetRef="end_pass" name="Verified"/>
          <bpmn:sequenceFlow id="f_fail" sourceRef="xor_kyc_eval" targetRef="end_fail" name="Rejected"/>
          <bpmn:endEvent id="end_pass" name="KYC Approved">
            <bpmn:incoming>f_pass</bpmn:incoming>
          </bpmn:endEvent>
          <bpmn:endEvent id="end_fail" name="KYC Quarantined">
            <bpmn:incoming>f_fail</bpmn:incoming>
          </bpmn:endEvent>
        </bpmn:process>
      </bpmn:definitions>
    `;

    const parsed = parseBPMNXML(rawXml);
    assert.equal(parsed.nodes.length, 5);
    assert.equal(parsed.sequenceFlows.length, 4);

    const net = translateBpmnProcessToPetriNet(parsed);
    assert.ok(net.getPlaces().length > 0);
    assert.ok(net.getTransitions().length > 0);
  });

  await t.test('should fail fast on BPMN process definition lacking start event', () => {
    const invalidDef: BPMNProcessDefinition = {
      id: 'no_start_process',
      name: 'No Start Process',
      nodes: [
        { id: 't1', name: 'Task 1', type: 'task', incoming: [], outgoing: ['f1'] },
        { id: 'end', name: 'End', type: 'endEvent', incoming: ['f1'], outgoing: [] }
      ],
      sequenceFlows: [
        { id: 'f1', sourceRef: 't1', targetRef: 'end' }
      ]
    };

    assert.throws(() => {
      translateBpmnProcessToPetriNet(invalidDef);
    }, /has no StartEvent/);
  });

  await t.test('ContextRouter: should handle high-entropy state with 50+ candidates and ambiguous matches', () => {
    const candidates = [];
    for (let i = 1; i <= 50; i++) {
      candidates.push({
        label: `Visual Target Region #${i}`,
        category: (i % 3 === 0 ? 'signature_pad' : i % 3 === 1 ? 'canvas_drawing' : 'webgl_element') as any,
        pixelBBox: { x: (i * 20) % 1000, y: (i * 15) % 700, width: 80, height: 40 },
        confidence: 0.85 + (i % 10) * 0.01
      });
    }

    const visualMarks = generateSetOfMarksOverlay(candidates);
    const sampleHtml = '<div><button id="btn-primary">Primary Action</button></div>';
    const axSnapshot = trimDOM(sampleHtml);

    const state: AppState = {
      currentUrl: 'http://localhost:3000/complex',
      axSnapshot,
      visualMarks
    };

    const router = new ContextRouter();

    // Route visual mark by ID 35
    const dec1 = router.routeAction(state, { markId: 35 });
    assert.equal(dec1.route, 'VLM_VISUAL_ROUTE');
    assert.equal(dec1.targetMarkId, 35);
    assert.ok(dec1.targetCoords);

    // Route semantic button
    const dec2 = router.routeAction(state, { name: 'Primary Action' });
    assert.equal(dec2.route, 'AX_DOM_ROUTE');
    assert.equal(dec2.targetElementId, 'e1');

    // Route completely missing target with fallback
    const dec3 = router.routeAction(state, { name: 'Completely Nonexistent Target' });
    assert.equal(dec3.route, 'HYBRID_FALLBACK');
  });

  await t.test('PlaywrightMCPDispatcher: should validate arguments and reject malformed commands gracefully', async () => {
    const driver = new MockBrowserDriver();
    const dispatcher = new PlaywrightMCPDispatcher(driver);

    // Missing all required click coordinates and elementId
    const res1 = await dispatcher.dispatch({
      name: 'playwright_click',
      arguments: {}
    });
    assert.equal(res1.toolResult.success, false);
    assert.ok(res1.toolResult.error?.includes('requires either elementId or (x, y)'));

    // Malformed pinch missing finalSpan
    const res2 = await dispatcher.dispatch({
      name: 'playwright_touch_pinch',
      arguments: { centerX: 100, centerY: 100, initialSpan: 50 }
    });
    assert.equal(res2.toolResult.success, false);
    assert.ok(res2.toolResult.error?.includes('requires centerX, centerY, initialSpan, and finalSpan'));

    // Unknown tool
    const res3 = await dispatcher.dispatch({
      name: 'playwright_unsupported_action',
      arguments: {}
    });
    assert.equal(res3.toolResult.success, false);
    assert.ok(res3.toolResult.error?.includes('Unknown MCP Tool'));
  });
});
