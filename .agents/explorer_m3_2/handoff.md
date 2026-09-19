# Handoff Report — Milestone 3 (Window 4: Plan Dual Clinical Timeline & Hospital Triage — Features F14, F15)

**Author**: Explorer M3-2  
**Date**: 2026-09-14T20:53:00Z  
**Scope**: Medical Trip Colombia S.A.S. — `apps/medicaltrip_react_app` (Window 4: Plan)  
**Target Files**:
- `apps/medicaltrip_react_app/src/features/medical-plan/domain/PlanContracts.ts` (New domain file)
- `apps/medicaltrip_react_app/src/features/medical-plan/presentation/PlanView.tsx` (Target view for refactoring)
- `apps/medicaltrip_react_app/src/features/medical-plan/index.ts` (Barrel export barrier)
- `apps/medicaltrip_react_app/tests/presentation/PlanViewDualTimeline.test.tsx` (New test suite)

---

## 1. Observation

### 1.1 Current Implementation in `PlanView.tsx`
Inspection of `apps/medicaltrip_react_app/src/features/medical-plan/presentation/PlanView.tsx` (lines 1–224) reveals:
1. **Hero Package Banner** (lines 60–124): Computes package name and duration heuristically from `activeBooking?.notes`:
   ```typescript
   // apps/medicaltrip_react_app/src/features/medical-plan/presentation/PlanView.tsx:22-28
   const packageName = activeBooking?.notes?.includes('Oftalmología')
     ? 'Paquete Oftalmológico & Diagnóstico CIMA (5 Días)'
     : activeBooking?.notes?.includes('Cardio')
     ? 'Chequeo Cardiológico Integral Cardio VID (5 Días)'
     : activeBooking?.notes?.includes('Cirugía')
     ? 'Cirugía Plástica Reconstructiva & Estética (12 Días)'
     : 'Atención Médica Especializada Internacional (5 Días)';
   ```
2. **Clinical Network Card** (lines 126–156): Displays clinic name and address, but hardcodes the assigned doctor and nurse phone:
   ```typescript
   // apps/medicaltrip_react_app/src/features/medical-plan/presentation/PlanView.tsx:151-154
   <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1">
     <span>Médico: <strong className="text-zinc-800 font-semibold">Dr. Marcos Yepes</strong></span>
     <span>Contacto Enfermería: <strong className="text-zinc-800 font-semibold">+57 (4) 444 0000</strong></span>
   </div>
   ```
3. **Accommodation Card** (lines 158–188): Displays `activeBooking?.hotelName || 'Hotel Inntu Laureles'` and street address.
4. **Services Included Card** (lines 190–220): Displays static 6-benefit array (`Flota Privada Aeroturex`, `Acompañamiento Bilingüe Presencial`, `Seguro Médico Internacional`, `Gestión Migratoria Check-Mig`, `Certificado Digital Fit-to-Fly`, `Kit de Bienvenida & Conectividad`).

**Deficiencies Observed**:
- **Zero Dual Timeline**: There is currently NO timeline component rendered inside `PlanView.tsx`. Events from `events` in `useAppContext()` are completely omitted from the DOM.
- **Zero Hospital Triage Emergency Contacts**: There are NO hospital emergency triage cards, NO 24/7 hotline dialer, NO Dra. Jenny Paola Acosta contact card, and NO 1-click WhatsApp triggers (`https://wa.me/...`) or emergency telephone dialers (`tel:...`).

### 1.2 Existing Assertions in Test Suites
Tests in `tests/presentation/AdminCockpitSwitcher.test.tsx` and `tests/presentation/M2MultiWindowSyncChallenger1.test.tsx` inspect `PlanView.tsx` with exact verbatim strings:
```typescript
// tests/presentation/AdminCockpitSwitcher.test.tsx:272-291
// Verify initial PlanView for Catia (Oftalmología CIMA)
await waitFor(() => {
  expect(screen.getByText(/Paquete Oftalmológico/i)).toBeTruthy();
});

// Switch to RVA282 George Cardio via shortcut '2'
fireEvent.keyDown(window, { key: '2' });

// PlanView must update to Chequeo Cardiológico Cardio VID
await waitFor(() => {
  expect(screen.getByText(/Chequeo Cardiológico Integral Cardio VID/i)).toBeTruthy();
  expect(screen.getByText(/Clínica Cardio VID/i)).toBeTruthy();
});

// Switch to RVA077 Alejandra Surgical via shortcut '4'
fireEvent.keyDown(window, { key: '4' });

await waitFor(() => {
  expect(screen.getByText(/Hotel Novelty Suites/i)).toBeTruthy();
});
```
```typescript
// tests/presentation/M2MultiWindowSyncChallenger1.test.tsx:571-573
await waitFor(() => {
  expect(screen.getByText(/Hotel Novelty Suites Poblado/i)).toBeDefined();
});
```
*Crucial Invariant*: Any refactoring of `PlanView.tsx` MUST strictly preserve these strings (`Paquete Oftalmológico`, `Chequeo Cardiológico Integral Cardio VID`, `Clínica Cardio VID`, `Hotel Novelty Suites Poblado`).

### 1.3 Available Empirical Data in Codebase
1. **Empirical Archetype Events** (`src/core/infrastructure/data/archetypes.data.ts`):
   - **RVA171 (Catia Rodrigues)**:
     - `evt-171-1` (`FLIGHT`): Aterrizaje Vuelo Z-Fly Curazao (5 Pax) + Traslado Aeroturex (10:00 - 12:00)
     - `evt-171-2` (`CLINICAL`): Consulta y Exámenes Oftalmología Dr. Peláez (María Rodrigues) en Clínica Clofán (15:00 - 17:30)
     - `evt-171-3` (`PHARMACY`): Parqueadero Torre Médica Clofán Sótano 2 (17:30 - 18:00)
     - `evt-171-4` (`LAB`): Ecografías & Diagnóstico Integral CIMA (06:30 - 14:30) — *Ayuno estricto 8 horas. Muestra de orina recolectada a las 05:30 AM*
     - `evt-171-5` (`PHARMACY`): Compra de Gotas Oftálmicas & Fórmulas Post-Op Cruz Verde (15:00 - 16:00)
   - **RVA282 (George Hernandez)**:
     - `evt-282-1` (`FLIGHT`): Llegada Wingo Curazao 7449 + Entrega SIM Claro en JMC (15:27 - 17:30)
     - `evt-282-2` (`CLINICAL`): Consulta Cardiología & Ecocardiograma Dr. Marcos Yepes en CES Oviedo (09:00 - 12:00)
     - `evt-282-3` (`CLINICAL`): Chequeo Cardiovascular Integral & Doppler en Cardio VID (08:00 - 13:00)
   - **RVA341 (Eduard Hogenboom)**:
     - `evt-341-1` (`FLIGHT`): Llegada Vuelo JMC ➔ Traslado Hotel Inntu Laureles (15:27 - 17:30)
     - `evt-341-2` (`LAB`): Toma de Muestras de Sangre a Domicilio en Habitación Hotel (Ayunas 05:30 AM) con Laboratorio Echavarría (05:30 - 06:30)
     - `evt-341-3` (`CLINICAL`): Consulta Urología en Inglés Dr. Carlos Suárez en CES Oviedo (12:00 - 17:00)
   - **RVA077 (Alejandra Rumai)**:
     - `evt-077-1` (`FLIGHT`): Llegada Vuelo Z-Air Curazao + Traslado Novelty Suites (10:00 - 12:00)
     - `evt-077-2` (`CLINICAL`): Consulta Gastroenterología HPTU Torre B Cons 154 Dr. Mosquera (15:45 - 19:45)
     - `evt-077-3` (`LAB`): Ayudas Diagnósticas Hernán Ocazionez (Tórax, Abdomen, Mama) (09:00 - 13:00)
     - `evt-077-4` (`CLINICAL`): Jornada Quirúrgica & Recuperación Post-Op 12 Horas HPTU (06:00 - 18:00)

2. **Emergency Directory & Triage Network** (`src/features/directory/infrastructure/providers.data.ts` and `UsersView.tsx`):
   - **24/7 Coordinator Hotline**: Carolina Cortázar (`+57 300 123 4567`)
   - **Dirección Médica & Triage Clínico**: Dra. Jenny Paola Acosta (`+57 301 444 1122`), Clínica CIMA / Consultorio 402
   - **Clínica CIMA (El Poblado)**: Calle 7 Sur #42-70, `+57 (4) 444 0000`, WhatsApp `573104440000`
   - **Clínica Medellín (El Poblado / Centro)**: Calle 7 #39-290, `+57 (604) 356 8585`, WhatsApp `573003568585`
   - **Clínica CES (Sede Oviedo / Sede Prado)**: Cra 43A #6S-15 / Calle 58 #50C-2, `+57 (604) 576 5700`, WhatsApp `573180553238`
   - **Hospital Pablo Tobón Uribe (HPTU)**: Calle 78B #69-240, Robledo, `+57 (604) 445 9000`, WhatsApp `573014459000`

### 1.4 Baseline Test Execution Status
Command execution results:
- `npm test`: **123 test files passed, 1180 passed, 0 failed**.
- `npm run typecheck` (`tsc --noEmit`): **0 errors**.
- `npm run build` (`tsc -b && vite build`): **0 errors**, built in 3.79s.

---

## 2. Logic Chain

```
[Observation 1.1: PlanView has no timeline and no emergency triage] 
   + [Observation 1.3: Rich empirical clinical & logistics events exist in AppContext.events]
   + [User Request Requirement 1: Feature F14 Dual Clinical Timeline]
   ──> STEP 1: Must implement a Dual-Track Timeline separating Clinical Pathway from Operational/Logistics Pathway.

[User Request Requirement 2: Feature F15 Hospital Triage Emergency Contacts]
   + [Observation 1.3: 24/7 hotline, Dra. Jenny Acosta, CIMA, Clínica Medellín, CES data in providers.data.ts]
   ──> STEP 2: Must implement a dedicated Hospital Triage & Emergency section with 1-click tel dialers and prefilled WhatsApp links.

[Observation 1.2: Existing tests assert exact package and hotel strings upon archetype switching]
   + [User Request Requirement 4: Reactive State Sync]
   ──> STEP 3: Must preserve existing string matching while reactively computing events and contact links from useAppContext().

[Architecture Rule Check 3: Domain Purity & Boundary Guardrails]
   ──> STEP 4: Define domain types & helpers in src/features/medical-plan/domain/PlanContracts.ts without React or external framework imports.

[UI/UX Standards: Alternativa 10 Radical Functional Minimalism]
   ──> STEP 5: Apply subtle 1px dividers, zero shadow-2xl, tabular-nums font-mono timestamps (e.g. 05:30 AM), min 44px touch targets.
```

### Detailed Blueprint:

### Track Classification (Feature F14)
The events in `events` from `useAppContext()` are split into two parallel tracks:
1. **Track 1: Eje Clínico & Quirúrgico (Clinical Pathway)**:
   - Event categories: `'CLINICAL' | 'LAB'`
   - Milestones: Specialist consultations (Oftalmología Dr. Peláez, Cardiología Dr. Marcos Yepes, Urología Dr. Carlos Suárez, Gastroenterología Dr. Mosquera), surgical operations (HPTU 12-hour surgery, CES Urological surgery), preoperative lab draws in fasting state (Laboratorio Echavarría `05:30 AM`, CIMA ecografías), and Fit-to-Fly medical clearance with Dra. Jenny Acosta.
   - Distinctive UI: Indigo/Sky accents, stethoscope/activity icons, fasting indicator badge (`⚠️ Ayuno estricto 8h / 05:30 AM`).
2. **Track 2: Eje Logístico & Recuperación (Operational & Recovery Logistics)**:
   - Event categories: `'FLIGHT' | 'TRANSFER' | 'HOTEL' | 'PHARMACY'`
   - Milestones: International flights arrival & return, private chauffeur airport transfers (Aeroturex / Kia Sonet / Uber XL), companion shifts (Yenny Roberto, Alejandro Restrepo with Papiamento/Dutch/English support), post-op pharmacy purchases (Cruz Verde), hotel check-in/rest (Hotel Inntu, Park 42, Novelty Suites).
   - Distinctive UI: Emerald/Amber accents, plane/car/pill/building icons, driver/vehicle metadata, recovery status.

### Grouping Strategy: Day-by-Day Dual Swimlanes
Events are grouped by `dayNumber` (Día 1, Día 2, Día 3...).
For each day:
- Left swimlane: Clinical events (`Eje Clínico`). If none scheduled on that day, display an elegant notice (`Día de reposo clínico o recuperación hotelera`).
- Right swimlane: Operational logistics (`Eje Logístico & Terreno`).
- Filter toggle for expert operators: `[Vista Dual Paralela]` | `[Solo Eje Clínico]` | `[Solo Eje Logístico]`.
- Timestamps rendered with `tabular-nums font-mono text-xs font-semibold` (e.g. `05:30 AM`, `09:00 AM`, `15:45 PM`).

### Hospital Triage Emergency Contacts Architecture (Feature F15)
A prominent, tactical emergency card section rendered at the top or dedicated emergency card:
1. **24/7 Coordinator Hotline**:
   - Contact: Carolina Cortázar (Coordinadora de Urgencias Médicas)
   - Call dialer: `<a href="tel:+573001234567" data-testid="emergency-hotline-call">Llamar 24/7</a>`
   - WhatsApp trigger: `<a href="https://wa.me/573001234567?text=..." data-testid="emergency-hotline-wa">WhatsApp Urgencia</a>`
2. **Dirección Médica & Triage Clínico**:
   - Contact: Dra. Jenny Paola Acosta (Directora Médica & Auditoría Clínica)
   - Location: Clínica CIMA / Consultorio 402, Medellín
   - Call dialer: `<a href="tel:+573014441122" data-testid="emergency-dra-acosta-call">Llamar Dra. Acosta</a>`
   - WhatsApp trigger: `<a href="https://wa.me/573014441122?text=..." data-testid="emergency-dra-acosta-wa">WhatsApp Dra. Acosta</a>`
3. **Red Hospitalaria de Urgencias & Triage Acreditado**:
   Three accredited trauma & emergency institutions with 1-click call and WhatsApp:
   - **Clínica CIMA (El Poblado)**:
     - Triage 24h & Quirófano de Urgencias
     - Address: Calle 7 Sur #42-70, El Poblado, Medellín
     - Dialer: `tel:+5744440000` (`+57 (4) 444 0000`)
     - WhatsApp: `https://wa.me/573104440000?text=...`
   - **Clínica Medellín (El Poblado)**:
     - Servicio de Urgencias Adultos & Especialistas
     - Address: Calle 7 #39-290, El Poblado, Medellín
     - Dialer: `tel:+576043568585` (`+57 (604) 356 8585`)
     - WhatsApp: `https://wa.me/573003568585?text=...`
   - **Clínica CES (Sede Prado Centro / Sede Oviedo)**:
     - Central de Urgencias & Triage Institucional CES
     - Address: Calle 58 #50C-2, Prado Centro / Torre Médica Oviedo
     - Dialer: `tel:+576045765700` (`+57 (604) 576 5700`)
     - WhatsApp: `https://wa.me/573180553238?text=...`
   - (Optionally also include **Hospital Pablo Tobón Uribe - HPTU**: `tel:+576044459000`).

Each WhatsApp link dynamically formats:
```typescript
const patientFullName = activeBooking ? `${activeBooking.firstName} ${activeBooking.lastName}` : 'Paciente';
const bookingCode = activeBooking?.code || 'RVA';
const waMessage = `URGENCIA 24/7: Paciente ${patientFullName} (${bookingCode}) requiere valoración inmediata de triage.`;
const waUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMessage)}`;
```

---

## 3. Caveats

1. **Phone Number Formatting in Tests**: Dialers use RFC 3966 format `tel:+57...` without spaces for deterministic testing and mobile OS dialer recognition (`tel:+573001234567`), while display labels format nicely as `+57 (300) 123-4567`.
2. **Timezone Determinism**: ISO timestamps in `archetypes.data.ts` (e.g. `'2026-08-23T05:30:00.000Z'`) should be parsed and formatted cleanly. To guarantee that `05:30 AM` displays consistently in all testing environments regardless of local node timezone, use `timeZone: 'UTC'` or format based on the UTC ISO string substring `05:30 AM`.
3. **No Direct Mutation**: `PlanView` is an operational dashboard view and does not directly mutate bookings or events; it consumes `activeBooking` and `events` from `useAppContext()`.
4. **No Deep Imports**: In compliance with `tests/architecture_boundaries.test.ts`, all exports from `src/features/medical-plan/` must be exposed through `src/features/medical-plan/index.ts`.

---

## 4. Conclusion & Implementation Blueprint

### 4.1 File 1: Domain Contracts
Create `apps/medicaltrip_react_app/src/features/medical-plan/domain/PlanContracts.ts`:
```typescript
/**
 * Medical Trip Colombia S.A.S. - PlanContracts
 * Domain models and contracts for Window 4: Dual Clinical Timeline & Hospital Triage Network.
 * Zero external framework imports (Domain Purity).
 */

export type TimelineTrackType = 'CLINICAL' | 'LOGISTICS';

export interface ClinicalTimelineItem {
  readonly id: string;
  readonly dayNumber: number;
  readonly title: string;
  readonly category: string;
  readonly timeFormatted: string; // e.g., '05:30 AM'
  readonly locationName: string;
  readonly providerName?: string;
  readonly specialist?: string;
  readonly status: string;
  readonly notes?: string;
  readonly isFastingRequired: boolean;
  readonly track: TimelineTrackType;
}

export interface DualTimelineDayGroup {
  readonly dayNumber: number;
  readonly dateFormatted: string;
  readonly clinicalTrack: ClinicalTimelineItem[];
  readonly logisticsTrack: ClinicalTimelineItem[];
}

export interface HospitalTriageFacility {
  readonly id: string;
  readonly name: string;
  readonly level: string;
  readonly address: string;
  readonly zone: string;
  readonly phoneDisplay: string;
  readonly phoneDialer: string; // tel:+57...
  readonly whatsappNumber: string; // 573...
  readonly triageSpecialties: string[];
  readonly isOpen24Hours: boolean;
}

export const MASTER_TRIAGE_FACILITIES: HospitalTriageFacility[] = [
  {
    id: 'FACILITY-CIMA',
    name: 'Clínica CIMA (Sede El Poblado)',
    level: 'Nivel III / Urgencias & Cirugía',
    address: 'Calle 7 Sur #42-70, El Poblado, Medellín',
    zone: 'El Poblado',
    phoneDisplay: '+57 (4) 444 0000',
    phoneDialer: 'tel:+5744440000',
    whatsappNumber: '573104440000',
    triageSpecialties: ['Triage Quirúrgico 24h', 'Ecografía de Urgencia', 'Cuidados Intermedios'],
    isOpen24Hours: true,
  },
  {
    id: 'FACILITY-CLINICA-MEDELLIN',
    name: 'Clínica Medellín (Sede Poblado / Centro)',
    level: 'Alta Complejidad / Triage Adultos',
    address: 'Calle 7 #39-290, El Poblado, Medellín',
    zone: 'El Poblado',
    phoneDisplay: '+57 (604) 356 8585',
    phoneDialer: 'tel:+576043568585',
    whatsappNumber: '573003568585',
    triageSpecialties: ['Urgencias Generales 24/7', 'Pabellón Quirúrgico', 'UCI Adultos'],
    isOpen24Hours: true,
  },
  {
    id: 'FACILITY-CES',
    name: 'Clínica CES (Sede Prado Centro / Oviedo)',
    level: 'Hospital Universitario / Acreditado',
    address: 'Calle 58 #50C-2, Prado Centro / Cr 43A #6S-15 Oviedo',
    zone: 'Prado Centro & Oviedo',
    phoneDisplay: '+57 (604) 576 5700',
    phoneDialer: 'tel:+576045765700',
    whatsappNumber: '573180553238',
    triageSpecialties: ['Triage Institucional CES', 'Urología de Urgencia', 'Valoración Especialistas'],
    isOpen24Hours: true,
  },
  {
    id: 'FACILITY-HPTU',
    name: 'Hospital Pablo Tobón Uribe (HPTU)',
    level: 'Nivel IV / Trauma & Alta Complejidad',
    address: 'Calle 78B #69-240, Robledo, Medellín',
    zone: 'Robledo',
    phoneDisplay: '+57 (604) 445 9000',
    phoneDialer: 'tel:+576044459000',
    whatsappNumber: '573014459000',
    triageSpecialties: ['Centro de Trauma Nivel IV', 'Cirugía Mayor Reconstructiva', 'Hospitalización'],
    isOpen24Hours: true,
  },
];

export interface EmergencyCoordinatorContact {
  readonly name: string;
  readonly roleTitle: string;
  readonly phoneDisplay: string;
  readonly phoneDialer: string;
  readonly whatsappNumber: string;
  readonly location: string;
}

export const EMERGENCY_COORDINATORS = {
  HOTLINE_24_7: {
    name: 'Carolina Cortázar',
    roleTitle: 'Coordinación de Emergencias & Operaciones 24/7',
    phoneDisplay: '+57 (300) 123 4567',
    phoneDialer: 'tel:+573001234567',
    whatsappNumber: '573001234567',
    location: 'Sede Administrativa Medellín · El Poblado',
  },
  MEDICAL_DIRECTOR: {
    name: 'Dra. Jenny Paola Acosta',
    roleTitle: 'Dirección Médica & Triage Clínico Internacional',
    phoneDisplay: '+57 (301) 444 1122',
    phoneDialer: 'tel:+573014441122',
    whatsappNumber: '573014441122',
    location: 'Clínica CIMA / Consultorio 402, Medellín',
  },
};
```

### 4.2 File 2: Updated `PlanView.tsx` Blueprint
Refactor `apps/medicaltrip_react_app/src/features/medical-plan/presentation/PlanView.tsx` to include:
1. **Hero Package Banner**: Keeps existing backward-compatible text checks (`Paquete Oftalmológico`, `Chequeo Cardiológico Integral Cardio VID`, `Cirugía Plástica`, `Atención Médica`).
2. **Hospital Triage Emergency Contacts Section (Feature F15)**:
   - Container with `data-testid="hospital-triage-section"`.
   - Emergency banner with 24/7 Coordinator Hotline (`data-testid="emergency-hotline-call"`, `data-testid="emergency-hotline-wa"`).
   - Medical Director Card (`Dra. Jenny Paola Acosta`) with direct call (`data-testid="dra-acosta-call"`) and WhatsApp (`data-testid="dra-acosta-wa"`).
   - Hospital Triage Grid with CIMA, Clínica Medellín, CES, and HPTU cards. Each card includes badges (`24/7`, `Nivel III/IV`), telephone link (`tel:...`), and WhatsApp link (`https://wa.me/...`) pre-populated with patient and booking context.
3. **Dual Clinical Timeline (Feature F14)**:
   - Container with `data-testid="dual-clinical-timeline"`.
   - Track filter controls: `[Vista Dual Paralela]`, `[Eje Clínico]`, `[Eje Logístico]`.
   - Day-by-day swimlanes:
     - Header: `Día 1`, `Día 2`, etc. with date.
     - **Track 1 (Eje Clínico & Quirúrgico)**: renders clinical & lab events with `tabular-nums font-mono` timestamps (e.g. `05:30 AM`), doctor name, clinic name, and fasting alerts (`⚠️ Ayuno estricto 8 horas`).
     - **Track 2 (Eje Logístico & Recuperación)**: renders flights, transfers, hotel rest, and pharmacy events with `tabular-nums font-mono` timestamps, driver/companion name, and notes.
4. **Clinical Network & Hospital Provider Card**: Dynamically derives clinic and doctor from active booking while retaining strings (`Clínica Cardio VID`, `Clínica Clofán`, `Clínica CIMA`, `Clínica CES`).
5. **Hotel & Recovery Accommodation Card**: Retains strings (`Hotel Inntu Laureles`, `Hotel Novelty Suites Poblado`, `Edificio Park 42`).
6. **Services Included Card**: Retains the 6 included benefits.

### 4.3 File 3: Public Barrier `index.ts`
`apps/medicaltrip_react_app/src/features/medical-plan/index.ts`:
```typescript
export * from './presentation/PlanView';
export * from './domain/PlanContracts';
```

---

## 5. Verification Method

### 5.1 Independent Test Suite
Create `apps/medicaltrip_react_app/tests/presentation/PlanViewDualTimeline.test.tsx` testing:
1. **F14 Dual Clinical Timeline**:
   - Verify `Track 1 (Eje Clínico)` displays appointments (Clofán Oftalmología, CIMA ecografías, Cardio VID, CES Urología, HPTU).
   - Verify `05:30 AM` fasting timestamp appears for RVA171 and RVA341 with `tabular-nums font-mono`.
   - Verify `Track 2 (Eje Logístico)` displays airport arrivals, Uber XL/Aeroturex transfers, and Cruz Verde pharmacy purchases alongside clinical track.
   - Verify track filtering buttons (`[Vista Dual]`, `[Eje Clínico]`, `[Eje Logístico]`).
2. **F15 Hospital Triage Emergency Contacts**:
   - Verify `data-testid="hospital-triage-section"` renders.
   - Verify 24/7 Hotline dialer `tel:+573001234567` and pre-populated WhatsApp link `https://wa.me/573001234567?text=...`.
   - Verify Dra. Jenny Paola Acosta contact dialer `tel:+573014441122` and WhatsApp `https://wa.me/573014441122?text=...`.
   - Verify hospital triage cards for Clínica CIMA, Clínica Medellín, and Clínica CES with valid `tel:` and `https://wa.me/` URLs.
3. **Reactive State Sync**:
   - Switching from Catia (RVA171) to George (RVA282) synchronously updates timeline events to Cardio VID / CES Oviedo and updates prefilled WhatsApp messages to include `George Hernandez (RVA282-5)`.
   - Switching to Eduard (RVA341) displays the 05:30 AM home lab blood draw at Hotel Inntu Room 1004.
   - Switching to Alejandra (RVA077) displays the 12-hour surgery at HPTU and Hotel Novelty Suites.
4. **Zero Regressions**:
   - Run `npm test -- AdminCockpitSwitcher` -> must pass 100%.
   - Run `npm test -- M2MultiWindowSyncChallenger1` -> must pass 100%.
   - Run `npm test -- architecture_boundaries` -> must pass 100%.
   - Run `npm run typecheck` -> must pass with 0 errors.

### 5.2 Commands to Run
```bash
cd apps/medicaltrip_react_app
npm test -- PlanView
npm test -- AdminCockpitSwitcher
npm test -- architecture_boundaries
npm run typecheck
npm run build
```

### 5.3 Invalidation Conditions
- Any removal of existing test strings (`Paquete Oftalmológico`, `Chequeo Cardiológico Integral Cardio VID`, `Clínica Cardio VID`, `Hotel Novelty Suites`) invalidates this handoff.
- Any direct import of `react` or `lucide-react` inside `src/features/medical-plan/domain/` violates Check 3 of `architecture_boundaries.test.ts` and invalidates this handoff.
- Any use of `shadow-2xl` or neon gradients violates Radical Functional Minimalism.
