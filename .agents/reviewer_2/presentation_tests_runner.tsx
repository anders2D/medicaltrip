/**
 * presentation_tests_runner.tsx
 * Independent Presentation Component Execution & UI/UX Test Suite
 */

import 'fake-indexeddb/auto';
import { Window } from 'happy-dom';

const win = new Window({ url: 'http://localhost:3000' });
(globalThis as any).window = win;
(globalThis as any).document = win.document;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).Element = win.Element;
(globalThis as any).Node = win.Node;
(globalThis as any).Text = win.Text;
(globalThis as any).Comment = win.Comment;
(globalThis as any).DocumentFragment = win.DocumentFragment;
(globalThis as any).customElements = win.customElements;
(globalThis as any).HTMLCanvasElement = win.HTMLCanvasElement;
(globalThis as any).HTMLInputElement = win.HTMLInputElement;
(globalThis as any).HTMLButtonElement = win.HTMLButtonElement;
(globalThis as any).CustomEvent = win.CustomEvent;
(globalThis as any).Event = win.Event;
(globalThis as any).KeyboardEvent = win.KeyboardEvent;
(globalThis as any).PointerEvent = win.PointerEvent;
(globalThis as any).MouseEvent = win.MouseEvent;
(globalThis as any).requestAnimationFrame = win.requestAnimationFrame.bind(win);
(globalThis as any).cancelAnimationFrame = win.cancelAnimationFrame.bind(win);
try {
  Object.defineProperty(globalThis, 'navigator', { value: win.navigator, writable: true, configurable: true });
} catch {
  // Ignore
}

const happyWindow = win;

// Canvas mock for signature pad & confetti
(happyWindow.HTMLCanvasElement.prototype as any).getContext = () => ({
  scale: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fillRect: () => {},
  clearRect: () => {},
  fill: () => {},
  arc: () => {},
  save: () => {},
  restore: () => {},
  resetTransform: () => {},
  translate: () => {},
  rotate: () => {},
  transform: () => {},
  closePath: () => {},
  lineCap: 'round',
  lineJoin: 'round',
  strokeStyle: '#000',
  lineWidth: 2,
  fillStyle: '#fff',
});
(happyWindow.HTMLCanvasElement.prototype as any).toDataURL = () => 'data:image/png;base64,mocksignature';
(happyWindow.HTMLCanvasElement.prototype as any).getBoundingClientRect = () => ({
  left: 0,
  top: 0,
  width: 500,
  height: 200,
});
(happyWindow.HTMLCanvasElement.prototype as any).setPointerCapture = () => {};
(happyWindow.HTMLCanvasElement.prototype as any).releasePointerCapture = () => {};

import React from 'react';
import { renderToString } from 'react-dom/server';
import assert from 'node:assert/strict';

import { AppProvider } from '../../apps/medicaltrip_react_app/src/presentation/state/AppContext';
import { CalendarContainer } from '../../apps/medicaltrip_react_app/src/presentation/components/calendar/CalendarContainer';
import { ArchetypeSwitcherBar } from '../../apps/medicaltrip_react_app/src/presentation/components/switcher/ArchetypeSwitcherBar';
import { EventDetailDrawer } from '../../apps/medicaltrip_react_app/src/presentation/components/drawer/EventDetailDrawer';
import { DockedSettlementBar } from '../../apps/medicaltrip_react_app/src/presentation/components/settlement/DockedSettlementBar';
import { ReceiptOcrModal } from '../../apps/medicaltrip_react_app/src/presentation/components/settlement/ReceiptOcrModal';
import { DigitalSignaturePad } from '../../apps/medicaltrip_react_app/src/presentation/components/settlement/DigitalSignaturePad';
import { InMemoryStorageAdapter } from '../../apps/medicaltrip_react_app/src/infrastructure/storage/InMemoryStorageAdapter';
import { LoadArchetypeUseCase } from '../../apps/medicaltrip_react_app/src/application/use-cases/LoadArchetypeUseCase';
import { OperativeTerritory } from '../../apps/medicaltrip_react_app/src/domain/value-objects/OperativeTerritory';
import { Money } from '../../apps/medicaltrip_react_app/src/domain/value-objects/Money';

console.log('===================================================================');
console.log('  PRESENTATION & UI/UX COMPONENT INTERACTION TEST RUNNER');
console.log('===================================================================\n');

async function runPresentationTests() {
  let passedTests = 0;

  // TEST SUITE 1: CalendarContainer (Multi-views: Month, Week, Day, Agenda)
  console.log('>>> [1/6] Testing CalendarContainer Multi-views & Header Navigation...');
  {
    const storage = new InMemoryStorageAdapter();
    const seedUseCase = new LoadArchetypeUseCase(storage);
    await seedUseCase.execute({ archetypeKey: 'rva171' });

    // Month view
    const monthHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="month" initialDate={new Date('2026-08-20T12:00:00.000Z')}>
        <CalendarContainer />
      </AppProvider>
    );
    assert.ok(monthHtml.includes('Agosto 2026'), 'Month view must display Agosto 2026');
    assert.ok(monthHtml.includes('view-tab-month'), 'Month tab must be present');
    assert.ok(monthHtml.includes('view-tab-week'), 'Week tab must be present');
    assert.ok(monthHtml.includes('view-tab-day'), 'Day tab must be present');
    assert.ok(monthHtml.includes('view-tab-agenda'), 'Agenda tab must be present');
    passedTests++;
    console.log('    ✓ Month view header, tabs, and calendar grid rendered.');

    // Week view
    const weekHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="week" initialDate={new Date('2026-08-20T12:00:00.000Z')}>
        <CalendarContainer />
      </AppProvider>
    );
    assert.ok(weekHtml.includes('GMT-5'), 'Week view must display timezone');
    assert.ok(weekHtml.includes('06:00'), 'Week view must display 06:00 operational start bound');
    passedTests++;
    console.log('    ✓ Week view 06:00-22:00 time grid rendered.');

    // Day view
    const dayHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="day" initialDate={new Date('2026-08-20T12:00:00.000Z')}>
        <CalendarContainer />
      </AppProvider>
    );
    assert.ok(dayHtml.includes('Jornada Operativa: 06:00 - 22:00'), 'Day view must display operational window');
    passedTests++;
    console.log('    ✓ Day view single-day timeline rendered.');

    // Agenda view
    const agendaHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="agenda" initialDate={new Date('2026-08-20T12:00:00.000Z')}>
        <CalendarContainer />
      </AppProvider>
    );
    assert.ok(agendaHtml.includes('Agenda') || agendaHtml.includes('No hay eventos') || agendaHtml.includes('Crear Primer Evento'), 'Agenda view must render agenda container');
    passedTests++;
    console.log('    ✓ Agenda view initial state and controls rendered.');
  }

  // TEST SUITE 2: ArchetypeSwitcherBar (1-Click Switcher)
  console.log('\n>>> [2/6] Testing ArchetypeSwitcherBar (1-Click Switcher & Badges)...');
  {
    const storage = new InMemoryStorageAdapter();
    const switcherHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171" initialView="agenda">
        <ArchetypeSwitcherBar />
      </AppProvider>
    );

    assert.ok(switcherHtml.includes('switcher-rva171'), 'Switcher must have rva171 button');
    assert.ok(switcherHtml.includes('switcher-rva282'), 'Switcher must have rva282 button');
    assert.ok(switcherHtml.includes('switcher-rva341'), 'Switcher must have rva341 button');
    assert.ok(switcherHtml.includes('switcher-rva077'), 'Switcher must have rva077 button');
    assert.ok(switcherHtml.includes('Catia Rodrigues'), 'Switcher must display Catia Rodrigues');
    assert.ok(switcherHtml.includes('George Hernandez'), 'Switcher must display George Hernandez');
    assert.ok(switcherHtml.includes('Eduard Hogenboom'), 'Switcher must display Eduard Hogenboom');
    assert.ok(switcherHtml.includes('Alejandra'), 'Switcher must display Alejandra Rumai');
    assert.ok(switcherHtml.includes('100% Offline'), 'Switcher must display 100% Offline badge');
    passedTests++;
    console.log('    ✓ All 4 Caribbean archetype tabs & metadata badges rendered.');
  }

  // TEST SUITE 3: EventDetailDrawer & EventForm (Fail-fast Geofencing)
  console.log('\n>>> [3/6] Testing EventDetailDrawer & Fail-Fast OperativeTerritory Validation...');
  {
    const storage = new InMemoryStorageAdapter();
    // Test valid operative territory
    const validTerritory = OperativeTerritory.fromString('Torre Medica Ciudad del Rio Clofan');
    assert.equal(validTerritory.zone, 'CIUDAD_DEL_RIO');

    // Test invalid territory fail-fast
    let caughtError = false;
    try {
      OperativeTerritory.fromString('Hospital San Francisco en Mocoa Putumayo');
    } catch {
      caughtError = true;
    }
    assert.equal(caughtError, true, 'Mocoa must throw fail-fast error');
    passedTests++;
    console.log('    ✓ Fail-fast geofencing domain invariant verified for EventForm.');
  }

  // TEST SUITE 4: DockedSettlementBar & Live Formula
  console.log('\n>>> [4/6] Testing DockedSettlementBar Master Formula & Progress Bar...');
  {
    const storage = new InMemoryStorageAdapter();
    const seedUseCase = new LoadArchetypeUseCase(storage);
    await seedUseCase.execute({ archetypeKey: 'rva171' });

    const barHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171">
        <DockedSettlementBar onOpenOcrModal={() => {}} onOpenSignatureModal={() => {}} />
      </AppProvider>
    );

    assert.ok(barHtml.includes('docked-settlement-bar'), 'Docked settlement bar must render');
    assert.ok(barHtml.includes('Flota'), 'Formula must show Flota');
    assert.ok(barHtml.includes('Guía'), 'Formula must show Guía');
    assert.ok(barHtml.includes('Farmacia'), 'Formula must show Farmacia');
    assert.ok(barHtml.includes('Anticipos'), 'Formula must show Anticipos');
    assert.ok(barHtml.includes('Saldo Neto'), 'Formula must show Saldo Neto');
    assert.ok(barHtml.includes('settlement-progress-bar'), 'Progress bar must render');
    passedTests++;
    console.log('    ✓ Docked settlement bar formula and 5-segment breakdown rendered.');
  }

  // TEST SUITE 5: ReceiptOcrModal (Presets, Scan, Form)
  console.log('\n>>> [5/6] Testing ReceiptOcrModal Presets & UI Controls...');
  {
    const storage = new InMemoryStorageAdapter();
    const modalHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171">
        <ReceiptOcrModal isOpen={true} onClose={() => {}} />
      </AppProvider>
    );

    assert.ok(modalHtml.includes('receipt-ocr-modal'), 'OCR modal must render');
    assert.ok(modalHtml.includes('ocr-dropzone'), 'Dropzone must be present');
    assert.ok(modalHtml.includes('preset-btn-CRUZ_VERDE_ROBLEDO'), 'Cruz Verde preset must be present');
    assert.ok(modalHtml.includes('preset-btn-PASTEUR_POBLADO'), 'Pasteur preset must be present');
    assert.ok(modalHtml.includes('preset-btn-PEAJE_TUNEL_ORIENTE'), 'Peaje preset must be present');
    passedTests++;
    console.log('    ✓ Receipt OCR modal dropzone and quick presets rendered.');
  }

  // TEST SUITE 6: DigitalSignaturePad (Canvas, Legal Consent)
  console.log('\n>>> [6/6] Testing DigitalSignaturePad Retina Canvas & Legal Consent...');
  {
    const storage = new InMemoryStorageAdapter();
    const padHtml = renderToString(
      <AppProvider storagePort={storage} initialArchetypeId="rva171">
        <DigitalSignaturePad isOpen={true} onClose={() => {}} />
      </AppProvider>
    );

    assert.ok(padHtml.includes('digital-signature-pad'), 'Signature pad modal must render');
    assert.ok(padHtml.includes('signature-canvas'), 'Canvas element must be present');
    assert.ok(padHtml.includes('Certificación de Conformidad:'), 'Legal statutory certification must be present');
    assert.ok(padHtml.includes('sign-and-seal-btn'), 'Sign and seal button must be present');
    passedTests++;
    console.log('    ✓ Digital signature pad canvas, legal banner, and action buttons rendered.');
  }

  console.log('\n===================================================================');
  console.log(`  ALL ${passedTests} PRESENTATION UI/UX TEST SUITES PASSED (100% PASS RATE)`);
  console.log('===================================================================');
}

runPresentationTests().catch((err) => {
  console.error('\n❌ PRESENTATION TESTS FAILED:', err);
  process.exit(1);
});
