/**
 * set-of-marks.ts
 * Set-of-Marks (SoM) visual coordinate resolution and spatial grounding engine.
 * Maps normalized VLM bounding boxes [0.0, 1.0] to physical viewport pixels
 * for non-semantic <canvas>, SVG, WebGL, and custom overlay components.
 */

export interface Viewport {
  width: number;
  height: number;
  devicePixelRatio?: number;
}

export interface NormalizedBoundingBox {
  x: number;      // [0.0, 1.0] left edge
  y: number;      // [0.0, 1.0] top edge
  width: number;  // [0.0, 1.0] width
  height: number; // [0.0, 1.0] height
}

export interface PixelCoords {
  x: number;
  y: number;
}

export interface PixelBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface SetOfMarkEntry {
  markId: number;
  label: string;
  category: 'canvas_drawing' | 'svg_node' | 'webgl_element' | 'signature_pad' | 'interactive_mark' | 'visual_roi';
  normalizedBBox: NormalizedBoundingBox;
  pixelBBox: PixelBoundingBox;
  centroid: PixelCoords;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface SetOfMarksResult {
  timestamp: string;
  viewport: Viewport;
  marks: SetOfMarkEntry[];
  totalMarks: number;
  canvasMarksCount: number;
}

export interface VisualElementCandidate {
  label: string;
  category?: SetOfMarkEntry['category'];
  normalizedBBox?: NormalizedBoundingBox;
  pixelBBox?: { x: number; y: number; width: number; height: number };
  confidence?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Clamps coordinates within viewport bounds [0, width] x [0, height].
 */
export function clampCoordinates(
  coords: PixelCoords,
  viewport: Viewport
): PixelCoords {
  return {
    x: Math.max(0, Math.min(viewport.width, Math.round(coords.x))),
    y: Math.max(0, Math.min(viewport.height, Math.round(coords.y)))
  };
}

/**
 * Converts normalized bounding box [0.0, 1.0] to physical viewport pixels.
 */
export function resolveNormalizedToPixels(
  bbox: NormalizedBoundingBox,
  viewport: Viewport
): PixelBoundingBox {
  const x = Math.max(0, Math.min(viewport.width, bbox.x * viewport.width));
  const y = Math.max(0, Math.min(viewport.height, bbox.y * viewport.height));
  const width = Math.max(1, Math.min(viewport.width - x, bbox.width * viewport.width));
  const height = Math.max(1, Math.min(viewport.height - y, bbox.height * viewport.height));
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    centerX: Math.round(centerX),
    centerY: Math.round(centerY)
  };
}

/**
 * Converts physical pixel bounding box to normalized coordinates [0.0, 1.0].
 */
export function resolvePixelsToNormalized(
  pixelBBox: { x: number; y: number; width: number; height: number },
  viewport: Viewport
): NormalizedBoundingBox {
  const normX = Math.max(0, Math.min(1.0, pixelBBox.x / viewport.width));
  const normY = Math.max(0, Math.min(1.0, pixelBBox.y / viewport.height));
  const normW = Math.max(0, Math.min(1.0 - normX, pixelBBox.width / viewport.width));
  const normH = Math.max(0, Math.min(1.0 - normY, pixelBBox.height / viewport.height));

  return {
    x: Number(normX.toFixed(4)),
    y: Number(normY.toFixed(4)),
    width: Number(normW.toFixed(4)),
    height: Number(normH.toFixed(4))
  };
}

/**
 * Resolves mark coordinate target (e.g. centroid or specific offset) for automation interaction.
 */
export function resolveVisualCoordinates(
  markId: number,
  bbox: NormalizedBoundingBox,
  viewport: Viewport
): PixelCoords {
  const pixelBBox = resolveNormalizedToPixels(bbox, viewport);
  return {
    x: pixelBBox.centerX,
    y: pixelBBox.centerY
  };
}

/**
 * Generates an indexed Set-of-Marks overlay collection from detected candidates.
 */
export function generateSetOfMarksOverlay(
  candidates: VisualElementCandidate[],
  viewport: Viewport = { width: 1280, height: 800 }
): SetOfMarksResult {
  const marks: SetOfMarkEntry[] = [];
  let markCounter = 1;
  let canvasCount = 0;

  for (const cand of candidates) {
    let normBBox: NormalizedBoundingBox;
    let pixelBBox: PixelBoundingBox;

    if (cand.normalizedBBox) {
      normBBox = cand.normalizedBBox;
      pixelBBox = resolveNormalizedToPixels(normBBox, viewport);
    } else if (cand.pixelBBox) {
      pixelBBox = {
        x: cand.pixelBBox.x,
        y: cand.pixelBBox.y,
        width: cand.pixelBBox.width,
        height: cand.pixelBBox.height,
        centerX: Math.round(cand.pixelBBox.x + cand.pixelBBox.width / 2),
        centerY: Math.round(cand.pixelBBox.y + cand.pixelBBox.height / 2)
      };
      normBBox = resolvePixelsToNormalized(cand.pixelBBox, viewport);
    } else {
      continue; // Skip invalid candidate
    }

    const category = cand.category || 'interactive_mark';
    if (category === 'canvas_drawing' || category === 'signature_pad' || category === 'webgl_element') {
      canvasCount++;
    }

    const markEntry: SetOfMarkEntry = {
      markId: markCounter++,
      label: cand.label,
      category,
      normalizedBBox: normBBox,
      pixelBBox,
      centroid: { x: pixelBBox.centerX, y: pixelBBox.centerY },
      confidence: cand.confidence ?? 0.95,
      metadata: cand.metadata
    };

    marks.push(markEntry);
  }

  return {
    timestamp: new Date().toISOString(),
    viewport,
    marks,
    totalMarks: marks.length,
    canvasMarksCount: canvasCount
  };
}

/**
 * Query helper to find a mark entry by markId, label substring, or nearest Euclidean distance.
 */
export function findMark(
  result: SetOfMarksResult,
  query: { markId?: number; label?: string; nearCoords?: PixelCoords; maxDistancePx?: number }
): SetOfMarkEntry | null {
  if (query.markId !== undefined) {
    return result.marks.find(m => m.markId === query.markId) || null;
  }

  if (query.label) {
    const qLower = query.label.toLowerCase();
    const exact = result.marks.find(m => m.label.toLowerCase() === qLower);
    if (exact) return exact;
    const partial = result.marks.find(m => m.label.toLowerCase().includes(qLower));
    if (partial) return partial;
  }

  if (query.nearCoords) {
    let closest: SetOfMarkEntry | null = null;
    let minDist = query.maxDistancePx ?? 100;

    for (const mark of result.marks) {
      const dx = mark.centroid.x - query.nearCoords.x;
      const dy = mark.centroid.y - query.nearCoords.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = mark;
      }
    }
    return closest;
  }

  return null;
}

/**
 * Computes Intersection over Union (IoU) between two bounding boxes.
 */
export function computeBoundingBoxIoU(
  boxA: { x: number; y: number; width: number; height: number },
  boxB: { x: number; y: number; width: number; height: number }
): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return Number((interArea / unionArea).toFixed(4));
}
