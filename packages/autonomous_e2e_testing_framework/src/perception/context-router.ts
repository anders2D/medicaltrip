/**
 * context-router.ts
 * Multi-modal Context Routing Decision Engine.
 * Dynamically dispatches between semantic AXTree DOM actions and Set-of-Marks VLM visual coordinates.
 */

import { CompactAXSnapshot, AXElementNode } from './dom-trimmer.js';
import { SetOfMarksResult, SetOfMarkEntry } from './set-of-marks.js';

export type ActionRouteType = 'AX_DOM_ROUTE' | 'VLM_VISUAL_ROUTE' | 'HYBRID_FALLBACK';

export interface ElementTarget {
  elementId?: string;          // e.g. "e1", "e2"
  selector?: string;           // CSS / XPath
  role?: string;               // ARIA role
  name?: string;               // Accessible label / text
  markId?: number;             // Set-of-Marks ID
  tagName?: string;            // e.g. "canvas", "button"
  coordinates?: { x: number; y: number };
  isVisualTarget?: boolean;
}

export interface AppState {
  currentUrl: string;
  axSnapshot: CompactAXSnapshot;
  visualMarks?: SetOfMarksResult;
  domMutated?: boolean;
  activeDialog?: boolean;
}

export interface RoutingDecision {
  route: ActionRouteType;
  targetElementId?: string;
  targetCoords?: { x: number; y: number };
  targetMarkId?: number;
  confidence: number;
  reason: string;
  matchedAXNode?: AXElementNode;
  matchedVisualMark?: SetOfMarkEntry;
}

export interface RouterConfig {
  confidenceThreshold?: number;
  preferVisualForCanvas?: boolean;
  enableHybridFallback?: boolean;
}

const VISUAL_TAGS = new Set(['canvas', 'svg', 'webgl', 'video', 'embed', 'object']);
const VISUAL_ROLES = new Set(['canvas', 'img', 'figure', 'graphics-document']);

export class ContextRouter {
  private config: Required<RouterConfig>;
  private routingHistory: RoutingDecision[] = [];

  constructor(config: RouterConfig = {}) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.8,
      preferVisualForCanvas: config.preferVisualForCanvas ?? true,
      enableHybridFallback: config.enableHybridFallback ?? true
    };
  }

  /**
   * Evaluates the application state and target descriptor to decide the optimal interaction route.
   */
  public routeAction(state: AppState, target: ElementTarget): RoutingDecision {
    const axSnapshot = state.axSnapshot;
    const visualMarks = state.visualMarks;

    // 1. Explicit visual target request (or markId provided)
    if (target.isVisualTarget || target.markId !== undefined) {
      if (visualMarks && visualMarks.marks.length > 0) {
        const mark = target.markId !== undefined
          ? visualMarks.marks.find(m => m.markId === target.markId)
          : visualMarks.marks.find(m => target.name && m.label.toLowerCase().includes(target.name.toLowerCase()));

        if (mark) {
          const decision: RoutingDecision = {
            route: 'VLM_VISUAL_ROUTE',
            targetCoords: mark.centroid,
            targetMarkId: mark.markId,
            confidence: mark.confidence,
            reason: `Target explicitly matched visual mark #${mark.markId} [${mark.label}]`,
            matchedVisualMark: mark
          };
          this.record(decision);
          return decision;
        }
      }
    }

    // 2. Check if target is a Canvas / SVG / WebGL component
    const isCanvasTag = target.tagName && VISUAL_TAGS.has(target.tagName.toLowerCase());
    const isCanvasRole = target.role && VISUAL_ROLES.has(target.role.toLowerCase());

    if (this.config.preferVisualForCanvas && (isCanvasTag || isCanvasRole)) {
      if (visualMarks && visualMarks.marks.length > 0) {
        // Find visual mark inside or matching canvas
        const mark = visualMarks.marks.find(m =>
          m.category === 'canvas_drawing' ||
          m.category === 'signature_pad' ||
          m.category === 'webgl_element' ||
          (target.name && m.label.toLowerCase().includes(target.name.toLowerCase()))
        );

        if (mark) {
          const decision: RoutingDecision = {
            route: 'VLM_VISUAL_ROUTE',
            targetCoords: mark.centroid,
            targetMarkId: mark.markId,
            confidence: 0.95,
            reason: `Canvas/Visual target routed to VLM Set-of-Marks grounder #${mark.markId}`,
            matchedVisualMark: mark
          };
          this.record(decision);
          return decision;
        }
      }

      // If coordinates are provided directly
      if (target.coordinates) {
        const decision: RoutingDecision = {
          route: 'VLM_VISUAL_ROUTE',
          targetCoords: target.coordinates,
          confidence: 0.90,
          reason: `Direct coordinates dispatched to visual surface target`
        };
        this.record(decision);
        return decision;
      }
    }

    // 3. Search in AXTree snapshot
    let matchedNode: AXElementNode | undefined;

    if (target.elementId) {
      matchedNode = axSnapshot.interactiveElements.find(el => el.elementId === target.elementId);
    } else if (target.name) {
      const targetLower = target.name.toLowerCase();
      // Exact match first
      matchedNode = axSnapshot.interactiveElements.find(
        el => el.name.toLowerCase() === targetLower
      );
      // Partial match fallback
      if (!matchedNode) {
        matchedNode = axSnapshot.interactiveElements.find(
          el => el.name.toLowerCase().includes(targetLower)
        );
      }
    } else if (target.role) {
      matchedNode = axSnapshot.interactiveElements.find(el => el.role === target.role);
    }

    if (matchedNode) {
      // If the matched node is a visual canvas/svg without subnodes, route visually
      if (matchedNode.isCanvasOrVisual && this.config.preferVisualForCanvas) {
        const coords = {
          x: Math.round(matchedNode.boundingBox.x + matchedNode.boundingBox.width / 2),
          y: Math.round(matchedNode.boundingBox.y + matchedNode.boundingBox.height / 2)
        };
        const decision: RoutingDecision = {
          route: 'VLM_VISUAL_ROUTE',
          targetElementId: matchedNode.elementId,
          targetCoords: coords,
          confidence: 0.92,
          reason: `AXTree node [${matchedNode.elementId}] is a visual canvas/svg surface`,
          matchedAXNode: matchedNode
        };
        this.record(decision);
        return decision;
      }

      const decision: RoutingDecision = {
        route: 'AX_DOM_ROUTE',
        targetElementId: matchedNode.elementId,
        targetCoords: {
          x: Math.round(matchedNode.boundingBox.x + matchedNode.boundingBox.width / 2),
          y: Math.round(matchedNode.boundingBox.y + matchedNode.boundingBox.height / 2)
        },
        confidence: 0.98,
        reason: `Matched semantic AXTree element [${matchedNode.elementId}] role="${matchedNode.role}" name="${matchedNode.name}"`,
        matchedAXNode: matchedNode
      };
      this.record(decision);
      return decision;
    }

    // 4. Hybrid fallback when DOM lookup fails or mutated
    if (this.config.enableHybridFallback) {
      // Check visual marks first
      if (visualMarks && visualMarks.marks.length > 0) {
        const fallbackMark = visualMarks.marks[0];
        const decision: RoutingDecision = {
          route: 'HYBRID_FALLBACK',
          targetCoords: fallbackMark.centroid,
          targetMarkId: fallbackMark.markId,
          confidence: 0.65,
          reason: `AXTree lookup failed for target. Falling back to visual mark #${fallbackMark.markId}`,
          matchedVisualMark: fallbackMark
        };
        this.record(decision);
        return decision;
      }

      // If target coordinates exist
      if (target.coordinates) {
        const decision: RoutingDecision = {
          route: 'HYBRID_FALLBACK',
          targetCoords: target.coordinates,
          confidence: 0.60,
          reason: `AXTree lookup failed. Falling back to target coordinates (${target.coordinates.x}, ${target.coordinates.y})`
        };
        this.record(decision);
        return decision;
      }
    }

    // Default error/unresolved route
    const unresolved: RoutingDecision = {
      route: 'HYBRID_FALLBACK',
      confidence: 0.0,
      reason: `Could not resolve target in AXTree or Visual Marks: ${JSON.stringify(target)}`
    };
    this.record(unresolved);
    return unresolved;
  }

  private record(decision: RoutingDecision) {
    this.routingHistory.push(decision);
  }

  public getHistory(): RoutingDecision[] {
    return [...this.routingHistory];
  }

  public clearHistory(): void {
    this.routingHistory = [];
  }
}

/**
 * Functional factory for context routing.
 */
export function routeAction(state: AppState, target: ElementTarget, config?: RouterConfig): RoutingDecision {
  const router = new ContextRouter(config);
  return router.routeAction(state, target);
}
