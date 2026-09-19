# Invariantes de Carga Cognitiva y Ergonomía de Interacción

Este archivo establece los invariantes matemáticos y ergonómicos obligatorios para la experiencia de usuario en **Medical Trip Colombia S.A.S.**, orientados a eliminar la fatiga mental y maximizar la velocidad operativa de coordinadores y pacientes.

---

## 1. 🧠 Límite Matemático de Acciones de la Ley de Hick-Hyman ($\le 5$ Acciones Primarias)

La Ley de Hick-Hyman ($T = b \cdot \log_2(n + 1)$) demuestra que el tiempo de decisión se incrementa logarítmicamente con cada opción adicional en pantalla.

### 1.1 Invariante de Acciones Primarias por Vista
- **Invariante**: En cualquier estado o vista visible del viewport, no deben existir más de **5 botones o acciones primarias concurrentes**.
- **Jerarquía Visual de Botones**:
  - En cada grupo o sección operativa, solo puede existir **UN (1) botón con estilo sólido primario** (`bg-zinc-900 text-white` o `bg-emerald-600 text-white`).
  - Las demás acciones deben ser secundarias (estilo contorno: `border border-zinc-200 bg-white text-zinc-900`) o terciarias (estilo fantasma / ghost: `text-zinc-600 hover:bg-zinc-100`).
- **Agrupamiento en Barras y Menús Contextuales**: Las acciones secundarias deben concentrarse en menús desplegables discretos (`...`) o drawers laterales en lugar de saturar la barra superior.

---

## 2. 🪟 Invariante de Profundidad de Modales (Profundidad Máxima = 1)

El anidamiento de diálogos modales (un modal que abre otro modal sobre sí mismo) destruye el modelo mental del usuario y genera bloqueos de interacción.

### 2.1 Regla Cero Modales Apilados (Zero Stacked Dialogs)
- **Invariante**: En todo momento, la cantidad de diálogos modales abiertos simultáneamente debe ser $\le 1$.
- **Alternativas Obligatorias**:
  - Si un flujo requiere sub-formularios o detalles complementarios, debe utilizarse:
    1. **Paneles Laterales Deslizantes (`<Drawer>`)** anclados al lateral derecho.
    2. **Acordeones o Paneles Expansibles Inline** dentro del mismo modal.
    3. **Pasos Secuenciales (Wizard)** dentro del mismo contenedor modal sin superposición.

---

## 3. ⚡ Mutaciones Optimistas con Deshacer Universal No Bloqueante (`Ctrl+Z`)

Toda interacción de usuario que modifique el estado de la aplicación (ingreso de gasto, cambio de estado de conductor, actualización de itinerario) debe reflejarse de inmediato.

### 3.1 Requisitos de Mutación Optimista
1. **Actualización de Estado Inmediata (< 16ms)**: La interfaz debe mutar de forma instantánea sin spinners bloqueantes ni pausas de red.
2. **Toast Flotante No Bloqueante con Botón "Deshacer"**:
   - Tras cada mutación, el sistema debe mostrar un toast sutil en la parte inferior con la confirmación de la acción y un botón visible **"Deshacer"** (Undo).
   - El toast permanece visible por 4-5 segundos sin interferir con la navegación del usuario.
3. **Soporte de Atajo de Teclado `Ctrl+Z` / `Cmd+Z`**:
   - Presionar `Ctrl+Z` o `Cmd+Z` durante la validez del toast revierte la última mutación optimista al estado previo exacto.
4. **Persistencia Resiliente**: En caso de fallo de red en segundo plano, la mutación se almacena en cola local (IndexedDB) y se reintenta automáticamente.

---

## 4. 👁️ Heurística de Nielsen #6: Reconocimiento sobre Recuerdo (Recognition over Recall)

El operador no debe memorizar precios, códigos ni cálculos rutinarios.

### 4.1 Presets de 1-Clic para Gastos Frecuentes
- La barra de gastos debe disponer de botones directos de 1-clic con montos estándar preconfigurados:
  - `☕ Café $15k` ($15.000 COP)
  - `💊 Farmacia $185k` ($185.000 COP)
  - `🍽️ Almuerzo $25k` ($25.000 COP)
  - `🚕 Taxi $90k` ($90.000 COP)
  - `🚗 Traslado JMC $90k` ($90.000 COP)
- Al hacer clic en un preset, el gasto se imputa inmediatamente a la liquidación sin abrir formularios.

### 4.2 Selector Rápido de Arquetipos de Paciente `[1-4]`
- Acceso directo mediante botones pastilla (pills) o atajos de teclado numérico `1`, `2`, `3`, `4` para alternar entre pacientes de prueba y casos reales.

### 4.3 Visualización Dual de Zona Horaria (Dual-Timezone Indicator)
- En todas las tarjetas de vuelo, llegada a aeropuerto y cronograma clínico, deben visualizarse en paralelo las horas locales de:
  - **Colombia (`COT`, UTC-5)**: Hora de Medellín y Rionegro.
  - **Caribe (`AST`, UTC-4)**: Hora de Curazao, Aruba y Bonaire.
- Ejemplo: `23:30 COT (Medellín) / 00:30 AST (+1 Día, Curazao)`.

---

## 5. 📱 Ergonomía Táctil Móvil y Ley de Fitts (WCAG 2.2 AAA $\ge 44 \times 44\text{px}$)

En dispositivos móviles (< 768px), los elementos interactivos deben ser fácilmente accionables con el pulgar.

### 5.1 Dimensiones Mínimas de Objetivos Táctiles
- **Invariante**: Todo elemento accionable (botones, checkboxes, celdas de calendario, tabs) debe poseer un área de pulsación mínima de **$44 \times 44\text{px}$** (o utilizar pseudoelementos `after:absolute after:-inset-2` para expandir la zona táctil).
- **Barra de Navegación Inferior Anclada**:
  - En móviles, la navegación principal (`Mes`, `Semana`, `Día`, `Agenda`, `Balance`) debe situarse en la parte inferior accesible con una sola mano.
