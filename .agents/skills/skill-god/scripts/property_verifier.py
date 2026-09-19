#!/usr/bin/env python3
"""
Arnés de Verificación de Invariantes y Robustez para Componentes de Skills.
Evalúa resiliencia ante inputs malformados, espacios en rutas, cadenas Unicode
y previene falsos positivos distinguiendo fallos de negocio vs fallos de sintaxis CLI (exit code 2).
"""

import sys
import os
import json
import time
import subprocess
from pathlib import Path
from typing import List, Dict, Any

# Generador determinista de casos límite
PROPERTY_GENERATORS = [
    {"name": "empty_string", "val": ""},
    {"name": "spaces_in_path", "val": "ruta con/espacios intercalados/archivo.txt"},
    {"name": "unicode_utf8", "val": "datos_á_ñ_漢字_🚀.json"},
    {"name": "shell_chars_injection", "val": "archivo; echo INJECTION && ls"},
    {"name": "nested_quotes", "val": "\"parametro 'con' comillas\""},
    {"name": "long_buffer", "val": "A" * 2048},
    {"name": "newlines_in_text", "val": "linea1\nlinea2\r\nlinea3"},
]

class SkillPropertyVerifier:
    def __init__(self, target_executable: str, default_timeout: float = 5.0):
        self.target = target_executable
        self.default_timeout = default_timeout
        self.results: List[Dict[str, Any]] = []

    def run_check(self, args: List[str]) -> Dict[str, Any]:
        """Ejecuta una llamada aislando descriptores y auditando códigos de terminación."""
        env = os.environ.copy()
        env["CI"] = "true"
        env["PYTHONUNBUFFERED"] = "1"

        if self.target.endswith(".py"):
            cmd = [sys.executable, self.target] + args
        else:
            cmd = [self.target] + args

        t0 = time.perf_counter()
        try:
            # En Windows subprocess usa CREATE_NO_WINDOW si se desea, aquí estándar seguro:
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace",
                env=env
            )
            # Enviar EOF seguro en stdin tras iniciar para no bloquear si no requiere terminal interactiva
            stdout, stderr = proc.communicate(input="", timeout=self.default_timeout)
            duration = time.perf_counter() - t0

            # Evaluación rigurosa de invariantes:
            # exit_code == 2 suele ser error de argparse (sintaxis de CLI rota)
            # exit_code == 0 es éxito
            # exit_code == 1 suele ser rechazo controlado de entrada inválida
            return {
                "args": args,
                "exit_code": proc.returncode,
                "stdout": stdout.strip(),
                "stderr": stderr.strip(),
                "duration_sec": duration,
                "status": "COMPLETED"
            }
        except subprocess.TimeoutExpired:
            proc.kill()
            stdout, stderr = proc.communicate()
            return {
                "args": args,
                "exit_code": -1,
                "stdout": stdout,
                "stderr": "TIMEOUT: El proceso excedió el tiempo límite (posible cuelgue de stdin).",
                "duration_sec": self.default_timeout,
                "status": "HANG_DETECTED"
            }
        except Exception as e:
            return {
                "args": args,
                "exit_code": -2,
                "stdout": "",
                "stderr": str(e),
                "duration_sec": time.perf_counter() - t0,
                "status": "RUNNER_ERROR"
            }

    def verify_suite(self, test_flag: str = "--input") -> Dict[str, Any]:
        """Ejecuta la suite de invariantes."""
        passed = 0
        hangs = 0
        syntax_cli_errors = 0
        crashes = 0

        for gen in PROPERTY_GENERATORS:
            res = self.run_check([test_flag, gen["val"]])
            self.results.append(res)

            if res["status"] == "HANG_DETECTED":
                hangs += 1
            elif res["exit_code"] == 2:
                # Alerta: error de sintaxis en el parser de comandos CLI
                syntax_cli_errors += 1
            elif res["exit_code"] in [0, 1]:
                # Respuesta controlada
                passed += 1
            else:
                crashes += 1

        total = len(PROPERTY_GENERATORS)
        summary = {
            "target": self.target,
            "total_runs": total,
            "handled_controlled": passed,
            "syntax_cli_errors": syntax_cli_errors,
            "hangs": hangs,
            "unhandled_crashes": crashes,
            "pass_rate_percent": (passed / total) * 100.0 if total > 0 else 0.0,
            "robust": (hangs == 0 and crashes == 0 and passed >= (total * 0.7))
        }
        return summary

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python property_verifier.py <ruta_script> [--flag <nombre_flag>]")
        sys.exit(1)

    target_script = sys.argv[1]
    flag = "--input"
    if "--flag" in sys.argv:
        idx = sys.argv.index("--flag")
        if idx + 1 < len(sys.argv):
            flag = sys.argv[idx + 1]

    verifier = SkillPropertyVerifier(target_script)
    report = verifier.verify_suite(test_flag=flag)
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["robust"] else 1)
