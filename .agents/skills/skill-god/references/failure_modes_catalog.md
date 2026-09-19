# Catálogo de Modos de Fallo en Automatización de Terminal y Ejecución

Guía para prevenir cuelgues, saturación de buffers y desbordamiento de contexto al diseñar habilidades técnicas.

## 1. El Error `ENOTTY` y la Trampa de `stdin=DEVNULL`
- **Causa:** Muchas utilidades invocan `isatty(0)` para verificar si están conectadas a un terminal. Al desacoplar stdin directamente con `/dev/null` o `subprocess.DEVNULL`, las llamadas a `tcgetattr()` fallan con `Inappropriate ioctl for device (ENOTTY)` o abortan de inmediato.
- **Solución:** En sistemas POSIX, usar emulación PTY (`pty.openpty()`). En Windows y multiplataforma, enviar EOF limpio tras iniciar y forzar variables de entorno no interactivas (`CI=true`, `DEBIAN_FRONTEND=noninteractive`, `TERM=dumb`).

## 2. El Falso Positivo del Código de Salida 2
- **Causa:** Los frameworks de parsing de argumentos (`argparse` en Python, convenciones POSIX) reservan el código de salida `2` para errores de sintaxis en la invocación (argumentos desconocidos o requeridos faltantes).
- **Peligro:** Si un arnés de prueba computa códigos en `[0, 1, 2]` como "éxitos", un script completamente inoperante que colapsa de inmediato por error de sintaxis obtendrá una tasa de aprobación del 100%.
- **Solución:** Tratar el código de retorno `2` estrictamente como un fallo del arnés de invocación o de la firma de argumentos.

## 3. Buffering por Bloques en libc vs Buffering por Líneas
- **Causa:** Cuando `stdout` no está conectado a una consola interactiva, la biblioteca estándar de C conmuta de *line buffering* a *block buffering* (típicamente 4096 bytes).
- **Efecto:** Procesos largos no emiten texto durante minutos, provocando que el arnés asuma erróneamente que el proceso está colgado y lo termine por timeout.
- **Solución:** Establecer `PYTHONUNBUFFERED=1` para Python, o flags equivalentes de flush inmediato en binarios de compilación.
