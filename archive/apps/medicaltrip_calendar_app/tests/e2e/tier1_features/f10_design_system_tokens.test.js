import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../../../');

test('F10: Design System Tokens — Human-First Zinc/Slate & Semantic Palette', async (t) => {
    const tokensPath = path.join(appRoot, 'assets/css/tokens.css');
    const tokensCss = fs.readFileSync(tokensPath, 'utf8');

    await t.test('1. Defines neutral zinc/slate background and text hierarchy tokens', () => {
        assert.ok(tokensCss.includes('--bg-app: #f8fafc'));
        assert.ok(tokensCss.includes('--bg-surface: #ffffff'));
        assert.ok(tokensCss.includes('--text-primary: #0f172a'));
        assert.ok(tokensCss.includes('--text-secondary: #475569'));
        assert.ok(tokensCss.includes('--text-muted: #64748b'));
    });

    await t.test('2. Defines 6 Google Calendar-grade semantic event color tokens', () => {
        // Sky Blue (Flights/Arrivals)
        assert.ok(tokensCss.includes('--event-sky-bg: #e0f2fe'));
        assert.ok(tokensCss.includes('--event-sky-text: #0369a1'));

        // Indigo (Clinical Consultations)
        assert.ok(tokensCss.includes('--event-indigo-bg: #e0e7ff'));
        assert.ok(tokensCss.includes('--event-indigo-text: #4338ca'));

        // Teal (Diagnostics & Labs)
        assert.ok(tokensCss.includes('--event-teal-bg: #ccfbf1'));
        assert.ok(tokensCss.includes('--event-teal-text: #0f766e'));

        // Amber (Pharmacy & Petty Cash)
        assert.ok(tokensCss.includes('--event-amber-bg: #fef3c7'));
        assert.ok(tokensCss.includes('--event-amber-text: #b45309'));

        // Rose (Surgeries & Specialists)
        assert.ok(tokensCss.includes('--event-rose-bg: #ffe4e6'));
        assert.ok(tokensCss.includes('--event-rose-text: #be123c'));

        // Slate (Hotel & Recovery)
        assert.ok(tokensCss.includes('--event-slate-bg: #f1f5f9'));
        assert.ok(tokensCss.includes('--event-slate-text: #334155'));
    });

    await t.test('3. Defines dark mode overrides for accessibility in low-light hospital environments', () => {
        assert.ok(tokensCss.includes('@media (prefers-color-scheme: dark)'));
        assert.ok(tokensCss.includes('--bg-app: #09090b'));
        assert.ok(tokensCss.includes('--text-primary: #f8fafc'));
    });

    await t.test('4. Enforces monospace font token for unambiguous financial ledger figures', () => {
        assert.ok(tokensCss.includes('--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'));
    });

    await t.test('5. Standardized border radius and elevation shadow tokens', () => {
        assert.ok(tokensCss.includes('--radius-sm: 4px'));
        assert.ok(tokensCss.includes('--radius-md: 8px'));
        assert.ok(tokensCss.includes('--radius-lg: 12px'));
        assert.ok(tokensCss.includes('--radius-full: 9999px'));
        assert.ok(tokensCss.includes('--shadow-drawer: -4px 0 24px rgba(0, 0, 0, 0.12)'));
    });

    await t.test('6. Absence of neon/rainbow AI gradients (Strict Human-First Design)', () => {
        assert.doesNotMatch(tokensCss, /linear-gradient\(.*(#ff00|#00ff|neon|magenta|cyan)/i);
    });
});
