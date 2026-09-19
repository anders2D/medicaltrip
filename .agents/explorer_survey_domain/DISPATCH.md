## 2026-08-23T15:30:55Z

You are the Domain & Specifications Mining Explorer for the Medical Trip Calendar & Settlement App.
Your working directory is `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_domain`.
The original request is at `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md`.

Your objective:
1. Read `/Users/miyo123/projects/medicaltrip/.agents/ORIGINAL_REQUEST.md` (especially requirement under `## 2026-08-23T15:29:39Z`).
2. Search and analyze the codebase `/Users/miyo123/projects/medicaltrip` (including `data/`, `methodology/`, other apps if any) to extract:
   - Complete domain entities and rules: `ENT-PAX`, `RVA`, `CTZ`, `DRV` (Aeroturex sedans, Uber XL, routes, fixed driver rates), `GUIA` (hourly rate $15.500/h, prep allowance $15.500, meal subsidy tiers $8k, $25k, $35k, $45k), `CLINIC`/`LAB` (HPTU, Clofán, CIMA, Cardio VID, CES Oviedo, Echavarría lab), `HOTEL` (Inntu Laureles, Park 42 Poblado, Novelty Suites, Villa Anita).
   - Detail the 4 real-world Drive archetypes:
     * `RVA171 Catia x5` (5 pax, Curacao/Papiamento, plastic surgery + dental, multi-day itinerary, Inntu Laureles, drivers, guides, cash advances & expenses).
     * `RVA282 George Cardio` (Cardio VID, cardiac evaluation, USA/English, Park 42).
     * `RVA341 Eduard CES` (CES Oviedo, Dutch/English, Aruban patient, ophthalmology/rehab).
     * `RVA077 Rumai 12d` (12-day extensive surgical & recovery journey, Novelty Suites / Villa Anita, multi-stage settlement).
   - Extract domain invariants: `OperativeTerritory` allowed cities (Medellín, Rionegro, Envigado, Sabaneta, Itagüí, Bello, etc.) vs. forbidden/non-operative territories (Mocoa, Leticia, etc. which must trigger fail-fast domain errors).
   - Financial calculation rules: Martin Fowler Money Pattern (BigInt integer cents, zero IEEE-754 floats), calculation formula (Out-of-Pocket + Companion Fees + Fleet Taxis - Cash Advances = Net Balance).
3. Write a comprehensive report `survey_domain.md` in `/Users/miyo123/projects/medicaltrip/.agents/explorer_survey_domain/survey_domain.md` and a handoff report `handoff.md`.
4. Message back the orchestrator when complete with summary and artifact path.
