/**
 * index.ts
 * Main entry point for @medicaltrip/autonomous-e2e-testing-framework.
 * Unified export of Perception, Formal Modeling, CDP Emulation, Visual AI, and Master Lifecycle Runner engines.
 */

// M1: Perception & Context Routing Layer
export * from './perception/dom-trimmer.js';
export * from './perception/set-of-marks.js';
export * from './perception/context-router.js';
export * from './perception/mcp-protocol.js';

// M2: Formal Process Modeling & Temporal Logic Layer
export * from './formal/petri-net.js';
export * from './formal/bpmn-translator.js';
export * from './formal/soundness-verifier.js';
export * from './formal/ltl-engine.js';

// M3: Low-Level CDP Hardware Emulation Layer
export * from './cdp/cdp-client.js';
export * from './cdp/browser-launcher.js';
export * from './cdp/gesture-dispatcher.js';
export * from './cdp/network-emulator.js';
export * from './cdp/focus-trap-override.js';

// M4: Resilient Self-Healing & Visual Regression Layer
export {
  AgenticMemory,
  computeSemanticEmbedding,
  computeCosineSimilarity,
  computeLevenshteinDistance,
  computeTreeProximity,
  computeVisualIoU,
  calculateMultiModalSimilarity,
  healLocator,
  EMBEDDING_DIMENSION,
  DEFAULT_WEIGHTS,
  HEALING_CONFIDENCE_THRESHOLD,
  type ElementDescriptor,
  type ElementSignature,
  type ElementCandidate,
  type SimilarityWeights,
  type SimilarityBreakdown,
  type HealingResult
} from './visual/agentic-memory.js';
export * from './visual/ssim-engine.js';
export * from './visual/perceptual-hash.js';
export * from './visual/synthetic-faker.js';

// M5: CI/CD Master Test Runner & Quarantine Layer
export * from './runner/test-runner.js';
export * from './runner/quarantine.js';
export * from './runner/reporter.js';
