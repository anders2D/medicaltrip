#!/usr/bin/env python3
"""
Scaffolder Inteligente de Skills para Google Antigravity.
Genera paquetes completos a partir de arquetipos probados (SOP, CodeAct, Hardened CLI, MCP),
reemplaza metadatos y auto-valida la integridad del paquete resultante.
"""

import sys
import os
import re
import shutil
import argparse
from pathlib import Path
from typing import Dict, Any

# Importar validador local
try:
    from validate_skill import SkillValidator
except ImportError:
    # Si se ejecuta desde otra ruta
    script_dir = Path(__file__).parent.resolve()
    sys.path.insert(0, str(script_dir))
    from validate_skill import SkillValidator

ARCHETYPES = {
    "procedural_sop": "Procedural / SOP (Runbooks, políticas, listas de verificación)",
    "codeact_repl": "CodeAct REPL (Procesamiento in-memory y APIs sin context bloat)",
    "hardened_cli": "Hardened CLI (Automatización terminal segura con aislamiento y timeouts)",
    "mcp_service": "Servicio MCP (Herramientas estructuradas vía Model Context Protocol)"
}

def get_default_dest(name: str, scope: str) -> Path:
    """Calcula la ruta de destino según el ámbito."""
    if scope == "global":
        home = Path.home()
        # Ruta global de Google Antigravity
        return home / ".gemini" / "config" / "skills" / name
    else:
        # Ámbito de Workspace local
        return Path(".agents") / "skills" / name

def scaffold(name: str, description: str, archetype: str, dest: Path) -> Dict[str, Any]:
    """Crea la estructura de la skill a partir del arquetipo."""
    base_dir = Path(__file__).parent.parent.resolve()
    template_dir = base_dir / "templates" / archetype

    if not template_dir.exists():
        raise FileNotFoundError(f"No se encontró la plantilla para el arquetipo '{archetype}' en {template_dir}")

    # Normalizar nombre
    clean_name = name.lower().strip().replace("_", "-")
    title = " ".join(word.capitalize() for word in clean_name.split("-"))

    if not description:
        description = f"Use this skill when the user asks to perform tasks related to {title}."

    # Crear directorio destino
    dest = dest.resolve()
    if dest.exists():
        raise FileExistsError(f"El directorio destino ya existe: {dest}. Especifique otra ruta o elimínelo primero.")

    dest.mkdir(parents=True, exist_ok=True)

    # Copiar recursivamente la plantilla
    for root, dirs, files in os.walk(template_dir):
        rel_root = Path(root).relative_to(template_dir)
        target_root = dest / rel_root
        target_root.mkdir(parents=True, exist_ok=True)

        for file in files:
            src_file = Path(root) / file
            dst_file = target_root / file

            # Leer y reemplazar placeholders
            try:
                content = src_file.read_text(encoding="utf-8")
                content = content.replace("{{SKILL_NAME}}", clean_name)
                content = content.replace("{{SKILL_DESCRIPTION}}", description)
                content = content.replace("{{SKILL_TITLE}}", title)
                content = content.replace("{{WORKFLOW_NAME}}", title)
                dst_file.write_text(content, encoding="utf-8")
            except Exception:
                # Archivo binario o sin texto
                shutil.copy2(src_file, dst_file)

    # Ejecutar validación automática sobre el paquete generado
    validator = SkillValidator(dest)
    validation_report = validator.validate()

    return {
        "success": validation_report["valid"],
        "name": clean_name,
        "archetype": archetype,
        "path": str(dest),
        "validation": validation_report
    }

def main():
    parser = argparse.ArgumentParser(description="Scaffolder Maestro de Skills para Antigravity.")
    parser.add_argument("--name", "-n", required=True, help="Identificador de la skill en kebab-case (ej. git-cleaner).")
    parser.add_argument("--description", "-d", default="", help="Descripción del disparador (cuándo y qué hace).")
    parser.add_argument("--archetype", "-a", choices=list(ARCHETYPES.keys()), default="procedural_sop",
                        help="Arquetipo técnico de la skill.")
    parser.add_argument("--scope", "-s", choices=["workspace", "global"], default="workspace",
                        help="Ámbito de despliegue: 'workspace' (.agents/skills/) o 'global' (~/.gemini/config/skills/).")
    parser.add_argument("--dest", help="Ruta personalizada de salida (sobrescribe --scope).")

    args = parser.parse_args()

    dest_path = Path(args.dest) if args.dest else get_default_dest(args.name, args.scope)

    print(f"\n==================================================")
    print(f"  Scaffolding Skill: {args.name}")
    print(f"  Arquetipo: {ARCHETYPES[args.archetype]}")
    print(f"  Destino: {dest_path}")
    print(f"==================================================")

    try:
        result = scaffold(args.name, args.description, args.archetype, dest_path)
        print(f"\n[EXITO] Skill '{args.name}' generada correctamente.")
        print(f"Ubicación: {result['path']}")
        
        if result["validation"]["warnings"]:
            print("\nSugerencias del Linter:")
            for w in result["validation"]["warnings"]:
                print(f"  - {w}")

        print(f"\nPara activarla en Antigravity, mencione una instrucción afín a su descripción.")
        print(f"==================================================\n")
    except Exception as e:
        print(f"\n[ERROR] Falló la generación de la skill: {e}\n", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
