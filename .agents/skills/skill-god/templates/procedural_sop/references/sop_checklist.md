# Lista de Verificación y Criterios Operativos (SOP Checklist)

Este documento es una referencia complementaria consultada bajo demanda para preservar la ventana de contexto.

## Criterios de Calidad
- [ ] Todas las aserciones de pre-condición se satisfacen.
- [ ] No se modificaron archivos fuera del alcance declarado.
- [ ] Se ejecutaron linters y formateadores sin emitir advertencias críticas.
- [ ] Los artefactos de salida cumplen con los tipos de datos requeridos.

## Procedimiento de Recuperación ante Fallos
1. Detener el proceso y registrar el código de error o traceback exacto.
2. Revertir cambios parciales al último estado estable conocido (`git status`, `git checkout`).
3. Diagnosticar si la causa raíz obedece a dependencias faltantes o discrepancias de versión.
