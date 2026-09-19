#!/usr/bin/env python3
"""
Validador y Linter de Calidad para Skills de Google Antigravity.
Verifica integridad de frontmatter, enlaces rotos en markdown,
convenciones de nomenclatura y análisis sintáctico (AST) de scripts.
"""

import os
import sys
import re
import ast
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple

KEBAB_CASE_REGEX = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
LINK_REGEX = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

class SkillValidator:
    def __init__(self, skill_dir: Path):
        self.skill_dir = skill_dir.resolve()
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate(self) -> Dict[str, Any]:
        """Ejecuta todas las reglas de validación sobre el paquete de la skill."""
        if not self.skill_dir.exists() or not self.skill_dir.is_dir():
            return {
                "valid": False,
                "skill_path": str(self.skill_dir),
                "errors": [f"El directorio especificado no existe: {self.skill_dir}"],
                "warnings": []
            }

        skill_md = self.skill_dir / "SKILL.md"
        if not skill_md.exists():
            self.errors.append("Falta el archivo obligatorio 'SKILL.md' en la raíz del paquete.")
            return self._build_report()

        # 1. Validar Frontmatter y Metadatos
        frontmatter, markdown_body = self._parse_frontmatter(skill_md)
        if frontmatter is not None:
            self._validate_frontmatter(frontmatter)

        # 2. Validar Enlaces en Markdown
        if markdown_body:
            self._validate_links(skill_md, markdown_body)

        # 3. Validar Scripts en scripts/
        self._validate_scripts()

        # 4. Validar Estructura General de Directorios
        self._validate_structure()

        return self._build_report()

    def _parse_frontmatter(self, skill_md: Path) -> Tuple[Dict[str, str] | None, str]:
        """Extrae el frontmatter YAML y el cuerpo markdown sin requerir dependencias externas pesadas."""
        try:
            content = skill_md.read_text(encoding="utf-8")
        except Exception as e:
            self.errors.append(f"No se pudo leer SKILL.md: {e}")
            return None, ""

        if not content.startswith("---"):
            self.errors.append("SKILL.md debe comenzar con '---' para declarar el frontmatter YAML.")
            return None, content

        parts = content.split("---", 2)
        if len(parts) < 3:
            self.errors.append("El frontmatter de SKILL.md no está debidamente cerrado con '---'.")
            return None, content

        raw_yaml = parts[1].strip()
        body = parts[2].strip()

        # Parseo simple y robusto de pares clave: valor
        parsed = {}
        current_key = None
        current_val = []

        for line in raw_yaml.splitlines():
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue

            if ":" in line and not line.startswith(" ") and not line.startswith("\t"):
                if current_key:
                    parsed[current_key] = " ".join(current_val).strip()
                k, v = line.split(":", 1)
                current_key = k.strip()
                v_clean = v.strip()
                if v_clean in [">", ">-", "|", "|-"]:
                    current_val = []
                elif v_clean:
                    current_val = [v_clean.strip("\"'")]
                else:
                    current_val = []
            else:
                if current_key:
                    current_val.append(line_str.strip("\"'"))

        if current_key:
            parsed[current_key] = " ".join(current_val).strip()

        return parsed, body

    def _validate_frontmatter(self, fm: Dict[str, str]):
        """Valida que los campos name y description cumplan la norma de Antigravity."""
        # Campo 'name'
        if "name" not in fm or not fm["name"]:
            self.errors.append("El campo 'name' es obligatorio en el frontmatter de SKILL.md.")
        else:
            name = fm["name"]
            if not KEBAB_CASE_REGEX.match(name):
                self.errors.append(f"El nombre '{name}' no cumple con la convención kebab-case (ej. 'mi-skill-nombre').")
            if self.skill_dir.name != name:
                self.warnings.append(
                    f"El nombre en frontmatter ('{name}') difiere del nombre del directorio ('{self.skill_dir.name}'). "
                    "Se recomienda alinearlos para evitar discrepancias de descubrimiento."
                )

        # Campo 'description'
        if "description" not in fm or not fm["description"]:
            self.errors.append("El campo 'description' es obligatorio en el frontmatter de SKILL.md.")
        else:
            desc = fm["description"]
            if len(desc) < 30:
                self.warnings.append(
                    f"La descripción es demasiado breve ({len(desc)} caracteres). "
                    "Antigravity utiliza la descripción para decidir si activa la skill. Debe especificar qué hace y cuándo usarla."
                )
            if not any(trigger in desc.lower() for trigger in ["use this skill", "activate this skill", "when the user", "cuándo", "usar esta"]):
                self.warnings.append(
                    "Se recomienda formular la descripción en tercera persona especificando disparadores claros "
                    "(ej. 'Use this skill when the user asks to...')."
                )

    def _validate_links(self, doc_path: Path, content: str):
        """Verifica que los hipervínculos relativos apunten a archivos reales existentes."""
        for match in LINK_REGEX.finditer(content):
            label, link = match.group(1), match.group(2)
            # Ignorar enlaces web externos o anclas
            if link.startswith("http://") or link.startswith("https://") or link.startswith("#"):
                continue

            clean_link = link.split("#")[0].strip()
            if not clean_link:
                continue

            target_path = (doc_path.parent / clean_link).resolve()
            if not target_path.exists():
                self.errors.append(
                    f"Enlace roto en {doc_path.name}: '{link}' (archivo no encontrado: {target_path})"
                )

    def _validate_scripts(self):
        """Verifica que los scripts dentro de scripts/ tengan sintaxis válida."""
        scripts_dir = self.skill_dir / "scripts"
        if not scripts_dir.exists() or not scripts_dir.is_dir():
            return

        for entry in scripts_dir.rglob("*"):
            if entry.is_file() and entry.suffix == ".py":
                try:
                    ast.parse(entry.read_text(encoding="utf-8"), filename=str(entry))
                except SyntaxError as syn_err:
                    self.errors.append(f"Error de sintaxis Python en {entry.relative_to(self.skill_dir)}: {syn_err}")
                except Exception as e:
                    self.errors.append(f"No se pudo analizar el script {entry.relative_to(self.skill_dir)}: {e}")

    def _validate_structure(self):
        """Revisa la higiene general de carpetas según el estándar de Antigravity."""
        allowed_dirs = {"scripts", "examples", "resources", "references", "templates"}
        for item in self.skill_dir.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                if item.name not in allowed_dirs:
                    self.warnings.append(
                        f"Directorio inusual '{item.name}'. La estructura estándar sugiere: {', '.join(sorted(allowed_dirs))}."
                    )

    def _build_report(self) -> Dict[str, Any]:
        return {
            "valid": len(self.errors) == 0,
            "skill_name": self.skill_dir.name,
            "skill_path": str(self.skill_dir),
            "errors": self.errors,
            "warnings": self.warnings
        }

def main():
    parser = argparse.ArgumentParser(description="Validador y Linter de Skills para Google Antigravity.")
    parser.add_argument("--target-dir", "-t", required=True, help="Ruta al directorio de la skill.")
    parser.add_argument("--json", action="store_true", help="Emitir salida exclusivamente en formato JSON.")
    args = parser.parse_args()

    validator = SkillValidator(Path(args.target_dir))
    report = validator.validate()

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(f"\n==================================================")
        print(f"  Validación de Skill: {report['skill_name']}")
        print(f"  Ruta: {report['skill_path']}")
        print(f"==================================================")
        if report["valid"]:
            print("  [OK] La skill cumple con el estándar de Antigravity.")
        else:
            print("  [FALLO] Se encontraron errores críticos:")
            for err in report["errors"]:
                print(f"    - ERROR: {err}")

        if report["warnings"]:
            print("\n  Advertencias de optimización:")
            for warn in report["warnings"]:
                print(f"    - AVISO: {warn}")
        print("==================================================\n")

    sys.exit(0 if report["valid"] else 1)

if __name__ == "__main__":
    main()
