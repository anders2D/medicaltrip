# SkillGOD ⚡

**El Arquetipo Maestro y Generador de Skills de Grado Industrial para Google Antigravity y Agentes Autónomos.**

`SkillGOD` es tanto un repositorio de desarrollo como una **Skill Global (`skill-god`)** diseñada para resolver definitivamente los problemas estructurales en la creación de habilidades para agentes:
- Cero *context bloat* mediante la adopción del paradigma **CodeAct**.
- Prevención de cuelgues interactivos de terminal y errores `ENOTTY`.
- Sustitución de optimizaciones estadísticas ilusorias por contratos formales, linter estricto y pruebas basadas en invariantes.

---

## Estructura del Repositorio

```text
SkillGOD/
├── SKILL.md                             # Manifiesto Maestro de la Skill Dios
├── scripts/
│   ├── scaffold_skill.py                # Generador CLI interactivo/programático
│   ├── validate_skill.py                # Linter estricto (frontmatter, links, AST)
│   └── property_verifier.py             # Arnés de prueba de robustez e invariantes
├── templates/
│   ├── procedural_sop/                  # Plantilla para Runbooks y políticas
│   ├── codeact_repl/                    # Plantilla CodeAct in-memory
│   ├── hardened_cli/                    # Plantilla CLI blindada con timeouts
│   └── mcp_service/                     # Plantilla de servicio MCP (JSON-RPC 2.0)
└── references/
    ├── skill_architecture_guide.md      # Guía de diseño y límites cognitivos
    ├── antigravity_ecosystem_spec.md    # Precedencia de carga y especificaciones
    └── failure_modes_catalog.md         # Catálogo de mitigación de errores de ejecución
```

---

## Uso Rápido

### 1. Validar la integridad de una skill existente:
```bash
python scripts/validate_skill.py --target-dir .
```

### 2. Generar una nueva skill desde un arquetipo:
```bash
# Crear una skill de procesamiento CodeAct local:
python scripts/scaffold_skill.py --name "analizador-metricas" --archetype "codeact_repl" --scope "workspace"

# Crear una utilidad CLI global:
python scripts/scaffold_skill.py --name "limpiador-disco" --archetype "hardened_cli" --scope "global"
```

### 3. Verificar la robustez de un script CLI:
```bash
python scripts/property_verifier.py "scripts/cli_wrapper.py" --flag "--command"
```
