# autonomous-qa-evaluator Local Dump

Skill maestro para ejecutar la Evaluación Exhaustiva de Flujos de Usuario de Inicio a Fin (Super-Journeys E2E), combinando Inteligencia Artificial semántica (Árbol de Accesibilidad AOM, Set-of-Marks para Canvas), Verificación Determinista (BigInt, SHA-256, BPMN Soundness) y auditoría de bajo nivel mediante Chrome DevTools Protocol (CDP).

## Core Methodology:
1. Static verification & build: `vite build` + `vitest run`
2. Autonomous QA harness in Real Headless Chromium via CDP (`run_autonomous_qa.mjs`)
3. Zero-defect verification: 0 runtime exceptions, 0 console errors, BigInt delta=0, SHA-256 seal, multi-viewport retina screenshots.
