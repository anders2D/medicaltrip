/**
 * Low-Level Multi-Touch Gesture Engine
 * 
 * Injects synthetic multi-touch events directly via CDP `Input.dispatchTouchEvent`
 * supporting Pinch-to-Zoom, Drag-to-Pan, and Continuous Pressure-Sensitive Digital Signatures.
 */

export interface TouchPointCDP {
  x: number;
  y: number;
  radiusX?: number;
  radiusY?: number;
  rotationAngle?: number;
  force?: number;
  id: number;
}

export interface CDPDispatcherClient {
  send<T = any>(method: string, params?: Record<string, any>, sessionId?: string): Promise<T>;
}

export interface GestureOptions {
  durationMs?: number;
  steps?: number;
  sessionId?: string;
  delayFn?: (ms: number) => Promise<void>;
}

export interface PressureStrokePoint {
  x: number;
  y: number;
  force?: number;
  radiusX?: number;
  radiusY?: number;
  timestamp?: number;
}

export interface SignatureTrajectory {
  points: PressureStrokePoint[];
  durationMs?: number;
}

const defaultDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Dispatches a synthetic Pinch-to-Zoom gesture using 2 simultaneous touch points
 * moving symmetrically towards or away from a central anchor point.
 */
export async function dispatchPinchToZoom(
  cdp: CDPDispatcherClient,
  center: { x: number; y: number },
  initialSpanPx: number,
  finalSpanPx: number,
  options: GestureOptions = {}
): Promise<void> {
  const steps = options.steps ?? 20;
  const durationMs = options.durationMs ?? 300;
  const delay = options.delayFn ?? defaultDelay;
  const dt = Math.max(1, Math.floor(durationMs / steps));
  const sessionId = options.sessionId;

  // Step 1: TouchStart (2 fingers at initial span distance)
  const p1_start: TouchPointCDP = {
    x: Math.round(center.x - initialSpanPx / 2),
    y: Math.round(center.y),
    id: 0,
    force: 0.5,
    radiusX: 5,
    radiusY: 5
  };
  const p2_start: TouchPointCDP = {
    x: Math.round(center.x + initialSpanPx / 2),
    y: Math.round(center.y),
    id: 1,
    force: 0.5,
    radiusX: 5,
    radiusY: 5
  };

  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchStart',
      touchPoints: [p1_start, p2_start]
    },
    sessionId
  );

  // Step 2: TouchMove interpolation
  for (let k = 1; k <= steps; k++) {
    const progress = k / steps;
    const currentSpan = initialSpanPx + (finalSpanPx - initialSpanPx) * progress;
    const dynamicForce = Math.min(1.0, Math.max(0.1, 0.5 + 0.3 * Math.sin(progress * Math.PI)));

    const p1_curr: TouchPointCDP = {
      x: Math.round(center.x - currentSpan / 2),
      y: Math.round(center.y),
      id: 0,
      force: dynamicForce,
      radiusX: 5,
      radiusY: 5
    };
    const p2_curr: TouchPointCDP = {
      x: Math.round(center.x + currentSpan / 2),
      y: Math.round(center.y),
      id: 1,
      force: dynamicForce,
      radiusX: 5,
      radiusY: 5
    };

    await cdp.send(
      'Input.dispatchTouchEvent',
      {
        type: 'touchMove',
        touchPoints: [p1_curr, p2_curr]
      },
      sessionId
    );

    if (dt > 0) {
      await delay(dt);
    }
  }

  // Step 3: TouchEnd
  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchEnd',
      touchPoints: []
    },
    sessionId
  );
}

/**
 * Dispatches a Drag-to-Pan gesture from start coordinates to end coordinates.
 */
export async function dispatchDragToPan(
  cdp: CDPDispatcherClient,
  start: { x: number; y: number },
  end: { x: number; y: number },
  options: GestureOptions = {}
): Promise<void> {
  const steps = options.steps ?? 15;
  const durationMs = options.durationMs ?? 250;
  const delay = options.delayFn ?? defaultDelay;
  const dt = Math.max(1, Math.floor(durationMs / steps));
  const sessionId = options.sessionId;

  // Step 1: TouchStart
  const startPoint: TouchPointCDP = {
    x: Math.round(start.x),
    y: Math.round(start.y),
    id: 0,
    force: 0.6,
    radiusX: 4,
    radiusY: 4
  };

  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchStart',
      touchPoints: [startPoint]
    },
    sessionId
  );

  // Step 2: TouchMove with linear or ease interpolation
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    // Cubic ease-in-out curve
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const currX = Math.round(start.x + (end.x - start.x) * ease);
    const currY = Math.round(start.y + (end.y - start.y) * ease);

    const currPoint: TouchPointCDP = {
      x: currX,
      y: currY,
      id: 0,
      force: 0.6 + 0.2 * Math.sin(t * Math.PI),
      radiusX: 4,
      radiusY: 4
    };

    await cdp.send(
      'Input.dispatchTouchEvent',
      {
        type: 'touchMove',
        touchPoints: [currPoint]
      },
      sessionId
    );

    if (dt > 0) {
      await delay(dt);
    }
  }

  // Step 3: TouchEnd
  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchEnd',
      touchPoints: []
    },
    sessionId
  );
}

/**
 * Dispatches continuous pressure-sensitive handwriting strokes on digital signature canvas.
 * Applies realistic continuous force curves f(t) = 0.2 + 0.6 * sin(pi * t / T) + noise.
 */
export async function dispatchPressureStroke(
  cdp: CDPDispatcherClient,
  trajectory: PressureStrokePoint[] | SignatureTrajectory,
  options: GestureOptions = {}
): Promise<void> {
  const points = Array.isArray(trajectory) ? trajectory : trajectory.points;
  if (!points || points.length === 0) return;

  const durationMs = options.durationMs ?? (Array.isArray(trajectory) ? 350 : trajectory.durationMs ?? 350);
  const delay = options.delayFn ?? defaultDelay;
  const dt = Math.max(1, Math.floor(durationMs / points.length));
  const sessionId = options.sessionId;

  const T = points.length;

  // Step 1: TouchStart at first point
  const first = points[0];
  const initialForce = first.force ?? 0.25;

  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchStart',
      touchPoints: [
        {
          x: Math.round(first.x),
          y: Math.round(first.y),
          id: 0,
          force: initialForce,
          radiusX: first.radiusX ?? 3,
          radiusY: first.radiusY ?? 3
        }
      ]
    },
    sessionId
  );

  // Step 2: TouchMove across trajectory
  for (let idx = 1; idx < points.length; idx++) {
    const pt = points[idx];
    // Dynamic force calculation if not explicitly provided
    let force = pt.force;
    if (force === undefined) {
      const normalizedTime = idx / T;
      const wave = 0.2 + 0.6 * Math.sin(Math.PI * normalizedTime);
      const jitter = (Math.sin(idx * 1.7) * 0.05);
      force = Math.min(1.0, Math.max(0.1, wave + jitter));
    }

    const touchPoint: TouchPointCDP = {
      x: Math.round(pt.x),
      y: Math.round(pt.y),
      id: 0,
      force,
      radiusX: pt.radiusX ?? Math.round(2 + force * 4),
      radiusY: pt.radiusY ?? Math.round(2 + force * 4)
    };

    await cdp.send(
      'Input.dispatchTouchEvent',
      {
        type: 'touchMove',
        touchPoints: [touchPoint]
      },
      sessionId
    );

    if (dt > 0) {
      await delay(dt);
    }
  }

  // Step 3: TouchEnd
  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchEnd',
      touchPoints: []
    },
    sessionId
  );
}

/**
 * Dispatches a quick discrete Touch Tap at coordinates
 */
export async function dispatchTouchTap(
  cdp: CDPDispatcherClient,
  point: { x: number; y: number },
  options: { durationMs?: number; sessionId?: string; delayFn?: (ms: number) => Promise<void> } = {}
): Promise<void> {
  const durationMs = options.durationMs ?? 50;
  const delay = options.delayFn ?? defaultDelay;
  const sessionId = options.sessionId;

  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchStart',
      touchPoints: [{ x: Math.round(point.x), y: Math.round(point.y), id: 0, force: 0.8 }]
    },
    sessionId
  );

  if (durationMs > 0) {
    await delay(durationMs);
  }

  await cdp.send(
    'Input.dispatchTouchEvent',
    {
      type: 'touchEnd',
      touchPoints: []
    },
    sessionId
  );
}

/**
 * Generates an authentic cursive patient signature trajectory bounded within a box
 */
export function generateRealisticSignature(
  bounds: { x: number; y: number; width: number; height: number },
  numPoints: number = 30
): PressureStrokePoint[] {
  const points: PressureStrokePoint[] = [];
  const startX = bounds.x + bounds.width * 0.1;
  const startY = bounds.y + bounds.height * 0.5;

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    // Cursive loop simulation: progression on X with sinusoidal loops on Y
    const x = startX + t * (bounds.width * 0.8) + Math.sin(t * 8 * Math.PI) * (bounds.width * 0.05);
    const y = startY + Math.sin(t * 6 * Math.PI) * (bounds.height * 0.3) + Math.cos(t * 3 * Math.PI) * (bounds.height * 0.15);
    
    // Realistic force curve
    const force = 0.2 + 0.6 * Math.sin(Math.PI * t) + (Math.sin(i * 3) * 0.08);

    points.push({
      x,
      y,
      force: Math.min(1.0, Math.max(0.15, force)),
      radiusX: 3,
      radiusY: 3
    });
  }

  return points;
}
