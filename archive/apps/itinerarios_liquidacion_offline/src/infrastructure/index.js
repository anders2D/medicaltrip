/**
 * Medical Trip Colombia S.A.S. — Infrastructure Layer Barrel Export.
 * Local-First Multi-Tier Persistence, Hardware Gateway Adapters, and Operational Seed Data.
 */

// Storage Adapters (Tier 1 & Tier 2)
export { SqliteStorageAdapter } from './storage/sqlite-storage-adapter.js';
export { DexieBlobStorageAdapter } from './storage/dexie-blob-storage-adapter.js';
export { StoragePersistenceManager } from './storage/storage-persistence-manager.js';

// Hardware Gateway Adapters (Tier 2/3)
export {
  SimulatedGeolocationAdapter,
  KNOWN_OPERATIONAL_LOCATIONS
} from './hardware/simulated-geolocation-adapter.js';
export { CanvasSignatureAdapter } from './hardware/canvas-signature-adapter.js';
export { MockOCRAdapter } from './hardware/mock-ocr-adapter.js';

// Seed Archetypes Data & Hydration
export {
  ARCHETYPES_DATA,
  getArchetype,
  getAllArchetypes,
  hydrateStorageWithArchetype
} from './data/archetypes-data.js';
