## 2026-08-23T15:46:38Z
You are Worker 2 for Milestone 2: Local-First Storage & Web Worker Multi-Agent Swarm Concurrency.
Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/worker_m2_storage_workers`.
The target app directory is `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`.
The master project blueprint is at `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/PROJECT.md`.
The original request is at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
- `apps/medicaltrip_calendar_app/src/infrastructure/storage/**/*`
- `apps/medicaltrip_calendar_app/src/infrastructure/workers/**/*`
- `apps/medicaltrip_calendar_app/public/sw.js`
- `apps/medicaltrip_calendar_app/public/manifest.json`
- `apps/medicaltrip_calendar_app/tests/integration/storage/**/*`
- `apps/medicaltrip_calendar_app/tests/integration/workers/**/*`

Your task:
1. Implement Local-First Storage:
   - `DexieMedicalTripDB.ts`: IndexedDB database schema with Dexie.js for tables (`itineraries`, `milestones`, `transactions`, `binaryBlobs`, `auditLedger`, `syncState`).
   - `DexieItineraryRepository.ts`: Implements `IItineraryRepository` and `ILedgerRepository`, saving and restoring domain aggregates (`MedicalItinerary`), milestones, and BigInt transactions.
   - `StoragePersistAdapter.ts`: Implements `IStoragePersistAdapter` utilizing `navigator.storage.persist()`, estimating quota, and preventing Safari/WebKit 7-day storage evictions.
   - `public/manifest.json` and `public/sw.js`: PWA manifest with standalone display and service worker with Cache-First asset caching for 100% offline functionality.
2. Implement Web Worker Actor Swarm Concurrency:
   - Web Worker Subagents:
     * `driverWorker.ts` ([DRV]): Processes logistics updates, route estimates, Haversine geo-distance, driver rate calculation.
     * `guideWorker.ts` ([GUIA]): Processes guide shift schedules, preparation allowance, tiered meal subsidies ($8k, $25k, $35k, $45k), language matching.
     * `nurseWorker.ts` ([NURSE]): Processes medical prep alerts, fasting lab countdowns, recovery checks, provider coordination.
     * `financialAuditorWorker.ts` ([FIN]): Asynchronously audits ledger events, computes SHA-256 cryptographic hashes for ledger entries, builds hash chains for tamper-evident audit logs, and validates Out-of-Pocket + Companion + Taxis - Advances = Net.
   - `WebWorkerSwarmBus.ts`: Implements `IActorSwarmBus` with `MessageChannel` point-to-point mesh communication, fallback inline worker execution for headless/Node environments, CRDT state sync (LWW-Element-Set or PN-Counter), and cryptographic ledger chaining.
3. Implement Integration Tests:
   - `tests/integration/storage/DexieStorage.test.ts`: Verify IndexedDB persistence, aggregate serialization/deserialization, binary blob storing/retrieval, BigInt preservation.
   - `tests/integration/workers/ActorSwarm.test.ts`: Verify point-to-point MessageChannel dispatching, subagent event processing, CRDT synchronization, and SHA-256 ledger chaining.
4. Run all unit and integration tests (`npx vitest run`), verify 100% pass, and build (`npm run build`).
5. Write your handoff report to `/Users/miyo123/projects/medicaltrip/.agents/worker_m2_storage_workers/handoff.md` and message back the orchestrator.
