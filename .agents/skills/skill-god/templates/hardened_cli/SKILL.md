---
name: {{SKILL_NAME}}
description: >-
  {{SKILL_DESCRIPTION}}
---

# {{SKILL_TITLE}} (Hardened CLI Automation)

Habilidad diseñada para interactuar con herramientas de línea de comandos (CLI) de forma segura, determinista y blindada contra cuelgues interactivos de terminal.

## Salvaguardas de Ejecución
1. **Ejecución No Interactiva Forzada:** Los comandos deben utilizar flags como `--batch`, `-y`, `--quiet` y variables de entorno `CI=true` para prevenir solicitudes de confirmación humana desatendidas.
2. **Encapsulamiento en Wrapper:** Usar [cli_wrapper.py](./scripts/cli_wrapper.py) para normalizar códigos de retorno, sanitizar argumentos y capturar salidas estructuradas en JSON.
3. **Modo Dry-Run Obligatorio:** Si la operación es destructiva, ejecute primero en modo simulación (`--dry-run`).

## Invocación Segura

```bash
# Ejecutar a través del wrapper seguro:
python scripts/cli_wrapper.py --command "tu-comando-aqui" --timeout 15
```

## Solución de Problemas
- Consulte [troubleshooting.md](./references/troubleshooting.md) para diagnosticar códigos de salida anómalos, errores de permisos o fallos de autenticación.
