/**
 * Chrome / Chromium Process Manager & Launcher
 * 
 * Manages headless Chromium process lifecycle with dynamic debugging port
 * allocation, mobile hardware emulation flags, and WebSocket endpoint discovery.
 */

import { spawn, ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as http from 'node:http';

export interface ChromeLaunchOptions {
  executablePath?: string;
  port?: number;
  headless?: boolean | 'new';
  userDataDir?: string;
  windowSize?: { width: number; height: number };
  additionalArgs?: string[];
  mobileEmulation?: boolean;
  timeoutMs?: number;
  env?: Record<string, string>;
}

export interface LaunchedChromeInstance {
  process: ChildProcess;
  port: number;
  wsEndpoint: string;
  userDataDir: string;
  close: () => Promise<void>;
  isAlive: () => boolean;
}

export interface ChromeVersionInfo {
  Browser: string;
  'Protocol-Version': string;
  'User-Agent': string;
  'V8-Version': string;
  'WebKit-Version': string;
  webSocketDebuggerUrl: string;
}

/**
 * Discovers standard Chrome / Chromium executable paths across platforms
 */
export function findChromeExecutable(): string | null {
  const platform = os.platform();

  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  if (platform === 'darwin') {
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      `${os.homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
    ];
    for (const p of macPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (platform === 'linux') {
    const linuxPaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) return p;
    }
  } else if (platform === 'win32') {
    const winPaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    ];
    for (const p of winPaths) {
      if (fs.existsSync(p)) return p;
    }
  }

  return null;
}

/**
 * Queries the Chrome HTTP debugging endpoint to fetch WebSocket URL
 */
export async function getWebSocketDebuggerUrl(port: number, host: string = '127.0.0.1', timeoutMs: number = 10000): Promise<ChromeVersionInfo> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const req = http.get(`http://${host}:${port}/json/version`, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Status ${res.statusCode}`));
            return;
          }
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => resolve(raw));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      const parsed = JSON.parse(data) as ChromeVersionInfo;
      if (parsed.webSocketDebuggerUrl) {
        return parsed;
      }
    } catch {
      // Retry after small delay
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  throw new Error(`Failed to retrieve webSocketDebuggerUrl from Chrome at ${host}:${port} within ${timeoutMs}ms`);
}

/**
 * Builds standard CLI arguments for headless Chrome launch
 */
export function buildChromeFlags(options: {
  port: number;
  userDataDir: string;
  headless?: boolean | 'new';
  windowSize?: { width: number; height: number };
  mobileEmulation?: boolean;
  additionalArgs?: string[];
}): string[] {
  const width = options.windowSize?.width ?? 390;
  const height = options.windowSize?.height ?? 844;
  const headlessMode = options.headless === false ? false : (options.headless === 'new' || options.headless === true ? '--headless=new' : '--headless=new');

  const flags = [
    `--remote-debugging-port=${options.port}`,
    `--user-data-dir=${options.userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
    '--disable-gpu',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    '--no-sandbox',
    '--password-store=basic',
    '--use-mock-keychain',
    `--window-size=${width},${height}`
  ];

  if (headlessMode) {
    flags.push(headlessMode);
  }

  if (options.mobileEmulation) {
    flags.push(
      '--use-mobile-user-agent',
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
      '--enable-viewport'
    );
  }

  if (options.additionalArgs) {
    flags.push(...options.additionalArgs);
  }

  return flags;
}

/**
 * Finds an available TCP port for debugging
 */
export async function findAvailablePort(startPort: number = 9222): Promise<number> {
  const net = await import('node:net');
  
  return new Promise((resolve, reject) => {
    let port = startPort;
    const tryPort = () => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        port = Math.floor(Math.random() * (60000 - 10000)) + 10000;
        tryPort();
      });
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(port));
      });
    };
    tryPort();
  });
}

/**
 * Launches a headless Chrome process and resolves when CDP WebSocket is ready
 */
export async function launchChrome(options: ChromeLaunchOptions = {}): Promise<LaunchedChromeInstance> {
  const executablePath = options.executablePath || findChromeExecutable();
  if (!executablePath) {
    throw new Error('Chrome/Chromium executable not found. Set CHROME_PATH or install Chrome.');
  }

  const port = options.port ?? (await findAvailablePort());
  const isCustomDir = !!options.userDataDir;
  const userDataDir = options.userDataDir || fs.mkdtempSync(path.join(os.tmpdir(), 'chrome_e2e_'));

  const flags = buildChromeFlags({
    port,
    userDataDir,
    headless: options.headless ?? 'new',
    windowSize: options.windowSize,
    mobileEmulation: options.mobileEmulation ?? true,
    additionalArgs: options.additionalArgs
  });

  const proc = spawn(executablePath, flags, {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...options.env }
  });

  let killed = false;
  const isAlive = () => !killed && proc.exitCode === null && proc.signalCode === null;

  try {
    const versionInfo = await getWebSocketDebuggerUrl(port, '127.0.0.1', options.timeoutMs ?? 15000);

    const close = async (): Promise<void> => {
      if (killed) return;
      killed = true;

      return new Promise<void>((resolve) => {
        const killTimer = setTimeout(() => {
          try {
            proc.kill('SIGKILL');
          } catch {}
          cleanupDir();
          resolve();
        }, 3000);

        const cleanupDir = () => {
          if (!isCustomDir && fs.existsSync(userDataDir)) {
            try {
              fs.rmSync(userDataDir, { recursive: true, force: true });
            } catch {}
          }
        };

        proc.once('exit', () => {
          clearTimeout(killTimer);
          cleanupDir();
          resolve();
        });

        try {
          proc.kill('SIGTERM');
        } catch {
          clearTimeout(killTimer);
          cleanupDir();
          resolve();
        }
      });
    };

    return {
      process: proc,
      port,
      wsEndpoint: versionInfo.webSocketDebuggerUrl,
      userDataDir,
      close,
      isAlive
    };
  } catch (err) {
    proc.kill('SIGKILL');
    if (!isCustomDir && fs.existsSync(userDataDir)) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {}
    }
    throw err;
  }
}
