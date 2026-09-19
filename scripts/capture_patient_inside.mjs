import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9334;
const BASE_URL = 'https://medicaltrip.vercel.app/?portal=paciente';
const ARTIFACT_DIR = '/Users/miyo123/.gemini/antigravity/brain/26ddca71-2c34-4261-a87e-722f8575bcd1';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_patient_' + Date.now(),
    'about:blank',
  ]);

  await sleep(1500);

  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE_URL)}`, { method: 'PUT' });
    const target = await res.json();
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

    await send('Page.navigate', { url: BASE_URL });
    await sleep(2000);

    // Clic en Curazao - Catia demo
    await evaluate(`
      (() => {
        const catiaBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Curazao - Catia'));
        if (catiaBtn) catiaBtn.click();
      })()
    `);
    await sleep(2000);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result?.data) {
      const buf = Buffer.from(shot.result.data, 'base64');
      fs.writeFileSync(path.join(ARTIFACT_DIR, 'window_6_patient_inside.png'), buf);
      console.log('📸 Guardada captura: window_6_patient_inside.png');
    }
    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chromeProcess.kill();
  }
}
run();
