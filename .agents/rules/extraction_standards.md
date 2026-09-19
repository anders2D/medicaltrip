---
trigger: always_on
description: Reglas operativas estrictas para la extracción y minería de procesos de Medical Trip Colombia S.A.S.
---

# Reglas de Extracción y Calidad Operativa (Medical Trip Brain)

1. **Garantía de No Alucinación (Decodificación Restringida)**:
   - Todas las entidades extraídas (Códigos `RVA`, `CTZ`, teléfonos, clínicas, aerolíneas) deben provenir estrictamente de la evidencia empírica en los archivos `.csv`, `.xlsx`, `.pdf` o `.txt`.
   - Si un dato no está presente en el corpus, se marca explícitamente como `NULL` o `NO_REGISTRADO`, nunca se asume ni se inventa.

2. **Preservación de Privacidad y Cumplimiento PHI**:
   - Todo reporte, diagrama o visualización pública debe usar identificadores normalizados (`ENT-PAX-XXXX`, `ENT-DRV-XXXX`).
   - Los números de pasaporte y documentos sensibles no deben exponerse en texto plano fuera de la base de datos segura.

3. **Consistencia Temporal Estricta**:
   - Todas las marcas de tiempo deben normalizarse a formato ISO-8601 con zona horaria explícita (`America/Bogota` / UTC-5).
   - Los desfases entre chats y libros de Excel deben reconciliarse mediante el algoritmo DTW documentado en `methodology/04_temporal_alignment_dtw.md`.

4. **Integridad de Modelado BPMN 2.0**:
   - Todo diagrama de procesos generado debe cumplir la propiedad matemática de **Soundness** (libre de interbloqueos, un solo nodo de inicio y fin, sin tareas colgantes).
