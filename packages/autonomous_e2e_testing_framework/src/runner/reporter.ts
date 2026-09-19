/**
 * reporter.ts
 * Multi-Format Diagnostics Reporter for CI/CD Sandboxes.
 * 
 * Supports:
 * 1. TAP 13 (Test Anything Protocol)
 * 2. Standard JUnit XML (for CI/CD test results ingestion)
 * 3. SARIF 2.1.0 (Static Analysis Results Interchange Format for vulnerability/failure diagnostics)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface TestResultItem {
  suiteName: string;
  testName: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  errorStack?: string;
  skipped?: boolean;
  isQuarantined?: boolean;
  testId?: string;
  metadata?: Record<string, unknown>;
}

export interface SuiteResultSummary {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  quarantined: number;
  durationMs: number;
  items: TestResultItem[];
}

export interface FrameworkExecutionSummary {
  frameworkVersion: string;
  timestamp: string;
  suites: SuiteResultSummary[];
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  quarantined: number;
  durationMs: number;
  exitCode: number;
}

/**
 * Normalizes input list or summary to an array of TestResultItem.
 */
export function normalizeToTestResults(
  input: TestResultItem[] | FrameworkExecutionSummary | any
): TestResultItem[] {
  if (Array.isArray(input)) {
    return input;
  }
  if (input && typeof input === 'object') {
    if (Array.isArray(input.suites)) {
      const results: TestResultItem[] = [];
      for (const suite of input.suites) {
        if (Array.isArray(suite.items)) {
          results.push(...suite.items);
        }
      }
      return results;
    }
    if (Array.isArray(input.stages)) {
      // Input is a JourneyExecutionReport
      return input.stages.map((st: any) => ({
        suiteName: input.archetypeCode || 'MasterJourney',
        testName: `Stage ${st.stage}: ${st.stageName || st.name || st.description}`,
        passed: st.passed,
        durationMs: st.durationMs || 10,
        error: st.error,
        testId: `stage-${st.stage}`
      }));
    }
  }
  return [];
}

/**
 * Normalizes input to FrameworkExecutionSummary.
 */
export function normalizeToSummary(
  input: TestResultItem[] | FrameworkExecutionSummary | any
): FrameworkExecutionSummary {
  if (input && !Array.isArray(input) && Array.isArray(input.suites)) {
    return input as FrameworkExecutionSummary;
  }

  const items = normalizeToTestResults(input);
  const suiteMap = new Map<string, TestResultItem[]>();

  for (const item of items) {
    const sName = item.suiteName || 'DefaultSuite';
    if (!suiteMap.has(sName)) {
      suiteMap.set(sName, []);
    }
    suiteMap.get(sName)!.push(item);
  }

  const suites: SuiteResultSummary[] = [];
  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let quarantined = 0;
  let totalDurationMs = 0;

  for (const [suiteName, sItems] of suiteMap.entries()) {
    const sPassed = sItems.filter((i) => i.passed && !i.skipped).length;
    const sFailed = sItems.filter((i) => !i.passed && !i.skipped).length;
    const sSkipped = sItems.filter((i) => i.skipped).length;
    const sQuarantined = sItems.filter((i) => i.isQuarantined).length;
    const sDuration = sItems.reduce((acc, i) => acc + (i.durationMs || 0), 0);

    totalTests += sItems.length;
    passed += sPassed;
    failed += sFailed;
    skipped += sSkipped;
    quarantined += sQuarantined;
    totalDurationMs += sDuration;

    suites.push({
      suiteName,
      totalTests: sItems.length,
      passed: sPassed,
      failed: sFailed,
      skipped: sSkipped,
      quarantined: sQuarantined,
      durationMs: sDuration,
      items: sItems
    });
  }

  const exitCode = determineExitCode(items);

  return {
    frameworkVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    suites,
    totalTests,
    passed,
    failed,
    skipped,
    quarantined,
    durationMs: totalDurationMs,
    exitCode
  };
}

/**
 * Generates TAP 13 (Test Anything Protocol) formatted output stream.
 */
export function generateTAPReport(
  input: TestResultItem[] | FrameworkExecutionSummary | any
): string {
  const items = normalizeToTestResults(input);
  const lines: string[] = ['TAP version 13', `1..${items.length}`];

  items.forEach((item, index) => {
    const testNum = index + 1;
    const desc = `${item.suiteName || 'Suite'} > ${item.testName}`;

    if (item.skipped) {
      lines.push(`ok ${testNum} - # SKIP ${desc}`);
    } else if (item.passed) {
      lines.push(`ok ${testNum} - ${desc}`);
      lines.push('  ---');
      lines.push(`  duration_ms: ${(item.durationMs || 0).toFixed(3)}`);
      lines.push("  type: 'test'");
      lines.push('  ...');
    } else {
      lines.push(`not ok ${testNum} - ${desc}`);
      lines.push('  ---');
      lines.push(`  duration_ms: ${(item.durationMs || 0).toFixed(3)}`);
      lines.push(`  error: ${JSON.stringify(item.error || 'Assertion failed')}`);
      if (item.errorStack) {
        lines.push(`  stack: ${JSON.stringify(item.errorStack)}`);
      }
      lines.push("  type: 'test'");
      lines.push('  ...');
    }
  });

  const passedCount = items.filter((i) => i.passed && !i.skipped).length;
  const failedCount = items.filter((i) => !i.passed && !i.skipped).length;
  const skippedCount = items.filter((i) => i.skipped).length;

  lines.push(`# tests ${items.length}`);
  lines.push(`# pass ${passedCount}`);
  lines.push(`# fail ${failedCount}`);
  lines.push(`# skipped ${skippedCount}`);

  return lines.join('\n');
}

/**
 * Escapes XML special characters.
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates standard JUnit XML compliant report.
 */
export function generateJUnitXML(
  input: TestResultItem[] | FrameworkExecutionSummary | any,
  rootSuiteName: string = 'E2E Master Suite'
): string {
  const summary = normalizeToSummary(input);
  const totalSeconds = (summary.durationMs / 1000).toFixed(3);

  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="${escapeXML(rootSuiteName)}" tests="${summary.totalTests}" failures="${summary.failed}" errors="0" skipped="${summary.skipped}" time="${totalSeconds}">`
  ];

  for (const suite of summary.suites) {
    const suiteSeconds = (suite.durationMs / 1000).toFixed(3);
    xmlLines.push(
      `  <testsuite name="${escapeXML(suite.suiteName)}" tests="${suite.totalTests}" failures="${suite.failed}" errors="0" skipped="${suite.skipped}" time="${suiteSeconds}" timestamp="${summary.timestamp}">`
    );

    for (const item of suite.items) {
      const itemSeconds = ((item.durationMs || 0) / 1000).toFixed(3);
      xmlLines.push(
        `    <testcase name="${escapeXML(item.testName)}" classname="${escapeXML(item.suiteName)}" time="${itemSeconds}">`
      );

      if (item.skipped) {
        xmlLines.push('      <skipped/>');
      } else if (!item.passed) {
        const errorMsg = escapeXML(item.error || 'Test assertion failed');
        xmlLines.push(`      <failure message="${errorMsg}" type="AssertionError">`);
        if (item.errorStack) {
          xmlLines.push(`<![CDATA[${item.errorStack}]]>`);
        } else {
          xmlLines.push(`<![CDATA[${item.error || 'Failure'}]]>`);
        }
        xmlLines.push('      </failure>');
      }

      xmlLines.push('    </testcase>');
    }

    xmlLines.push('  </testsuite>');
  }

  xmlLines.push('</testsuites>');
  return xmlLines.join('\n');
}

/**
 * Generates SARIF 2.1.0 static analysis & verification failure report.
 */
export function generateSARIF(
  input: TestResultItem[] | FrameworkExecutionSummary | any
): string {
  const items = normalizeToTestResults(input);
  const failures = items.filter((i) => !i.passed && !i.skipped);

  const sarif = {
    version: '2.1.0',
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: '@medicaltrip/autonomous-e2e-testing-framework',
            version: '1.0.0',
            informationUri: 'https://github.com/medicaltrip/autonomous_e2e_testing_framework',
            rules: [
              {
                id: 'E2E_VERIFICATION_FAILURE',
                name: 'E2EVerificationFailure',
                shortDescription: { text: 'Automated E2E test or formal invariant verification failed' },
                defaultConfiguration: { level: 'error' }
              }
            ]
          }
        },
        results: failures.map((f) => ({
          ruleId: 'E2E_VERIFICATION_FAILURE',
          level: 'error',
          message: {
            text: `Test failed: ${f.suiteName} - ${f.testName} (${f.error || 'Assertion failed'})`
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: `tests/${f.suiteName.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.test.ts`
                }
              }
            }
          ],
          properties: {
            durationMs: f.durationMs,
            isQuarantined: f.isQuarantined ?? false,
            testId: f.testId
          }
        }))
      }
    ]
  };

  return JSON.stringify(sarif, null, 2);
}

/**
 * Unified diagnostics export router.
 */
export function exportDiagnostics(
  report: TestResultItem[] | FrameworkExecutionSummary | any,
  format: 'TAP' | 'JUNIT' | 'SARIF'
): string {
  switch (format) {
    case 'TAP':
      return generateTAPReport(report);
    case 'JUNIT':
      return generateJUnitXML(report);
    case 'SARIF':
      return generateSARIF(report);
    default:
      throw new Error(`Unsupported report format: ${format}`);
  }
}

/**
 * Determines CLI exit code (0 if all passing or non-quarantined passing, 1 if failures exist).
 */
export function determineExitCode(
  input: TestResultItem[] | FrameworkExecutionSummary | any,
  ignoreQuarantined: boolean = true
): number {
  const items = normalizeToTestResults(input);
  const activeFailures = items.filter((i) => {
    if (i.skipped) return false;
    if (i.passed) return false;
    if (ignoreQuarantined && i.isQuarantined) return false;
    return true;
  });

  return activeFailures.length === 0 ? 0 : 1;
}

/**
 * MultiFormatReporter class for managing and exporting test runs.
 */
export class MultiFormatReporter {
  private items: TestResultItem[] = [];

  public record(item: TestResultItem): void {
    this.items.push(item);
  }

  public recordSuite(suiteName: string, items: TestResultItem[]): void {
    for (const item of items) {
      this.items.push({ ...item, suiteName });
    }
  }

  public getSummary(): FrameworkExecutionSummary {
    return normalizeToSummary(this.items);
  }

  public toTAP(): string {
    return generateTAPReport(this.items);
  }

  public toJUnit(rootSuiteName?: string): string {
    return generateJUnitXML(this.items, rootSuiteName);
  }

  public toSARIF(): string {
    return generateSARIF(this.items);
  }

  public writeToFile(filePath: string, format: 'TAP' | 'JUNIT' | 'SARIF'): void {
    const content = exportDiagnostics(this.items, format);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  public getExitCode(ignoreQuarantined: boolean = true): number {
    return determineExitCode(this.items, ignoreQuarantined);
  }

  public clear(): void {
    this.items = [];
  }
}
