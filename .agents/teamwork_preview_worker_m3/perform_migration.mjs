import fs from 'fs';
import path from 'path';

const APP_ROOT = '/Users/miyo123/projects/medicaltrip/apps/medicaltrip_react_app';
const SRC_DIR = path.join(APP_ROOT, 'src');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(srcRel, destRel) {
  const src = path.join(SRC_DIR, srcRel);
  const dest = path.join(SRC_DIR, destRel);
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${srcRel} -> ${destRel}`);
}

function writeFile(destRel, content) {
  const dest = path.join(SRC_DIR, destRel);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`Wrote: ${destRel}`);
}

console.log('Starting directory structure creation...');

// 1. Create Core Directories
ensureDir(path.join(SRC_DIR, 'core/domain/entities'));
ensureDir(path.join(SRC_DIR, 'core/domain/value-objects'));
ensureDir(path.join(SRC_DIR, 'core/domain/errors'));
ensureDir(path.join(SRC_DIR, 'core/ports'));
ensureDir(path.join(SRC_DIR, 'core/infrastructure/storage'));
ensureDir(path.join(SRC_DIR, 'core/infrastructure/crdt'));
ensureDir(path.join(SRC_DIR, 'core/infrastructure/data'));
ensureDir(path.join(SRC_DIR, 'core/auth'));
ensureDir(path.join(SRC_DIR, 'core/i18n/translations'));
ensureDir(path.join(SRC_DIR, 'core/ui'));

// 2. Create Feature Directories
const features = [
  'settlement',
  'itinerary',
  'medical-plan',
  'logistics-fleet',
  'companion-shifts',
  'onboarding',
  'directory',
  'swarm'
];

features.forEach(f => {
  ensureDir(path.join(SRC_DIR, 'features', f));
});

console.log('Directories created successfully.');
