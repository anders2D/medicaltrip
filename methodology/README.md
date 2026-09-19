# 🧠 CEREBRO DE INGENIERÍA INVERSA Y EXTRACCIÓN OPERATIVA
## Medical Trip Colombia S.A.S. — Sistema de Minería de Procesos Centrada en Objetos (OCPM)

Bienvenido al centro neurálgico y metodológico de **Medical Trip Colombia S.A.S.** Este directorio contiene la especificación completa, formal y ejecutable para transformar 4 años de datos conversacionales, financieros y médicos en un modelo operativo estandarizado (BPMN 2.0), un modelo relacional de datos (ERD) y Manuales de Operaciones Diarias (SOPs).

---

## 🗺️ Mapa de la Metodología

```mermaid
graph TD
    subgraph Fuentes de Datos (4 Años)
        D1[304 Chats WhatsApp CSV]
        D2[2,294 Archivos Multimedia & Docs]
        D3[Liquidacion_transporte.xlsx 7.6MB]
        D4[Liquidacion_acompanamiento.xlsx 30MB]
        D5[Tarifarios 2024-2025 & Portafolios]
    end

    subgraph Pipeline de 5 Fases
        F1[Fase 1: Normalización Probabilística<br/>Splink + Fellegi-Sunter + DuckDB]
        F2[Fase 2: Extracción OCEL 2.0 & DTW<br/>Instructor / Pydantic + Dynamic Time Warping]
        F3[Fase 3: Inducción de Roles & RACI<br/>Social Network Analysis & Script Mining]
        F4[Fase 4: Minería de Procesos BPMN 2.0<br/>Inductive Miner + PM4Py + Soundness]
        F5[Fase 5: Arquitectura de Datos ERD<br/>3NF Schema + DDL PostgreSQL/SQLite]
    end

    subgraph Artefactos de Salida
        A1[Manuales SOP Diario Hora a Hora]
        A2[Diagramas BPMN 2.0 Ejecutables]
        A3[Matriz RACI & Scripts WhatsApp]
        A4[Base de Datos Relacional / CRM Web]
    end

    D1 & D2 & D3 & D4 & D5 --> F1
    F1 --> F2
    F2 --> F3
    F3 --> F4
    F4 --> F5
    F5 --> A1 & A2 & A3 & A4
```

---

## 📚 Índice de Documentos Metodológicos

| Documento | Enlace | Propósito Central |
| :--- | :--- | :--- |
| **01. Framework OCPM Híbrido** | [`01_framework_ocpm_hybrid.md`](file:///Users/miyo123/projects/medicaltrip/methodology/01_framework_ocpm_hybrid.md) | Fundamentación teórica y matemática del marco de trabajo híbrido. |
| **02. Pipeline en 5 Fases** | [`02_pipeline_5_phases.md`](file:///Users/miyo123/projects/medicaltrip/methodology/02_pipeline_5_phases.md) | Guía de ejecución paso a paso (SOP de Extracción). |
| **03. Resolución de Entidades** | [`03_entity_resolution_splink.md`](file:///Users/miyo123/projects/medicaltrip/methodology/03_entity_resolution_splink.md) | Modelo Splink / Fellegi-Sunter para unificar actores y expedientes. |
| **04. Alineamiento Temporal (DTW)** | [`04_temporal_alignment_dtw.md`](file:///Users/miyo123/projects/medicaltrip/methodology/04_temporal_alignment_dtw.md) | Reconciliación matemática entre chats y sábanas de Excel. |
| **05. Modelado BPMN 2.0** | [`05_bpmn_inductive_miner.md`](file:///Users/miyo123/projects/medicaltrip/methodology/05_bpmn_inductive_miner.md) | Algoritmo Inductive Miner para garantizar modelos sin bloqueos. |
| **06. Modelo de Datos (ERD)** | [`06_data_model_erd.md`](file:///Users/miyo123/projects/medicaltrip/methodology/06_data_model_erd.md) | Esquema relacional en 3NF para el futuro CRM/ERP. |
| **07. Matriz de Riesgos & PHI** | [`07_risk_matrix_phi_compliance.md`](file:///Users/miyo123/projects/medicaltrip/methodology/07_risk_matrix_phi_compliance.md) | Mitigación de code-switching (Papiamento), entropía y privacidad médica. |
| **08. Orquestación de Subagentes** | [`08_subagents_orchestration.md`](file:///Users/miyo123/projects/medicaltrip/methodology/08_subagents_orchestration.md) | Arquitectura multi-agente en Antigravity para extracción paralela. |
| **Caso Real 1: RVA282** | [`examples/real_case_rva282_hernandez.md`](file:///Users/miyo123/projects/medicaltrip/methodology/examples/real_case_rva282_hernandez.md) | Extracción paso a paso de logística, transporte y coordinación. |
| **Caso Real 2: RVA271** | [`examples/real_case_rva271_zulaica.md`](file:///Users/miyo123/projects/medicaltrip/methodology/examples/real_case_rva271_zulaica.md) | Extracción de atención clínica, laboratorios, pólizas y recuperación. |

---

## ⚡ Integración con Antigravity (Skills, Rules & Subagentes)

Esta metodología se conecta nativamente con las características de Antigravity:
1. **Customization Root**: [`.agents/`](file:///Users/miyo123/projects/medicaltrip/.agents)
2. **Skill de Extracción**: [`.agents/skills/medicaltrip-extractor/SKILL.md`](file:///Users/miyo123/projects/medicaltrip/.agents/skills/medicaltrip-extractor/SKILL.md)
3. **Skill de Modelado BPMN**: [`.agents/skills/bpmn-modeler/SKILL.md`](file:///Users/miyo123/projects/medicaltrip/.agents/skills/bpmn-modeler/SKILL.md)
4. **Reglas Operativas**: [`.agents/rules/extraction_standards.md`](file:///Users/miyo123/projects/medicaltrip/.agents/rules/extraction_standards.md) y [`AGENTS.md`](file:///Users/miyo123/projects/medicaltrip/AGENTS.md)
