/**
 * Structural Similarity Index (SSIM) Engine with Dynamic ROI Masking
 * 
 * Computes exact Structural Similarity Index between baseline and actual screenshots,
 * with dynamic rectangular Region of Interest (ROI) exclusion for volatile animated spinners,
 * ISO timestamps, and dynamic session counters.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RawImage {
  width: number;
  height: number;
  /** RGBA or Grayscale pixel buffer (length = width * height * 4 for RGBA, or width * height for Grayscale) */
  data: Uint8Array | Buffer;
  channels?: 1 | 3 | 4;
}

export interface SSIMOptions {
  windowSize?: number;       // default 8
  k1?: number;               // default 0.01
  k2?: number;               // default 0.03
  bitDepth?: number;          // default 8 (L = 255)
  threshold?: number;        // default 0.95 (passed if ssim >= threshold)
  maskRegions?: Rect[];      // Rectangles to mask out (ignore) from comparison
  pixelDiffTolerance?: number; // per-pixel tolerance in [0, 255], default 10
}

export interface SSIMResult {
  ssim: number;              // Mean SSIM score in [0.0, 1.0]
  passed: boolean;           // true if ssim >= threshold
  diffPixels: number;        // Count of mismatched pixels outside mask
  totalEvaluatedPixels: number; // Pixels evaluated (excluding masked areas)
  totalMaskedPixels: number; // Pixels excluded by mask
  diffMap?: Uint8Array;      // Binary diff map (1 for diff, 0 for match/masked)
}

/**
 * Converts RGBA / RGB / Grayscale buffer to 2D Grayscale Float64Array
 */
export function toGrayscaleMatrix(image: RawImage): Float64Array {
  const { width, height, data } = image;
  const channels = image.channels ?? (data.length === width * height ? 1 : 4);
  const grayscale = new Float64Array(width * height);

  if (channels === 1) {
    for (let i = 0; i < width * height; i++) {
      grayscale[i] = data[i];
    }
  } else if (channels === 4) {
    // RGBA: Y = 0.299 R + 0.587 G + 0.114 B
    for (let i = 0; i < width * height; i++) {
      const offset = i * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  } else if (channels === 3) {
    // RGB
    for (let i = 0; i < width * height; i++) {
      const offset = i * 3;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }

  return grayscale;
}

/**
 * Generates a binary mask matrix where 1 = evaluate, 0 = masked/excluded
 */
export function generateEvaluationMask(width: number, height: number, maskRegions?: Rect[]): Uint8Array {
  const mask = new Uint8Array(width * height);
  mask.fill(1); // Default evaluate everything

  if (!maskRegions || maskRegions.length === 0) {
    return mask;
  }

  for (const rect of maskRegions) {
    const startX = Math.max(0, Math.floor(rect.x));
    const startY = Math.max(0, Math.floor(rect.y));
    const endX = Math.min(width, Math.ceil(rect.x + rect.width));
    const endY = Math.min(height, Math.ceil(rect.y + rect.height));

    for (let y = startY; y < endY; y++) {
      const rowOffset = y * width;
      for (let x = startX; x < endX; x++) {
        mask[rowOffset + x] = 0; // Exclude pixel
      }
    }
  }

  return mask;
}

/**
 * Computes Structural Similarity Index (SSIM) between two images
 * with support for dynamic ROI masking.
 */
export function computeSSIM(
  baseline: RawImage,
  actual: RawImage,
  options: SSIMOptions = {}
): SSIMResult {
  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    throw new Error(
      `Image dimension mismatch: baseline is ${baseline.width}x${baseline.height}, but actual is ${actual.width}x${actual.height}`
    );
  }

  const { width, height } = baseline;
  const K1 = options.k1 ?? 0.01;
  const K2 = options.k2 ?? 0.03;
  const L = (1 << (options.bitDepth ?? 8)) - 1; // 255 for 8-bit
  const C1 = (K1 * L) * (K1 * L);
  const C2 = (K2 * L) * (K2 * L);
  const windowSize = options.windowSize ?? 8;
  const threshold = options.threshold ?? 0.95;
  const tolerance = options.pixelDiffTolerance ?? 10;

  const gray1 = toGrayscaleMatrix(baseline);
  const gray2 = toGrayscaleMatrix(actual);
  const mask = generateEvaluationMask(width, height, options.maskRegions);

  const diffMap = new Uint8Array(width * height);
  let diffPixels = 0;
  let totalEvaluatedPixels = 0;
  let totalMaskedPixels = 0;

  // Count pixel-level differences and masked pixels
  for (let i = 0; i < width * height; i++) {
    if (mask[i] === 0) {
      totalMaskedPixels++;
      diffMap[i] = 0;
    } else {
      totalEvaluatedPixels++;
      const absDiff = Math.abs(gray1[i] - gray2[i]);
      if (absDiff > tolerance) {
        diffPixels++;
        diffMap[i] = 1;
      } else {
        diffMap[i] = 0;
      }
    }
  }

  if (totalEvaluatedPixels === 0) {
    return {
      ssim: 1.0,
      passed: true,
      diffPixels: 0,
      totalEvaluatedPixels: 0,
      totalMaskedPixels,
      diffMap
    };
  }

  // Block-based SSIM calculation over grid of size windowSize
  let ssimSum = 0;
  let blockCount = 0;

  const step = Math.max(1, Math.floor(windowSize / 2));

  for (let y = 0; y <= height - windowSize; y += step) {
    for (let x = 0; x <= width - windowSize; x += step) {
      // Check how many pixels in this window are active (not masked)
      let activeInWindow = 0;
      let sumX = 0;
      let sumY = 0;

      for (let wy = 0; wy < windowSize; wy++) {
        const row = (y + wy) * width;
        for (let wx = 0; wx < windowSize; wx++) {
          const idx = row + (x + wx);
          if (mask[idx] === 1) {
            activeInWindow++;
            sumX += gray1[idx];
            sumY += gray2[idx];
          }
        }
      }

      // If at least 50% of window is active, compute window SSIM
      const minActive = (windowSize * windowSize) * 0.4;
      if (activeInWindow >= minActive) {
        const muX = sumX / activeInWindow;
        const muY = sumY / activeInWindow;

        let varX = 0;
        let varY = 0;
        let covXY = 0;

        for (let wy = 0; wy < windowSize; wy++) {
          const row = (y + wy) * width;
          for (let wx = 0; wx < windowSize; wx++) {
            const idx = row + (x + wx);
            if (mask[idx] === 1) {
              const dX = gray1[idx] - muX;
              const dY = gray2[idx] - muY;
              varX += dX * dX;
              varY += dY * dY;
              covXY += dX * dY;
            }
          }
        }

        const sigmaX2 = varX / (activeInWindow - 1 || 1);
        const sigmaY2 = varY / (activeInWindow - 1 || 1);
        const sigmaXY = covXY / (activeInWindow - 1 || 1);

        // SSIM formula: ((2*muX*muY + C1) * (2*sigmaXY + C2)) / ((muX^2 + muY^2 + C1) * (sigmaX^2 + sigmaY^2 + C2))
        const num = (2 * muX * muY + C1) * (2 * sigmaXY + C2);
        const den = (muX * muX + muY * muY + C1) * (sigmaX2 + sigmaY2 + C2);
        const windowSSIM = den === 0 ? 1.0 : num / den;

        ssimSum += Math.max(0, Math.min(1.0, windowSSIM));
        blockCount++;
      }
    }
  }

  const meanSSIM = blockCount > 0 ? ssimSum / blockCount : 1.0;
  const passed = meanSSIM >= threshold;

  return {
    ssim: Number(meanSSIM.toFixed(6)),
    passed,
    diffPixels,
    totalEvaluatedPixels,
    totalMaskedPixels,
    diffMap
  };
}

/**
 * Utility helper to create a simple raw RGBA image for testing / synthetic baselines
 */
export function createRawImage(
  width: number,
  height: number,
  fillColor: { r: number; g: number; b: number; a?: number } = { r: 255, g: 255, b: 255, a: 255 }
): RawImage {
  const data = new Uint8Array(width * height * 4);
  const a = fillColor.a ?? 255;
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    data[offset] = fillColor.r;
    data[offset + 1] = fillColor.g;
    data[offset + 2] = fillColor.b;
    data[offset + 3] = a;
  }

  return { width, height, data, channels: 4 };
}

/**
 * Draws a filled rectangle on a RawImage (mutates data in place)
 */
export function drawRectOnImage(
  image: RawImage,
  rect: Rect,
  color: { r: number; g: number; b: number; a?: number }
): void {
  const startX = Math.max(0, Math.floor(rect.x));
  const startY = Math.max(0, Math.floor(rect.y));
  const endX = Math.min(image.width, Math.ceil(rect.x + rect.width));
  const endY = Math.min(image.height, Math.ceil(rect.y + rect.height));
  const a = color.a ?? 255;

  for (let y = startY; y < endY; y++) {
    const rowOffset = y * image.width * 4;
    for (let x = startX; x < endX; x++) {
      const idx = rowOffset + x * 4;
      image.data[idx] = color.r;
      image.data[idx + 1] = color.g;
      image.data[idx + 2] = color.b;
      image.data[idx + 3] = a;
    }
  }
}
