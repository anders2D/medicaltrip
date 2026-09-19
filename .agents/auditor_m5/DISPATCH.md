# DISPATCH — 2026-08-23T11:02:00Z

## Assignment: Final Forensic Integrity Auditor for Medical Trip Calendar & Settlement App
- Working directory: `/Users/miyo123/projects/medicaltrip/.agents/auditor_m5`
- Target app directory: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app`
- Master project blueprint: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_calendar_app/PROJECT.md`
- Original request: `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`

## Mission
1. Static analysis: Scan the entire project for hardcoded expected test outputs, dummy implementations, facade stubs, bypassed invariants, or fabricated logs.
2. Arithmetic integrity: Verify that all financial transactions and balances execute genuine BigInt integer cents math with zero IEEE-754 floats.
3. Territory integrity: Verify that `OperativeTerritory` genuinely enforces fail-fast rejection for forbidden zones (e.g. Mocoa) across all layers.
4. Concurrency & persistence authenticity: Confirm authentic Dexie IndexedDB schemas, genuine Web Worker actor subagents on MessageChannels, CRDT sync, and SHA-256 blockchain ledger chaining.
5. Provide forensic analysis and verdict (`CLEAN` or `INTEGRITY VIOLATION`) in `/Users/miyo123/projects/medicaltrip/.agents/auditor_m5/handoff.md`.
6. Message back the orchestrator with your verdict.
