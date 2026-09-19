/**
 * [NURSE] Nurse Actor Web Worker
 * Medical Trip Colombia S.A.S. — Milestone 4 Actor Model
 * 
 * Specialized field actor representing domiciliary nurses & post-surgical caregivers:
 * e.g., Villa Anita Recovery Retreat / Emi Echavarría.
 * 
 * Handles home visits, vital signs logging with physiological validations, medication administration,
 * wound photographic documentation, lab sample collection, and supply expense proposals.
 * 0 external framework dependencies.
 */

import { OperativeTerritory } from '../../domain/value-objects/operative-territory.js';
import { ActorEvent } from '../../domain/value-objects/actor-event.js';
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

export class NurseActor {
  /** @type {string} */
  actorId;
  /** @type {string} */
  actorRole;
  /** @type {string} */
  nurseName;
  /** @type {string} */
  licenseNumber;
  /** @type {string} */
  status;
  /** @type {object|null} */
  activeVisit;
  /** @type {Array<object>} */
  completedVisits;
  /** @type {Array<object>} */
  vitalsHistory;
  /** @type {Array<object>} */
  medicationsAdministered;
  /** @type {Array<object>} */
  woundPhotos;
  /** @type {Array<object>} */
  collectedSamples;
  /** @type {Array<object>} */
  submittedExpenses;
  /** @type {CRDTActorState} */
  crdtState;
  /** @type {any|null} */
  finPort;
  /** @type {any|null} */
  mainPort;
  /** @type {Array<Function>} */
  #listeners;

  /**
   * @param {object} [config]
   */
  constructor(config = {}) {
    this.actorId = config.actorId || 'ACTOR-NURSE-EMI';
    this.actorRole = 'NURSE';
    this.nurseName = config.nurseName || 'Emi Echavarría';
    this.licenseNumber = config.licenseNumber || 'COL-ENF-8841';
    this.status = 'IDLE'; // IDLE | IN_VISIT | SAMPLE_COLLECTED | VISIT_COMPLETED
    this.activeVisit = null;
    this.completedVisits = [];
    this.vitalsHistory = [];
    this.medicationsAdministered = [];
    this.woundPhotos = [];
    this.collectedSamples = [];
    this.submittedExpenses = [];
    this.crdtState = new CRDTActorState();
    this.finPort = null;
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
        console.error('[NurseActor] Listener error:', err);
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
        type: 'NURSE_EXPENSE_APPROVED',
        actorId: this.actorId,
        expenseId,
        amountInCents
      });
    }
  }

  /**
   * Validates physiological vital signs limits.
   * @private
   */
  #validateVitalSigns(vitals = {}) {
    const { bloodPressure, heartRate, o2Saturation, temperature } = vitals;
    if (bloodPressure) {
      const { systolic, diastolic } = bloodPressure;
      if (systolic !== undefined && (systolic < 50 || systolic > 260)) {
        throw new Error(`[NurseActor] Presión sistólica fuera de rango fisiológico: ${systolic} mmHg (esperado 50-260)`);
      }
      if (diastolic !== undefined && (diastolic < 30 || diastolic > 160)) {
        throw new Error(`[NurseActor] Presión diastólica fuera de rango fisiológico: ${diastolic} mmHg (esperado 30-160)`);
      }
    }
    if (heartRate !== undefined && (heartRate < 30 || heartRate > 220)) {
      throw new Error(`[NurseActor] Frecuencia cardíaca fuera de rango fisiológico: ${heartRate} bpm (esperado 30-220)`);
    }
    if (o2Saturation !== undefined && (o2Saturation < 50 || o2Saturation > 100)) {
      throw new Error(`[NurseActor] Saturación O2 fuera de rango fisiológico: ${o2Saturation}% (esperado 50-100)`);
    }
    if (temperature !== undefined && (temperature < 32.0 || temperature > 43.0)) {
      throw new Error(`[NurseActor] Temperatura fuera de rango fisiológico: ${temperature} °C (esperado 32-43)`);
    }
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

      case 'START_DOMICILIARY_VISIT': {
        const {
          visitId,
          patientUuid,
          patientName,
          address,
          coords,
          scheduledProcedures = ['CURACION_DRENAJES', 'CONTROL_SIGNOS']
        } = payload;

        if (coords) {
          validateTerritory(coords);
          this.crdtState.updateActorLocation(this.actorId, coords, timestamp);
        }

        const vId = visitId || `VISIT-${Date.now()}`;
        this.status = 'IN_VISIT';
        this.activeVisit = {
          visitId: vId,
          patientUuid: patientUuid || 'ENT-PAX-GENERAL',
          patientName: patientName || 'Paciente Postquirúrgico',
          address: address || 'Apartamento Poblado',
          coords,
          scheduledProcedures,
          startTime: timestamp
        };

        this.crdtState.updateStopStatus(vId, 'EN_SITIO', this.actorId, timestamp);

        const event = new ActorEvent({
          eventId: `EVT-NURSE-VISIT-START-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'START_DOMICILIARY_VISIT',
          aggregateId: vId,
          payload: { ...this.activeVisit },
          timestamp
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'START_DOMICILIARY_VISIT',
          status: this.status,
          activeVisit: this.activeVisit,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          activeVisit: this.activeVisit,
          correlationId
        };
      }

      case 'LOG_VITAL_SIGNS': {
        const {
          visitId,
          patientUuid,
          bloodPressure,
          heartRate,
          o2Saturation,
          temperature,
          bloodGlucose,
          painScale
        } = payload;

        this.#validateVitalSigns(payload);

        const vitalsRecord = {
          recordId: `VIT-${Date.now()}`,
          visitId: visitId || this.activeVisit?.visitId || 'VISIT-GENERAL',
          patientUuid: patientUuid || this.activeVisit?.patientUuid || 'ENT-PAX-GENERAL',
          bloodPressure: bloodPressure || { systolic: 120, diastolic: 80 },
          heartRate: heartRate !== undefined ? heartRate : 72,
          o2Saturation: o2Saturation !== undefined ? o2Saturation : 98,
          temperature: temperature !== undefined ? temperature : 36.6,
          bloodGlucose: bloodGlucose || null,
          painScale: painScale !== undefined ? painScale : 0,
          timestamp
        };

        this.vitalsHistory.push(vitalsRecord);

        const event = new ActorEvent({
          eventId: `EVT-NURSE-VITALS-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'LOG_VITAL_SIGNS',
          aggregateId: vitalsRecord.patientUuid,
          payload: vitalsRecord,
          timestamp
        });

        this.#emit({
          type: 'VITAL_SIGNS_RECORDED',
          actorId: this.actorId,
          vitals: vitalsRecord,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          vitals: vitalsRecord,
          correlationId
        };
      }

      case 'RECORD_MEDICATION_ADMINISTERED': {
        const {
          visitId,
          patientUuid,
          medicationName,
          dosage,
          route = 'ORAL',
          batchNumber,
          prescribingDoctor
        } = payload;

        if (!medicationName || !dosage) {
          throw new Error('[NurseActor] medicationName y dosage son obligatorios.');
        }

        const validRoutes = ['ORAL', 'IV', 'IM', 'SUBCUTANEOUS', 'TOPICAL', 'SUBLINGUAL'];
        if (!validRoutes.includes(String(route).toUpperCase())) {
          throw new Error(`[NurseActor] Vía de administración inválida: ${route}.`);
        }

        const medRecord = {
          recordId: `MED-${Date.now()}`,
          visitId: visitId || this.activeVisit?.visitId || 'VISIT-GENERAL',
          patientUuid: patientUuid || this.activeVisit?.patientUuid || 'ENT-PAX-GENERAL',
          medicationName,
          dosage,
          route: String(route).toUpperCase(),
          batchNumber: batchNumber || 'BATCH-GENERIC-01',
          prescribingDoctor: prescribingDoctor || 'Dr. Cirujano Tratante',
          timestamp
        };

        this.medicationsAdministered.push(medRecord);

        const event = new ActorEvent({
          eventId: `EVT-NURSE-MED-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'RECORD_MEDICATION_ADMINISTERED',
          aggregateId: medRecord.patientUuid,
          payload: medRecord,
          timestamp
        });

        this.#emit({
          type: 'MEDICATION_ADMINISTERED',
          actorId: this.actorId,
          medication: medRecord,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          medication: medRecord,
          correlationId
        };
      }

      case 'CAPTURE_WOUND_PHOTO': {
        const {
          visitId,
          patientUuid,
          woundLocation = 'Abdomen / Zona Quirúrgica',
          drainageType = 'SEROHEMÁTICO',
          drainageAmountMl = 15,
          photoBlobId,
          photoChecksum,
          notes
        } = payload;

        const woundRecord = {
          recordId: `WND-${Date.now()}`,
          visitId: visitId || this.activeVisit?.visitId || 'VISIT-GENERAL',
          patientUuid: patientUuid || this.activeVisit?.patientUuid || 'ENT-PAX-GENERAL',
          woundLocation,
          drainageType,
          drainageAmountMl,
          photoBlobId: photoBlobId || `blob-wound-${Date.now()}`,
          photoChecksum: photoChecksum || 'sha256-wound-photo-checksum',
          notes: notes || 'Bordes afrontados, sin signos de infección',
          timestamp
        };

        this.woundPhotos.push(woundRecord);

        const event = new ActorEvent({
          eventId: `EVT-NURSE-WOUND-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'CAPTURE_WOUND_PHOTO',
          aggregateId: woundRecord.patientUuid,
          payload: woundRecord,
          timestamp
        });

        this.#emit({
          type: 'WOUND_PHOTO_CAPTURED',
          actorId: this.actorId,
          wound: woundRecord,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          wound: woundRecord,
          correlationId
        };
      }

      case 'LOG_SAMPLE_COLLECTION': {
        const {
          visitId,
          patientUuid,
          testTypes = ['HEMOGRAMA', 'UROANÁLISIS'],
          tubesCount = 2,
          labName = 'Laboratorio Médico Echavarría'
        } = payload;

        const sampleRecord = {
          sampleId: `SMP-${Date.now()}`,
          visitId: visitId || this.activeVisit?.visitId || 'VISIT-GENERAL',
          patientUuid: patientUuid || this.activeVisit?.patientUuid || 'ENT-PAX-GENERAL',
          testTypes,
          tubesCount: Number(tubesCount) || 1,
          labName,
          timestamp
        };

        this.collectedSamples.push(sampleRecord);
        this.status = 'SAMPLE_COLLECTED';

        const event = new ActorEvent({
          eventId: `EVT-NURSE-SAMPLE-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'LOG_SAMPLE_COLLECTION',
          aggregateId: sampleRecord.patientUuid,
          payload: sampleRecord,
          timestamp
        });

        this.#emit({
          type: 'SAMPLE_COLLECTION_RECORDED',
          actorId: this.actorId,
          sample: sampleRecord,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          patientUuid: sampleRecord.patientUuid,
          tubesCount: sampleRecord.tubesCount,
          sample: sampleRecord,
          correlationId
        };
      }

      case 'COMPLETE_VISIT': {
        const { visitId, patientSignatureBlobId, clinicalNotes, endTime } = payload;
        const currentVisit = this.activeVisit || (visitId ? { visitId, startTime: timestamp } : null);

        if (!currentVisit) {
          throw new Error('[NurseActor] No hay una visita activa para completar.');
        }

        const effectiveEnd = endTime || timestamp;
        const finalizedVisit = {
          ...currentVisit,
          endTime: effectiveEnd,
          patientSignatureBlobId: patientSignatureBlobId || `sig-visit-${currentVisit.visitId}`,
          clinicalNotes: clinicalNotes || 'Visita domiciliaria completada satisfactoriamente.',
          vitalsCount: this.vitalsHistory.filter((v) => v.visitId === currentVisit.visitId).length,
          medsCount: this.medicationsAdministered.filter((m) => m.visitId === currentVisit.visitId).length
        };

        this.completedVisits.push(finalizedVisit);
        this.crdtState.updateStopStatus(finalizedVisit.visitId, 'COMPLETADO', this.actorId, effectiveEnd);
        this.status = 'VISIT_COMPLETED';
        this.activeVisit = null;

        const event = new ActorEvent({
          eventId: `EVT-NURSE-VISIT-END-${Date.now()}`,
          actorId: this.actorId,
          actorRole: this.actorRole,
          eventType: 'COMPLETE_VISIT',
          aggregateId: finalizedVisit.visitId,
          payload: finalizedVisit,
          timestamp: effectiveEnd
        });

        this.#emit({
          type: 'ACTOR_STATE_UPDATE',
          actorId: this.actorId,
          action: 'COMPLETE_VISIT',
          status: this.status,
          finalizedVisit,
          event: event.toJSON(),
          correlationId
        });

        return {
          success: true,
          ack: true,
          status: this.status,
          finalizedVisit,
          correlationId
        };
      }

      case 'SUBMIT_SUPPLY_EXPENSE': {
        const {
          expenseId,
          visitId,
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
          throw new Error('[NurseActor] Monto de insumo debe ser mayor a 0 centavos.');
        }

        const expId = expenseId || `EXP-NURSE-${Date.now()}`;
        const proposal = {
          expenseId: expId,
          itineraryItemId: visitId || this.activeVisit?.visitId || 'VISIT-GENERAL',
          category: 'OTHER',
          description: description || 'Insumos médicos y gasas estériles curación',
          amountInCents: cents.toString(),
          currency,
          receiptBlobId: receiptBlobId || `receipt-nurse-${expId}`,
          receiptChecksum: receiptChecksum || 'sha256-receipt-nurse-placeholder',
          actorId: this.actorId,
          actorRole: this.actorRole,
          timestamp
        };

        this.submittedExpenses.push(proposal);

        let auditorResponse = null;

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
              console.warn('[NurseActor] Error posting to finPort:', e);
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
          action: 'SUBMIT_SUPPLY_EXPENSE',
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
        return {
          success: true,
          actorId: this.actorId,
          actorRole: this.actorRole,
          nurseName: this.nurseName,
          licenseNumber: this.licenseNumber,
          status: this.status,
          activeVisit: this.activeVisit,
          completedVisitsCount: this.completedVisits.length,
          vitalsCount: this.vitalsHistory.length,
          medicationsCount: this.medicationsAdministered.length,
          woundPhotosCount: this.woundPhotos.length,
          collectedSamplesCount: this.collectedSamples.length,
          expensesSubmittedCount: this.submittedExpenses.length,
          crdtState: this.crdtState.getSnapshot(),
          correlationId
        };
      }

      default:
        return {
          success: false,
          error: `[NurseActor] Acción desconocida: '${action}'`,
          correlationId
        };
    }
  }
}

// Web Worker Execution Environment hook
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof window === 'undefined') {
  const nurseWorkerInstance = new NurseActor();
  self.onmessage = async (event) => {
    try {
      const res = await nurseWorkerInstance.receive(event.data, event.ports);
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
