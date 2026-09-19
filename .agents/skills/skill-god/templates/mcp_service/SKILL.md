---
name: {{SKILL_NAME}}
description: >-
  {{SKILL_DESCRIPTION}}
---

# {{SKILL_TITLE}} (Integración Model Context Protocol)

Habilidad diseñada para interactuar con servidores MCP (Model Context Protocol), exponiendo herramientas estructuradas bajo esquemas JSON-RPC 2.0 deterministas.

## Estructura de Integración MCP
1. **Contratos Estrictos:** Todo esquema de herramienta debe especificar tipos claros y evitar argumentos ambiguos.
2. **Servidor Local / Helper:** Utilizar el servidor de referencia [mcp_server.py](./scripts/mcp_server.py) para registrar y probar herramientas localmente vía stdio.
3. **Manejo Normalizado de Respuestas:** Todas las llamadas emiten resultados o errores con códigos JSON-RPC estándar (`-32600` error de petición, `-32601` método no encontrado, etc.).

## Registro y Configuración
Para habilitar el servidor en Antigravity, vincular en `mcp_config.json`:

```json
{
  "mcpServers": {
    "{{SKILL_NAME}}": {
      "command": "python",
      "args": ["./scripts/mcp_server.py"]
    }
  }
}
```

## Archivos
- [mcp_server.py](./scripts/mcp_server.py): Servidor JSON-RPC 2.0 en Python sobre stdio.
