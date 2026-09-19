# BRIEFING — 2026-09-19T10:44:45-05:00

## Mission
Extract and document the authoritative specification, REST API contracts, table schemas, and data structures for Supabase Cloud integration across all 5 core operational domains of Medical Trip Colombia S.A.S.

## 🔒 My Identity
- Archetype: SPECIFICATION MINER
- Roles: Teamwork specialist, Specification Miner Survey 2
- Working directory: /Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2
- Original parent: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53 (orchestrator_14)
- Milestone: Supabase Cloud REST API & Schemas Survey

## 🔒 Key Constraints
- Authoritative requirements file: ORIGINAL_REQUEST.md under timestamp 2026-09-19T15:37:50Z.
- Extract exact specification, REST API contracts, table schemas, and data structures for Supabase Cloud integration (URL: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`).
- Document all 5 domains:
  1. `bookings` table schema, columns, foreign keys, payload formats.
  2. `events` table schema, status enums, date format requirements.
  3. `shifts` table schema, hourly rates, signature fields, validations.
  4. `transfers` table schema, driver/vehicle fields, status transitions.
  5. `expenses` and `settlements` schemas, BigInt cents representations, `sha256Seal` generation.
- Identify potential network pitfalls, auth headers (apikey/anon key), RLS policies, error handling.
- Do NOT implement anything — read-only specification extraction.
- Output: `spec.md` and `handoff.md` in working directory, communicate via `send_message`.

## Current Parent
- Conversation ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53
- Updated: not yet

## Task Summary
- **What to build**: Comprehensive technical specification (`spec.md`) and 5-component handoff report (`handoff.md`).
- **Success criteria**: Complete coverage of all 5 domains, exact database schemas, REST endpoints, payloads, HTTP methods, headers, BigInt cents math, SHA-256 seal rules, RLS and network pitfalls.
- **Interface contracts**: Supabase Cloud REST API contracts, `SupabaseStorageAdapter`, domain entity mappings.
- **Code layout**: Read from `apps/medicaltrip_react_app`, `supabase/`, `data/`, write to `.agents/spec_miner_survey_2/`.

## Loaded Skills
- **Source**: `/Users/miyo123/projects/medicaltrip/.agents/skills/patient-creator/SKILL.md`
  - **Local copy**: `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/patient_creator_skill.md`
  - **Core methodology**: Direct deterministic REST API persistence to Supabase Cloud for bookings, events, shifts, transfers, expenses, settlements.

## Key Decisions Made
- Confirmed live PostgreSQL & OpenAPI schema directly on `pxmobokcqhsixfvdsrwj.supabase.co`.
- Documented all 9 tables in the Supabase Cloud database (`bookings`, `events`, `shifts`, `transfers`, `expenses`, `settlements`, `event_stream`, `blobs`, `patient_invitations`, plus `users`).
- Verified PostgREST HTTP 406 (PGRST116) root cause when using `.single()` on empty queries vs `.maybeSingle()`.
- Verified Node.js TLS certificate issue requiring `NODE_TLS_REJECT_UNAUTHORIZED='0'`.
- Verified BigInt cents representation (`cents TEXT`) across all monetary columns.
- Completed `spec.md` and compiling `handoff.md`.

## Artifact Index
- `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/DISPATCH.md` — Dispatch assignment
- `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/BRIEFING.md` — Situational awareness
- `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/progress.md` — Heartbeat and step progress
- `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/spec.md` — Authoritative Supabase Cloud REST API & Schemas Specification
- `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/handoff.md` — 5-Component handoff report
