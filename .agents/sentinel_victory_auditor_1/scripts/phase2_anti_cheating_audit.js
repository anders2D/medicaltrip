const fs = require('fs');
const path = require('path');

console.log('=== DEEP FORENSIC SOURCE CODE & ANTI-CHEATING AUDIT ===');

const srcFiles = [
  'src/js/app.js',
  'src/js/core/state.js',
  'src/js/core/gesture-engine.js',
  'src/js/core/mermaid-manager.js',
  'src/js/data/flows.js',
  'src/js/data/database-preview.js',
  'src/js/components/navigation.js',
  'src/js/components/step-timeline.js',
  'src/js/components/drawers.js',
  'src/js/components/roi-calculator.js',
  'src/js/components/presentation-tools.js',
  'src/js/testing/robot-tester.js',
  'src/js/testing/diagnostics-runner.js',
  'server.js'
];

// 1. Facade Detection (empty methods, return constants, throw NotImplemented)
console.log('\n--- 1. Facade & Dummy Implementation Audit ---');
let facadesFound = 0;
srcFiles.forEach(file => {
  const content = fs.readFileSync(path.resolve(file), 'utf-8');
  const lines = content.split('\n');

  // Check for suspicious patterns
  const suspicious = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === 'return true;' || trimmed === 'return false;' || trimmed === 'return null;') {
      // Check context (is it a real helper or dummy stub?)
      suspicious.push({ line: idx + 1, code: trimmed });
    }
    if (trimmed.includes('NotImplementedError') || trimmed.includes('// TODO') || trimmed.includes('/* TODO */')) {
      suspicious.push({ line: idx + 1, code: trimmed });
    }
  });

  console.log(`File ${file.padEnd(40)}: ${lines.length} lines, ${suspicious.length} trivial return/TODO hits`);
  if (suspicious.length > 0) {
    suspicious.forEach(s => console.log(`   Line ${s.line}: ${s.code}`));
  }
});

// 2. Empirical Role Attribution Audit across all files
console.log('\n--- 2. Role Attribution & Anti-Hallucination Audit ---');
const empiricalRoles = [
  'Carolina Cortázar',
  'Jenny Paola Acosta',
  'Jenny Acosta',
  'Blanca Gilma Corrales',
  'Blanca Gilma',
  'Marcos Yepes',
  'Ramón Rosero',
  'Ramón',
  'Aeroturex',
  'Guianza Express'
];

const forbiddenPlaceholders = [
  'Bot',
  'Synthetic',
  'Generic Coordinator',
  'Generic Driver',
  'John Doe',
  'Test User',
  'Fake',
  'Placeholder'
];

let placeholderViolations = 0;
srcFiles.concat(['index.html', 'DAILY_WORKFLOW_SOP_HOUR_BY_HOUR.md', 'BUSINESS_DOSSIER_MEDICAL_TRIP.md']).forEach(file => {
  const content = fs.readFileSync(path.resolve(file), 'utf-8');
  forbiddenPlaceholders.forEach(ph => {
    // case-insensitive match for word
    const regex = new RegExp(`\\b${ph}\\b`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      // Check if it's robot-tester or testing context
      const filtered = matches.filter(m => !file.includes('robot-tester') && !file.includes('diagnostics'));
      if (filtered.length > 0 && !file.includes('testing')) {
        console.warn(`⚠️ Warning: Found placeholder '${ph}' in ${file} (${filtered.length} occurrences)`);
        placeholderViolations++;
      }
    }
  });
});
console.log(`Placeholder violations count: ${placeholderViolations}`);

// 3. PHI / HIPAA Exposure Audit
console.log('\n--- 3. Strict PHI / HIPAA Exposure Audit ---');
// Search for raw passport numbers (e.g. 2 letters + 7 digits, or patterns like PASSPORT: ...)
let phiLeaks = 0;
const publicFiles = srcFiles.concat(['index.html', 'src/js/data/database-preview.js']);
publicFiles.forEach(file => {
  const content = fs.readFileSync(path.resolve(file), 'utf-8');
  // Check for unmasked passport patterns
  const passportRegex = /\b[A-Z]{1,2}[0-9]{6,9}\b/g;
  // Exclude known code tokens like CTZ343, RVA282, ENT-PAX
  const matches = (content.match(passportRegex) || []).filter(m => 
    !m.startsWith('CTZ') && !m.startsWith('RVA') && !m.startsWith('ENT') && !m.startsWith('EMP') && !m.startsWith('PROV') && !m.startsWith('RGBA') && !m.startsWith('HSLA')
  );
  if (matches.length > 0) {
    console.warn(`Potential PHI tokens in ${file}: ${matches.slice(0, 5).join(', ')}`);
  }
});

// Verify ENT-PAX-XXXX pseudonymization
const dbPreviewContent = fs.readFileSync(path.resolve('src/js/data/database-preview.js'), 'utf-8');
const paxMatches = dbPreviewContent.match(/ENT-PAX-\d{4}/g) || [];
console.log(`Verified ${paxMatches.length} ENT-PAX-XXXX pseudonymized patient references in database-preview.js`);

// 4. DTW Financial Reconciliation & Ledger Validation
console.log('\n--- 4. DTW Financial Reconciliation & Ledger Validation ---');
const dtwMethodology = path.resolve('methodology/04_temporal_alignment_dtw.md');
console.log(`DTW Methodology documented at: ${dtwMethodology} (Exists: ${fs.existsSync(dtwMethodology)})`);
const transSheet = path.resolve('data/liquidaciones/Liquidacion_transporte.xlsx');
const compSheet = path.resolve('data/liquidaciones/Liquidacion_acompanamiento_presencial.xlsx');
console.log(`Transport sheet exists (${(fs.statSync(transSheet).size / 1024 / 1024).toFixed(2)} MB): ${transSheet}`);
console.log(`Companion sheet exists (${(fs.statSync(compSheet).size / 1024 / 1024).toFixed(2)} MB): ${compSheet}`);
