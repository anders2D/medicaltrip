/**
 * Deterministic Network & CPU Condition Emulator
 * 
 * Enforces standardized network latency, bandwidth constraints (Fast 3G, Slow 3G, Offline),
 * connection flapping simulation, and hardware CPU degradation via CDP.
 */

import { CDPDispatcherClient } from './gesture-dispatcher.js';

export type NetworkProfileName = 'FAST_3G' | 'SLOW_3G' | 'OFFLINE' | 'NO_THROTTLE' | 'EDGE_2G' | 'LTE_4G';

export interface NetworkConditions {
  offline: boolean;
  latency: number;             // RTT latency in milliseconds
  downloadThroughput: number;  // Max download speed in bytes/second (-1 for unlimited)
  uploadThroughput: number;    // Max upload speed in bytes/second (-1 for unlimited)
  connectionType?: 'none' | 'cellular2g' | 'cellular3g' | 'cellular4g' | 'wifi' | 'ethernet' | 'other';
  cpuSlowdown?: number;        // CPU throttling multiplier (1 = normal, 4 = 4x slowdown)
}

/**
 * Standard W3C / Chrome Network Emulation Profiles
 */
export const NETWORK_PROFILES: Record<NetworkProfileName, NetworkConditions> = {
  FAST_3G: {
    offline: false,
    latency: 150, // 150ms RTT
    downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8), // 1.6 Mbps -> 209715 B/s
    uploadThroughput: Math.floor((750 * 1024) / 8),          // 750 Kbps -> 96000 B/s
    connectionType: 'cellular3g',
    cpuSlowdown: 1
  },
  SLOW_3G: {
    offline: false,
    latency: 400, // 400ms RTT
    downloadThroughput: Math.floor((400 * 1024) / 8), // 400 Kbps -> 51200 B/s
    uploadThroughput: Math.floor((400 * 1024) / 8),   // 400 Kbps -> 51200 B/s
    connectionType: 'cellular3g',
    cpuSlowdown: 4
  },
  EDGE_2G: {
    offline: false,
    latency: 800,
    downloadThroughput: Math.floor((250 * 1024) / 8),
    uploadThroughput: Math.floor((50 * 1024) / 8),
    connectionType: 'cellular2g',
    cpuSlowdown: 6
  },
  LTE_4G: {
    offline: false,
    latency: 40,
    downloadThroughput: Math.floor((20 * 1024 * 1024) / 8),
    uploadThroughput: Math.floor((10 * 1024 * 1024) / 8),
    connectionType: 'cellular4g',
    cpuSlowdown: 1
  },
  OFFLINE: {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
    connectionType: 'none',
    cpuSlowdown: 4
  },
  NO_THROTTLE: {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
    connectionType: 'wifi',
    cpuSlowdown: 1
  }
};

export interface NetworkEmulationOptions {
  sessionId?: string;
  overrideCpuSlowdown?: number;
}

/**
 * Enforces network conditions and CPU throttling on the target browser session.
 */
export async function emulateNetwork(
  cdp: CDPDispatcherClient,
  profile: NetworkProfileName | NetworkConditions,
  options: NetworkEmulationOptions = {}
): Promise<NetworkConditions> {
  const conditions: NetworkConditions = typeof profile === 'string'
    ? (NETWORK_PROFILES[profile] || NETWORK_PROFILES.NO_THROTTLE)
    : profile;

  const sessionId = options.sessionId;

  // 1. Enable Network domain
  await cdp.send('Network.enable', {}, sessionId);

  // 2. Set Emulated Network Conditions
  await cdp.send(
    'Network.emulateNetworkConditions',
    {
      offline: conditions.offline,
      latency: conditions.latency,
      downloadThroughput: conditions.downloadThroughput,
      uploadThroughput: conditions.uploadThroughput,
      connectionType: conditions.connectionType || 'other'
    },
    sessionId
  );

  // 3. Set CPU Throttling Rate if specified
  const cpuRate = options.overrideCpuSlowdown ?? conditions.cpuSlowdown ?? 1;
  await cdp.send(
    'Emulation.setCPUThrottlingRate',
    { rate: cpuRate },
    sessionId
  );

  return conditions;
}

/**
 * Simulates periodic network flapping (online -> offline -> online) for testing
 * CRDT sync, IndexedDB caching, and offline retry logic.
 */
export async function simulateNetworkFlap(
  cdp: CDPDispatcherClient,
  options: {
    cycles?: number;
    offlineDurationMs?: number;
    onlineDurationMs?: number;
    onlineProfile?: NetworkProfileName;
    sessionId?: string;
    delayFn?: (ms: number) => Promise<void>;
  } = {}
): Promise<void> {
  const cycles = options.cycles ?? 2;
  const offlineDurationMs = options.offlineDurationMs ?? 200;
  const onlineDurationMs = options.onlineDurationMs ?? 300;
  const onlineProfile = options.onlineProfile ?? 'FAST_3G';
  const delay = options.delayFn ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms)));
  const sessionId = options.sessionId;

  for (let c = 0; c < cycles; c++) {
    // Go Offline
    await emulateNetwork(cdp, 'OFFLINE', { sessionId });
    await delay(offlineDurationMs);

    // Go Online
    await emulateNetwork(cdp, onlineProfile, { sessionId });
    await delay(onlineDurationMs);
  }
}

/**
 * Resets all network and CPU throttling to unthrottled baseline
 */
export async function clearEmulation(
  cdp: CDPDispatcherClient,
  sessionId?: string
): Promise<void> {
  await emulateNetwork(cdp, 'NO_THROTTLE', { sessionId, overrideCpuSlowdown: 1 });
}
