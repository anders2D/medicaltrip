#!/usr/bin/env node
/**
 * Standalone E2E Test Suite Runner for Medical Trip Colombia S.A.S.
 * Local-First Progressive Web Application (100% Offline)
 *
 * Runs all 4 test tiers:
 *   - Tier 1: Feature Coverage (>=75 tests across 15 features)
 *   - Tier 2: Boundary & Corner Cases (>=75 tests)
 *   - Tier 3: Cross-Feature Integration (>=15 tests)
 *   - Tier 4: Real-World Archetypes (4 canonical Drive workflows)
 *
 * Zero external dependencies. Formats output in a clean terminal table.
 * Returns exit code 0 on 100% pass, exit code 1 if any failure.
 */

import { ANSI, resetTestRegistry, executeSuite, defaultReporter } from './test_harness.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tier definition catalog
const TEST_TIERS = [
  {
    tier: 'Tier 1',
    name: 'Feature Coverage (15 Features x >=5 tests)',
    file: './tier1_feature_coverage.test.js',
    minTarget: 75
  },
  {
    tier: 'Tier 2',
    name: 'Boundary & Corner Cases (Mocoa, BigInt, Geofence)',
    file: './tier2_boundary_corner.test.js',
    minTarget: 75
  },
  {
    tier: 'Tier 3',
    name: 'Cross-Feature Integration & CRDT Concurrency',
    file: './tier3_cross_feature.test.js',
    minTarget: 15
  },
  {
    tier: 'Tier 4',
    name: 'Real-World Google Drive Archetypes (4 Workflows)',
    file: './tier4_real_world_archetypes.test.js',
    minTarget: 4
  },
  {
    tier: 'Tier 5',
    name: 'Adversarial Stress & Invariant Verification',
    file: './tier5_adversarial_stress.test.js',
    minTarget: 25
  }
];

function pad(str, len, align = 'left') {
  const s = String(str);
  const diff = len - s.length;
  if (diff <= 0) return s;
  return align === 'right' ? ' '.repeat(diff) + s : s + ' '.repeat(diff);
}

function printHeader() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}║   🏥 MEDICAL TRIP COLOMBIA S.A.S. — AUTOMATED E2E TEST SUITE RUNNER (100% OFFLINE)                   ║${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}║   Local-First PWA · Hexagonal Architecture · BigInt Centavos · Actor Concurrency · 4 Archetypes      ║${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝${ANSI.reset}\n`);
}

async function runTier(tierConfig, tierIndex, totalTiers) {
  const tierStart = Date.now();
  console.log(`${ANSI.bold}${ANSI.blue}▶ [${tierIndex}/${totalTiers}] Executing ${tierConfig.tier}: ${tierConfig.name}${ANSI.reset}`);

  // Dynamic import of the test suite file
  resetTestRegistry();
  await import(`${tierConfig.file}?t=${Date.now()}`);

  const { default: rootSuiteExport, ...rest } = await import('./test_harness.js');
  // Run all suites registered in test_harness for this tier
  // Import the internal rootSuite via harness runner
  const runnerResult = await (async () => {
    const harness = await import('./test_harness.js');
    return harness.runAllTests(`${tierConfig.tier} - ${tierConfig.name}`);
  })();

  const tierDuration = Date.now() - tierStart;

  return {
    tier: tierConfig.tier,
    name: tierConfig.name,
    minTarget: tierConfig.minTarget,
    passed: runnerResult.passed,
    failed: runnerResult.failed,
    total: runnerResult.total,
    durationMs: tierDuration,
    status: runnerResult.failed === 0 && runnerResult.total >= tierConfig.minTarget ? 'PASS' : 'FAIL'
  };
}

function printSummaryTable(results, totalDuration) {
  console.log(`\n${ANSI.bold}${ANSI.white}══════════════════════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.white}  📊 E2E TEST SUITE EXECUTION SUMMARY TABLE${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.white}══════════════════════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}`);

  const colTier = 8;
  const colName = 54;
  const colTarget = 8;
  const colPassed = 8;
  const colFailed = 8;
  const colTime = 10;
  const colStatus = 8;

  const headerRow = `  ${pad('TIER', colTier)} ${pad('SUITE NAME', colName)} ${pad('TARGET', colTarget, 'right')} ${pad('PASSED', colPassed, 'right')} ${pad('FAILED', colFailed, 'right')} ${pad('TIME', colTime, 'right')} ${pad('STATUS', colStatus)}`;
  console.log(`${ANSI.bold}${ANSI.gray}${headerRow}${ANSI.reset}`);
  console.log(`  ${'-'.repeat(colTier + colName + colTarget + colPassed + colFailed + colTime + colStatus + 6)}`);

  let grandTotalPassed = 0;
  let grandTotalFailed = 0;
  let grandTotalTests = 0;
  let grandTotalTarget = 0;

  for (const r of results) {
    grandTotalPassed += r.passed;
    grandTotalFailed += r.failed;
    grandTotalTests += r.total;
    grandTotalTarget += r.minTarget;

    const statusBadge = r.status === 'PASS'
      ? `${ANSI.green}${ANSI.bold}PASS ✓${ANSI.reset}`
      : `${ANSI.red}${ANSI.bold}FAIL ✗${ANSI.reset}`;

    const line = `  ${pad(r.tier, colTier)} ${pad(r.name, colName)} ${pad(r.minTarget, colTarget, 'right')} ${pad(r.passed, colPassed, 'right')} ${pad(r.failed, colFailed, 'right')} ${pad(`${r.durationMs}ms`, colTime, 'right')} ${statusBadge}`;
    console.log(line);
  }

  console.log(`  ${'='.repeat(colTier + colName + colTarget + colPassed + colFailed + colTime + colStatus + 6)}`);
  const totalStatusBadge = grandTotalFailed === 0 && grandTotalTests >= grandTotalTarget
    ? `${ANSI.bgGreen}${ANSI.white}${ANSI.bold} ALL PASSED ✓ ${ANSI.reset}`
    : `${ANSI.bgRed}${ANSI.white}${ANSI.bold} FAILED ✗ ${ANSI.reset}`;

  const totalLine = `  ${pad('TOTAL', colTier)} ${pad(`All ${TEST_TIERS.length} Test Tiers Combined`, colName)} ${pad(grandTotalTarget, colTarget, 'right')} ${pad(grandTotalPassed, colPassed, 'right')} ${pad(grandTotalFailed, colFailed, 'right')} ${pad(`${totalDuration}ms`, colTime, 'right')} ${totalStatusBadge}`;
  console.log(`${ANSI.bold}${totalLine}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.white}══════════════════════════════════════════════════════════════════════════════════════════════════════════${ANSI.reset}\n`);

  return { grandTotalPassed, grandTotalFailed, grandTotalTests, grandTotalTarget };
}

async function main() {
  const globalStart = Date.now();
  printHeader();

  const results = [];

  for (let i = 0; i < TEST_TIERS.length; i++) {
    const tierConfig = TEST_TIERS[i];
    const res = await runTier(tierConfig, i + 1, TEST_TIERS.length);
    results.push(res);
  }

  const globalDuration = Date.now() - globalStart;
  const totals = printSummaryTable(results, globalDuration);

  if (totals.grandTotalFailed > 0) {
    console.error(`${ANSI.red}${ANSI.bold}❌ TEST SUITE RUN FAILED with ${totals.grandTotalFailed} failing test(s).${ANSI.reset}\n`);
    process.exit(1);
  } else if (totals.grandTotalTests < totals.grandTotalTarget) {
    console.error(`${ANSI.yellow}${ANSI.bold}⚠️ TEST SUITE RUN DID NOT REACH MINIMUM TARGET (${totals.grandTotalTests}/${totals.grandTotalTarget}).${ANSI.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${ANSI.green}${ANSI.bold}✅ 100% E2E TEST TRACK SUCCESS: All ${totals.grandTotalTests} tests passed across Tiers 1-${TEST_TIERS.length}!${ANSI.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`Fatal Runner Error: ${err.message}`, err);
  process.exit(1);
});
