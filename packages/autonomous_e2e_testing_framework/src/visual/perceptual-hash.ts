/**
 * 64-bit 2D-DCT Perceptual Hashing (pHash) & Difference Hashing (dHash)
 * 
 * Provides robust perceptual image fingerprinting resilient to minor scaling,
 * JPEG compression artifacts, and antialiasing differences.
 */

import { RawImage, toGrayscaleMatrix } from './ssim-engine.js';

/**
 * Resamples a grayscale image to target dimensions (targetW x targetH) using bilinear interpolation
 */
export function resampleGrayscale(
  gray: Float64Array,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number
): Float64Array {
  const result = new Float64Array(targetW * targetH);
  const xRatio = (srcW - 1) / targetW;
  const yRatio = (srcH - 1) / targetH;

  for (let y = 0; y < targetH; y++) {
    const srcY = y * yRatio;
    const yFloor = Math.floor(srcY);
    const yCeil = Math.min(srcH - 1, yFloor + 1);
    const yWeight = srcY - yFloor;

    const rowOffset = y * targetW;
    const srcRowFloor = yFloor * srcW;
    const srcRowCeil = yCeil * srcW;

    for (let x = 0; x < targetW; x++) {
      const srcX = x * xRatio;
      const xFloor = Math.floor(srcX);
      const xCeil = Math.min(srcW - 1, xFloor + 1);
      const xWeight = srcX - xFloor;

      const p00 = gray[srcRowFloor + xFloor];
      const p10 = gray[srcRowFloor + xCeil];
      const p01 = gray[srcRowCeil + xFloor];
      const p11 = gray[srcRowCeil + xCeil];

      const top = p00 * (1 - xWeight) + p10 * xWeight;
      const bottom = p01 * (1 - xWeight) + p11 * xWeight;
      result[rowOffset + x] = top * (1 - yWeight) + bottom * yWeight;
    }
  }

  return result;
}

/**
 * Precomputes 1D DCT-II cosine basis coefficients for size N
 */
function createDCTMatrix(N: number): Float64Array {
  const matrix = new Float64Array(N * N);
  const c0 = 1.0 / Math.sqrt(N);
  const c1 = Math.sqrt(2.0 / N);

  for (let u = 0; u < N; u++) {
    const alpha = u === 0 ? c0 : c1;
    for (let x = 0; x < N; x++) {
      matrix[u * N + x] = alpha * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N));
    }
  }

  return matrix;
}

const DCT_32_MATRIX = createDCTMatrix(32);

/**
 * Computes 2D Discrete Cosine Transform (DCT-II) of a 32x32 matrix
 */
export function compute2DDCT32(matrix32: Float64Array): Float64Array {
  const N = 32;
  const temp = new Float64Array(N * N);
  const output = new Float64Array(N * N);

  // Row transform: temp = DCT * matrix
  for (let u = 0; u < N; u++) {
    for (let y = 0; y < N; y++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        sum += DCT_32_MATRIX[u * N + x] * matrix32[y * N + x];
      }
      temp[u * N + y] = sum;
    }
  }

  // Column transform: output = temp * DCT^T
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let y = 0; y < N; y++) {
        sum += DCT_32_MATRIX[v * N + y] * temp[u * N + y];
      }
      output[u * N + v] = sum;
    }
  }

  return output;
}

/**
 * Computes 64-bit DCT-based Perceptual Hash (pHash)
 * Returns a 16-character hexadecimal string.
 */
export function computePHash(image: RawImage): string {
  const gray = toGrayscaleMatrix(image);
  const resized = resampleGrayscale(gray, image.width, image.height, 32, 32);
  const dct = compute2DDCT32(resized);

  // Extract top-left 8x8 low-frequency matrix (64 values)
  const lowFreq = new Float64Array(64);
  for (let v = 0; v < 8; v++) {
    for (let u = 0; u < 8; u++) {
      lowFreq[v * 8 + u] = dct[v * 32 + u];
    }
  }

  // Compute median of 64 coefficients (excluding DC term lowFreq[0])
  const sorted = Array.from(lowFreq.slice(1)).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Generate 64-bit binary hash
  let hashBits = '';
  for (let i = 0; i < 64; i++) {
    hashBits += lowFreq[i] > median ? '1' : '0';
  }

  // Convert binary string to 16-hex characters
  return binaryStringToHex(hashBits);
}

/**
 * Computes 64-bit Difference Hash (dHash)
 * Returns a 16-character hexadecimal string.
 */
export function computeDHash(image: RawImage): string {
  const gray = toGrayscaleMatrix(image);
  // Resample to 9 columns x 8 rows
  const resized = resampleGrayscale(gray, image.width, image.height, 9, 8);

  let hashBits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = resized[y * 9 + x];
      const right = resized[y * 9 + (x + 1)];
      hashBits += left > right ? '1' : '0';
    }
  }

  return binaryStringToHex(hashBits);
}

/**
 * Converts 64-character '0'/'1' binary string to 16-char hex string
 */
function binaryStringToHex(binary: string): string {
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    const chunk = binary.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex.padStart(16, '0');
}

/**
 * Converts 16-char hex string back to 64-character binary string
 */
function hexToBinaryString(hex: string): string {
  let binary = '';
  for (let i = 0; i < hex.length; i++) {
    binary += parseInt(hex[i], 16).toString(2).padStart(4, '0');
  }
  return binary.padStart(64, '0');
}

/**
 * Computes the Hamming Distance between two 64-bit hex perceptual hashes
 */
export function computeHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== 16 || hash2.length !== 16) {
    // If unequal length, compare bit-by-bit
    const bin1 = hexToBinaryString(hash1);
    const bin2 = hexToBinaryString(hash2);
    let dist = 0;
    const len = Math.max(bin1.length, bin2.length);
    for (let i = 0; i < len; i++) {
      if ((bin1[i] || '0') !== (bin2[i] || '0')) dist++;
    }
    return dist;
  }

  // Fast 64-bit BigInt XOR popcount
  const b1 = BigInt(`0x${hash1}`);
  const b2 = BigInt(`0x${hash2}`);
  let xor = b1 ^ b2;
  let count = 0;

  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }

  return count;
}

/**
 * Compares two images using perceptual hashing (pHash or dHash)
 */
export function comparePerceptual(
  imageA: RawImage,
  imageB: RawImage,
  options: {
    algorithm?: 'pHash' | 'dHash';
    maxHammingDistance?: number;
  } = {}
): {
  algorithm: 'pHash' | 'dHash';
  hashA: string;
  hashB: string;
  hammingDistance: number;
  match: boolean;
} {
  const algorithm = options.algorithm ?? 'pHash';
  const threshold = options.maxHammingDistance ?? 5; // standard threshold <= 5 means visual match

  const hashA = algorithm === 'pHash' ? computePHash(imageA) : computeDHash(imageA);
  const hashB = algorithm === 'pHash' ? computePHash(imageB) : computeDHash(imageB);
  const hammingDistance = computeHammingDistance(hashA, hashB);

  return {
    algorithm,
    hashA,
    hashB,
    hammingDistance,
    match: hammingDistance <= threshold
  };
}
