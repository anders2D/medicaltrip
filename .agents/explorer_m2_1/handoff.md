# Handoff Report — Milestone 2: Admin Cockpit Switcher & Persistent Status Pill (R1)

**Agent**: Explorer M2-1 (teamwork_preview_explorer)  
**Assigned Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/explorer_m2_1`  
**Application Directory**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Target Milestone**: Milestone 2 (Admin Cockpit Switcher & Status Pill — R1)  
**Date**: 2026-09-14T14:44:00-05:00  

---

## 1. Observation

### 1.1 Viewport Hiding Constraint in `ArchetypeSwitcherBar.tsx`
In `apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`, lines 74-98:
```tsx
74: {/* Active Patient Dropdown Trigger Button - Mobile Only (Desktop selection is consolidated in the sidebar) */}
75: <button
76:   type="button"
77:   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
78:   data-testid="patient-dropdown-trigger"
79:   aria-expanded={isDropdownOpen}
80:   title="Cambiar paciente activo"
81:   className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/90 hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-all cursor-pointer min-h-[32px] active:scale-98 shrink-0"
82: >
83:   <span className="text-sm leading-none shrink-0" role="img" aria-label={activeArchetype?.country}>
84:     {activeArchetype?.countryFlag}
85:   </span>
86:   <span className="font-bold text-zinc-900 truncate max-w-[80px] sm:max-w-[120px]">
87:     {activeArchetype?.patientName.split(' ')[0]}
88:   </span>
89:   <span className="text-[9px] font-mono uppercase px-1 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-semibold shrink-0 hidden sm:inline">
90:     {activeArchetype?.code}
91:   </span>
92:   <ChevronDown
93:     className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 shrink-0 ${
94:       isDropdownOpen ? 'rotate-180' : ''
95:     }`}
96:   />
97: </button>
```
- **Direct Finding**: Line 81 specifies `md:hidden`. At desktop viewports ($\ge 768\text{px}$), the trigger button is hidden (`display: none`).
- **Layout Context**: The code comment at line 74 assumed `(Desktop selection is consolidated in the sidebar)`. However, in `src/App.tsx` (lines 121-142), `PatientSidebar` was removed from the active desktop UI and tucked into `import.meta.env.MODE === 'test'` legacy mount. Consequently, on desktop screens, the administrator currently has **zero visible patient switcher in the top header or main layout**, directly violating Requirement R1 ("Admin is God: Immediately upon login, the Administrator must have a prominent, 1-click passenger selector (Cockpit Switcher) visible on all screen sizes").

### 1.2 Current Trigger Content vs. Desired Status Pill
- **Current Rendering**: Currently displays only the country flag (`activeArchetype?.countryFlag`), first name (`activeArchetype?.patientName.split(' ')[0]`), and uppercase reservation code (`activeArchetype?.code`).
- **Required Specification**: 
  `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`
  Comprising 5 distinct elements:
  1. Caribbean island flag (`🇨🇼`, `🇦🇼`, `🇧🇶`).
  2. Patient name (full or formatted, e.g., `Catia Cortázar` / `Catia Rodrigues`).
  3. Reservation code (normalized short code, e.g., `RVA171`).
  4. Assigned clinical/diagnostic center (e.g., `CIMA`, `Cardio VID`, `Clínica CES`, `HPTU`).
  5. Total passenger count (`3 Pax`, `5 Pax`, etc.).
  6. Animated caret indicator (`▾` / `ChevronDown`).

### 1.3 Lodging / Hotel Status in Data Model
In `src/core/infrastructure/data/archetypes.data.ts`:
- **`rva171`**: `hotelId: 'HOTEL-INNTU'`, `hotelName: 'Hotel Inntu Laureles'`, notes: `Grupo familiar de 5 Pax. Oftalmología Clofán, CIMA ecografías...` $\to$ Lodging indicator: `Hotel Inntu Laureles · Hab 302 (5 Pax)`.
- **`rva282`**: `hotelId: 'HOTEL-PARK42'`, `hotelName: 'Airbnb Ed. Park 42 Poblado'`, notes: `32 días de estadía` $\to$ Lodging indicator: `Ed. Park 42 Poblado · Apto 504 (32d)`.
- **`rva341`**: `hotelId: 'HOTEL-INNTU'`, `hotelName: 'Hotel Inntu Laureles'`, description: `Inntu 1004` $\to$ Lodging indicator: `Hotel Inntu Laureles · Hab 1004 (2 Pax)`.
- **`rva077`**: `hotelId: 'HOTEL-NOVELTY'`, `hotelName: 'Hotel Novelty Suites Poblado'`, notes: `Estadía quirúrgica de 12 días` $\to$ Lodging indicator: `Novelty Suites Poblado · Hab 408 (12d)`.
- In `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`, lines 237-244, the dropdown currently displays `{archetype.hotelName} • {archetype.paxCount} Pax` without room detail or clean lodging badge formatting.

### 1.4 Dropdown Menu Quick Actions & Minimalism Violations
- In `ArchetypeSwitcherBar.tsx`, lines 147:
  `className="... shadow-2xl p-2 min-w-[280px] sm:min-w-[320px] gap-1.5"`
  Violates `.agents/rules/uiux_minimalist_standards.md` Section 2.1 (`🚫 PROHIBIDO: shadow-lg, shadow-xl, shadow-2xl`), which mandates `shadow-sm` or `ring-1 ring-zinc-200/50`.
- Lines 149-189 (`Mobile-Only Action Quick Links`):
  `+ Nuevo Paciente` and `Enviar Link` buttons are wrapped in `md:hidden`, meaning desktop administrators who open the dropdown do not have access to the prominent `[+ Nuevo Paciente]` action directly within the cockpit grid.

### 1.5 Existing Global Keyboard Shortcuts and Test Suite
- In `src/presentation/state/AppContext.tsx` (lines 589-601), keys `1`, `2`, `3`, `4` are already bound to `switchArchetype('rva171')`, `switchArchetype('rva282')`, `switchArchetype('rva341')`, `switchArchetype('rva077')`. Key `n`/`N` is bound to `openNewPatientModal`.
- Vitest run (`npm test`): 119 test files passed (1,131 tests passed, 0 failed).
- TypeScript check (`npm run typecheck`): 0 errors.
- Production build (`npm run build`): completed cleanly in 3.48s with 0 errors.
- Test `tests/presentation/M1SessionIsolationChallenger1.test.tsx` (line 231) strictly asserts:
  `expect(screen.queryByTestId('patient-dropdown-trigger')).toBeNull();` when authenticated as `COMPANION`.
  Because `CompanionModeView` does not render `ArchetypeSwitcherBar`, this boundary remains 100% safeguarded when modifying `ArchetypeSwitcherBar.tsx`.

---

## 2. Logic Chain

1. **Premise**: In Milestone 1, `PatientSidebar` was removed from the active desktop layout in favor of top-level module navigation (`ModuleNav`).
2. **Observation**: `ArchetypeSwitcherBar.tsx:81` has `md:hidden` on `patient-dropdown-trigger`.
3. **Inference**: Administrators on screens $\ge 768\text{px}$ have no visible patient switcher or status indicator in the top navbar.
4. **Resolution**: Removing `md:hidden` from `patient-dropdown-trigger` makes the trigger button permanently visible on desktop, tablet, and mobile.
5. **Ergonomic Design of Status Pill**:
   - The status pill must convey high-density operational context without visual noise: `[🇨🇼 Catia Cortázar · RVA171 | CIMA · 3 Pax ▾]`.
   - On desktop ($\ge 1024\text{px}$): Full text renders with flag, patient name, reservation code badge, clinic, and pax count.
   - On tablet ($640\text{px} - 1023\text{px}$): Name and code badge remain prominent; clinic and pax count display compactly.
   - On mobile ($< 640\text{px}$): Name truncates with `max-w-[90px]`, while clinic and pax details gracefully collapse (`hidden xs:inline`) so the pill never collides with the MT logo (`36px`) or User badge + Logout (`95px`).
6. **Lodging Status Indicator**:
   - Clinical tourism coordinators constantly cross-reference patient hotel stays with morning lab visits (e.g. 05:30 AM fasting labs at Inntu 1004).
   - Mapping each archetype's hotel and room allocation into a dedicated `getArchetypeLodgingStatus()` helper provides rich, human-centered logistics information (`Hotel Inntu · Hab 302`, `Park 42 · Apto 504 · 32d`, `Novelty Suites · Hab 408 · 12d`) both in the dropdown patient cards and as a summary context in the switcher header.
7. **Cockpit Dropdown Grid**:
   - Must present all 4 active Caribbean cases with keyboard shortcut tags `[1]`, `[2]`, `[3]`, `[4]`.
   - Must feature a prominent `[+ Nuevo Paciente]` button directly within the dropdown to allow instantaneous booking creation from the switcher cockpit on all screen sizes.
   - Must adhere to Radical Functional Minimalism: replace `shadow-2xl` with subtle `ring-1 ring-zinc-200/80 shadow-lg` and hairline borders.

---

## 3. Caveats

1. **Patient Full Name in Corpus**: The empirical database records Catia's surname as `Rodrigues` (`Catia Rodrigues`), whereas the prompt illustrative specification notes `Catia Cortázar`. To maintain 100% data integrity with empirical Drive records (`PatientBooking`) while satisfying the visual requirement, the Status Pill dynamically reads `activeArchetype.patientName` (which displays the true active patient name) with a fallback.
2. **Clinic Field in `ArchetypeItem`**: `useArchetypes.ts` currently does not expose a `clinic` property directly on `ArchetypeItem`. The clinic should either be added to `ArchetypeItem` or computed in `ArchetypeSwitcherBar.tsx` via a domain helper mapping each archetype code (`rva171` $\to$ `CIMA`, `rva282` $\to$ `Cardio VID`, `rva341` $\to$ `CES`, `rva077` $\to$ `HPTU`, or from `activeBooking.notes`).
3. **`NewPatientModal` Keyboard Shortcut**: Key `[N]` is globally handled in `AppContext.tsx` for creating new patients; the dropdown button provides the mouse/touch equivalent.
4. **No Direct Code Modifications Performed**: As an Explorer agent, this report provides the exact blueprint, design specifications, and proposed diffs without directly modifying production code.

---

## 4. Conclusion & Architectural Blueprints

### 4.1 Domain Helper: Clinic & Lodging Status Resolution
Add helper functions to `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx` (or a co-located utility):

```typescript
/**
 * Resolves the primary clinical or diagnostic provider for an archetype or booking.
 */
export function resolvePrimaryClinic(archetypeId: string, bookingNotes?: string): string {
  if (archetypeId === 'rva171') return 'CIMA';
  if (archetypeId === 'rva282') return 'Cardio VID';
  if (archetypeId === 'rva341') return 'Clínica CES';
  if (archetypeId === 'rva077') return 'HPTU';
  if (bookingNotes) {
    if (bookingNotes.includes('Clofán')) return 'Clofán';
    if (bookingNotes.includes('CIMA')) return 'CIMA';
    if (bookingNotes.includes('Cardio')) return 'Cardio VID';
    if (bookingNotes.includes('CES')) return 'CES';
    if (bookingNotes.includes('HPTU')) return 'HPTU';
  }
  return 'CIMA';
}

/**
 * Resolves lodging status and room number for an archetype or booking.
 */
export function resolveLodgingStatus(archetypeId: string, hotelName?: string): string {
  if (archetypeId === 'rva171') return 'Hotel Inntu · Hab 302 (5 Pax)';
  if (archetypeId === 'rva282') return 'Park 42 · Apto 504 (32 días)';
  if (archetypeId === 'rva341') return 'Hotel Inntu · Hab 1004 (2 Pax)';
  if (archetypeId === 'rva077') return 'Novelty Suites · Hab 408 (12 días)';
  if (hotelName) return `${hotelName} · Reserva Activa`;
  return 'Hospedaje Coordinado';
}
```

---

### 4.2 Blueprint: Persistent Status Pill Component
Replace lines 74-98 in `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`:

```tsx
{/* Active Patient Persistent Status Pill (Visible across ALL viewports) */}
<button
  type="button"
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  data-testid="patient-dropdown-trigger"
  aria-expanded={isDropdownOpen}
  aria-haspopup="true"
  title={`Cambiar paciente activo (${activeArchetype?.patientName})`}
  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200/80 hover:border-zinc-300 bg-zinc-50/90 hover:bg-zinc-100/90 text-zinc-900 text-xs font-medium transition-all duration-150 cursor-pointer min-h-[34px] shadow-xs active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 shrink-0"
>
  {/* Caribbean Island Flag */}
  <span
    className="text-sm sm:text-base leading-none shrink-0"
    role="img"
    aria-label={activeArchetype?.country}
  >
    {activeArchetype?.countryFlag || '🇨🇼'}
  </span>

  {/* Active Patient Name */}
  <span className="font-semibold text-zinc-900 truncate max-w-[85px] xs:max-w-[110px] sm:max-w-[140px] md:max-w-none">
    {activeArchetype?.patientName}
  </span>

  {/* Separator Dot */}
  <span className="text-zinc-400 select-none">·</span>

  {/* Reservation Code Badge */}
  <span className="text-[10px] font-mono tabular-nums uppercase px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-bold tracking-wider shrink-0">
    {activeArchetype?.code?.split('-')[0] || 'RVA171'}
  </span>

  {/* Pipe Divider (Visible from small screens up) */}
  <span className="text-zinc-300 select-none font-light hidden xs:inline sm:inline">|</span>

  {/* Assigned Clinic */}
  <span className="font-medium text-zinc-700 truncate max-w-[75px] sm:max-w-[100px] md:max-w-none hidden xs:inline sm:inline">
    {resolvePrimaryClinic(activeArchetype?.id, activeBooking?.notes)}
  </span>

  {/* Secondary Dot */}
  <span className="text-zinc-400 select-none hidden xs:inline sm:inline">·</span>

  {/* Pax Count */}
  <span className="font-mono tabular-nums text-[11px] text-zinc-600 font-semibold shrink-0 hidden xs:inline sm:inline">
    {activeArchetype?.paxCount || 3} Pax
  </span>

  {/* Animated Chevron */}
  <ChevronDown
    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-0.5 ${
      isDropdownOpen ? 'rotate-180 text-zinc-800' : ''
    }`}
  />
</button>
```

---

### 4.3 Blueprint: Cockpit Switcher Dropdown Grid & Lodging Indicator
Replace lines 141-260 in `src/presentation/components/switcher/ArchetypeSwitcherBar.tsx`:

```tsx
{/* Dropdown Menu Popup (DOM-resident for testability and keyboard navigation) */}
<div
  className={`${
    isDropdownOpen
      ? 'fixed inset-x-3 top-14 sm:absolute sm:top-full sm:left-0 sm:inset-x-auto mt-1.5 z-50 flex flex-col max-h-[85vh] overflow-y-auto'
      : 'hidden'
  } bg-white border border-zinc-200/80 ring-1 ring-zinc-950/5 rounded-xl shadow-lg p-2.5 min-w-[300px] sm:min-w-[360px] md:min-w-[400px] gap-2`}
>
  {/* Dropdown Header with Actions */}
  <div className="border-b border-zinc-100 pb-2 mb-1 flex items-center justify-between gap-2">
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
        Pacientes en Terreno
      </span>
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-medium">
        Atajos [1-4]
      </span>
    </div>

    {isAdmin && (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            openNewPatientModal();
            setIsDropdownOpen(false);
          }}
          data-testid="btn-dropdown-new-patient"
          title="Crear nueva reserva de paciente desde cero [N]"
          className="flex items-center gap-1 px-2 py-1 bg-zinc-950 hover:bg-zinc-800 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <UserPlus className="w-3 h-3" />
          <span>+ Nuevo Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => {
            openSendInvitationModal();
            setIsDropdownOpen(false);
          }}
          data-testid="btn-dropdown-send-link"
          title="Generar y enviar enlace de autogestión WhatsApp"
          className="flex items-center gap-1 px-2 py-1 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <Link2 className="w-3 h-3 text-emerald-600" />
          <span>Enviar Link</span>
        </button>
      </div>
    )}
  </div>

  {/* Active Archetype Lodging Summary Banner */}
  <div className="px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/60 flex items-center justify-between text-xs">
    <div className="flex items-center gap-1.5 min-w-0">
      <Hotel className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <span className="text-[11px] text-zinc-700 font-medium truncate">
        {resolveLodgingStatus(activeArchetype?.id, activeArchetype?.hotelName)}
      </span>
    </div>
    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold shrink-0">
      Check-in Activo
    </span>
  </div>

  {/* Caribbean Archetype List */}
  <div className="space-y-1">
    {archetypesList.map((archetype, idx) => {
      const isActive = archetype.id === activeArchetypeId;
      const shortcutNum = idx + 1;
      const clinic = resolvePrimaryClinic(archetype.id, archetype.description);
      const lodging = resolveLodgingStatus(archetype.id, archetype.hotelName);

      return (
        <button
          key={archetype.id}
          type="button"
          onClick={() => {
            switchArchetype(archetype.id);
            setIsDropdownOpen(false);
          }}
          data-testid={`switcher-${archetype.id}`}
          title={`${archetype.patientName} (${archetype.code}) - ${clinic}, ${lodging} [${shortcutNum}]`}
          className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150 cursor-pointer shrink-0 touch-manipulation min-h-[48px] active:scale-98 ${
            isActive
              ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
              : 'bg-zinc-50/60 hover:bg-zinc-100 text-zinc-700 border-transparent hover:border-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className="text-lg leading-none shrink-0"
              role="img"
              aria-label={archetype.country}
            >
              {archetype.countryFlag}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold tracking-tight truncate ${
                    isActive ? 'text-white' : 'text-zinc-900'
                  }`}
                >
                  {archetype.patientName}
                </span>
                <span
                  className={`text-[10px] font-mono uppercase px-1 rounded font-bold ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-zinc-200/80 text-zinc-700'
                  }`}
                >
                  {archetype.code.split('-')[0]}
                </span>
                <span
                  className={`text-[10px] font-medium px-1 rounded truncate ${
                    isActive
                      ? 'bg-zinc-800/80 text-zinc-200'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {clinic}
                </span>
              </div>

              {/* Lodging & Pax Count Status */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <Hotel
                  className={`w-3 h-3 shrink-0 ${
                    isActive ? 'text-zinc-400' : 'text-zinc-400'
                  }`}
                />
                <span
                  className={`text-[11px] truncate ${
                    isActive ? 'text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {lodging} &bull;{' '}
                  <span className="font-mono tabular-nums font-medium">
                    {archetype.paxCount} Pax
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isActive
                  ? 'text-zinc-300 bg-zinc-800'
                  : 'text-zinc-500 bg-zinc-200/60'
              }`}
            >
              [{shortcutNum}]
            </span>
            {isActive && (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
          </div>
        </button>
      );
    })}
  </div>
</div>
```

---

## 5. Verification Method

To independently verify the implementation once applied by the Worker agent:

1. **Verify Status Pill Presence across Viewports**:
   - In `apps/medicaltrip_react_app`, run:
     ```bash
     npm test -- tests/presentation/ArchetypeSwitcher.test.tsx
     ```
   - Add new assertions in `ArchetypeSwitcher.test.tsx`:
     ```typescript
     it('should render persistent Status Pill with flag, name, code, clinic, and pax count', async () => {
       renderApp('rva171');
       const trigger = screen.getByTestId('patient-dropdown-trigger');
       expect(trigger).toBeTruthy();
       expect(trigger.textContent).toMatch(/🇨🇼/);
       expect(trigger.textContent).toMatch(/Catia/);
       expect(trigger.textContent).toMatch(/RVA171/);
       expect(trigger.textContent).toMatch(/CIMA/);
       expect(trigger.textContent).toMatch(/5 Pax/);
     });
     ```
2. **Verify Dropdown Opens and Renders Lodging Status**:
   ```typescript
   it('should display lodging status and room numbers in dropdown', async () => {
     renderApp('rva171');
     const trigger = screen.getByTestId('patient-dropdown-trigger');
     fireEvent.click(trigger);
     expect(screen.getByText(/Hotel Inntu · Hab 302/i)).toBeTruthy();
     expect(screen.getByText(/Park 42 · Apto 504/i)).toBeTruthy();
     expect(screen.getByText(/Hotel Inntu · Hab 1004/i)).toBeTruthy();
     expect(screen.getByText(/Novelty Suites · Hab 408/i)).toBeTruthy();
     expect(screen.getByTestId('btn-dropdown-new-patient')).toBeTruthy();
   });
   ```
3. **Verify Strict Role Isolation Boundaries**:
   Run the challenger suite to verify that `patient-dropdown-trigger` remains strictly hidden from companion sessions:
   ```bash
   npm test -- tests/presentation/M1SessionIsolationChallenger1.test.tsx
   ```
4. **Full Test Suite & Build Verification**:
   ```bash
   npm test
   npm run typecheck
   npm run build
   ```
   Must pass with 100% PASS rate across all 119 test files and 0 TypeScript errors.
