## 2026-08-23T15:30:55Z
You are the Technical Stack & Architecture Explorer for the Medical Trip Calendar & Settlement App.
Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_techstack`.
The target app directory is `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`.
The original request is at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.

Your objective:
1. Read `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.
2. Inspect `/Users/miyo123/projects/medicaltrip` to check the environment, Node.js version, package managers (pnpm / npm / yarn), existing libraries, tooling, and the target directory `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`.
3. Design the technical architecture and directory structure for the standalone web application:
   - Hexagonal Architecture (Ports & Adapters):
     * `domain/`: Pure TypeScript entities, value objects (Money BigInt, OperativeTerritory), invariants (zero framework/external dependencies).
     * `application/`: Ports (interfaces for repository, multi-agent bus, OCR, storage), use cases (ScheduleEvent, RescheduleMilestone, SettleItinerary, ProcessReceiptOCR, SignOffItinerary).
     * `infrastructure/`: Adapters (Dexie/IndexedDB, Web Worker Actor Swarm, OCR mock/tesseract adapter, Canvas signature adapter, LocalStorage, PWA Service Worker).
     * `presentation/`: React + Vite + TypeScript + Tailwind CSS (Google Calendar / Linear design system).
   - Actor Model Swarm Concurrency in Web Workers ([DRV], [GUIA], [NURSE], [FIN]) with MessageChannel and CRDT / cryptographic hash chain.
   - Build, bundling, and testing configuration (Vite, Vitest, Playwright/E2E, TypeScript strict mode).
4. Write a comprehensive technical blueprint `survey_techstack.md` in `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_techstack/survey_techstack.md` and a handoff report `handoff.md`.
5. Message back the orchestrator when complete with summary and artifact path.
