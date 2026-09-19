/**
 * Medical Trip Colombia S.A.S. - PNCounter (Positive-Negative Counter)
 * State-based Conflict-Free Replicated Data Type (CvRDT).
 * Maintains independent positive (P) and negative (N) vectors per node,
 * converging via element-wise maximums.
 */

export interface PNCounterState {
  P: Record<string, number>;
  N: Record<string, number>;
}

export class PNCounter {
  public readonly nodeId: string;
  private P: Record<string, number> = {};
  private N: Record<string, number> = {};

  constructor(nodeId: string, initialP?: Record<string, number>, initialN?: Record<string, number>) {
    this.nodeId = nodeId;
    if (initialP) {
      this.P = { ...initialP };
    }
    if (initialN) {
      this.N = { ...initialN };
    }
    if (this.P[this.nodeId] === undefined) {
      this.P[this.nodeId] = 0;
    }
    if (this.N[this.nodeId] === undefined) {
      this.N[this.nodeId] = 0;
    }
  }

  /**
   * Increments the counter on the local node by the given positive amount.
   */
  public increment(amount: number = 1): void {
    if (amount < 0) {
      throw new Error(`PNCounter increment amount must be non-negative. Received: ${amount}`);
    }
    this.P[this.nodeId] = (this.P[this.nodeId] || 0) + amount;
  }

  /**
   * Decrements the counter on the local node by the given positive amount.
   */
  public decrement(amount: number = 1): void {
    if (amount < 0) {
      throw new Error(`PNCounter decrement amount must be non-negative. Received: ${amount}`);
    }
    this.N[this.nodeId] = (this.N[this.nodeId] || 0) + amount;
  }

  /**
   * Computes the current converged scalar value of the counter across all participating nodes.
   * Value = Sum(P) - Sum(N)
   */
  public value(): number {
    const sumP = Object.values(this.P).reduce((acc, val) => acc + val, 0);
    const sumN = Object.values(this.N).reduce((acc, val) => acc + val, 0);
    return sumP - sumN;
  }

  /**
   * Monotonically merges this counter with another replica using element-wise maximums.
   * Merge(A, B) = (max(P_A, P_B), max(N_A, N_B))
   */
  public merge(other: PNCounter): PNCounter {
    const mergedP: Record<string, number> = { ...this.P };
    const mergedN: Record<string, number> = { ...this.N };

    for (const [node, val] of Object.entries(other.P)) {
      mergedP[node] = Math.max(mergedP[node] || 0, val);
    }
    for (const [node, val] of Object.entries(other.N)) {
      mergedN[node] = Math.max(mergedN[node] || 0, val);
    }

    return new PNCounter(this.nodeId, mergedP, mergedN);
  }

  /**
   * Returns current internal state vectors.
   */
  public getState(): PNCounterState {
    return {
      P: { ...this.P },
      N: { ...this.N },
    };
  }

  public toJSON(): string {
    return JSON.stringify({
      nodeId: this.nodeId,
      P: this.P,
      N: this.N,
    });
  }

  public static fromJSON(jsonString: string): PNCounter {
    const parsed = JSON.parse(jsonString) as {
      nodeId: string;
      P: Record<string, number>;
      N: Record<string, number>;
    };
    return new PNCounter(parsed.nodeId, parsed.P, parsed.N);
  }
}
