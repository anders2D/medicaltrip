/**
 * Test Suite: Milestone 5 - CI/CD Master Lifecycle Runner, Quarantine & Reporter
 * 
 * Verifies the complete 7-stage autonomous journey lifecycle:
 * - Stage 1: Auth & Session Provisioning
 * - Stage 2: Lead & Territory Invariant (Medellin operative vs. Mocoa fail-fast)
 * - Stage 3: Canvas Touch Pinch/Zoom & Pressure-sensitive Signature
 * - Stage 4: KYC/OCR Receipt Processing & IndexedDB Blob Linkage
 * - Stage 5: Dynamic Quote & BPMN Petri Net Soundness
 * - Stage 6: Adversarial Rollback & Compensation
 * - Stage 7: Ledger Idempotence & 0-cent Variance Audit
 * 
 * Also verifies:
 * - Flakiness Quarantine Engine (Fs = failures / runs, automatic isolation at Fs >= 0.15, unquarantine)
 * - Multi-Format Diagnostics Reporter (TAP 13, JUnit XML, SARIF 2.1.0, exit codes)
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  MasterLifecycleRunner,
  runMasterLifecycleJourney,
  isOperativeTerritory,
  OperativeTerritoryViolationError,
  STAGE_METADATA,
  MasterJourneyConfig
} from '../src/runner/test-runner.js';

import {
  QuarantineManager,
  computeFlakinessScore,
  ExecutionRecord
} from '../src/runner/quarantine.js';

import {
  MultiFormatReporter,
  generateTAPReport,
  generateJUnitXML,
  generateSARIF,
  exportDiagnostics,
  determineExitCode,
  TestResultItem,
  normalizeToSummary
} from '../src/runner/reporter.js';

import { MockCDPClient } from '../src/cdp/cdp-client.js';

describe('M5: Master 7-Stage E2E Lifecycle Journey', () => {
  it('should execute the full 7-stage journey for RVA171 (Catia x5) with 100% stage pass and zero ledger variance', async () => {
    const report = await runMasterLifecycleJourney({
      archetypeCode: 'RVA171',
      territory: 'Medellín',
      networkProfile: 'FAST_3G'
    });

    assert.equal(report.archetypeCode, 'RVA171');
    assert.match(report.patientCode, /^ENT-PAX-\d{4}$/);
    assert.equal(report.overallStatus, 'PASSED');
    assert.equal(report.stages.length, 7);

    // All 7 stages must pass
    for (const stage of report.stages) {
      assert.equal(stage.passed, true, `Stage ${stage.stage} (${stage.stageName}) failed: ${stage.error}`);
    }

    // Ledger audit must have 0-cent variance
    assert.equal(report.ledgerAudit.isBalanced, true);
    assert.equal(report.ledgerAudit.varianceCents, 0n);
    assert.equal(report.ledgerAudit.idempotenceVerified, true);
    assert.ok(report.ledgerAudit.debitsCopCents > 0n);
    assert.equal(report.ledgerAudit.debitsCopCents, report.ledgerAudit.creditsCopCents);
  });

  it('should execute the full 7-stage journey for RVA282 (George Cardio) at Cardio VID', async () => {
    const report = await runMasterLifecycleJourney({
      archetypeCode: 'RVA282',
      territory: 'Envigado',
      networkProfile: 'SLOW_3G'
    });

    assert.equal(report.archetypeCode, 'RVA282');
    assert.equal(report.overallStatus, 'PASSED');
    assert.equal(report.stages.length, 7);

    // Verify clinical details
    const leadStage = report.stages.find((s) => s.stage === 2);
    assert.ok(leadStage);
    assert.equal(leadStage.data.leadValidated, true);

    assert.equal(report.ledgerAudit.isBalanced, true);
    assert.equal(report.ledgerAudit.varianceCents, 0n);
  });

  it('should execute the full 7-stage journey for RVA341 (Hogenboom CES) and RVA077 (Rumai HPTU)', async () => {
    const report341 = await runMasterLifecycleJourney({ archetypeCode: 'RVA341', territory: 'Itagüí' });
    assert.equal(report341.archetypeCode, 'RVA341');
    assert.equal(report341.overallStatus, 'PASSED');
    assert.equal(report341.ledgerAudit.isBalanced, true);

    const report077 = await runMasterLifecycleJourney({ archetypeCode: 'RVA077', territory: 'Rionegro' });
    assert.equal(report077.archetypeCode, 'RVA077');
    assert.equal(report077.overallStatus, 'PASSED');
    assert.equal(report077.ledgerAudit.isBalanced, true);
  });

  it('Stage 1: should provision authentic session token and validate ENT-PAX identity with zero PII', async () => {
    const runner = new MasterLifecycleRunner({ archetypeCode: 'RVA171', stages: [1] });
    const stage1 = await runner.executeStage1Auth();

    assert.equal(stage1.stage, 1);
    assert.equal(stage1.stageName, 'AUTH_SESSION');
    assert.equal(stage1.passed, true);
    assert.ok(typeof stage1.data.sessionToken === 'string');
    assert.match(String(stage1.data.patientCode), /^ENT-PAX-\d{4}$/);
    assert.ok(stage1.ltlProof);
    assert.equal(stage1.ltlProof.satisfied, true);
  });

  it('Stage 2: should accept valid operative territories and fail-fast on non-operative territory (Mocoa)', async () => {
    assert.equal(isOperativeTerritory('Medellin'), true);
    assert.equal(isOperativeTerritory('Envigado'), true);
    assert.equal(isOperativeTerritory('Itagüí'), true);
    assert.equal(isOperativeTerritory('Sabaneta'), true);
    assert.equal(isOperativeTerritory('Rionegro'), true);

    assert.equal(isOperativeTerritory('Mocoa'), false);
    assert.equal(isOperativeTerritory('Leticia'), false);
    assert.equal(isOperativeTerritory('Amazonas'), false);
    assert.equal(isOperativeTerritory('Choco'), false);

    // Fail-fast error throwing
    const runnerForbidden = new MasterLifecycleRunner({ archetypeCode: 'RVA171', territory: 'Mocoa', stages: [2] });
    await assert.rejects(
      async () => {
        await runnerForbidden.executeStage2Lead();
      },
      (err: any) => err instanceof OperativeTerritoryViolationError && err.message.includes('Mocoa')
    );

    // Adversarial scenario handling
    const reportAdv = await runMasterLifecycleJourney({
      archetypeCode: 'RVA171',
      adversarialScenario: 'INVALID_TERRITORY',
      stages: [2]
    });
    const stage2 = reportAdv.stages.find((s) => s.stage === 2);
    assert.ok(stage2);
    assert.equal(stage2.passed, true);
    assert.equal(stage2.data.adversarialSuccess, true);
  });

  it('Stage 3: should dispatch CDP Pinch-to-Zoom and continuous pressure-sensitive handwriting signature', async () => {
    const mockCdp = new MockCDPClient();
    const runner = new MasterLifecycleRunner({ archetypeCode: 'RVA282', cdpClient: mockCdp, stages: [3] });
    const stage3 = await runner.executeStage3CanvasTouch();

    assert.equal(stage3.stage, 3);
    assert.equal(stage3.passed, true);
    assert.ok(Number(stage3.data.touchEventsCount) >= 2);

    const touchCommands = mockCdp.sentCommands.filter((c) => c.method === 'Input.dispatchTouchEvent');
    assert.ok(touchCommands.length >= 2);
  });

  it('Stage 4: should verify 64-character SHA-256 salted passport hashes and OCR expense receipts', async () => {
    const runner = new MasterLifecycleRunner({ archetypeCode: 'RVA341', stages: [4] });
    const stage4 = await runner.executeStage4KycOcr();

    assert.equal(stage4.stage, 4);
    assert.equal(stage4.passed, true);
    assert.match(String(stage4.data.passportHash), /^[a-f0-9]{64}$/);
    assert.ok(Number(stage4.data.receiptsCount) > 0);
  });

  it('Stage 5: should verify mathematical soundness of BPMN medical itinerary workflow via Petri Net', async () => {
    const runner = new MasterLifecycleRunner({ archetypeCode: 'RVA077', stages: [5] });
    const stage5 = await runner.executeStage5DynamicQuote();

    assert.equal(stage5.stage, 5);
    assert.equal(stage5.passed, true);
    assert.ok(stage5.petriSoundness);
    assert.equal(stage5.petriSoundness.isSound, true);
    assert.equal(stage5.petriSoundness.deadlocks.length, 0);
    assert.equal(stage5.petriSoundness.properCompletion, true);
    assert.ok(BigInt(stage5.data.quoteBalanceCents as bigint) > 0n);
  });

  it('Stage 6: should execute compensation and state restoration on payment failure rollback path', async () => {
    const runner = new MasterLifecycleRunner({
      archetypeCode: 'RVA171',
      adversarialScenario: 'PAYMENT_FAILURE',
      stages: [5, 6]
    });
    await runner.executeStage5DynamicQuote();
    const stage6 = await runner.executeStage6Rollback();

    assert.equal(stage6.stage, 6);
    assert.equal(stage6.passed, true);
    assert.equal(stage6.data.rollbackTested, true);
    assert.equal(stage6.data.rollbackExecuted, true);
    assert.ok(stage6.ltlProof);
    assert.equal(stage6.ltlProof.satisfied, true);
  });

  it('Stage 7: should verify zero-drift CQRS ledger balance and event idempotence on replay', async () => {
    const runner = new MasterLifecycleRunner({ archetypeCode: 'RVA282', stages: [5, 7] });
    await runner.executeStage5DynamicQuote();
    const stage7 = await runner.executeStage7Ledger();

    assert.equal(stage7.stage, 7);
    assert.equal(stage7.passed, true);
    assert.equal(stage7.data.ledgerBalanced, true);
    assert.equal(stage7.data.idempotenceVerified, true);
    assert.equal(stage7.data.varianceCents, 0n);
  });
});

describe('M5: Flakiness Quarantine Engine', () => {
  it('should compute flakiness score Fs = 0.0 for consistently passing test runs', () => {
    const records: ExecutionRecord[] = [
      { testId: 'test_auth', passed: true, durationMs: 25 },
      { testId: 'test_auth', passed: true, durationMs: 22 },
      { testId: 'test_auth', passed: true, durationMs: 28 },
      { testId: 'test_auth', passed: true, durationMs: 30 },
      { testId: 'test_auth', passed: true, durationMs: 24 }
    ];

    const score = computeFlakinessScore(records);
    assert.equal(score, 0.0);

    const qm = new QuarantineManager();
    qm.recordRuns(records);
    assert.equal(qm.computeFlakinessScore('test_auth'), 0.0);
    assert.equal(qm.isQuarantined('test_auth'), false);
  });

  it('should calculate flakiness score Fs = 0.20 when 2 of 10 runs fail intermittently', () => {
    const qm = new QuarantineManager();
    for (let i = 0; i < 8; i++) {
      qm.recordRun({ testId: 'test_pinch_zoom', passed: true, durationMs: 40 });
    }
    for (let i = 0; i < 2; i++) {
      qm.recordRun({ testId: 'test_pinch_zoom', passed: false, durationMs: 120, error: 'CDP timeout' });
    }

    assert.equal(qm.computeFlakinessScore('test_pinch_zoom'), 0.20);
    // Score 0.20 >= threshold 0.15 with 10 runs -> automatically quarantined
    assert.equal(qm.isQuarantined('test_pinch_zoom'), true);
  });

  it('should automatically isolate tests with Fs >= 0.15 into quarantine sandbox', () => {
    const qm = new QuarantineManager({ threshold: 0.15, minRunsBeforeQuarantine: 5 });

    // 4 passes + 1 fail = 20% failure rate -> quarantined
    for (let i = 0; i < 4; i++) {
      qm.recordRun({ testId: 'test_ocr_parser', passed: true, durationMs: 30 });
    }
    const report = qm.recordRun({ testId: 'test_ocr_parser', passed: false, durationMs: 45, error: 'OCR read error' });

    assert.equal(report.flakinessScore, 0.20);
    assert.equal(report.isQuarantined, true);
    assert.equal(qm.isQuarantined('test_ocr_parser'), true);
    assert.ok(qm.getQuarantinedTests().some((t) => t.testId === 'test_ocr_parser'));
  });

  it('should not quarantine tests with flakiness score below threshold (Fs < 0.15)', () => {
    const qm = new QuarantineManager({ threshold: 0.15, minRunsBeforeQuarantine: 5 });

    // 9 passes + 1 fail = 10% failure rate (< 15%)
    for (let i = 0; i < 9; i++) {
      qm.recordRun({ testId: 'test_stable_lead', passed: true, durationMs: 20 });
    }
    qm.recordRun({ testId: 'test_stable_lead', passed: false, durationMs: 30, error: 'Minor network blip' });

    assert.equal(qm.computeFlakinessScore('test_stable_lead'), 0.10);
    assert.equal(qm.isQuarantined('test_stable_lead'), false);
  });

  it('should automatically unquarantine a test after 5 consecutive passes', () => {
    const qm = new QuarantineManager({ threshold: 0.15, minRunsBeforeQuarantine: 5, consecutivePassesToUnquarantine: 5 });

    // Force quarantine
    for (let i = 0; i < 3; i++) qm.recordRun({ testId: 'test_flaky_crdt', passed: true, durationMs: 25 });
    for (let i = 0; i < 2; i++) qm.recordRun({ testId: 'test_flaky_crdt', passed: false, durationMs: 50 });
    assert.equal(qm.isQuarantined('test_flaky_crdt'), true);

    // 4 consecutive passes -> still quarantined
    for (let i = 0; i < 4; i++) {
      qm.recordRun({ testId: 'test_flaky_crdt', passed: true, durationMs: 20 });
    }
    assert.equal(qm.isQuarantined('test_flaky_crdt'), true);

    // 5th consecutive pass -> unquarantined!
    qm.recordRun({ testId: 'test_flaky_crdt', passed: true, durationMs: 20 });
    assert.equal(qm.isQuarantined('test_flaky_crdt'), false);
  });

  it('should filter test suites based on active, quarantine, and all modes', () => {
    const qm = new QuarantineManager();
    for (let i = 0; i < 5; i++) qm.recordRun({ testId: 'test_active_1', passed: true, durationMs: 15 });
    for (let i = 0; i < 5; i++) qm.recordRun({ testId: 'test_active_2', passed: true, durationMs: 15 });
    qm.quarantineTest('test_flaky_1', 'Manual quarantine');

    const testSuite = [
      { id: 'test_active_1', name: 'Test 1' },
      { id: 'test_active_2', name: 'Test 2' },
      { id: 'test_flaky_1', name: 'Flaky Test' }
    ];

    const activeTests = qm.filterSuite(testSuite, 'ACTIVE_ONLY');
    assert.equal(activeTests.length, 2);
    assert.ok(!activeTests.some((t) => t.id === 'test_flaky_1'));

    const quarantinedTests = qm.filterSuite(testSuite, 'QUARANTINE_ONLY');
    assert.equal(quarantinedTests.length, 1);
    assert.equal(quarantinedTests[0].id, 'test_flaky_1');

    const allTests = qm.filterSuite(testSuite, 'ALL');
    assert.equal(allTests.length, 3);
  });

  it('should capture diagnostic archive with error signatures and traces for quarantined tests', () => {
    const qm = new QuarantineManager();
    qm.recordRun({ testId: 'test_trace_archive', suiteName: 'CDP', testName: 'Pinch Zoom', passed: false, durationMs: 80, error: 'Protocol Error' });
    qm.recordRun({ testId: 'test_trace_archive', suiteName: 'CDP', testName: 'Pinch Zoom', passed: false, durationMs: 85, error: 'Protocol Error' });
    qm.quarantineTest('test_trace_archive', 'High failure rate');

    const archive = qm.getDiagnosticArchive('test_trace_archive');
    assert.ok(archive);
    assert.equal(archive.testId, 'test_trace_archive');
    assert.equal(archive.suiteName, 'CDP');
    assert.ok(archive.errorSignatures.includes('Protocol Error'));
    assert.equal(archive.failuresCount, 2);
    assert.ok(archive.capturedTraces.length >= 2);
  });
});

describe('M5: Multi-Format Diagnostics Reporter', () => {
  const sampleResults: TestResultItem[] = [
    { suiteName: 'Perception', testName: 'Stagehand DOM Trimmer', passed: true, durationMs: 22 },
    { suiteName: 'Formal', testName: 'Petri Net Soundness Proof', passed: true, durationMs: 18 },
    { suiteName: 'CDP', testName: 'Multi-Touch Pressure Stroke', passed: false, durationMs: 55, error: 'Touch force out of bounds', errorStack: 'Error: Touch force out of bounds\n at gesture-dispatcher.ts:120' },
    { suiteName: 'Visual', testName: 'SSIM Masked Animation', passed: true, durationMs: 34 },
    { suiteName: 'Runner', testName: 'Quarantine Sandbox Isolation', passed: true, durationMs: 12, skipped: true }
  ];

  it('should generate compliant TAP 13 test stream output', () => {
    const tap = generateTAPReport(sampleResults);
    assert.ok(tap.startsWith('TAP version 13'));
    assert.ok(tap.includes('1..5'));
    assert.ok(tap.includes('ok 1 - Perception > Stagehand DOM Trimmer'));
    assert.ok(tap.includes('not ok 3 - CDP > Multi-Touch Pressure Stroke'));
    assert.ok(tap.includes('ok 5 - # SKIP Runner > Quarantine Sandbox Isolation'));
    assert.ok(tap.includes('# pass 3'));
    assert.ok(tap.includes('# fail 1'));
    assert.ok(tap.includes('# skipped 1'));
  });

  it('should generate compliant JUnit XML report schema for CI/CD test results ingestion', () => {
    const xml = generateJUnitXML(sampleResults, 'Master Framework Suite');
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<testsuites name="Master Framework Suite" tests="5" failures="1" errors="0" skipped="1"'));
    assert.ok(xml.includes('<testcase name="Multi-Touch Pressure Stroke" classname="CDP"'));
    assert.ok(xml.includes('<failure message="Touch force out of bounds" type="AssertionError">'));
    assert.ok(xml.includes('<![CDATA[Error: Touch force out of bounds'));
    assert.ok(xml.includes('<skipped/>'));
  });

  it('should generate compliant SARIF 2.1.0 diagnostics report for static analysis platforms', () => {
    const sarifStr = generateSARIF(sampleResults);
    const sarif = JSON.parse(sarifStr);

    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.$schema, 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json');
    assert.ok(sarif.runs && sarif.runs.length > 0);
    assert.equal(sarif.runs[0].tool.driver.name, '@medicaltrip/autonomous-e2e-testing-framework');

    const results = sarif.runs[0].results;
    assert.equal(results.length, 1);
    assert.equal(results[0].ruleId, 'E2E_VERIFICATION_FAILURE');
    assert.equal(results[0].level, 'error');
    assert.ok(results[0].message.text.includes('CDP - Multi-Touch Pressure Stroke'));
  });

  it('should route diagnostics via exportDiagnostics for TAP, JUNIT, and SARIF', () => {
    const tap = exportDiagnostics(sampleResults, 'TAP');
    const junit = exportDiagnostics(sampleResults, 'JUNIT');
    const sarif = exportDiagnostics(sampleResults, 'SARIF');

    assert.ok(tap.includes('TAP version 13'));
    assert.ok(junit.includes('<testsuites'));
    assert.ok(sarif.includes('"version": "2.1.0"'));
  });

  it('should determine exit code 0 when all active tests pass, and exit code 1 on failures', () => {
    const allPassing: TestResultItem[] = [
      { suiteName: 'Formal', testName: 'Soundness', passed: true, durationMs: 10 },
      { suiteName: 'CDP', testName: 'Gesture', passed: true, durationMs: 15 }
    ];
    assert.equal(determineExitCode(allPassing), 0);

    const withFailure: TestResultItem[] = [
      { suiteName: 'Formal', testName: 'Soundness', passed: true, durationMs: 10 },
      { suiteName: 'CDP', testName: 'Gesture', passed: false, durationMs: 15, error: 'Failed' }
    ];
    assert.equal(determineExitCode(withFailure), 1);

    // Quarantined failure ignored when determining exit code
    const withQuarantinedFailure: TestResultItem[] = [
      { suiteName: 'Formal', testName: 'Soundness', passed: true, durationMs: 10 },
      { suiteName: 'CDP', testName: 'Gesture', passed: false, durationMs: 15, isQuarantined: true, error: 'Flaky failure' }
    ];
    assert.equal(determineExitCode(withQuarantinedFailure, true), 0);
    assert.equal(determineExitCode(withQuarantinedFailure, false), 1);
  });

  it('MultiFormatReporter: should record suite items and write formatted files', () => {
    const reporter = new MultiFormatReporter();
    reporter.recordSuite('Perception', [
      { suiteName: 'Perception', testName: 'DOM Trimmer', passed: true, durationMs: 20 }
    ]);
    reporter.recordSuite('Formal', [
      { suiteName: 'Formal', testName: 'LTL Engine', passed: true, durationMs: 15 }
    ]);

    const summary = reporter.getSummary();
    assert.equal(summary.totalTests, 2);
    assert.equal(summary.passed, 2);
    assert.equal(summary.failed, 0);
    assert.equal(reporter.getExitCode(), 0);

    assert.ok(reporter.toTAP().includes('1..2'));
    assert.ok(reporter.toJUnit().includes('tests="2"'));
    assert.ok(reporter.toSARIF().includes('"results": []'));
  });
});
