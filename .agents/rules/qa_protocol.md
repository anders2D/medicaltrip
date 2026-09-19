# Protocolo de Control de Calidad Autónomo (Disparador: "haz qa")

1. **Activación Automática**:
   - Cada vez que el usuario escriba `"haz qa"`, `"ejecuta qa"`, `"audita flujos"` o solicite una prueba de inicio a fin, Antigravity debe activar el skill `autonomous-qa-evaluator`.

2. **Garantías de Evaluación Obligatorias**:
   - **Compilación Limpia**: Verificar que `npm run build` / `vite build` compile con 0 errores.
   - **Pruebas de Dominio**: Ejecutar la suite completa de Vitest (74 archivos de prueba, >580 tests).
   - **Arnés en Chromium Real (CDP)**: Ejecutar `.agents/skills/autonomous-qa-evaluator/scripts/run_autonomous_qa.mjs` con captura de excepciones no controladas (`Runtime.exceptionThrown`) y cero errores de consola.
   - **Aserciones Deterministas**: Verificar precisión de centavos con `BigInt`, sellado criptográfico SHA-256 del ledger y Soundness BPMN 2.0.
   - **Evidencia Visual**: Presentar capturas de pantalla reales (Desktop 1440x900, Mobile 390x844 y Formulario del Drawer).
