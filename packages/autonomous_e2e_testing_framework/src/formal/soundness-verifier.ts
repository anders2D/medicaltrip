/**
 * soundness-verifier.ts
 * Mathematical Soundness Verifier for Workflow Nets (van der Aalst Soundness Theorem).
 * Verifies Option to Complete, Proper Completion, Liveness, and Siphon/Trap invariants
 * using the algebraic incidence matrix C = C+ - C- and state reachability analysis.
 */

import { PetriNet, Marking, ReachabilityGraph } from './petri-net.js';

export interface SiphonTrapResult {
  siphons: string[][]; // Sets of place IDs
  traps: string[][];
  unmarkedSiphons: string[][];
  deadlockFreeByInvariants: boolean;
}

export interface SoundnessProofResult {
  isSound: boolean;
  optionToComplete: boolean;
  properCompletion: boolean;
  liveTransitions: boolean;
  deadlocks: string[];         // Deadlock marking hashes
  unreachablePlaces: string[];
  deadTransitions: string[];
  reachableStateCount: number;
  incidenceMatrix: {
    incidenceMatrix: number[][];
    placeOrder: string[];
    transitionOrder: string[];
  };
  siphonTrapAnalysis: SiphonTrapResult;
  proofSteps: string[];
}

export class SoundnessVerifier {
  /**
   * Evaluates if a subset of places is a Siphon: •S subset of S•
   */
  public static isSiphon(net: PetriNet, placeSet: Set<string>): boolean {
    if (placeSet.size === 0) return false;

    // •S = union of •p for all p in S
    const presetOfS = new Set<string>();
    for (const p of placeSet) {
      net.getPreset(p).forEach(t => presetOfS.add(t));
    }

    // S• = union of p• for all p in S
    const postsetOfS = new Set<string>();
    for (const p of placeSet) {
      net.getPostset(p).forEach(t => postsetOfS.add(t));
    }

    // For all t in •S, t must also be in S•
    for (const t of presetOfS) {
      if (!postsetOfS.has(t)) return false;
    }

    return true;
  }

  /**
   * Evaluates if a subset of places is a Trap: Q• subset of •Q
   */
  public static isTrap(net: PetriNet, placeSet: Set<string>): boolean {
    if (placeSet.size === 0) return false;

    // Q• = union of p• for all p in Q
    const postsetOfQ = new Set<string>();
    for (const p of placeSet) {
      net.getPostset(p).forEach(t => postsetOfQ.add(t));
    }

    // •Q = union of •p for all p in Q
    const presetOfQ = new Set<string>();
    for (const p of placeSet) {
      net.getPreset(p).forEach(t => presetOfQ.add(t));
    }

    // For all t in Q•, t must also be in •Q
    for (const t of postsetOfQ) {
      if (!presetOfQ.has(t)) return false;
    }

    return true;
  }

  /**
   * Computes minimal Siphons and Traps for the net via power set exploration.
   */
  public static computeSiphonsAndTraps(net: PetriNet): SiphonTrapResult {
    const places = net.getPlaces().map(p => p.id);
    const siphons: string[][] = [];
    const traps: string[][] = [];
    const initialMarking = net.getInitialMarking();

    // For small/medium nets, explore all place subsets (or up to size limit)
    const n = places.length;
    const maxCombinations = Math.min(1 << n, 2048);

    for (let mask = 1; mask < maxCombinations; mask++) {
      const subset: string[] = [];
      for (let i = 0; i < n; i++) {
        if ((mask & (1 << i)) !== 0) {
          subset.push(places[i]);
        }
      }

      const placeSet = new Set(subset);

      if (this.isSiphon(net, placeSet)) {
        siphons.push(subset);
      }

      if (this.isTrap(net, placeSet)) {
        traps.push(subset);
      }
    }

    // Check which siphons are marked in M_0
    const unmarkedSiphons = siphons.filter(s => {
      const totalTokens = s.reduce((sum, pId) => sum + (initialMarking.get(pId) || 0), 0);
      return totalTokens === 0;
    });

    // Deadlock-freedom condition: every minimal siphon contains an initially marked trap
    let deadlockFreeByInvariants = true;
    for (const siphon of siphons) {
      const siphonSet = new Set(siphon);
      const containsMarkedTrap = traps.some(trap => {
        const isSubset = trap.every(p => siphonSet.has(p));
        const isMarked = trap.reduce((sum, p) => sum + (initialMarking.get(p) || 0), 0) > 0;
        return isSubset && isMarked;
      });

      if (!containsMarkedTrap && unmarkedSiphons.length > 0) {
        deadlockFreeByInvariants = false;
        break;
      }
    }

    return {
      siphons,
      traps,
      unmarkedSiphons,
      deadlockFreeByInvariants
    };
  }

  /**
   * Main Soundness Verification Function.
   */
  public static verifySoundness(net: PetriNet): SoundnessProofResult {
    const proofSteps: string[] = [];
    proofSteps.push('1. Verifying initial and final place definitions...');

    const initPlace = net.getInitialPlaceId();
    const finalPlace = net.getFinalPlaceId();

    if (!initPlace || !finalPlace) {
      return {
        isSound: false,
        optionToComplete: false,
        properCompletion: false,
        liveTransitions: false,
        deadlocks: [],
        unreachablePlaces: net.getPlaces().map(p => p.id),
        deadTransitions: net.getTransitions().map(t => t.id),
        reachableStateCount: 0,
        incidenceMatrix: net.computeIncidenceMatrix(),
        siphonTrapAnalysis: { siphons: [], traps: [], unmarkedSiphons: [], deadlockFreeByInvariants: false },
        proofSteps: ['FAILED: Missing Initial Place (p_start) or Final Place (p_end)']
      };
    }

    proofSteps.push(`  ✓ Initial Place: ${initPlace}, Final Place: ${finalPlace}`);

    // 2. Compute algebraic incidence matrix
    proofSteps.push('2. Computing algebraic incidence matrix C = C+ - C-...');
    const incMatrix = net.computeIncidenceMatrix();
    proofSteps.push(`  ✓ Incidence Matrix computed: ${incMatrix.placeOrder.length} Places x ${incMatrix.transitionOrder.length} Transitions`);

    // 3. Compute reachability graph R(M_0)
    proofSteps.push('3. Generating Reachability Graph R(M_0)...');
    const rg: ReachabilityGraph = net.computeReachabilityGraph();
    proofSteps.push(`  ✓ Reachability space explored: ${rg.markings.size} distinct reachable markings`);

    const finalMarking = net.getFinalMarking();
    const finalHash = net.markingToHash(finalMarking);

    // 4. Verify Option to Complete: From all M in R(M_0), M_f is reachable
    proofSteps.push('4. Verifying Option to Complete (forall M in R(M_0), M_f in R(M))...');

    // Build reverse adjacency list from edges
    const forwardAdj = new Map<string, Set<string>>();
    for (const edge of rg.edges) {
      if (!forwardAdj.has(edge.fromMarkingHash)) forwardAdj.set(edge.fromMarkingHash, new Set());
      forwardAdj.get(edge.fromMarkingHash)!.add(edge.toMarkingHash);
    }

    // Check reachability to terminal state from each marking using BFS/DFS
    let optionToComplete = true;
    for (const markingHash of rg.markings.keys()) {
      if (markingHash === finalHash) continue;

      const visited = new Set<string>();
      const queue = [markingHash];
      let canReachTerminal = false;

      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === finalHash) {
          canReachTerminal = true;
          break;
        }
        visited.add(curr);
        const neighbors = forwardAdj.get(curr) || new Set();
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }

      if (!canReachTerminal) {
        optionToComplete = false;
        break;
      }
    }

    if (optionToComplete) {
      proofSteps.push('  ✓ Option to Complete holds: Terminal state M_f is reachable from every state.');
    } else {
      proofSteps.push('  ✗ Option to Complete FAILED: At least one state cannot reach terminal state.');
    }

    // 5. Verify Proper Completion: forall M in R(M_0), M >= M_f implies M = M_f
    proofSteps.push('5. Verifying Proper Completion (forall M in R(M_0), M >= M_f implies M = M_f)...');
    let properCompletion = true;
    for (const [hash, marking] of rg.markings.entries()) {
      const finalTokens = marking.get(finalPlace) || 0;
      if (finalTokens > 0) {
        // When final place has token, check if any OTHER place has tokens
        for (const [pId, tokens] of marking.entries()) {
          if (pId !== finalPlace && tokens > 0) {
            properCompletion = false;
            proofSteps.push(`  ✗ Residual token detected in place "${pId}" when final place reached.`);
            break;
          }
          if (pId === finalPlace && tokens > 1) {
            properCompletion = false;
            proofSteps.push(`  ✗ Multiple tokens (${tokens}) detected in final place.`);
            break;
          }
        }
      }
    }

    if (properCompletion) {
      proofSteps.push('  ✓ Proper Completion holds: Terminal state contains exactly 1 token in p_end and 0 tokens elsewhere.');
    }

    // 6. Verify Liveness (No Dead Transitions): forall t in T, exists M in R(M_0) where t is enabled
    proofSteps.push('6. Verifying Liveness / No Dead Transitions...');
    const firedTransitions = new Set<string>();
    for (const edge of rg.edges) {
      firedTransitions.add(edge.transitionId);
    }

    const allTransitions = net.getTransitions().map(t => t.id);
    const deadTransitions = allTransitions.filter(tId => !firedTransitions.has(tId));
    const liveTransitions = deadTransitions.length === 0;

    if (liveTransitions) {
      proofSteps.push('  ✓ Liveness holds: All transitions can be fired in at least one reachable trace.');
    } else {
      proofSteps.push(`  ✗ Dead transitions found: [${deadTransitions.join(', ')}]`);
    }

    // 7. Check unvisited places
    const visitedPlaces = new Set<string>();
    for (const marking of rg.markings.values()) {
      for (const [pId, tokens] of marking.entries()) {
        if (tokens > 0) visitedPlaces.add(pId);
      }
    }
    const unreachablePlaces = net.getPlaces().map(p => p.id).filter(pId => !visitedPlaces.has(pId));

    // 8. Siphon & Trap Invariant Analysis
    proofSteps.push('7. Computing Siphon & Trap Invariant Analysis...');
    const siphonTrapAnalysis = this.computeSiphonsAndTraps(net);
    proofSteps.push(`  ✓ Computed ${siphonTrapAnalysis.siphons.length} Siphons, ${siphonTrapAnalysis.traps.length} Traps.`);

    const isSound = optionToComplete && properCompletion && liveTransitions && rg.deadlockStates.length === 0;

    proofSteps.push(`8. Final Soundness Verdict: ${isSound ? 'SOUND (PASSED)' : 'NOT SOUND (FAILED)'}`);

    return {
      isSound,
      optionToComplete,
      properCompletion,
      liveTransitions,
      deadlocks: rg.deadlockStates,
      unreachablePlaces,
      deadTransitions,
      reachableStateCount: rg.markings.size,
      incidenceMatrix: incMatrix,
      siphonTrapAnalysis,
      proofSteps
    };
  }
}

/**
 * Functional export to verify net soundness.
 */
export function verifySoundness(net: PetriNet): SoundnessProofResult {
  return SoundnessVerifier.verifySoundness(net);
}
