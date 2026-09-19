---
name: {{SKILL_NAME}}
description: >-
  {{SKILL_DESCRIPTION}}
---

# {{SKILL_TITLE}} (CodeAct & In-Memory Execution)

Esta habilidad utiliza el paradigma **CodeAct**: orquesta transformaciones y procesamiento de datos directamente en el entorno de ejecución Python/REPL en lugar de emitir comandos sueltos por terminal o acumular megabytes de texto en la ventana de contexto.

## Principio de Cero Saturación de Contexto (Zero-Context Bloat)
1. **Orquestación en Memoria:** Ejecutar pipelines de datos utilizando el módulo de soporte [repl_module.py](./scripts/repl_module.py).
2. **Filtrado Local:** Filtrar y resumir grandes volúmenes de datos dentro de Python antes de imprimir el resultado final.
3. **Manejo Dinámico de Errores:** Capturar excepciones con bloques `try...except` nativos para auto-corregir sin gastar turnos conversacionales innecesarios.

## Guía Rápida de Invocación Programática

```python
# Ejemplo de orquestación en Python:
import sys
from pathlib import Path

# Cargar módulo local
sys.path.insert(0, str(Path("scripts").resolve()))
import repl_module

# Procesar datos en memoria (sin saturar la ventana de contexto con resultados crudos)
resultado = repl_module.process_data(source="datos.json", filter_key="status", expected_value="active")
print(f"Procesamiento completado con éxito: {resultado['summary']}")
```

## Archivos de Soporte
- [repl_module.py](./scripts/repl_module.py): Lógica de ejecución determinista y funciones tipadas para consumo del agente.
