#!/usr/bin/env python3
"""
Wrapper de ejecución robusta para comandos CLI.
Normaliza códigos de salida, aplica timeouts estrictos, fuerza modo no interactivo
y captura flujos stdout/stderr en una estructura JSON canónica.
"""

import sys
import os
import time
import json
import shlex
import argparse
import subprocess
from typing import Dict, Any

def execute_cli(cmd_str: str, timeout_sec: float = 30.0) -> Dict[str, Any]:
    """Ejecuta un comando en un subproceso aislado con variables de entorno no interactivas."""
    env = os.environ.copy()
    env["CI"] = "true"
    env["DEBIAN_FRONTEND"] = "noninteractive"
    env["TERM"] = "dumb"
    env["PYTHONUNBUFFERED"] = "1"

    # En Windows, shlex.split con posix=False para respetar comillas de cmd/powershell
    is_windows = sys.platform.startswith("win")
    try:
        args = shlex.split(cmd_str, posix=not is_windows)
    except Exception as e:
        return {
            "success": False,
            "exit_code": 2,
            "stdout": "",
            "stderr": f"Error al parsear comando: {e}",
            "duration_sec": 0.0
        }

    t0 = time.perf_counter()
    try:
        proc = subprocess.Popen(
            args,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )
        stdout, stderr = proc.communicate(input="", timeout=timeout_sec)
        duration = time.perf_counter() - t0

        return {
            "success": proc.returncode == 0,
            "exit_code": proc.returncode,
            "stdout": stdout.strip(),
            "stderr": stderr.strip(),
            "duration_sec": round(duration, 3)
        }
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = proc.communicate()
        return {
            "success": False,
            "exit_code": -1,
            "stdout": stdout.strip(),
            "stderr": f"TIMEOUT: El proceso excedió el tiempo máximo permitido ({timeout_sec}s).",
            "duration_sec": timeout_sec
        }
    except Exception as ex:
        return {
            "success": False,
            "exit_code": -2,
            "stdout": "",
            "stderr": f"Error del arnés de ejecución: {ex}",
            "duration_sec": round(time.perf_counter() - t0, 3)
        }

def main():
    parser = argparse.ArgumentParser(description="Wrapper robusto para comandos CLI.")
    parser.add_argument("--command", "-c", required=True, help="Comando a ejecutar.")
    parser.add_argument("--timeout", "-t", type=float, default=30.0, help="Tiempo límite en segundos.")
    args = parser.parse_args()

    result = execute_cli(args.command, timeout_sec=args.timeout)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    main()
