#!/usr/bin/env node

/**
 * Medical Trip Calendar App — Master E2E & Invariant Test Suite Runner
 * Executes all tests across Tier 1, Tier 2, Tier 3, Tier 4, and Tier 5.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const appRoot = resolve(__dirname, '../..');
const testsDir = resolve(appRoot, 'tests');

function findTestFiles(dir) {
    const results = [];
    const entries = readdirSync(dir);
    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            results.push(...findTestFiles(fullPath));
        } else if (entry.endsWith('.test.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

const testFiles = findTestFiles(testsDir);
console.log(`================================================================================`);
console.log(`🚀 MEDICAL TRIP CALENDAR & SETTLEMENT APP — MASTER TEST RUNNER`);
console.log(`================================================================================`);
console.log(`Discovered ${testFiles.length} test suites across Tiers 1-5 & Domain Core:`);
testFiles.forEach((file, idx) => {
    const rel = file.replace(appRoot + '/', '');
    console.log(`  [${String(idx + 1).padStart(2, ' ')}] ${rel}`);
});
console.log(`================================================================================\n`);

const startTime = Date.now();
const child = spawn(process.execPath, ['--test', ...testFiles], {
    cwd: appRoot,
    stdio: 'inherit'
});

child.on('exit', (code) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n================================================================================`);
    if (code === 0) {
        console.log(`✅ ALL TEST SUITES PASSED (100% PASS RATE) in ${duration}s`);
        console.log(`🎯 Milestone 5 Verification: SUCCESS`);
    } else {
        console.error(`❌ TEST SUITE FAILED with exit code ${code} in ${duration}s`);
        console.error(`🚨 Milestone 5 Verification: FAILED`);
    }
    console.log(`================================================================================\n`);
    process.exit(code ?? 1);
});
