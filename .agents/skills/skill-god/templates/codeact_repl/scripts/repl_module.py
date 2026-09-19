#!/usr/bin/env python3
"""
Módulo de procesamiento determinista en memoria para habilidades CodeAct.
Permite orquestar, agregar y transformar colecciones de datos evitando context bloat.
"""

import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Optional

def process_data(source: str, filter_key: Optional[str] = None, expected_value: Optional[str] = None) -> Dict[str, Any]:
    """Procesa una fuente de datos en memoria y genera un resumen compacto."""
    src_path = Path(source)
    if not src_path.exists():
        return {
            "success": False,
            "error": f"Archivo no encontrado: {source}",
            "summary": "Falló: origen inexistente"
        }

    try:
        raw_text = src_path.read_text(encoding="utf-8")
        data = json.loads(raw_text) if raw_text.strip().startswith(("{", "[")) else raw_text.splitlines()
    except Exception as err:
        return {
            "success": False,
            "error": f"Error al parsear fuente: {err}",
            "summary": "Falló la lectura o parsing"
        }

    # Procesamiento y agregación en memoria
    if isinstance(data, list):
        total = len(data)
        if filter_key and isinstance(data[0], dict) if data else False:
            matched = [item for item in data if item.get(filter_key) == expected_value]
        else:
            matched = data
        count = len(matched)
        return {
            "success": True,
            "total_items": total,
            "matched_items": count,
            "summary": f"Procesados {total} elementos. {count} coincidencias encontradas.",
            "sample": matched[:3]  # Muestra mínima para no inundar el contexto
        }

    return {
        "success": True,
        "type": type(data).__name__,
        "summary": "Procesamiento de objeto singular completado con éxito."
    }

if __name__ == "__main__":
    # Permite ejecución tanto como módulo importado como script de CLI
    if len(sys.argv) > 1:
        res = process_data(sys.argv[1])
        print(json.dumps(res, indent=2))
    else:
        print("Uso: python repl_module.py <archivo_origen>")
