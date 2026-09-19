## 2026-08-23T05:03:36Z
You are Worker M4 (worker_m4) for Medical Trip Colombia S.A.S.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/worker_4
Your parent is Orchestrator (2b250ea1-fa35-4e8a-acb4-2b5dc5303699).

MANDATORY: Read /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md first!
Also read /Users/miyo123/projects/medicaltrip/apps/itinerarios_liquidacion_offline/PROJECT.md and existing code in `src/domain/` and `src/infrastructure/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own `apps/itinerarios_liquidacion_offline/src/actors/**` and `apps/itinerarios_liquidacion_offline/tests/unit/actors.test.js`. Do NOT modify other directories.

Your mission:
Implement Milestone 4 (Decentralized Actor Model & Web Worker Concurrency) in `apps/itinerarios_liquidacion_offline/src/actors/`:
1. `src/actors/workers/driver-actor.worker.js`:
   - `[DRV]` Driver Agent (e.g. Ramón Rosero / Aeroturex Kia Sonet NLX666).
   - Handles commands: `START_TRANSFER`, `ARRIVE_ORIGIN`, `PASSENGER_PICKED_UP`, `ARRIVE_DESTINATION`, `SUBMIT_TOLL_EXPENSE`, `GET_STATUS`.
   - Dispatches events via MessagePort to Financial Auditor and Main Thread.
2. `src/actors/workers/guide-actor.worker.js`:
   - `[GUIA]` Bilingual Guide Agent (e.g. Yenny / Alejandro).
   - Handles commands: `START_SHIFT`, `LOG_CLINIC_CHECKIN`, `LOG_PATIENT_SYMPTOM`, `END_SHIFT`, `SUBMIT_OUT_OF_POCKET_EXPENSE`, `GET_STATUS`.
   - Computes real-time shift duration and overtime.
3. `src/actors/workers/nurse-actor.worker.js`:
   - `[NURSE]` Nurse Agent (e.g. Villa Anita / Emi Echavarría).
   - Handles commands: `START_DOMICILIARY_VISIT`, `LOG_VITAL_SIGNS`, `RECORD_MEDICATION_ADMINISTERED`, `CAPTURE_WOUND_PHOTO`, `COMPLETE_VISIT`.
4. `src/actors/workers/financial-auditor.worker.js`:
   - `[FIN]` Single-Writer Financial Auditor Agent (Dra. Jenny Acosta).
   - Acts as the Single-Writer authority for the CQRS event stream.
   - Receives expense proposals from Driver, Guide, and Nurse actors, validates receipt checksums, checks budget thresholds, appends to SHA-256 hash chain, and broadcasts updated settlement state.
5. `src/actors/crdt-state-sync.js`:
   - CRDT conflict-free state synchronization engine (PN-Counter for expenses, LWW-Element-Set for itinerary stop statuses, Observed-Remove Set for pending items).
   - Idempotent and commutative state merging ensuring identical state across workers and main thread.
6. `src/actors/actor-mesh-controller.js`:
   - Main-thread coordinator that instantiates Web Workers (with fallback simulation for non-worker environments / Node.js test suites).
   - Sets up point-to-point `MessageChannel` ports between actors (`DRV <-> FIN`, `GUIA <-> FIN`, `NURSE <-> FIN`, `DRV <-> GUIA`).
   - Ensures non-blocking async execution guaranteeing 60fps main UI responsiveness.
7. `src/actors/index.js`: Actors subsystem barrel export.
8. `tests/unit/actors.test.js`: Automated unit and concurrency test suite verifying actor messaging, CRDT state convergence, and single-writer ledger integrity.

Run tests and report results.
Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_4/handoff.md` and notify parent via send_message when done.
