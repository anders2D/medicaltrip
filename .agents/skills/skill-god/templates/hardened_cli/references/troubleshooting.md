# Matriz de Diagnóstico y Mitigación de Fallos CLI

Guía de referencia para resolver anomalías frecuentes durante la ejecución de utilidades de terminal por agentes.

| Síntoma / Error | Causa Raíz Técnica | Acción Correctiva |
| :--- | :--- | :--- |
| **`TIMEOUT` / Proceso colgado** | El binario invocó `isatty()` y está esperando confirmación en `stdin` (`[y/N]`). | Pasar banderas no interactivas (`-y`, `--batch`, `--quiet`) o revisar que `CI=true` esté activo. |
| **`exit_code: 2`** | El comando rechazó la sintaxis o nombres de banderas (`argparse` / POSIX). | Revisar el manual oficial de la herramienta y verificar comillas en rutas con espacios. |
| **`Permission Denied` / EACCES** | Falta de permisos de ejecución en el binario o privilegios insuficientes en el SO. | En Linux/macOS: `chmod +x <script>`. En Windows: verificar permisos de usuario y directiva de ejecución. |
| **`ENOTTY`** | La herramienta exige un descriptor de terminal interactivo completo. | Usar emulación PTY (`pty.openpty` / `pexpect`) en lugar de tuberías estándar. |
| **Salida Truncada o Vacía** | La herramienta activó modo de buffer por bloques en libc en lugar de líneas. | Forzar `PYTHONUNBUFFERED=1` o banderas de flush inmediato en la herramienta. |
