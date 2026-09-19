---
name: uiux-autonomous-guardian
description: >-
  Skill maestro para la Gestión Total de UI/UX mediante Inteligencia Artificial: Auditoría Crítica
  Heurística (10 Heurísticas de Nielsen + WCAG 2.2 AAA), Detección Visual con Set-of-Marks (SoM / OmniParser),
  Regresión Visual Estructural (SSIM con máscaras semánticas) y optimización hacia Diseño Minimalista
  de Carga Cognitiva Mínima.
  Activar automáticamente cuando el usuario solicite "audita uiux", "revisa diseño", "sé crítico con uiux",
  "optimiza minimalismo", o requiera inspección visual y heurística rigurosa.
---

# 🎨 UI/UX Autonomous Guardian & Heuristic Critic Skill

Este skill implementa la arquitectura de **Gestión Total de UI/UX y Minimalismo Funcional Radical 2026** para auditar, criticar, validar y gobernar interfaces web interactivas con cero fricción cognitiva, accesibilidad universal y rigor matemático.

---

## 🏛️ Los 5 Pilares de la Gestión de UI/UX

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │ 1. ÁRBOL DE ACCESIBILIDAD (AOM) PODADO EN VIVO (< 2.000 TOKENS)        │
   │    • Poda in-browser vía CDP / Accessibility Tree.                     │
   │    • Identidad funcional por roles ARIA y accesibilidad semántica.     │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 2. VISIÓN SET-OF-MARKS (SoM / OmniParser & UI-TARS)                    │
   │    • Cajas delimitadoras y etiquetas numeradas [1..N] inyectadas.      │
   │    • Mapeo 1:1 de centroides y coordenadas de interacción (x, y).      │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 3. AUDITORÍA CRÍTICA HEURÍSTICA (10 Nielsen + WCAG 2.2 AAA)            │
   │    • Escala de severidad 0 a 4 (Cosmético a Catástrofe de Usabilidad). │
   │    • Reconocimiento sobre recuerdo (presets 1-clic, arquetipos [1-4]). │
   │    • Ratios de contraste >= 7:1 y áreas táctiles >= 44x44px.           │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 4. REGRESIÓN VISUAL SSIM & MÁSCARAS DINÁMICAS                          │
   │    • Comparación perceptual con tolerancia anti-aliasing (SSIM >= 0.98)│
   │    • Enmascaramiento automático de marcas de tiempo y hashes volátiles.│
   ├────────────────────────────────────────────────────────────────────────┤
   │ 5. GENERATIVE UI & ALLOW-LIST DECLARATIVO                              │
   │    • Salidas restringidas por esquemas tipados de Design System.       │
   │    • Aplanamiento del DOM (profundidad <= 6) y números tabulares mono. │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Interfaz de Línea de Comandos (CLI Usage)

El inspector heurístico automatizado soporta parámetros de línea de comandos dinámicos y variables de entorno:

```bash
node .agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs [opciones]
```

### Opciones y Parámetros Disponibles
| Parámetro | Variable de Entorno | Valor por Defecto | Descripción |
|---|---|---|---|
| `--url <url>` | `TARGET_URL` | `http://localhost:5173/` | URL base de la aplicación React a auditar. |
| `--port <port>` | `CHROME_PORT` | `9222` | Puerto de depuración remota de Chromium. |
| `--chrome-path <path>` | `CHROME_PATH` | Detectado por SO | Ruta al ejecutable de Google Chrome / Chromium. |
| `--artifacts <dir>` | `ARTIFACT_DIR` | `artifacts/uiux_audit/` | Directorio destino para reportes, JSONs y PNGs. |
| `--threshold <ssim>` | `SSIM_THRESHOLD` | `0.98` | Umbral mínimo de similitud estructural SSIM. |
| `--max-severity <0-4>` | `MAX_SEVERITY` | `1` | Máxima severidad tolerada antes de fallar el exit gate. |
| `--no-headless` | `HEADLESS=0` | `false` | Ejecuta Chrome en modo visual interactivo. |

---

## 📋 Protocolo de Ejecución del Skill

### Paso 1: Ejecutar el Inspector Heurístico Automatizado (CDP)
Ejecutar el script con las banderas requeridas:
```bash
node .agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs \
  --url "http://localhost:5173/" \
  --artifacts "./artifacts/uiux_audit"
```

### Paso 2: Evaluación de las 10 Heurísticas de Nielsen
1. **#1 Visibilidad del Estado**: Medición de estado offline, balance live sincronizado y telemetría no invasiva.
2. **#2 Correspondencia con el Mundo Real**: Validación de vocabulario médico/logístico real (`JMC Rionegro`, `Curazao`, `Papiamento`, `COT/AST`, `COP`).
3. **#3 Control y Libertad**: Presencia de escapes `[Esc]`, botones de cancelar, cierre de drawers y función **Deshacer (`Ctrl+Z`)**.
4. **#4 Consistencia y Estándares**: Paleta zinc estricta, `tabular-nums font-mono` para cifras monetarias y timestamps, prohibición de gradientes neón.
5. **#5 Prevención de Errores**: Validaciones en tiempo real (BigInt exact cents, restricciones de territorio).
6. **#6 Reconocimiento sobre Recuerdo**: Presets de 1-clic ($15k café, $185k farmacia), selector de arquetipos `[1-4]`, display dual COT/AST.
7. **#7 Flexibilidad y Eficiencia**: Atajos de teclado visibles (`[N]`, `[I]`, `[C]`, `[T]`, `[1-4]`, `[Esc]`, `[Ctrl+Z]`).
8. **#8 Diseño Estético y Minimalista**: Ratio señal/ruido máximo, divisores hairline de 1px, cero `shadow-xl`/`shadow-2xl`, Ley de Hick-Hyman ($\le 5$ acciones primarias).
9. **#9 Diagnóstico y Recuperación de Errores**: Mensajes claros en lenguaje natural sin volcados de pila técnicos.
10. **#10 Ayuda y Documentación**: Tooltips contextuales y leyenda de atajos visibles.

### Paso 3: Verificación WCAG 2.2 AAA & Fitts' Law
- **Contraste de Luminancia Relativa**: Cálculo según fórmula $L = 0.2126R + 0.7152G + 0.0722B$.
  - Texto Normal: Ratio $\ge 7:1$ (AAA).
  - Texto Grande ($\ge 18\text{pt}$ / $\ge 24\text{px}$ bold): Ratio $\ge 4.5:1$ (AAA).
- **Objetivos Táctiles en Móviles**: Bounding box $\ge 44 \times 44\text{px}$.

### Paso 4: Extracción de AOM y Grounding Set-of-Marks (SoM)
- Poda del árbol semántico AOM garantizando un tamaño menor a 2.000 tokens.
- Generación de captura anotada `som_annotated_preview.png` y archivo de centroides `som_grounding_map.json`.

### Paso 5: Regresión Visual SSIM con Máscaras Volátiles
- Comparación estructural de la interfaz contra la línea base enmascarando elementos dinámicos (`[data-volatile="true"]`, reloj, hashes criptográficos).
- Verificación del umbral $\ge 0.98$.

### Paso 6: Puerta de Control (Exit Gate & Severity 0-4)
- El inspector genera `uiux_heuristic_audit_log.json`.
- Si se detecta cualquier defecto con **Severidad $\ge 2$**, el script termina con `exit code 1` bloqueando la entrega.
