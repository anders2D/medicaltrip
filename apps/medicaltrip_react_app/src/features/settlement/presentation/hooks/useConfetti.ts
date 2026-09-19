/**
 * Medical Trip Colombia S.A.S. - useConfetti Hook
 * Celebratory micro-interactions for financial settlement zeroing, patient sign-off, and audit seals.
 * Fully compatible with React 19, Vite, SSR/headless test environments, and mobile touch devices.
 */

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  ticks?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  shapes?: ('square' | 'circle' | 'star')[];
  scalar?: number;
  zIndex?: number;
  disableForReducedMotion?: boolean;
}

// Medical Trip Brand Palette for celebration bursts
export const MEDICAL_TRIP_CONFETTI_COLORS = [
  '#0284C7', // Sky Blue (Transfers & Flights)
  '#4F46E5', // Indigo (Clinical & Consultations)
  '#10B981', // Emerald (Pharmacy & Settled Balances)
  '#F59E0B', // Amber (Advances & Logistics)
  '#6366F1', // Violet (Bilingual Guides & Staff)
];

/**
 * Safe wrapper to invoke canvas-confetti without throwing in mock / headless / test environments
 */
export function fireConfettiSafely(options: ConfettiOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const mergedOptions: confetti.Options = {
        particleCount: options.particleCount ?? 80,
        spread: options.spread ?? 70,
        origin: options.origin ?? { y: 0.6 },
        colors: options.colors ?? MEDICAL_TRIP_CONFETTI_COLORS,
        disableForReducedMotion: options.disableForReducedMotion ?? true,
        zIndex: options.zIndex ?? 9999,
        ...(options.startVelocity !== undefined && { startVelocity: options.startVelocity }),
        ...(options.decay !== undefined && { decay: options.decay }),
        ...(options.ticks !== undefined && { ticks: options.ticks }),
        ...(options.scalar !== undefined && { scalar: options.scalar }),
        ...(options.shapes !== undefined && { shapes: options.shapes as any }),
      };

      const result = confetti(mergedOptions);
      if (result && typeof (result as any).then === 'function') {
        (result as unknown as Promise<unknown>).then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    } catch {
      // Graceful fallback for environments where HTMLCanvasElement is mocked or unsupported
      resolve();
    }
  });
}

/**
 * Trigger a celebratory dual-cannon confetti blast (for Settlement Zero or Final Case Closure)
 */
export function fireSettlementZeroBlast(): void {
  try {
    // Left Cannon
    fireConfettiSafely({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.1, y: 0.75 },
      colors: ['#10B981', '#0284C7', '#4F46E5'],
    });
    // Right Cannon
    fireConfettiSafely({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.9, y: 0.75 },
      colors: ['#10B981', '#F59E0B', '#6366F1'],
    });
  } catch {
    // Fallback safe
  }
}

/**
 * Trigger a high-energy center burst for Patient Digital Sign-Off seal
 */
export function fireSignatureSealBurst(): void {
  try {
    fireConfettiSafely({
      particleCount: 100,
      spread: 80,
      origin: { x: 0.5, y: 0.6 },
      colors: MEDICAL_TRIP_CONFETTI_COLORS,
    });
  } catch {
    // Fallback safe
  }
}

/**
 * React hook providing convenient celebration triggers for settlement and sign-off workflows
 */
export function useConfetti() {
  const triggerConfetti = useCallback((options?: ConfettiOptions) => {
    return fireConfettiSafely(options);
  }, []);

  const triggerSettlementZero = useCallback(() => {
    fireSettlementZeroBlast();
  }, []);

  const triggerSignatureSeal = useCallback(() => {
    fireSignatureSealBurst();
  }, []);

  return {
    triggerConfetti,
    triggerSettlementZero,
    triggerSignatureSeal,
    colors: MEDICAL_TRIP_CONFETTI_COLORS,
  };
}

export default useConfetti;
