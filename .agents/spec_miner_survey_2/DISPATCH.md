# Task Assignment: Spec Miner Survey 2 (Supabase Cloud REST API & Schemas)

You are Spec Miner Survey 2 for Medical Trip Colombia.
Working Directory: /Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/
Parent: orchestrator_14 (Conversation ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53)

Authoritative Requirements File:
/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (under timestamp 2026-09-19T15:37:50Z)

## Objective
Extract the exact specification, REST API contracts, table schemas, and data structures for Supabase Cloud integration:
- Supabase URL: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- Inspect `SupabaseStorageAdapter`, environment files, migrations, or schema definitions in `apps/medicaltrip_react_app` and `supabase/` or `data/`.
- Document all 5 domains:
  1. `bookings` table schema, columns, foreign keys, payload formats.
  2. `events` table schema, status enums, date format requirements.
  3. `shifts` table schema, hourly rates, signature fields, validations.
  4. `transfers` table schema, driver/vehicle fields, status transitions.
  5. `expenses` and `settlements` schemas, BigInt cents representations, `sha256Seal` generation.
- Identify potential network pitfalls, auth headers (apikey/anon key), RLS policies, and error handling.

## Output
Write a detailed spec to `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/spec.md` and deliver `handoff.md`.
Communicate back via send_message to recipient c6e995c5-1c0c-40ce-93e1-5a0f55a42e53.

## 2026-09-19T15:39:56Z
You are Spec Miner Survey 2 for Medical Trip Colombia.
Your working directory is: /Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/
Read your task instructions at: /Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/DISPATCH.md
MANDATORY: Read the authoritative requirements file at: /Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md (specifically under timestamp 2026-09-19T15:37:50Z).

Extract the exact specification, REST API contracts, table schemas, and data structures for Supabase Cloud integration:
- Supabase URL: `https://pxmobokcqhsixfvdsrwj.supabase.co/rest/v1`
- Inspect `SupabaseStorageAdapter`, environment files, migrations, or schema definitions in `apps/medicaltrip_react_app` and `supabase/` or `data/`.
- Document all 5 domains:
  1. `bookings` table schema, columns, foreign keys, payload formats.
  2. `events` table schema, status enums, date format requirements.
  3. `shifts` table schema, hourly rates, signature fields, validations.
  4. `transfers` table schema, driver/vehicle fields, status transitions.
  5. `expenses` and `settlements` schemas, BigInt cents representations, `sha256Seal` generation.
- Identify potential network pitfalls, auth headers (apikey/anon key), RLS policies, and error handling.

Write a detailed spec to `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/spec.md` and your handoff to `/Users/miyo123/projects/medicaltrip/.agents/spec_miner_survey_2/handoff.md`.
When done, notify your parent (orchestrator_14, ID: c6e995c5-1c0c-40ce-93e1-5a0f55a42e53) using send_message with a brief summary and path to your handoff.
