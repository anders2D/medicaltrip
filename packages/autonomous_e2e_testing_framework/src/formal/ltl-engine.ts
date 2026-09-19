/**
 * ltl-engine.ts
 * On-the-Fly Linear Temporal Logic (LTL) and Computation Tree Logic (CTL) Model Checker.
 * Verifies temporal safety and liveness invariants across asynchronous execution traces.
 */

export interface TraceStep {
  index: number;
  timestampMs?: number;
  state?: string;
  action?: string;
  variables: Record<string, unknown>;
}

export type ExecutionTrace = TraceStep[];

export type LTLNodeType =
  | 'TRUE'
  | 'FALSE'
  | 'PREDICATE'
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'IMPLIES'
  | 'NEXT'      // X
  | 'FINALLY'   // F
  | 'GLOBALLY'  // G
  | 'UNTIL'     // U
  | 'WEAK_UNTIL'// W
  | 'RELEASE';  // R

export interface LTLNode {
  type: LTLNodeType;
  predicateName?: string;
  evaluator?: (step: TraceStep) => boolean;
  left?: LTLNode;
  right?: LTLNode;
  rawExpression?: string;
}

export interface LTLVerificationResult {
  satisfied: boolean;
  formula: string;
  evaluatedStepsCount: number;
  violatedStepIndex?: number;
  counterExample?: TraceStep[];
  diagnostics: string[];
}

export class LTLEngine {
  /**
   * Helper builders to construct LTL ASTs programmatically.
   */
  public static predicate(name: string, fn: (step: TraceStep) => boolean): LTLNode {
    return { type: 'PREDICATE', predicateName: name, evaluator: fn, rawExpression: name };
  }

  public static not(child: LTLNode): LTLNode {
    return { type: 'NOT', left: child, rawExpression: `!(${child.rawExpression || ''})` };
  }

  public static and(left: LTLNode, right: LTLNode): LTLNode {
    return { type: 'AND', left, right, rawExpression: `(${left.rawExpression} && ${right.rawExpression})` };
  }

  public static or(left: LTLNode, right: LTLNode): LTLNode {
    return { type: 'OR', left, right, rawExpression: `(${left.rawExpression} || ${right.rawExpression})` };
  }

  public static implies(left: LTLNode, right: LTLNode): LTLNode {
    return { type: 'IMPLIES', left, right, rawExpression: `(${left.rawExpression} -> ${right.rawExpression})` };
  }

  public static next(child: LTLNode): LTLNode {
    return { type: 'NEXT', left: child, rawExpression: `X(${child.rawExpression})` };
  }

  public static finally(child: LTLNode): LTLNode {
    return { type: 'FINALLY', left: child, rawExpression: `F(${child.rawExpression})` };
  }

  public static globally(child: LTLNode): LTLNode {
    return { type: 'GLOBALLY', left: child, rawExpression: `G(${child.rawExpression})` };
  }

  public static until(left: LTLNode, right: LTLNode): LTLNode {
    return { type: 'UNTIL', left, right, rawExpression: `(${left.rawExpression} U ${right.rawExpression})` };
  }

  public static weakUntil(left: LTLNode, right: LTLNode): LTLNode {
    return { type: 'WEAK_UNTIL', left, right, rawExpression: `(${left.rawExpression} W ${right.rawExpression})` };
  }

  /**
   * Evaluates LTL formula at specific position `i` along the trace sigma.
   */
  public static evaluateAt(node: LTLNode, trace: ExecutionTrace, i: number): boolean {
    if (i >= trace.length) {
      // Out of bounds step: finite trace semantics
      if (node.type === 'GLOBALLY' || node.type === 'TRUE') return true;
      if (node.type === 'FINALLY' || node.type === 'FALSE' || node.type === 'NEXT') return false;
      return false;
    }

    const currentStep = trace[i];

    switch (node.type) {
      case 'TRUE':
        return true;
      case 'FALSE':
        return false;
      case 'PREDICATE': {
        if (node.evaluator) return node.evaluator(currentStep);
        if (node.predicateName) {
          // If boolean property on variables or state name
          if (currentStep.state === node.predicateName) return true;
          if (currentStep.variables[node.predicateName] === true) return true;
          if (currentStep.variables[node.predicateName] !== undefined && currentStep.variables[node.predicateName] !== null) {
            return Boolean(currentStep.variables[node.predicateName]);
          }
        }
        return false;
      }
      case 'NOT':
        return !this.evaluateAt(node.left!, trace, i);
      case 'AND':
        return this.evaluateAt(node.left!, trace, i) && this.evaluateAt(node.right!, trace, i);
      case 'OR':
        return this.evaluateAt(node.left!, trace, i) || this.evaluateAt(node.right!, trace, i);
      case 'IMPLIES':
        return !this.evaluateAt(node.left!, trace, i) || this.evaluateAt(node.right!, trace, i);
      case 'NEXT': {
        if (i + 1 >= trace.length) return false; // finite trace end
        return this.evaluateAt(node.left!, trace, i + 1);
      }
      case 'FINALLY': {
        // Exists j >= i such that evaluateAt(child, j)
        for (let j = i; j < trace.length; j++) {
          if (this.evaluateAt(node.left!, trace, j)) return true;
        }
        return false;
      }
      case 'GLOBALLY': {
        // Forall j >= i, evaluateAt(child, j)
        for (let j = i; j < trace.length; j++) {
          if (!this.evaluateAt(node.left!, trace, j)) return false;
        }
        return true;
      }
      case 'UNTIL': {
        // Exists j >= i where right holds, and for all k in [i, j-1] left holds
        for (let j = i; j < trace.length; j++) {
          if (this.evaluateAt(node.right!, trace, j)) {
            // Check all prior steps
            let allPriorLeft = true;
            for (let k = i; k < j; k++) {
              if (!this.evaluateAt(node.left!, trace, k)) {
                allPriorLeft = false;
                break;
              }
            }
            if (allPriorLeft) return true;
          }
        }
        return false;
      }
      case 'WEAK_UNTIL': {
        // (left U right) or G(left)
        return this.evaluateAt(LTLEngine.until(node.left!, node.right!), trace, i) ||
               this.evaluateAt(LTLEngine.globally(node.left!), trace, i);
      }
      case 'RELEASE': {
        // !(!left U !right)
        const leftNot = LTLEngine.not(node.left!);
        const rightNot = LTLEngine.not(node.right!);
        const untilNode = LTLEngine.until(leftNot, rightNot);
        return !this.evaluateAt(untilNode, trace, i);
      }
    }
  }

  /**
   * Evaluates an LTL AST across the entire trace starting from step 0.
   */
  public static verify(node: LTLNode, trace: ExecutionTrace): LTLVerificationResult {
    const formulaStr = node.rawExpression || JSON.stringify(node);
    const diagnostics: string[] = [];

    if (trace.length === 0) {
      return {
        satisfied: false,
        formula: formulaStr,
        evaluatedStepsCount: 0,
        diagnostics: ['Trace is empty.']
      };
    }

    // Check if formula holds at step 0
    const satisfied = this.evaluateAt(node, trace, 0);

    if (satisfied) {
      diagnostics.push(`Formula "${formulaStr}" SATISFIED across ${trace.length} trace steps.`);
      return {
        satisfied: true,
        formula: formulaStr,
        evaluatedStepsCount: trace.length,
        diagnostics
      };
    }

    // If formula is Globally G(phi) and failed, identify exact step index where phi failed
    let violatedIdx = 0;
    if (node.type === 'GLOBALLY' && node.left) {
      for (let j = 0; j < trace.length; j++) {
        if (!this.evaluateAt(node.left, trace, j)) {
          violatedIdx = j;
          break;
        }
      }
    }

    const counterExample = trace.slice(0, Math.min(violatedIdx + 2, trace.length));
    diagnostics.push(`Formula "${formulaStr}" VIOLATED at step index [${violatedIdx}]: ${JSON.stringify(trace[violatedIdx].variables)}`);

    return {
      satisfied: false,
      formula: formulaStr,
      evaluatedStepsCount: trace.length,
      violatedStepIndex: violatedIdx,
      counterExample,
      diagnostics
    };
  }

  /**
   * Simple parser for common LTL formula string expressions.
   * Examples:
   *  "G(p -> F(q))"
   *  "G(Territory == 'Mocoa' -> X(Error))"
   */
  public static parseFormula(expr: string): LTLNode {
    const trimmed = expr.trim();

    // 1. G(...)
    if (trimmed.startsWith('G(') && trimmed.endsWith(')')) {
      const inner = trimmed.substring(2, trimmed.length - 1);
      return LTLEngine.globally(LTLEngine.parseFormula(inner));
    }

    // 2. F(...)
    if (trimmed.startsWith('F(') && trimmed.endsWith(')')) {
      const inner = trimmed.substring(2, trimmed.length - 1);
      return LTLEngine.finally(LTLEngine.parseFormula(inner));
    }

    // 3. X(...)
    if (trimmed.startsWith('X(') && trimmed.endsWith(')')) {
      const inner = trimmed.substring(2, trimmed.length - 1);
      return LTLEngine.next(LTLEngine.parseFormula(inner));
    }

    // 4. Implication "A -> B"
    const impParts = splitTopLevel(trimmed, '->');
    if (impParts.length === 2) {
      return LTLEngine.implies(
        LTLEngine.parseFormula(impParts[0]),
        LTLEngine.parseFormula(impParts[1])
      );
    }

    // 5. OR "A || B" or "A v B"
    const orParts = splitTopLevel(trimmed, '||') || splitTopLevel(trimmed, ' v ');
    if (orParts && orParts.length === 2) {
      return LTLEngine.or(
        LTLEngine.parseFormula(orParts[0]),
        LTLEngine.parseFormula(orParts[1])
      );
    }

    // 6. AND "A && B" or "A ^ B"
    const andParts = splitTopLevel(trimmed, '&&');
    if (andParts.length === 2) {
      return LTLEngine.and(
        LTLEngine.parseFormula(andParts[0]),
        LTLEngine.parseFormula(andParts[1])
      );
    }

    // 7. Atomic predicate expression evaluation
    return createPredicateFromExpression(trimmed);
  }
}

/**
 * Splits string by delimiter only when parentheses are balanced.
 */
function splitTopLevel(expr: string, delim: string): string[] {
  let depth = 0;
  for (let i = 0; i <= expr.length - delim.length; i++) {
    const char = expr[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (depth === 0 && expr.substring(i, i + delim.length) === delim) {
      return [expr.substring(0, i).trim(), expr.substring(i + delim.length).trim()];
    }
  }
  return [];
}

/**
 * Creates predicate node from variable comparison like "Territory == 'Mocoa'" or "LedgerDebits == LedgerCredits".
 */
function createPredicateFromExpression(expr: string): LTLNode {
  const clean = expr.replace(/^\(+|\)+$/g, '').trim();

  if (clean.includes('==')) {
    const [leftRaw, rightRaw] = clean.split('==').map(s => s.trim());
    const rightVal = rightRaw.replace(/^['"]|['"]$/g, '');

    return LTLEngine.predicate(clean, (step: TraceStep) => {
      const leftVal = step.variables[leftRaw] ?? (step.state === leftRaw ? true : undefined);
      if (leftVal === undefined) return false;

      // Variable to variable comparison (e.g. LedgerDebits == LedgerCredits)
      if (step.variables[rightRaw] !== undefined) {
        return step.variables[leftRaw] === step.variables[rightRaw];
      }

      // Numeric comparison
      if (!isNaN(Number(rightVal)) && typeof leftVal === 'number') {
        return leftVal === Number(rightVal);
      }
      // BigInt literal comparison
      if (typeof leftVal === 'bigint') {
        try {
          return leftVal === BigInt(rightVal.replace(/n$/, ''));
        } catch {
          return false;
        }
      }
      // String or boolean comparison
      if (rightVal === 'true') return leftVal === true;
      if (rightVal === 'false') return leftVal === false;

      return String(leftVal) === rightVal;
    });
  }

  if (clean.includes('!=')) {
    const [leftRaw, rightRaw] = clean.split('!=').map(s => s.trim());
    const rightVal = rightRaw.replace(/^['"]|['"]$/g, '');
    return LTLEngine.predicate(clean, (step: TraceStep) => {
      const leftVal = step.variables[leftRaw];
      return String(leftVal) !== rightVal;
    });
  }

  // Boolean identifier
  return LTLEngine.predicate(clean, (step: TraceStep) => {
    if (step.state === clean) return true;
    if (step.action === clean) return true;
    return Boolean(step.variables[clean]);
  });
}

/**
 * Facade function to evaluate LTL formula against trace.
 */
export function evaluateLTL(
  formula: string | LTLNode,
  trace: ExecutionTrace
): LTLVerificationResult {
  const ast = typeof formula === 'string' ? LTLEngine.parseFormula(formula) : formula;
  return LTLEngine.verify(ast, trace);
}
