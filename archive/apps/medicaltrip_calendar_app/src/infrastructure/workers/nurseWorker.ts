/**
 * Nurse Subagent Worker [NURSE]
 * Handles medical preparation alerts, fasting lab countdowns, at-home sampling, recovery checks, and clinical protocol coordination.
 */

export interface FastingCalculationRequest {
  scheduledLabTime: string | Date; // ISO string or Date
  fastingHours?: number; // default: 8 hours
  waterAllowedUntilMinutesBefore?: number; // default: 120 minutes (2 hours)
}

export interface FastingCalculationResult {
  scheduledLabTime: string;
  fastingHours: number;
  fastingStartTime: string;
  waterCutoffTime: string;
  instructions: string[];
  alertCheckpoints: Array<{ time: string; message: string }>;
}

export interface AtHomeLabSampleRequest {
  patientId: string;
  patientName?: string;
  service?: string;
  hotel: string;
  roomNumber: string;
  scheduledTime: string;
  fastingHours?: number;
  targetLab?: 'Laboratorio Echavarría' | 'Laboratorio Pasteur' | 'Clínica Cardio VID' | string;
}

export interface AtHomeLabSampleResult {
  patientId: string;
  hotel: string;
  roomNumber: string;
  scheduledTime: string;
  serviceFeeCOP: number;
  fastingRequired: boolean;
  fastingHours: number;
  fastingStartTime: string;
  targetLab: string;
  assignedNurseName: string;
  status: 'CONFIRMED' | 'SCHEDULED';
}

export interface PreOpChecklistRequest {
  surgeryType: string;
  surgeryDateTime: string | Date;
  patientAllergies?: string[];
}

/**
 * Computes exact fasting window start timestamp and alert countdowns.
 */
export function calculateFastingWindow(request: FastingCalculationRequest): FastingCalculationResult {
  const labTime = new Date(request.scheduledLabTime);
  const fastingHours = request.fastingHours ?? 8;
  const waterMinutesBefore = request.waterAllowedUntilMinutesBefore ?? 120;

  const fastingStartMs = labTime.getTime() - fastingHours * 60 * 60 * 1000;
  const fastingStartTime = new Date(fastingStartMs);

  const waterCutoffMs = labTime.getTime() - waterMinutesBefore * 60 * 1000;
  const waterCutoffTime = new Date(waterCutoffMs);

  const alert12h = new Date(labTime.getTime() - 12 * 60 * 60 * 1000);
  const alert1h = new Date(labTime.getTime() - 60 * 60 * 1000);

  const alertCheckpoints = [
    {
      time: alert12h.toISOString(),
      message: 'Cena ligera recomendada antes del inicio del ayuno clínico.',
    },
    {
      time: fastingStartTime.toISOString(),
      message: `Inicio de ayuno estricto (${fastingHours} horas). No ingerir alimentos sólidos ni bebidas azucaradas.`,
    },
    {
      time: waterCutoffTime.toISOString(),
      message: 'Corte de ingesta de agua pura. Ayuno absoluto hasta la toma de muestras.',
    },
    {
      time: alert1h.toISOString(),
      message: 'Enfermera en camino para toma de muestras.',
    },
  ];

  return {
    scheduledLabTime: labTime.toISOString(),
    fastingHours,
    fastingStartTime: fastingStartTime.toISOString(),
    waterCutoffTime: waterCutoffTime.toISOString(),
    instructions: [
      `Ayuno obligatorio de ${fastingHours} horas previas a la extracción de sangre.`,
      'Solo se permite sorbos pequeños de agua hasta 2 horas antes.',
      'No fumar ni consumir chicle o cafeína durante el ayuno.',
      'Tomar medicamentos habituales solo si fueron explícitamente autorizados por el anestesiólogo.',
    ],
    alertCheckpoints,
  };
}

/**
 * Schedules at-home nurse sampling in hotel room with standard 65,000 COP fee.
 */
export function scheduleAtHomeSample(request: AtHomeLabSampleRequest): AtHomeLabSampleResult {
  const fastingWindow = calculateFastingWindow({
    scheduledLabTime: request.scheduledTime,
    fastingHours: request.fastingHours ?? 8,
  });

  return {
    patientId: request.patientId,
    hotel: request.hotel,
    roomNumber: request.roomNumber,
    scheduledTime: request.scheduledTime,
    serviceFeeCOP: 65000,
    fastingRequired: true,
    fastingHours: fastingWindow.fastingHours,
    fastingStartTime: fastingWindow.fastingStartTime,
    targetLab: request.targetLab || 'Laboratorio Echavarría',
    assignedNurseName: 'Enf. Andrea Morales',
    status: 'CONFIRMED',
  };
}

/**
 * Generates pre-operative preparation checklist and medication alerts.
 */
export function generatePreOpChecklist(request: PreOpChecklistRequest): {
  surgeryDateTime: string;
  checklist: Array<{ task: string; timing: string; status: 'PENDING' | 'COMPLETED' }>;
} {
  const surgeryTime = new Date(request.surgeryDateTime);
  const dMinus7 = new Date(surgeryTime.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dMinus1 = new Date(surgeryTime.getTime() - 24 * 60 * 60 * 1000);
  const dMinus8h = new Date(surgeryTime.getTime() - 8 * 60 * 60 * 1000);

  return {
    surgeryDateTime: surgeryTime.toISOString(),
    checklist: [
      {
        task: 'Suspender consumo de aspirina, anticoagulantes y suplementos de vitamina E / Ginkgo Biloba',
        timing: `7 días antes (${dMinus7.toLocaleDateString()})`,
        status: 'PENDING',
      },
      {
        task: 'Revisión y validación de exámenes de laboratorio pre-quirúrgicos y valoración cardiológica',
        timing: `1 día antes (${dMinus1.toLocaleDateString()})`,
        status: 'PENDING',
      },
      {
        task: 'Baño pre-quirúrgico con jabón antiséptico (Clorhexidina)',
        timing: 'Noche anterior y mañana del procedimiento',
        status: 'PENDING',
      },
      {
        task: 'Ayuno absoluto de sólidos y líquidos (8 horas)',
        timing: `Desde ${dMinus8h.toLocaleTimeString()}`,
        status: 'PENDING',
      },
      {
        task: 'Presentarse sin maquillaje, esmalte de uñas, joyas ni lentes de contacto',
        timing: 'Día de la cirugía',
        status: 'PENDING',
      },
    ],
  };
}

/**
 * Nurse Subagent Request Dispatcher
 */
export function processNurseAction(action: string, payload: any): any {
  switch (action) {
    case 'CALCULATE_FASTING_WINDOW':
      return calculateFastingWindow(payload);

    case 'SCHEDULE_AT_HOME_SAMPLE':
      return scheduleAtHomeSample(payload);

    case 'GENERATE_PREOP_CHECKLIST':
      return generatePreOpChecklist(payload);

    case 'CALCULATE_RECOVERY_TIMELINE': {
      const surgeryEnd = new Date(payload.surgeryEndTime || new Date());
      return {
        check2h: new Date(surgeryEnd.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        check6h: new Date(surgeryEnd.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        check24h: new Date(surgeryEnd.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        check48h: new Date(surgeryEnd.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      };
    }

    default:
      throw new Error(`[NurseWorker]: Unknown action '${action}'`);
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
      const result = processNurseAction(action, payload);
      (self as any).postMessage({ id, success: true, result });
    } catch (err: any) {
      (self as any).postMessage({ id, success: false, error: err.message });
    }
  });
}
