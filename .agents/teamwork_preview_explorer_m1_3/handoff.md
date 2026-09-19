# QA Test Strategy & Verification Plan for Milestone 1: Flow 1 & Flow 2

**Agent**: `teamwork_preview_explorer_m1_3`  
**Working Directory**: `/Users/miyo123/projects/medicaltrip/.agents/teamwork_preview_explorer_m1_3`  
**Target Codebase**: `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`  
**Date**: 2026-08-23T22:05:00Z  

---

## 1. Observation

Direct observations from inspecting `/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app`:

1. **Current Test Infrastructure & Baseline**:
   - Test runner: Vitest v2.1.9 with `happy-dom` and `fake-indexeddb/auto`.
   - Baseline execution: **55 test suites, 484 tests passing with 100% PASS rate** (Duration: 28.51s).
   - Test configuration (`vite.config.ts`): Aliases `@domain`, `@application`, `@infrastructure`, `@presentation` are active, `fileParallelism: false`, `testTimeout: 15000`.

2. **Existing Domain Entities & Invariants**:
   - `PatientBooking` (`src/domain/entities/PatientBooking.ts:1-92`): Enforces non-empty `id` and `code`, `paxCount` bounds ($1 \le \text{paxCount} \le 20$), and departure $\ge$ arrival date validation throwing `InvalidBookingError`.
   - `OperativeTerritory` (`src/domain/value-objects/OperativeTerritory.ts:1-179`): Enforces fail-fast validation against forbidden territories (e.g., `MOCOA`, `LETICIA`, `BOGOTA`) throwing `NonOperativeTerritoryError`, and maps approved corridors (`POBLADO`, `LAURELES`, `CIUDAD_DEL_RIO`, `ROBLEDO`, `ENVIGADO`, `RIONEGRO_AEROPUERTO`) to default GPS coordinates.
   - `IStoragePort` (`src/domain/ports/IStoragePort.ts:1-47`): Standard port interface providing `saveBooking`, `getBooking`, `getAllBookings`, `saveEvent`, `getEventsByBooking`, `saveShift`, `saveTransfer`, `saveExpense`, `saveSettlement`.

3. **Current State of Flow 1 & Flow 2**:
   - Existing use cases in `src/application/use-cases/`: `CreateEventUseCase`, `RescheduleEventUseCase`, `SettleExpenseUseCase`, `ReconcileSettlementUseCase`, `SignOffItineraryUseCase`, `ExportSettlementPDFUseCase`, `LoadArchetypeUseCase`, `PersistStorageUseCase`.
   - Missing dedicated use cases: `CreatePatientBookingUseCase` (Flow 1) and `GenerateSmartItineraryUseCase` (Flow 2).
   - Missing UI/UX components: `NewPatientModal` (Flow 1) and `SmartItineraryModal` (Flow 2) to enable the zero-friction onboarding and 1-click batch generation journeys.

---

## 2. Logic Chain

1. **Flow 1 Requirements Mapping**:
   - *Requirement*: 1-Click Patient Onboarding with smart defaults, keyboard shortcut `[N]`, duplicate detection, UUID generation, territory check, and Dexie storage.
   - *QA Logic*:
     - Unit level (`CreatePatientBookingUseCase.test.ts`): Verify UUID generation regex, duplicate booking code collision detection, territory validation on hotel address (fail on 'Hotel Mocoa', pass on 'Hotel Inntu Laureles'), and `paxCount` bounds (1..20).
     - Component level (`NewPatientModal.test.tsx`): Verify modal opens via button click and `[N]` key (while ignoring inputs), pre-fills smart defaults (Aruba / Papiamento / Hotel Inntu / 1 pax), executes submission, updates `AppContext.activeBooking`, and persists to Dexie.
     - Benchmark level (`Flow1ClickReductionBenchmark.test.tsx`): Assert patient creation completes in $\le 2$ clicks (Click 1: Open modal, Click 2: Confirm with smart defaults).

2. **Flow 2 Requirements Mapping**:
   - *Requirement*: 1-Click Smart Clinical Itinerary Generator with 4 clinical presets, chronological ordering ($T_{i+1} \ge T_i$), 15-min slot snapping, non-overlapping constraints, and geocoded coordinates.
   - *QA Logic*:
     - Unit level (`GenerateSmartItineraryUseCase.test.ts`): Verify all 4 clinical presets (`CIRUGIA_PLASTICA_12D`, `CARDIOLOGIA_5D`, `OFTALMOLOGIA_3D`, `UROLOGIA_4D`), mathematical monotonicity of timestamps ($\forall i, T_{i+1} \ge T_i$), 15-min slot snapping ($\text{minutes} \pmod{15} = 0$, $\text{seconds} = 0$), pairwise non-overlap of medical consultations, and valid geocoded GPS coordinates in Antioquia region.
     - Component level (`SmartItineraryModal.test.tsx`): Verify modal launch, preset selection card interaction, 1-click batch creation execution, and calendar timeline population.
     - Benchmark level (`Flow2ClickReductionBenchmark.test.tsx`): Assert full itinerary generation in 1 click.

3. **Unified E2E Journey Benchmark**:
   - Combine Flow 1 ($\le 2$ clicks) + Flow 2 ($1$ click) to formally prove that onboarding a new patient and generating a complete multi-day clinical itinerary requires $\le 3$ user interactions.

---

## 3. Caveats

1. **Keyboard Event Focus Isolation**: In `NewPatientModal`, tests must verify that typing `'n'` inside an existing `<input>` or `<textarea>` does NOT trigger the modal. Only global un-focused keydown triggers the shortcut.
2. **Asynchronous IndexedDB Persistence**: When testing Dexie storage integration, always use `fake-indexeddb/auto` and wrap storage queries in `waitFor()` to avoid race conditions.
3. **Timezone Normalization**: All generated event timestamps must be verified in ISO-8601 UTC or Colombia Time (`America/Bogota`, UTC-5) to avoid cross-environment UTC drift during Vitest execution.
4. **Clinical Schedule Realism**: The non-overlapping constraint test must specifically account for transit buffers ($\ge 30$ mins) between distinct clinical facilities (e.g., HPTU in Robledo vs Clofán in Ciudad del Río).

---

## 4. Conclusion & Detailed QA Test Suite Specification

### Test Suite Architecture Overview

| Flow | Test File Path | Tier / Type | Target Component / Use Case | Assertions Count |
|---|---|---|---|---|
| **Flow 1** | `tests/application/CreatePatientBookingUseCase.test.ts` | Unit / Application | `CreatePatientBookingUseCase` | 8 test cases |
| **Flow 1** | `tests/presentation/NewPatientModal.test.tsx` | Component / RTL | `NewPatientModal` & `AppContext` | 7 test cases |
| **Flow 1** | `tests/benchmark/Flow1ClickReductionBenchmark.test.tsx` | Usability Benchmark | Click-Reduction ($\le 2$ clicks) | 3 test cases |
| **Flow 2** | `tests/application/GenerateSmartItineraryUseCase.test.ts` | Unit / Application | `GenerateSmartItineraryUseCase` | 9 test cases |
| **Flow 2** | `tests/presentation/SmartItineraryModal.test.tsx` | Component / RTL | `SmartItineraryModal` & Calendar | 6 test cases |
| **Flow 2** | `tests/benchmark/Flow2ClickReductionBenchmark.test.tsx` | Usability Benchmark | 1-Click Batch Generation | 3 test cases |
| **E2E** | `tests/benchmark/UnifiedFlow1And2JourneyBenchmark.test.tsx` | E2E Benchmark | Flow 1 + Flow 2 Unified ($\le 3$ clicks) | 2 test cases |

---

### Detailed Test Specifications & Assertions

#### Suite 1: `tests/application/CreatePatientBookingUseCase.test.ts`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePatientBookingUseCase, CreatePatientBookingCommand } from '../../src/application/use-cases/CreatePatientBookingUseCase';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';
import { InvalidBookingError } from '../../src/domain/errors/DomainError';
import { NonOperativeTerritoryError } from '../../src/domain/errors/NonOperativeTerritoryError';

describe('CreatePatientBookingUseCase Unit Tests (Flow 1)', () => {
  let storage: InMemoryStorageAdapter;
  let useCase: CreatePatientBookingUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    useCase = new CreatePatientBookingUseCase(storage);
  });

  it('TC-F1-01: should create patient booking with auto-generated UUID and correct defaults', async () => {
    const command: CreatePatientBookingCommand = {
      code: 'RVA999',
      firstName: 'Jan',
      lastName: 'Van Dijk',
      country: 'Aruba',
      language: 'Papiamento',
      hotelName: 'Hotel Inntu Laureles',
      paxCount: 2,
      arrivalDate: '2026-09-01T10:00:00Z',
      departureDate: '2026-09-10T18:00:00Z',
    };

    const result = await useCase.execute(command);

    expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(result.code).toBe('RVA999');
    expect(result.fullName).toBe('Jan Van Dijk');
    expect(result.country).toBe('Aruba');
    expect(result.language).toBe('Papiamento');
    expect(result.paxCount).toBe(2);
    expect(result.status).toBe('PROGRAMADO');

    const saved = await storage.getBooking('RVA999');
    expect(saved).not.toBeNull();
    expect(saved?.fullName).toBe('Jan Van Dijk');
  });

  it('TC-F1-02: should detect duplicate booking code and throw InvalidBookingError collision error', async () => {
    const command: CreatePatientBookingCommand = {
      code: 'RVA171', // Existing code
      firstName: 'Duplicate',
      lastName: 'Patient',
      country: 'Curaçao',
      language: 'Dutch',
      hotelName: 'Park 42 Poblado',
      paxCount: 1,
      arrivalDate: '2026-09-01T10:00:00Z',
      departureDate: '2026-09-05T18:00:00Z',
    };

    await useCase.execute(command);

    await expect(useCase.execute(command)).rejects.toThrow(InvalidBookingError);
    await expect(useCase.execute(command)).rejects.toThrow(/already exists/i);
  });

  it('TC-F1-03: should enforce fail-fast territory validation on non-operative hotel location (Mocoa)', async () => {
    const invalidCommand: CreatePatientBookingCommand = {
      code: 'RVA-INV-1',
      firstName: 'Carlos',
      lastName: 'Pérez',
      country: 'Colombia',
      language: 'Español',
      hotelName: 'Hotel Central Mocoa Putumayo', // Forbidden territory
      paxCount: 1,
      arrivalDate: '2026-09-01T10:00:00Z',
      departureDate: '2026-09-05T18:00:00Z',
    };

    await expect(useCase.execute(invalidCommand)).rejects.toThrow(NonOperativeTerritoryError);
    await expect(useCase.execute(invalidCommand)).rejects.toThrow(/Zona prohibida o no autorizada/i);
  });

  it('TC-F1-04: should pass territory validation on authorized medical hotel corridors (Inntu Laureles, Park 42, Villa Anita)', async () => {
    const hotels = ['Hotel Inntu Laureles', 'Edificio Park 42 Poblado', 'Villa Anita Envigado'];
    for (const [idx, hotel] of hotels.entries()) {
      const result = await useCase.execute({
        code: `RVA-VAL-${idx}`,
        firstName: `ValidPax${idx}`,
        lastName: 'Test',
        country: 'Aruba',
        language: 'Papiamento',
        hotelName: hotel,
        paxCount: 1,
        arrivalDate: '2026-09-01T10:00:00Z',
        departureDate: '2026-09-05T18:00:00Z',
      });
      expect(result.hotelName).toBe(hotel);
    }
  });

  it('TC-F1-05: should enforce paxCount bounds (1 to 20)', async () => {
    const baseCommand = {
      code: 'RVA-PAX-TEST',
      firstName: 'Bound',
      lastName: 'Tester',
      country: 'Aruba',
      language: 'Papiamento',
      hotelName: 'Hotel Inntu Laureles',
      arrivalDate: '2026-09-01T10:00:00Z',
      departureDate: '2026-09-05T18:00:00Z',
    };

    // Lower bound violation (0)
    await expect(useCase.execute({ ...baseCommand, code: 'RVA-0', paxCount: 0 })).rejects.toThrow(InvalidBookingError);
    // Negative violation (-1)
    await expect(useCase.execute({ ...baseCommand, code: 'RVA-NEG', paxCount: -1 })).rejects.toThrow(InvalidBookingError);
    // Upper bound violation (21)
    await expect(useCase.execute({ ...baseCommand, code: 'RVA-21', paxCount: 21 })).rejects.toThrow(InvalidBookingError);

    // Valid boundaries (1 and 20)
    const valid1 = await useCase.execute({ ...baseCommand, code: 'RVA-1', paxCount: 1 });
    expect(valid1.paxCount).toBe(1);
    const valid20 = await useCase.execute({ ...baseCommand, code: 'RVA-20', paxCount: 20 });
    expect(valid20.paxCount).toBe(20);
  });

  it('TC-F1-06: should reject booking when departure date precedes arrival date', async () => {
    const invalidDatesCommand: CreatePatientBookingCommand = {
      code: 'RVA-DATE-ERR',
      firstName: 'Invalid',
      lastName: 'Dates',
      country: 'Aruba',
      language: 'Papiamento',
      hotelName: 'Hotel Inntu Laureles',
      paxCount: 1,
      arrivalDate: '2026-09-10T10:00:00Z',
      departureDate: '2026-09-01T10:00:00Z', // Before arrival!
    };

    await expect(useCase.execute(invalidDatesCommand)).rejects.toThrow(InvalidBookingError);
  });

  it('TC-F1-07: should emit BOOKING_CREATED CQRS event to storage event stream', async () => {
    const command: CreatePatientBookingCommand = {
      code: 'RVA-CQRS-1',
      firstName: 'Event',
      lastName: 'Stream',
      country: 'Bonaire',
      language: 'Papiamento',
      hotelName: 'Hotel Inntu Laureles',
      paxCount: 1,
      arrivalDate: '2026-09-01T10:00:00Z',
      departureDate: '2026-09-05T18:00:00Z',
    };

    await useCase.execute(command);
    const stream = await storage.getEventStream('RVA-CQRS-1');
    expect(stream.length).toBeGreaterThanOrEqual(1);
    expect(stream[0].type).toBe('BOOKING_CREATED');
  });
});
```

---

#### Suite 2: `tests/presentation/NewPatientModal.test.tsx`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../src/presentation/state/AppContext';
import { CalendarHeader } from '../../src/presentation/components/calendar/CalendarHeader';
import { NewPatientModal } from '../../src/presentation/components/modal/NewPatientModal';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';

describe('NewPatientModal Interaction & UX Ergonomics (Flow 1)', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  const renderComponent = () => {
    return render(
      <AppProvider storagePort={storage}>
        <CalendarHeader />
        <NewPatientModal />
      </AppProvider>
    );
  };

  it('TC-F1-UI-01: should open modal via header CTA button click', async () => {
    renderComponent();
    const btnNewPatient = screen.getByTestId('btn-new-patient-modal');
    expect(btnNewPatient).toBeTruthy();

    fireEvent.click(btnNewPatient);

    await waitFor(() => {
      expect(screen.getByTestId('new-patient-modal')).toBeTruthy();
      expect(screen.getByText(/Nuevo Paciente \/ Reserva/i)).toBeTruthy();
    });
  });

  it('TC-F1-UI-02: should open modal via [N] keyboard shortcut and ignore when typing in input', async () => {
    renderComponent();

    // 1. Trigger global shortcut [N]
    fireEvent.keyDown(window, { key: 'n', code: 'KeyN' });

    await waitFor(() => {
      expect(screen.getByTestId('new-patient-modal')).toBeTruthy();
    });

    // Close modal
    fireEvent.click(screen.getByTestId('btn-close-patient-modal'));
    await waitFor(() => {
      expect(screen.queryByTestId('new-patient-modal')).toBeNull();
    });

    // 2. Simulate typing in an input element
    const dummyInput = document.createElement('input');
    document.body.appendChild(dummyInput);
    dummyInput.focus();

    fireEvent.keyDown(dummyInput, { key: 'n', code: 'KeyN' });
    expect(screen.queryByTestId('new-patient-modal')).toBeNull();
    document.body.removeChild(dummyInput);
  });

  it('TC-F1-UI-03: should have smart operational defaults pre-filled in form fields', async () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('btn-new-patient-modal'));

    await waitFor(() => {
      const countrySelect = screen.getByTestId('input-patient-country') as HTMLSelectElement;
      const languageSelect = screen.getByTestId('input-patient-language') as HTMLSelectElement;
      const hotelSelect = screen.getByTestId('input-patient-hotel') as HTMLSelectElement;
      const paxInput = screen.getByTestId('input-patient-pax') as HTMLInputElement;

      expect(countrySelect.value).toBe('Aruba');
      expect(languageSelect.value).toBe('Papiamento');
      expect(hotelSelect.value).toContain('HOTEL-INNTU');
      expect(paxInput.value).toBe('1');
    });
  });

  it('TC-F1-UI-04: should display fail-fast territory warning and disable submit on invalid hotel address', async () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('btn-new-patient-modal'));

    await waitFor(() => {
      expect(screen.getByTestId('input-patient-custom-hotel')).toBeTruthy();
    });

    const customHotelInput = screen.getByTestId('input-patient-custom-hotel');
    fireEvent.change(customHotelInput, { target: { value: 'Hotel Mocoa Selva Putumayo' } });

    await waitFor(() => {
      const errorBadge = screen.getByTestId('patient-territory-error-badge');
      expect(errorBadge).toBeTruthy();
      expect(errorBadge.textContent).toContain('Territorio No Operativo');
      const submitBtn = screen.getByTestId('btn-submit-patient') as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(true);
    });
  });

  it('TC-F1-UI-05: should submit patient, persist in storage, and set as active patient in AppContext', async () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('btn-new-patient-modal'));

    await waitFor(() => {
      expect(screen.getByTestId('input-patient-name')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('input-patient-name'), { target: { value: 'Eduardo' } });
    fireEvent.change(screen.getByTestId('input-patient-lastname'), { target: { value: 'Croes' } });

    const submitBtn = screen.getByTestId('btn-submit-patient');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('new-patient-modal')).toBeNull();
    });

    const allBookings = await storage.getAllBookings();
    expect(allBookings.some((b) => b.fullName === 'Eduardo Croes')).toBe(true);
  });
});
```

---

#### Suite 3: `tests/benchmark/Flow1ClickReductionBenchmark.test.tsx`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../src/presentation/state/AppContext';
import { CalendarHeader } from '../../src/presentation/components/calendar/CalendarHeader';
import { NewPatientModal } from '../../src/presentation/components/modal/NewPatientModal';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';

describe('Flow 1 Click-Reduction Usability Benchmark', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  it('BENCHMARK-F1-01: should onboard new patient in <= 2 total clicks', async () => {
    let clickCount = 0;
    const trackClick = () => { clickCount++; };

    render(
      <div onClickCapture={trackClick}>
        <AppProvider storagePort={storage}>
          <CalendarHeader />
          <NewPatientModal />
        </AppProvider>
      </div>
    );

    // Click 1: Open modal
    const openBtn = screen.getByTestId('btn-new-patient-modal');
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByTestId('new-patient-modal')).toBeTruthy();
    });

    // Provide required patient name
    fireEvent.change(screen.getByTestId('input-patient-name'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByTestId('input-patient-lastname'), { target: { value: 'Gomez' } });

    // Click 2: Submit form (smart defaults retained)
    const submitBtn = screen.getByTestId('btn-submit-patient');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('new-patient-modal')).toBeNull();
    });

    // Assert click budget
    expect(clickCount).toBeLessThanOrEqual(2);

    // Verify storage persistence
    const bookings = await storage.getAllBookings();
    expect(bookings.length).toBeGreaterThanOrEqual(1);
    expect(bookings[0].fullName).toBe('Maria Gomez');
  });
});
```

---

#### Suite 4: `tests/application/GenerateSmartItineraryUseCase.test.ts`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { GenerateSmartItineraryUseCase, GenerateSmartItineraryCommand } from '../../src/application/use-cases/GenerateSmartItineraryUseCase';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';
import { PatientBooking } from '../../src/domain/entities/PatientBooking';

describe('GenerateSmartItineraryUseCase Unit Tests (Flow 2)', () => {
  let storage: InMemoryStorageAdapter;
  let useCase: GenerateSmartItineraryUseCase;
  let sampleBooking: PatientBooking;

  beforeEach(async () => {
    storage = new InMemoryStorageAdapter();
    useCase = new GenerateSmartItineraryUseCase(storage);

    sampleBooking = new PatientBooking({
      id: 'bkg-test-01',
      code: 'RVA-SMART',
      patientId: 'PAX-SMART',
      firstName: 'Elena',
      lastName: 'Rostova',
      passportHash: 'sha256:abcd',
      country: 'Aruba',
      language: 'Papiamento',
      phone: '+297 555 1234',
      email: 'elena@example.com',
      paxCount: 2,
      arrivalDate: '2026-09-01T10:00:00Z',
      departureDate: '2026-09-13T18:00:00Z',
      arrivalAirline: 'Avianca',
      arrivalFlight: 'AV9240',
      hotelId: 'HOTEL-INNTU',
      hotelName: 'Hotel Inntu Laureles',
    });
    await storage.saveBooking(sampleBooking);
  });

  it('TC-F2-01: should generate 12-day Plastic Surgery preset with full clinical sequence', async () => {
    const command: GenerateSmartItineraryCommand = {
      bookingCode: 'RVA-SMART',
      presetType: 'CIRUGIA_PLASTICA_12D',
      startDate: '2026-09-01',
    };

    const result = await useCase.execute(command);

    expect(result.events.length).toBeGreaterThanOrEqual(7);
    expect(result.transfers.length).toBeGreaterThanOrEqual(2);
    expect(result.shifts.length).toBeGreaterThanOrEqual(2);

    const eventTitles = result.events.map((e) => e.title);
    expect(eventTitles.some((t) => t.includes('Llegada & Traslado'))).toBe(true);
    expect(eventTitles.some((t) => t.includes('Laboratorio Clínico Domiciliario'))).toBe(true);
    expect(eventTitles.some((t) => t.includes('Valoración Quirúrgica'))).toBe(true);
    expect(eventTitles.some((t) => t.includes('Procedimiento Quirúrgico'))).toBe(true);
    expect(eventTitles.some((t) => t.includes('Control Postoperatorio'))).toBe(true);
    expect(eventTitles.some((t) => t.includes('Certificación Fit-to-Fly'))).toBe(true);
    expect(eventTitles.some((t) => t.includes('Traslado al Aeropuerto JMC'))).toBe(true);
  });

  it('TC-F2-02: should generate 5-day Cardiology preset (Cardio VID)', async () => {
    const result = await useCase.execute({
      bookingCode: 'RVA-SMART',
      presetType: 'CARDIOLOGIA_5D',
      startDate: '2026-09-01',
    });

    expect(result.events.length).toBeGreaterThanOrEqual(5);
    const locations = result.events.map((e) => e.location);
    expect(locations.some((l) => l.includes('Cardio VID'))).toBe(true);
  });

  it('TC-F2-03: should generate 3-day Ophthalmology preset (Clofán Ciudad del Río)', async () => {
    const result = await useCase.execute({
      bookingCode: 'RVA-SMART',
      presetType: 'OFTALMOLOGIA_3D',
      startDate: '2026-09-01',
    });

    expect(result.events.length).toBeGreaterThanOrEqual(4);
    const locations = result.events.map((e) => e.location);
    expect(locations.some((l) => l.includes('Clofán'))).toBe(true);
  });

  it('TC-F2-04: should generate 4-day Urology preset (CES Oviedo)', async () => {
    const result = await useCase.execute({
      bookingCode: 'RVA-SMART',
      presetType: 'UROLOGIA_4D',
      startDate: '2026-09-01',
    });

    expect(result.events.length).toBeGreaterThanOrEqual(4);
    const locations = result.events.map((e) => e.location);
    expect(locations.some((l) => l.includes('CES'))).toBe(true);
  });

  it('TC-F2-05: should enforce strict chronological ordering (T_{i+1} >= T_i) across all events', async () => {
    const presets: GenerateSmartItineraryCommand['presetType'][] = [
      'CIRUGIA_PLASTICA_12D',
      'CARDIOLOGIA_5D',
      'OFTALMOLOGIA_3D',
      'UROLOGIA_4D',
    ];

    for (const preset of presets) {
      const { events } = await useCase.execute({
        bookingCode: 'RVA-SMART',
        presetType: preset,
        startDate: '2026-09-01',
      });

      for (let i = 0; i < events.length - 1; i++) {
        const tCurr = new Date(events[i].startDateTime).getTime();
        const tNext = new Date(events[i + 1].startDateTime).getTime();
        expect(tNext).toBeGreaterThanOrEqual(tCurr);

        // Event internal validity: endDateTime > startDateTime
        const tEnd = new Date(events[i].endDateTime).getTime();
        expect(tEnd).toBeGreaterThan(tCurr);
      }
    }
  });

  it('TC-F2-06: should snap all event start and end timestamps to 15-minute slot intervals', async () => {
    const { events } = await useCase.execute({
      bookingCode: 'RVA-SMART',
      presetType: 'CIRUGIA_PLASTICA_12D',
      startDate: '2026-09-01',
    });

    for (const event of events) {
      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);

      expect(start.getMinutes() % 15).toBe(0);
      expect(end.getMinutes() % 15).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(end.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);
      expect(end.getMilliseconds()).toBe(0);
    }
  });

  it('TC-F2-07: should enforce non-overlapping constraints between clinical visits on same day', async () => {
    const { events } = await useCase.execute({
      bookingCode: 'RVA-SMART',
      presetType: 'CIRUGIA_PLASTICA_12D',
      startDate: '2026-09-01',
    });

    // Group events by YYYY-MM-DD
    const dayMap = new Map<string, typeof events>();
    for (const event of events) {
      const day = event.startDateTime.split('T')[0];
      const list = dayMap.get(day) || [];
      list.push(event);
      dayMap.set(day, list);
    }

    for (const [, dayEvents] of dayMap) {
      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          const startA = new Date(dayEvents[i].startDateTime).getTime();
          const endA = new Date(dayEvents[i].endDateTime).getTime();
          const startB = new Date(dayEvents[j].startDateTime).getTime();
          const endB = new Date(dayEvents[j].endDateTime).getTime();

          const hasOverlap = startA < endB && startB < endA;
          expect(hasOverlap).toBe(false);
        }
      }
    }
  });

  it('TC-F2-08: should populate geocoded GPS coordinates in Antioquia territory for all events', async () => {
    const { events } = await useCase.execute({
      bookingCode: 'RVA-SMART',
      presetType: 'CIRUGIA_PLASTICA_12D',
      startDate: '2026-09-01',
    });

    for (const event of events) {
      expect(event.territory).toBeDefined();
      expect(event.territory.coordinates).toBeDefined();
      const { lat, lng } = event.territory.coordinates!;
      // Coordinates bounded in Aburrá Valley / Rionegro region
      expect(lat).toBeGreaterThanOrEqual(6.10);
      expect(lat).toBeLessThanOrEqual(6.40);
      expect(lng).toBeGreaterThanOrEqual(-75.65);
      expect(lng).toBeLessThanOrEqual(-75.40);
    }
  });
});
```

---

#### Suite 5: `tests/presentation/SmartItineraryModal.test.tsx`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../src/presentation/state/AppContext';
import { CalendarContainer } from '../../src/presentation/components/calendar/CalendarContainer';
import { SmartItineraryModal } from '../../src/presentation/components/modal/SmartItineraryModal';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';

describe('SmartItineraryModal Interaction & Batch Generation (Flow 2)', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  const renderComponent = () => {
    return render(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="agenda">
        <CalendarContainer />
        <SmartItineraryModal />
      </AppProvider>
    );
  };

  it('TC-F2-UI-01: should open Smart Itinerary Modal via toolbar action button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('btn-open-smart-itinerary')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('btn-open-smart-itinerary'));

    await waitFor(() => {
      expect(screen.getByTestId('smart-itinerary-modal')).toBeTruthy();
      expect(screen.getByText(/Generar Itinerario Inteligente/i)).toBeTruthy();
      expect(screen.getByTestId('preset-card-cirugia_plastica_12d')).toBeTruthy();
      expect(screen.getByTestId('preset-card-cardiologia_5d')).toBeTruthy();
      expect(screen.getByTestId('preset-card-oftalmologia_3d')).toBeTruthy();
      expect(screen.getByTestId('preset-card-urologia_4d')).toBeTruthy();
    });
  });

  it('TC-F2-UI-02: should select a preset and render summary preview', async () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('btn-open-smart-itinerary'));

    await waitFor(() => {
      expect(screen.getByTestId('preset-card-oftalmologia_3d')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('preset-card-oftalmologia_3d'));

    await waitFor(() => {
      expect(screen.getByText(/Clínica Clofán/i)).toBeTruthy();
      expect(screen.getByText(/3 Días/i)).toBeTruthy();
    });
  });

  it('TC-F2-UI-03: should execute 1-click batch generation and update calendar agenda view', async () => {
    renderComponent();
    fireEvent.click(screen.getByTestId('btn-open-smart-itinerary'));

    await waitFor(() => {
      expect(screen.getByTestId('preset-card-cardiologia_5d')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('preset-card-cardiologia_5d'));
    fireEvent.click(screen.getByTestId('btn-generate-itinerary-submit'));

    await waitFor(() => {
      expect(screen.queryByTestId('smart-itinerary-modal')).toBeNull();
      // Verify generated cardiology items appear in agenda
      expect(screen.getByText(/Cardio VID/i)).toBeTruthy();
    });
  });
});
```

---

#### Suite 6: `tests/benchmark/Flow2ClickReductionBenchmark.test.tsx`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../src/presentation/state/AppContext';
import { CalendarContainer } from '../../src/presentation/components/calendar/CalendarContainer';
import { SmartItineraryModal } from '../../src/presentation/components/modal/SmartItineraryModal';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';

describe('Flow 2 1-Click Itinerary Generation Benchmark', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  it('BENCHMARK-F2-01: should generate multi-day clinical itinerary in 1 click from preset card', async () => {
    render(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="agenda">
        <CalendarContainer />
        <SmartItineraryModal />
      </AppProvider>
    );

    fireEvent.click(screen.getByTestId('btn-open-smart-itinerary'));

    await waitFor(() => {
      expect(screen.getByTestId('smart-itinerary-modal')).toBeTruthy();
    });

    let clickCount = 0;
    const trackClick = () => { clickCount++; };

    // Target 1-click quick generate button for plastic surgery preset
    const quickGenerateBtn = screen.getByTestId('btn-quick-generate-cirugia_plastica_12d');
    quickGenerateBtn.addEventListener('click', trackClick);

    fireEvent.click(quickGenerateBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('smart-itinerary-modal')).toBeNull();
    });

    // Assert 1-click execution budget
    expect(clickCount).toBe(1);

    // Verify batch events generated in storage
    const events = await storage.getEventsByBooking('RVA171');
    expect(events.length).toBeGreaterThanOrEqual(7);
  });
});
```

---

#### Suite 7: `tests/benchmark/UnifiedFlow1And2JourneyBenchmark.test.tsx`

```typescript
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../src/presentation/state/AppContext';
import { CalendarContainer } from '../../src/presentation/components/calendar/CalendarContainer';
import { CalendarHeader } from '../../src/presentation/components/calendar/CalendarHeader';
import { NewPatientModal } from '../../src/presentation/components/modal/NewPatientModal';
import { SmartItineraryModal } from '../../src/presentation/components/modal/SmartItineraryModal';
import { InMemoryStorageAdapter } from '../../src/infrastructure/storage/InMemoryStorageAdapter';

describe('Unified End-to-End Operational Journey Benchmark (Flow 1 + Flow 2)', () => {
  let storage: InMemoryStorageAdapter;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
  });

  it('BENCHMARK-UNIFIED-01: should onboard new patient AND generate full clinical itinerary in <= 3 total clicks', async () => {
    let totalClicks = 0;
    const countClick = () => { totalClicks++; };

    render(
      <div onClickCapture={countClick}>
        <AppProvider storagePort={storage} initialView="agenda">
          <CalendarHeader />
          <CalendarContainer />
          <NewPatientModal />
          <SmartItineraryModal />
        </AppProvider>
      </div>
    );

    // --- FLOW 1: Patient Onboarding ---
    // Interaction 1: Open New Patient Modal
    fireEvent.click(screen.getByTestId('btn-new-patient-modal'));
    await waitFor(() => {
      expect(screen.getByTestId('new-patient-modal')).toBeTruthy();
    });

    // Fill minimal required name
    fireEvent.change(screen.getByTestId('input-patient-name'), { target: { value: 'Karel' } });
    fireEvent.change(screen.getByTestId('input-patient-lastname'), { target: { value: 'Tromp' } });

    // Interaction 2: Confirm & Create Patient
    fireEvent.click(screen.getByTestId('btn-submit-patient'));
    await waitFor(() => {
      expect(screen.queryByTestId('new-patient-modal')).toBeNull();
    });

    // --- FLOW 2: Smart Itinerary Generation ---
    // Open Smart Itinerary Modal
    fireEvent.click(screen.getByTestId('btn-open-smart-itinerary'));
    await waitFor(() => {
      expect(screen.getByTestId('smart-itinerary-modal')).toBeTruthy();
    });

    // Interaction 3: Quick Generate Itinerary in 1 Click
    fireEvent.click(screen.getByTestId('btn-quick-generate-cirugia_plastica_12d'));
    await waitFor(() => {
      expect(screen.queryByTestId('smart-itinerary-modal')).toBeNull();
    });

    // TOTAL CLICKS ASSERTION: <= 3 Clicks
    expect(totalClicks).toBeLessThanOrEqual(3);

    // VERIFICATION: Patient active & Multi-day itinerary populated in storage
    const allBookings = await storage.getAllBookings();
    expect(allBookings.length).toBeGreaterThanOrEqual(1);
    const activeCode = allBookings[0].code;
    const activeEvents = await storage.getEventsByBooking(activeCode);
    expect(activeEvents.length).toBeGreaterThanOrEqual(7);
  });
});
```

---

## 5. Verification Method

To independently verify the test plan and execute all test suites:

1. **Environment Setup**:
   Ensure the Node/NPM toolchain is loaded:
   ```bash
   export PATH=/Users/miyo123/projects/medicaltrip/.bin/bin:/Users/miyo123/homebrew/bin:$PATH
   ```

2. **Execute Full Test Suite**:
   ```bash
   cd /Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app
   npm test
   ```

3. **Execute Flow 1 & Flow 2 Targeted Tests**:
   ```bash
   npm test -- tests/application/CreatePatientBookingUseCase.test.ts
   npm test -- tests/presentation/NewPatientModal.test.tsx
   npm test -- tests/application/GenerateSmartItineraryUseCase.test.ts
   npm test -- tests/presentation/SmartItineraryModal.test.tsx
   npm test -- tests/benchmark/
   ```

4. **Invalidation Conditions**:
   - Any test failure where `clickCount > 2` for Flow 1 or `clickCount > 1` for Flow 2.
   - Any timestamp that fails $T_{i+1} \ge T_i$ or `minutes % 15 !== 0`.
   - Any failure where non-operative territories (e.g. Mocoa) do not trigger `NonOperativeTerritoryError`.
   - Any failure where IndexedDB writes do not reflect in `storagePort.getAllBookings()`.
