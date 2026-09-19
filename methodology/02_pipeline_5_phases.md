# 02. Pipeline de Ejecución en 5 Fases (SOP Maestro de Extracción)

Este documento detalla la ruta de ejecución secuencial para transformar el corpus de datos de Medical Trip Colombia en modelos formales.

---

## 🗺️ Visión General del Pipeline

| Fase | Nombre | Herramienta Principal | Entrada | Salida Principal |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Normalización Probabilística de Entidades** | `Splink` (DuckDB) / Fellegi-Sunter | 304 CSVs + Excels + Metadatos | Catálogo Maestro de Identidades (`Universal_ID`) |
| **2** | **Extracción de Eventos y Trazabilidad OCEL 2.0** | `Instructor` (Pydantic) + `FastDTW` | Mensajes clasificados + Excels | Event Log en estándar `OCEL 2.0` (SQLite/DuckDB) |
| **3** | **Inducción de Roles y Minería de Comunicación** | Social Network Analysis + NLP Cluster | Grafo de transiciones OCEL | Matriz RACI + Repositorio de Scripts/Plantillas |
| **4** | **Modelado de Procesos y Notación Estándar** | `PM4Py` (Inductive Miner) | Árboles de Procesos filtrados | Diagramas XML `BPMN 2.0` Ejecutables |
| **5** | **Diseño del Modelo de Datos Relacional** | OCEL-to-Relational Mapper | Esquemas OCEL 2.0 y Entidades | Script DDL en 3NF (PostgreSQL/SQLite) |

---

## ⚙️ Detalle de las Fases

### 🔹 Fase 1: Preprocesamiento y Normalización Probabilística
- **Problema**: Variaciones textuales en nombres de pacientes, clínicas y conductores (ej. "HPTU", "Hospital Pablo Tobon", "Pablo Tobon Uribe").
- **Ejecución**:
  1. Parseo y limpieza de los 304 archivos CSV de chat.
  2. Extracción de entidades candidatas mediante regex y modelos NER.
  3. Ejecución del algoritmo **Fellegi-Sunter** con `Splink` calculando pesos de coincidencia sobre:
     - Nombres normalizados (Levenshtein / Jaro-Winkler).
     - Números telefónicos y prefijos internacionales (`+5999`, `+57`, `+1`).
     - Códigos de expediente `RVA###` y cotizaciones `CTZ###`.
- **Quality Gate (QG-1)**: Coincidencias con probabilidad posterior $> 0.92$ se aprueban automáticamente; entre $0.70$ y $0.92$ pasan a cola de revisión humana.

---

### 🔹 Fase 2: Extracción Estructurada OCEL 2.0 y Alineamiento Temporal (DTW)
- **Problema**: Un mensaje de WhatsApp puede vincular a 3 entidades distintas y diferir en días con la factura de Excel.
- **Ejecución**:
  1. Clasificación semántica de cada mensaje mediante **Pydantic/Instructor**:
     - `ActivityType`: `[SOLICITUD_COTIZACION, ASIGNACION_TRANSPORTE, LLEGADA_AEROPUERTO, CITA_MEDICA, INGRESO_HOSPITALARIO, ALTA_MEDICA, LIQUIDACION_PAGO]`
  2. Inserción en base de datos relacional orientada a objetos (OCEL 2.0).
  3. Reconciliación temporal con `Liquidacion_transporte.xlsx` y `Liquidacion_acompanamiento_presencial.xlsx` utilizando **Dynamic Time Warping (DTW)** con ventana de restricción Sakoe-Chiba de $\pm 7$ días.
- **Quality Gate (QG-2)**: 100% de los eventos deben tener al menos un objeto asociado y timestamp en formato ISO-8601 UTC.

---

### 🔹 Fase 3: Inducción de Roles y Minería de Plantillas
- **Problema**: Descubrir la jerarquía operativa real y los guiones de comunicación sin depender de suposiciones gerenciales.
- **Ejecución**:
  1. Análisis de traspaso de trabajo (*Handover of Work Network*):
     - Medición de centralidad de grado, intermediación y tiempos de respuesta por actor.
  2. Deducción de la matriz **RACI**:
     - **R** (Responsible): Quien ejecuta la acción física (ej. Ramón Rosero en transporte).
     - **A** (Accountable): Quien coordina y confirma (ej. Carolina Cortázar).
     - **C** (Consulted): Quien aporta criterio clínico (ej. Dr. Marcos Yepes / Jenny Acosta).
     - **I** (Informed): Quien recibe confirmaciones (ej. Paciente / Hotel).
  3. Extracción de plantillas mediante clustering de cadenas de texto (TF-IDF + Cosine Similarity).

---

### 🔹 Fase 4: Modelado de Procesos BPMN 2.0 (Inductive Miner)
- **Problema**: Evitar modelos "espagueti" y garantizar que el proceso sea ejecutable sin *deadlocks*.
- **Ejecución**:
  1. Aplicación del **Inductive Miner** (`pm4py.discover_process_tree_inductive`).
  2. Partición recursiva en sub-grafos concurrentes (AND), exclusivos (XOR) y bucles (LOOP).
  3. Conversión del Process Tree resultante a esquema XML **BPMN 2.0**.
- **Quality Gate (QG-4)**: El modelo debe tener una métrica de **Fitness $> 0.85$** y **Precision $> 0.80$** sobre el log histórico.

---

### 🔹 Fase 5: Mapeo al Modelo de Datos Relacional (ERD)
- **Problema**: Traducir el conocimiento histórico a una base de datos lista para desplegar en un CRM web o ERP.
- **Ejecución**:
  1. Mapeo de tipos de objeto OCEL a tablas relacionales maestras (`Pacientes`, `Proveedores`, `Servicios_Medicos`, `Alojamientos`).
  2. Mapeo de eventos a tablas transaccionales (`Reservas_RVA`, `Cotizaciones_CTZ`, `Traslados_Logistica`, `Liquidaciones_Turno`).
  3. Generación del script DDL formal en PostgreSQL / SQLite con claves foráneas, índices e integridad referencial.
