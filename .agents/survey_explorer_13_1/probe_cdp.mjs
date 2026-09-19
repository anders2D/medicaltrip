import { spawn } from 'child_process';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9555;
const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function probe() {
  console.log('[PROBE] Launching Chrome Headless on CDP port', CDP_PORT);
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-agent=MedicalTripAutomation/1.0 (Macintosh; Intel Mac OS X 10_15_7)',
    `--user-data-dir=/tmp/chrome_probe_${Date.now()}`,
    'about:blank',
  ]);

  await sleep(1500);

  const consoleLogs = [];
  const exceptions = [];
  const networkRequests = [];
  const networkResponses = [];
  const supabaseCalls = [];

  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(BASE_URL)}`, { method: 'PUT' });
    const target = await res.json();
    console.log('[PROBE] Connected to target:', target.id);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();
    const eventHandlers = new Map();

    function on(eventMethod, fn) {
      if (!eventHandlers.has(eventMethod)) eventHandlers.set(eventMethod, []);
      eventHandlers.get(eventMethod).push(fn);
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

    on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map((a) => a.value ?? a.description ?? `[${a.type}]`).join(' ');
      consoleLogs.push({ type: params.type, text, timestamp: params.timestamp });
      console.log(`[CONSOLE ${params.type.toUpperCase()}] ${text}`);
    });

    on('Runtime.exceptionThrown', (params) => {
      const desc = params.exceptionDetails.exception?.description || params.exceptionDetails.text;
      exceptions.push({ desc, details: params.exceptionDetails });
      console.error(`[EXCEPTION] ${desc}`);
    });

    on('Network.requestWillBeSent', (params) => {
      const url = params.request.url;
      if (url.includes('/rest/v1/')) {
        console.log(`[SUPABASE REQ] ${params.request.method} ${url}`);
        console.log(`[SUPABASE HEADERS]`, JSON.stringify(params.request.headers));
        supabaseCalls.push({
          requestId: params.requestId,
          method: params.request.method,
          url,
          headers: params.request.headers,
          postData: params.request.postData,
        });
      }
    });

    on('Network.responseReceived', async (params) => {
      const url = params.response.url;
      if (url.includes('/rest/v1/')) {
        console.log(`[SUPABASE RESP] ${params.response.status} ${params.response.statusText} ${url}`);
        try {
          const bodyResp = await send('Network.getResponseBody', { requestId: params.requestId });
          console.log(`[SUPABASE RESP BODY]`, bodyResp.result?.body);
        } catch (e) {
          console.log(`[SUPABASE RESP BODY ERR]`, e.message);
        }
      }
    });

    await new Promise((resolve) => { ws.onopen = resolve; });

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    // Override User-Agent to bypass Supabase browser secret key block
    await send('Network.setUserAgentOverride', {
      userAgent: 'MedicalTripAutomation/1.0 (Macintosh; Intel Mac OS X 10_15_7)'
    });

    console.log('[PROBE] Navigating to:', BASE_URL);
    await send('Page.navigate', { url: BASE_URL });
    await sleep(3000);

    // Let's inspect page title and DOM root
    const pageTitle = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    const rootHtml = await send('Runtime.evaluate', {
      expression: 'document.getElementById("root") ? document.getElementById("root").innerHTML.substring(0, 300) : "no root"',
      returnByValue: true
    });

    console.log('[PROBE] Page Title:', pageTitle.result?.result?.value);
    console.log('[PROBE] Root snippet:', rootHtml.result?.result?.value);

    // Check login buttons
    const buttons = await send('Runtime.evaluate', {
      expression: 'Array.from(document.querySelectorAll("button")).map(b => b.textContent.trim())',
      returnByValue: true
    });
    console.log('[PROBE] Buttons found on initial load:', buttons.result?.result?.value);

    console.log('\n[PROBE SUMMARY]');
    console.log('Console logs count:', consoleLogs.length);
    console.log('Exceptions count:', exceptions.length);
    console.log('Supabase calls count:', supabaseCalls.length);

    ws.close();
  } catch (err) {
    console.error('[PROBE ERROR]', err);
  } finally {
    chrome.kill();
  }
}

probe();
