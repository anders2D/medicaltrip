# 🤖 AGENTS.md — Directrices del Cerebro Operativo: Medical Trip Colombia S.A.S.

Este archivo define el contexto maestro, las reglas de ingeniería y la arquitectura de agentes para el proyecto **Medical Trip Colombia**.

---

## 🎯 Misión del Proyecto
Realizar la ingeniería inversa integral de 4 años de operaciones de **Medical Trip Colombia S.A.S.** utilizando la **Metodología Híbrida Ágil centrada en Objetos (OCPM)** para extraer:
1. Flujo de trabajo diario hora a hora (Daily SOPs).
2. Diagramas BPMN 2.0 ejecutables (Soundness garantizado).
3. Matriz RACI y catálogo de plantillas/scripts de WhatsApp.
4. Modelo de datos relacional (ERD en 3NF) para el futuro CRM/ERP.

---

## 🧭 Rutas y Estructura del Repositorio

- **Metodología y Blueprint Maestro**: [`methodology/`](file:///Users/miyo123/projects/medicaltrip/methodology)
- **Datos Crudos y Extraídos**: [`data/`](file:///Users/miyo123/projects/medicaltrip/data)
- **Customizaciones Antigravity**: [`.agents/`](file:///Users/miyo123/projects/medicaltrip/.agents)
  - **Reglas**:
    - [`.agents/rules/extraction_standards.md`](file:///Users/miyo123/projects/medicaltrip/.agents/rules/extraction_standards.md)
    - [`.agents/rules/qa_protocol.md`](file:///Users/miyo123/projects/medicaltrip/.agents/rules/qa_protocol.md)
    - [`.agents/rules/uiux_design_standards.md`](file:///Users/miyo123/projects/medicaltrip/.agents/rules/uiux_design_standards.md)
    - [`.agents/rules/hexagonal_architecture_standards.md`](file:///Users/miyo123/projects/medicaltrip/.agents/rules/hexagonal_architecture_standards.md)
  - **Skills**:
    - [`.agents/skills/uiux-autonomous-guardian/SKILL.md`](file:///Users/miyo123/projects/medicaltrip/.agents/skills/uiux-autonomous-guardian/SKILL.md)
    - [`.agents/skills/autonomous-qa-evaluator/SKILL.md`](file:///Users/miyo123/projects/medicaltrip/.agents/skills/autonomous-qa-evaluator/SKILL.md)
    - [`.agents/skills/medicaltrip-extractor/SKILL.md`](file:///Users/miyo123/projects/medicaltrip/.agents/skills/medicaltrip-extractor/SKILL.md)
    - [`.agents/skills/bpmn-modeler/SKILL.md`](file:///Users/miyo123/projects/medicaltrip/.agents/skills/bpmn-modeler/SKILL.md)

---

## 🔒 Reglas Críticas de Calidad & QA Autónomo
1. **Comando "haz qa"**: Cuando el usuario solicite "haz qa", ejecuta de inmediato el pipeline de evaluación E2E autónomo con arnés Chromium CDP, aserciones deterministas BigInt, sellos SHA-256 y evidencia de screenshots.
2. **Sin Alucinaciones**: Toda entidad o regla de negocio debe estar respaldada por evidencia empírica en los archivos de `data/`.
3. **Privacidad PHI**: Nunca exponer pasaportes o datos médicos en texto plano; usar siempre identificadores normalizados (`ENT-PAX-XXXX`).
4. **Reconciliación DTW**: Los desfases temporales entre WhatsApp y los Excels de liquidación deben resolverse mediante Dynamic Time Warping.
