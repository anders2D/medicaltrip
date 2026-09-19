# Guía de Arquitectura de Skills para Agentes Autónomos

## 1. El Principio de Revelación Progresiva (Progressive Disclosure)
La saturación de la ventana de contexto (*context bloat*) es la causa principal del deterioro de razonamiento en LLMs cuando se manejan decenas de herramientas.
- Al arrancar, el arnés del agente **únicamente** inyecta el `name` y `description` de cada habilidad.
- El cuerpo de `SKILL.md` solo se carga cuando el modelo decide activar la habilidad.
- La documentación extensa debe residir en `references/` y vincularse con enlaces relativos `[guía](./references/guia.md)`. El agente solo la leerá si la tarea específica lo demanda.

## 2. Los 4 Arquetipos Técnicos

### Arquetipo A: Procedural / SOP (Runbooks & Políticas)
- **Cuándo usarlo:** Procesos paso a paso donde el agente ya posee herramientas nativas (ej. edición de archivos, linters estándar, revisiones de código, protocolos de testing).
- **Estructura:** Markdown claro, fases secuenciales, checklists en `references/`.

### Arquetipo B: CodeAct REPL (Procesamiento In-Memory)
- **Cuándo usarlo:** Análisis de datos, pipelines de transformación, APIs con respuestas voluminosas.
- **Ventaja SOTA:** Reduce el consumo de tokens en un 90%. El agente escribe código Python para filtrar colecciones en memoria; solo los resúmenes compactos entran al contexto.

### Arquetipo C: Hardened CLI (Automatización de Terminal)
- **Cuándo usarlo:** Comandos de compilación, gestión de contenedores, despliegues en la nube.
- **Regla de Oro:** Siempre usar wrappers no interactivos (`CI=true`, flags `--batch` / `-y`), timeouts definidos y sanitización de argumentos.

### Arquetipo D: Servicios MCP (Model Context Protocol)
- **Cuándo usarlo:** Exposición de endpoints RPC reutilizables entre múltiples agentes y clientes IDE.
- **Estructura:** Esquemas JSON-RPC 2.0 deterministas sobre stdio o SSE.

## 3. Calibración del Campo `description`
El campo `description` en el frontmatter es el discriminador semántico:
- **Escribir en tercera persona:** *"Use this skill when the user asks to..."*
- **Especificar QUÉ hace y CUÁNDO activarla.**
- **Evitar sobreajuste léxico:** Describir conceptos funcionales en vez de listas exhaustivas de palabras clave idénticas.
