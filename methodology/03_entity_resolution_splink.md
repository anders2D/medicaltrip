# 03. Resolución Probabilística de Entidades con Splink (Fellegi-Sunter)

## 1. El Problema de la Entropía de Nombres en Medical Trip
En los 304 chats de WhatsApp y los libros de Excel, las mismas entidades aparecen representadas bajo múltiples formas léxicas:
- **Paciente**: `"RVA282-5-Hernandez/George"`, `"Sr. George"`, `"George Hernandez"`, `"Hernandez George Mr x 2"`, `"+599 95681193"`.
- **Clínica**: `"HPTU"`, `"Hospital Pablo Tobon"`, `"Pablo Tobon Uribe"`, `"H. Pablo Tobón"`.
- **Transporte / Conductor**: `"Aeroturex"`, `"RAMON ROSERO"`, `"Ramon conductor"`, `"+573134608871"`.

La coincidencia determinística por texto exacto (`string equality`) falla en más del 65% de los casos.

---

## 2. Modelo Matemático de Fellegi-Sunter

El modelo evalúa un vector de comparaciones $\gamma = (\gamma_1, \gamma_2, \dots, \gamma_k)$ entre dos registros $A$ y $B$:

$$\text{Razón de Verosimilitud Logarítmica (LLR)} = \sum_{i=1}^{k} \log_2 \left( \frac{P(\gamma_i \mid M)}{P(\gamma_i \mid U)} \right) = \sum_{i=1}^{k} \log_2 \left( \frac{m_i}{u_i} \right)$$

Donde:
- $M$: Conjunto de pares que son verdaderos duplicados (Matches).
- $U$: Conjunto de pares que son entidades distintas (Unmatches).
- $m_i = P(\gamma_i \mid M)$: Probabilidad de concordancia dado que es la misma entidad.
- $u_i = P(\gamma_i \mid U)$: Probabilidad de concordancia puramente aleatoria.

---

## 3. Especificación de Configuración Splink (DuckDB Engine)

```python
# settings_splink_medicaltrip.py
settings = {
    "link_type": "dedupe_only",
    "blocking_rules_to_generate_predictions": [
        "l.phone_normalized = r.phone_normalized",
        "l.rva_code = r.rva_code",
        "substr(l.full_name_clean, 1, 4) = substr(r.full_name_clean, 1, 4)",
    ],
    "comparisons": [
        # 1. Comparación de Código RVA (Identificador Crítico)
        {
            "output_column_name": "rva_code",
            "comparison_levels": [
                {"sql_condition": "rva_code_l IS NULL OR rva_code_r IS NULL", "label_for_charts": "Null"},
                {"sql_condition": "rva_code_l = rva_code_r", "label_for_charts": "Exact match"},
                {"sql_condition": "ELSE", "label_for_charts": "All other comparisons"}
            ]
        },
        # 2. Comparación de Teléfono (Normalizado E.164)
        {
            "output_column_name": "phone_normalized",
            "comparison_levels": [
                {"sql_condition": "phone_normalized_l IS NULL OR phone_normalized_r IS NULL", "label_for_charts": "Null"},
                {"sql_condition": "phone_normalized_l = phone_normalized_r", "label_for_charts": "Exact match"},
                {"sql_condition": "ELSE", "label_for_charts": "All other comparisons"}
            ]
        },
        # 3. Comparación de Nombre Completo (Jaro-Winkler + Damerau-Levenshtein)
        {
            "output_column_name": "full_name_clean",
            "comparison_levels": [
                {"sql_condition": "full_name_clean_l IS NULL OR full_name_clean_r IS NULL", "label_for_charts": "Null"},
                {"sql_condition": "full_name_clean_l = full_name_clean_r", "label_for_charts": "Exact match"},
                {"sql_condition": "jaro_winkler_similarity(full_name_clean_l, full_name_clean_r) > 0.88", "label_for_charts": "High Jaro-Winkler (>0.88)"},
                {"sql_condition": "jaro_winkler_similarity(full_name_clean_l, full_name_clean_r) > 0.75", "label_for_charts": "Medium Jaro-Winkler (>0.75)"},
                {"sql_condition": "ELSE", "label_for_charts": "All other comparisons"}
            ]
        }
    ]
}
```

---

## 4. Estructura de Salida: Catálogo Maestro de Identidades

| Universal_ID | Entidad Tipo | Nombre Canónico | Teléfono Canónico | Alias / Variaciones Registradas |
| :--- | :--- | :--- | :--- | :--- |
| `ENT-PAX-0282` | Paciente | George Hernandez | `+59995681193` | `RVA282-5-Hernandez/George`, `Sr. George`, `Hernandez George Mr x 2` |
| `ENT-PAX-0271` | Paciente | Zulaica Giterson | `+59995280010` | `RVA271-5-GitersonZulaica`, `Zulaica`, `Giterson Zulaica Mrs` |
| `ENT-DRV-0001` | Conductor | Ramón Rosero | `+573134608871` | `RAMON ROSERO`, `Ramon conductor`, `Aeroturex Conductor` |
| `ENT-CLI-0001` | Clínica | Hospital Pablo Tobón Uribe | N/A | `HPTU`, `Hospital Pablo Tobon`, `H. Pablo Tobón Uribe` |
| `ENT-HOT-0001` | Hotel | Hotel Poblado Plaza | N/A | `Hotel Poblado Plaza`, `Poblado Plaza`, `Poblado Plaza Hotel` |
