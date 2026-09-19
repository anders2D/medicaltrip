---
name: medicaltrip-extractor
description: >-
  Skill especializado para ejecutar el pipeline de 5 fases de ingeniería inversa sobre los datos
  de Medical Trip Colombia S.A.S. (normalización Splink, extracción OCEL 2.0, reconciliación DTW y ERD).
---

# Medical Trip Process Extractor Skill

Usa este skill cuando necesites ejecutar o auditar extracciones de procesos, entidades o reconciliaciones financieras sobre los datos de Medical Trip Colombia S.A.S.

---

## 🛠️ Flujo de Ejecución del Skill

### Paso 1: Normalización de Entidades
1. Lee los 304 archivos CSV en `data/chats/contacts/`.
2. Ejecuta el resolvedor probabilístico Splink basado en las reglas de bloqueo:
   - `phone_normalized`
   - `rva_code`
   - `full_name_clean` (Jaro-Winkler > 0.88).

### Paso 2: Extracción de Eventos OCEL 2.0
1. Clasifica los mensajes clave en las actividades canónicas:
   - `SOLICITUD_COTIZACION` (`CTZ`)
   - `CONFIRMACION_RESERVA` (`RVA`)
   - `PROGRAMACION_TRANSPORTE` (Aeroturex)
   - `LLEGADA_AEROPUERTO`
   - `VALORACION_MEDICA` (Dr. Marcos Yepes / Especialistas)
   - `TOMA_LABORATORIOS`
   - `PROCEDIMIENTO_CLINICO`
   - `ACOMPANAMIENTO_PRESENCIAL`
   - `ALTA_FIT_TO_FLY`
   - `RETORNO_AEROPUERTO`
2. Genera registros de eventos en `data/ocel_events.json`.

### Paso 3: Reconciliación Financiera (DTW)
1. Carga `Liquidacion_transporte.xlsx` y `Liquidacion_acompanamiento_presencial.xlsx`.
2. Aplica Dynamic Time Warping con ventana Sakoe-Chiba de 7 días.
3. Asocia cada gasto y pago al evento operativo correspondiente.

### Paso 4: Generación de Entregables
- Actualiza el Catálogo Maestro de Pacientes y Proveedores.
- Emite el reporte de discrepancias y tiempos de ciclo.
