---
name: skill-god
description: >-
  Master architect for designing, scaffolding, validating, testing, and deploying high-reliability agent skills (God Skill / Meta-Skill). Activate this skill whenever the user asks to create, build, design, scaffold, audit, optimize, test, or update any skill, workflow, runbook, or tool package, whether local (workspace) or global across Google Antigravity.
---

# Skill-God: Arquitecto Maestro y Generador de Skills

`skill-god` es la habilidad maestra (Meta-Skill) de grado industrial para diseñar, compilar, verificar y desplegar nuevas habilidades en Google Antigravity. Implementa las mejores prácticas del estado del arte (CodeAct, revelación progresiva, pruebas basadas en propiedades y mitigación de cuelgues de terminal).

## Matriz de Selección de Arquetipo

Antes de generar una habilidad, identifique el caso de uso adecuado:

| Arquetipo | Caso de Uso Óptimo | Componentes Principales |
| :--- | :--- | :--- |
| **`procedural_sop`** | Runbooks, revisiones de código, migraciones, estándares del equipo | `SKILL.md`, `references/sop_checklist.md` |
| **`codeact_repl`** | Transformación de datos en memoria, consumo de APIs, cero context-bloat | `SKILL.md`, `scripts/repl_module.py` |
| **`hardened_cli`** | Compilación, despliegues, utilidades de terminal con timeouts | `SKILL.md`, `scripts/cli_wrapper.py`, `references/troubleshooting.md` |
| **`mcp_service`** | Servicios compartidos multi-agente con esquemas JSON-RPC 2.0 | `SKILL.md`, `scripts/mcp_server.py` |

---

## Protocolo Operativo Paso a Paso

### Paso 1: Determinación de Requisitos y Ámbito
1. Defina el nombre unívoco en formato kebab-case (ej. `docker-cleaner`, `api-tester`).
2. Redacte la descripción en tercera persona especificando **qué hace** y **cuándo debe activarse** (ej. `"Use this skill when the user asks to..."`).
3. Elija el ámbito de despliegue:
   - **Workspace (Proyecto):** Para herramientas específicas del repositorio actual (`.agents/skills/<nombre>/`).
   - **Global (Máquina):** Para herramientas transversales del desarrollador (`~/.gemini/config/skills/<nombre>/`).

### Paso 2: Generación Automatizada (Scaffolding)
Ejecute el generador maestro desde el directorio de `skill-god`:

```bash
# Ejemplo para ámbito local de workspace:
python scripts/scaffold_skill.py --name "mi-nueva-skill" --archetype "codeact_repl" --description "Use this skill when the user asks to process local metrics." --scope "workspace"

# Ejemplo para ámbito global:
python scripts/scaffold_skill.py --name "herramienta-global" --archetype "hardened_cli" --description "Use this skill when the user needs global diagnostics." --scope "global"
```

### Paso 3: Ajuste de Lógica e Instrucciones
- Abra el `SKILL.md` generado en el destino.
- Detalle los pasos específicos en el cuerpo del markdown.
- Si incluye código en `scripts/`, asegúrese de:
  - Mantener tipado estricto.
  - Procesar colecciones en memoria (CodeAct) sin volcar megabytes de texto al contexto.
  - Forzar banderas no interactivas (`CI=true`, `--batch`, `-y`) si es una utilidad de terminal.

### Paso 4: Validación y Linting de Calidad
Ejecute el linter determinista para verificar que no existan enlaces rotos ni fallos en el frontmatter:

```bash
python scripts/validate_skill.py --target-dir "<ruta_hacia_la_skill_creada>"
```
*Si el validador reporta errores, corríjalos inmediatamente antes de continuar.*

### Paso 5: Verificación de Invariantes (Pruebas de Robustez)
Si la skill contiene scripts ejecutables de terminal o wrappers, sométalos al verificador de propiedades:

```bash
python scripts/property_verifier.py "<ruta_al_script.py>"
```
*Asegúrese de que no ocurran `TIMEOUT` (cuelgues interactivos) ni errores de sintaxis de argumentos (`exit_code: 2`).*

### Paso 6: Publicación y Confirmación
- Notifique al usuario la ruta final de la skill y las frases de activación sugeridas.
- Para verificar el diseño conceptual, consulte [skill_architecture_guide.md](./references/skill_architecture_guide.md).
- Para resolver incidencias de CLI o terminal, consulte [failure_modes_catalog.md](./references/failure_modes_catalog.md).
- Para detalles sobre la prioridad de carga de Antigravity, consulte [antigravity_ecosystem_spec.md](./references/antigravity_ecosystem_spec.md).
