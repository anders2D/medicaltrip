---
name: bpmn-modeler
description: >-
  Skill para generar, validar y auditar diagramas de procesos BPMN 2.0 y árboles de procesos
  utilizando el algoritmo Inductive Miner y la librería PM4Py a partir de Event Logs OCEL.
---

# BPMN Process Modeler Skill

Usa este skill cuando necesites transformar logs de eventos en diagramas formales BPMN 2.0 con garantías matemáticas de Soundness.

---

## 🛠️ Procedimiento del Skill

### 1. Ingesta y Filtrado de Ruido
- Carga el Event Log desde `data/ocel_events.json` o base de datos SQLite.
- Aplica umbral de ruido (*noise threshold*) = 0.20 para descartar variantes atípicas que ensucien el flujo maestro.

### 2. Generación del Process Tree
- Ejecuta `pm4py.discover_process_tree_inductive(event_log)`.
- Valida los operadores jerárquicos:
  - $\to$ Secuencia
  - $\times$ Exclusivo (XOR)
  - $+$ Paralelo (AND)
  - $\circlearrowleft$ Bucle de reintento

### 3. Conversión a BPMN 2.0 XML
- Ejecuta `pm4py.convert_to_bpmn(process_tree)`.
- Exporta el archivo XML con soporte de diagramación BPMN DI.
- Valida que el modelo sea compatible con motores como **SpiffWorkflow** y **Camunda**.

### 4. Auditoría de Calidad
- Calcula métricas:
  - **Fitness (Replay Token)** $\ge 0.88$
  - **Precision** $\ge 0.82$
- Emite advertencias si se detectan tareas sin transiciones salientes.
