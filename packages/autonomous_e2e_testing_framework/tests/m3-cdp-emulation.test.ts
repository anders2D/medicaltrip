/**
 * Test Suite: Milestone 3 - Low-Level Chrome DevTools Protocol (CDP) Hardware Emulation
 * 
 * Verifies direct WebSocket JSON-RPC 2.0 client, synthetic multi-touch gesture injection
 * (Pinch-to-Zoom, Drag-to-Pan, Continuous Pressure-Sensitive Signatures), network & CPU degradation,
 * and modal focus-trap override injection.
 */

import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert/strict';

import {
  MockCDPClient,
  CDPClient
} from '../src/cdp/cdp-client.js';
import {
  findChromeExecutable,
  buildChromeFlags,
  getWebSocketDebuggerUrl
} from '../src/cdp/browser-launcher.js';
import {
  dispatchPinchToZoom,
  dispatchDragToPan,
  dispatchPressureStroke,
  dispatchTouchTap,
  generateRealisticSignature
} from '../src/cdp/gesture-dispatcher.js';
import {
  NETWORK_PROFILES,
  emulateNetwork,
  simulateNetworkFlap,
  clearEmulation
} from '../src/cdp/network-emulator.js';
import {
  FOCUS_TRAP_OVERRIDE_SCRIPT,
  injectFocusTrapOverride,
  removeFocusTrapOverride
} from '../src/cdp/focus-trap-override.js';

describe('M3: Direct WebSocket CDP Client & JSON-RPC Protocol', () => {
  let mockCdp: MockCDPClient;

  beforeEach(() => {
    mockCdp = new MockCDPClient();
  });

  it('should send commands and record method and parameters', async () => {
    mockCdp.mockResponse('Page.navigate', { frameId: 'frame_123', loaderId: 'loader_456' });

    const result = await mockCdp.send('Page.navigate', { url: 'https://medicaltrip.co/app' });

    assert.equal(mockCdp.sentCommands.length, 1);
    assert.equal(mockCdp.sentCommands[0].method, 'Page.navigate');
    assert.deepEqual(mockCdp.sentCommands[0].params, { url: 'https://medicaltrip.co/app' });
    assert.deepEqual(result, { frameId: 'frame_123', loaderId: 'loader_456' });
  });

  it('should dispatch events to registered listeners', async () => {
    let eventReceived: any = null;
    mockCdp.on('Network.requestWillBeSent', (params) => {
      eventReceived = params;
    });

    mockCdp.simulateEvent('Network.requestWillBeSent', {
      requestId: 'req_99',
      request: { url: 'https://medicaltrip.co/api/v1/quotes' }
    });

    assert.ok(eventReceived);
    assert.equal(eventReceived.requestId, 'req_99');
    assert.equal(eventReceived.request.url, 'https://medicaltrip.co/api/v1/quotes');
  });

  it('should create and route commands to target CDPSession', async () => {
    const session = await mockCdp.createSession('target_tab_1');
    assert.ok(session.sessionId);
    assert.equal(session.targetId, 'target_tab_1');

    await session.send('DOM.getDocument', { depth: 1 });

    const lastCommand = mockCdp.sentCommands[mockCdp.sentCommands.length - 1];
    assert.equal(lastCommand.method, 'DOM.getDocument');
    assert.equal(lastCommand.sessionId, session.sessionId);
  });

  it('should throw when sending commands to a disconnected client', async () => {
    await mockCdp.close();
    assert.equal(mockCdp.isConnected(), false);

    await assert.rejects(async () => {
      await mockCdp.send('Page.reload');
    }, /Mock CDP client is disconnected/);
  });
});

describe('M3: Chrome Browser Launcher & Configuration', () => {
  it('should build standard flags for headless mobile emulation', () => {
    const flags = buildChromeFlags({
      port: 9222,
      userDataDir: '/tmp/test_profile',
      headless: 'new',
      windowSize: { width: 390, height: 844 },
      mobileEmulation: true,
      additionalArgs: ['--custom-flag=true']
    });

    assert.ok(flags.includes('--remote-debugging-port=9222'));
    assert.ok(flags.includes('--user-data-dir=/tmp/test_profile'));
    assert.ok(flags.includes('--headless=new'));
    assert.ok(flags.includes('--window-size=390,844'));
    assert.ok(flags.includes('--no-sandbox'));
    assert.ok(flags.includes('--disable-gpu'));
    assert.ok(flags.includes('--use-mobile-user-agent'));
    assert.ok(flags.includes('--custom-flag=true'));
  });

  it('should discover executable path or return string on supported systems', () => {
    const execPath = findChromeExecutable();
    // In CI or environment with Chrome installed, returns a path; otherwise null
    if (execPath !== null) {
      assert.equal(typeof execPath, 'string');
      assert.ok(execPath.length > 0);
    }
  });
});

describe('M3: Multi-Touch Gesture Dispatcher', () => {
  let mockCdp: MockCDPClient;

  beforeEach(() => {
    mockCdp = new MockCDPClient();
  });

  it('should dispatch accurate Pinch-to-Zoom touch sequence with dynamic span and force', async () => {
    const center = { x: 200, y: 300 };
    const initialSpan = 100;
    const finalSpan = 300;
    const steps = 10;

    await dispatchPinchToZoom(mockCdp, center, initialSpan, finalSpan, {
      steps,
      durationMs: 0,
      delayFn: async () => {}
    });

    // Expect: 1 touchStart + 10 touchMove + 1 touchEnd = 12 CDP calls
    const touchCommands = mockCdp.sentCommands.filter((c) => c.method === 'Input.dispatchTouchEvent');
    assert.equal(touchCommands.length, steps + 2);

    // Verify touchStart
    const startCmd = touchCommands[0].params;
    assert.equal(startCmd.type, 'touchStart');
    assert.equal(startCmd.touchPoints.length, 2);
    assert.equal(startCmd.touchPoints[0].x, center.x - initialSpan / 2); // 150
    assert.equal(startCmd.touchPoints[1].x, center.x + initialSpan / 2); // 250
    assert.equal(startCmd.touchPoints[0].y, 300);
    assert.equal(startCmd.touchPoints[1].y, 300);

    // Verify intermediate touchMoves interpolate outwards
    const midCmd = touchCommands[5].params;
    assert.equal(midCmd.type, 'touchMove');
    assert.equal(midCmd.touchPoints.length, 2);
    const midSpan = midCmd.touchPoints[1].x - midCmd.touchPoints[0].x;
    assert.ok(midSpan > initialSpan && midSpan < finalSpan);

    // Verify touchEnd
    const endCmd = touchCommands[touchCommands.length - 1].params;
    assert.equal(endCmd.type, 'touchEnd');
    assert.equal(endCmd.touchPoints.length, 0);
  });

  it('should dispatch Drag-to-Pan touch events with ease curve', async () => {
    const start = { x: 50, y: 100 };
    const end = { x: 250, y: 500 };
    const steps = 8;

    await dispatchDragToPan(mockCdp, start, end, {
      steps,
      durationMs: 0,
      delayFn: async () => {}
    });

    const touchCommands = mockCdp.sentCommands.filter((c) => c.method === 'Input.dispatchTouchEvent');
    assert.equal(touchCommands.length, steps + 2);

    // First is touchStart at start coords
    assert.equal(touchCommands[0].params.type, 'touchStart');
    assert.equal(touchCommands[0].params.touchPoints[0].x, 50);
    assert.equal(touchCommands[0].params.touchPoints[0].y, 100);

    // Last move reaches end coords
    const lastMove = touchCommands[touchCommands.length - 2].params;
    assert.equal(lastMove.type, 'touchMove');
    assert.equal(lastMove.touchPoints[0].x, 250);
    assert.equal(lastMove.touchPoints[0].y, 500);

    // Final is touchEnd
    assert.equal(touchCommands[touchCommands.length - 1].params.type, 'touchEnd');
  });

  it('should dispatch continuous pressure-sensitive handwriting strokes for digital signatures', async () => {
    const trajectory = [
      { x: 100, y: 200, force: 0.2 },
      { x: 120, y: 210, force: 0.5 },
      { x: 140, y: 230, force: 0.8 },
      { x: 160, y: 240, force: 0.9 },
      { x: 180, y: 220, force: 0.3 }
    ];

    await dispatchPressureStroke(mockCdp, trajectory, {
      durationMs: 0,
      delayFn: async () => {}
    });

    const touchCommands = mockCdp.sentCommands.filter((c) => c.method === 'Input.dispatchTouchEvent');
    assert.equal(touchCommands.length, trajectory.length + 1); // 1 start + 4 moves + 1 end = 6 calls (start takes first point)

    // Verify force values are propagated
    assert.equal(touchCommands[0].params.touchPoints[0].force, 0.2);
    assert.equal(touchCommands[1].params.touchPoints[0].force, 0.5);
    assert.equal(touchCommands[2].params.touchPoints[0].force, 0.8);
    assert.equal(touchCommands[3].params.touchPoints[0].force, 0.9);
    assert.equal(touchCommands[4].params.touchPoints[0].force, 0.3);
  });

  it('should generate bounded realistic signature trajectories', () => {
    const bounds = { x: 50, y: 50, width: 300, height: 150 };
    const points = generateRealisticSignature(bounds, 25);

    assert.equal(points.length, 25);
    for (const pt of points) {
      assert.ok(pt.x >= bounds.x - 20 && pt.x <= bounds.x + bounds.width + 20, `X ${pt.x} out of bounds`);
      assert.ok(pt.y >= bounds.y - 20 && pt.y <= bounds.y + bounds.height + 20, `Y ${pt.y} out of bounds`);
      assert.ok(pt.force !== undefined && pt.force >= 0.1 && pt.force <= 1.0, `Force ${pt.force} invalid`);
    }
  });

  it('should dispatch discrete Touch Tap', async () => {
    await dispatchTouchTap(mockCdp, { x: 150, y: 250 }, { durationMs: 0, delayFn: async () => {} });

    const touchCommands = mockCdp.sentCommands.filter((c) => c.method === 'Input.dispatchTouchEvent');
    assert.equal(touchCommands.length, 2);
    assert.equal(touchCommands[0].params.type, 'touchStart');
    assert.equal(touchCommands[0].params.touchPoints[0].x, 150);
    assert.equal(touchCommands[1].params.type, 'touchEnd');
  });
});

describe('M3: Deterministic Network & CPU Condition Emulator', () => {
  let mockCdp: MockCDPClient;

  beforeEach(() => {
    mockCdp = new MockCDPClient();
  });

  it('should enforce Fast 3G conditions (150ms RTT, 1.6Mbps down, 750Kbps up)', async () => {
    const applied = await emulateNetwork(mockCdp, 'FAST_3G');

    assert.equal(applied.latency, 150);
    assert.equal(applied.offline, false);
    assert.equal(applied.connectionType, 'cellular3g');

    const networkCmd = mockCdp.sentCommands.find((c) => c.method === 'Network.emulateNetworkConditions');
    assert.ok(networkCmd);
    assert.equal(networkCmd.params.latency, 150);
    assert.equal(networkCmd.params.downloadThroughput, NETWORK_PROFILES.FAST_3G.downloadThroughput);
    assert.equal(networkCmd.params.uploadThroughput, NETWORK_PROFILES.FAST_3G.uploadThroughput);

    const cpuCmd = mockCdp.sentCommands.find((c) => c.method === 'Emulation.setCPUThrottlingRate');
    assert.ok(cpuCmd);
    assert.equal(cpuCmd.params.rate, 1);
  });

  it('should enforce Slow 3G conditions (400ms RTT, 4x CPU throttle)', async () => {
    const applied = await emulateNetwork(mockCdp, 'SLOW_3G');

    assert.equal(applied.latency, 400);
    assert.equal(applied.cpuSlowdown, 4);

    const cpuCmd = mockCdp.sentCommands.find((c) => c.method === 'Emulation.setCPUThrottlingRate');
    assert.ok(cpuCmd);
    assert.equal(cpuCmd.params.rate, 4);
  });

  it('should enforce Offline conditions (0 bps, 4x CPU slowdown)', async () => {
    const applied = await emulateNetwork(mockCdp, 'OFFLINE');

    assert.equal(applied.offline, true);
    assert.equal(applied.downloadThroughput, 0);
    assert.equal(applied.uploadThroughput, 0);
  });

  it('should simulate network flapping cycle (offline -> online -> offline)', async () => {
    await simulateNetworkFlap(mockCdp, {
      cycles: 2,
      offlineDurationMs: 0,
      onlineDurationMs: 0,
      onlineProfile: 'FAST_3G',
      delayFn: async () => {}
    });

    const networkCmds = mockCdp.sentCommands.filter((c) => c.method === 'Network.emulateNetworkConditions');
    // 2 cycles * (1 offline + 1 online) = 4 commands
    assert.equal(networkCmds.length, 4);
    assert.equal(networkCmds[0].params.offline, true);
    assert.equal(networkCmds[1].params.offline, false);
    assert.equal(networkCmds[2].params.offline, true);
    assert.equal(networkCmds[3].params.offline, false);
  });

  it('should clear emulation back to unthrottled baseline', async () => {
    await clearEmulation(mockCdp);

    const lastNetwork = mockCdp.sentCommands.filter((c) => c.method === 'Network.emulateNetworkConditions').pop();
    assert.ok(lastNetwork);
    assert.equal(lastNetwork.params.offline, false);
    assert.equal(lastNetwork.params.downloadThroughput, -1);

    const lastCpu = mockCdp.sentCommands.filter((c) => c.method === 'Emulation.setCPUThrottlingRate').pop();
    assert.ok(lastCpu);
    assert.equal(lastCpu.params.rate, 1);
  });
});

describe('M3: Modal Focus-Trap & Fullscreen Override Injector', () => {
  let mockCdp: MockCDPClient;

  beforeEach(() => {
    mockCdp = new MockCDPClient();
  });

  it('should inject focus-trap override via Page and Runtime domains', async () => {
    const result = await injectFocusTrapOverride(mockCdp);

    assert.ok(result.scriptIdentifier);
    assert.equal(result.appliedImmediately, true);

    const pageCmd = mockCdp.sentCommands.find((c) => c.method === 'Page.addScriptToEvaluateOnNewDocument');
    assert.ok(pageCmd);
    assert.ok(pageCmd.params.source.includes('window.__focusTrapOverrideInstalled'));
    assert.ok(pageCmd.params.source.includes('event.key === \'Tab\''));

    const runtimeCmd = mockCdp.sentCommands.find((c) => c.method === 'Runtime.evaluate');
    assert.ok(runtimeCmd);
    assert.equal(runtimeCmd.params.expression, FOCUS_TRAP_OVERRIDE_SCRIPT);
  });

  it('should remove persistent focus trap script by identifier', async () => {
    await removeFocusTrapOverride(mockCdp, 'script_id_123');

    const removeCmd = mockCdp.sentCommands.find((c) => c.method === 'Page.removeScriptToEvaluateOnNewDocument');
    assert.ok(removeCmd);
    assert.equal(removeCmd.params.identifier, 'script_id_123');
  });
});
