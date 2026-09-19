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

Este skill implementa el paradigma **Gestión Total de UI/UX 2026** para auditar, criticar y optimizar interfaces web hacia el **minimalismo funcional de alta potencia** y cero carga cognitiva.

---

## 🏛️ Los 5 Pilares de la Gestión de UI/UX

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │ 1. ÁRBOL DE ACCESIBILIDAD (AOM) PODADO EN VIVO                         │
   │    • Poda in-browser vía Service Worker & CDP (<2.000 tokens/acción). │
   │    • Identidad funcional por roles ARIA y accesibilidad semántica.     │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 2. VISIÓN SET-OF-MARKS (SoM / OmniParser & UI-TARS)                    │
   │    • Cajas delimitadoras numeradas [1..N] sobre elementos interactivos.│
   │    • Eliminación de la brecha de modalidad y errores de anclaje (x, y).│
   ├────────────────────────────────────────────────────────────────────────┤
   │ 3. AUDITORÍA CRÍTICA HEURÍSTICA (10 Nielsen + WCAG 2.2 AAA)            │
   │    • Escala de severidad 0 a 4 (Cosmético a Catástrofe de Usabilidad). │
   │    • Reconocimiento sobre recuerdo (Recognition over Recall).          │
   │    • Ratio señal/ruido extremo y eliminación de ornamentos no útiles.   │
   ├────────────────────────────────────────────────────────────────────────┤
   │ 4. REGRESIÓN VISUAL SSIM & MÁSCARAS DINÁMICAS                          │
   │    • Comparación perceptual con tolerancia anti-aliasing (SSIM >= 0.98)│
   │    • Enmascaramiento automático de marcas de tiempo y hashes volátiles.│
   ├────────────────────────────────────────────────────────────────────────┤
   │ 5. GENERATIVE UI & ALLOW-LIST DECLARATIVO                              │
   │    • Salidas restringidas por esquemas tipados de Design System.       │
   │    • Adaptabilidad de densidad según destreza del operador.            │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Procedimiento de Ejecución del Skill

Cuando se invoque este skill, sigue estos pasos secuenciales:

### Paso 1: Ejecutar el Inspector Heurístico Automatizado (CDP)
Ejecuta el script inspector en Chromium real:
```bash
/Users/miyo123/projects/medicaltrip/.bin/bin/node --experimental-websocket .agents/skills/uiux-autonomous-guardian/scripts/audit_uiux_heuristics.mjs
```

### Paso 2: Evaluación Crítica de las 10 Heurísticas de Nielsen
1. **#1 Visibilidad del Estado**: Medir si el sistema comunica el estado actual (e.g. badge *100% Offline*, *Live Delta*).
2. **#2 Correspondencia con el Mundo Real**: Vocabulario médico/logístico natural (*JMC Rionegro*, *Dr. Peláez*, *Caja Menor*).
3. **#3 Control y Libertad**: Presencia de botones de escape (`[Esc]`, cancelar, cerrar drawer, deshacer).
4. **#4 Consistencia y Estándares**: Paleta sobria zinc/slate, bordes sutiles de 1px, `tabular-nums` para finanzas.
5. **#5 Prevención de Errores**: Validaciones en tiempo real (e.g., rechazo de territorios no operativos como Mocoa).
6. **#6 Reconocimiento sobre Recuerdo**: Desplegables con autocompletado y cálculo automático de honorarios.
7. **#7 Flexibilidad y Eficiencia**: Atajos de teclado (`[T]`, `[N]`, `[I]`, `[1-4]`) y presets 1-clic.
8. **#8 Diseño Estético y Minimalista**: Cero gradientes IA estridentes; cada píxel debe justificar su existencia.
9. **#9 Diagnóstico y Recuperación de Errores**: Mensajes en lenguaje claro indicando qué falló y cómo resolverlo.
10. **#10 Ayuda y Documentación**: Tooltips contextuales e indicadores de atajos visibles sin saturar.

### Paso 3: Auditoría WCAG 2.2 AAA
- Ratio de contraste de texto normal: $\ge 7:1$ (AAA) o $\ge 4.5:1$ (AA).
- Dimensiones de objetivos táctiles: $\ge 44 \times 44\text{px}$ en mobile.
- Indicadores visibles de foco para accesibilidad por teclado.

### Paso 4: Emisión del Reporte de Severidad (0 a 4) & Parches de UI
Genera el informe detallando hallazgos clasificados por severidad y los diffs de código aplicados para perfeccionar la ergonomía visual.
