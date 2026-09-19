/**
 * Test Harness & Assertion Engine for Medical Trip Colombia S.A.S. E2E Test Suite
 * Zero external dependencies, 100% pure Node.js ESM.
 */

// ANSI Color constants for terminal output
export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
  bgYellow: '\x1b[43m'
};

/**
 * Deep equality comparison supporting Primitives, BigInt, Date, RegExp, Arrays, Objects, Sets, Maps.
 */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a === 'bigint') return a === b;
  if (typeof a === 'number' && typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) return true;
    return a === b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const item of a) {
      let found = false;
      for (const bItem of b) {
        if (deepEqual(item, bItem)) {
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a.entries()) {
      if (!b.has(key) || !deepEqual(val, b.get(key))) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Format any value for readable assertion error messages.
 */
export function formatValue(val) {
  if (typeof val === 'bigint') return `${val.toString()}n`;
  if (typeof val === 'string') return `"${val}"`;
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
  if (Array.isArray(val)) {
    if (val.length > 5) return `[Array(${val.length})]`;
    return `[${val.map(formatValue).join(', ')}]`;
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, (k, v) => (typeof v === 'bigint' ? `${v.toString()}n` : v));
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/**
 * Assertion Expectation Class
 */
export class Expectation {
  constructor(actual, isNot = false) {
    this.actual = actual;
    this.isNot = isNot;
  }

  get not() {
    return new Expectation(this.actual, !this.isNot);
  }

  #assert(condition, messageGenerator) {
    const passed = this.isNot ? !condition : condition;
    if (!passed) {
      const msg = messageGenerator(this.actual);
      const err = new Error(this.isNot ? `Expected NOT to: ${msg}` : msg);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(err);
      }
      throw err;
    }
  }

  toBe(expected) {
    this.#assert(
      Object.is(this.actual, expected),
      (act) => `Expected ${formatValue(act)} to be strictly equal (Object.is) to ${formatValue(expected)}`
    );
  }

  toEqual(expected) {
    this.#assert(
      deepEqual(this.actual, expected),
      (act) => `Expected ${formatValue(act)} to deeply equal ${formatValue(expected)}`
    );
  }

  toBeCloseTo(expected, numDigits = 2) {
    const precision = Math.pow(10, -numDigits) / 2;
    const diff = Math.abs(Number(this.actual) - Number(expected));
    this.#assert(
      diff < precision,
      (act) => `Expected ${act} to be close to ${expected} within precision 1e-${numDigits} (diff was ${diff})`
    );
  }

  toBeGreaterThan(expected) {
    this.#assert(
      this.actual > expected,
      (act) => `Expected ${formatValue(act)} > ${formatValue(expected)}`
    );
  }

  toBeGreaterThanOrEqual(expected) {
    this.#assert(
      this.actual >= expected,
      (act) => `Expected ${formatValue(act)} >= ${formatValue(expected)}`
    );
  }

  toBeLessThan(expected) {
    this.#assert(
      this.actual < expected,
      (act) => `Expected ${formatValue(act)} < ${formatValue(expected)}`
    );
  }

  toBeLessThanOrEqual(expected) {
    this.#assert(
      this.actual <= expected,
      (act) => `Expected ${formatValue(act)} <= ${formatValue(expected)}`
    );
  }

  toBeTruthy() {
    this.#assert(
      Boolean(this.actual),
      (act) => `Expected ${formatValue(act)} to be truthy`
    );
  }

  toBeFalsy() {
    this.#assert(
      !this.actual,
      (act) => `Expected ${formatValue(act)} to be falsy`
    );
  }

  toBeNull() {
    this.#assert(
      this.actual === null,
      (act) => `Expected ${formatValue(act)} to be null`
    );
  }

  toBeUndefined() {
    this.#assert(
      this.actual === undefined,
      (act) => `Expected ${formatValue(act)} to be undefined`
    );
  }

  toBeDefined() {
    this.#assert(
      this.actual !== undefined,
      (act) => `Expected ${formatValue(act)} to be defined`
    );
  }

  toBeInstanceOf(expectedClass) {
    this.#assert(
      this.actual instanceof expectedClass,
      (act) => `Expected ${formatValue(act)} to be instance of ${expectedClass.name || 'expected class'}`
    );
  }

  toContain(item) {
    if (typeof this.actual === 'string') {
      this.#assert(
        this.actual.includes(item),
        (act) => `Expected string ${formatValue(act)} to contain ${formatValue(item)}`
      );
    } else if (Array.isArray(this.actual)) {
      const found = this.actual.some((el) => deepEqual(el, item));
      this.#assert(
        found,
        (act) => `Expected array ${formatValue(act)} to contain ${formatValue(item)}`
      );
    } else if (this.actual instanceof Set) {
      let found = false;
      for (const el of this.actual) {
        if (deepEqual(el, item)) {
          found = true;
          break;
        }
      }
      this.#assert(
        found,
        (act) => `Expected Set ${formatValue(act)} to contain ${formatValue(item)}`
      );
    } else {
      throw new Error(`toContain() target must be a string, Array, or Set; received: ${typeof this.actual}`);
    }
  }

  toHaveLength(expectedLength) {
    const len = this.actual?.length ?? this.actual?.size;
    this.#assert(
      len === expectedLength,
      (act) => `Expected length of ${formatValue(act)} to be ${expectedLength}, got ${len}`
    );
  }

  toHaveProperty(propName, value) {
    const hasProp = this.actual && Object.prototype.hasOwnProperty.call(this.actual, propName);
    if (value !== undefined) {
      this.#assert(
        hasProp && deepEqual(this.actual[propName], value),
        (act) => `Expected property '${propName}' of ${formatValue(act)} to equal ${formatValue(value)}`
      );
    } else {
      this.#assert(
        Boolean(hasProp),
        (act) => `Expected ${formatValue(act)} to have property '${propName}'`
      );
    }
  }

  toMatch(regexOrSubstring) {
    const str = String(this.actual);
    const matches =
      regexOrSubstring instanceof RegExp
        ? regexOrSubstring.test(str)
        : str.includes(regexOrSubstring);
    this.#assert(
      matches,
      (act) => `Expected ${formatValue(act)} to match ${regexOrSubstring}`
    );
  }

  toThrow(expectedError) {
    if (typeof this.actual !== 'function') {
      throw new Error(`toThrow() requires a function, received ${typeof this.actual}`);
    }

    let caught = null;
    try {
      this.actual();
    } catch (e) {
      caught = e;
    }

    if (!caught) {
      this.#assert(
        false,
        () => `Expected function to throw, but it returned normally.`
      );
      return;
    }

    if (expectedError === undefined) {
      this.#assert(true, () => '');
      return;
    }

    if (typeof expectedError === 'function' && expectedError.prototype instanceof Error) {
      this.#assert(
        caught instanceof expectedError,
        () => `Expected error to be instance of ${expectedError.name}, got ${caught.name}: ${caught.message}`
      );
      return;
    }

    if (expectedError instanceof RegExp) {
      this.#assert(
        expectedError.test(caught.message),
        () => `Expected error message '${caught.message}' to match regex ${expectedError}`
      );
      return;
    }

    if (typeof expectedError === 'string') {
      this.#assert(
        caught.message.includes(expectedError),
        () => `Expected error message '${caught.message}' to contain '${expectedError}'`
      );
      return;
    }

    this.#assert(true, () => '');
  }

  get resolves() {
    return {
      toBe: async (expected) => {
        const res = await this.actual;
        new Expectation(res, this.isNot).toBe(expected);
      },
      toEqual: async (expected) => {
        const res = await this.actual;
        new Expectation(res, this.isNot).toEqual(expected);
      },
      toBeTruthy: async () => {
        const res = await this.actual;
        new Expectation(res, this.isNot).toBeTruthy();
      },
      toBeFalsy: async () => {
        const res = await this.actual;
        new Expectation(res, this.isNot).toBeFalsy();
      }
    };
  }

  get rejects() {
    return {
      toThrow: async (expectedError) => {
        let caught = null;
        try {
          if (typeof this.actual === 'function') {
            await this.actual();
          } else {
            await this.actual;
          }
        } catch (e) {
          caught = e;
        }

        if (!caught) {
          throw new Error(`Expected promise to reject, but it resolved.`);
        }

        if (expectedError === undefined) return;

        if (typeof expectedError === 'function' && expectedError.prototype instanceof Error) {
          if (!(caught instanceof expectedError)) {
            throw new Error(`Expected rejected error to be instance of ${expectedError.name}, got ${caught.name}: ${caught.message}`);
          }
          return;
        }

        if (expectedError instanceof RegExp) {
          if (!expectedError.test(caught.message)) {
            throw new Error(`Expected rejected error message '${caught.message}' to match regex ${expectedError}`);
          }
          return;
        }

        if (typeof expectedError === 'string') {
          if (!caught.message.includes(expectedError)) {
            throw new Error(`Expected rejected error message '${caught.message}' to contain '${expectedError}'`);
          }
          return;
        }
      }
    };
  }
}

/**
 * Creates an expectation wrapper.
 */
export function expect(actual) {
  return new Expectation(actual);
}

/**
 * Test Suite and Runner State
 */
class TestSuiteContext {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.subSuites = [];
    this.parent = null;
  }
}

let rootSuite = new TestSuiteContext('Root');
let currentSuite = rootSuite;

export function describe(name, fn) {
  const newSuite = new TestSuiteContext(name);
  newSuite.parent = currentSuite;
  currentSuite.subSuites.push(newSuite);

  const prevSuite = currentSuite;
  currentSuite = newSuite;
  try {
    fn();
  } finally {
    currentSuite = prevSuite;
  }
}

export function it(name, fn) {
  currentSuite.tests.push({ name, fn, suite: currentSuite });
}
export const test = it;

export function beforeEach(fn) {
  currentSuite.beforeEachHooks.push(fn);
}

export function afterEach(fn) {
  currentSuite.afterEachHooks.push(fn);
}

export function beforeAll(fn) {
  currentSuite.beforeAllHooks.push(fn);
}

export function afterAll(fn) {
  currentSuite.afterAllHooks.push(fn);
}

/**
 * Reset test registry.
 */
export function resetTestRegistry() {
  rootSuite = new TestSuiteContext('Root');
  currentSuite = rootSuite;
}

/**
 * Get all tests recursively.
 */
function collectSuiteTests(suite, collected = []) {
  for (const t of suite.tests) {
    collected.push(t);
  }
  for (const sub of suite.subSuites) {
    collectSuiteTests(sub, collected);
  }
  return collected;
}

/**
 * Get all hooks in execution order for a test.
 */
function getBeforeEachHooks(suite) {
  const hooks = [];
  let s = suite;
  while (s) {
    if (s.beforeEachHooks.length > 0) {
      hooks.unshift(...s.beforeEachHooks);
    }
    s = s.parent;
  }
  return hooks;
}

function getAfterEachHooks(suite) {
  const hooks = [];
  let s = suite;
  while (s) {
    if (s.afterEachHooks.length > 0) {
      hooks.push(...s.afterEachHooks);
    }
    s = s.parent;
  }
  return hooks;
}

/**
 * Run a specific suite and its sub-suites.
 */
export async function executeSuite(suite, reporter = defaultReporter) {
  const results = {
    name: suite.name,
    tests: [],
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    durationMs: 0
  };

  const startTime = Date.now();

  for (const hook of suite.beforeAllHooks) {
    await hook();
  }

  for (const t of suite.tests) {
    const testStart = Date.now();
    let error = null;
    try {
      for (const hook of getBeforeEachHooks(t.suite)) {
        await hook();
      }

      await t.fn();

      for (const hook of getAfterEachHooks(t.suite)) {
        await hook();
      }
    } catch (err) {
      error = err;
    }

    const testDuration = Date.now() - testStart;
    const testResult = {
      name: t.name,
      suiteName: t.suite.name,
      passed: !error,
      error,
      durationMs: testDuration
    };

    results.tests.push(testResult);
    if (testResult.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.total++;

    if (reporter?.onTestComplete) {
      reporter.onTestComplete(testResult);
    }
  }

  for (const sub of suite.subSuites) {
    const subRes = await executeSuite(sub, reporter);
    results.passed += subRes.passed;
    results.failed += subRes.failed;
    results.skipped += subRes.skipped;
    results.total += subRes.total;
    results.tests.push(...subRes.tests);
  }

  for (const hook of suite.afterAllHooks) {
    await hook();
  }

  results.durationMs = Date.now() - startTime;
  return results;
}

/**
 * Default console test reporter.
 */
export const defaultReporter = {
  onTestComplete(testResult) {
    const symbol = testResult.passed ? `${ANSI.green}✓${ANSI.reset}` : `${ANSI.red}✗${ANSI.reset}`;
    const nameStr = `${ANSI.gray}[${testResult.suiteName}]${ANSI.reset} ${testResult.name}`;
    const timeStr = `${ANSI.dim}(${testResult.durationMs}ms)${ANSI.reset}`;
    if (testResult.passed) {
      // Quiet passed output or dot
    } else {
      console.error(`  ${symbol} ${nameStr} ${timeStr}`);
      console.error(`     ${ANSI.red}${testResult.error?.message || testResult.error}${ANSI.reset}`);
      if (testResult.error?.stack) {
        console.error(`     ${ANSI.gray}${testResult.error.stack.split('\n').slice(1, 4).join('\n     ')}${ANSI.reset}`);
      }
    }
  }
};

/**
 * Runs all registered tests in current rootSuite.
 */
export async function runAllTests(title = 'Automated Test Suite', verbose = false) {
  const startTime = Date.now();
  console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}  🚀 RUNNING: ${title}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  const suiteResults = [];

  for (const sub of rootSuite.subSuites) {
    const res = await executeSuite(sub, defaultReporter);
    suiteResults.push(res);
    totalPassed += res.passed;
    totalFailed += res.failed;
    totalTests += res.total;
  }

  const totalDuration = Date.now() - startTime;

  console.log(`\n${ANSI.bold}----------------------------------------------------------------------${ANSI.reset}`);
  console.log(`${ANSI.bold}  SUMMARY: ${title}${ANSI.reset}`);
  console.log(`  ${ANSI.green}Passed: ${totalPassed}${ANSI.reset} | ${totalFailed > 0 ? ANSI.red : ANSI.gray}Failed: ${totalFailed}${ANSI.reset} | Total: ${totalTests} (${totalDuration}ms)`);
  console.log(`${ANSI.bold}----------------------------------------------------------------------${ANSI.reset}\n`);

  return {
    passed: totalPassed,
    failed: totalFailed,
    total: totalTests,
    durationMs: totalDuration,
    suites: suiteResults
  };
}
