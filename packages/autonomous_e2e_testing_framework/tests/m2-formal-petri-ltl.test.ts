/**
 * m2-formal-petri-ltl.test.ts
 * Rigorous test suite for Milestone 2:
 * - Workflow Timed Stochastic Petri Net (WPTSPN) Engine
 * - BPMN 2.0 Process Translator (Sequence, XOR, AND, Loops)
 * - Mathematical Soundness Verifier (Siphons, Traps, Incidence Matrix, Deadlocks)
 * - LTL & CTL Temporal Logic Model Checker with Medical Trip Invariants
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PetriNet } from '../src/formal/petri-net.js';
import {
  translateBpmnToPetriNet,
  translateBpmnProcessToPetriNet,
  BPMNProcessDefinition
} from '../src/formal/bpmn-translator.js';
import {
  SoundnessVerifier,
  verifySoundness
} from '../src/formal/soundness-verifier.js';
import {
  LTLEngine,
  evaluateLTL,
  ExecutionTrace
} from '../src/formal/ltl-engine.js';

test('M2: Petri Net graph construction, token firing, and state equation M_k = M_0 + C * v', () => {
  const net = new PetriNet();

  // Construct a 3-place sequential net: p_start -> t1 -> p1 -> t2 -> p_end
  net.addPlace({ id: 'p_start', label: 'Start', isInitial: true });
  net.addPlace({ id: 'p1', label: 'Processing' });
  net.addPlace({ id: 'p_end', label: 'End', isFinal: true });

  net.addTransition({ id: 't1', label: 'Intake Lead', delayInterval: [5, 10] });
  net.addTransition({ id: 't2', label: 'Generate Quote', delayInterval: [10, 20] });

  net.addArc('p_start', 't1');
  net.addArc('t1', 'p1');
  net.addArc('p1', 't2');
  net.addArc('t2', 'p_end');

  // Check presets and postsets
  assert.deepEqual(net.getPreset('t1'), ['p_start']);
  assert.deepEqual(net.getPostset('t1'), ['p1']);
  assert.deepEqual(net.getPreset('p1'), ['t1']);
  assert.deepEqual(net.getPostset('p1'), ['t2']);

  // Check initial marking
  const m0 = net.getInitialMarking();
  assert.equal(m0.get('p_start'), 1);
  assert.equal(m0.get('p1'), 0);
  assert.equal(m0.get('p_end'), 0);

  // Enabled transitions at M_0
  assert.deepEqual(net.getEnabledTransitions(m0), ['t1']);
  assert.equal(net.isTransitionEnabled('t2', m0), false);

  // Fire t1 -> M_1
  const m1 = net.fireTransition('t1', m0);
  assert.equal(m1.get('p_start'), 0);
  assert.equal(m1.get('p1'), 1);
  assert.equal(m1.get('p_end'), 0);

  // Fire t2 -> M_2 (Terminal)
  const m2 = net.fireTransition('t2', m1);
  assert.equal(m2.get('p_start'), 0);
  assert.equal(m2.get('p1'), 0);
  assert.equal(m2.get('p_end'), 1);

  // Verify Incidence Matrix C
  const { incidenceMatrix, placeOrder, transitionOrder } = net.computeIncidenceMatrix();
  assert.equal(placeOrder.length, 3);
  assert.equal(transitionOrder.length, 2);

  // Find index of p_start, p1, p_end
  const pStartIdx = placeOrder.indexOf('p_start');
  const p1Idx = placeOrder.indexOf('p1');
  const pEndIdx = placeOrder.indexOf('p_end');
  const t1Idx = transitionOrder.indexOf('t1');
  const t2Idx = transitionOrder.indexOf('t2');

  // C(p_start, t1) = -1, C(p1, t1) = +1, C(p_end, t1) = 0
  assert.equal(incidenceMatrix[pStartIdx][t1Idx], -1);
  assert.equal(incidenceMatrix[p1Idx][t1Idx], 1);
  assert.equal(incidenceMatrix[pEndIdx][t1Idx], 0);

  // C(p_start, t2) = 0, C(p1, t2) = -1, C(p_end, t2) = +1
  assert.equal(incidenceMatrix[pStartIdx][t2Idx], 0);
  assert.equal(incidenceMatrix[p1Idx][t2Idx], -1);
  assert.equal(incidenceMatrix[pEndIdx][t2Idx], 1);

  // Verify state equation M_k = M_0 + C * v where v = [1, 1]^T
  const v = [0, 0];
  v[t1Idx] = 1;
  v[t2Idx] = 1;

  for (let pIdx = 0; pIdx < placeOrder.length; pIdx++) {
    const pId = placeOrder[pIdx];
    const m0Val = m0.get(pId) || 0;
    const delta = incidenceMatrix[pIdx][0] * v[0] + incidenceMatrix[pIdx][1] * v[1];
    const computedMk = m0Val + delta;
    assert.equal(computedMk, m2.get(pId) || 0, `State equation failed for place ${pId}`);
  }
});

test('M2: BPMN Process Translator maps Parallel AND-Split and AND-Join into Sound Petri Net', () => {
  const bpmnDefinition: BPMNProcessDefinition = {
    id: 'itinerary_parallel_dispatch',
    name: 'Medical Trip Dual Coordinator Dispatch',
    nodes: [
      { id: 'start', name: 'Start Event', type: 'startEvent', incoming: [], outgoing: ['f1'] },
      { id: 'and_fork', name: 'Fork Logistics', type: 'parallelGateway', incoming: ['f1'], outgoing: ['f2', 'f3'] },
      { id: 'task_driver', name: 'Dispatch Driver Ramón Rosero', type: 'serviceTask', incoming: ['f2'], outgoing: ['f4'] },
      { id: 'task_guide', name: 'Dispatch Bilingual Guide Carolina', type: 'serviceTask', incoming: ['f3'], outgoing: ['f5'] },
      { id: 'and_join', name: 'Sync Coordinators', type: 'parallelGateway', incoming: ['f4', 'f5'], outgoing: ['f6'] },
      { id: 'end', name: 'End Event', type: 'endEvent', incoming: ['f6'], outgoing: [] }
    ],
    sequenceFlows: [
      { id: 'f1', sourceRef: 'start', targetRef: 'and_fork' },
      { id: 'f2', sourceRef: 'and_fork', targetRef: 'task_driver' },
      { id: 'f3', sourceRef: 'and_fork', targetRef: 'task_guide' },
      { id: 'f4', sourceRef: 'task_driver', targetRef: 'and_join' },
      { id: 'f5', sourceRef: 'task_guide', targetRef: 'and_join' },
      { id: 'f6', sourceRef: 'and_join', targetRef: 'end' }
    ]
  };

  const net = translateBpmnProcessToPetriNet(bpmnDefinition);
  const proof = verifySoundness(net);

  assert.equal(proof.isSound, true, 'Parallel AND workflow must be Sound');
  assert.equal(proof.optionToComplete, true);
  assert.equal(proof.properCompletion, true);
  assert.equal(proof.liveTransitions, true);
  assert.equal(proof.deadlocks.length, 0);
  assert.equal(proof.deadTransitions.length, 0);
});

test('M2: BPMN XML Parser handles standard BPMN 2.0 XML schema', () => {
  const bpmnXml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Def_1">
      <bpmn:process id="quote_flow" name="Cotizacion Medica" isExecutable="true">
        <bpmn:startEvent id="Start_1">
          <bpmn:outgoing>Flow_1</bpmn:outgoing>
        </bpmn:startEvent>
        <bpmn:task id="Task_Calculate" name="Calcular Liquidacion">
          <bpmn:incoming>Flow_1</bpmn:incoming>
          <bpmn:outgoing>Flow_2</bpmn:outgoing>
        </bpmn:task>
        <bpmn:endEvent id="End_1">
          <bpmn:incoming>Flow_2</bpmn:incoming>
        </bpmn:endEvent>
        <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_Calculate" />
        <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Calculate" targetRef="End_1" />
      </bpmn:process>
    </bpmn:definitions>
  `;

  const net = translateBpmnToPetriNet(bpmnXml);
  const proof = verifySoundness(net);

  assert.equal(proof.isSound, true);
  assert.ok(proof.reachableStateCount >= 3);
});

test('M2: Soundness Verifier detects Deadlocks in malformed XOR-Split -> AND-Join workflows', () => {
  // Anti-pattern: XOR-Split branches to 2 paths, but AND-Join waits for BOTH tokens -> DEADLOCK
  const flawedBpmn: BPMNProcessDefinition = {
    id: 'flawed_deadlock_process',
    name: 'Flawed Deadlock Flow',
    nodes: [
      { id: 'start', name: 'Start', type: 'startEvent', incoming: [], outgoing: ['f1'] },
      { id: 'xor_split', name: 'Branch Choice', type: 'exclusiveGateway', incoming: ['f1'], outgoing: ['f2', 'f3'] },
      { id: 'task_a', name: 'Path A', type: 'task', incoming: ['f2'], outgoing: ['f4'] },
      { id: 'task_b', name: 'Path B', type: 'task', incoming: ['f3'], outgoing: ['f5'] },
      { id: 'and_join', name: 'Flawed AND Join', type: 'parallelGateway', incoming: ['f4', 'f5'], outgoing: ['f6'] },
      { id: 'end', name: 'End', type: 'endEvent', incoming: ['f6'], outgoing: [] }
    ],
    sequenceFlows: [
      { id: 'f1', sourceRef: 'start', targetRef: 'xor_split' },
      { id: 'f2', sourceRef: 'xor_split', targetRef: 'task_a' },
      { id: 'f3', sourceRef: 'xor_split', targetRef: 'task_b' },
      { id: 'f4', sourceRef: 'task_a', targetRef: 'and_join' },
      { id: 'f5', sourceRef: 'task_b', targetRef: 'and_join' },
      { id: 'f6', sourceRef: 'and_join', targetRef: 'end' }
    ]
  };

  const net = translateBpmnProcessToPetriNet(flawedBpmn);
  const proof = verifySoundness(net);

  assert.equal(proof.isSound, false, 'Flawed flow must NOT be sound');
  assert.equal(proof.optionToComplete, false, 'Option to complete must fail due to deadlock');
  assert.ok(proof.deadlocks.length > 0, 'Must detect at least one deadlock state');
});

test('M2: Soundness Verifier detects Proper Completion violation in AND-Split -> XOR-Join workflows', () => {
  // Anti-pattern: AND-Split forks 2 tokens, but XOR-Join fires for EACH token -> Token accumulation in End Place
  const flawedBpmn: BPMNProcessDefinition = {
    id: 'flawed_token_accumulation_process',
    name: 'Flawed Token Accumulation',
    nodes: [
      { id: 'start', name: 'Start', type: 'startEvent', incoming: [], outgoing: ['f1'] },
      { id: 'and_fork', name: 'Parallel Fork', type: 'parallelGateway', incoming: ['f1'], outgoing: ['f2', 'f3'] },
      { id: 'task_a', name: 'Path A', type: 'task', incoming: ['f2'], outgoing: ['f4'] },
      { id: 'task_b', name: 'Path B', type: 'task', incoming: ['f3'], outgoing: ['f5'] },
      { id: 'xor_join', name: 'Flawed XOR Join', type: 'exclusiveGateway', incoming: ['f4', 'f5'], outgoing: ['f6'] },
      { id: 'end', name: 'End', type: 'endEvent', incoming: ['f6'], outgoing: [] }
    ],
    sequenceFlows: [
      { id: 'f1', sourceRef: 'start', targetRef: 'and_fork' },
      { id: 'f2', sourceRef: 'and_fork', targetRef: 'task_a' },
      { id: 'f3', sourceRef: 'and_fork', targetRef: 'task_b' },
      { id: 'f4', sourceRef: 'task_a', targetRef: 'xor_join' },
      { id: 'f5', sourceRef: 'task_b', targetRef: 'xor_join' },
      { id: 'f6', sourceRef: 'xor_join', targetRef: 'end' }
    ]
  };

  const net = translateBpmnProcessToPetriNet(flawedBpmn);
  const proof = verifySoundness(net);

  assert.equal(proof.isSound, false);
  assert.equal(proof.properCompletion, false, 'Proper completion must fail due to residual/multiple tokens');
});

test('M2: LTL Temporal Engine verifies Medical Trip operational invariants', () => {
  // Realistic multi-step execution trace
  const trace: ExecutionTrace = [
    {
      index: 0,
      state: 'INTAKE_STARTED',
      variables: { Territory: 'Medellin', LeadCreated: true, QuoteGenerated: false, DepositConfirmed: false, LedgerDebits: 0n, LedgerCredits: 0n, EventCommitted: false }
    },
    {
      index: 1,
      state: 'QUOTE_CALCULATED',
      variables: { Territory: 'Medellin', LeadCreated: true, QuoteGenerated: true, DepositConfirmed: false, LedgerDebits: 150000000n, LedgerCredits: 150000000n, EventCommitted: true }
    },
    {
      index: 2,
      state: 'FLIGHT_ARRIVED',
      variables: { Territory: 'Medellin', FlightLanded: true, DriverDispatched: false, QuoteGenerated: true, DepositConfirmed: true, LedgerDebits: 200000000n, LedgerCredits: 200000000n, EventCommitted: true }
    },
    {
      index: 3,
      state: 'DRIVER_DISPATCHED',
      variables: { Territory: 'Medellin', FlightLanded: true, DriverDispatched: true, QuoteGenerated: true, DepositConfirmed: true, LedgerDebits: 200000000n, LedgerCredits: 200000000n, EventCommitted: true }
    },
    {
      index: 4,
      state: 'ITINERARY_COMPLETED',
      variables: { Territory: 'Medellin', ItineraryCompleted: true, LedgerDebits: 250000000n, LedgerCredits: 250000000n, EventCommitted: true }
    }
  ];

  // Invariant 1: G(QuoteGenerated -> F(DepositConfirmed))
  const inv1 = evaluateLTL('G(QuoteGenerated -> F(DepositConfirmed))', trace);
  assert.equal(inv1.satisfied, true, 'Quote to Deposit invariant must hold');

  // Invariant 2: G(FlightLanded -> F(DriverDispatched))
  const inv2 = evaluateLTL('G(FlightLanded -> F(DriverDispatched))', trace);
  assert.equal(inv2.satisfied, true, 'Flight landed to driver dispatch invariant must hold');

  // Invariant 3: G(EventCommitted -> LedgerDebits == LedgerCredits)
  const inv3 = evaluateLTL('G(EventCommitted -> LedgerDebits == LedgerCredits)', trace);
  assert.equal(inv3.satisfied, true, 'Ledger CQRS single-writer arithmetic invariant must hold');

  // Invariant 4: Non-operative territory guard G(Territory == 'Mocoa' -> X(State == 'ERROR_UNSUPPORTED_TERRITORY'))
  // Since territory was never Mocoa in this trace, implication vacuously holds
  const inv4 = evaluateLTL("G(Territory == 'Mocoa' -> X(State == 'ERROR_UNSUPPORTED_TERRITORY'))", trace);
  assert.equal(inv4.satisfied, true);
});

test('M2: LTL Temporal Engine flags counterexample trace on invariant violation', () => {
  // Flawed trace where Mocoa was accepted WITHOUT raising Error in next step
  const badTrace: ExecutionTrace = [
    {
      index: 0,
      state: 'INTAKE_STARTED',
      variables: { Territory: 'Mocoa', State: 'INTAKE_STARTED' }
    },
    {
      index: 1,
      state: 'QUOTE_CALCULATING', // FAILED: Did not transition to ERROR_UNSUPPORTED_TERRITORY
      variables: { Territory: 'Mocoa', State: 'QUOTE_CALCULATING' }
    }
  ];

  const result = evaluateLTL("G(Territory == 'Mocoa' -> X(State == 'ERROR_UNSUPPORTED_TERRITORY'))", badTrace);

  assert.equal(result.satisfied, false, 'Must fail on illegal territory without fail-fast error');
  assert.equal(result.violatedStepIndex, 0);
  assert.ok(result.counterExample);
  assert.ok(result.counterExample.length >= 2);
  assert.ok(result.diagnostics[0].includes('VIOLATED'));
});
