# Directrices de Diseño UI/UX y Minimalismo Funcional (Medical Trip Brain)

1. **Las 10 Heurísticas de Usabilidad de Jakob Nielsen**:
   - **H1 (Visibilidad del Estado)**: Informar siempre el estado operativo (modo *100% Offline*, *Live Delta*, progreso de guardado).
   - **H2 (Correspondencia con el Mundo Real)**: Lenguaje y códigos clínicos/logísticos exactos de Medical Trip (`RVA`, `CTZ`, nombres de clínicas y hoteles reales).
   - **H3 (Control y Libertad)**: Proveer escapes (`[Esc]`, cancelar, cerrar modales y drawers) sin penalizaciones.
   - **H4 (Consistencia y Estándares)**: Paleta sobria zinc/slate, bordes sutiles de 1px, `tabular-nums` para números monetarios.
   - **H5 (Prevención de Errores)**: Validar antes de mutar (validación fail-fast de territorio DDD, BigInt cents).
   - **H6 (Reconocimiento sobre Recuerdo)**: Presets 1-clic de gastos frecuentes ($15k café, $185k farmacia), selector de arquetipos visual.
   - **H7 (Flexibilidad y Eficiencia)**: Atajos de teclado universales (`[N]`, `[I]`, `[C]`, `[T]`, `[1-4]`) para operadores expertos.
   - **H8 (Diseño Minimalista & Ratio Señal/Ruido)**: Prohibidos gradientes artificiales 'neón IA'. Cada elemento visual debe cumplir una función operativa.
   - **H9 (Recuperación de Errores)**: Mensajes claros y descriptivos sin jerga técnica cruda.
   - **H10 (Documentación Contextual)**: Tooltips e indicadores sutiles de atajos.

2. **Accesibilidad Universal (WCAG 2.2 AAA)**:
   - Ratios de contraste $\ge 7:1$ para textos principales sobre fondos claros o neutros.
   - Áreas táctiles mínimas $\ge 44 \times 44\text{px}$ en viewports móviles.

3. **Generative UI Restringida (Allow-Lists)**:
   - Cualquier componente generado o mutado por IA debe provenir estrictamente de la lista blanca del Design System (`Button`, `Input`, `Select`, `Modal`, `Drawer`, `Card`, `Badge`).
