/**
 * Guide Subagent Worker [GUIA]
 * Handles bilingual guide shift scheduling, preparation allowance, tiered meal subsidies, and language matching.
 */

export interface GuidePayRequest {
  hours: number;
  hourlyRate?: number; // default: 15,500 COP
  includePrepAllowance?: boolean;
  prepAllowanceCOP?: number; // default: 20,000 COP
  nightShiftHours?: number; // e.g. after 21:00 or before 06:00
}

export interface GuidePayResult {
  hours: number;
  hourlyRate: number;
  basePayCOP: number;
  mealSubsidyCOP: number;
  prepAllowanceCOP: number;
  nightSurchargeCOP: number;
  totalPayCOP: number;
  mealTier: string;
}

export interface LanguageMatchRequest {
  patientLanguages: string[];
  patientNationality?: string;
  requiredSkills?: string[];
}

export interface GuideProfile {
  id: string;
  name: string;
  languages: string[];
  hourlyRateCOP: number;
  rating: number;
  specialty?: string;
}

const AVAILABLE_GUIDES: GuideProfile[] = [
  {
    id: 'GUIA-001-VALENTINA',
    name: 'Valentina Restrepo',
    languages: ['EN', 'ES'],
    hourlyRateCOP: 15500,
    rating: 4.95,
    specialty: 'Cirugía Plástica & Oftalmología',
  },
  {
    id: 'GUIA-002-MATEO',
    name: 'Mateo Gómez',
    languages: ['EN', 'ES', 'PT'],
    hourlyRateCOP: 15500,
    rating: 4.9,
    specialty: 'Cardiología & Odontología',
  },
  {
    id: 'GUIA-003-CAMILA',
    name: 'Camila Jaramillo',
    languages: ['EN', 'ES', 'FR'],
    hourlyRateCOP: 16500,
    rating: 5.0,
    specialty: 'Bariátrica & Recuperación',
  },
];

/**
 * Calculates guide payment with tiered meal subsidies ($8k, $25k, $35k, $45k) and preparation allowance.
 */
export function calculateGuidePay(request: GuidePayRequest | number): GuidePayResult {
  const req: GuidePayRequest = typeof request === 'number' ? { hours: request } : request;

  const hours = Math.max(0, req.hours || 0);
  const hourlyRate = req.hourlyRate || 15500;
  const basePayCOP = Math.round(hours * hourlyRate);

  // Tiered meal subsidy calculation
  let mealSubsidyCOP = 0;
  let mealTier = 'NONE';

  if (hours >= 12) {
    mealSubsidyCOP = 45000;
    mealTier = 'EXTENDED_FULL_DAY (>=12h)';
  } else if (hours >= 8) {
    mealSubsidyCOP = 35000;
    mealTier = 'FULL_DAY (>=8h)';
  } else if (hours >= 5) {
    mealSubsidyCOP = 25000;
    mealTier = 'HALF_DAY (>=5h)';
  } else if (hours >= 3) {
    mealSubsidyCOP = 8000;
    mealTier = 'SNACK_TIER (>=3h)';
  } else {
    mealSubsidyCOP = 0;
    mealTier = 'NONE (<3h)';
  }

  // Preparation allowance
  let prepAllowanceCOP = 0;
  if (req.includePrepAllowance) {
    prepAllowanceCOP = req.prepAllowanceCOP ?? 20000;
  }

  // Night surcharge (20% for hours between 21:00 and 06:00)
  const nightHours = Math.max(0, req.nightShiftHours || 0);
  const nightSurchargeCOP = Math.round(nightHours * hourlyRate * 0.2);

  const totalPayCOP = basePayCOP + mealSubsidyCOP + prepAllowanceCOP + nightSurchargeCOP;

  return {
    hours,
    hourlyRate,
    basePayCOP,
    mealSubsidyCOP,
    prepAllowanceCOP,
    nightSurchargeCOP,
    totalPayCOP,
    mealTier,
  };
}

/**
 * Matches available guides to patient requirements and language needs.
 * Prioritizes guides matching the highest number of requested languages, then by rating.
 */
export function matchGuide(request: LanguageMatchRequest): GuideProfile[] {
  const reqLangs = (request.patientLanguages || ['EN']).map((l) => l.trim().toUpperCase());

  return AVAILABLE_GUIDES
    .map((guide) => {
      const matchCount = reqLangs.filter((lang) => guide.languages.includes(lang)).length;
      return { guide, matchCount };
    })
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => {
      if (b.matchCount !== a.matchCount) {
        return b.matchCount - a.matchCount;
      }
      return b.guide.rating - a.guide.rating;
    })
    .map(({ guide }) => guide);
}

/**
 * Validates a guide shift schedule for 15-minute slot snapping and duration.
 */
export function scheduleShift(startIso: string, endIso: string): {
  valid: boolean;
  durationHours: number;
  durationMinutes: number;
  aligned15Min: boolean;
} {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

  const aligned15Min =
    start.getMinutes() % 15 === 0 &&
    end.getMinutes() % 15 === 0 &&
    diffMinutes % 15 === 0;

  return {
    valid: diffMinutes > 0,
    durationHours: Math.round((diffMinutes / 60) * 100) / 100,
    durationMinutes: diffMinutes,
    aligned15Min,
  };
}

/**
 * Guide Subagent Request Dispatcher
 */
export function processGuideAction(action: string, payload: any): any {
  switch (action) {
    case 'CALCULATE_GUIDE_PAY':
    case 'SUBMIT_HOURS':
      return calculateGuidePay(payload);

    case 'MATCH_LANGUAGE':
    case 'FIND_GUIDE':
      return matchGuide(payload);

    case 'SCHEDULE_SHIFT':
      return scheduleShift(payload.start, payload.end);

    default:
      throw new Error(`[GuideWorker]: Unknown action '${action}'`);
  }
}

// Web Worker message event listener
if (
  typeof self !== 'undefined' &&
  typeof (self as any).addEventListener === 'function' &&
  typeof (self as any).postMessage === 'function'
) {
  (self as any).addEventListener('message', (event: MessageEvent) => {
    const { id, action, payload } = event.data || {};
    try {
      const result = processGuideAction(action, payload);
      (self as any).postMessage({ id, success: true, result });
    } catch (err: any) {
      (self as any).postMessage({ id, success: false, error: err.message });
    }
  });
}
