/**
 * Vectorial Agentic Memory & Multi-Modal Self-Healing Engine
 * 
 * Stores 384-dimensional semantic embeddings of UI elements and calculates
 * multi-modal similarity S(c, tau) combining Cosine Semantic Distance, DOM Tree Proximity,
 * and Visual IoU to automatically heal broken/mutated locators without test failure.
 */

import * as crypto from 'node:crypto';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ElementDescriptor {
  tag: string;
  role?: string;
  ariaLabel?: string;
  text?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  domPath?: string;
  boundingBox?: BoundingBox;
}

export interface ElementSignature extends ElementDescriptor {
  id: string;
  selector: string;
  semanticVector: number[]; // 384-dimensional L2-normalized float vector
  timestamp: string;
}

export interface ElementCandidate extends ElementDescriptor {
  candidateId: string;
  currentSelector: string;
}

export interface SimilarityWeights {
  w1_semantic: number; // default 0.50
  w2_tree: number;     // default 0.25
  w3_iou: number;      // default 0.25
}

export interface SimilarityBreakdown {
  totalScore: number;
  semanticCosine: number;
  treeProximity: number;
  visualIoU: number;
  weights: SimilarityWeights;
}

export interface HealingResult {
  healed: boolean;
  originalSelector: string;
  healedSelector: string;
  candidateId: string;
  confidence: number;
  breakdown: SimilarityBreakdown;
  signature: ElementSignature;
}

export const DEFAULT_WEIGHTS: SimilarityWeights = {
  w1_semantic: 0.50,
  w2_tree: 0.25,
  w3_iou: 0.25
};

export const HEALING_CONFIDENCE_THRESHOLD = 0.82;
export const EMBEDDING_DIMENSION = 384;

/**
 * Computes a deterministic 384-dimensional semantic embedding vector
 * using feature hashing and token projections normalized to unit L2 sphere.
 */
export function computeSemanticEmbedding(element: ElementDescriptor): number[] {
  const vector = new Float64Array(EMBEDDING_DIMENSION);

  // Extract feature strings
  const features: Array<{ token: string; weight: number }> = [
    { token: `tag:${element.tag.toLowerCase()}`, weight: 2.0 },
    { token: `role:${(element.role || '').toLowerCase()}`, weight: 2.5 },
    { token: `aria:${(element.ariaLabel || '').toLowerCase()}`, weight: 3.0 },
    { token: `text:${(element.text || '').trim().toLowerCase()}`, weight: 2.5 },
  ];

  if (element.classes) {
    for (const cls of element.classes) {
      features.push({ token: `class:${cls.toLowerCase()}`, weight: 1.2 });
    }
  }

  if (element.attributes) {
    for (const [k, v] of Object.entries(element.attributes)) {
      if (k === 'id' || k === 'name' || k === 'type' || k === 'data-testid' || k === 'aria-label') {
        features.push({ token: `attr:${k}=${v.toLowerCase()}`, weight: 2.0 });
      }
    }
  }

  // Feature projection into 384-dim space
  for (const { token, weight } of features) {
    if (!token || token.endsWith(':')) continue;

    // Generate deterministic 32-bit hashes using SHA-256
    const hash = crypto.createHash('sha256').update(token).digest();
    
    // Hash projections to multiple dimensions for dense representation
    for (let i = 0; i < 8; i++) {
      const idx = (hash.readUInt16BE(i * 2) + i * 47) % EMBEDDING_DIMENSION;
      const sign = (hash.readUInt8((i * 2) + 1) & 1) === 1 ? 1 : -1;
      const magnitude = (hash.readUInt8(i * 2) / 255.0) * weight;
      vector[idx] += sign * magnitude;
    }
  }

  // Positional and structural encoding if bounding box is provided
  if (element.boundingBox) {
    const { x, y, width, height } = element.boundingBox;
    const normX = Math.sin((x / 1920) * Math.PI);
    const normY = Math.cos((y / 1080) * Math.PI);
    const normW = (width / 500);
    const normH = (height / 200);

    vector[0] += normX * 0.8;
    vector[1] += normY * 0.8;
    vector[2] += normW * 0.5;
    vector[3] += normH * 0.5;
  }

  // L2 Normalization (||v||_2 = 1.0)
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    sumSq += vector[i] * vector[i];
  }

  const norm = Math.sqrt(sumSq) || 1.0;
  const normalized = new Array<number>(EMBEDDING_DIMENSION);
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    normalized[i] = vector[i] / norm;
  }

  return normalized;
}

/**
 * Computes Cosine Similarity between two L2-normalized vectors in [-1.0, 1.0] -> normalized to [0.0, 1.0]
 */
export function computeCosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    normA += v1[i] * v1[i];
    normB += v2[i] * v2[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const rawCosine = dotProduct / denominator;
  // Map [-1, 1] to [0, 1]
  return Math.max(0, Math.min(1, (rawCosine + 1) / 2));
}

/**
 * Computes standard Levenshtein Edit Distance between two strings
 */
export function computeLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes Levenshtein edit distance on arrays of strings
 */
function computeArrayLevenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Computes DOM Tree Proximity score in [0.0, 1.0] evaluating structural hierarchy and path alignment
 */
export function computeTreeProximity(pathA?: string, pathB?: string): number {
  if (!pathA || !pathB) return 0.5; // Neutral score when path is unknown
  if (pathA === pathB) return 1.0;

  const segsA = pathA.split('/').filter(Boolean);
  const segsB = pathB.split('/').filter(Boolean);

  // Extract base tag hierarchy (ignoring IDs and classes for structural match)
  const tagSegsA = segsA.map(s => s.split(/[#.]/)[0].toLowerCase());
  const tagSegsB = segsB.map(s => s.split(/[#.]/)[0].toLowerCase());

  const segDist = computeArrayLevenshtein(tagSegsA, tagSegsB);
  const maxSegs = Math.max(tagSegsA.length, tagSegsB.length) || 1;
  const structSim = Math.max(0, 1.0 - segDist / maxSegs);

  // Full string Levenshtein similarity
  const charDist = computeLevenshteinDistance(pathA, pathB);
  const maxLen = Math.max(pathA.length, pathB.length) || 1;
  const charSim = Math.max(0, 1.0 - charDist / maxLen);

  return Math.min(1.0, 0.7 * structSim + 0.3 * charSim);
}

/**
 * Computes 2D Bounding Box Visual Intersection-over-Union (IoU) in [0.0, 1.0]
 */
export function computeVisualIoU(boxA?: BoundingBox, boxB?: BoundingBox): number {
  if (!boxA || !boxB) return 0.5; // Neutral fallback

  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const intersectionArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - intersectionArea;

  if (unionArea <= 0) return 0;
  return Math.max(0, Math.min(1.0, intersectionArea / unionArea));
}

/**
 * Calculates total multi-modal similarity score S(c, tau_orig)
 */
export function calculateMultiModalSimilarity(
  candidate: ElementCandidate,
  target: ElementSignature,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): SimilarityBreakdown {
  const candidateVector = computeSemanticEmbedding(candidate);
  const semanticCosine = computeCosineSimilarity(candidateVector, target.semanticVector);
  const treeProximity = computeTreeProximity(candidate.domPath, target.domPath);
  const visualIoU = computeVisualIoU(candidate.boundingBox, target.boundingBox);

  const totalScore =
    weights.w1_semantic * semanticCosine +
    weights.w2_tree * treeProximity +
    weights.w3_iou * visualIoU;

  return {
    totalScore,
    semanticCosine,
    treeProximity,
    visualIoU,
    weights
  };
}

/**
 * Vectorial Agentic Memory Store
 */
export class AgenticMemory {
  private signatures: Map<string, ElementSignature> = new Map(); // selector -> signature
  private healedBindings: Map<string, string> = new Map();       // originalSelector -> healedSelector

  /**
   * Records or updates a known valid element signature
   */
  public registerElement(selector: string, descriptor: ElementDescriptor): ElementSignature {
    const semanticVector = computeSemanticEmbedding(descriptor);
    const id = `sig_${crypto.createHash('md5').update(selector).digest('hex').substring(0, 8)}`;

    const signature: ElementSignature = {
      ...descriptor,
      id,
      selector,
      semanticVector,
      timestamp: new Date().toISOString()
    };

    this.signatures.set(selector, signature);
    return signature;
  }

  public getSignature(selector: string): ElementSignature | undefined {
    return this.signatures.get(selector);
  }

  public getActiveSelector(originalSelector: string): string {
    return this.healedBindings.get(originalSelector) || originalSelector;
  }

  public recordHealedBinding(originalSelector: string, newSelector: string): void {
    this.healedBindings.set(originalSelector, newSelector);
  }

  public getAllSignatures(): ElementSignature[] {
    return Array.from(this.signatures.values());
  }

  public clear(): void {
    this.signatures.clear();
    this.healedBindings.clear();
  }

  /**
   * Serializes memory state to JSON
   */
  public exportSnapshot(): string {
    return JSON.stringify({
      signatures: Array.from(this.signatures.entries()),
      healedBindings: Array.from(this.healedBindings.entries())
    });
  }

  /**
   * Restores memory state from JSON
   */
  public importSnapshot(jsonString: string): void {
    const data = JSON.parse(jsonString);
    this.signatures = new Map(data.signatures);
    this.healedBindings = new Map(data.healedBindings);
  }
}

/**
 * Searches candidates for the best matching element to heal a broken locator
 */
export async function healLocator(
  failedSelector: string,
  candidates: ElementCandidate[],
  memory: AgenticMemory,
  threshold: number = HEALING_CONFIDENCE_THRESHOLD,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): Promise<HealingResult | null> {
  const signature = memory.getSignature(failedSelector);
  if (!signature) {
    return null;
  }

  let bestCandidate: ElementCandidate | null = null;
  let bestBreakdown: SimilarityBreakdown | null = null;
  let highestScore = -1;

  for (const candidate of candidates) {
    const breakdown = calculateMultiModalSimilarity(candidate, signature, weights);
    if (breakdown.totalScore > highestScore) {
      highestScore = breakdown.totalScore;
      bestCandidate = candidate;
      bestBreakdown = breakdown;
    }
  }

  if (bestCandidate && bestBreakdown && highestScore >= threshold) {
    const result: HealingResult = {
      healed: true,
      originalSelector: failedSelector,
      healedSelector: (bestCandidate as ElementCandidate).currentSelector,
      candidateId: (bestCandidate as ElementCandidate).candidateId,
      confidence: highestScore,
      breakdown: bestBreakdown,
      signature
    };

    // Update memory bindings
    memory.recordHealedBinding(failedSelector, result.healedSelector);
    return result;
  }

  return null;
}
