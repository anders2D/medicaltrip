# Especificación del Ecosistema Google Antigravity

Documento de referencia técnica sobre rutas de descubrimiento, precedencia y directivas de configuración en Google Antigravity.

## Ámbitos y Rutas de Descubrimiento

| Ámbito | Ubicación en Disco | Propósito |
| :--- | :--- | :--- |
| **Workspace (Proyecto)** | `.agents/skills/<nombre>/` (o `.agent/skills/`) | Vinculado al repositorio; se comparte con el equipo vía Git. |
| **Global (Usuario/Máquina)** | `~/.gemini/config/skills/<nombre>/` | Disponible en cualquier sesión o proyecto del desarrollador. |
| **Built-in (Sistema)** | `<appDataDir>/builtin/skills/<nombre>/` | Habilidades integradas de fábrica por Antigravity. |

## Jerarquía y Precedencia de Carga
Cuando existe colisión de nombres entre skills, Antigravity resuelve en el siguiente orden estricto (mayor a menor prioridad):
1. **Workspace Project:** `.agents/skills/` (sobreescribe cualquier versión global).
2. **Configuraciones Declaradas en Workspace:** Listadas explícitamente en `skills.json`.
3. **Global Discovery:** `~/.gemini/config/skills/`.
4. **Built-in Customizations:** Habilidades empaquetadas por defecto.
5. **Global Declared Configurations:** Listadas en `~/.gemini/config/skills.json`.

## Requisitos Formales de `SKILL.md`
- **Frontmatter YAML obligatorio:**
  ```yaml
  ---
  name: identificador-kebab-case
  description: Descripción precisa en tercera persona sobre cuándo y qué realiza la skill.
  ---
  ```
- **Carpetas estándar reconocidas:**
  - `scripts/`: Herramientas ejecutables de soporte.
  - `references/`: Manuales y documentación complementaria bajo demanda.
  - `examples/`: Ejemplos representativos (few-shot golden pairs).
  - `resources/`: Plantillas y recursos estáticos.
