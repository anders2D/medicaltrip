# 🏛️ Arquitectura de Software y Flujos de Trabajo End-to-End
## Plataforma de Gestión Integral: MEDICAL TRIP OPERATIVE CLOUD (ERP / CRM / BPM)

Este documento y directorio definen la especificación completa, los diagramas de flujo de control, el modelo de datos relacional y la arquitectura técnica para construir una **aplicación web nativa** que automatice y gestione la operación de **Medical Trip Colombia S.A.S.** de inicio a fin.

---

## 🗺️ Mapa de Módulos del Sistema

```mermaid
graph TD
    subgraph 1. Módulo Comercial & Leads
        M1_1[Ingesta de Leads WhatsApp / Web]
        M1_2[Recepción & Triaje Medisch Dossier]
        M1_3[Motor de Cotización Dinámica CTZ Multidivisa]
        M1_4[Pasarela de Pagos & Depósitos RVA]
    end

    subgraph 2. Módulo de Logística de Viaje
        M2_1[Generador Automático Check-Mig Colombia]
        M2_2[Emisión de Póliza Médica de Viajero]
        M2_3[Integración FlightAware Vuelos MDE/BOG]
        M2_4[Despacho & Asignación Aeroturex]
    end

    subgraph 3. Módulo de Coordinación Clínica
        M3_1[Agenda de Citas HPTU / Cardio VID / Regencord]
        M3_2[Gestión de Laboratorios Clínicos & Resultados]
        M3_3[Seguimiento de Evolución Médica & Fit-to-Fly]
    end

    subgraph 4. Módulo de Hospitalidad & Terreno
        M4_1[Gestión de Habitaciones Hoteles / Villa Anita]
        M4_2[Turnos de Acompañamiento Presencial Bilingüe]
        M4_3[Tours de Recuperación & Compras]
    end

    subgraph 5. Módulo Financiero & Liquidaciones
        M5_1[Liquidación de Traslados de Transporte]
        M5_2[Liquidación de Honorarios Acompañantes]
        M5_3[Conciliación Bancaria Bancolombia / DTW]
    end

    M1_1 --> M1_2 --> M1_3 --> M1_4
    M1_4 --> M2_1 & M2_2 & M2_3 & M2_4
    M2_4 --> M3_1 & M4_1 & M4_2
    M3_1 --> M3_2 --> M3_3
    M4_2 --> M5_2
    M2_4 --> M5_1
    M5_1 & M5_2 --> M5_3
```

---

## 📑 Índice de Especificaciones Técnicas

| Documento | Enlace | Contenido |
| :--- | :--- | :--- |
| **1. Flujos de Trabajo Maestros (Workflows 1 al 8)** | [`01_master_workflows_bpmn.md`](file:///Users/miyo123/projects/medicaltrip/application_architecture/01_master_workflows_bpmn.md) | Diagramas de secuencia y BPMN 2.0 de los 8 subprocesos operativos. |
| **2. Esquema Relacional de Base de Datos (DDL)** | [`02_database_schema_3nf.sql`](file:///Users/miyo123/projects/medicaltrip/application_architecture/02_database_schema_3nf.sql) | 22 Tablas relacionales con llaves foráneas, índices, triggers y vistas. |
| **3. Catálogo de Tarifas y Servicios Semilla** | [`03_seed_catalogs.sql`](file:///Users/miyo123/projects/medicaltrip/application_architecture/03_seed_catalogs.sql) | Datos semilla de procedimientos CUPS, tarifas convenio 2024-2025, hoteles y rutas. |
| **4. Arquitectura de Software y APIs (OpenAPI / REST)** | [`04_api_architecture_and_endpoints.md`](file:///Users/miyo123/projects/medicaltrip/application_architecture/04_api_architecture_and_endpoints.md) | Contratos de API REST / GraphQL, Webhooks de WhatsApp y Workers en segundo plano. |
| **5. Diseño de Interfaces (UI/UX Wireframes)** | [`05_ui_ux_wireframes_and_views.md`](file:///Users/miyo123/projects/medicaltrip/application_architecture/05_ui_ux_wireframes_and_views.md) | Pantallas del Dashboard de Coordinación, App Móvil del Conductor y Portal del Paciente. |
