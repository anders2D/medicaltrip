import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9444;
const PREVIEW_PORT = 4173;
const BASE_URL = `http://localhost:${PREVIEW_PORT}`;
const ARTIFACT_DIR = '/Users/miyo123/.gemini/antigravity/brain/26ddca71-2c34-4261-a87e-722f8575bcd1';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVisualAudit() {
  console.log('🚀 Iniciando servidor Vite Preview para pruebas visuales locales...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: '/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app',
    stdio: 'ignore',
  });

  await sleep(1500);

  console.log('🌐 Iniciando Google Chrome Headless con CDP en puerto', CDP_PORT);
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_visual_qa_' + Date.now(),
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(BASE_URL)}`, { method: 'PUT' });
    const target = await res.json();
    console.log('🔌 Conectado a Chrome CDP Target:', target.id);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
    };

    const send = (method, params = {}) => {
      const reqId = id++;
      return new Promise((resolve) => {
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    };

    const evaluate = async (expression) => {
      const resp = await send('Runtime.evaluate', { expression, returnByValue: true });
      return resp.result?.result?.value;
    };

    await new Promise((resolve) => { ws.onopen = resolve; });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    const capture = async (filename) => {
      await sleep(600);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot.result?.data) {
        const buf = Buffer.from(shot.result.data, 'base64');
        const outPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`📸 [${filename}] guardada (${buf.length} bytes)`);
      }
    };

    // ==========================================
    // SECCIÓN 1: PRUEBAS VISUALES DESKTOP (1440x900)
    // ==========================================
    console.log('\n🖥️ --- SECCIÓN DESKTOP WEB (1440x900) ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false });

    // 1.1 Iniciar sesión como Admin
    await send('Page.navigate', { url: BASE_URL });
    await sleep(1500);

    await evaluate(`
      (() => {
        const demoAdminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('admin / admin'));
        if (demoAdminBtn) demoAdminBtn.click();
      })()
    `);
    await sleep(1000);

    // 1.2 Vista Liquidación con Acompañante Físico (Expandir editor de horas de acompañante)
    console.log('📸 Capturando Web: Liquidación con Acompañante Físico (Yenny Roberto)...');
    await evaluate(`
      (() => {
        const shiftToggle = document.querySelector('[data-testid="row-toggle-shift-editor"]');
        if (shiftToggle) shiftToggle.click();
      })()
    `);
    await sleep(600);
    await capture('qa_web_1_settlement_companion.png');

    // 1.3 Modal de Envío de Enlace de Autogestión / Nueva Reserva
    console.log('📸 Capturando Web: Modal Enviar Enlace a Paciente (Nueva Reserva)...');
    await evaluate(`
      (() => {
        const sendLinkBtn = document.querySelector('[data-testid="btn-header-send-link"]');
        if (sendLinkBtn) sendLinkBtn.click();
      })()
    `);
    await sleep(600);
    await capture('qa_web_2_send_link_modal.png');

    // Cerrar modal
    await evaluate(`
      (() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cerrar') || b.querySelector('svg.lucide-x'));
        if (closeBtn) closeBtn.click();
      })()
    `);
    await sleep(400);

    // 1.4 Vista Pasajeros con Dossier Familiar & Protección PHI
    console.log('📸 Capturando Web: Módulo Pasajeros y Grupo Familiar...');
    await evaluate(`
      (() => {
        const paxNav = document.querySelector('[data-testid="nav-passengers"]');
        if (paxNav) paxNav.click();
      })()
    `);
    await sleep(600);
    await capture('qa_web_3_passengers_dossier.png');

    // 1.5 Vista Directorio de Personal
    console.log('📸 Capturando Web: Directorio Operativo de Personal...');
    await evaluate(`
      (() => {
        const usersNav = document.querySelector('[data-testid="nav-users"]');
        if (usersNav) usersNav.click();
      })()
    `);
    await sleep(600);
    await capture('qa_web_4_users_directory.png');

    // 1.6 Vista Plan Médico
    console.log('📸 Capturando Web: Plan Médico & Red Hospitalaria...');
    await evaluate(`
      (() => {
        const planNav = document.querySelector('[data-testid="nav-plan"]');
        if (planNav) planNav.click();
      })()
    `);
    await sleep(600);
    await capture('qa_web_5_medical_plan.png');

    // ==========================================
    // SECCIÓN 2: PRUEBAS VISUALES MOBILE (390x844)
    // ==========================================
    console.log('\n📱 --- SECCIÓN MOBILE (390x844 - iPhone 14) ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2.0, mobile: true });

    // 2.1 Liquidación en Mobile
    console.log('📸 Capturando Mobile: Liquidación en Terreno...');
    await evaluate(`
      (() => {
        const settlementNav = document.querySelector('[data-testid="nav-settlement"]');
        if (settlementNav) settlementNav.click();
      })()
    `);
    await sleep(600);
    await capture('qa_mobile_1_settlement.png');

    // 2.2 Desplegable de Pacientes en Mobile (Status Pill)
    console.log('📸 Capturando Mobile: Cockpit Switcher Desplegado...');
    await evaluate(`
      (() => {
        const trigger = document.querySelector('[data-testid="patient-dropdown-trigger"]');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(600);
    await capture('qa_mobile_2_patient_switcher_open.png');

    // Cerrar dropdown
    await evaluate(`
      (() => {
        const trigger = document.querySelector('[data-testid="patient-dropdown-trigger"]');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(400);

    // 2.3 Modal Enviar Link en Mobile
    console.log('📸 Capturando Mobile: Modal Enviar Link...');
    await evaluate(`
      (() => {
        const trigger = document.querySelector('[data-testid="patient-dropdown-trigger"]');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(300);
    await evaluate(`
      (() => {
        const sendLinkBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enviar Link'));
        if (sendLinkBtn) sendLinkBtn.click();
      })()
    `);
    await sleep(600);
    await capture('qa_mobile_3_send_link_modal.png');

    // ==========================================
    // SECCIÓN 3: CONSOLA EN TERRENO (COMPANION MODE)
    // ==========================================
    console.log('\n🗣️ --- SECCIÓN CONSOLA EN TERRENO (PERSONA EN SITIO) ---');
    // Salir y entrar como Companion
    await evaluate(`
      (() => {
        const logoutBtn = document.querySelector('[data-testid="btn-logout"]');
        if (logoutBtn) logoutBtn.click();
      })()
    `);
    await sleep(800);

    // Iniciar sesión como Yenny Roberto (Companion)
    await evaluate(`
      (() => {
        const demoCompBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('guia / guia'));
        if (demoCompBtn) demoCompBtn.click();
      })()
    `);
    await sleep(1000);
    console.log('📸 Capturando Mobile: Consola Operativa en Terreno (CompanionModeView)...');
    await capture('qa_mobile_4_companion_field_console.png');

    // ==========================================
    // SECCIÓN 4: PORTAL DEL PACIENTE (AUTOGESTIÓN)
    // ==========================================
    console.log('\n🧳 --- SECCIÓN PORTAL DEL PACIENTE ---');
    await send('Page.navigate', { url: `${BASE_URL}/?portal=paciente` });
    await sleep(1200);

    // Acceder al portal con código demo
    await evaluate(`
      (() => {
        const demoCodeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('RVA-171') || b.textContent.includes('Catia'));
        if (demoCodeBtn) {
          demoCodeBtn.click();
        } else {
          const input = document.querySelector('input');
          if (input) {
            input.value = 'RVA-171';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            const submit = document.querySelector('button[type="submit"]');
            if (submit) submit.click();
          }
        }
      })()
    `);
    await sleep(1200);
    console.log('📸 Capturando Mobile: Portal del Paciente (Itinerario & Guía)...');
    await capture('qa_mobile_5_patient_portal_inside.png');

    // ==========================================
    // SECCIÓN 5: REGISTRO DE AUTOGESTIÓN DE NUEVA RESERVA
    // ==========================================
    console.log('\n📝 --- SECCIÓN AUTO-REGISTRO DE NUEVA RESERVA ---');
    await send('Page.navigate', { url: `${BASE_URL}/?token=INV-2026-DEMO` });
    await sleep(1500);
    console.log('📸 Capturando Mobile: Formulario de Auto-Registro (Paciente + Acompañantes)...');
    await capture('qa_mobile_6_patient_self_registration.png');

    console.log('\n🎉 ¡Auditoría visual completada con éxito! Todas las capturas guardadas en el directorio de artefactos.');
  } catch (err) {
    console.error('❌ Error durante la auditoría visual:', err);
  } finally {
    chromeProcess.kill();
    previewProcess.kill();
  }
}

runVisualAudit();
