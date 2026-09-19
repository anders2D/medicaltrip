/**
 * Medical Trip Colombia S.A.S. - Nurse Actor [NURSE]
 * Asynchronous Web Worker Actor for 8-hour fasting window calculations,
 * at-home laboratory scheduling ($65k COP service fee), and pre-op clinical risk checklists.
 */

import { ActorMessage } from '../domain/IActorEventBusPort';

export interface FastingWindowRequest {
  labAppointmentIso: string; // ISO date string e.g. "2026-08-19T07:30:00.000Z"
  testTypes?: string[]; // e.g. ["GLICEMIA", "PERFIL_LIPIDICO", "PT_INR"]
}

export interface FastingCheckpoint {
  id: string;
  timestampIso: string;
  hoursPrior: number;
  label: string;
  instruction: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface FastingWindowResult {
  labAppointmentIso: string;
  fastingHoursRequired: number;
  fastingStartIso: string;
  waterCutoffIso: string;
  checkpoints: FastingCheckpoint[];
  isMorningAppointment: boolean;
}

export interface HomeSampleRequest {
  patientId: string;
  patientName: string;
  hotelName: string;
  roomNumber?: string;
  requestedDateIso: string;
  tests: string[];
  requiresColdChain?: boolean;
}

export interface HomeSampleResult {
  scheduleId: string;
  patientId: string;
  assignedNurse: string;
  nursePhone: string;
  samplingDateIso: string;
  hotelLocation: string;
  serviceFeeCOP: number;
  coldChainRequired: boolean;
  preparationNotes: string;
}

export interface PreOpChecklistRequest {
  patientId: string;
  surgeryDateIso: string;
  takesAnticoagulants: boolean;
  anticoagulantName?: string;
  hoursSinceAnticoagulantSuspension?: number;
  takesAspirin: boolean;
  daysSinceAspirinSuspension?: number;
  fastingHoursElapsed?: number;
  hasCardiacClearance?: boolean;
}

export interface PreOpChecklistResult {
  status: 'CLEARED_FOR_PROCEDURE' | 'REQUIRES_MEDICAL_REVIEW' | 'BLOCKED_CLINICAL_RISK';
  warnings: string[];
  checklistItems: Array<{ key: string; label: string; passed: boolean; message: string }>;
  clearanceTimestamp: number;
}

export type NursePayload =
  | { action: 'CALCULATE_FASTING_WINDOW'; data: FastingWindowRequest }
  | { action: 'SCHEDULE_HOME_SAMPLE'; data: HomeSampleRequest }
  | { action: 'VALIDATE_PREOP_CHECKLIST'; data: PreOpChecklistRequest };

export type NurseResult =
  | { action: 'CALCULATE_FASTING_WINDOW'; success: boolean; result?: FastingWindowResult; error?: string }
  | { action: 'SCHEDULE_HOME_SAMPLE'; success: boolean; result?: HomeSampleResult; error?: string }
  | { action: 'VALIDATE_PREOP_CHECKLIST'; success: boolean; result?: PreOpChecklistResult; error?: string };

/**
 * Calculates strict 8-hour fasting window and 2-hour water cutoff for lab appointments.
 */
export function computeFastingWindow(req: FastingWindowRequest): FastingWindowResult {
  const labDate = new Date(req.labAppointmentIso);
  if (isNaN(labDate.getTime())) {
    throw new Error(`Invalid lab appointment ISO timestamp: ${req.labAppointmentIso}`);
  }

  const labMs = labDate.getTime();
  const fastingStartMs = labMs - 8 * 60 * 60 * 1000;
  const waterCutoffMs = labMs - 2 * 60 * 60 * 1000;
  const dinnerReminderMs = labMs - 12 * 60 * 60 * 1000;
  const nurseDispatchMs = labMs - 1 * 60 * 60 * 1000;

  const checkpoints: FastingCheckpoint[] = [
    {
      id: 'CHK_12H_DINNER',
      timestampIso: new Date(dinnerReminderMs).toISOString(),
      hoursPrior: 12,
      label: 'Cena Liviana Pre-Laboratorio',
      instruction: 'Cena recomendada sin grasas, lácteos ni azúcares procesados.',
      severity: 'INFO',
    },
    {
      id: 'CHK_8H_FASTING_START',
      timestampIso: new Date(fastingStartMs).toISOString(),
      hoursPrior: 8,
      label: 'Inicio de Ayuno Estricto (8h)',
      instruction: 'Cero ingesta de alimentos sólidos o jugos calóricos.',
      severity: 'WARNING',
    },
    {
      id: 'CHK_2H_WATER_CUTOFF',
      timestampIso: new Date(waterCutoffMs).toISOString(),
      hoursPrior: 2,
      label: 'Corte Absoluto de Líquidos (2h)',
      instruction: 'Suspensión absoluta de ingesta de agua para evitar hemodilución.',
      severity: 'CRITICAL',
    },
    {
      id: 'CHK_1H_NURSE_DISPATCH',
      timestampIso: new Date(nurseDispatchMs).toISOString(),
      hoursPrior: 1,
      label: 'Enfermera en Desplazamiento',
      instruction: 'Equipo de flebotomía en ruta hacia el hotel con kit de muestras y cadena de frío.',
      severity: 'INFO',
    },
  ];

  const appointmentHour = labDate.getHours();
  const isMorningAppointment = appointmentHour >= 5 && appointmentHour <= 11;

  return {
    labAppointmentIso: req.labAppointmentIso,
    fastingHoursRequired: 8,
    fastingStartIso: new Date(fastingStartMs).toISOString(),
    waterCutoffIso: new Date(waterCutoffMs).toISOString(),
    checkpoints,
    isMorningAppointment,
  };
}

/**
 * Schedules an at-home laboratory sample collection in hotel room.
 */
export function scheduleHomeSample(req: HomeSampleRequest): HomeSampleResult {
  const scheduleId = `DOM_LAB_${Date.now().toString(36).toUpperCase()}`;
  const assignedNurse = 'Emi Echavarría (Jefe de Enfermería Domiciliaria)';
  const nursePhone = '+57 314 892 4410';
  const serviceFeeCOP = 65_000; // Fixed home sampling fee
  const coldChainRequired = req.requiresColdChain !== undefined ? req.requiresColdChain : true;

  const roomText = req.roomNumber ? ` - Habitación ${req.roomNumber}` : '';
  const hotelLocation = `${req.hotelName}${roomText}`;

  return {
    scheduleId,
    patientId: req.patientId,
    assignedNurse,
    nursePhone,
    samplingDateIso: req.requestedDateIso,
    hotelLocation,
    serviceFeeCOP,
    coldChainRequired,
    preparationNotes: `Toma de muestras en habitación (${req.tests.join(', ')}). Llevar kit estéril y hielera portátil.`,
  };
}

/**
 * Validates clinical pre-op suspension guidelines and flags high-risk alerts.
 */
export function validatePreOpChecklist(req: PreOpChecklistRequest): PreOpChecklistResult {
  const warnings: string[] = [];
  const checklistItems: Array<{ key: string; label: string; passed: boolean; message: string }> = [];

  // 1. Anticoagulants suspension (minimum 72 hours)
  if (req.takesAnticoagulants) {
    const hours = req.hoursSinceAnticoagulantSuspension || 0;
    if (hours < 72) {
      warnings.push(`ALERTA HEMORRÁGICA: Anticoagulante (${req.anticoagulantName || 'No especificado'}) requiere mínimo 72h de suspensión previa (registradas: ${hours}h).`);
      checklistItems.push({
        key: 'ANTICOAGULANTS',
        label: 'Suspensión de Anticoagulantes (>= 72h)',
        passed: false,
        message: `Faltan ${72 - hours} horas para cumplir margen de seguridad.`,
      });
    } else {
      checklistItems.push({
        key: 'ANTICOAGULANTS',
        label: 'Suspensión de Anticoagulantes (>= 72h)',
        passed: true,
        message: `Completadas ${hours}h de suspensión segura.`,
      });
    }
  } else {
    checklistItems.push({
      key: 'ANTICOAGULANTS',
      label: 'Suspensión de Anticoagulantes',
      passed: true,
      message: 'Paciente no consume anticoagulantes orales.',
    });
  }

  // 2. Aspirin / Anti-aggregants (minimum 7 days)
  if (req.takesAspirin) {
    const days = req.daysSinceAspirinSuspension || 0;
    if (days < 7) {
      warnings.push(`ALERTA PLAQUETARIA: Ácido Acetilsalicílico requiere mínimo 7 días de suspensión previa (registrados: ${days} días).`);
      checklistItems.push({
        key: 'ASPIRIN',
        label: 'Suspensión de Aspirina (>= 7 días)',
        passed: false,
        message: `Faltan ${7 - days} días para restaurar función plaquetaria normal.`,
      });
    } else {
      checklistItems.push({
        key: 'ASPIRIN',
        label: 'Suspensión de Aspirina (>= 7 días)',
        passed: true,
        message: `Completados ${days} días de suspensión segura.`,
      });
    }
  } else {
    checklistItems.push({
      key: 'ASPIRIN',
      label: 'Suspensión de Aspirina',
      passed: true,
      message: 'Paciente no consume aspirina ni antiagregantes.',
    });
  }

  // 3. Fasting compliance (>= 8 hours)
  if (req.fastingHoursElapsed !== undefined) {
    if (req.fastingHoursElapsed < 8) {
      warnings.push(`ALERTA ANESTÉSICA: Ayuno gástrico insuficiente (${req.fastingHoursElapsed}h registradas, mínimo 8h). Riesgo de broncoaspiración.`);
      checklistItems.push({
        key: 'FASTING',
        label: 'Ayuno Gástrico Estricto (>= 8h)',
        passed: false,
        message: `Se requieren ${8 - req.fastingHoursElapsed}h adicionales de ayuno.`,
      });
    } else {
      checklistItems.push({
        key: 'FASTING',
        label: 'Ayuno Gástrico Estricto (>= 8h)',
        passed: true,
        message: `Ayuno de ${req.fastingHoursElapsed}h verificado y adecuado.`,
      });
    }
  }

  // 4. Cardiac clearance
  if (req.hasCardiacClearance !== undefined) {
    checklistItems.push({
      key: 'CARDIAC_CLEARANCE',
      label: 'Concepto Cardiológico y ECG',
      passed: req.hasCardiacClearance,
      message: req.hasCardiacClearance ? 'Aval cardiológico vigente.' : 'Falta concepto cardiológico aprobado.',
    });
    if (!req.hasCardiacClearance) {
      warnings.push('Pendiente aval cardiológico de riesgo quirúrgico (Goldman / ASA).');
    }
  }

  const hasCriticalWarnings = checklistItems.some((item) => !item.passed);
  const status: PreOpChecklistResult['status'] = hasCriticalWarnings
    ? warnings.some((w) => w.includes('ALERTA HEMORRÁGICA') || w.includes('ALERTA ANESTÉSICA'))
      ? 'BLOCKED_CLINICAL_RISK'
      : 'REQUIRES_MEDICAL_REVIEW'
    : 'CLEARED_FOR_PROCEDURE';

  return {
    status,
    warnings,
    checklistItems,
    clearanceTimestamp: Date.now(),
  };
}

/**
 * Message Handler for Nurse Actor.
 */
export function handleNurseMessage(message: ActorMessage<NursePayload>): ActorMessage<NurseResult> {
  if (!message || (message as any).type === 'CONNECT_CHANNEL') {
    return {
      id: message?.id || 'SYS_INIT',
      sender: 'NURSE_ACTOR',
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
      sender: 'NURSE_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'NURSE_ERROR',
      payload: { action: 'UNKNOWN' as any, success: false, error: 'Invalid payload' },
      timestamp: Date.now(),
    };
  }

  try {
    switch (payload.action) {
      case 'CALCULATE_FASTING_WINDOW': {
        const result = computeFastingWindow(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'NURSE_ACTOR',
          recipient: message.sender,
          type: 'FASTING_WINDOW_CALCULATED',
          payload: { action: 'CALCULATE_FASTING_WINDOW', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'SCHEDULE_HOME_SAMPLE': {
        const result = scheduleHomeSample(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'NURSE_ACTOR',
          recipient: message.sender,
          type: 'HOME_SAMPLE_SCHEDULED',
          payload: { action: 'SCHEDULE_HOME_SAMPLE', success: true, result },
          timestamp: Date.now(),
        };
      }

      case 'VALIDATE_PREOP_CHECKLIST': {
        const result = validatePreOpChecklist(payload.data);
        return {
          id: `RESP_${message.id}`,
          sender: 'NURSE_ACTOR',
          recipient: message.sender,
          type: 'PREOP_CHECKLIST_VALIDATED',
          payload: { action: 'VALIDATE_PREOP_CHECKLIST', success: true, result },
          timestamp: Date.now(),
        };
      }

      default:
        throw new Error(`Unknown Nurse action: ${(payload as any).action}`);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Nurse calculation error';
    return {
      id: `RESP_${message.id || 'UNKNOWN'}`,
      sender: 'NURSE_ACTOR',
      recipient: message.sender || 'MAIN_UI',
      type: 'NURSE_ERROR',
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
  self.onmessage = (event: MessageEvent<ActorMessage<NursePayload>>) => {
    const response = handleNurseMessage(event.data);
    if (response) {
      (self as any).postMessage(response);
    }
  };
}
