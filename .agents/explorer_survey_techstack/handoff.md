# 📋 Handoff Report: Technical Stack & Architecture Survey
**Agent**: `explorer_survey_techstack`  
**Target Application**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`  
**Handoff Type**: Hard Handoff (Investigation & Architecture Design Complete)  
**Date**: 2026-08-23T10:33:30-05:00

---

## 1. Observation

### 1.1. Host Environment & Tooling Observations
- **Node.js**: Multiple Node runtimes are available:
  * Primary system node: `/Users/miyo123/homebrew/bin/node` (v22.21.1)
  * Workspace local node: `/Users/miyo123/projects/medicaltrip/.bin/bin/node` (v20.18.0)
- **Package Management**:
  * NPM is installed and fully functional at `/Users/miyo123/projects/medicaltrip/.bin/bin/npm` (`10.8.2`).
  * Running `npm ping` verified connectivity with the registry: `npm notice PONG 546ms`.
- **TypeScript & Execution Engines**:
  * TypeScript 5.5+ compiler (`tsc`) and TSX execution engine (`tsx`) are present in `/Users/miyo123/projects/medicaltrip/node_modules/.bin/`.
- **Target Application Directory**:
  * Directory `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app` exists and is currently clean/empty.

### 1.2. Domain & Business Evidence Observations
- **Original Requirements (`.agents/ORIGINAL_REQUEST.md`)**:
  * R1: Google Calendar / Linear-grade human-first UI/UX (zinc/slate neutrals, Day/Week/Month/Agenda views, drag-to-reschedule, semantic color tokens).
  * R2: Complete operational domain modeling (`ENT-PAX`, `RVA`, `CTZ`, `DRV` Aeroturex sedans/vans, `GUIA` hourly shifts $15.500/h + prep $15.500 + meal tiers $8k/$25k/$35k/$45k, `CLINIC` HPTU/Cardio VID/Clofán/CES, `HOTEL` Poblado Plaza/Inntu/Park 42).
  * R3: Deterministic financial settlement engine in `BigInt` integer cents with 0 float rounding error + live settlement drawer + pharmacy receipt OCR + canvas signature.
  * R4: Strictly decoupled Hexagonal Architecture (Ports & Adapters) + Local-First persistence (`Dexie.js`, `navigator.storage.persist()`, PWA Service Worker).
  * R5: Decentralized Web Worker Actor Swarm (`[DRV]`, `[GUIA]`, `[NURSE]`, `[FIN]`) via `MessageChannel`, CRDT, and SHA-256 cryptographic chain.
  * Acceptance criteria mandates full support for 4 canonical Google Drive archetypes (`RVA171 Catia x5`, `RVA282 George Cardio`, `RVA341 Eduard CES`, `RVA077 Rumai 12d`) and fail-fast domain errors for non-operative zones (e.g. Mocoa).

---

## 2. Logic Chain

1. **Decoupling Domain from UI/Frameworks**:
   - *Observation*: Requirements mandate zero external framework dependencies in the domain layer and fail-fast invariants.
   - *Deduction*: Placing `Money` (BigInt integer cents), `OperativeTerritory` (geofenced corridors with Mocoa rejection), `ItineraryEvent`, `DriverTransfer`, `CompanionShift`, `ExpenseReceipt`, and `SettlementLedger` in `src/domain/` ensures complete isolation. Domain entities do not import React, Dexie, Vite, or any UI/hardware libraries.

2. **Application Ports & Inversion of Control (IoC)**:
   - *Observation*: Need to swap backends (Dexie in-memory for testing, IndexedDB in production, Mock vs WASM OCR) without modifying use cases.
   - *Deduction*: Abstract interfaces (`IItineraryRepository`, `ISettlementRepository`, `IBlobStoragePort`, `IActorSwarmBusPort`, `IReceiptOCRPort`, `ISignatureStoragePort`) reside in `src/application/ports/`, while use cases orchestrate operations purely through these interfaces.

3. **Multi-Agent Web Worker Swarm & Event Sourcing**:
   - *Observation*: Concurrency without main-thread blocking requires 4 specialized actors (`[DRV]`, `[GUIA]`, `[NURSE]`, `[FIN]`) and single-writer CQRS ledger integrity.
   - *Deduction*: Web Workers communicate using point-to-point `MessageChannel` transferables. The `[FIN]` worker acts as the single-writer auditor appending immutable events to a SHA-256 cryptographic hash chain, guaranteeing auditability and zero race conditions.

4. **UI/UX Human Design System (Google Calendar / Linear)**:
   - *Observation*: R1 specifically forbids flashy AI-gimmick neon gradients and demands a clean, high-density, ergonomic interface with fluid Day, Week, Month, and Agenda views.
   - *Deduction*: Tailwind CSS with zinc/slate neutral tokens (`bg-zinc-50`, `border-zinc-200`, `text-zinc-900`), semantic badge colors (Sky Blue for flights, Indigo for clinical, Teal for labs, Emerald for pharmacy, Slate for hotel), and tabular font figures ensures 100% aesthetic alignment with Google Calendar and Linear.

5. **Storage Resilience & Anti-Eviction**:
   - *Observation*: Safari and WebKit browsers evict client storage after 7 days of inactivity if persistent storage is not requested.
   - *Deduction*: Integrating `PersistentStorageManager` executing `navigator.storage.persist()` and IndexedDB blob storage for receipt images and vector signatures shields the app from data loss.

---

## 3. Caveats

- **Network Availability during Build**: While NPM is available and connected, build scripts in production should prefer local cached node_modules when running offline.
- **WASM OCR Payload**: Tesseract WASM is bulky for instant initial load; the primary architecture includes `RegexReceiptOCRAdapter` for high-speed deterministic Colombian receipt parsing with optional dynamic WASM loading as fallback.
- **Web Worker Support in Headless Node Tests**: Node.js test runners need either `Worker` polyfill or direct unit testing of actor logic classes before worker serialization.

---

## 4. Conclusion

The technical architecture and directory layout for `apps/medicaltrip_calendar_app` have been designed and documented in detail in `survey_techstack.md`. The design fulfills all requirements of DDD Hexagonal Architecture, BigInt financial precision, Local-First radical persistence, multi-agent Web Worker concurrency, and Google Calendar / Linear design system. The blueprint is ready for implementation by downstream agents.

---

## 5. Verification Method

To verify the architecture survey and environment:
1. **Inspect Blueprint**:
   ```bash
   cat /Users/miyo123/projects/medicaltrip/.agents/explorer_survey_techstack/survey_techstack.md
   ```
2. **Verify Tooling Paths**:
   ```bash
   export PATH="/Users/miyo123/projects/medicaltrip/.bin/bin:$PATH"
   node -v   # Should output v20.18.0 or v22.x
   npm -v    # Should output 10.8.2
   ```
3. **Verify Target Application Directory**:
   ```bash
   ls -la /Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app
   ```
