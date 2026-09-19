# 01. Flujos de Trabajo Maestros (BPMN 2.0 & Diagramas de Secuencia)

Este documento describe los **8 subprocesos operativos** que cubren el 100% de la operación de Medical Trip Colombia S.A.S. de inicio a fin.

---

## 🔄 Flujo 1: Comercial & Cotización Dinámica (`Lead ➔ CTZ`)

### Descripción:
Recepción del contacto internacional, triaje del historial clínico (*Medisch Dossier* en Papiamento/Inglés/Español), valoración preliminar con el [MED] Dr. Marcos Yepes o especialista, y cálculo automático de la cotización (`CTZ###`) con desglose de márgenes.

```mermaid
sequenceDiagram
    autonumber
    actor Pax as [PAX] Paciente Internacional (Curazao / USA)
    actor Coord as [COORD] Coordinación Comercial (Blanca Gilma / Carolina Cortázar)
    actor Med as [MED] Asesor Médico (Dr. Marcos Yepes)
    actor System as Motor de Cotización (ERP)

    Pax->>Coord: Envío de solicitud y síntomas por WhatsApp
    Coord->>Pax: Solicitud de historial médico (Dossier) y pasaporte
    Pax->>Coord: Carga de PDF/Imágenes
    Coord->>Med: Solicitud de concepto médico preliminar
    Med->>System: Registro de procedimientos CUPS requeridos (ej. 883101 RNM + Laboratorios)
    Coord->>System: Selección de opciones de hotel (Poblado Plaza / Dorado 70) y traslados Aeroturex
    System->>System: Cálculo de Tarifa Convenio + Margen (Spread) + TRM USD/COP
    System->>Coord: Generación de Cotización Formal (PDF CTZ###)
    Coord->>Pax: Envío de CTZ por WhatsApp / Email en Papiamento o Inglés
```

---

## 🔄 Flujo 2: Confirmación de Reserva & Emisión de Póliza (`CTZ ➔ RVA`)

### Descripción:
Aprobación del paciente, validación del comprobante de depósito bancario (Bancolombia), asignación formal del código de expediente `RVA###`, apertura del grupo de WhatsApp y emisión de la póliza de viajero.

```mermaid
flowchart TD
    A[Paciente aprueba Cotización CTZ] --> B[Paciente realiza transferencia de depósito]
    B --> C{Verificación de Pago en Bancolombia}
    C -->|Rechazado / No Acreditado| C1[Alerta a Paciente: Reintentar pago]
    C -->|Aprobado| D[Sistema genera Código Canónico RVA###]
    D --> E[Apertura automática de Grupo WhatsApp Operativo]
    D --> F[Emisión de Póliza Médica de Asistencia al Viajero]
    D --> G[Bloqueo de cupo en Hotel / Casa Villa Anita]
    E & F & G --> H[Envío de Carta de Bienvenida y Kit de Viaje]
```

---

## 🔄 Flujo 3: Logística Pre-Viaje y Migración (`Check-Mig & Vuelos`)

### Descripción:
48 a 24 horas antes del despegue, [COORD] Carolina Cortázar recopila los datos de vuelo (ej. Wingo 7449 / Avianca), diligencia el formulario obligatorio **Check-Mig Colombia** y confirma el estado de la reserva con la aerolínea.

```mermaid
sequenceDiagram
    autonumber
    actor Pax as [PAX] Paciente
    actor Coord as [COORD] Coordinación (Carolina Cortázar)
    actor Mig as Migración Colombia (API Check-Mig)

    Coord->>Pax: Solicitud de confirmación de pasabordo 48h antes
    Pax->>Coord: Envío de número de vuelo y fecha
    Coord->>Coord: Verificación de estado del vuelo (FlightAware)
    Coord->>Mig: Envío de datos Check-Mig Entrada (Datos Pasaporte + Hospedaje)
    Mig-->>Coord: Retorno de PDF Check-Mig Aprobado
    Coord->>Pax: Envío del PDF Check-Mig al WhatsApp del paciente
    Coord->>Coord: Registro de pasajero listo para despegue
```

---

## 🔄 Flujo 4: Logística en Terreno & Despacho Aeroturex

### Descripción:
Programación del transporte especial, asignación del conductor (ej. [DRV] Ramón Rosero), seguimiento en tiempo real del aterrizaje en el Aeropuerto José María Córdova (MDE) o Bogotá (BOG), y traslado al alojamiento.

```mermaid
sequenceDiagram
    autonumber
    actor Pax as [PAX] Paciente
    actor Coord as [COORD] Coordinación (Carolina Cortázar)
    actor Trans as Despacho Aeroturex
    actor Driver as [DRV] Conductor Asignado (Ramón Rosero)
    actor Hotel as Hotel / Ed. Park 42

    Coord->>Trans: Despacho de plantilla con RVA, Vuelo, Hora y Destino (16:00 pm día previo)
    Trans-->>Coord: Confirmación de Conductor y Teléfono
    Coord->>Pax: Envío de ficha técnica del conductor y punto de encuentro
    Driver->>Driver: Monitoreo de puerta de desembarque internacional
    Pax->>Driver: Encuentro en puerta y abordaje de vehículo
    Driver->>Coord: Notificación: "Paciente a bordo, en ruta a Medellín"
    Driver->>Hotel: Llegada a destino y entrega de equipaje
    Driver->>Coord: Notificación: "Servicio finalizado con éxito"
```

---

## 🔄 Flujo 5: Atención Clínica, Citas Médicas y Laboratorios

### Descripción:
Protocolo de preparación del paciente (ayuno para exámenes de sangre), acompañamiento presencial al centro médico (HPTU, Cardio VID, Regencord), custodia de resultados y aval médico.

```mermaid
flowchart TD
    A[Inicio de Jornada: 08:00 AM] --> B{¿Requiere Laboratorios Pre-Quirúrgicos?}
    B -->|Sí| B1[Verificación de Ayuno con el Paciente]
    B1 --> B2[Traslado a Laboratorio Clínico con Acompañante]
    B2 --> B3[Toma de Muestras de Sangre / Imágenes]
    B3 --> B4[Carga digital del PDF de Resultados al Expediente]
    B4 --> C[Cita con Especialista / Cirujano]
    B -->|No| C
    C --> D[Valoración Clínica & Explicación de Consentimiento Informado]
    D --> E{¿Paciente Apto para Procedimiento?}
    E -->|No / Requiere Ajuste| E1[Reprogramación / Ajuste de Medicación]
    E -->|Sí| F[Ingreso a Cirugía / Chequeo / Terapia Regenerativa]
    F --> G[Monitoreo Postoperatorio Inmediato]
    G --> H[Alta Clínica y Traslado a Hospedaje de Recuperación]
```

---

## 🔄 Flujo 6: Acompañamiento Presencial Bilingüe (Turnos y Guianza)

### Descripción:
Asignación de asistentes o enfermeras bilingües (*Guianza Express*), acompañamiento en consultas, traducción de indicaciones médicas, compra de medicamentos en farmacias y registro de turnos para liquidación.

```mermaid
sequenceDiagram
    autonumber
    actor Acomp as [GUIA] Acompañante Presencial Bilingüe
    actor Pax as [PAX] Paciente
    actor Farm as Farmacia
    actor Coord as [COORD] Coordinación (Carolina Cortázar)
    actor ERP as Módulo de Liquidaciones

    Acomp->>Pax: Encuentro en el lobby del hotel (08:30 AM)
    Acomp->>Pax: Asistencia durante citas, traducción inglés/papiamento
    Acomp->>Farm: Compra de fórmulas médicas prescritas
    Acomp->>Pax: Entrega de medicamentos y retorno seguro al hotel
    Acomp->>Coord: Reporte de novedades de la jornada
    Acomp->>ERP: Registro de horas trabajadas (ej. 6.5h) y recibos de viáticos
```

---

## 🔄 Flujo 7: Recuperación Postoperatoria & Alta Médica (`Fit-to-Fly`)

### Descripción:
Monitoreo de la evolución en el hotel o casa de recuperación (*Villa Anita*), curaciones de enfermería, entrega del certificado de vuelo y tours de recuperación.

```mermaid
flowchart TD
    A[Estadía Postoperatoria] --> B[Monitoreo de Signos Vitales & Curaciones]
    B --> C[Alimentación Balanceada Especializada]
    C --> D{¿Paciente desea Actividad Turística?}
    D -->|Sí| D1[Tour Suave de Recuperación: Guatapé / Comuna 13 / Compras]
    D -->|No| E[Reposo en Habitación]
    D1 & E --> F[Consulta de Control Final con Especialista]
    F --> G[Emisión de Certificado Médico Fit-to-Fly]
    G --> H[Generación de Check-Mig de Salida y Pasabordo]
```

---

## 🔄 Flujo 8: Liquidaciones Financieras, Reconciliación & Pagos

### Descripción:
Cierre del expediente de viaje, cálculo de márgenes comerciales, liquidación de facturas a Aeroturex, pago de honorarios a acompañantes y conciliación con los registros bancarios.

```mermaid
sequenceDiagram
    autonumber
    actor Coord as Coordinación / Contabilidad
    actor ERP as Motor Financiero
    actor Trans as Aeroturex
    actor Acomp as Acompañantes
    actor Bank as Bancolombia

    Coord->>ERP: Cierre del Expediente RVA###
    ERP->>ERP: Cálculo de Ingreso Total cobrado en USD/COP
    ERP->>ERP: Suma de Costos Directos (Clínica + Hotel + Transporte + Acompañamiento)
    ERP->>ERP: Determinación de Margen Bruto Real
    ERP->>Trans: Generación de Orden de Pago Transporte
    ERP->>Acomp: Generación de Liquidación de Honorarios y Viáticos
    ERP->>Bank: Ejecución de Transferencias Bancarias
    ERP->>Coord: Emisión de Balance de Utilidad por Paciente
```
