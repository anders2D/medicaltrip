/**
 * petri-net.ts
 * Workflow Timed Stochastic Petri Net (WPTSPN) Graph Model.
 * Formally represents N = (P, T, F, W, M_0, M_f, Lambda, D) for workflow and MBT analysis.
 */

export interface PetriPlace {
  id: string;
  label: string;
  isInitial?: boolean;
  isFinal?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PetriTransition {
  id: string;
  label: string;
  rate?: number;               // Stochastic exponential rate lambda (default 1.0)
  delayInterval?: [number, number]; // [minMs, maxMs] execution delay
  guard?: (context: Record<string, unknown>) => boolean;
  isSilent?: boolean;          // Tau transition
  metadata?: Record<string, unknown>;
}

export interface PetriArc {
  id: string;
  from: string;
  to: string;
  weight: number;
  type: 'P2T' | 'T2P';
}

export type Marking = Map<string, number>;

export interface StateTransitionEdge {
  fromMarkingHash: string;
  toMarkingHash: string;
  transitionId: string;
  transitionLabel: string;
  delayMs?: number;
}

export interface ReachabilityGraph {
  markings: Map<string, Marking>; // hash -> Marking
  edges: StateTransitionEdge[];
  initialMarkingHash: string;
  terminalMarkingHash: string;
  isBounded: boolean;
  isFinite: boolean;
  deadlockStates: string[];      // Hashes with 0 enabled transitions
}

export interface TimedExecutionStep {
  stepIndex: number;
  transitionId: string;
  transitionLabel: string;
  preMarking: Record<string, number>;
  postMarking: Record<string, number>;
  timestampMs: number;
  durationMs: number;
  context?: Record<string, unknown>;
}

export interface PetriNetJSON {
  places: PetriPlace[];
  transitions: PetriTransition[];
  arcs: Array<{ from: string; to: string; weight?: number }>;
  initialPlaceId?: string;
  finalPlaceId?: string;
}

export class PetriNet {
  private places: Map<string, PetriPlace> = new Map();
  private transitions: Map<string, PetriTransition> = new Map();
  private arcs: Map<string, PetriArc> = new Map();
  private initialPlaceId?: string;
  private finalPlaceId?: string;

  constructor(json?: PetriNetJSON) {
    if (json) {
      this.fromJSON(json);
    }
  }

  public addPlace(place: PetriPlace): this {
    this.places.set(place.id, { ...place });
    if (place.isInitial) this.initialPlaceId = place.id;
    if (place.isFinal) this.finalPlaceId = place.id;
    return this;
  }

  public addTransition(transition: PetriTransition): this {
    this.transitions.set(transition.id, {
      rate: 1.0,
      delayInterval: [0, 0],
      ...transition
    });
    return this;
  }

  public addArc(from: string, to: string, weight = 1): this {
    const isFromPlace = this.places.has(from);
    const isToPlace = this.places.has(to);
    const isFromTransition = this.transitions.has(from);
    const isToTransition = this.transitions.has(to);

    if (isFromPlace && isToTransition) {
      const id = `arc_${from}_to_${to}`;
      this.arcs.set(id, { id, from, to, weight, type: 'P2T' });
    } else if (isFromTransition && isToPlace) {
      const id = `arc_${from}_to_${to}`;
      this.arcs.set(id, { id, from, to, weight, type: 'T2P' });
    } else {
      throw new Error(`Invalid Petri Net Arc from "${from}" to "${to}": Must connect Place to Transition or Transition to Place.`);
    }
    return this;
  }

  public setInitialPlace(placeId: string): this {
    if (!this.places.has(placeId)) throw new Error(`Place "${placeId}" not found in net.`);
    this.initialPlaceId = placeId;
    return this;
  }

  public setFinalPlace(placeId: string): this {
    if (!this.places.has(placeId)) throw new Error(`Place "${placeId}" not found in net.`);
    this.finalPlaceId = placeId;
    return this;
  }

  public getPlaces(): PetriPlace[] {
    return Array.from(this.places.values());
  }

  public getTransitions(): PetriTransition[] {
    return Array.from(this.transitions.values());
  }

  public getArcs(): PetriArc[] {
    return Array.from(this.arcs.values());
  }

  public getInitialPlaceId(): string | undefined {
    return this.initialPlaceId;
  }

  public getFinalPlaceId(): string | undefined {
    return this.finalPlaceId;
  }

  /**
   * Preset •x: nodes with arcs directed into x.
   */
  public getPreset(nodeId: string): string[] {
    const preset: string[] = [];
    for (const arc of this.arcs.values()) {
      if (arc.to === nodeId) preset.push(arc.from);
    }
    return preset;
  }

  /**
   * Postset x•: nodes with arcs directed out of x.
   */
  public getPostset(nodeId: string): string[] {
    const postset: string[] = [];
    for (const arc of this.arcs.values()) {
      if (arc.from === nodeId) postset.push(arc.to);
    }
    return postset;
  }

  /**
   * Gets weight of arc between from and to. Returns 0 if no arc.
   */
  public getArcWeight(from: string, to: string): number {
    for (const arc of this.arcs.values()) {
      if (arc.from === from && arc.to === to) return arc.weight;
    }
    return 0;
  }

  /**
   * Initial Marking M_0: 1 token in initial place, 0 elsewhere.
   */
  public getInitialMarking(): Marking {
    const marking: Marking = new Map();
    for (const p of this.places.keys()) {
      marking.set(p, p === this.initialPlaceId ? 1 : 0);
    }
    return marking;
  }

  /**
   * Terminal Marking M_f: 1 token in final place, 0 elsewhere.
   */
  public getFinalMarking(): Marking {
    const marking: Marking = new Map();
    for (const p of this.places.keys()) {
      marking.set(p, p === this.finalPlaceId ? 1 : 0);
    }
    return marking;
  }

  /**
   * Checks if transition t is enabled in marking M:
   * forall p in •t, M(p) >= W(p, t).
   */
  public isTransitionEnabled(
    transitionId: string,
    marking: Marking,
    context: Record<string, unknown> = {}
  ): boolean {
    const transition = this.transitions.get(transitionId);
    if (!transition) return false;

    if (transition.guard && !transition.guard(context)) {
      return false;
    }

    const preset = this.getPreset(transitionId);
    for (const p of preset) {
      const weight = this.getArcWeight(p, transitionId);
      const currentTokens = marking.get(p) || 0;
      if (currentTokens < weight) return false;
    }

    return true;
  }

  /**
   * Returns all enabled transitions in marking M.
   */
  public getEnabledTransitions(
    marking: Marking,
    context: Record<string, unknown> = {}
  ): string[] {
    const enabled: string[] = [];
    for (const t of this.transitions.keys()) {
      if (this.isTransitionEnabled(t, marking, context)) {
        enabled.push(t);
      }
    }
    return enabled;
  }

  /**
   * Fires transition t in marking M, producing new marking M':
   * M'(p) = M(p) - W(p, t) + W(t, p).
   */
  public fireTransition(transitionId: string, marking: Marking): Marking {
    if (!this.isTransitionEnabled(transitionId, marking)) {
      throw new Error(`Transition "${transitionId}" is not enabled in marking: ${this.markingToHash(marking)}`);
    }

    const nextMarking: Marking = new Map(marking);

    // Consume tokens from preset
    for (const p of this.getPreset(transitionId)) {
      const weight = this.getArcWeight(p, transitionId);
      const cur = nextMarking.get(p) || 0;
      nextMarking.set(p, cur - weight);
    }

    // Produce tokens in postset
    for (const p of this.getPostset(transitionId)) {
      const weight = this.getArcWeight(transitionId, p);
      const cur = nextMarking.get(p) || 0;
      nextMarking.set(p, cur + weight);
    }

    return nextMarking;
  }

  /**
   * Converts marking to deterministic hash string (e.g. "p_start:1|p1:0").
   */
  public markingToHash(marking: Marking): string {
    const sortedKeys = Array.from(this.places.keys()).sort();
    return sortedKeys.map(k => `${k}:${marking.get(k) || 0}`).join('|');
  }

  public hashToMarking(hash: string): Marking {
    const marking: Marking = new Map();
    const parts = hash.split('|');
    for (const part of parts) {
      const [k, v] = part.split(':');
      if (k && v !== undefined) marking.set(k, parseInt(v, 10));
    }
    return marking;
  }

  public markingToRecord(marking: Marking): Record<string, number> {
    const rec: Record<string, number> = {};
    for (const [k, v] of marking.entries()) {
      rec[k] = v;
    }
    return rec;
  }

  /**
   * Computes full reachability graph R(M_0) via BFS traversal.
   */
  public computeReachabilityGraph(maxStates = 10000): ReachabilityGraph {
    const initialMarking = this.getInitialMarking();
    const finalMarking = this.getFinalMarking();
    const initialHash = this.markingToHash(initialMarking);
    const terminalHash = this.markingToHash(finalMarking);

    const markings = new Map<string, Marking>();
    const edges: StateTransitionEdge[] = [];
    const deadlockStates: string[] = [];

    const queue: string[] = [initialHash];
    markings.set(initialHash, initialMarking);

    let isBounded = true;

    while (queue.length > 0) {
      if (markings.size > maxStates) {
        return {
          markings,
          edges,
          initialMarkingHash: initialHash,
          terminalMarkingHash: terminalHash,
          isBounded: false,
          isFinite: false,
          deadlockStates
        };
      }

      const currentHash = queue.shift()!;
      const currentMarking = markings.get(currentHash)!;
      const enabled = this.getEnabledTransitions(currentMarking);

      if (enabled.length === 0) {
        // Deadlock or terminal state
        if (currentHash !== terminalHash) {
          deadlockStates.push(currentHash);
        }
      }

      for (const tId of enabled) {
        const nextMarking = this.fireTransition(tId, currentMarking);
        const nextHash = this.markingToHash(nextMarking);

        // Check 1-boundedness (safe workflow net heuristic)
        for (const count of nextMarking.values()) {
          if (count > 20) {
            isBounded = false;
          }
        }

        const tDef = this.transitions.get(tId)!;
        edges.push({
          fromMarkingHash: currentHash,
          toMarkingHash: nextHash,
          transitionId: tId,
          transitionLabel: tDef.label
        });

        if (!markings.has(nextHash)) {
          markings.set(nextHash, nextMarking);
          queue.push(nextHash);
        }
      }
    }

    return {
      markings,
      edges,
      initialMarkingHash: initialHash,
      terminalMarkingHash: terminalHash,
      isBounded,
      isFinite: true,
      deadlockStates
    };
  }

  /**
   * Computes algebraic incidence matrix C = C+ - C-.
   * Rows = Places, Cols = Transitions.
   */
  public computeIncidenceMatrix(): {
    incidenceMatrix: number[][];
    placeOrder: string[];
    transitionOrder: string[];
  } {
    const placeOrder = Array.from(this.places.keys());
    const transitionOrder = Array.from(this.transitions.keys());

    const matrix: number[][] = [];

    for (let i = 0; i < placeOrder.length; i++) {
      const p = placeOrder[i];
      const row: number[] = [];
      for (let j = 0; j < transitionOrder.length; j++) {
        const t = transitionOrder[j];
        const wPlus = this.getArcWeight(t, p); // T -> P
        const wMinus = this.getArcWeight(p, t); // P -> T
        row.push(wPlus - wMinus);
      }
      matrix.push(row);
    }

    return {
      incidenceMatrix: matrix,
      placeOrder,
      transitionOrder
    };
  }

  /**
   * Simulates a timed stochastic execution trace from M_0 to M_f (or deadlock/limit).
   */
  public simulateTrace(options: { maxSteps?: number; context?: Record<string, unknown> } = {}): TimedExecutionStep[] {
    const maxSteps = options.maxSteps ?? 50;
    const context = options.context ?? {};
    let currentMarking = this.getInitialMarking();
    const finalHash = this.markingToHash(this.getFinalMarking());

    const trace: TimedExecutionStep[] = [];
    let currentTimeMs = 0;

    for (let step = 0; step < maxSteps; step++) {
      const currentHash = this.markingToHash(currentMarking);
      if (currentHash === finalHash) break;

      const enabled = this.getEnabledTransitions(currentMarking, context);
      if (enabled.length === 0) break;

      // Select transition using stochastic rates
      const rates = enabled.map(tId => this.transitions.get(tId)?.rate ?? 1.0);
      const totalRate = rates.reduce((sum, r) => sum + r, 0);
      let rand = Math.random() * totalRate;
      let selectedIdx = 0;
      for (let i = 0; i < enabled.length; i++) {
        rand -= rates[i];
        if (rand <= 0) {
          selectedIdx = i;
          break;
        }
      }

      const chosenTId = enabled[selectedIdx];
      const chosenT = this.transitions.get(chosenTId)!;
      const delayMin = chosenT.delayInterval?.[0] ?? 0;
      const delayMax = chosenT.delayInterval?.[1] ?? 0;
      const durationMs = delayMin + Math.round(Math.random() * (delayMax - delayMin));

      const preMarkingRec = this.markingToRecord(currentMarking);
      const nextMarking = this.fireTransition(chosenTId, currentMarking);
      const postMarkingRec = this.markingToRecord(nextMarking);

      trace.push({
        stepIndex: step,
        transitionId: chosenTId,
        transitionLabel: chosenT.label,
        preMarking: preMarkingRec,
        postMarking: postMarkingRec,
        timestampMs: currentTimeMs,
        durationMs,
        context: { ...context }
      });

      currentTimeMs += durationMs;
      currentMarking = nextMarking;
    }

    return trace;
  }

  public fromJSON(json: PetriNetJSON): this {
    this.places.clear();
    this.transitions.clear();
    this.arcs.clear();

    json.places.forEach(p => this.addPlace(p));
    json.transitions.forEach(t => this.addTransition(t));
    json.arcs.forEach(a => this.addArc(a.from, a.to, a.weight || 1));

    if (json.initialPlaceId) this.setInitialPlace(json.initialPlaceId);
    if (json.finalPlaceId) this.setFinalPlace(json.finalPlaceId);

    return this;
  }

  public toJSON(): PetriNetJSON {
    return {
      places: this.getPlaces(),
      transitions: this.getTransitions(),
      arcs: this.getArcs().map(a => ({ from: a.from, to: a.to, weight: a.weight })),
      initialPlaceId: this.initialPlaceId,
      finalPlaceId: this.finalPlaceId
    };
  }
}
