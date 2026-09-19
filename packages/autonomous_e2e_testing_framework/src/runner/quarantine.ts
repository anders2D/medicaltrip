/**
 * quarantine.ts
 * Flakiness Isolation & Quarantine Management Engine.
 * 
 * Tracks historical test execution records, calculates flakiness scores (Fs = failures / runs),
 * automatically isolates flaky tests (Fs >= 0.15) to prevent CI pipeline blockage,
 * stores diagnostic execution traces, and manages unquarantine recovery.
 */

export interface ExecutionRecord {
  testId: string;
  suiteName?: string;
  testName?: string;
  passed: boolean;
  durationMs: number;
  timestamp?: string;
  error?: string;
  errorStack?: string;
  environment?: Record<string, string>;
  retryCount?: number;
  metadata?: Record<string, unknown>;
}

export interface FlakinessReport {
  testId: string;
  suiteName: string;
  testName: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  flakinessScore: number; // Fs = failedRuns / totalRuns (0.0 to 1.0)
  isQuarantined: boolean;
  quarantineReason?: string;
  consecutivePasses: number;
  history: ExecutionRecord[];
  lastRunTime: string;
  lastError?: string;
}

export interface DiagnosticArchive {
  archiveId: string;
  testId: string;
  suiteName: string;
  testName: string;
  quarantinedAt: string;
  flakinessScore: number;
  failuresCount: number;
  totalRuns: number;
  capturedTraces: ExecutionRecord[];
  errorSignatures: string[];
  environmentSnapshot: Record<string, string>;
}

export interface QuarantineOptions {
  threshold?: number;                     // Default: 0.15 (15% failure rate)
  minRunsBeforeQuarantine?: number;       // Default: 5 runs
  consecutivePassesToUnquarantine?: number; // Default: 5 consecutive passes
  maxHistoryPerTest?: number;             // Default: 50 runs
  archiveStorageLimit?: number;           // Default: 100 archives
}

/**
 * Computes flakiness score Fs = failures / totalRuns
 */
export function computeFlakinessScore(history: ExecutionRecord[]): number {
  if (!history || history.length === 0) {
    return 0.0;
  }
  const failures = history.filter((r) => !r.passed).length;
  return failures / history.length;
}

export class QuarantineManager {
  private history: Map<string, ExecutionRecord[]> = new Map();
  private quarantined: Set<string> = new Set();
  private quarantineReasons: Map<string, string> = new Map();
  private consecutivePassesMap: Map<string, number> = new Map();
  private diagnosticArchives: Map<string, DiagnosticArchive> = new Map();

  private readonly threshold: number;
  private readonly minRunsBeforeQuarantine: number;
  private readonly consecutivePassesToUnquarantine: number;
  private readonly maxHistoryPerTest: number;
  private readonly archiveStorageLimit: number;

  constructor(options: QuarantineOptions = {}) {
    this.threshold = options.threshold ?? 0.15;
    this.minRunsBeforeQuarantine = options.minRunsBeforeQuarantine ?? 5;
    this.consecutivePassesToUnquarantine = options.consecutivePassesToUnquarantine ?? 5;
    this.maxHistoryPerTest = options.maxHistoryPerTest ?? 50;
    this.archiveStorageLimit = options.archiveStorageLimit ?? 100;
  }

  /**
   * Records a test execution run and evaluates quarantine triggers.
   */
  public recordRun(record: ExecutionRecord): FlakinessReport {
    const testId = record.testId;
    if (!this.history.has(testId)) {
      this.history.set(testId, []);
    }

    const testHistory = this.history.get(testId)!;
    const normalizedRecord: ExecutionRecord = {
      ...record,
      timestamp: record.timestamp || new Date().toISOString()
    };

    testHistory.push(normalizedRecord);
    if (testHistory.length > this.maxHistoryPerTest) {
      testHistory.shift();
    }

    // Update consecutive passes counter
    if (record.passed) {
      const currentPasses = (this.consecutivePassesMap.get(testId) || 0) + 1;
      this.consecutivePassesMap.set(testId, currentPasses);
    } else {
      this.consecutivePassesMap.set(testId, 0);
    }

    // Evaluate quarantine state
    this.evaluateQuarantineState(testId);

    return this.getFlakinessReport(testId)!;
  }

  /**
   * Records multiple execution runs in batch.
   */
  public recordRuns(records: ExecutionRecord[]): void {
    for (const record of records) {
      this.recordRun(record);
    }
  }

  /**
   * Computes flakiness score for a specific testId.
   */
  public computeFlakinessScore(testId: string): number {
    const testHistory = this.history.get(testId) || [];
    return computeFlakinessScore(testHistory);
  }

  /**
   * Checks if a test is currently in quarantine.
   */
  public isQuarantined(testId: string): boolean {
    return this.quarantined.has(testId);
  }

  /**
   * Manually places a test into quarantine.
   */
  public quarantineTest(testId: string, reason?: string): void {
    this.quarantined.add(testId);
    const quarantineReason = reason || `Manually quarantined (Threshold: ${this.threshold})`;
    this.quarantineReasons.set(testId, quarantineReason);
    this.generateDiagnosticArchive(testId, quarantineReason);
  }

  /**
   * Manually or automatically removes a test from quarantine.
   */
  public unquarantineTest(testId: string): void {
    this.quarantined.delete(testId);
    this.quarantineReasons.delete(testId);
    this.consecutivePassesMap.set(testId, 0);
  }

  /**
   * Gets the detailed flakiness report for a test.
   */
  public getFlakinessReport(testId: string): FlakinessReport | undefined {
    const testHistory = this.history.get(testId);
    if (!testHistory || testHistory.length === 0) {
      return undefined;
    }

    const failedRuns = testHistory.filter((r) => !r.passed).length;
    const passedRuns = testHistory.length - failedRuns;
    const flakinessScore = failedRuns / testHistory.length;
    const lastRecord = testHistory[testHistory.length - 1];
    const lastFailed = [...testHistory].reverse().find((r) => !r.passed);

    return {
      testId,
      suiteName: lastRecord.suiteName || 'DefaultSuite',
      testName: lastRecord.testName || testId,
      totalRuns: testHistory.length,
      passedRuns,
      failedRuns,
      flakinessScore,
      isQuarantined: this.isQuarantined(testId),
      quarantineReason: this.quarantineReasons.get(testId),
      consecutivePasses: this.consecutivePassesMap.get(testId) || 0,
      history: [...testHistory],
      lastRunTime: lastRecord.timestamp || new Date().toISOString(),
      lastError: lastFailed?.error
    };
  }

  /**
   * Returns flakiness reports for all tracked tests.
   */
  public getAllReports(): FlakinessReport[] {
    const reports: FlakinessReport[] = [];
    for (const testId of this.history.keys()) {
      const report = this.getFlakinessReport(testId);
      if (report) {
        reports.push(report);
      }
    }
    return reports;
  }

  /**
   * Returns all currently quarantined tests.
   */
  public getQuarantinedTests(): FlakinessReport[] {
    return this.getAllReports().filter((r) => r.isQuarantined);
  }

  /**
   * Filters a collection of tests based on quarantine status.
   */
  public filterSuite<T extends { id?: string; testId?: string; name?: string }>(
    tests: T[],
    mode: 'ACTIVE_ONLY' | 'QUARANTINE_ONLY' | 'ALL' = 'ACTIVE_ONLY'
  ): T[] {
    if (mode === 'ALL') {
      return [...tests];
    }

    return tests.filter((t) => {
      const id = t.id || t.testId || t.name || '';
      const isQ = this.isQuarantined(id);
      return mode === 'QUARANTINE_ONLY' ? isQ : !isQ;
    });
  }

  /**
   * Retrieves diagnostic archive for a quarantined test.
   */
  public getDiagnosticArchive(testId: string): DiagnosticArchive | undefined {
    return this.diagnosticArchives.get(testId);
  }

  /**
   * Exports all diagnostic archives.
   */
  public exportAllArchives(): DiagnosticArchive[] {
    return Array.from(this.diagnosticArchives.values());
  }

  /**
   * Clears historical data and archives.
   */
  public reset(): void {
    this.history.clear();
    this.quarantined.clear();
    this.quarantineReasons.clear();
    this.consecutivePassesMap.clear();
    this.diagnosticArchives.clear();
  }

  private evaluateQuarantineState(testId: string): void {
    const testHistory = this.history.get(testId)!;
    const score = this.computeFlakinessScore(testId);
    const consecutivePasses = this.consecutivePassesMap.get(testId) || 0;
    const isCurrentlyQuarantined = this.quarantined.has(testId);

    // Quarantine condition: sufficient sample size and score >= threshold
    if (!isCurrentlyQuarantined && testHistory.length >= this.minRunsBeforeQuarantine && score >= this.threshold) {
      const reason = `Automated quarantine: Flakiness score ${score.toFixed(3)} >= threshold ${this.threshold} across ${testHistory.length} runs`;
      this.quarantineTest(testId, reason);
      return;
    }

    // Unquarantine recovery condition: quarantined test achieves N consecutive passes
    if (isCurrentlyQuarantined && consecutivePasses >= this.consecutivePassesToUnquarantine) {
      this.unquarantineTest(testId);
    }
  }

  private generateDiagnosticArchive(testId: string, reason: string): void {
    const testHistory = this.history.get(testId) || [];
    const failures = testHistory.filter((r) => !r.passed);
    const lastRecord = testHistory[testHistory.length - 1] || { suiteName: 'Unknown', testName: testId };
    
    const errorSignatures = Array.from(
      new Set(failures.map((f) => f.error || 'UnknownAssertionError'))
    );

    const archive: DiagnosticArchive = {
      archiveId: `ARCHIVE-${testId}-${Date.now()}`,
      testId,
      suiteName: lastRecord.suiteName || 'Suite',
      testName: lastRecord.testName || testId,
      quarantinedAt: new Date().toISOString(),
      flakinessScore: this.computeFlakinessScore(testId),
      failuresCount: failures.length,
      totalRuns: testHistory.length,
      capturedTraces: [...testHistory],
      errorSignatures,
      environmentSnapshot: {
        nodeVersion: process.version,
        platform: process.platform,
        quarantineReason: reason
      }
    };

    if (this.diagnosticArchives.size >= this.archiveStorageLimit) {
      const oldestKey = this.diagnosticArchives.keys().next().value;
      if (oldestKey) {
        this.diagnosticArchives.delete(oldestKey);
      }
    }

    this.diagnosticArchives.set(testId, archive);
  }
}
