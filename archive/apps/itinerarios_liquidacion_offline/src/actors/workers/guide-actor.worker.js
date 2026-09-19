/**
 * [GUIA] Bilingual Guide Actor Web Worker
 * Medical Trip Colombia S.A.S. — Milestone 4 Actor Model
 * 
 * Specialized field actor representing bilingual patient companions:
 * e.g., Yenny Restrepo / Alejandro.
 * 
 * Handles medical accompaniment shifts, real-time overtime computation, clinic check-ins,
 * patient symptom logging, out-of-pocket expenses, and coordination with Driver and Financial Auditor.
 * 0 external framework dependencies.
 */

import { OperativeTerritory } from '../../domain/value-objects/operative-territory.js';
import { ActorEvent } from '../../domain/value-objects/actor-event.js';
import { Money } from '../../domain/value-objects/money.js';
import { CRDTActorState } from '../crdt-state-sync.js';

function validateTerritory(location) {
  if (!location) return;
  if (typeof location === 'string') {
    new OperativeTerritory(location);
  } else if (typeof location === 'object') {
    if (location.lat !== undefined && location.lng !== undefined) {
      new OperativeTerritory({ lat: Number(location.lat), lng: Number(location.lng) });
    } else if (location.zoneName) {
      new OperativeTerritory(location.zoneName);
    }
  }
}

export class GuideActor {
  /** @type {string} */
  actorId;
  /** @type {string} */
  actorRole;
  /** @type {string} */
  guideName;
  /** @type {string[]} */
  languages;
  /** @type {string} */
  status;
  /** @type {object|null} */
  activeShift;
  /** @type {Array<object>} */
  completedShifts;
  /** @type {Array<object>} */
  symptomLogs;
  /** @type {Array<object>} */
  clinicCheckIns;
  /** @type {Array<object>} */
  outOfPocketExpenses;
  /** @type {CRDTActorState} */
  crdtState;
  /** @type {any|null} */
  finPort;
  /** @type {any|null} */
  driverPort;
  /** @type {any|null} */
  mainPort;
  /** @type {Array<Function>} */
  #listeners;

  /**
   * @param {object} [config]
   */
  constructor(config = {}) {
    this.actorId = config.actorId || 'ACTOR-GUIA-YENNY';
    this.actorRole = 'GUIDE';
    this.guideName = config.guideName || 'Yenny Restrepo';
    this.languages = config.languages || ['ES', 'EN'];
    this.status = 'IDLE'; // IDLE | ON_SHIFT | IN_CONSULTATION | SHIFT_ENDED
    this.activeShift = null;
    this.completedShifts = [];
    this.symptomLogs = [];
    this.clinicCheckIns = [];
    this.outOfPocketExpenses = [];
    this.crdtState = new CRDTActorState();
    this.finPort = null;
    this.driverPort = null;
    this.mainPort = null;
    this.#listeners = [];
  }

  /**
   * Initializes point-to-point MessagePorts.
   * @param {object} ports
   */
  initPorts(ports = {}) {
    if (ports.finPort) {
      this.finPort = ports.finPort;
      this.finPort.onmessage = (e) => this.#handleFinMessage(e.data);
    }
    if (ports.driverPort) {
      this.driverPort = ports.driverPort;
      this.driverPort.onmessage = (e) => this.#handleDriverMessage(e.data);
    }
    if (ports.mainPort) {
      this.mainPort = ports.mainPort;
    }
  }

  /**
   * Registers a local event/state listener.
   * @param {Function} callback
   * @returns {() => void}
   */
  subscribe(callback) {
    this.#listeners.push(callback);
    return () => {
      this.#listeners = this.#listeners.filter((cb) => cb !== callback);
    };
  }

  #emit(eventObj) {
    for (const cb of this.#listeners) {
      try {
        cb(eventObj);
      } catch (err) {
        console.error('[GuideActor] Listener error:', err);
      }
    }
    if (this.mainPort && typeof this.mainPort.postMessage === 'function') {
      try {
        this.mainPort.postMessage(eventObj);
      } catch {
        // Port transfer fallback
      }
    }
  }

  #handleFinMessage(msg) {
    if (!msg) return;
    if (msg.type === 'EXPENSE_APPROVED' || msg.action === 'EXPENSE_APPROVED' || msg.status === 'APPROVED') {
      const { expenseId, amountInCents } = msg.payload || msg.data || msg;
      if (amountInCents) {
        this.crdtState.addExpenseCents(this.actorId, BigInt(amountInCents));
      }
      this.#emit({
        type: 'GUIDE_EXPENSE_APPROVED',
        actorId: this.actorId,
        expenseId,
        amountInCents
      });
    }
  }

  #handleDriverMessage(msg) {
    if (!msg) return;
    this.#emit({
      type: 'DRIVER_COORDINATION_RECEIVED',
      actorId: this.actorId,
      fromDriver: msg
    });
  }

  /**
   * Computes real-time shift duration and overtime.
   * Standard shift = 8.0 hours. Overtime applies for hours > 8.0.
   * @param {string} startTime
   * @param {string} [endTime]
   * @param {number} [breaksMinutes=0]
   * @returns {{ totalHours: number, baseHours: number, overtimeHours: number, durationMs: number }}
   */
  computeShiftDuration(startTime, endTime, breaksMinutes = 0) {
    const startMs = new Date(startTime).getTime();
    const endMs = endTime ? new Date(endTime).getTime() : Date.now();
    const durationMs = Math.max(0, endMs - startMs - (breaksMinutes * 60 * 1000));
    const totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    const baseHours = Math.min(totalHours, 8.0);
    const overtimeHours = Math.max(0, Math.round((totalHours - 8.0) * 100) / 100);

    return {
      totalHours,
      baseHours,
      overtimeHours,
      durationMs
    };
  }

  /**
   * Dispatches command to actor and returns response.
   * @param {object} command
   * @param {any[]} [transferPorts]
   * @returns {Promise<object>|object}
   */
  async receive(command = {}, transferPorts = []) {
    const action = command.action || command.type;
    const payload = command.payload || {};
    const timestamp = command.timestamp || new Date().toISOString();
    const correlationId = command.correlationId || `corr-${Date.now()}`;

    switch (action) {
      case 'INIT_PORTS': {
        const ports = command.ports || {};
        if (transferPorts && transferPorts.length > 0) {
          if (transferPorts[0]) ports.finPort = transferPorts[0];
          if (transferPorts[1]) ports.driverPort = transferPorts[1];
        }
        this.initPorts(ports);
        return {
          success: true,
          ack: true,
          action: 'INIT_PORTS',
          actorId: this.actorId,
          correlationId
        };
      }

      case 'START_SHIFT': {
        const {
          shiftId,
          dayNumber = 1,
          startTime,
          hourlyRate,
          hourlyRateCents,
          mealSubsidy,
          mealSubsidyCents,
          scheduledHours = 8.0,
          patientUuid,
          patientName
        } = payload;

        const effectiveStart = startTime || timestamp;
        const rateCents = hourlyRateCents !== undefined
          ? BigInt(hourlyRateCents)
          : BigInt(Math.round(Number(hourlyRate || 15500) * 100));

        const subsidyCents = mealSubsidyCents !== undefined
          ? BigInt(mealSubsidyCents)
          : BigInt(Math.round(Number(mealSubsidy || 35000) * 100));

        this.status = 'ON_SHIFT';
        this.activeShift = {
          shiftId: shiftId || `SHIFT-${Date.now()}`,
          dayNumber,
          startTime: effectiveStart,
          hourlyRateCents: rateCents.toString(),
          mealSubsidyCents: subsidyCents.toString(),
          scheduledHours,
          patientUuid: patientUuid || 'ENT-PAX-GENERAL',
          patientName: patientName || 'Paciente Internacional',
          hours: 0
        };

        const event = new ActorEvent({
          eventId: `EVT-GUIA-SHIFT-START-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'START_SHIFT',
          aggregateId: this.activeShift.shiftId,
          payload: { ...this.activeShift },
          timestamp: effectiveStart
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'START_SHIFT',
          status: this.status,
          activeShift: this.activeShift,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          activeShift: this.activeShift,
          correlationId
        };
      }

      case 'LOG_CLINIC_CHECKIN': {
        const { clinicName, coords, appointmentType, itineraryItemId } = payload;
        if (coords) {
          validateTerritory(coords);
          this.crdtState.updateActorLocation(this.actorId, coords, timestamp);
        }

        this.status = 'IN_CONSULTATION';
        const checkInRecord = {
          checkInId: `CHK-${Date.now()}`,
          clinicName: clinicName || 'Clínica Clofán',
          coords,
          appointmentType: appointmentType || 'Consulta Especializada',
          itineraryItemId: itineraryItemId || 'ITN-ITEM-GENERAL',
          timestamp
        };

        this.clinicCheckIns.push(checkInRecord);

        if (itineraryItemId) {
          this.crdtState.updateStopStatus(itineraryItemId, 'EN_SITIO', this.actorId, timestamp);
        }

        const event = new ActorEvent({
          eventId: `EVT-GUIA-CLINIC-CHK-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'LOG_CLINIC_CHECKIN',
          aggregateId: checkInRecord.itineraryItemId,
          payload: checkInRecord,
          timestamp
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'LOG_CLINIC_CHECKIN',
          status: this.status,
          checkIn: checkInRecord,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          checkIn: checkInRecord,
          correlationId
        };
      }

      case 'LOG_PATIENT_SYMPTOM': {
        const {
          patientUuid,
          symptomDescription,
          severity = 'MILD',
          vitalSigns = {},
          reportedToDoctor = true,
          notes
        } = payload;

        if (!symptomDescription) {
          throw new Error('[GuideActor] symptomDescription es obligatorio.');
        }

        const symptomRecord = {
          symptomId: `SYM-${Date.now()}`,
          patientUuid: patientUuid || this.activeShift?.patientUuid || 'ENT-PAX-GENERAL',
          symptomDescription,
          severity,
          vitalSigns,
          reportedToDoctor,
          notes: notes || '',
          timestamp
        };

        this.symptomLogs.push(symptomRecord);

        const event = new ActorEvent({
          eventId: `EVT-GUIA-SYMPTOM-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'LOG_PATIENT_SYMPTOM',
          aggregateId: symptomRecord.patientUuid,
          payload: symptomRecord,
          timestamp
        });

        this.#emit({
          type: 'PATIENT_SYMPTOM_LOGGED',
          actorId: this.actorId,
          symptom: symptomRecord,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          symptomRecord,
          correlationId
        };
      }

      case 'END_SHIFT': {
        const { shiftId, endTime, breaksMinutes = 0 } = payload;
        const currentShift = this.activeShift || (shiftId ? { shiftId, startTime: timestamp } : null);

        if (!currentShift) {
          throw new Error('[GuideActor] No hay un turno activo para finalizar con END_SHIFT.');
        }

        const effectiveEnd = endTime || timestamp;
        const durationMetrics = this.computeShiftDuration(currentShift.startTime, effectiveEnd, breaksMinutes);

        const rateCents = BigInt(currentShift.hourlyRateCents || 1550000n);
        const subsidyCents = BigInt(currentShift.mealSubsidyCents || 3500000n);

        // Earnings math: (baseHours * rate) + (overtimeHours * rate * 1.5) + subsidy
        const baseCents = (rateCents * BigInt(Math.round(durationMetrics.baseHours * 100))) / 100n;
        const overtimeCents = (rateCents * 15n * BigInt(Math.round(durationMetrics.overtimeHours * 100))) / 1000n;
        const totalEarningsCents = baseCents + overtimeCents + subsidyCents;

        const finalizedShift = {
          ...currentShift,
          endTime: effectiveEnd,
          breaksMinutes,
          ...durationMetrics,
          baseEarningsCents: baseCents.toString(),
          overtimeEarningsCents: overtimeCents.toString(),
          mealSubsidyCents: subsidyCents.toString(),
          totalEarningsCents: totalEarningsCents.toString()
        };

        this.completedShifts.push(finalizedShift);
        this.status = 'SHIFT_ENDED';
        this.activeShift = null;

        const event = new ActorEvent({
          eventId: `EVT-GUIA-SHIFT-END-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'END_SHIFT',
          aggregateId: finalizedShift.shiftId,
          payload: finalizedShift,
          timestamp: effectiveEnd
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'END_SHIFT',
          status: this.status,
          finalizedShift,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          finalizedShift,
          correlationId
        };
      }

      case 'SUBMIT_OUT_OF_POCKET_EXPENSE': {
        const {
          expenseId,
          itineraryItemId,
          category = 'PHARMACY',
          description,
          amountInCents,
          amount,
          currency = 'COP',
          receiptBlobId,
          receiptChecksum
        } = payload;

        const cents = amountInCents !== undefined
          ? BigInt(amountInCents)
          : BigInt(Math.round(Number(amount || 0) * 100));

        if (cents <= 0n) {
          throw new Error('[GuideActor] Monto de gasto debe ser mayor a 0 centavos.');
        }

        const expId = expenseId || `EXP-GUIA-${Date.now()}`;
        const proposal = {
          expenseId: expId,
          itineraryItemId: itineraryItemId || 'ITN-ITEM-GENERAL',
          category,
          description: description || 'Gasto de bolsillo acompañamiento bilingüe',
          amountInCents: cents.toString(),
          currency,
          receiptBlobId: receiptBlobId || `receipt-guia-${expId}`,
          receiptChecksum: receiptChecksum || 'sha256-receipt-checksum-placeholder',
          actorId: this.actorId,
          actorRole: this.actorRole,
          timestamp
        };

        this.outOfPocketExpenses.push(proposal);

        let auditorResponse = null;

        // Send direct proposal to Financial Auditor if port is active and wait for audit result
        if (this.finPort && typeof this.finPort.postMessage === 'function') {
          auditorResponse = await new Promise((resolve) => {
            const originalOnMessage = this.finPort.onmessage;
            this.finPort.onmessage = (e) => {
              if (originalOnMessage) originalOnMessage(e);
              resolve(e.data);
            };
            try {
              this.finPort.postMessage({
                type: 'PROPOSE_EXPENSE',
                action: 'PROPOSE_EXPENSE',
                payload: proposal,
                correlationId
              });
            } catch (e) {
              console.warn('[GuideActor] Error posting to finPort:', e);
              resolve(null);
            }
          });

          if (auditorResponse && (auditorResponse.status === 'APPROVED' || auditorResponse.success)) {
            this.crdtState.addExpenseCents(this.actorId, cents);
          }
        }

        this.#emit({
          type: 'EXPENSE_PROPOSED',
          actorId: this.actorId,
          action: 'SUBMIT_OUT_OF_POCKET_EXPENSE',
          proposal,
          auditorResponse,
          correlationId
        });

        return {
          success: true,
          ack: true,
          expenseId: expId,
          amountInCents: cents.toString(),
          proposal,
          auditorResponse,
          correlationId
        };
      }

      case 'GET_STATUS': {
        const currentMetrics = this.activeShift
          ? this.computeShiftDuration(this.activeShift.startTime)
          : null;

        return {
          success: true,
          actorId: this.actorId,
          actorRole: this.actorRole,
          guideName: this.guideName,
          languages: this.languages,
          status: this.status,
          activeShift: this.activeShift,
          activeShiftMetrics: currentMetrics,
          completedShiftsCount: this.completedShifts.length,
          symptomsLoggedCount: this.symptomLogs.length,
          clinicCheckInsCount: this.clinicCheckIns.length,
          expensesSubmittedCount: this.outOfPocketExpenses.length,
          crdtState: this.crdtState.getSnapshot(),
          correlationId
        };
      }

      default:
        return {
          success: false,
          error: `[GuideActor] Acción desconocida: '${action}'`,
          correlationId
        };
    }
  }
}

// Web Worker Execution Environment hook
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
  const guideWorkerInstance = new GuideActor();
  self.onmessage = async (event) => {
    try {
      const res = await guideWorkerInstance.receive(event.data, event.ports);
      if (res) {
        self.postMessage(res);
      }
    } catch (err) {
      self.postMessage({
        success: false,
        error: err.message,
        correlationId: event.data?.correlationId
      });
    }
  };
}
