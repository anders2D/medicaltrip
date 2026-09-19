---
name: autonomous-qa-evaluator
description: >-
  Skill maestro para ejecutar la Evaluación Exhaustiva de Flujos de Usuario de Inicio a Fin
  (Super-Journeys E2E), combinando Inteligencia Artificial semántica (Árbol de Accesibilidad AOM,
  Set-of-Marks para Canvas), Verificación Determinista (BigInt, SHA-256, BPMN Soundness) y
  auditoría de bajo nivel mediante Chrome DevTools Protocol (CDP).
  Activar automáticamente cuando el usuario solicite "haz qa", "ejecuta qa", "audita flujos", o
  requiera certificación completa de calidad en tiempo de ejecución.
---

# 🛡️ Autonomous QA Evaluator: Protocolo de Evaluación E2E de Inicio a Fin

Este skill implementa el paradigma **Cero-Defectos 2026** para la evaluación de aplicaciones web críticas, offline-first y colaborativas (CRDTs).

---

## 🏗️ Los 5 Ejes del Protocolo de QA

1. **Inspección Semántica Híbrida**: 90% Árbol de Accesibilidad (AOM) podado (<400 tokens/acción) + 10% Visión Set-of-Marks (OmniParser) para Canvas de Firma.
2. **Determinismo Matemático & Criptográfico**: Cero punto flotante IEEE 754 (BigInt cents) + Sellado inmutable con hash SHA-256 + Soundness formal (0 interbloqueos).
3. **Auditoría de Runtime en Vivo (CDP)**: Intercepción fatal en `Runtime.exceptionThrown` y `console.error` + Emulación de caos de red (Offline/3G).
4. **Super-Journeys de Larga Duración**: Recorrido continuo sin reset: Onboarding ➔ Itinerario ➔ D&D ➔ Gastos In-Situ ➔ Firma Digital Canvas ➔ Exportación PDF.
5. **Matriz Multi-Viewport & Self-Healing**: Capturas y validación en Desktop (1440x900) y Mobile (390x844) + Auto-recuperación semántica.

---

## 🛠️ Procedimiento de Ejecución del Skill

Cuando el usuario solicite **"haz qa"**, ejecuta los siguientes pasos:

### Paso 1: Verificación Estática & Build
```bash
cd apps/medicaltrip_react_app && ../../.bin/bin/node ./node_modules/vite/bin/vite.js build
cd apps/medicaltrip_react_app && ../../.bin/bin/node ./node_modules/vitest/vitest.mjs run
```

### Paso 2: Ejecución del Harness Autónomo en Chromium Real (CDP)
```bash
/Users/miyo123/projects/medicaltrip/.bin/bin/node --experimental-websocket .agents/skills/autonomous-qa-evaluator/scripts/run_autonomous_qa.mjs
```

### Paso 3: Emisión del Reporte Certificado
Genera el informe formal de QA incluyendo:
- Matriz de resultados de los 5 flujos.
- Capturas de pantalla reales embebidas (Desktop, Mobile, Drawer).
- Balance financiero auditado al centavo (`BigInt`).
- Sello criptográfico SHA-256 del ledger.
