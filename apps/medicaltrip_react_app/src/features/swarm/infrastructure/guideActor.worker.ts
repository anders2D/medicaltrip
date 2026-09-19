/**
 * Medical Trip Colombia S.A.S. - Guide Actor [GUIA]
 * Asynchronous Web Worker Actor for bilingual guide fee computations,
 * preparation allowance, tiered meal subsidies ($8k-$45k), and language matching.
 */

import { ActorMessage } from '../domain/IActorEventBusPort';

export interface GuideHoursFeeRequest {
  hours: number;
  baseHourlyRateCOP?: number; // Defaults to 15500
  includePrepAllowance?: boolean;
  prepAllowanceCOP?: number; // Defaults to 15500
}

export interface GuideHoursFeeResult {
  hours: number;
  hourlyRateCOP: number;
  baseFeeCOP: number;
  prepAllowanceCOP: number;
  mealSubsidyCOP: number;
  mealSubsidyTier: string;
  totalGuideFeeCOP: number;
}

export interface LanguageMatchingRequest {
  patientLanguages: string[]; // e.g. ['PAP', 'NL', 'EN', 'PT', 'FR', 'DE']
  preferredGender?: 'ANY' | 'MALE' | 'FEMALE';
}

export interface GuideProfile {
  id: string;
  name: string;
  languages: string[];
  hourlyRateCOP: number;
  rating: number;
  isAvailable: boolean;
}

export interface LanguageMatchingResult {
  requestedLanguages: string[];
  matchedGuides: Array<GuideProfile & { matchScore: number; matchedLanguages: string[] }>;
  recommendedGuide: GuideProfile | null;
}

export type GuidePayload =
  | { action: 'CALCULATE_HOURS_FEE'; data: GuideHoursFeeRequest }
  | { action: 'CALCULATE_MEAL_SUBSIDY'; data: { hours: number } }
  | { action: 'MATCH_LANGUAGE'; data: LanguageMatchingRequest };

export type GuideResult =
  | { action: 'CALCULATE_HOURS_FEE'; success: boolean; result?: GuideHoursFeeResult; error?: string }
  | { action: 'CALCULATE_MEAL_SUBSIDY'; success: boolean; result?: { mealSubsidyCOP: number; tier: string }; error?: string }
  | { action: 'MATCH_LANGUAGE'; success: boolean; result?: LanguageMatchingResult; error?: string };

export const GUIDE_ROSTER: GuideProfile[] = [
  {
    id: 'GUIA-001',
    name: 'Andrés Cantero',
    languages: ['EN', 'NL', 'PAP', 'ES'],
    hourlyRateCOP: 15_500,
    rating: 4.95,
    isAvailable: true,
  },
  {
    id: 'GUIA-002',
    name: 'Carolina López',
    languages: ['EN', 'ES'],
    hourlyRateCOP: 15_500,
    rating: 4.90,
    isAvailable: true,
  },
  {
    id: 'GUIA-003',
    name: 'Valentina Gómez',
    languages: ['PT', 'FR', 'ES', 'EN'],
    hourlyRateCOP: 16_500,
    rating: 4.88,
    isAvailable: true,
  },
  {
    id: 'GUIA-004',
    name: 'Marcos Yepes',
    languages: ['EN', 'DE', 'ES'],
    hourlyRateCOP: 15_500,
    rating: 4.85,
    isAvailable: true,
  },
  {
    id: 'GUIA-005',
    name: 'Sofía Restrepo',
    languages: ['EN', 'PAP', 'ES'],
    hourlyRateCOP: 15_500,
    rating: 4.92,
    isAvailable: true,
  },
];

/**
 * Computes tiered meal subsidy according to shift duration:
 * - < 3h => $0 COP
 * - 3h <= t < 5h => $8.000 COP (Refrigerio / Snack)
 * - 5h <= t < 8h => $25.000 COP (Almuerzo estándar)
 * - 8h <= t < 12h => $35.000 COP (Día completo / Almuerzo + Refrigerio)
 * - >= 12h => $45.000 COP (Jornada extendida)
 */
export function computeMealSubsidy(hours: number): { mealSubsidyCOP: number; tier: string } {
  if (hours < 3) {
    return { mealSubsidyCOP: 0, tier: 'SIN_SUBSIDIO_MENOR_3H' };
  } else if (hours < 5) {
    return { mealSubsidyCOP: 8_000, tier: 'TIER_1_REFRIGERIO_8K' };
  } else if (hours < 8) {
    return { mealSubsidyCOP: 25_000, tier: 'TIER_2_ALMUERZO_25K' };
  } else if (hours < 12) {
    return { mealSubsidyCOP: 35_000, tier: 'TIER_3_COMPLETO_35K' };
  } else {
    return { mealSubsidyCOP: 45_000, tier: 'TIER_4_EXTENDIDO_45K' };
  }
}

/**
 * Computes full guide compensation for a given shift.
 */
export function computeGuideFee(req: GuideHoursFeeRequest): GuideHoursFeeResult {
  if (req.hours < 0) {
    throw new Error(`Guide shift hours cannot be negative. Received: ${req.hours}`);
  }

  const hourlyRateCOP = req.baseHourlyRateCOP !== undefined ? req.baseHourlyRateCOP : 15_500;
  const baseFeeCOP = Math.round(req.hours * hourlyRateCOP);

  const prepAllowanceCOP = req.includePrepAllowance
    ? req.prepAllowanceCOP !== undefined
      ? req.prepAllowanceCOP
      : 15_500
    : 0;

  const { mealSubsidyCOP, tier } = computeMealSubsidy(req.hours);
  const totalGuideFeeCOP = baseFeeCOP + prepAllowanceCOP + mealSubsidyCOP;

  return {
    hours: req.hours,
    hourlyRateCOP,
    baseFeeCOP,
    prepAllowanceCOP,
    mealSubsidyCOP,
    mealSubsidyTier: tier,
    totalGuideFeeCOP,
  };
}

/**
 * Matches requested languages to registered bilingual guides.
 */
export function matchLanguages(req: LanguageMatchingRequest): LanguageMatchingResult {
  const normReqs = req.patientLanguages.map((l) => l.toUpperCase().trim());

  const scoredGuides = GUIDE_ROSTER.map((guide) => {
    const matched = guide.languages.filter((gl) => normReqs.includes(gl));
    const matchScore = matched.length / Math.max(1, normReqs.length);
    return {
      ...guide,
      matchScore,
      matchedLanguages: matched,
    };
  })
    .filter((g) => g.matchedLanguages.length > 0)
    .sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);

  return {
    requestedLanguages: normReqs,
    matchedGuides: scoredGuides,
    recommendedGuide: scoredGuides.length > 0 ? scoredGuides[0] : null,
  };
}

/**
 * Message Handler for Guide Actor.
 */
export function handleGuideMessage(message: ActorMessage<GuidePayload>): ActorMessage<GuideResult> {
  if (!message || (message as any).type === 'CONNECT_CHANNEL') {
    return {
      id: message?.id || 'SYS_INIT',
      sender: 'GUIA_ACTOR',
      recipient: message?.sender || 'MAIN_UI',
      type: 'CHANNEL_CONNECTED',
      payload: { action: 'CONNECT_CHANNEL' as any, success: true, result: null as any },
      timestamp: Date.now(),
    };
  }

  const payload = message.payload;
  if (!payload || !payload.action) {
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'GUIA_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'GUIDE_ERROR',
      payload: { action: 'UNKNOWN' as any, success: false, error: 'Invalid payload' },
      timestamp: Date.now(),
    };
  }

  try {
    switch (payload.action) {
      case 'CALCULATE_HOURS_FEE': {
        const result = computeGuideFee(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'GUIA_ACTOR',
          recipient: message.sender,
          type: 'GUIDE_FEE_CALCULATED',
          payload: { action: 'CALCULATE_HOURS_FEE', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'CALCULATE_MEAL_SUBSIDY': {
        const result = computeMealSubsidy(payload.data.hours);
        return {
          id: `RESP_${message.id}`,
          sender: 'GUIA_ACTOR',
          recipient: message.sender,
          type: 'MEAL_SUBSIDY_CALCULATED',
          payload: { action: 'CALCULATE_MEAL_SUBSIDY', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'MATCH_LANGUAGE': {
        const result = matchLanguages(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'GUIA_ACTOR',
          recipient: message.sender,
          type: 'LANGUAGE_MATCHED',
          payload: { action: 'MATCH_LANGUAGE', success: true, result },
          timestamp: Date.now(),
        };
      }

      default:
        throw new Error(`Unknown Guide action: ${(payload as any).action}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Guide calculation error';
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'GUIA_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'GUIDE_ERROR',
      payload: { action: payload?.action || 'UNKNOWN' as any, success: false, error: errorMsg },
      timestamp: Date.now(),
    };
  }
}

// Web Worker Event Listener Attachment
if (
  typeof self !== 'undefined' &&
  typeof (self as any).postMessage === 'function' &&
  typeof window === 'undefined'
) {
  self.onmessage = (event: MessageEvent<ActorMessage<GuidePayload>>) => {
    const response = handleGuideMessage(event.data);
    if (response) {
      (self as any).postMessage(response);
    }
  };
}
