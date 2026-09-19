import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const BASE_URL = 'https://medicaltrip.vercel.app';
const ARTIFACT_DIR = '/Users/miyo123/.gemini/antigravity/brain/26ddca71-2c34-4261-a87e-722f8575bcd1';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Iniciando Chrome Headless para captura forense de ventanas...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_capture_' + Date.now(),
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE_URL)}`, { method: 'PUT' });
    const target = await res.json();
    console.log('🔌 Conectado a target:', target.id);

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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false });

    console.log('🧭 Navegando a:', BASE_URL);
    await send('Page.navigate', { url: BASE_URL });
    await sleep(2500);

    const capture = async (filename) => {
      await sleep(600);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot.result?.data) {
        const buf = Buffer.from(shot.result.data, 'base64');
        const outPath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`📸 Guardada captura: ${filename} (${buf.length} bytes)`);
      }
    };

    // 1. Iniciar sesión como Admin
    console.log('🔑 Iniciando sesión como Administrador...');
    await evaluate(`
      (() => {
        const demoAdminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('admin / admin'));
        if (demoAdminBtn) {
          demoAdminBtn.click();
        } else {
          const userInputs = document.querySelectorAll('input');
          if (userInputs.length >= 2) {
            userInputs[0].value = 'admin';
            userInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            userInputs[1].value = 'admin';
            userInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            const submit = document.querySelector('button[type="submit"]');
            if (submit) submit.click();
          }
        }
      })()
    `);
    await sleep(2000);

    // 2. Ventana 1: Liquidación en Terreno (Settlement)
    console.log('🖼️ Capturando Ventana 1: Liquidación en Terreno...');
    await capture('window_1_settlement.png');

    // 3. Ventana 2: Usuarios y Roles
    console.log('🖼️ Navegando y capturando Ventana 2: Usuarios y Roles...');
    await evaluate(`
      (() => {
        const tab = document.querySelector('[data-testid="module-tab-users"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Usuarios'));
        if (tab) tab.click();
      })()
    `);
    await sleep(1000);
    await capture('window_2_users.png');

    // 4. Ventana 3: Plan Médico
    console.log('🖼️ Navegando y capturando Ventana 3: Plan Médico...');
    await evaluate(`
      (() => {
        const tab = document.querySelector('[data-testid="module-tab-plan"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Plan'));
        if (tab) tab.click();
      })()
    `);
    await sleep(1000);
    await capture('window_3_plan.png');

    // 5. Ventana 4: Pasajeros con Paciente
    console.log('🖼️ Navegando y capturando Ventana 4: Pasajeros con Paciente...');
    await evaluate(`
      (() => {
        const tab = document.querySelector('[data-testid="module-tab-passengers"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pasajeros'));
        if (tab) tab.click();
      })()
    `);
    await sleep(1000);
    await capture('window_4_passengers.png');

    // 6. Ventana 5: Portal del Paciente
    console.log('🖼️ Navegando y capturando Ventana 5: Portal del Paciente...');
    await send('Page.navigate', { url: `${BASE_URL}/?portal=paciente` });
    await sleep(2500);
    await capture('window_5_patient_portal.png');

    console.log('✅ Todas las capturas forenses fueron generadas con éxito.');
    ws.close();
  } catch (err) {
    console.error('❌ Error capturando ventanas:', err);
  } finally {
    chromeProcess.kill();
  }
}

run();
