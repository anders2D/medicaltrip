import { spawn } from 'child_process';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9556;
const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testAllJourneys() {
  console.log('🚀 [TEST HARNESS PROBE] Starting Chrome...');
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=/tmp/chrome_journey_${Date.now()}`,
    'about:blank',
  ]);

  await sleep(1500);

  const errors = [];
  const warnings = [];
  const exceptions = [];
  const networkFailures = [];

  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(BASE_URL)}`, { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();
    const eventHandlers = new Map();

    function on(method, fn) {
      if (!eventHandlers.has(method)) eventHandlers.set(method, []);
      eventHandlers.get(method).push(fn);
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
        return;
      }
      if (msg.method && eventHandlers.has(msg.method)) {
        for (const handler of eventHandlers.get(msg.method)) {
          handler(msg.params);
        }
      }
    };

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve) => {
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    const evalJs = async (expr) => {
      const resp = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (resp.result?.exceptionDetails) {
        throw new Error(resp.result.exceptionDetails.exception?.description || resp.result.exceptionDetails.text);
      }
      return resp.result?.result?.value;
    };

    on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map((a) => a.value ?? a.description ?? `[${a.type}]`).join(' ');
      if (params.type === 'error') {
        errors.push({ text, stack: params.stackTrace });
        console.error('❌ [CONSOLE.ERROR]', text);
      } else if (params.type === 'warning') {
        warnings.push({ text });
        console.warn('⚠️ [CONSOLE.WARN]', text);
      }
    });

    on('Runtime.exceptionThrown', (params) => {
      const desc = params.exceptionDetails.exception?.description || params.exceptionDetails.text;
      exceptions.push({ desc, details: params.exceptionDetails });
      console.error('💥 [RUNTIME EXCEPTION]', desc);
    });

    on('Network.responseReceived', (params) => {
      const url = params.response.url;
      const status = params.response.status;
      if (url.includes('/rest/v1/')) {
        console.log(`📡 [SUPABASE] ${params.response.status} ${url.split('?')[0]}`);
        if (status >= 400) {
          networkFailures.push({ url, status, statusText: params.response.statusText });
          console.error(`🚨 [NETWORK FAIL] ${status} ${url}`);
        }
      }
    });

    await new Promise((resolve) => { ws.onopen = resolve; });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setUserAgentOverride', {
      userAgent: 'MedicalTripAutomation/1.0 (Macintosh; Intel Mac OS X 10_15_7)'
    });

    console.log('\n--- JOURNEY 1: Admin Login & Modules ---');
    await send('Page.navigate', { url: BASE_URL });
    await sleep(2000);

    // 1.1 Login as admin
    const loginRes = await evalJs(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('admin / admin'));
        if (btn) { btn.click(); return 'clicked demo admin'; }
        return 'demo admin btn not found';
      })()
    `);
    console.log('1.1 Login result:', loginRes);
    await sleep(1500);

    // 1.2 Module 1: Settlement
    console.log('1.2 In Settlement module...');
    const settlementState = await evalJs(`
      (() => {
        const toggle = document.querySelector('[data-testid="row-toggle-shift-editor"]');
        if (toggle) toggle.click();
        return {
          hasToggle: !!toggle,
          bodyText: document.body.innerText.substring(0, 150)
        };
      })()
    `);
    console.log('Settlement state:', settlementState);
    await sleep(800);

    // 1.3 Module 2: Users
    console.log('1.3 Navigating to Users/Directorio...');
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-testid="nav-users"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Directorio') || b.textContent.includes('Usuarios'));
        if (btn) btn.click();
      })()
    `);
    await sleep(800);
    const usersCount = await evalJs(`document.querySelectorAll('h3, h4').length`);
    console.log('Users headings count:', usersCount);

    // 1.4 Module 3: Plan
    console.log('1.4 Navigating to Medical Plan...');
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-testid="nav-plan"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Plan'));
        if (btn) btn.click();
      })()
    `);
    await sleep(800);

    // 1.5 Module 4: Passengers
    console.log('1.5 Navigating to Passengers Dossier...');
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-testid="nav-passengers"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pasajeros'));
        if (btn) btn.click();
      })()
    `);
    await sleep(800);

    // 1.6 Open Send Link Modal
    console.log('1.6 Opening Send Link Modal...');
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-testid="btn-header-send-link"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enviar Enlace') || b.textContent.includes('Enviar Link'));
        if (btn) btn.click();
      })()
    `);
    await sleep(800);

    // Close modal
    await evalJs(`
      (() => {
        const close = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cerrar') || b.querySelector('svg.lucide-x'));
        if (close) close.click();
      })()
    `);
    await sleep(500);

    // 1.7 Switch Patient in Cockpit Switcher
    console.log('1.7 Testing Cockpit Patient Switcher...');
    await evalJs(`
      (() => {
        const trigger = document.querySelector('[data-testid="patient-dropdown-trigger"]');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(500);
    const switchRes = await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const catia = items.find(b => b.textContent.includes('Catia') || b.textContent.includes('RVA171'));
        if (catia) {
          catia.click();
          return 'switched to Catia';
        }
        return 'Catia item not found';
      })()
    `);
    console.log('Switch result:', switchRes);
    await sleep(1500);

    // Switch back to Natalie Rumai
    await evalJs(`
      (() => {
        const trigger = document.querySelector('[data-testid="patient-dropdown-trigger"]');
        if (trigger) trigger.click();
      })()
    `);
    await sleep(500);
    await evalJs(`
      (() => {
        const items = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const rumai = items.find(b => b.textContent.includes('Natalie') || b.textContent.includes('RVA350'));
        if (rumai) rumai.click();
      })()
    `);
    await sleep(1500);

    // 1.8 Logout
    console.log('1.8 Logging out from Admin...');
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-testid="btn-logout"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cerrar Sesión') || b.textContent.includes('Salir'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);

    console.log('\n--- JOURNEY 2: Companion Mode ---');
    // Login as Companion
    await evalJs(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('guia / guia'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    const companionHeader = await evalJs(`document.body.innerText.substring(0, 200)`);
    console.log('Companion screen snippet:', companionHeader);

    // Logout from Companion
    await evalJs(`
      (() => {
        const btn = document.querySelector('[data-testid="btn-logout"]') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cerrar Sesión') || b.textContent.includes('Salir'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);

    console.log('\n--- JOURNEY 3: Patient Portal ---');
    await send('Page.navigate', { url: `${BASE_URL}/?portal=paciente` });
    await sleep(1500);
    const patientLoginRes = await evalJs(`
      (() => {
        const quickBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('RVA-171') || b.textContent.includes('Catia') || b.textContent.includes('RVA-350'));
        if (quickBtn) {
          quickBtn.click();
          return 'clicked quick patient demo code';
        }
        return 'no quick patient demo btn';
      })()
    `);
    console.log('Patient login attempt:', patientLoginRes);
    await sleep(1500);
    const patientPortalText = await evalJs(`document.body.innerText.substring(0, 200)`);
    console.log('Patient portal text:', patientPortalText);

    console.log('\n--- JOURNEY 4: Patient Self-Registration View ---');
    await send('Page.navigate', { url: `${BASE_URL}/?token=INV-2026-DEMO` });
    await sleep(1500);
    const selfRegInputs = await evalJs(`
      (() => {
        return {
          inputs: Array.from(document.querySelectorAll('input')).map(i => i.placeholder || i.name || i.id),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean)
        };
      })()
    `);
    console.log('Self registration inputs:', selfRegInputs);

    console.log('\n======================================================');
    console.log('  JOURNEY AUDIT SUMMARY');
    console.log('======================================================');
    console.log('Total Console Errors:', errors.length);
    console.log('Total Warnings:', warnings.length);
    console.log('Total Exceptions:', exceptions.length);
    console.log('Total Network Failures (4xx/5xx):', networkFailures.length);
    if (networkFailures.length > 0) {
      console.log('Failures list:', networkFailures);
    }
    console.log('======================================================');

    ws.close();
  } catch (err) {
    console.error('Audit crashed:', err);
  } finally {
    chrome.kill();
  }
}

testAllJourneys();
