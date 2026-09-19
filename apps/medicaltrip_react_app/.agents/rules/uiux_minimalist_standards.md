# Directrices de Minimalismo Funcional Radical y Estándares de Diseño UI/UX

Este archivo define las reglas maestras e invariantes de diseño visual y maquetación para **Medical Trip Colombia S.A.S.**, basadas en los principios de Minimalismo Funcional Radical (Dieter Rams, Linear, Notion, Apple Human Interface Guidelines).

---

## 1. 🎨 Lista Blanca Estricta de Clases Tailwind CSS (Tailwind Allow-List)

Todas las vistas, componentes, modales y widgets deben construirse exclusivamente utilizando los siguientes tokens de color neutros y funcionales:

### 1.1 Fondos (Backgrounds)
- **Modo Claro (Light Mode)**:
  - Fondo de lienzo base: `bg-zinc-50` o `bg-white`
  - Fondo de tarjetas/contenedores elevados: `bg-white`
  - Fondos secundarios / hover / inputs: `bg-zinc-100`, `bg-zinc-200/50`, `hover:bg-zinc-100`
  - Fondo de elementos oscuros principales (botones primarios, badges de alto contraste): `bg-zinc-900`, `bg-zinc-950`
- **Modo Oscuro (Dark Mode)**:
  - Fondo de lienzo base: `dark:bg-zinc-950`
  - Fondo de tarjetas/superficies: `dark:bg-zinc-900`
  - Fondos secundarios / hover: `dark:bg-zinc-800`, `dark:hover:bg-zinc-800`

### 1.2 Tipografía y Colores de Texto (Text Colors)
- **Texto Principal (High Emphasis)**: `text-zinc-950`, `text-zinc-900`, `dark:text-zinc-50`, `dark:text-white`
- **Texto Secundario (Medium Emphasis)**: `text-zinc-700`, `text-zinc-600`, `dark:text-zinc-300`, `dark:text-zinc-400`
- **Texto Terciario y Helper Hints (Low Emphasis)**: `text-zinc-500`, `text-zinc-400`, `dark:text-zinc-500`
- **Texto sobre Fondos Oscuros**: `text-white`, `text-zinc-100`

### 1.3 Acentos Funcionales de Tonalidad Única (Single-Hue Semantic Accents)
Los colores cromáticos están estrictamente restringidos a funciones semánticas operativas:
- **Verde Esmeralda (`emerald-600` / `text-emerald-600` / `bg-emerald-500/10` / `border-emerald-500/20`)**:
  - Saldo liquidado, balance positivo, estado guardado/sincronizado, confirmación de firma.
- **Rojo Rosa (`rose-600` / `text-rose-600` / `bg-rose-500/10` / `border-rose-500/20`)**:
  - Saldo deudor/pendiente, acción destructiva, error crítico, gasto en clínica.
- **Azul Índigo (`indigo-600` / `text-indigo-600` / `bg-indigo-500/10` / `border-indigo-500/20`)**:
  - Hito de ruta clínica (Fast fasting lab, consulta médica, fit-to-fly).
- **Ámbar (`amber-600` / `text-amber-600` / `bg-amber-500/10` / `border-amber-500/20`)**:
  - Alerta de retención, advertencia de desfase de hora, estado pendiente.
- **Cielo (`sky-600` / `text-sky-600` / `bg-sky-500/10` / `border-sky-500/20`)**:
  - Vuelos internacionales, logística de aeropuerto JMC, asignación de conductor.

### 1.4 PROHIBICIÓN EXPLÍCITA DE DECORADOS ARTIFICIALES
- 🚫 **PROHIBIDO**: Gradientes artificiales tipo "neón IA" (`bg-gradient-to-r`, `from-fuchsia-500`, `via-purple-500`, `to-pink-500`, etc.).
- 🚫 **PROHIBIDO**: Anillos exteriores brillantes tipo glow (`ring-fuchsia-400`, `shadow-indigo-500/50`).
- 🚫 **PROHIBIDO**: Fondos con saturación estridente que eleven la fatiga visual.

---

## 2. 🔲 Divisores Hairline de 1px sobre Sombras Pesadas (Hairline Dividers)

El orden y la jerarquía visual deben establecerse mediante espacios negativos estructurados y divisores sutiles de 1 píxel, eliminando el ruido visual de sombras difusas.

### 2.1 Prohibición de Sombras Pesadas
- 🚫 **PROHIBIDO**: `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`.
- 🚫 **PROHIBIDO**: Drop-shadows de colores o con desenfoques superiores a 4px.

### 2.2 Divisores y Anillos Permitidos
- **Bordes Hairline de 1px**: `border border-zinc-200/50`, `border-zinc-200/60`, `dark:border-zinc-800/60`, `border-zinc-200`
- **Anillos Sutiles de Definición**: `ring-1 ring-zinc-200/50`, `ring-1 ring-zinc-950/5`, `dark:ring-zinc-800/50`
- **Elevación Mínima de Tarjetas (Opcional)**: `shadow-xs` o `shadow-sm` (blur $\le 2\text{px}$, opacidad $\le 0.04$).

---

## 3. 🔢 Tipografía Monoespaciada y Numerales Tabulares Obligatorios

Para evitar saltos de línea y saltos de layout (Layout Shift) en cifras financieras, fechas y cronómetros:

### 3.1 Regla de Números Tabulares
Todo elemento HTML/JSX que presente:
1. Montos en dinero (COP, USD, Florines).
2. Balances contables, deltas y honorarios.
3. Fechas, horas (`05:30 AM`, `23:30 COT`, `00:30 AST`).
4. Códigos de vuelo (`AV9344`, `AA1240`).
5. Códigos de paciente (`ENT-PAX-0042`) y reservas (`RVA-2026-001`).
6. Cronómetros, contadores y hashes criptográficos (`SHA-256`).

**DEBE INCLUIR OBLIGATORIAMENTE**:
```css
tabular-nums font-mono
```
Ejemplo:
```tsx
<span className="tabular-nums font-mono font-medium text-zinc-900">
  $ 1.250.000 COP
</span>
```

---

## 4. 📏 Escala Tipográfica Monotónica de 4 Pasos

La jerarquía tipográfica está restringida rígidamente a exactamente 4 tamaños de fuente para evitar heterogeneidad y desorden perceptual:

| Clase Tailwind | Tamaño | Interlineado | Caso de Uso Exclusivo |
|---|---|---|---|
| `text-xs` | 12px (0.75rem) | `leading-4` (16px) | Badges de metadatos, atajos de teclado (`[N]`), captions, chips de zona horaria, texto legal de footer. |
| `text-sm` | 14px (0.875rem) | `leading-5` (20px) | Texto base del cuerpo, celdas de tabla, etiquetas de formularios, inputs, botones de acción, ítems de lista. |
| `text-base` | 16px (1.0rem) | `leading-6` (24px) | Títulos de tarjetas, encabezados de modal/drawer, títulos de sección, balances destacados (KPIs). |
| `text-xl` / `text-lg` | 20px / 18px | `leading-7` (28px) | Título principal de la vista, total general del balance en cabecera principal. |

---

## 5. 🧱 Aplanamiento del DOM e Invariante de Profundidad (DOM Flattening)

El exceso de contenedores intermedios degrada el rendimiento del navegador y confunde el árbol de accesibilidad (AOM).

### 5.1 Reglas de Estructura DOM
1. **Límite de Profundidad**: La profundidad máxima del árbol DOM desde el contenedor de la página hasta cualquier nodo hoja interactivo no debe superar **6 niveles**.
2. **Prohibición de Divs Envolventes Inútiles**: Eliminar elementos `<div className="wrapper"><div className="inner">...</div></div>`. Aplicar `flex`, `grid`, `p-4`, `gap-2` directamente sobre el elemento semántico contenedor (`<section>`, `<article>`, `<header>`, `<nav>`, `<main>`).
3. **Semántica Nativa**: Usar `<button>`, `<input>`, `<dialog>`, `<nav>`, `<header>`, `<main>`, `<aside>` en lugar de `<div onClick={...} role="button">`.

---

## 6. ⚡ Respuesta Táctil y Micro-Interacciones Cinéticas

Todo elemento interactivo debe proporcionar feedback kinestésico inmediato al operador:
- Botones y tarjetas clicables: `active:scale-[0.98] transition-transform duration-150` o `active:scale-95 duration-200`.
- Foco visible accesible por teclado: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1`.
